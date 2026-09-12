"use strict";

/*
 * ShyneTyme.Works STBLE — BLE transport and logical-device core.
 *
 * FILE ROLE
 * ---------
 * This file is the single owner for:
 *   - Web Bluetooth discovery/permission/GATT connection state.
 *   - BLE command serialization and group fan-out.
 *   - Reading/parsing firmware STATUS.
 *   - Browser-side logical devices, groups, target selection, and BLE binding.
 *   - Device configuration writes that are part of the verified V5.1 contract.
 *
 * This file DOES NOT own:
 *   - Effect catalogs or effect-role presentation.
 *   - Color picker rendering.
 *   - Preset/Sequence UI.
 *   - Page/tab rendering.
 * Those belong to st-ble-ui.js.
 *
 * IMPORTANT INVARIANTS
 * --------------------
 * 1. The active firmware contract is ST_BT_V5_1_MAIN.ino / VER=51.
 * 2. The picker is filtered by the ShyneTyme service UUID; do not restore
 *    acceptAllDevices while the firmware advertises the verified service.
 * 3. Group writes are successful only when EVERY requested member is connected
 *    and EVERY member write succeeds.
 * 4. Manual picker/GATT work pauses ordinary sends through manualConnectBusy.
 * 5. Startup remains manual: autoConnect() is exported for controlled callers,
 *    but this file intentionally does not invoke it on page load.
 * 6. Browser localStorage here stores logical app metadata. It is not a claim
 *    that those records live in ESP32 NVS.
 */

/* ========================================================================== */
/* 1. FIRMWARE UUIDS / BROWSER STORAGE KEYS                                   */
/* ========================================================================== */

// These UUIDs must remain byte-for-byte aligned with ST_BT_V5_1_MAIN.ino.
const STW_SERVICE_UUID = "78170001-7a32-4b19-913a-5354594d4501";
const STW_COMMAND_UUID = "78170002-7a32-4b19-913a-5354594d4501";
const STW_STATUS_UUID = "78170003-7a32-4b19-913a-5354594d4501";

// Browser-side logical controller metadata. Clearing site data clears these.
const STW_DEVICE_KEY = "stw-esp32-devices-v4";
const STW_GROUP_KEY = "stw-esp32-groups-v1";
const STW_TARGET_KEY = "stw-esp32-target-v2";

const enc = new TextEncoder();
const dec = new TextDecoder();

// Values used only when the browser does not yet have a stored logical config.
const DEFAULT_CONFIG = Object.freeze({
  leds: 300,
  gpio: 13,
  order: "GRB",
  segFrom: 0,
  segTo: 299,
  startupFx: "RAINBOW",
});

/* ========================================================================== */
/* 2. SMALL GENERIC HELPERS                                                   */
/* ========================================================================== */

const clone = (value) => JSON.parse(JSON.stringify(value));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const uid = (prefix) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function loadJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch (_) {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {
    // Storage failures must not crash BLE control. UI persistence may be lost.
  }
}

/* ========================================================================== */
/* 3. LOGICAL DEVICE / GROUP STATE                                            */
/* ========================================================================== */

function newLogicalDevice(name) {
  return {
    id: uid("dev"),
    name,
    bluetoothId: null,
    bluetoothName: "",
    config: clone(DEFAULT_CONFIG),
    lastFx: "RAINBOW",
    powered: true,
  };
}

// Normalization lets old browser records gain newer fields without migration code.
function normalizeDevice(device, index) {
  return {
    id: device?.id || uid("dev"),
    name: device?.name || `ESP32 ${index + 1}`,
    bluetoothId: device?.bluetoothId || null,
    bluetoothName: device?.bluetoothName || "",
    config: { ...clone(DEFAULT_CONFIG), ...(device?.config || {}) },
    lastFx: device?.lastFx || "RAINBOW",
    powered: device?.powered !== false,
  };
}

