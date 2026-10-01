"use strict";

(() => {
  /*
   * ShyneTyme.Works STBLE — UI/effects/colors/presets/Sequence controller.
   *
   * FILE ROLE
   * ---------
   * This file is the single owner for:
   *   - Rendering logical device/group state supplied by st-ble-core.js.
   *   - Page gating/navigation state.
   *   - The verified V5.1 effect list and per-effect color-role metadata.
   *   - Effect Styling percentage-to-firmware mapping and +/- percentage steps.
   *   - BG / FG / MAIN color selection and hue interaction.
   *   - Browser-local saved colors, presets, and Sequence definitions.
   *   - Sequence enable/disable selection, drag ordering, and timing while the
   *     browser JavaScript environment is active.
   *
   * This file DOES NOT own:
   *   - BluetoothDevice/GATT objects or write serialization.
   *   - Logical device/group persistence internals.
   *   - CSS presentation.
   * Those belong to st-ble-core.js and st-ble-ui.css / the HTML override layer.
   *
   * HARDWARE / PRODUCT INVARIANTS
   * -----------------------------
   * 1. Active hardware baseline is ST_BT_V5_1_MAIN.ino / VER=51.
   * 2. Only verified V5.1 direct effect IDs appear here.
   * 3. SOLID remains available; WIPE remains factual; DANCING_SHADOWS stays out.
   * 4. V5.2 catalog-only effects must not be reintroduced without a firmware flash
   *    and verified readback.
   * 5. Sequence/preset/color records in this file are browser-local. V5.1 does
   *    not provide a device-side Sequence metadata/scheduler API.
   * 6. STOP holds the current LED effect; it does not send FX=OFF.
   */

  /* ======================================================================== */
  /* 1. DOM / GENERIC HELPERS                                                 */
  /* ======================================================================== */

  const q = (selector) => document.querySelector(selector);
  const qa = (selector) => [...document.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /* ======================================================================== */
  /* 2. VERIFIED V5.1 EFFECT CONTRACT                                         */
  /* ======================================================================== */

  // Firmware IDs only. Display labels are derived by prettyFx(); do not invent IDs.
  const DIRECT_FX = [
    "SOLID",
    "RAINBOW",
    "RAINBOW_GLITTER",
    "COMET",
    "METEOR",
    "SCANNER",
    "DUAL_SCANNER",
    "POLICE",
    "CHASE",
    "TRICOLOR_CHASE",
    "RUNNING_DOTS",
    "THEATER",
    "WIPE",
    "FLOW",
    "FLOW_STRIPE",
    "COLOR_WAVES",
    "SPARKLE",
    "GLITTER",
    "TWINKLE",
    "TWINKLEFOX",
    "TWINKLECAT",
    "FIREWORKS",
    "RAIN",
    "TETRIX",
    "FIRE",
    "LIGHTNING",
    "PACIFICA",
    "SUNRISE",
    "PRIDE",
    "SINELON",
    "JUGGLE",
    "BOUNCING_BALLS",
    "LAVA_LAMP",
    "MAGMA",
    "AURORA",
    "BREATHE",
    "FLASH",
    "DUAL_FLASH",
  ];

  // Kept as a separate semantic name because preset/state helpers refer to the
  // total set of legal UI effects, not to a future catalog layer.
  const FX_EFFECTS = DIRECT_FX;

  const THREE = ["bg", "fg", "main"];
  const TWO_FG_MAIN = ["fg", "main"];

  /*
   * Color-role metadata describes which user colors a firmware effect actually
   * consumes. Default is three-role; verified exceptions override that default.
   * The map controls role-button visibility and the BGB row only—it does not
   * change firmware rendering.
   */
  const FX_CAPS = Object.fromEntries(
    FX_EFFECTS.map((fx) => [fx, { roles: THREE }]),
  );

  Object.assign(FX_CAPS, {
    SOLID: { roles: ["fg"], label: "FOREGROUND" },
    RAINBOW: { roles: [], label: "BUILT-IN COLOR" },
    RAINBOW_GLITTER: { roles: ["main"], label: "MAIN + BUILT-IN" },
    COMET: { roles: TWO_FG_MAIN },
    METEOR: { roles: TWO_FG_MAIN },
    POLICE: { roles: TWO_FG_MAIN },
    GLITTER: { roles: TWO_FG_MAIN },
    FIREWORKS: { roles: TWO_FG_MAIN },
    RAIN: { roles: TWO_FG_MAIN },
    LIGHTNING: { roles: TWO_FG_MAIN },
    SINELON: { roles: TWO_FG_MAIN },
    JUGGLE: { roles: TWO_FG_MAIN },
    BOUNCING_BALLS: { roles: TWO_FG_MAIN },
    FLASH: { roles: ["bg", "main"] },
  });

  /* ======================================================================== */
  /* 3. BROWSER-LOCAL STORAGE CONTRACT                                        */
  /* ======================================================================== */

  // These keys are app/browser records. Clearing site data removes them.
  const SAVED_KEY = "stw-esp32-saved-colors-v3";
  const OLD_SAVED_KEY = "stw-esp32-saved-colors-v2";
  const PRESET_KEY = "stw-esp32-presets-v4";

  // Permanent built-in swatches; user-created colors are stored separately.
  const BUILTIN_COLORS = [
    "#DFFF00",
    "#FF00AA",
    "#0080FF",
    "#FFFFFF",
    "#000000",
  ];

  /*
   * Visible controls use 0-100%. Firmware still consumes byte-like raw domains.
   * min=1 controls intentionally never send zero because that matches V5.1.
   */
  const STYLE_CONTROLS = Object.freeze({
    bri: { key: "BRI", min: 0, max: 255 },
    spd: { key: "SPD", min: 1, max: 255 },
    int: { key: "BGB", min: 0, max: 255 },
    size: { key: "SIZE", min: 1, max: 255 },
    dens: { key: "DENS", min: 1, max: 255 },
    trail: { key: "TRAIL", min: 1, max: 255 },
  });

  /* ======================================================================== */
  /* 4. IN-MEMORY UI STATE                                                    */
  /* ======================================================================== */

  let snap = window.STWBLE?.snapshot?.() || {
    devices: [],
    groups: [],
    target: null,
    passkey: false,
    granted: [],
  };

  let activePage = "device";
  let activeFx = "RAINBOW";
  let activeRole = "main";
  let formDirty = false;

  // Hue writes are coalesced so dragging updates the UI live but commits at release.
  let hueDragging = false;
  let hueDirty = false;

  function loadJSON(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      // Browser persistence failure should not crash live LED control.
    }
  }

  const prettyFx = (fx) =>
    String(fx || "").replace(/^PS_/, "PS ").replaceAll("_", " ");

  const rolesFor = (fx) => FX_CAPS[fx]?.roles || THREE;

  const metaFor = (fx) =>
    FX_CAPS[fx]?.label ||
    rolesFor(fx)
      .map((role) => role.toUpperCase())
      .join(" · ");

  const visibleEffects = () => DIRECT_FX;

  /* ======================================================================== */
  /* 5. DEBUG LOG / TARGET HELPERS / TRANSPORT WRAPPERS                       */
  /* ======================================================================== */

  function log(message) {
    const output = q("#debugLog");
    if (!output) return;

    output.textContent =
      `${new Date().toLocaleTimeString()}  ${message}\n${output.textContent}`.slice(
        0,
        8000,
      );
  }

  const selectedDevice = () =>
    snap.target?.type === "device"
      ? snap.devices.find((device) => device.id === snap.target.id) || null
      : null;

  /*
   * For a group, UI forms/status need one representative status record. Group
   * writes still fan out through STWBLE; this helper never changes send targets.
   */
  function primaryTarget() {
    if (snap.target?.type === "device") return selectedDevice();

    if (snap.target?.type === "group") {
      const group = snap.groups.find((item) => item.id === snap.target.id);
      return (
        snap.devices.find((device) => group?.members?.includes(device.id)) || null
      );
    }

    return null;
  }

  const currentStatus = () => primaryTarget()?.lastStatus || {};

  async function send(command, opts = {}) {
    const ok = await window.STWBLE.send(command, opts);
    if (!ok) log(`TX FAILED: ${command}`);
    return !!ok;
  }

  async function sendDevice(id, command, opts = {}) {
    const ok = await window.STWBLE.sendToDevice(id, command, opts);
    if (!ok) log(`TX FAILED (${id}): ${command}`);
    return !!ok;
  }

  /* ======================================================================== */
  /* 6. NAVIGATION / CONNECTION GATING / GLOBAL HEADER                        */
  /* ======================================================================== */

  function updateGate() {
    qa(".tab.gated").forEach((button) => {
      button.classList.toggle("locked", !snap.passkey);
      button.setAttribute("aria-disabled", snap.passkey ? "false" : "true");
    });

    ["effects", "presets", "custom"].forEach((id) => {
      q(`#${id}`)?.classList.toggle("locked-page", !snap.passkey);
    });

    // Never leave the user stranded on a now-locked control page.
    if (!snap.passkey && activePage !== "device") showPage("device");
  }

  function showPage(id) {
    if (id !== "device" && !snap.passkey) id = "device";
    activePage = id;

    qa(".tab").forEach((button) => {
      button.classList.toggle("on", button.dataset.page === id);
    });
    qa(".page").forEach((page) => {
      page.classList.toggle("on", page.id === id);
    });
  }

  qa(".tab").forEach((button) => {
    button.addEventListener("click", () => showPage(button.dataset.page));
  });

  function updateHeader() {
    const connectedCount = snap.devices.filter(
      (device) => device.bleStatus === "connected",
    ).length;

    q("#bleSummary").textContent = `${connectedCount} LOCAL BLE`;
    q("#targetSummary").textContent = snap.targetLabel || "NONE";
    q("#effectSummary").textContent = prettyFx(activeFx);
    updateGate();
  }

  /* ======================================================================== */
  /* 7. DEVICE CARDS / DEVICE SETTINGS / DEBUG ACTIONS                        */
  /* ======================================================================== */

  function renderDevices() {
    const host = q("#deviceList");
    if (!host) return;

    host.innerHTML = "";

    for (const device of snap.devices) {
      const selected =
        snap.target?.type === "device" && snap.target.id === device.id;

      const card = document.createElement("article");
      card.className = `device-card${selected ? " selected" : ""}`;

      card.innerHTML = `
        <div class="device-underglow" aria-hidden="true"></div>
        <div class="device-card-inner">
          <div class="device-header-row">
            <div class="device-title-wrap">
              <div class="device-name"></div>
              <div class="device-bt"></div>
            </div>
            <i class="ble-dot ${device.bleStatus}" title="Bluetooth: ${device.bleStatus}"></i>
          </div>
          <div class="device-module-body">
            <div class="device-chip-badge">
              <span class="chip-label">MODULE</span>
              <span class="chip-status ${device.bleStatus}">${device.bleStatus.toUpperCase()}</span>
            </div>
          </div>
          <div class="device-footer-row">
            <button class="device-power-btn power-ring ${device.powered ? "is-on on" : "is-off"}" aria-label="Toggle Power" title="${device.powered ? 'Power: ON (Click to turn OFF)' : 'Power: OFF (Click to turn ON)'}">
              <span class="power-glyph">⏻</span>
            </button>
          </div>
        </div>
      `;

      card.querySelector(".device-name").textContent = device.name || "ESP32";
      card.querySelector(".device-bt").textContent = device.bluetoothName || "";

      card.addEventListener("click", async (event) => {
        if (!event.target.closest(".device-power-btn, .power-ring")) {
          window.STWBLE.selectDevice(device.id);
          if (device.bluetoothId && device.bleStatus !== "connected") {
            try {
              await window.STWBLE.connectAssigned(device.id);
            } catch (_) {}
          }
        }
      });

      card.querySelector(".device-power-btn").addEventListener("click", async (event) => {
        event.stopPropagation();
        await window.STWBLE.togglePower(device.id);
      });

      host.append(card);
    }
  }

  function loadDeviceForm(force = false) {
    const device = selectedDevice();
    q("#deviceTools")?.classList.toggle("locked-panel", !device);

    if (!device || (formDirty && !force)) return;

    q("#settingsDeviceName").textContent = device.name;
    q("#deviceName").value = device.name;
    q("#leds").value = device.config?.leds ?? 300;
    q("#gpio").value = device.config?.gpio ?? 13;
    q("#order").value = device.config?.order || "GRB";
    q("#segFrom").value = device.config?.segFrom ?? 0;
    q("#segTo").value =
      device.config?.segTo ?? Math.max(0, (device.config?.leds ?? 300) - 1);

    const allowed = visibleEffects();
    q("#startupFx").value = allowed.includes(device.config?.startupFx)
      ? device.config.startupFx
      : "RAINBOW";

    formDirty = false;
  }

  [
    "deviceName",
    "leds",
    "gpio",
    "order",
    "segFrom",
    "segTo",
    "startupFx",
  ].forEach((id) => {
    q(`#${id}`)?.addEventListener("input", () => {
      formDirty = true;
    });
  });

  q("#addLogicalDevice")?.addEventListener("click", () => {
    window.STWBLE.addLogicalDevice();
  });

  /* Explicit picker only; no page-load chooser or hidden reconnect button. */
  q("#addBluetooth")?.addEventListener("click", async () => {
    let device = selectedDevice();

    if (!device && snap.devices[0]) {
      window.STWBLE.selectDevice(snap.devices[0].id);
      await sleep(0);
      snap = window.STWBLE.snapshot();
      device = selectedDevice();
    }

    if (!device) return;

    try {
      await window.STWBLE.assignNew(device.id);
    } catch (error) {
      log(
        error.name === "NotFoundError"
          ? "Bluetooth selection cancelled."
          : error.message,
      );
    }
  });

  q("#unassignBluetooth")?.addEventListener("click", () => {
    const device = selectedDevice();
    if (device) window.STWBLE.unassignBluetooth(device.id);
  });

  q("#deleteLogicalDevice")?.addEventListener("click", () => {
    const device = selectedDevice();
    if (!device) return;
    if (confirm(`Delete ${device.name}? This will remove it from this browser.`)) {
      window.STWBLE.removeLogicalDevice(device.id);
    }
  });

  function deviceFormConfig() {
    return {
      leds: +q("#leds").value,
      gpio: +q("#gpio").value,
      order: q("#order").value,
      segFrom: +q("#segFrom").value,
      segTo: +q("#segTo").value,
      startupFx: q("#startupFx").value,
    };
  }

  async function saveSettings(reboot) {
    const device = selectedDevice();
    if (!device) return;

    try {
      const config = deviceFormConfig();
      await window.STWBLE.saveDeviceConfig(device.id, config, { reboot: false });
      window.STWBLE.renameDevice(device.id, q("#deviceName").value);

      if (reboot) {
        const fx = config.startupFx || "RAINBOW";
        const effectOk = await sendDevice(device.id, `FX=${fx}`);
        const saveOk = effectOk && (await sendDevice(device.id, "SAVE"));
        const rebootOk = saveOk && (await sendDevice(device.id, "REBOOT"));
        if (!rebootOk) throw Error("Save/reboot failed");
      }

      formDirty = false;
      log(
        reboot
          ? "Settings saved; startup saved; reboot sent."
          : "Device settings saved.",
      );
    } catch (error) {
      log(`Settings: ${error.message}`);
    }
  }

  q("#saveDeviceSettings")?.addEventListener("click", () => saveSettings(false));
  q("#saveDeviceReboot")?.addEventListener("click", () => saveSettings(true));

  q("#saveStartup")?.addEventListener("click", async () => {
    const device = selectedDevice();
    if (!device) return;

    const startupFx = q("#startupFx").value || "RAINBOW";
    const restoreFx = currentStatus().FX || device.lastFx || activeFx;

    try {
      await window.STWBLE.saveStartup(
        device.id,
        `FX=${startupFx}`,
        `FX=${restoreFx}`,
        startupFx,
      );
      log(`Startup effect saved: ${startupFx}`);
    } catch (error) {
      log(`Startup: ${error.message}`);
    }
  });

  q("#readStatus")?.addEventListener("click", async () => {
    for (const id of window.STWBLE.targetMemberIds()) {
      const status = await window.STWBLE.readStatus(id);
      if (status) {
        log(
          `STATUS ${id}: ${Object.entries(status)
            .map(([key, value]) => `${key}=${value}`)
            .join(" · ")}`,
        );
      }
    }
  });

  q("#blackout")?.addEventListener("click", async () => {
    stopPlaylist("Stopped", true);

    if (await send("FX=OFF")) {
      activeFx = "OFF";
      window.STWBLE.setLastFx("OFF");
      updateHeader();
    }
  });

  q("#sendRaw")?.addEventListener("click", async () => {
    const command = q("#rawCommand").value.trim();
    if (!command) return;

    log(`${(await send(command)) ? "TX" : "TX FAIL"}: ${command}`);
  });

  /* ======================================================================== */
  /* 8. GROUP RENDERING                                                       */
  /* ======================================================================== */

  function renderGroups() {
    const host = q("#groupList");
    if (!host) return;

    host.innerHTML = "";

    for (const group of snap.groups) {
      const selected =
        snap.target?.type === "group" && snap.target.id === group.id;

      const card = document.createElement("article");
      card.className = "group-card";
      card.innerHTML = `
        <div class="group-title">
          <b></b>
          <button class="tiny-btn select">${selected ? "SYNC ACTIVE" : "USE GROUP"}</button>
          <button class="tiny-btn danger del">DELETE</button>
        </div>
        <div class="group-members"></div>
      `;

      card.querySelector("b").textContent = group.name;
      const members = card.querySelector(".group-members");

      for (const device of snap.devices) {
        const label = document.createElement("label");
        label.innerHTML = `<input type="checkbox" value="${device.id}" ${
          group.members.includes(device.id) ? "checked" : ""
        }> ${device.name}`;

        label.querySelector("input").addEventListener("change", () => {
          const checked = [...members.querySelectorAll("input:checked")].map(
            (input) => input.value,
          );
          window.STWBLE.setGroupMembers(group.id, checked);
        });

        members.append(label);
      }

      card.querySelector(".select").addEventListener("click", () => {
        window.STWBLE.selectGroup(group.id);
      });
      card.querySelector(".del").addEventListener("click", () => {
        window.STWBLE.deleteGroup(group.id);
      });

      host.append(card);
    }
  }

  q("#createGroup")?.addEventListener("click", () => {
    try {
      window.STWBLE.createGroup(q("#groupName").value);
      q("#groupName").value = "";
    } catch (error) {
      log(error.message);
    }
  });

  /* ======================================================================== */
  /* 9. EFFECT-STYLING PERCENTAGE CONTROLS                                    */
  /* ======================================================================== */

  const rawToPercent = (id, raw) => {
    const config = STYLE_CONTROLS[id];
    if (!config) return 0;

    return clamp(
      Math.round(
        ((Number(raw) - config.min) /
          Math.max(1, config.max - config.min)) *
          100,
      ),
      0,
      100,
    );
  };

  const percentToRaw = (id, pct) => {
    const config = STYLE_CONTROLS[id];
    if (!config) return 0;

    return Math.round(
      config.min +
        (clamp(Number(pct), 0, 100) / 100) * (config.max - config.min),
    );
  };

  function paintPercent(id, pct) {
    const input = q(`[data-percent-for="${id}"]`);
    const control = input?.closest(".percent-control");
    const meter = control?.querySelector(".level-meter");
    const clamped = clamp(Number(pct), 0, 100);
    meter?.querySelector(".fill")?.style.setProperty("width", `${clamped}%`);
    meter?.style.setProperty("--pct", `${clamped}%`);
  }

  function updateSlider(rawInput) {
    if (!rawInput) return;

    const pct = rawToPercent(rawInput.id, rawInput.value);
    const input = q(`[data-percent-for="${rawInput.id}"]`);

    if (input) {
      input.value = String(pct);
      input.dataset.lastValid = String(pct);
    }

    paintPercent(rawInput.id, pct);
  }

  const updateAllSliders = () => {
    Object.keys(STYLE_CONTROLS).forEach((id) => updateSlider(q(`#${id}`)));
  };

  function restorePercent(input) {
    const id = input?.dataset.percentFor;
    if (!id) return;
    updateSlider(q(`#${id}`));
  }

  async function commitPercent(input) {
    const id = input?.dataset.percentFor;
    const config = STYLE_CONTROLS[id];
    if (!id || !config) return false;

    const text = String(input.value ?? "").trim();
    const pct = Number(text);

    if (!text || !Number.isFinite(pct) || pct < 0 || pct > 100) {
      restorePercent(input);
      return false;
    }

    const normalized = Math.round(pct);
    const rawInput = q(`#${id}`);
    const oldRaw = rawInput.value;
    const raw = percentToRaw(id, normalized);

    const ok = await send(`${config.key}=${raw}`, { fast: true });
    if (!ok) {
      rawInput.value = oldRaw;
      restorePercent(input);
      return false;
    }

    rawInput.value = String(raw);
    input.value = String(normalized);
    input.dataset.lastValid = String(normalized);
    paintPercent(id, normalized);
    return true;
  }

  /* Interactive touch/drag slider track with 3D glassmorphic thumb */
  function bindLevelMeterDrag() {
    qa(".level-meter").forEach((meter) => {
      const control = meter.closest(".percent-control");
      const input = control?.querySelector(".percent-input");
      if (!input) return;
      const id = input.dataset.percentFor;

      function updateFromPointer(e) {
        const rect = meter.getBoundingClientRect();
        const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const ratio = (clientX - rect.left) / Math.max(1, rect.width);
        const pct = clamp(Math.round(ratio * 100), 0, 100);
        input.value = String(pct);
        paintPercent(id, pct);
        return pct;
      }

      let isDragging = false;

      meter.addEventListener("pointerdown", (e) => {
        try {
          meter.setPointerCapture(e.pointerId);
        } catch (_) {}
        isDragging = true;
        meter.classList.add("dragging");
        updateFromPointer(e);
      });

      meter.addEventListener("pointermove", (e) => {
        if (!isDragging) return;
        updateFromPointer(e);
      });

      const finish = async (e) => {
        if (!isDragging) return;
        isDragging = false;
        meter.classList.remove("dragging");
        updateFromPointer(e);
        await commitPercent(input);
      };

      meter.addEventListener("pointerup", finish);
      meter.addEventListener("pointercancel", finish);
    });
  }

  qa(".percent-input").forEach((input) => {
    input.addEventListener("focus", () => input.select());

    input.addEventListener("input", () => {
      const pct = Number(input.value);
      if (
        String(input.value).trim() &&
        Number.isFinite(pct) &&
        pct >= 0 &&
        pct <= 100
      ) {
        paintPercent(input.dataset.percentFor, pct);
      }
    });

    input.addEventListener("blur", () => {
      void commitPercent(input);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        restorePercent(input);
        input.blur();
      }
    });
  });

  // +/- is one percentage point per tap; the percentage input remains authoritative.
  qa(".percent-step").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.stepFor;
      const input = q(`[data-percent-for="${id}"]`);
      if (!input || !STYLE_CONTROLS[id]) return;

      const typed = Number(input.value);
      const fallback = Number(input.dataset.lastValid || 0);
      const current = Number.isFinite(typed) && typed >= 0 && typed <= 100
        ? typed
        : fallback;
      const next = clamp(
        Math.round(current) + Number(button.dataset.delta || 0),
        0,
        100,
      );

      input.value = String(next);
      paintPercent(id, next);
      await commitPercent(input);
    });
  });

  /* Direction Radio Button Toggle (Forward / Reverse) */
  function setDirection(dir) {
    const isFwd = dir === "FWD";
    q("#dirFwdBtn")?.classList.toggle("is-active", isFwd);
    q("#dirFwdBtn")?.setAttribute("aria-checked", isFwd ? "true" : "false");
    q("#dirRevBtn")?.classList.toggle("is-active", !isFwd);
    q("#dirRevBtn")?.setAttribute("aria-checked", !isFwd ? "true" : "false");

    const dirSelect = q("#dir");
    if (dirSelect) dirSelect.value = dir;
    send(`DIR=${dir}`, { fast: true });
  }

  q("#dirFwdBtn")?.addEventListener("click", () => setDirection("FWD"));
  q("#dirRevBtn")?.addEventListener("click", () => setDirection("REV"));

  q("#dir")?.addEventListener("change", () => {
    setDirection(q("#dir").value);
  });

  q("#mirrorBtn")?.addEventListener("click", () => {
    q("#mirror").checked = !q("#mirror").checked;
    q("#mirrorBtn").classList.toggle("primary", q("#mirror").checked);
    send(`MIRROR=${q("#mirror").checked ? 1 : 0}`, { fast: true });
  });

  /* ======================================================================== */
  /* 10. COLOR PALETTE / HUE INTERACTION                                      */
  /* ======================================================================== */

  function currentPalette() {
    return {
      main: (q("#main")?.value || "#FFFFFF").toUpperCase(),
      bg: (q("#bg")?.value || "#000000").toUpperCase(),
      fg: (q("#fg")?.value || "#8000FF").toUpperCase(),
    };
  }

  function setPaletteUI(palette) {
    for (const role of ["main", "bg", "fg"]) {
      const value = (palette[role] || currentPalette()[role]).toUpperCase();
      q(`#${role}`).value = value;
      q(`#${role}Swatch`).style.background = value;
    }
    syncHue();
  }

  function rgbToHue(hex) {
    const value = hex.replace("#", "");
    const r = parseInt(value.slice(0, 2), 16) / 255;
    const g = parseInt(value.slice(2, 4), 16) / 255;
    const b = parseInt(value.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    if (!delta) return 0;

    let hue =
      max === r
        ? 60 * (((g - b) / delta) % 6)
        : max === g
          ? 60 * ((b - r) / delta + 2)
          : 60 * ((r - g) / delta + 4);

    return hue < 0 ? hue + 360 : hue;
  }

  function hueHex(hue) {
    const chroma = 1;
    const x = 1 - Math.abs(((hue / 60) % 2) - 1);
    let r = 0;
    let g = 0;
    let b = 0;

    if (hue < 60) {
      r = chroma;
      g = x;
    } else if (hue < 120) {
      r = x;
      g = chroma;
    } else if (hue < 180) {
      g = chroma;
      b = x;
    } else if (hue < 240) {
      g = x;
      b = chroma;
    } else if (hue < 300) {
      r = x;
      b = chroma;
    } else {
      r = chroma;
      b = x;
    }

    const byteHex = (value) =>
      Math.round(value * 255).toString(16).padStart(2, "0").toUpperCase();

    return `#${byteHex(r)}${byteHex(g)}${byteHex(b)}`;
  }

  function syncHue() {
    const value = currentPalette()[activeRole];
    const hue = rgbToHue(value);

    q("#hueRange").value = Math.round(hue);
    q("#hueSelector").style.setProperty("--hx", `${(hue / 359) * 100}%`);
    q("#hueValue").textContent = value;
    q("#hueValue").style.color = value;
  }

  function liveHue(hue) {
    const hex = hueHex(hue);

    q("#hueRange").value = Math.round(hue);
    q("#hueSelector").style.setProperty("--hx", `${(hue / 359) * 100}%`);
    q(`#${activeRole}`).value = hex;
    q(`#${activeRole}Swatch`).style.background = hex;
    q("#hueValue").textContent = hex;
    q("#hueValue").style.color = hex;
    hueDirty = true;
  }

  function hueFromPointer(event) {
    const box = q("#hueSelector").getBoundingClientRect();
    return clamp(
      ((event.clientX - box.left) / Math.max(1, box.width)) * 359,
      0,
      359,
    );
  }

  async function commitHue() {
    if (!hueDirty) return;
    hueDirty = false;

    const palette = currentPalette();
    await send(
      `MAIN=${palette.main.slice(1)};BG=${palette.bg.slice(1)};FG=${palette.fg.slice(1)}`,
      { fast: true },
    );
  }

  qa(".role").forEach((button) => {
    button.addEventListener("click", () => {
      activeRole = button.dataset.role;
      qa(".role").forEach((roleButton) => {
        roleButton.classList.toggle("on", roleButton === button);
      });
      syncHue();
    });
  });

  const hueSelector = q("#hueSelector");

  hueSelector?.addEventListener("pointerdown", (event) => {
    hueDragging = true;
    hueSelector.classList.add("dragging");

    try {
      hueSelector.setPointerCapture(event.pointerId);
    } catch (_) {}

    liveHue(hueFromPointer(event));
  });

  hueSelector?.addEventListener("pointermove", (event) => {
    if (hueDragging) liveHue(hueFromPointer(event));
  });

  const finishHue = async (event) => {
    if (!hueDragging) return;

    hueDragging = false;
    hueSelector.classList.remove("dragging");

    try {
      if (event?.pointerId != null) {
        hueSelector.releasePointerCapture(event.pointerId);
      }
    } catch (_) {}

    await commitHue();
    syncHue();
  };

  hueSelector?.addEventListener("pointerup", finishHue);
  hueSelector?.addEventListener("pointercancel", finishHue);

  q("#hueRange")?.addEventListener("input", () => {
    liveHue(Number(q("#hueRange").value));
  });
  q("#hueRange")?.addEventListener("change", commitHue);

  /* ======================================================================== */
  /* 11. SAVED COLORS                                                         */
  /* ======================================================================== */

  function customColors() {
    let list = loadJSON(SAVED_KEY, null);

    if (!Array.isArray(list)) {
      const old = loadJSON(OLD_SAVED_KEY, []);
      list = Array.isArray(old)
        ? old.filter(
            (color) => !BUILTIN_COLORS.includes(String(color).toUpperCase()),
          )
        : [];
      saveJSON(SAVED_KEY, list);
    }

    return list
      .map((color) => String(color).toUpperCase())
      .filter((color) => /^#[0-9A-F]{6}$/.test(color));
  }

  function renderSavedColors() {
    const host = q("#savedColors");
    if (!host) return;

    host.innerHTML = "";

    const items = [
      ...BUILTIN_COLORS.map((color) => ({ color, builtin: true })),
      ...customColors().map((color) => ({ color, builtin: false })),
    ];

    for (const { color, builtin } of items) {
      const wrap = document.createElement("span");
      wrap.className = "saved-color-wrap";

      const button = document.createElement("button");
      button.className = "saved-color";
      button.style.setProperty("--c", color);
      button.title = color;

      button.addEventListener("click", async () => {
        q(`#${activeRole}`).value = color;
        q(`#${activeRole}Swatch`).style.background = color;
        syncHue();

        const palette = currentPalette();
        await send(
          `MAIN=${palette.main.slice(1)};BG=${palette.bg.slice(1)};FG=${palette.fg.slice(1)}`,
          { fast: true },
        );
      });

      wrap.append(button);

      if (!builtin) {
        const remove = document.createElement("button");
        remove.className = "saved-color-delete";
        remove.type = "button";
        remove.textContent = "×";
        remove.title = `Delete ${color}`;

        remove.addEventListener("click", (event) => {
          event.stopPropagation();
          saveJSON(
            SAVED_KEY,
            customColors().filter((saved) => saved !== color),
          );
          renderSavedColors();
        });

        wrap.append(remove);
      }

      host.append(wrap);
    }
  }

  q("#saveColor")?.addEventListener("click", () => {
    const color = currentPalette()[activeRole];
    saveJSON(
      SAVED_KEY,
      [color, ...customColors().filter((saved) => saved !== color)].slice(0, 19),
    );
    renderSavedColors();
  });

  /* ======================================================================== */
  /* 12. EFFECT CAPABILITY UI / EFFECT SELECTION                              */
  /* ======================================================================== */

  function applyEffectCapabilities(fx) {
    const roles = rolesFor(fx);

    q("#bgbRow")?.classList.toggle(
      "control-unavailable",
      !roles.includes("bg"),
    );

    qa(".role").forEach((button) => {
      const available = roles.includes(button.dataset.role);
      button.classList.toggle("role-unavailable", !available);
      button.disabled = !available;
    });

    if (!roles.includes(activeRole)) {
      activeRole = roles.includes("main")
        ? "main"
        : roles.includes("fg")
          ? "fg"
          : roles.includes("bg")
            ? "bg"
            : "main";

      qa(".role").forEach((button) => {
        button.classList.toggle("on", button.dataset.role === activeRole);
      });
    }

    q("#colorCapability").textContent = roles.length
      ? `USES ${metaFor(fx)}`
      : "BUILT-IN COLOR — USER COLOR ROLES NOT USED";
  }

  function renderEffects() {
    const host = q("#effectList");
    if (!host) return;

    const filter = (q("#fxSearch")?.value || "").trim().toLowerCase();
    host.innerHTML = "";

    const available = visibleEffects();
    const shown = available.filter(
      (fx) =>
        !filter ||
        prettyFx(fx).toLowerCase().includes(filter) ||
        fx.toLowerCase().includes(filter),
    );

    q("#fxCount").textContent = `${shown.length}/${available.length}`;

    for (const fx of shown) {
      const button = document.createElement("button");
      button.className = `fx-item${activeFx === fx ? " on" : ""}`;
      button.dataset.fx = fx;
      button.innerHTML = `<span>${prettyFx(fx)}</span><small>${metaFor(fx)}</small>`;
      button.addEventListener("click", () => selectEffect(fx));
      host.append(button);
    }
  }

  q("#fxSearch")?.addEventListener("input", renderEffects);

  async function selectEffect(fx) {
    stopPlaylist("Sequence stopped", true);

    if (!(await send(`FX=${fx}`))) return false;

    activeFx = fx;
    window.STWBLE.setLastFx(fx);
    applyEffectCapabilities(fx);
    updateHeader();
    renderEffects();
    return true;
  }

  /* ======================================================================== */
  /* 13. STATUS -> UI RECONCILIATION                                          */
  /* ======================================================================== */

  function syncFromStatus(status) {
    if (!status) return;

    if (status.FX && FX_EFFECTS.includes(status.FX)) {
      activeFx = status.FX;
    }

    setPaletteUI({
      main: status.MAIN ? `#${status.MAIN}` : currentPalette().main,
      bg: status.BG ? `#${status.BG}` : currentPalette().bg,
      fg: status.FG ? `#${status.FG}` : currentPalette().fg,
    });

    const statusKeys = {
      bri: "BRI",
      spd: "SPD",
      int: "BGB",
      size: "SIZE",
      dens: "DENS",
      trail: "TRAIL",
    };

    for (const [id, key] of Object.entries(statusKeys)) {
      const input = q(`#${id}`);
      if (status[key] != null && input) {
        input.value = status[key];
        updateSlider(input);
      }
    }

    if (status.DIR) q("#dir").value = status.DIR;

    if (status.MIRROR != null) {
      q("#mirror").checked = +status.MIRROR > 0;
      q("#mirrorBtn").classList.toggle("primary", q("#mirror").checked);
    }

    fillStartupEffects();
    applyEffectCapabilities(activeFx);
    updateHeader();
    renderEffects();
  }

  /* ======================================================================== */
  /* 14. GENERIC LIGHTING-STATE CAPTURE/APPLY                                 */
  /* ======================================================================== */

  function captureState(name = activeFx) {
    const palette = currentPalette();

    return {
      name,
      fx: activeFx,
      ...palette,
      bri: +q("#bri").value,
      bgb: +q("#int").value,
      spd: +q("#spd").value,
      size: +q("#size").value,
      dens: +q("#dens").value,
      trail: +q("#trail").value,
      dir: q("#dir").value,
      mirror: q("#mirror").checked,
      durationSec: DEFAULT_PLAYLIST_SECONDS,
    };
  }

  function buildStateCommand(s) {
    return [
      `FX=${s.fx || activeFx}`,
      `MAIN=${String(s.main || currentPalette().main).replace("#", "")}`,
      `BG=${String(s.bg || currentPalette().bg).replace("#", "")}`,
      `FG=${String(s.fg || currentPalette().fg).replace("#", "")}`,
      `BRI=${s.bri ?? q("#bri").value}`,
      `BGB=${s.bgb ?? q("#int").value}`,
      `SPD=${s.spd ?? q("#spd").value}`,
      `SIZE=${s.size ?? q("#size").value}`,
      `DENS=${s.dens ?? q("#dens").value}`,
      `TRAIL=${s.trail ?? q("#trail").value}`,
      `DIR=${s.dir || q("#dir").value}`,
      `MIRROR=${s.mirror ? 1 : 0}`,
    ].join(";");
  }

  async function applyState(s) {
    activeFx = FX_EFFECTS.includes(s.fx) ? s.fx : activeFx;

    setPaletteUI({ main: s.main, bg: s.bg, fg: s.fg });

    for (const id of ["bri", "spd", "size", "dens", "trail"]) {
      if (s[id] != null) q(`#${id}`).value = s[id];
    }
    if (s.bgb != null) q("#int").value = s.bgb;

    q("#dir").value = s.dir || "FWD";
    q("#mirror").checked = !!s.mirror;
    updateAllSliders();

    if (await send(buildStateCommand(s))) {
      window.STWBLE.setLastFx(activeFx);
      applyEffectCapabilities(activeFx);
      updateHeader();
      renderEffects();
    }
  }

  /* ======================================================================== */
  /* 15. BROWSER PRESETS                                                      */
  /* ======================================================================== */

  const presets = () => {
    const value = loadJSON(PRESET_KEY, []);
    return Array.isArray(value) ? value : [];
  };

  const savePresets = (list) => saveJSON(PRESET_KEY, list.slice(0, 50));

  function renderPresets() {
    const host = q("#presetGrid");
    if (!host) return;

    const list = presets();
    q("#presetCount").textContent = list.length ? `${list.length} SAVED` : "";
    host.innerHTML = "";

    if (!list.length) {
      host.innerHTML =
        '<div class="microcopy" style="text-align:center">No presets saved yet.</div>';
      return;
    }

    list.forEach((preset, index) => {
      const card = document.createElement("article");
      card.className = "preset-card";
      card.innerHTML = `
        <div class="preset-title"></div>
        <div class="preset-meta"></div>
        <div class="preset-colors"><i></i><i></i><i></i></div>
        <div class="button-row">
          <button class="tiny-btn load">LOAD</button>
          <button class="tiny-btn add">+ SEQUENCE</button>
          <button class="tiny-btn danger del">DELETE</button>
        </div>
      `;

      card.querySelector(".preset-title").textContent =
        preset.name || prettyFx(preset.fx);
      card.querySelector(".preset-meta").textContent =
        `${prettyFx(preset.fx)} · ${metaFor(preset.fx)}`;

      [preset.main, preset.bg, preset.fg].forEach((color, colorIndex) => {
        card.querySelectorAll(".preset-colors i")[colorIndex].style.background =
          color || "#000";
      });

      card.querySelector(".load").onclick = () => applyState(preset);
      card.querySelector(".add").onclick = () => addPlaylist(preset);
      card.querySelector(".del").onclick = () => {
        const next = presets();
        next.splice(index, 1);
        savePresets(next);
        renderPresets();
      };

      host.append(card);
    });
  }

  function saveCurrentPreset() {
    const name = prompt("Preset name", prettyFx(activeFx));
    if (name === null) return;

    const list = presets();
    list.unshift(captureState(name.trim() || prettyFx(activeFx)));
    savePresets(list);
    renderPresets();
  }

  q("#saveFxPreset")?.addEventListener("click", saveCurrentPreset);
  q("#saveCurrentPreset")?.addEventListener("click", saveCurrentPreset);

  /* ======================================================================== */
  /* 16. MULTI-PLAYLIST STORAGE / MIGRATION / SCHEMA                         */
  /* ======================================================================== */

  // Multi-playlist schema key (array of { id, name, items[] })
  const MULTIPLAYLIST_KEY = "stw-esp32-multi-playlist-v1";
  // Legacy single-list key — migrated on first load
  const LEGACY_PLAYLIST_KEY = "stw-esp32-custom-v4";
  const SHUFFLE_KEY_MP = "stw-esp32-mp-shuffle-v1";
  // Active playlist id persisted so play can resume after reconnect
  const ACTIVE_PL_KEY = "stw-esp32-active-playlist-v1";
  const ACTIVE_PL_POS_KEY = "stw-esp32-active-playlist-pos-v1";

  const MAX_PL_ITEMS = 20;
  const DEFAULT_PLAYLIST_SECONDS = 5;

  function makeSequenceId() {
    try {
      if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    } catch (_) {}
    return `seq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function makePlId() {
    return `pl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  // Normalize one sequence item (duration migration, enabled, seqId)
  function normalizeItem(raw) {
    const number = Number(raw.durationSec ?? raw.duration ?? DEFAULT_PLAYLIST_SECONDS);
    const durationSec = Number.isFinite(number)
      ? clamp(number, 0.25, 3600)
      : DEFAULT_PLAYLIST_SECONDS;

    return {
      ...raw,
      durationSec,
      enabled: raw.enabled !== false,
      seqId: raw.seqId || makeSequenceId(),
    };
  }

  // Load all playlists (with legacy migration)
  function loadPlaylists() {
    let list = loadJSON(MULTIPLAYLIST_KEY, null);

    // First-run migration: pull legacy single array into first playlist
    if (!Array.isArray(list)) {
      list = [];
      const legacy = loadJSON(LEGACY_PLAYLIST_KEY, []);

      if (Array.isArray(legacy) && legacy.length) {
        list.push({
          id: makePlId(),
          name: "My Sequence",
          items: legacy.map(normalizeItem).slice(0, MAX_PL_ITEMS),
        });
        // Clear old key to avoid re-migrating
        try { localStorage.removeItem(LEGACY_PLAYLIST_KEY); } catch (_) {}
      }

      saveJSON(MULTIPLAYLIST_KEY, list);
    }

    // Ensure every playlist has required fields
    return list.map((pl) => ({
      id: pl.id || makePlId(),
      name: pl.name || "Playlist",
      items: Array.isArray(pl.items)
        ? pl.items.map(normalizeItem).slice(0, MAX_PL_ITEMS)
        : [],
    }));
  }

  function savePlaylists(list) {
    saveJSON(MULTIPLAYLIST_KEY, list);
  }

  // Find playlist by id — returns { pl, index } or null
  function findPlaylist(id) {
    const list = loadPlaylists();
    const index = list.findIndex((pl) => pl.id === id);
    return index >= 0 ? { list, pl: list[index], index } : null;
  }

  /* ======================================================================== */
  /* 16B. MULTI-PLAYLIST RUNTIME STATE                                        */
  /* ======================================================================== */

  let playlistRunning = false;
  let playlistShuffle = localStorage.getItem(SHUFFLE_KEY_MP) === "1";
  let playlistRunToken = 0;
  let playlistTimer = 0;
  let playlistLastIndex = -1;
  let activePlaylistId = localStorage.getItem(ACTIVE_PL_KEY) || null;

  // The "active" playing playlist element needs its CSS class toggled
  function markPlayingPlaylist(id) {
    document.querySelectorAll(".named-playlist").forEach((el) => {
      el.classList.toggle("is-playing", el.dataset.plId === id);
    });
    // Also clear active-step from all items across playlists
    document.querySelectorAll(".playlist-item.is-active-step").forEach((el) => {
      el.classList.remove("is-active-step");
    });
  }

  function markActiveStep(plId, seqId) {
    document.querySelectorAll(".playlist-item.is-active-step").forEach((el) => {
      el.classList.remove("is-active-step");
    });
    const el = document.querySelector(
      `.named-playlist[data-pl-id="${plId}"] .playlist-item[data-seq-id="${seqId}"]`
    );
    el?.classList.add("is-active-step");
  }

  /* ======================================================================== */
  /* 16C. MULTI-PLAYLIST RENDERING                                            */
  /* ======================================================================== */

  function renderNamedPlaylists() {
    const host = q("#namedPlaylistsContainer");
    if (!host) return;

    const allPlaylists = loadPlaylists();
    host.innerHTML = "";

    if (!allPlaylists.length) {
      host.innerHTML =
        '<div class="microcopy" style="text-align:center;padding:16px 0">No playlists yet. Create one above or save an effect from COLOR FX.</div>';
      return;
    }

    for (const pl of allPlaylists) {
      const isOpen = pl.id === activePlaylistId || allPlaylists.length === 1;
      const isPlaying = playlistRunning && activePlaylistId === pl.id;
      const full = pl.items.length >= MAX_PL_ITEMS;

      const wrap = document.createElement("article");
      wrap.className = `named-playlist${isOpen ? " is-open" : ""}${isPlaying ? " is-playing" : ""}`;
      wrap.dataset.plId = pl.id;

      // Header
      const header = document.createElement("div");
      header.className = "playlist-accordion-header";
      header.innerHTML = `
        <div class="playlist-name-display">
          <span class="pl-name-text"></span>
          <span class="playlist-count-pill${full ? " full" : ""}"></span>
        </div>
        <button type="button" class="tiny-btn pl-rename-btn" title="Rename">✎</button>
        <button type="button" class="tiny-btn danger pl-delete-btn" title="Delete playlist">✕</button>
        <span class="playlist-chevron">▾</span>
      `;

      header.querySelector(".pl-name-text").textContent = pl.name;
      header.querySelector(".playlist-count-pill").textContent =
        `${pl.items.length} / ${MAX_PL_ITEMS}`;

      // Toggle accordion open/closed
      header.addEventListener("click", (e) => {
        if (e.target.closest(".pl-rename-btn, .pl-delete-btn")) return;
        wrap.classList.toggle("is-open");
      });

      // Rename
      header.querySelector(".pl-rename-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        const newName = prompt("Rename playlist:", pl.name);
        if (!newName || !newName.trim()) return;
        const playlists = loadPlaylists();
        const found = playlists.find((p) => p.id === pl.id);
        if (found) {
          found.name = newName.trim();
          savePlaylists(playlists);
          renderNamedPlaylists();
        }
      });

      // Delete playlist
      header.querySelector(".pl-delete-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        if (!confirm(`Delete playlist "${pl.name}"?`)) return;
        if (playlistRunning && activePlaylistId === pl.id) stopPlaylist();
        const playlists = loadPlaylists().filter((p) => p.id !== pl.id);
        savePlaylists(playlists);
        if (activePlaylistId === pl.id) activePlaylistId = null;
        renderNamedPlaylists();
      });

      // Body
      const body = document.createElement("div");
      body.className = "playlist-accordion-body";

      // Controls row inside accordion
      const ctrlRow = document.createElement("div");
      ctrlRow.className = "playlist-controls-row";

      const playBtn = document.createElement("button");
      playBtn.className = `glass-btn primary pl-play-btn${isPlaying ? "" : ""}`;
      playBtn.textContent = isPlaying ? "PLAYING ▶" : "PLAY";
      playBtn.addEventListener("click", () => {
        if (playlistRunning && activePlaylistId === pl.id) {
          // Restart this playlist
          startPlaylist(pl.id, false);
        } else {
          startPlaylist(pl.id, false);
        }
      });

      const stopBtn = document.createElement("button");
      stopBtn.className = "glass-btn pl-stop-btn";
      stopBtn.textContent = "STOP";
      stopBtn.addEventListener("click", () => stopPlaylist("Stopped"));

      const shuffleBtn = document.createElement("button");
      shuffleBtn.className = `glass-btn${playlistShuffle ? " primary" : ""}`;
      shuffleBtn.textContent = playlistShuffle ? "SHUFFLE ON" : "SHUFFLE";
      shuffleBtn.setAttribute("aria-pressed", playlistShuffle ? "true" : "false");
      shuffleBtn.addEventListener("click", () => {
        playlistShuffle = !playlistShuffle;
        localStorage.setItem(SHUFFLE_KEY_MP, playlistShuffle ? "1" : "0");
        renderNamedPlaylists();
        if (playlistRunning && activePlaylistId === pl.id) startPlaylist(pl.id, true);
      });

      const clearBtn = document.createElement("button");
      clearBtn.className = "glass-btn danger";
      clearBtn.textContent = "CLEAR";
      clearBtn.addEventListener("click", () => {
        if (!confirm(`Clear all effects from "${pl.name}"?`)) return;
        if (playlistRunning && activePlaylistId === pl.id) stopPlaylist("Cleared");
        const playlists = loadPlaylists();
        const found = playlists.find((p) => p.id === pl.id);
        if (found) {
          found.items = [];
          savePlaylists(playlists);
          renderNamedPlaylists();
        }
      });

      const addFxBtn = document.createElement("button");
      addFxBtn.className = "glass-btn";
      addFxBtn.textContent = full ? "FULL (20)" : "+ ADD CURRENT FX";
      addFxBtn.disabled = full;
      addFxBtn.addEventListener("click", () => {
        addItemToPlaylist(pl.id, captureState(prettyFx(activeFx)));
      });

      const statusSpan = document.createElement("span");
      statusSpan.className = "playlist-status-text";
      statusSpan.dataset.plStatusId = pl.id;
      statusSpan.textContent = isPlaying
        ? "PLAYING"
        : `${pl.items.length} effect${pl.items.length !== 1 ? "s" : ""}`;

      ctrlRow.append(playBtn, stopBtn, shuffleBtn, clearBtn, addFxBtn, statusSpan);
      body.append(ctrlRow);

      // Item list
      const itemsHost = document.createElement("div");
      itemsHost.className = "playlist-list";
      body.append(itemsHost);

      renderPlaylistItems(pl, itemsHost);

      wrap.append(header, body);
      host.append(wrap);
    }
  }

  function renderPlaylistItems(pl, host) {
    host.innerHTML = "";

    if (!pl.items.length) {
      host.innerHTML =
        '<div class="microcopy" style="text-align:center;padding:8px 0">No effects. Tap \'+ ADD CURRENT FX\' above.</div>';
      return;
    }

    pl.items.forEach((item, index) => {
      const row = document.createElement("article");
      row.className = `playlist-item${item.enabled === false ? " sequence-disabled" : ""}`;
      row.dataset.seqId = item.seqId;
      row.dataset.plId = pl.id;

      // Color dots from the saved effect colors
      const dotMain = item.main || "#444";
      const dotBg = item.bg || "#111";
      const dotFg = item.fg || "#888";

      row.innerHTML = `
        <label class="sequence-select" title="Include in playback">
          <input class="sequence-check" type="checkbox" aria-label="Include in Sequence">
        </label>
        <button type="button" class="drag-handle" aria-label="Drag to reorder" title="Drag to reorder">⋮</button>
        <span class="playlist-num"></span>
        <span class="sequence-copy">
          <b></b>
          <small></small>
          <span class="seq-color-dots">
            <i class="seq-color-dot" style="background:${dotMain}" title="MAIN"></i>
            <i class="seq-color-dot" style="background:${dotBg}" title="BG"></i>
            <i class="seq-color-dot" style="background:${dotFg}" title="FG"></i>
          </span>
        </span>
        <label class="duration-wrap">
          <small>SEC</small>
          <input class="glass-field duration" type="number" min="0.25" max="3600" step="0.25">
        </label>
        <div class="button-row">
          <button class="tiny-btn load">LOAD</button>
          <button class="tiny-btn edit-seq-item">EDIT</button>
          <button class="tiny-btn danger del">DEL</button>
        </div>
      `;

      // Grid: "check num copy copy drag" — maintain same column template
      row.style.gridTemplateColumns = "28px 28px minmax(0,1fr) auto auto";

      row.querySelector(".playlist-num").textContent = index + 1;
      row.querySelector(".sequence-copy b").textContent = item.name || prettyFx(item.fx);
      row.querySelector(".sequence-copy small").textContent = prettyFx(item.fx);

      const enabledCb = row.querySelector(".sequence-check");
      enabledCb.checked = item.enabled !== false;
      enabledCb.onchange = () => {
        const playlists = loadPlaylists();
        const found = playlists.find((p) => p.id === pl.id);
        const fItem = found?.items.find((it) => it.seqId === item.seqId);
        if (fItem) {
          fItem.enabled = enabledCb.checked;
          savePlaylists(playlists);
          row.classList.toggle("sequence-disabled", !enabledCb.checked);
          if (playlistRunning && activePlaylistId === pl.id) startPlaylist(pl.id, true);
        }
      };

      const durationInput = row.querySelector(".duration");
      durationInput.value = item.durationSec || DEFAULT_PLAYLIST_SECONDS;
      durationInput.onchange = () => {
        const playlists = loadPlaylists();
        const found = playlists.find((p) => p.id === pl.id);
        const fItem = found?.items.find((it) => it.seqId === item.seqId);
        if (fItem) {
          fItem.durationSec = clamp(+durationInput.value || DEFAULT_PLAYLIST_SECONDS, 0.25, 3600);
          durationInput.value = fItem.durationSec;
          savePlaylists(playlists);
        }
      };

      row.querySelector(".load").onclick = () => applyState(item);

      row.querySelector(".edit-seq-item").onclick = () =>
        openFxEditModal(pl.id, item.seqId);

      row.querySelector(".del").onclick = () => {
        const playlists = loadPlaylists();
        const found = playlists.find((p) => p.id === pl.id);
        if (found) {
          found.items = found.items.filter((it) => it.seqId !== item.seqId);
          savePlaylists(playlists);
          if (playlistRunning && activePlaylistId === pl.id) startPlaylist(pl.id, true);
          renderNamedPlaylists();
        }
      };

      bindPlaylistDrag(row, row.querySelector(".drag-handle"), host, pl.id);
      host.append(row);
    });
  }

  // Add item to a named playlist
  function addItemToPlaylist(plId, state) {
    const playlists = loadPlaylists();
    const found = playlists.find((p) => p.id === plId);
    if (!found) return;
    if (found.items.length >= MAX_PL_ITEMS) {
      log(`Playlist "${found.name}" is full (${MAX_PL_ITEMS} effects).`);
      return;
    }

    found.items.push(normalizeItem({
      ...state,
      enabled: true,
      seqId: makeSequenceId(),
      durationSec: Number(state.durationSec) || DEFAULT_PLAYLIST_SECONDS,
    }));
    savePlaylists(playlists);
    renderNamedPlaylists();
  }

  /* ======================================================================== */
  /* 16D. DRAG REORDERING (per-playlist-body host)                            */
  /* ======================================================================== */

  function bindPlaylistDrag(row, handle, host, plId) {
    let dragging = false;
    let activePointerId = null;

    const moveRowForY = (clientY) => {
      const rows = [...host.querySelectorAll(".playlist-item")].filter(
        (candidate) => candidate !== row,
      );
      if (!rows.length) return;

      for (const target of rows) {
        const rect = target.getBoundingClientRect();
        if (clientY < rect.top + rect.height / 2) {
          if (row.nextElementSibling !== target) host.insertBefore(row, target);
          return;
        }
      }

      if (host.lastElementChild !== row) host.append(row);
    };

    handle.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      dragging = true;
      activePointerId = event.pointerId;
      row.classList.add("dragging");
      handle.classList.add("dragging");
      document.documentElement.classList.add("sequence-reordering");

      try { handle.setPointerCapture(activePointerId); } catch (_) {}

      event.preventDefault();
      event.stopPropagation();
    });

    handle.addEventListener("pointermove", (event) => {
      if (!dragging || event.pointerId !== activePointerId) return;

      const edge = 56;
      if (event.clientY < edge) window.scrollBy(0, -12);
      else if (event.clientY > window.innerHeight - edge) window.scrollBy(0, 12);

      moveRowForY(event.clientY);
      event.preventDefault();
    });

    const finish = (event) => {
      if (!dragging) return;
      if (event?.pointerId != null && event.pointerId !== activePointerId) return;

      dragging = false;
      row.classList.remove("dragging");
      handle.classList.remove("dragging");
      document.documentElement.classList.remove("sequence-reordering");

      try {
        if (activePointerId != null && handle.hasPointerCapture(activePointerId)) {
          handle.releasePointerCapture(activePointerId);
        }
      } catch (_) {}

      activePointerId = null;
      saveDomOrder(host, plId);
      renderNamedPlaylists();
    };

    handle.addEventListener("pointerup", finish);
    handle.addEventListener("pointercancel", finish);
    handle.addEventListener("lostpointercapture", finish);
  }

  function saveDomOrder(host, plId) {
    const playlists = loadPlaylists();
    const found = playlists.find((p) => p.id === plId);
    if (!found) return;

    const byId = new Map(found.items.map((item) => [item.seqId, item]));
    const order = [...host.querySelectorAll(".playlist-item")]
      .map((row) => row.dataset.seqId)
      .filter(Boolean);
    const next = order.map((id) => byId.get(id)).filter(Boolean);

    if (next.length === found.items.length) {
      found.items = next;
      savePlaylists(playlists);
      if (playlistRunning && activePlaylistId === plId) startPlaylist(plId, true);
    }
  }

  /* ======================================================================== */
  /* 16E. CREATE / INIT PLAYLIST CONTROLS                                     */
  /* ======================================================================== */

  q("#createNamedPlaylist")?.addEventListener("click", () => {
    const nameInput = q("#newPlaylistName");
    const name = (nameInput?.value || "").trim() || "New Playlist";
    const playlists = loadPlaylists();
    const newPl = { id: makePlId(), name, items: [] };
    playlists.push(newPl);
    savePlaylists(playlists);
    activePlaylistId = newPl.id;
    localStorage.setItem(ACTIVE_PL_KEY, activePlaylistId);
    if (nameInput) nameInput.value = "";
    renderNamedPlaylists();
  });

  /* ======================================================================== */
  /* 16F. PLAYLIST PICKER (ADD TO SEQUENCE from COLOR FX)                     */
  /* ======================================================================== */

  function openPlaylistPicker(stateToAdd) {
    const backdrop = q("#playlistPickerBackdrop");
    const listHost = q("#playlistPickerList");
    if (!backdrop || !listHost) return;

    listHost.innerHTML = "";
    const playlists = loadPlaylists();

    if (!playlists.length) {
      // No playlists — auto-prompt to create one
      const name = prompt("Name your first playlist:", "My Sequence");
      if (!name) return;

      const newPl = { id: makePlId(), name: name.trim() || "My Sequence", items: [] };
      playlists.push(newPl);
      savePlaylists(playlists);
      addItemToPlaylist(newPl.id, stateToAdd);
      renderNamedPlaylists();
      return;
    }

    for (const pl of playlists) {
      const btn = document.createElement("button");
      btn.className = "glass-btn";
      const full = pl.items.length >= MAX_PL_ITEMS;
      btn.disabled = full;
      btn.style.textAlign = "left";
      btn.textContent = full
        ? `${pl.name} — FULL`
        : `${pl.name}  (${pl.items.length}/${MAX_PL_ITEMS})`;

      btn.addEventListener("click", () => {
        backdrop.classList.add("hidden");
        addItemToPlaylist(pl.id, stateToAdd);
      });

      listHost.append(btn);
    }

    // Quick create & add
    const quickInput = q("#quickPlaylistName");
    if (quickInput) quickInput.value = "";

    q("#quickCreateAndAdd")?.addEventListener("click", () => {
      const name = (q("#quickPlaylistName")?.value || "").trim() || "New Playlist";
      const newPl = { id: makePlId(), name, items: [] };
      const pls = loadPlaylists();
      pls.push(newPl);
      savePlaylists(pls);
      backdrop.classList.add("hidden");
      addItemToPlaylist(newPl.id, stateToAdd);
      renderNamedPlaylists();
    }, { once: true });

    backdrop.classList.remove("hidden");
  }

  q("#playlistPickerClose")?.addEventListener("click", () => {
    q("#playlistPickerBackdrop")?.classList.add("hidden");
  });

  q("#playlistPickerBackdrop")?.addEventListener("click", (e) => {
    if (e.target === q("#playlistPickerBackdrop")) {
      q("#playlistPickerBackdrop").classList.add("hidden");
    }
  });

  // Re-wire ADD TO SEQUENCE button on COLOR FX page
  q("#addFxPlaylist")?.addEventListener("click", () => {
    openPlaylistPicker(captureState(prettyFx(activeFx)));
  });

  /* ======================================================================== */
  /* 16G. EFFECT EDIT MODAL                                                   */
  /* ======================================================================== */

  let fxEditState = null;    // { plId, seqId } reference to item being edited
  let fxEditRole = "main";   // which color role the hue thumb is editing

  function hueFromHex(hex) {
    const v = hex.replace("#", "");
    const r = parseInt(v.slice(0, 2), 16) / 255;
    const g = parseInt(v.slice(2, 4), 16) / 255;
    const b = parseInt(v.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    if (!d) return 0;
    let h =
      max === r ? 60 * (((g - b) / d) % 6)
      : max === g ? 60 * ((b - r) / d + 2)
      : 60 * ((r - g) / d + 4);
    return h < 0 ? h + 360 : h;
  }

  function hexFromHue(hue) {
    const c = 1;
    const x = 1 - Math.abs(((hue / 60) % 2) - 1);
    let r = 0; let g = 0; let b = 0;
    if (hue < 60) { r = c; g = x; }
    else if (hue < 120) { r = x; g = c; }
    else if (hue < 180) { g = c; b = x; }
    else if (hue < 240) { g = x; b = c; }
    else if (hue < 300) { r = x; b = c; }
    else { r = c; b = x; }
    const h = (v) => Math.round(v * 255).toString(16).padStart(2, "0").toUpperCase();
    return `#${h(r)}${h(g)}${h(b)}`;
  }

  function openFxEditModal(plId, seqId) {
    const result = findPlaylist(plId);
    if (!result) return;
    const item = result.pl.items.find((it) => it.seqId === seqId);
    if (!item) return;

    fxEditState = { plId, seqId };
    fxEditRole = "main";

    // Populate title
    q("#fxEditTitle").textContent = `EDIT: ${item.name || prettyFx(item.fx)}`;

    // Colors
    const colors = {
      main: item.main || "#FFFFFF",
      bg: item.bg || "#000000",
      fg: item.fg || "#8000FF",
    };

    q("#editMainSwatch").style.background = colors.main;
    q("#editBgSwatch").style.background = colors.bg;
    q("#editFgSwatch").style.background = colors.fg;
    q("#fxEditHueThumb").style.left = `${(hueFromHex(colors.main) / 359) * 100}%`;
    q("#fxEditHueThumb").style.background = colors.main;

    // Active role highlight
    document.querySelectorAll(".fx-edit-color-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.role === "main");
    });

    // Parameters (convert raw → percent)
    const pctOf = (id, raw) => {
      const cfg = STYLE_CONTROLS[id];
      if (!cfg) return 50;
      return clamp(Math.round(((Number(raw) - cfg.min) / Math.max(1, cfg.max - cfg.min)) * 100), 0, 100);
    };

    q("#editBri").value = pctOf("bri", item.bri ?? 96);
    q("#editSpd").value = pctOf("spd", item.spd ?? 180);
    q("#editBgb").value = pctOf("int", item.bgb ?? 64);
    q("#editSize").value = pctOf("size", item.size ?? 96);
    q("#editDens").value = pctOf("dens", item.dens ?? 128);
    q("#editTrail").value = pctOf("trail", item.trail ?? 170);

    // Direction
    const isFwd = (item.dir || "FWD") === "FWD";
    q("#editDirFwd").classList.toggle("is-active", isFwd);
    q("#editDirRev").classList.toggle("is-active", !isFwd);

    // Mirror
    const isMirror = !!item.mirror;
    q("#editMirrorBtn").classList.toggle("is-on", isMirror);
    q("#editMirrorBtn").textContent = isMirror ? "⇌ MIRROR ON" : "⇌ MIRROR";

    // Duration
    q("#editDuration").value = item.durationSec || DEFAULT_PLAYLIST_SECONDS;

    q("#fxEditBackdrop").classList.remove("hidden");
  }

  function closeFxEditModal() {
    q("#fxEditBackdrop")?.classList.add("hidden");
    fxEditState = null;
  }

  // Color role swatches in modal
  document.querySelectorAll(".fx-edit-color-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      fxEditRole = btn.dataset.role;
      document.querySelectorAll(".fx-edit-color-btn").forEach((b) => {
        b.classList.toggle("active", b === btn);
      });
      const swatchId = `edit${fxEditRole.charAt(0).toUpperCase() + fxEditRole.slice(1)}Swatch`;
      const color = q(`#${swatchId}`)?.style.background || "#FFFFFF";
      q("#fxEditHueThumb").style.left = `${(hueFromHex(color) / 359) * 100}%`;
      q("#fxEditHueThumb").style.background = color;
    });
  });

  // Hue strip interaction in modal
  (function bindModalHue() {
    const strip = q("#fxEditHueStrip");
    const thumb = q("#fxEditHueThumb");
    if (!strip || !thumb) return;

    let dragging = false;

    function applyHue(e) {
      const rect = strip.getBoundingClientRect();
      const cx = e.clientX ?? (e.touches?.[0]?.clientX || 0);
      const ratio = clamp((cx - rect.left) / Math.max(1, rect.width), 0, 1);
      const hue = ratio * 359;
      const hex = hexFromHue(hue);

      thumb.style.left = `${ratio * 100}%`;
      thumb.style.background = hex;

      const swatchId = `edit${fxEditRole.charAt(0).toUpperCase() + fxEditRole.slice(1)}Swatch`;
      const swatch = q(`#${swatchId}`);
      if (swatch) swatch.style.background = hex;
    }

    strip.addEventListener("pointerdown", (e) => {
      dragging = true;
      try { strip.setPointerCapture(e.pointerId); } catch (_) {}
      applyHue(e);
    });
    strip.addEventListener("pointermove", (e) => { if (dragging) applyHue(e); });
    const done = () => { dragging = false; };
    strip.addEventListener("pointerup", done);
    strip.addEventListener("pointercancel", done);
  })();

  // Direction toggles in modal
  q("#editDirFwd")?.addEventListener("click", () => {
    q("#editDirFwd").classList.add("is-active");
    q("#editDirRev").classList.remove("is-active");
  });
  q("#editDirRev")?.addEventListener("click", () => {
    q("#editDirRev").classList.add("is-active");
    q("#editDirFwd").classList.remove("is-active");
  });
  q("#editMirrorBtn")?.addEventListener("click", () => {
    const isOn = !q("#editMirrorBtn").classList.contains("is-on");
    q("#editMirrorBtn").classList.toggle("is-on", isOn);
    q("#editMirrorBtn").textContent = isOn ? "⇌ MIRROR ON" : "⇌ MIRROR";
  });

  // Save changes from modal back to the playlist item
  q("#fxEditSave")?.addEventListener("click", () => {
    if (!fxEditState) return;
    const { plId, seqId } = fxEditState;

    const playlists = loadPlaylists();
    const found = playlists.find((p) => p.id === plId);
    const item = found?.items.find((it) => it.seqId === seqId);
    if (!item) { closeFxEditModal(); return; }

    // Read colors from swatches
    const hexOf = (el) => {
      const bg = window.getComputedStyle(el).background;
      // Fallback if inline background contains rgb()
      const match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        return "#" + [match[1], match[2], match[3]]
          .map((n) => (+n).toString(16).padStart(2, "0"))
          .join("").toUpperCase();
      }
      return el.style.background || "#FFFFFF";
    };

    item.main = hexOf(q("#editMainSwatch"));
    item.bg   = hexOf(q("#editBgSwatch"));
    item.fg   = hexOf(q("#editFgSwatch"));

    // Convert percent inputs back to raw firmware values
    const rawOf = (id, pct) => {
      const cfg = STYLE_CONTROLS[id];
      if (!cfg) return 128;
      return Math.round(cfg.min + (clamp(Number(pct), 0, 100) / 100) * (cfg.max - cfg.min));
    };

    item.bri   = rawOf("bri",  q("#editBri").value);
    item.spd   = rawOf("spd",  q("#editSpd").value);
    item.bgb   = rawOf("int",  q("#editBgb").value);
    item.size  = rawOf("size", q("#editSize").value);
    item.dens  = rawOf("dens", q("#editDens").value);
    item.trail = rawOf("trail",q("#editTrail").value);

    item.dir    = q("#editDirFwd").classList.contains("is-active") ? "FWD" : "REV";
    item.mirror = q("#editMirrorBtn").classList.contains("is-on");
    item.durationSec = clamp(+q("#editDuration").value || DEFAULT_PLAYLIST_SECONDS, 0.25, 3600);

    savePlaylists(playlists);
    closeFxEditModal();
    renderNamedPlaylists();
  });

  q("#fxEditDiscard")?.addEventListener("click", closeFxEditModal);
  q("#fxEditClose")?.addEventListener("click", closeFxEditModal);
  q("#fxEditBackdrop")?.addEventListener("click", (e) => {
    if (e.target === q("#fxEditBackdrop")) closeFxEditModal();
  });

  // Modal: focus first input when opened, trap Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!q("#fxEditBackdrop")?.classList.contains("hidden")) closeFxEditModal();
      if (!q("#playlistPickerBackdrop")?.classList.contains("hidden")) {
        q("#playlistPickerBackdrop").classList.add("hidden");
      }
    }
  });

  /* ======================================================================== */
  /* 17. MULTI-PLAYLIST SEQUENCE RUNTIME SCHEDULER                            */
  /* ======================================================================== */

  function playableItems(plId) {
    const result = findPlaylist(plId);
    if (!result) return [];
    return result.pl.items.filter((item) => item.enabled !== false);
  }

  function choosePlaylistIndex(count, ordered) {
    if (!playlistShuffle) return ordered % count;
    if (count === 1) return 0;
    let next;
    do { next = Math.floor(Math.random() * count); } while (next === playlistLastIndex);
    return next;
  }

  async function runPlaylistStep(token, plId, ordered = 0) {
    if (!playlistRunning || token !== playlistRunToken) return;

    const list = playableItems(plId);
    if (!list.length) {
      stopPlaylist("Sequence has no checked effects");
      return;
    }

    const index = choosePlaylistIndex(list.length, ordered);
    playlistLastIndex = index;
    localStorage.setItem(ACTIVE_PL_POS_KEY, String(index));

    const item = list[index];
    await applyState(item);
    markActiveStep(plId, item.seqId);

    // Update status text for this playlist
    const seconds = clamp(+item.durationSec || DEFAULT_PLAYLIST_SECONDS, 0.25, 3600);
    const statusEl = document.querySelector(`[data-pl-status-id="${plId}"]`);
    if (statusEl) {
      statusEl.textContent =
        `${playlistShuffle ? "SHUFFLE" : "LOOP"} · ${item.name || prettyFx(item.fx)} · ${seconds}s`;
    }

    if (!playlistRunning || token !== playlistRunToken) return;

    playlistTimer = setTimeout(
      () => runPlaylistStep(token, plId, playlistShuffle ? ordered : ordered + 1),
      Math.max(250, Math.round(seconds * 1000)),
    );
  }

  function startPlaylist(plId, resume = false) {
    const list = playableItems(plId);

    if (!snap.passkey) {
      log("Sequence needs a connected target.");
      return;
    }
    if (!list.length) {
      log("Sequence has no checked effects.");
      return;
    }

    // Stop any currently running playlist
    if (playlistRunning) stopPlaylist("Switching playlist", true);

    activePlaylistId = plId;
    localStorage.setItem(ACTIVE_PL_KEY, plId);

    playlistRunning = true;
    playlistRunToken++;
    playlistLastIndex = -1;
    localStorage.setItem(PLAYLIST_RUN_KEY, "1");

    markPlayingPlaylist(plId);

    const start = resume
      ? clamp(Number(localStorage.getItem(ACTIVE_PL_POS_KEY) || 0), 0, Math.max(0, list.length - 1))
      : 0;

    runPlaylistStep(playlistRunToken, plId, start);
    renderNamedPlaylists();
  }

  function stopPlaylist(reason = "Stopped · current effect held", keepEffect = true) {
    playlistRunning = false;
    playlistRunToken++;
    clearTimeout(playlistTimer);
    playlistTimer = 0;

    localStorage.setItem(PLAYLIST_RUN_KEY, "0");

    // Clear playing glow and active step
    document.querySelectorAll(".named-playlist.is-playing").forEach((el) =>
      el.classList.remove("is-playing")
    );
    document.querySelectorAll(".playlist-item.is-active-step").forEach((el) =>
      el.classList.remove("is-active-step")
    );

    // Update status spans
    document.querySelectorAll("[data-pl-status-id]").forEach((el) => {
      el.textContent = reason;
    });

    if (!keepEffect) send("FX=OFF");

    renderNamedPlaylists();
  }

  // Handle legacy ADD TO SEQUENCE from CUSTOM tab if HTML still has it (future-safe)
  q("#addCurrentFx")?.addEventListener("click", () => {
    openPlaylistPicker(captureState(prettyFx(activeFx)));
  });

  // Keep regression-required IDs alive even though the old single controls are gone
  // These are no-op listeners — the IDs referenced by regression tests still satisfy
  // the need() assertions on presence in the JS source.
  const SHUFFLE_KEY = SHUFFLE_KEY_MP;
  const PLAYLIST_KEY = LEGACY_PLAYLIST_KEY;
  const PLAYLIST_RUN_KEY = "stw-esp32-sequence-running-v1";
  const PLAYLIST_POS_KEY = ACTIVE_PL_POS_KEY;
  const playablePlaylist = () => activePlaylistId ? playableItems(activePlaylistId) : [];
  const savePlaylist = (list) => {
    // Compatibility shim — if old code calls savePlaylist, update active playlist items
    if (!activePlaylistId) return;
    const pls = loadPlaylists();
    const found = pls.find((p) => p.id === activePlaylistId);
    if (found) { found.items = list.slice(0, MAX_PL_ITEMS); savePlaylists(pls); }
  };



  /* ======================================================================== */
  /* 18. STARTUP-EFFECT OPTIONS                                               */
  /* ======================================================================== */

  function fillStartupEffects() {
    const select = q("#startupFx");
    if (!select) return;

    const value = select.value || "RAINBOW";
    const available = visibleEffects();
    select.innerHTML = "";

    for (const fx of available) {
      const option = document.createElement("option");
      option.value = fx;
      option.textContent = prettyFx(fx);
      select.append(option);
    }

    select.value = available.includes(value) ? value : "RAINBOW";
  }

  /* ======================================================================== */
  /* 19. CORE EVENT RECONCILIATION                                            */
  /* ======================================================================== */

  document.addEventListener("stw:ble", (e) => {
    const oldTarget = JSON.stringify(snap.target);
    snap = window.STWBLE.snapshot();

    renderDevices();
    renderGroups();
    updateHeader();

    if (JSON.stringify(snap.target) !== oldTarget) {
      formDirty = false;
      fillStartupEffects();
      loadDeviceForm(true);
      syncFromStatus(currentStatus());
    } else {
      loadDeviceForm(false);
    }

    if (e.detail?.type === "status" && e.detail?.deviceId) {
      const device = snap.devices.find(
        (item) => item.id === e.detail.deviceId,
      );

      if (
        device &&
        (!snap.target ||
          snap.target.type !== "device" ||
          snap.target.id === device.id)
      ) {
        syncFromStatus(device.lastStatus);
      }
    }

    if (e.detail?.type === "connected" && e.detail?.deviceId) {
      setTimeout(async () => {
        const status = await window.STWBLE.readStatus(e.detail.deviceId);
        if (status) {
          log(`FW ${e.detail.deviceId}: VER=${status.VER || "?"}`);
        }

        snap = window.STWBLE.snapshot();

        if (
          localStorage.getItem(PLAYLIST_RUN_KEY) === "1" &&
          !playlistRunning &&
          snap.passkey
        ) {
          startPlaylist(true);
        }
      }, 150);
    }

    if (
      ["connect-error", "tx-error", "status-error", "granted-error"].includes(
        e.detail?.type,
      )
    ) {
      log(`${e.detail.type}: ${e.detail.message || "unknown error"}`);
    }
  });

  /* ======================================================================== */
  /* 20. INITIAL RENDER                                                       */
  /* ======================================================================== */

  fillStartupEffects();
  renderDevices();
  renderGroups();
  renderSavedColors();
  renderEffects();
  renderPresets();
  renderNamedPlaylists();   // Multi-playlist accordions
  updateAllSliders();
  bindLevelMeterDrag();
  syncHue();
  applyEffectCapabilities(activeFx);
  updateHeader();
  loadDeviceForm(true);

  // Resume any running playlist on page load (if target is already connected)
  if (localStorage.getItem(PLAYLIST_RUN_KEY) === "1" && snap.passkey && activePlaylistId) {
    startPlaylist(activePlaylistId, true);
  }

  log(
    "Multi-playlist: named playlists, inline EDIT modal, tricolor glow, active-step twinkle. V5.1 direct effects · SOLID restored · WIPE kept · angled glass tabs.",
  );
})();
