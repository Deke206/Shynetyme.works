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
   *   - Effect Styling percentage-to-firmware mapping.
   *   - BG / FG / MAIN color selection and hue interaction.
   *   - Browser-local saved colors, presets, and Sequence definitions.
   *   - Sequence timing while the browser JavaScript environment is active.
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
  const PLAYLIST_KEY = "stw-esp32-custom-v4";
  const SHUFFLE_KEY = "stw-esp32-playlist-shuffle-v1";
  const PLAYLIST_RUN_KEY = "stw-esp32-sequence-running-v1";
  const PLAYLIST_POS_KEY = "stw-esp32-sequence-position-v1";

  const DEFAULT_PLAYLIST_SECONDS = 5;

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

  // Sequence scheduler state is runtime-only; intent/position are persisted below.
  let playlistRunning = false;
  let playlistShuffle = localStorage.getItem(SHUFFLE_KEY) === "1";
  let playlistRunToken = 0;
  let playlistTimer = 0;
  let playlistLastIndex = -1;

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

    ["effects", "colors", "presets", "custom"].forEach((id) => {
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

      /*
       * Card HTML is generated here because device count is dynamic. The power
       * glyph is presentation-only; click behavior is attached below.
       */
      card.innerHTML = `
        <div class="esp32-art">
          <span class="esp32-chip">ESP32</span>
          <span class="esp32-usb"></span>
        </div>
        <div class="device-info">
          <div class="device-name"></div>
          <div class="device-bt"></div>
        </div>
        <i class="ble-dot ${device.bleStatus}"></i>
        <button class="power-ring ${device.powered ? "on" : ""}" aria-label="Power">⏻</button>
      `;

      card.querySelector(".device-name").textContent = device.name;
      card.querySelector(".device-bt").textContent =
        device.bluetoothName || "Bluetooth not assigned";

      card.addEventListener("click", (event) => {
        if (!event.target.closest(".power-ring")) {
          window.STWBLE.selectDevice(device.id);
        }
      });

      card.querySelector(".power-ring").addEventListener("click", async (event) => {
        event.stopPropagation();
        await window.STWBLE.togglePower(device.id);
      });

      host.append(card);
    }
  }

  /*
   * The dirty flag prevents asynchronous BLE events from overwriting text/number
   * fields while the user is in the middle of editing them.
   */
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
      // Allow the synchronous target event to propagate before reading snapshot.
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

      // Core sends LEDS/PIN/ORDER/SAVE and stores browser-only fields separately.
      await window.STWBLE.saveDeviceConfig(device.id, config, { reboot: false });

      // V5.1 has no persistent NAME command; this is a browser logical alias.
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

  /* Save startup effect in ESP32 NVS, then restore the current live effect. */
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

  /* Display-only meter; it never sends commands and does not accept pointer input. */
  function paintPercent(id, pct) {
    const input = q(`[data-percent-for="${id}"]`);
    input
      ?.closest(".percent-control")
      ?.querySelector(".fill")
      ?.style.setProperty("width", `${clamp(Number(pct), 0, 100)}%`);
  }

  /* Raw hidden value -> visible percentage box + visual meter. */
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

  /* Invalid text restores from the last successfully committed raw value. */
  function restorePercent(input) {
    const id = input?.dataset.percentFor;
    if (!id) return;
    updateSlider(q(`#${id}`));
  }

  /*
   * Commit happens only on blur/Enter. Valid visible percent is converted to the
   * exact firmware domain, sent, then copied into the hidden raw input.
   */
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

  qa(".percent-input").forEach((input) => {
    input.addEventListener("focus", () => input.select());

    // While typing a valid number, preview only the meter; do not send yet.
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

  q("#dir")?.addEventListener("change", () => {
    send(`DIR=${q("#dir").value}`, { fast: true });
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

  /* Set hidden color inputs + role swatches without writing to firmware. */
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

  /* Full-saturation HSV hue -> RGB hex. Existing UI intentionally edits hue only. */
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

  /* Existing role color -> hue track/thumb position. */
  function syncHue() {
    const value = currentPalette()[activeRole];
    const hue = rgbToHue(value);

    q("#hueRange").value = Math.round(hue);
    q("#hueSelector").style.setProperty("--hx", `${(hue / 359) * 100}%`);
    q("#hueValue").textContent = value;
    q("#hueValue").style.color = value;
  }

  /* Pointer movement updates only the active role in local UI until release. */
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

  /* Commit all role colors together so firmware state stays internally coherent. */
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

  // Keyboard/range-input fallback uses the same live/commit path as pointer drag.
  q("#hueRange")?.addEventListener("input", () => {
    liveHue(Number(q("#hueRange").value));
  });
  q("#hueRange")?.addEventListener("change", commitHue);

  /* ======================================================================== */
  /* 11. SAVED COLORS                                                         */
  /* ======================================================================== */

  function customColors() {
    let list = loadJSON(SAVED_KEY, null);

    // One-time migration removes built-ins from the old custom list.
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

    // Keep activeRole on a role that the current effect can actually use.
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
    // Manual effect selection exits browser Sequence playback but holds LEDs live.
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

  /*
   * Shared state shape is used by browser presets and Sequence items. It stores
   * raw firmware values so reapplying a state does not accumulate rounding error.
   */
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

  /* Build one semicolon command; BLE core safely re-chunks it for transport. */
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
  /* 16. BROWSER SEQUENCE STORAGE / MIGRATION                                 */
  /* ======================================================================== */

  function playlist() {
    const list = loadJSON(PLAYLIST_KEY, []);
    if (!Array.isArray(list)) return [];

    let changed = false;

    // Migrate the old `duration` field to durationSec without losing items.
    list.forEach((item) => {
      const number = Number(
        item.durationSec ?? item.duration ?? DEFAULT_PLAYLIST_SECONDS,
      );
      const duration = Number.isFinite(number)
        ? clamp(number, 0.25, 3600)
        : DEFAULT_PLAYLIST_SECONDS;

      if (item.durationSec !== duration) {
        item.durationSec = duration;
        changed = true;
      }
      if ("duration" in item) {
        delete item.duration;
        changed = true;
      }
    });

    if (changed) saveJSON(PLAYLIST_KEY, list);
    return list;
  }

  const savePlaylist = (list) => saveJSON(PLAYLIST_KEY, list.slice(0, 100));

  function addPlaylist(state) {
    const list = playlist();
    list.push({
      ...state,
      durationSec: Number(state.durationSec) || DEFAULT_PLAYLIST_SECONDS,
    });
    savePlaylist(list);
    renderPlaylist();
  }

  q("#addFxPlaylist")?.addEventListener("click", () => {
    addPlaylist(captureState(prettyFx(activeFx)));
  });

  q("#addCurrentFx")?.addEventListener("click", () => {
    addPlaylist(captureState(prettyFx(activeFx)));
  });

  function renderPlaylist() {
    const host = q("#playlistList");
    if (!host) return;

    const list = playlist();
    host.innerHTML = "";

    if (!list.length) {
      host.innerHTML =
        '<div class="microcopy" style="text-align:center">Sequence is empty.</div>';
      return;
    }

    list.forEach((item, index) => {
      const row = document.createElement("article");
      row.className = "playlist-item";
      row.innerHTML = `
        <span class="playlist-num"></span>
        <span><b></b><small></small></span>
        <label class="duration-wrap">
          <small>TIME SEC</small>
          <input class="glass-field duration" type="number" min="0.25" max="3600" step="0.25">
        </label>
        <div class="button-row">
          <button class="tiny-btn load">LOAD</button>
          <button class="tiny-btn danger del">DELETE</button>
        </div>
      `;

      row.querySelector(".playlist-num").textContent = index + 1;
      row.querySelector("b").textContent = item.name || prettyFx(item.fx);
      row.querySelector("small").textContent = prettyFx(item.fx);

      const duration = row.querySelector(".duration");
      duration.value = item.durationSec || DEFAULT_PLAYLIST_SECONDS;
      duration.onchange = () => {
        const next = playlist();
        if (!next[index]) return;

        next[index].durationSec = clamp(
          +duration.value || DEFAULT_PLAYLIST_SECONDS,
          0.25,
          3600,
        );
        duration.value = next[index].durationSec;
        savePlaylist(next);
      };

      row.querySelector(".load").onclick = () => applyState(item);
      row.querySelector(".del").onclick = () => {
        const next = playlist();
        next.splice(index, 1);
        savePlaylist(next);
        renderPlaylist();
      };

      host.append(row);
    });
  }

  /* ======================================================================== */
  /* 17. SEQUENCE RUNTIME SCHEDULER                                           */
  /* ======================================================================== */

  function syncShuffleButton() {
    const button = q("#shufflePlaylist");
    if (!button) return;

    button.classList.toggle("primary", playlistShuffle);
    button.textContent = playlistShuffle ? "SHUFFLE ON" : "SHUFFLE";
    button.setAttribute("aria-pressed", playlistShuffle ? "true" : "false");
  }

  /*
   * Default stop semantics intentionally HOLD the current LEDs. keepEffect=false
   * remains available internally, but normal STOP never sends FX=OFF.
   */
  function stopPlaylist(reason = "Stopped · current effect held", keepEffect = true) {
    playlistRunning = false;
    playlistRunToken++;
    clearTimeout(playlistTimer);
    playlistTimer = 0;

    localStorage.setItem(PLAYLIST_RUN_KEY, "0");
    q("#playPlaylist").textContent = "PLAY";
    q("#playlistStatus").textContent = reason;

    if (!keepEffect) send("FX=OFF");
  }

  function choosePlaylistIndex(count, ordered) {
    if (!playlistShuffle) return ordered % count;
    if (count === 1) return 0;

    let next;
    do {
      next = Math.floor(Math.random() * count);
    } while (next === playlistLastIndex);

    return next;
  }

  /*
   * Token invalidation prevents an old timeout from continuing after STOP or a
   * restart. Timing remains browser-owned because V5.1 has no Sequence scheduler.
   */
  async function runPlaylistStep(token, ordered = 0) {
    if (!playlistRunning || token !== playlistRunToken) return;

    const list = playlist();
    if (!list.length) {
      stopPlaylist("Sequence is empty");
      return;
    }

    const index = choosePlaylistIndex(list.length, ordered);
    playlistLastIndex = index;
    localStorage.setItem(PLAYLIST_POS_KEY, String(index));

    const item = list[index];
    await applyState(item);

    if (!playlistRunning || token !== playlistRunToken) return;

    const seconds = clamp(
      +item.durationSec || DEFAULT_PLAYLIST_SECONDS,
      0.25,
      3600,
    );

    q("#playlistStatus").textContent =
      `${playlistShuffle ? "SHUFFLE" : "LOOP"} · ` +
      `${item.name || prettyFx(item.fx)} · ${seconds}s`;

    playlistTimer = setTimeout(
      () => runPlaylistStep(token, playlistShuffle ? ordered : ordered + 1),
      Math.max(250, Math.round(seconds * 1000)),
    );
  }

  function startPlaylist(resume = false) {
    const list = playlist();

    if (!snap.passkey) {
      log("Sequence needs a connected target.");
      return;
    }
    if (!list.length) {
      log("Sequence is empty.");
      return;
    }

    playlistRunning = true;
    playlistRunToken++;
    playlistLastIndex = -1;
    localStorage.setItem(PLAYLIST_RUN_KEY, "1");
    q("#playPlaylist").textContent = "RESTART";

    const start = resume
      ? clamp(
          Number(localStorage.getItem(PLAYLIST_POS_KEY) || 0),
          0,
          Math.max(0, list.length - 1),
        )
      : 0;

    runPlaylistStep(playlistRunToken, start);
  }

  q("#playPlaylist")?.addEventListener("click", () => startPlaylist(false));
  q("#stopPlaylist")?.addEventListener("click", () => stopPlaylist());

  q("#shufflePlaylist")?.addEventListener("click", () => {
    playlistShuffle = !playlistShuffle;
    localStorage.setItem(SHUFFLE_KEY, playlistShuffle ? "1" : "0");
    syncShuffleButton();

    if (playlistRunning) startPlaylist(true);
  });

  q("#clearPlaylist")?.addEventListener("click", () => {
    stopPlaylist("Sequence cleared");
    savePlaylist([]);
    localStorage.removeItem(PLAYLIST_POS_KEY);
    renderPlaylist();
  });

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

    /* Target changes may replace all form/status context, so force a fresh load. */
    if (JSON.stringify(snap.target) !== oldTarget) {
      formDirty = false;
      fillStartupEffects();
      loadDeviceForm(true);
      syncFromStatus(currentStatus());
    } else {
      loadDeviceForm(false);
    }

    /* STATUS events are the device-truth path for effects/colors/parameters. */
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

    /*
     * On connect, read firmware status before attempting browser Sequence resume.
     * The 150ms delay gives the freshly established GATT characteristics a short
     * settle window without creating a continuous reconnect loop.
     */
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

  /*
   * Initialization is deliberately synchronous and side-effect-light. It does
   * not open Bluetooth. BLE core emits `ready`; user connection remains manual.
   */
  fillStartupEffects();
  renderDevices();
  renderGroups();
  renderSavedColors();
  renderEffects();
  renderPresets();
  renderPlaylist();
  syncShuffleButton();
  updateAllSliders();
  syncHue();
  applyEffectCapabilities(activeFx);
  updateHeader();
  loadDeviceForm(true);

  q("#playlistStatus").textContent =
    localStorage.getItem(PLAYLIST_RUN_KEY) === "1"
      ? "Resume pending · connect target"
      : "Ordered loop ready";

  if (localStorage.getItem(PLAYLIST_RUN_KEY) === "1" && snap.passkey) {
    startPlaylist(true);
  }

  log(
    "Iteration 2 current: V5.1 direct effects · SOLID restored · WIPE kept factual · percentage-entry styling · separate glass Effects/Colors tabs · Sequence state persists in browser.",
  );
})();