let devices = (loadJSON(STW_DEVICE_KEY, []) || []).map(normalizeDevice);
if (!devices.length) {
  devices = [newLogicalDevice("ESP32 1"), newLogicalDevice("ESP32 2")];
}

let groups = (loadJSON(STW_GROUP_KEY, []) || []).map((group) => ({
  id: group.id || uid("grp"),
  name: group.name || "Group",
  members: Array.isArray(group.members) ? group.members : [],
}));

let target = loadJSON(STW_TARGET_KEY, null);

// Browser-granted BluetoothDevice objects are runtime-only and cannot be JSON saved.
let granted = new Map();

// Serializes GATT connection attempts so two devices do not fight the adapter.
let connectLock = Promise.resolve();

// Retained for the exported autoConnect path. Startup currently never schedules it.
let autoConnectTimer = 0;
let manualBluetoothEpoch = 0;
let userInteracted = false;
let manualConnectBusy = false;

// Runtime GATT objects are deliberately separated from serializable device metadata.
const runtimes = new Map();

function runtime(id) {
  if (!runtimes.has(id)) {
    runtimes.set(id, {
      bt: null,
      server: null,
      cmd: null,
      st: null,
      status: "idle",
      queue: Promise.resolve(),
      lastStatus: {},
      disconnectHandler: null,
      error: "",
      auto: false,
    });
  }
  return runtimes.get(id);
}

devices.forEach((device) => runtime(device.id));

function saveDevices() {
  saveJSON(STW_DEVICE_KEY, devices);
}

function saveGroups() {
  saveJSON(STW_GROUP_KEY, groups);
}

function saveTarget() {
  saveJSON(STW_TARGET_KEY, target);
}

function deviceById(id) {
  return devices.find((device) => device.id === id) || null;
}

function groupById(id) {
  return groups.find((group) => group.id === id) || null;
}

function connected(id) {
  const state = runtime(id);
  return state.status === "connected" && !!state.cmd;
}

/* ========================================================================== */
/* 4. ASYNC SAFETY / COMMAND PACKET HELPERS                                   */
/* ========================================================================== */

function withConnectLock(task) {
  const pending = connectLock.then(task, task);
  // Keep the lock chain alive even when one connection attempt fails.
  connectLock = pending.catch(() => {});
  return pending;
}

function waitFor(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(label)), ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/*
 * The V5.1 command language is ASCII key=value pairs separated by semicolons.
 * Keeping chunks at <=18 characters avoids depending on a larger negotiated BLE
 * payload. Each chunk remains an independently valid firmware command fragment.
 */
