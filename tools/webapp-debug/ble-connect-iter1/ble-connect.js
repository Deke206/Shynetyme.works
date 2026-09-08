"use strict";

const SERVICE_UUID = "78170001-7a32-4b19-913a-5354594d4501";
const COMMAND_UUID = "78170002-7a32-4b19-913a-5354594d4501";
const STATUS_UUID = "78170003-7a32-4b19-913a-5354594d4501";

const connectBtn = document.querySelector("#connect");
const statusBtn = document.querySelector("#status");
const disconnectBtn = document.querySelector("#disconnect");
const stateEl = document.querySelector("#state");
const logEl = document.querySelector("#log");
const enc = new TextEncoder();
const dec = new TextDecoder();

let device = null;
let server = null;
let commandChar = null;
let statusChar = null;

function log(message) {
  const stamp = new Date().toLocaleTimeString();
  logEl.textContent = `${stamp}  ${message}\n${logEl.textContent}`;
}

function state(text) {
  stateEl.textContent = text;
}

function resetGatt() {
  server = null;
  commandChar = null;
  statusChar = null;
  statusBtn.disabled = true;
  disconnectBtn.disabled = !device?.gatt?.connected;
}

function onDisconnected() {
  log("GATT disconnected.");
  state("DISCONNECTED");
  resetGatt();
  connectBtn.disabled = false;
}

async function connectSelectedDevice(bt) {
  state("CONNECTING GATT…");
  log(`Picker returned: ${bt.name || "unnamed device"} (${bt.id})`);

  bt.addEventListener("gattserverdisconnected", onDisconnected, { once: true });
  server = await bt.gatt.connect();
  log("GATT connected.");

  const service = await server.getPrimaryService(SERVICE_UUID);
  log("V5.2 service found.");

  commandChar = await service.getCharacteristic(COMMAND_UUID);
  statusChar = await service.getCharacteristic(STATUS_UUID);
  log("Command + status characteristics found.");

  state(`CONNECTED — ${bt.name || "ESP32"}`);
  statusBtn.disabled = false;
  disconnectBtn.disabled = false;
}

connectBtn.addEventListener("click", async () => {
  if (!navigator.bluetooth) {
    state("WEB BLUETOOTH UNAVAILABLE");
    log("navigator.bluetooth is unavailable in this browser.");
    return;
  }
  if (!window.isSecureContext) {
    state("HTTPS REQUIRED");
    log("Web Bluetooth requires a secure context.");
    return;
  }

  connectBtn.disabled = true;
  state("OPENING PICKER…");
  log("Calling requestDevice() directly from this click. No prior await, reconnect, assignment, or background work.");

  try {
    device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [SERVICE_UUID],
    });

    await connectSelectedDevice(device);
  } catch (error) {
    const cancelled = error?.name === "NotFoundError";
    state(cancelled ? "PICKER CANCELLED" : "FAILED");
    log(`${error?.name || "Error"}: ${error?.message || error}`);
    resetGatt();
    connectBtn.disabled = false;
  }
});

statusBtn.addEventListener("click", async () => {
  if (!commandChar || !statusChar) return;
  try {
    await commandChar.writeValueWithResponse(enc.encode("STATUS"));
    await new Promise((resolve) => setTimeout(resolve, 100));
    const value = await statusChar.readValue();
    log(`STATUS: ${dec.decode(value)}`);
  } catch (error) {
    log(`STATUS FAILED: ${error?.message || error}`);
  }
});

disconnectBtn.addEventListener("click", () => {
  try {
    device?.gatt?.disconnect();
  } catch (error) {
    log(`DISCONNECT FAILED: ${error?.message || error}`);
  }
});