function chunks(text) {
  const parts = String(text || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  const out = [];
  let current = "";

  for (const part of parts) {
    const next = current ? `${current};${part}` : part;
    if (next.length <= 18) {
      current = next;
    } else {
      if (current) out.push(current);
      current = part;
    }
  }

  if (current) out.push(current);
  return out;
}

/* ========================================================================== */
/* 5. SNAPSHOT / EVENT BUS                                                    */
/* ========================================================================== */

/*
 * UI code never reads mutable core collections directly. snapshot() exposes a
 * serializable view, while CustomEvent keeps all rendering event-driven.
 */
function emit(type = "state", extra = {}) {
  document.dispatchEvent(
    new CustomEvent("stw:ble", {
      detail: { type, ...snapshot(), ...extra },
    }),
  );
}

function targetMemberIds() {
  if (!target) return [];

  if (target.type === "device") {
    return deviceById(target.id) ? [target.id] : [];
  }

  if (target.type === "group") {
    const group = groupById(target.id);
    return group ? group.members.filter((id) => deviceById(id)) : [];
  }

  return [];
}

/*
 * passkey means "the active target is valid for gated UI operations".
 * A group is intentionally invalid with fewer than two members.
 */
function hasPasskey() {
  const ids = targetMemberIds();
  if (!ids.length) return false;
  if (target?.type === "group" && ids.length < 2) return false;
  return ids.every(connected);
}

function targetLabel() {
  if (!target) return "NONE";

  if (target.type === "device") {
    return deviceById(target.id)?.name || "NONE";
  }

  const group = groupById(target.id);
  if (!group) return "NONE";

  return (
    group.members
      .map((id) => deviceById(id)?.name)
      .filter(Boolean)
      .join("🔗") || group.name
  );
}

function snapshot() {
  return {
    devices: devices.map((device) => {
      const state = runtime(device.id);
      return {
        ...clone(device),
        bleStatus: device.bluetoothId
          ? state.status === "connected"
            ? "connected"
            : state.status === "connecting"
              ? "connecting"
              : "assigned"
          : "unassigned",
        error: state.error || "",
        lastStatus: { ...state.lastStatus },
      };
    }),
    groups: clone(groups),
    target: target ? clone(target) : null,
    targetLabel: targetLabel(),
    passkey: hasPasskey(),
    granted: [...granted.values()].map((device) => ({
      id: device.id,
      name: device.name || "Bluetooth device",
    })),
    manualConnectBusy,
  };
}

/* ========================================================================== */
/* 6. MANUAL-CONNECTION ARBITRATION                                           */
/* ========================================================================== */

/*
 * Explicit user Bluetooth actions win over any dormant/controlled auto-connect
 * attempt. Epoch invalidation lets an in-flight automatic attempt notice that a
 * newer manual action superseded it.
 */
function beginManualBluetooth() {
  userInteracted = true;
  manualBluetoothEpoch++;

  if (autoConnectTimer) {
    clearTimeout(autoConnectTimer);
    autoConnectTimer = 0;
  }

  for (const state of runtimes.values()) {
    if (state.auto && state.status === "connecting") {
      try {
        state.bt?.gatt?.disconnect();
      } catch (_) {}
      state.status = "assigned";
      state.server = state.cmd = state.st = null;
      state.auto = false;
    }
  }

  // A cancelled automatic attempt must not leave the connection lock poisoned.
  connectLock = Promise.resolve();
}

function noteUserInteraction() {
  userInteracted = true;
  const autoBusy = [...runtimes.values()].some(
    (state) => state.auto && state.status === "connecting",
  );

  if (autoConnectTimer || autoBusy) beginManualBluetooth();
}

document.addEventListener("pointerdown", noteUserInteraction, {
  capture: true,
  passive: true,
});
document.addEventListener("keydown", noteUserInteraction, { capture: true });

/* One physical BluetoothDevice may belong to only one logical card at a time. */
function releaseExistingAssignment(btId, keepId) {
  const owner = devices.find(
    (device) => device.id !== keepId && device.bluetoothId === btId,
  );
  if (!owner) return;

  disconnectDevice(owner.id);
  owner.bluetoothId = null;
  owner.bluetoothName = "";
  runtime(owner.id).status = "idle";
  saveDevices();
  emit("reassigned", { deviceId: owner.id });
}

/* ========================================================================== */
/* 7. BLE WRITE PIPELINE / GROUP FAN-OUT                                      */
/* ========================================================================== */

async function writeRaw(id, text, fast = false) {
  const state = runtime(id);
  if (!connected(id)) throw new Error("Device not connected");

  const characteristic = state.cmd;
  const bytes = enc.encode(text);
  const longPacket = bytes.length > 18;
  let operation;

  /*
   * Prefer acknowledged writes for long/config commands. Fast effect/control
   * updates may use write-without-response when the characteristic supports it.
   */
  if (
    longPacket &&
    characteristic.properties?.write &&
    characteristic.writeValueWithResponse
  ) {
    operation = characteristic.writeValueWithResponse(bytes);
  } else if (
    fast &&
    characteristic.properties?.writeWithoutResponse &&
    characteristic.writeValueWithoutResponse
  ) {
    operation = characteristic.writeValueWithoutResponse(bytes);
  } else if (
    characteristic.properties?.write &&
    characteristic.writeValueWithResponse
  ) {
    operation = characteristic.writeValueWithResponse(bytes);
  } else if (characteristic.writeValue) {
    operation = characteristic.writeValue(bytes);
  } else if (
    characteristic.properties?.writeWithoutResponse &&
    characteristic.writeValueWithoutResponse
  ) {
    operation = characteristic.writeValueWithoutResponse(bytes);
  } else {
    throw new Error("No BLE write method");
  }

  await waitFor(
    operation,
    longPacket ? 2400 : 1800,
    "Bluetooth write timed out",
  );
}

/* Per-device queue prevents overlapping GATT writes on the same characteristic. */
function queueWrite(id, text, fast = false) {
  const state = runtime(id);

  const run = async () => {
    for (const part of chunks(text)) {
      await writeRaw(id, part, fast);
    }
    return true;
  };

  state.queue = state.queue.then(run, run).catch((error) => {
    state.error = error.message;
    emit("tx-error", { deviceId: id, message: error.message });
    return false;
  });

  return state.queue;
}

/*
 * Group invariant: never report success for a partial target. Every requested
 * logical member must be connected, and every queued write must return true.
 */
async function sendToIds(ids, text, { fast = false } = {}) {
  if (manualConnectBusy) return false;

  const requested = [...new Set(ids)];
  const active = requested.filter(connected);
  if (!active.length || active.length !== requested.length) return false;

  const result = await Promise.all(
    active.map((id) => queueWrite(id, text, fast)),
  );
  return result.every(Boolean);
}

async function sendToTarget(text, opts = {}) {
  return sendToIds(targetMemberIds(), text, opts);
}

async function sendToDevice(id, text, opts = {}) {
  return sendToIds([id], text, opts);
}

/* ========================================================================== */
/* 8. STATUS READBACK                                                         */
/* ========================================================================== */

function parseStatus(text) {
  const status = {};

  for (const part of String(text || "").split(";")) {
    const separator = part.indexOf("=");
    if (separator > 0) {
      status[part.slice(0, separator)] = part.slice(separator + 1);
    }
  }

  return status;
}

/*
 * STATUS is both a device-truth read and a reconciliation point. Verified
 * hardware fields are copied back into the logical browser record so UI forms
 * reflect the controller instead of blindly trusting stale localStorage.
 */
async function readStatus(id) {
  const state = runtime(id);
  if (!connected(id) || !state.st) return null;

  try {
    await queueWrite(id, "STATUS");
    await sleep(100);

    const value = await waitFor(
      state.st.readValue(),
      1800,
      "Status read timed out",
    );
    const status = parseStatus(dec.decode(value));

    state.lastStatus = { ...state.lastStatus, ...status };

    const device = deviceById(id);
    if (device) {
      if (status.CFGLEDS || status.LEDS) {
        device.config.leds =
          +(status.CFGLEDS || status.LEDS) || device.config.leds;
      }
      if (status.CFGPIN || status.PIN) {
        device.config.gpio = +(status.CFGPIN || status.PIN);
      }
      if (status.ORDER) device.config.order = status.ORDER;
      if (status.FX) device.lastFx = status.FX;
      saveDevices();
    }

    emit("status", { deviceId: id, status });
    return status;
  } catch (error) {
    state.error = error.message;
    emit("status-error", { deviceId: id, message: error.message });
    return null;
  }
}

/* ========================================================================== */
/* 9. BROWSER-GRANTED DEVICES / GATT CONNECTION                              */
/* ========================================================================== */

/*
 * getDevices() returns devices for which this origin still has permission.
 * It does not show a picker and does not guarantee the device is in range.
 */
async function refreshGranted() {
  granted.clear();

  if (!navigator.bluetooth?.getDevices) {
    emit("granted");
    return [];
  }

  try {
    const list = await navigator.bluetooth.getDevices();
    for (const device of list) granted.set(device.id, device);
    emit("granted");
    return list;
  } catch (error) {
    emit("granted-error", { message: error.message });
    return [];
  }
}

function attachDisconnect(id, bt) {
  const state = runtime(id);

  if (state.disconnectHandler) {
    try {
      bt.removeEventListener(
        "gattserverdisconnected",
        state.disconnectHandler,
      );
    } catch (_) {}
  }

  state.disconnectHandler = () => {
    state.status = "assigned";
    state.server = state.cmd = state.st = null;
    state.queue = Promise.resolve();
    state.auto = false;
    emit("disconnected", { deviceId: id });
  };

  bt.addEventListener("gattserverdisconnected", state.disconnectHandler);
}

async function openGatt(bt, { auto = false } = {}) {
  if (bt.gatt?.connected) return bt.gatt;

  let lastError;
  const attempts = auto ? 1 : 2;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      await sleep(attempt ? 320 : 100);
      return await waitFor(
        bt.gatt.connect(),
        auto ? 3000 : 4500,
        "Bluetooth connection timed out",
      );
    } catch (error) {
      lastError = error;
      try {
        bt.gatt?.disconnect();
      } catch (_) {}
    }
  }

  throw lastError || new Error("Bluetooth connection failed");
}

/*
 * Connects a logical card to a previously granted physical device. The epoch
 * checks exist only for the controlled auto path; explicit manual connects are
 * not cancelled by userInteracted.
 */
async function connectAssigned(
  id,
  { auto = false, epoch = manualBluetoothEpoch } = {},
) {
  if (!auto) beginManualBluetooth();

  const device = deviceById(id);
  const state = runtime(id);

  if (!device?.bluetoothId) throw new Error("No Bluetooth device assigned");
  if (connected(id)) return true;
  if (auto && (userInteracted || epoch !== manualBluetoothEpoch)) return false;

  let bt = granted.get(device.bluetoothId);
  if (!bt) {
    await refreshGranted();
    bt = granted.get(device.bluetoothId);
  }

  if (!bt) {
    state.status = "assigned";
    state.error = "Bluetooth permission is not available for this saved device";
    emit("connect-missing", { deviceId: id });
    return false;
  }

  state.bt = bt;
  state.status = "connecting";
  state.auto = auto;
  state.error = "";
  emit("connecting", { deviceId: id, auto });

  try {
    await withConnectLock(async () => {
      if (auto && (userInteracted || epoch !== manualBluetoothEpoch)) {
        throw new Error("Auto reconnect cancelled");
      }

      attachDisconnect(id, bt);
      state.server = await openGatt(bt, { auto });

      if (auto && (userInteracted || epoch !== manualBluetoothEpoch)) {
        throw new Error("Auto reconnect cancelled");
      }

      const service = await waitFor(
        state.server.getPrimaryService(STW_SERVICE_UUID),
        auto ? 2200 : 3200,
        "ShyneTyme BLE service not found",
      );

      state.cmd = await waitFor(
        service.getCharacteristic(STW_COMMAND_UUID),
        auto ? 1800 : 2400,
        "Control characteristic not found",
      );

      state.st = await waitFor(
        service.getCharacteristic(STW_STATUS_UUID),
        auto ? 1800 : 2400,
        "Status characteristic not found",
      );
    });

    state.status = "connected";
    state.auto = false;
    device.bluetoothName = bt.name || device.bluetoothName;
    saveDevices();
    emit("connected", { deviceId: id, auto });
    return true;
  } catch (error) {
    state.status = "assigned";
    state.auto = false;
    state.error =
      error.message === "Auto reconnect cancelled" ? "" : error.message;

    try {
      state.server?.disconnect();
    } catch (_) {}

    state.server = state.cmd = state.st = null;

    if (error.message !== "Auto reconnect cancelled") {
      emit("connect-error", { deviceId: id, message: error.message });
    }
    return false;
  }
}

/*
 * Public compatibility helper for selecting a device already granted to this
 * origin. The current UI does not expose it as a separate ASSIGN control.
 */
async function assignGranted(id, btId) {
  beginManualBluetooth();

  const device = deviceById(id);
  if (!device) throw new Error("Unknown device");

  await refreshGranted();
  const bt = granted.get(btId);
  if (!bt) throw new Error("That Bluetooth device is not granted to this page");

  releaseExistingAssignment(bt.id, id);
  device.bluetoothId = bt.id;
  device.bluetoothName = bt.name || "Bluetooth device";
  saveDevices();
  emit("assigned", { deviceId: id });

  return connectAssigned(id);
}

/*
 * Current user-facing connection path. The service filter keeps unrelated BLE
 * devices out of the chooser when they do not advertise ShyneTyme's service.
 */
async function assignNew(id) {
  if (manualConnectBusy) {
    throw new Error("Bluetooth connection already in progress");
  }

  beginManualBluetooth();

  if (!navigator.bluetooth) {
    throw new Error("Web Bluetooth is not available");
  }
  if (!window.isSecureContext) {
    throw new Error("HTTPS is required for Bluetooth");
  }

  manualConnectBusy = true;
  emit("manual-connect-start", { deviceId: id });

  try {
    const bt = await navigator.bluetooth.requestDevice({
      filters: [{ services: [STW_SERVICE_UUID] }],
    });

    granted.set(bt.id, bt);

    const device = deviceById(id);
    if (!device) throw new Error("Unknown device");

    releaseExistingAssignment(bt.id, id);
    device.bluetoothId = bt.id;
    device.bluetoothName = bt.name || "ShyneTyme ESP32";
    saveDevices();
    emit("assigned", { deviceId: id });

    return await connectAssigned(id);
  } finally {
    manualConnectBusy = false;
    emit("manual-connect-end", { deviceId: id });
  }
}

/*
 * Exported controlled auto-connect helper. It is intentionally dormant unless
 * an explicit caller invokes it; queueMicrotask at the bottom emits ready only.
 */
async function autoConnect() {
  if (userInteracted || document.visibilityState !== "visible") return false;

  const epoch = manualBluetoothEpoch;
  await refreshGranted();

  if (
    userInteracted ||
    document.visibilityState !== "visible" ||
    epoch !== manualBluetoothEpoch
  ) {
    return false;
  }

  let ids = targetMemberIds();
  if (!ids.length) {
    const first = devices.find(
      (device) => device.bluetoothId && granted.has(device.bluetoothId),
    );
    ids = first ? [first.id] : [];
  }

  for (const id of ids) {
    if (userInteracted || epoch !== manualBluetoothEpoch) break;
    const device = deviceById(id);
    if (device?.bluetoothId && granted.has(device.bluetoothId)) {
      await connectAssigned(id, { auto: true, epoch });
    }
  }

  if (userInteracted || epoch !== manualBluetoothEpoch) return false;

  if (!target) {
    const first = devices.find((device) => connected(device.id));
    if (first) target = { type: "device", id: first.id };
  }

  saveTarget();
  emit("autoconnect-complete");
  return true;
}

function disconnectDevice(id) {
  const state = runtime(id);

  try {
    state.server?.disconnect();
  } catch (_) {}

  state.status = deviceById(id)?.bluetoothId ? "assigned" : "unassigned";
  state.auto = false;
  state.server = state.cmd = state.st = null;
  state.queue = Promise.resolve();
  emit("disconnected", { deviceId: id });
}

/* ========================================================================== */
/* 10. TARGET / LOGICAL DEVICE / GROUP MUTATIONS                              */
/* ========================================================================== */

function selectDevice(id) {
  if (!deviceById(id)) return false;
  target = { type: "device", id };
  saveTarget();
  emit("target");
  return true;
}

function selectGroup(id) {
  const group = groupById(id);
  if (!group) return false;
  target = { type: "group", id };
  saveTarget();
  emit("target");
  return true;
}

function clearTarget() {
  target = null;
  saveTarget();
  emit("target");
}

function addLogicalDevice(name) {
  const device = newLogicalDevice(
    (name || `ESP32 ${devices.length + 1}`).trim() ||
      `ESP32 ${devices.length + 1}`,
  );

  devices.push(device);
  runtime(device.id);
  saveDevices();
  emit("devices");
  return device.id;
}

function removeLogicalDevice(id) {
  const device = deviceById(id);
  if (!device) return false;

  disconnectDevice(id);
  devices = devices.filter((item) => item.id !== id);
  groups = groups
    .map((group) => ({
      ...group,
      members: group.members.filter((memberId) => memberId !== id),
    }))
    .filter((group) => group.members.length);

  if (target?.type === "device" && target.id === id) target = null;
  if (target?.type === "group" && !groupById(target.id)) target = null;

  saveDevices();
  saveGroups();
  saveTarget();
  emit("devices");
  return true;
}

/* Browser display alias only; V5.1 firmware has no persistent NAME command. */
function renameDevice(id, name) {
  const device = deviceById(id);
  if (!device) return false;

  device.name = (name || "").trim() || device.name;
  saveDevices();
  emit("devices");
  return true;
}

function unassignBluetooth(id) {
  beginManualBluetooth();

  const device = deviceById(id);
  if (!device) return false;

  disconnectDevice(id);
  device.bluetoothId = null;
  device.bluetoothName = "";
  runtime(id).status = "idle";
  saveDevices();

  if (target?.type === "device" && target.id === id) clearTarget();

  emit("unassigned", { deviceId: id });
  return true;
}

function createGroup(name) {
  const clean = (name || "").trim();
  if (!clean) throw new Error("Group name required");

  const group = {
    id: uid("grp"),
    name: clean,
    members: [],
  };

  groups.push(group);
  saveGroups();
  emit("groups");
  return group.id;
}

function renameGroup(id, name) {
  const group = groupById(id);
  if (!group) return false;

  group.name = (name || "").trim() || group.name;
  saveGroups();
  emit("groups");
  return true;
}

/*
 * Two or more checked members immediately make the group the active target.
 * Dropping below two clears it if that group was active.
 */
function setGroupMembers(id, members) {
  const group = groupById(id);
  if (!group) return false;

  group.members = [...new Set(members)].filter((memberId) =>
    deviceById(memberId),
  );
  saveGroups();

  if (group.members.length >= 2) {
    target = { type: "group", id };
    saveTarget();
  } else if (target?.type === "group" && target.id === id) {
    target = null;
    saveTarget();
  }

  emit("groups");
  return true;
}

function deleteGroup(id) {
  groups = groups.filter((group) => group.id !== id);
  if (target?.type === "group" && target.id === id) target = null;
  saveGroups();
  saveTarget();
  emit("groups");
  return true;
}

/* ========================================================================== */
/* 11. VERIFIED V5.1 CONFIG / STARTUP / POWER OPERATIONS                      */
/* ========================================================================== */

function validateConfig(config) {
  if (
    !Number.isFinite(config.leds) ||
    config.leds < 1 ||
    config.leds > 600
  ) {
    return "LED count must be 1–600";
  }

  if (
    !Number.isFinite(config.gpio) ||
    config.gpio < 0 ||
    config.gpio > 39
  ) {
    return "GPIO must be 0–39";
  }

  if (!["RGB", "GRB", "BRG", "GBR", "RBG", "BGR"].includes(config.order)) {
    return "Invalid pixel order";
  }

  /* segFrom/segTo are browser-side only in V5.1, but still must be coherent. */
  if (
    config.segFrom < 0 ||
    config.segTo < config.segFrom ||
    config.segTo >= config.leds
  ) {
    return `Effect range must stay inside 0–${config.leds - 1}`;
  }

  return "";
}

/*
 * LEDS/PIN/ORDER/SAVE are firmware-owned. segFrom/segTo/startupFx remain in the
 * logical browser record because V5.1 has no segment-bound configuration API.
 */
async function saveDeviceConfig(id, cfg, { reboot = false } = {}) {
  const device = deviceById(id);
  if (!device) throw new Error("Select one device");

  const config = {
    ...device.config,
    ...cfg,
    leds: +cfg.leds,
    gpio: +cfg.gpio,
    segFrom: +cfg.segFrom,
    segTo: +cfg.segTo,
  };

  const error = validateConfig(config);
  if (error) throw new Error(error);
  if (!connected(id)) throw new Error("Selected device is not connected");

  await sendToDevice(
    id,
    `LEDS=${config.leds};PIN=${config.gpio};ORDER=${config.order};SAVE`,
  );

  if (reboot) await sendToDevice(id, "REBOOT");

  device.config = config;
  saveDevices();
  emit("config", { deviceId: id });
  return true;
}

/*
 * Save a different startup effect without leaving the live strip permanently on
 * that effect: apply -> SAVE to NVS -> restore the previous live effect.
 */
async function saveStartup(id, startupCommand, restoreCommand, startupFx) {
  const device = deviceById(id);
  if (!device || !connected(id)) {
    throw new Error("Selected device is not connected");
  }

  await sendToDevice(id, startupCommand);
  await sendToDevice(id, "SAVE");

  if (restoreCommand && restoreCommand !== startupCommand) {
    await sendToDevice(id, restoreCommand);
  }

  device.config.startupFx = startupFx;
  saveDevices();
  emit("config", { deviceId: id });
  return true;
}

/* Cache only the last effect needed by the browser power toggle. */
function setLastFx(fx) {
  for (const id of targetMemberIds()) {
    const device = deviceById(id);
    if (device) {
      device.lastFx = fx;
      device.powered = fx !== "OFF";
    }
  }

  saveDevices();
  emit("effect");
}

/*
 * The power button is an effect-level convenience, not hardware power control.
 * OFF blacks out LEDs; turning back on restores the browser's last known effect.
 */
async function togglePower(id) {
  const device = deviceById(id);
  if (!device || !connected(id)) return false;

  if (device.powered) {
    await sendToDevice(id, "FX=OFF");
    device.powered = false;
  } else {
    await sendToDevice(
      id,
      `FX=${
        device.lastFx && device.lastFx !== "OFF"
          ? device.lastFx
          : "RAINBOW"
      }`,
    );
    device.powered = true;
  }

  saveDevices();
  emit("power", { deviceId: id });
  return device.powered;
}

/* ========================================================================== */
/* 12. PUBLIC API                                                             */
/* ========================================================================== */

/*
 * Keep this surface stable: st-ble-ui.js and developer/debug callers consume
 * these methods. Dormant helpers remain exported unless explicitly retired.
 */
window.STWBLE = {
  snapshot,
  refreshGranted,
  assignGranted,
  assignNew,
  connectAssigned,
  disconnectDevice,
  unassignBluetooth,
  selectDevice,
  selectGroup,
  clearTarget,
  addLogicalDevice,
  removeLogicalDevice,
  renameDevice,
  createGroup,
  renameGroup,
  setGroupMembers,
  deleteGroup,
  send: sendToTarget,
  sendToDevice,
  readStatus,
  saveDeviceConfig,
  saveStartup,
  setLastFx,
  togglePower,
  targetMemberIds,
  hasPasskey,
  autoConnect,
};

/*
 * Startup contract: announce readiness only. Do NOT auto-open GATT or trigger a
 * browser chooser on page load; all user-facing connection actions stay manual.
 */
queueMicrotask(() => emit("ready"));
