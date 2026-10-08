"use strict";

(() => {
  /*
   * ShyneTyme.Works — WLED three-node controller.
   *
   * ARCHITECTURE
   * ------------
   * Browser --BLE--> HOST --Wi-Fi--> CLIENT 1 + CLIENT 2. Clients have no Bluetooth.
   *
   * This file intentionally reuses the accepted Iteration-2 presentation layer.
   * It owns only the WLED hub transport and WLED-specific UI behavior.
   */

  const SERVICE_UUID = "78170001-7a32-4b19-913a-5354594d4501";
  const COMMAND_UUID = "78170002-7a32-4b19-913a-5354594d4501";
  const STATUS_UUID = "78170003-7a32-4b19-913a-5354594d4501";

  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const q = (selector) => document.querySelector(selector);
  const qa = (selector) => [...document.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /*
   * Curated upstream WLED effect IDs.
   * 1D and audio-reactive effects stay together by design.
   * Matrix-only effects stay on the BANNER page.
   */
  const LINE_AUDIO_FX = [
    [0, "Solid", "1D"],
    [1, "Blink", "1D"],
    [2, "Breathe", "1D"],
    [3, "Wipe", "1D"],
    [4, "Wipe Random", "1D"],
    [5, "Random Colors", "1D"],
    [6, "Sweep", "1D"],
    [7, "Dynamic", "1D"],
    [8, "Colorloop", "1D"],
    [9, "Rainbow", "1D"],
    [10, "Scan", "1D"],
    [11, "Scan Dual", "1D"],
    [12, "Fade", "1D"],
    [13, "Theater", "1D"],
    [14, "Theater Rainbow", "1D"],
    [15, "Running", "1D"],
    [16, "Saw", "1D"],
    [17, "Twinkle", "1D"],
    [20, "Sparkle", "1D"],
    [23, "Strobe", "1D"],
    [24, "Strobe Rainbow", "1D"],
    [28, "Chase", "1D"],
    [29, "Chase Random", "1D"],
    [30, "Chase Rainbow", "1D"],
    [33, "Rainbow Runner", "1D"],
    [34, "Colorful", "1D"],
    [38, "Aurora", "1D"],
    [40, "Scanner", "1D"],
    [41, "Comet", "1D"],
    [42, "Fireworks", "1D"],
    [43, "Rain", "1D"],
    [45, "Fire Flicker", "1D"],
    [46, "Gradient", "1D"],
    [48, "Rolling Balls", "1D"],
    [49, "Fairy", "1D"],
    [50, "Two Dots", "1D"],
    [51, "Fairytwinkle", "1D"],
    [54, "Tricolor Chase", "1D"],
    [57, "Lightning", "1D"],
    [59, "Multi Comet", "1D"],
    [60, "Scanner Dual", "1D"],
    [63, "Pride 2015", "1D"],
    [64, "Juggle", "1D"],
    [65, "Palette", "1D"],
    [66, "Fire 2012", "1D"],
    [67, "Colorwaves", "1D"],
    [68, "BPM", "1D"],
    [74, "Colortwinkle", "1D"],
    [75, "Lake", "1D"],
    [76, "Meteor", "1D"],
    [78, "Railway", "1D"],
    [79, "Ripple", "1D"],
    [80, "Twinklefox", "1D"],
    [81, "Twinklecat", "1D"],
    [87, "Glitter", "1D"],
    [88, "Candle", "1D"],
    [89, "Starburst", "1D"],
    [90, "Exploding Fireworks", "1D"],
    [91, "Bouncing Balls", "1D"],
    [92, "Sinelon", "1D"],
    [95, "Popcorn", "1D"],
    [96, "Drip", "1D"],
    [97, "Plasma", "1D"],
    [100, "Heartbeat", "1D"],
    [101, "Pacifica", "1D"],
    [104, "Sunrise", "1D"],
    [106, "Twinkleup", "1D"],
    [110, "Flow", "1D"],
    [112, "Dancing Shadows", "1D"],
    [115, "Blends", "1D"],
    [117, "Dynamic Smooth", "1D"],
    [128, "Pixels", "AUDIO"],
    [129, "Pixelwave", "AUDIO"],
    [130, "Juggles", "AUDIO"],
    [132, "Gravimeter", "AUDIO"],
    [133, "Plasmoid", "AUDIO"],
    [134, "Puddles", "AUDIO"],
    [135, "Midnoise", "AUDIO"],
    [136, "Noisemeter", "AUDIO"],
    [137, "Freqwave", "AUDIO"],
    [140, "Waterfall", "AUDIO"],
    [141, "Freqpixels", "AUDIO"],
    [142, "Binmap", "AUDIO"],
    [143, "Noisefire", "AUDIO"],
    [144, "Puddlepeak", "AUDIO"],
    [145, "Noisemove", "AUDIO"],
    [148, "Ripplepeak", "AUDIO"],
    [155, "Freqmap", "AUDIO"],
    [156, "Gravcenter", "AUDIO"],
    [157, "Gravcentric", "AUDIO"],
    [158, "Gravfreq", "AUDIO"],
    [159, "DJ Light", "AUDIO"],
    [163, "Blurz", "AUDIO"],
    [212, "PS GEQ 1D", "AUDIO / PARTICLE"],
    [214, "PS Sonic Stream", "AUDIO / PARTICLE"],
    [215, "PS Sonic Boom", "AUDIO / PARTICLE"]
  ];

  const BANNER_FX = [
    [118, "Spaceships", "2D"],
    [119, "Crazy Bees", "2D"],
    [120, "Ghost Rider", "2D"],
    [121, "Blobs", "2D"],
    [122, "Scrolling Text", "2D / TEXT"],
    [123, "Drift Rose", "2D"],
    [124, "Distortion Waves", "2D"],
    [125, "Soap", "2D"],
    [126, "Octopus", "2D"],
    [127, "Waving Cell", "2D"],
    [139, "GEQ", "2D / AUDIO"],
    [146, "2D Noise", "2D"],
    [149, "Firenoise", "2D"],
    [150, "Squared Swirl", "2D"],
    [152, "DNA", "2D"],
    [153, "Matrix", "2D"],
    [154, "Metaballs", "2D"],
    [160, "Funky Plank", "2D / AUDIO"],
    [162, "Pulser", "2D"],
    [164, "Drift", "2D"],
    [165, "Waverly", "2D"],
    [166, "Sun Radiation", "2D"],
    [167, "Colored Bursts", "2D"],
    [168, "Julia", "2D"],
    [172, "Game of Life", "2D"],
    [173, "Tartan", "2D"],
    [174, "Polar Lights", "2D"],
    [175, "Swirl", "2D"],
    [176, "Lissajous", "2D"],
    [177, "Frizzles", "2D"],
    [178, "Plasma Ball", "2D"],
    [180, "Hiphotic", "2D"],
    [181, "Sindots", "2D"],
    [182, "DNA Spiral", "2D"],
    [183, "Black Hole", "2D"],
    [186, "Akemi", "2D / AUDIO"],
    [198, "Particles GEQ", "2D / AUDIO"],
    [199, "Particles Center GEQ", "2D / AUDIO"],
    [200, "Particles Ghost Rider", "2D"],
    [201, "Particle Blobs", "2D / AUDIO"],
    [217, "Particle Galaxy", "2D"]
  ];

  const STYLE_COMMANDS = Object.freeze({
    bri: "BRI",
    spd: "SPD",
    int: "INT",
    size: "SIZE",
    dens: "DENS",
    trail: "TRAIL"
  });

  const COLOR_COMMANDS = Object.freeze({
    main: "MAIN",
    bg: "BG",
    fg: "FG"
  });

  const SAVED_COLORS_KEY = "stw-wled-saved-colors-v1";
  const PLAYLIST_KEY = "stw-wled-playlists-v1";
  const BUILTIN_COLORS = ["#FFFFFF", "#000000", "#FF2CA8", "#FFF200", "#00BFFF", "#8000FF"];

  let btDevice = null;
  let commandChar = null;
  let statusChar = null;
  let writeQueue = Promise.resolve();
  let connected = false;
  let currentFx = { id: 9, name: "Rainbow", kind: "1D", page: "effects" };
  let activeRole = "main";
  let mirrorOn = false;
  let direction = "FWD";
  let colors = { main: "#FFFFFF", bg: "#000000", fg: "#8000FF" };
  let client1Online = false;
  let client2Online = false;
  let client1EverSeen = false;
  let client2EverSeen = false;
  let client1LastSeen = 0;
  let client2LastSeen = 0;
  let lastStatusText = "";
  let playlistRunToken = 0;

  function loadJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value == null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  function log(message) {
    const host = q("#debugLog");
    if (!host) return;
    const line = new Date().toLocaleTimeString() + "  " + message;
    host.textContent = (line + "\n" + host.textContent).slice(0, 12000);
  }

  function setSummary() {
    if (q("#effectSummary")) q("#effectSummary").textContent = currentFx ? currentFx.name.toUpperCase() : "NONE";
  }

  function updateGate() {
    qa(".tab.gated").forEach((button) => {
      button.classList.toggle("locked", !connected);
      button.setAttribute("aria-disabled", connected ? "false" : "true");
    });

    ["effects", "banner", "presets", "custom"].forEach((id) => {
      const page = q("#" + id);
      if (page) page.classList.toggle("locked-page", !connected);
    });

    if (!connected && !q("#device").classList.contains("on")) showPage("device");
  }

  function setConnectionUI(ok) {
    connected = !!ok;
    if (q("#connectHub")) {
      q("#connectHub").textContent = connected ? "HOST CONNECTED" : "CONNECT HOST BLUETOOTH";
      q("#connectHub").disabled = connected;
    }
    if (q("#disconnectHub")) q("#disconnectHub").disabled = !connected;
    if (q("#readStatus")) q("#readStatus").disabled = !connected;
    if (q("#blackout")) q("#blackout").disabled = !connected;
    if (q("#bleSummary")) q("#bleSummary").textContent = connected ? "HOST · CONNECTED" : "HOST · shynetyme.works1";
    updateGate();
    updateClientStatus();
  }

  function chipClass(ok, hub) {
    if (hub) return connected ? "connected" : "unassigned";
    return ok ? "connected" : "unassigned";
  }

  function getClientVisual(online, everSeen) {
    if (!connected) return { label: "OFFLINE", className: "unassigned" };
    if (online) return { label: "CONNECTED", className: "connected" };
    if (!everSeen) return { label: "WAITING", className: "connecting" };
    return { label: "OFFLINE", className: "unassigned" };
  }

  function formatLastSeen(timestamp) {
    if (!timestamp) return "Last seen: —";
    const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (seconds < 2) return "Last seen: just now";
    return "Last seen: " + seconds + "s ago";
  }

  function renderDeviceCards() {
    const host = q("#deviceList");
    if (!host) return;

    const c1 = getClientVisual(client1Online, client1EverSeen);
    const c2 = getClientVisual(client2Online, client2EverSeen);

    host.innerHTML =
      '<article class="device-card">' +
        '<div class="device-underglow"></div>' +
        '<div class="device-card-inner">' +
          '<div class="device-header-row">' +
            '<div class="device-title-wrap"><div class="device-name">HOST · shynetyme.works1</div><div class="device-bt">' +
              (connected ? (btDevice && btDevice.name ? btDevice.name : "Bluetooth connected") : "Bluetooth waiting") +
            '</div></div>' +
            '<span class="ble-dot ' + chipClass(false, true) + '"></span>' +
          '</div>' +
          '<div class="device-module-body"><div class="device-chip-badge"><span class="chip-label">ESP32 HOST</span><span class="chip-status ' +
            chipClass(false, true) + '">' + (connected ? "CONNECTED" : "PAIR") + '</span></div></div>' +
          '<div class="device-footer-row"><span class="microcopy">PHONE / WEB → BLE → HOST</span></div>' +
        '</div>' +
      '</article>' +

      '<article class="device-card">' +
        '<div class="device-underglow"></div>' +
        '<div class="device-card-inner">' +
          '<div class="device-header-row"><div class="device-title-wrap"><div class="device-name">CLIENT 1 · shynetyme.worksC1</div><div class="device-bt">Wi-Fi only · host controlled</div></div>' +
            '<span class="ble-dot ' + c1.className + '"></span></div>' +
          '<div class="device-module-body"><div class="device-chip-badge"><span class="chip-label">BANNER CLIENT</span><span class="chip-status ' +
            c1.className + '">' + c1.label + '</span></div></div>' +
          '<div class="device-footer-row"><span class="microcopy">' + formatLastSeen(client1LastSeen) + '</span></div>' +
        '</div>' +
      '</article>' +

      '<article class="device-card">' +
        '<div class="device-underglow"></div>' +
        '<div class="device-card-inner">' +
          '<div class="device-header-row"><div class="device-title-wrap"><div class="device-name">CLIENT 2 · shynetyme.worksC2</div><div class="device-bt">Wi-Fi only · host controlled</div></div>' +
            '<span class="ble-dot ' + c2.className + '"></span></div>' +
          '<div class="device-module-body"><div class="device-chip-badge"><span class="chip-label">BANNER CLIENT</span><span class="chip-status ' +
            c2.className + '">' + c2.label + '</span></div></div>' +
          '<div class="device-footer-row"><span class="microcopy">' + formatLastSeen(client2LastSeen) + '</span></div>' +
        '</div>' +
      '</article>';
  }

  function showPage(id) {
    if (id !== "device" && !connected) id = "device";
    qa(".tab").forEach((button) => button.classList.toggle("on", button.dataset.page === id));
    qa(".page").forEach((page) => page.classList.toggle("on", page.id === id));
  }

  function onDisconnected() {
    commandChar = null;
    statusChar = null;
    client1Online = false;
    client2Online = false;
    client1EverSeen = false;
    client2EverSeen = false;
    client1LastSeen = 0;
    client2LastSeen = 0;
    setConnectionUI(false);
    updateClientStatus();
    log("Host disconnected");
  }

  async function connectHub() {
    if (!navigator.bluetooth) {
      log("Web Bluetooth is unavailable in this browser.");
      return;
    }

    try {
      btDevice = await navigator.bluetooth.requestDevice({
        filters: [{ services: [SERVICE_UUID] }]
      });
      btDevice.addEventListener("gattserverdisconnected", onDisconnected);

      const server = await btDevice.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      commandChar = await service.getCharacteristic(COMMAND_UUID);
      statusChar = await service.getCharacteristic(STATUS_UUID);

      try {
        await statusChar.startNotifications();
        statusChar.addEventListener("characteristicvaluechanged", (event) => {
          parseStatus(dec.decode(event.target.value));
        });
      } catch (_) {}

      setConnectionUI(true);
      log("Connected: " + (btDevice.name || "shynetyme.works1"));
      await readStatus();
    } catch (error) {
      log("CONNECT FAILED: " + error.message);
      onDisconnected();
    }
  }

  function disconnectHub() {
    try {
      if (btDevice && btDevice.gatt && btDevice.gatt.connected) btDevice.gatt.disconnect();
    } catch (_) {}
    onDisconnected();
  }

  async function rawWrite(text) {
    if (!commandChar || !connected) throw new Error("Host not connected");
    const command = String(text || "").trim();
    if (!command) return;
    if (command.length > 18) throw new Error("BLE command too long: " + command);

    const bytes = enc.encode(command);

    if (commandChar.properties && commandChar.properties.writeWithoutResponse && commandChar.writeValueWithoutResponse) {
      await commandChar.writeValueWithoutResponse(bytes);
    } else if (commandChar.writeValueWithResponse) {
      await commandChar.writeValueWithResponse(bytes);
    } else {
      await commandChar.writeValue(bytes);
    }
  }

  function send(command, quiet) {
    writeQueue = writeQueue.then(async () => {
      await rawWrite(command);
      if (!quiet) log("TX " + command);
      await sleep(18);
      return true;
    }).catch((error) => {
      log("TX FAILED: " + error.message);
      return false;
    });
    return writeQueue;
  }

  function parseStatus(text) {
    lastStatusText = String(text || "");
    if (q("#hubStatus")) q("#hubStatus").textContent = lastStatusText || "No status returned.";

    const fields = {};
    lastStatusText.split(";").forEach((part) => {
      const index = part.indexOf("=");
      if (index > 0) fields[part.slice(0, index)] = part.slice(index + 1);
    });

    const now = Date.now();

    client1Online = fields.C1 === "1";
    client2Online = fields.C2 === "1";

    if (client1Online) {
      client1EverSeen = true;
      client1LastSeen = now;
    }

    if (client2Online) {
      client2EverSeen = true;
      client2LastSeen = now;
    }

    if (fields.ERR && fields.ERR !== "0") log("HOST ERR=" + fields.ERR);

    updateClientStatus();
  }

  function updateClientStatus() {
    const c1 = getClientVisual(client1Online, client1EverSeen);
    const c2 = getClientVisual(client2Online, client2EverSeen);

    if (q("#client1State")) {
      q("#client1State").textContent = c1.label;
      q("#client1State").classList.toggle("ok", c1.label === "CONNECTED");
      q("#client1State").classList.toggle("waiting", c1.label === "WAITING");
    }

    if (q("#client2State")) {
      q("#client2State").textContent = c2.label;
      q("#client2State").classList.toggle("ok", c2.label === "CONNECTED");
      q("#client2State").classList.toggle("waiting", c2.label === "WAITING");
    }

    if (q("#client1LastSeen")) q("#client1LastSeen").textContent = formatLastSeen(client1LastSeen);
    if (q("#client2LastSeen")) q("#client2LastSeen").textContent = formatLastSeen(client2LastSeen);

    renderDeviceCards();
  }

  async function readStatus() {
    if (!statusChar || !connected) return false;
    try {
      const value = await statusChar.readValue();
      parseStatus(dec.decode(value));
      return true;
    } catch (error) {
      log("STATUS FAILED: " + error.message);
      return false;
    }
  }

  async function sendText(text) {
    const encoded = encodeURIComponent(String(text || "").slice(0, 160));
    await send("TXBEGIN");

    for (let i = 0; i < encoded.length; i += 13) {
      await send("TX+=" + encoded.slice(i, i + 13));
    }

    await send("TXEND");
    currentFx = { id: 122, name: "Scrolling Text", kind: "2D / TEXT", page: "banner" };
    setSummary();
    markSelectedEffect();
    log("Banner text committed");
  }

  function renderFx(hostSelector, list, searchSelector, countSelector, pageName) {
    const host = q(hostSelector);
    const search = q(searchSelector);
    if (!host || !search) return;

    function draw() {
      const term = String(search.value || "").trim().toLowerCase();
      const filtered = list.filter((item) => {
        return (item[1] + " " + item[2] + " " + item[0]).toLowerCase().includes(term);
      });

      host.innerHTML = "";

      filtered.forEach((item) => {
        const id = item[0];
        const name = item[1];
        const kind = item[2];
        const button = document.createElement("button");
        button.type = "button";
        button.className = "fx-item";
        button.dataset.fxId = String(id);
        button.dataset.fxPage = pageName;
        button.innerHTML = "<span>" + name + "</span><small>" + kind + " · WLED FX " + id + "</small>";

        button.addEventListener("click", async () => {
          if (!connected) return;
          const ok = await send("FXID=" + id);
          if (!ok) return;
          currentFx = { id, name, kind, page: pageName };
          setSummary();
          markSelectedEffect();
        });

        host.append(button);
      });

      if (q(countSelector)) q(countSelector).textContent = filtered.length + " / " + list.length;
      markSelectedEffect();
    }

    search.addEventListener("input", draw);
    draw();
  }

  function markSelectedEffect() {
    qa(".fx-item").forEach((button) => {
      button.classList.toggle(
        "on",
        Number(button.dataset.fxId) === Number(currentFx.id) &&
          button.dataset.fxPage === currentFx.page
      );
    });
  }

  function percentToByte(percent) {
    return Math.round(clamp(Number(percent) || 0, 0, 100) * 255 / 100);
  }

  function updatePercentVisual(key, value) {
    const pct = clamp(Number(value) || 0, 0, 100);
    const input = q('[data-percent-for="' + key + '"]');
    const meter = q('[data-meter-for="' + key + '"]');
    if (input) input.value = String(Math.round(pct));
    if (meter) meter.style.setProperty("--pct", pct + "%");
  }

  async function commitPercent(key, value) {
    const pct = clamp(Number(value) || 0, 0, 100);
    updatePercentVisual(key, pct);
    if (!connected) return;
    await send(STYLE_COMMANDS[key] + "=" + percentToByte(pct));
  }

  function bindPercentControls() {
    Object.keys(STYLE_COMMANDS).forEach((key) => {
      const input = q('[data-percent-for="' + key + '"]');
      const meter = q('[data-meter-for="' + key + '"]');
      if (!input) return;

      updatePercentVisual(key, input.value);

      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          input.blur();
        }
      });

      input.addEventListener("blur", () => commitPercent(key, input.value));

      qa('[data-step-for="' + key + '"]').forEach((button) => {
        button.addEventListener("click", () => {
          const delta = Number(button.dataset.delta) || 0;
          commitPercent(key, clamp((Number(input.value) || 0) + delta, 0, 100));
        });
      });

      if (meter) {
        const setFromPointer = (event, transmit) => {
          const rect = meter.getBoundingClientRect();
          const pct = clamp((event.clientX - rect.left) / rect.width * 100, 0, 100);
          updatePercentVisual(key, pct);
          if (transmit) commitPercent(key, pct);
        };

        meter.addEventListener("pointerdown", (event) => {
          meter.setPointerCapture(event.pointerId);
          meter.classList.add("dragging");
          setFromPointer(event, false);
        });

        meter.addEventListener("pointermove", (event) => {
          if (meter.hasPointerCapture(event.pointerId)) setFromPointer(event, false);
        });

        meter.addEventListener("pointerup", (event) => {
          if (meter.hasPointerCapture(event.pointerId)) meter.releasePointerCapture(event.pointerId);
          meter.classList.remove("dragging");
          setFromPointer(event, true);
        });
      }
    });
  }

  function hslToHex(hue) {
    const h = ((Number(hue) % 360) + 360) % 360;
    const s = 1;
    const l = 0.5;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }

    const hex = (value) => Math.round((value + m) * 255).toString(16).padStart(2, "0").toUpperCase();
    return "#" + hex(r) + hex(g) + hex(b);
  }

  function setRole(role) {
    activeRole = COLOR_COMMANDS[role] ? role : "main";
    qa(".role[data-role]").forEach((button) => button.classList.toggle("on", button.dataset.role === activeRole));
    if (q("#hueValue")) q("#hueValue").textContent = colors[activeRole];
  }

  async function setColor(role, hex, transmit = true) {
    const normalized = /^#[0-9A-F]{6}$/i.test(hex) ? hex.toUpperCase() : "#FFFFFF";
    colors[role] = normalized;
    const swatch = q("#" + role + "Swatch");
    if (swatch) swatch.style.background = normalized;
    if (activeRole === role && q("#hueValue")) q("#hueValue").textContent = normalized;
    if (transmit && connected) await send(COLOR_COMMANDS[role] + "=" + normalized.slice(1));
  }

  function renderSavedColors() {
    const host = q("#savedColors");
    if (!host) return;
    const saved = loadJSON(SAVED_COLORS_KEY, []);
    const all = [...new Set(BUILTIN_COLORS.concat(saved))];
    host.innerHTML = "";

    all.forEach((hex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "saved-color";
      button.title = hex;
      button.style.setProperty("--saved-color", hex);
      button.style.background = hex;
      button.addEventListener("click", () => setColor(activeRole, hex, true));
      host.append(button);
    });
  }

  function saveCurrentColor() {
    const saved = loadJSON(SAVED_COLORS_KEY, []);
    const hex = colors[activeRole];
    if (!saved.includes(hex) && !BUILTIN_COLORS.includes(hex)) {
      saved.push(hex);
      saveJSON(SAVED_COLORS_KEY, saved.slice(-24));
      renderSavedColors();
    }
  }

  function bindColors() {
    qa(".role[data-role]").forEach((button) => {
      button.addEventListener("click", () => setRole(button.dataset.role));
    });

    const hue = q("#hueRange");
    const host = q("#hueSelector");

    if (hue && host) {
      const preview = () => {
        const hex = hslToHex(hue.value);
        host.style.setProperty("--hx", (Number(hue.value) / 359 * 100) + "%");
        if (q("#hueValue")) q("#hueValue").textContent = hex;
        const swatch = q("#" + activeRole + "Swatch");
        if (swatch) swatch.style.background = hex;
      };

      hue.addEventListener("pointerdown", () => host.classList.add("dragging"));
      hue.addEventListener("pointerup", () => host.classList.remove("dragging"));
      hue.addEventListener("input", preview);
      hue.addEventListener("change", () => setColor(activeRole, hslToHex(hue.value), true));
      preview();
    }

    if (q("#saveColor")) q("#saveColor").addEventListener("click", saveCurrentColor);
    renderSavedColors();
    setRole("main");
    setColor("main", colors.main, false);
    setColor("bg", colors.bg, false);
    setColor("fg", colors.fg, false);
  }

  function currentControlSnapshot() {
    const params = {};
    Object.keys(STYLE_COMMANDS).forEach((key) => {
      const input = q('[data-percent-for="' + key + '"]');
      params[key] = input ? clamp(Number(input.value) || 0, 0, 100) : 50;
    });

    return {
      fxId: Number(currentFx.id),
      fxName: currentFx.name,
      fxKind: currentFx.kind,
      fxPage: currentFx.page,
      colors: { ...colors },
      params,
      direction,
      mirror: mirrorOn,
      duration: 5
    };
  }

  async function applySnapshot(item) {
    await send("FXID=" + clamp(Number(item.fxId) || 0, 0, 255));
    if (item.colors) {
      await send("MAIN=" + String(item.colors.main || "#FFFFFF").replace("#", ""));
      await send("BG=" + String(item.colors.bg || "#000000").replace("#", ""));
      await send("FG=" + String(item.colors.fg || "#8000FF").replace("#", ""));
    }

    Object.keys(STYLE_COMMANDS).forEach((key) => {
      if (item.params && item.params[key] != null) {
        send(STYLE_COMMANDS[key] + "=" + percentToByte(item.params[key]), true);
      }
    });

    await send("DIR=" + (item.direction === "REV" ? "REV" : "FWD"));
    await send("MIRROR=" + (item.mirror ? "1" : "0"));
  }

  function loadPlaylists() {
    const value = loadJSON(PLAYLIST_KEY, []);
    return Array.isArray(value) ? value : [];
  }

  function savePlaylists(playlists) {
    saveJSON(PLAYLIST_KEY, playlists);
  }

  function makeId(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  }

  function createPlaylist(name) {
    const playlists = loadPlaylists();
    const clean = String(name || "").trim() || "My Playlist";
    playlists.push({ id: makeId("pl"), name: clean, items: [] });
    savePlaylists(playlists);
    renderPlaylists();
    return playlists[playlists.length - 1].id;
  }

  function addCurrentToPlaylist() {
    let playlists = loadPlaylists();
    if (!playlists.length) {
      createPlaylist("My Playlist");
      playlists = loadPlaylists();
    }

    const target = playlists[playlists.length - 1];
    if (target.items.length >= 20) {
      log("Playlist limit reached: 20 effects");
      return;
    }

    target.items.push({ id: makeId("fx"), ...currentControlSnapshot() });
    savePlaylists(playlists);
    renderPlaylists();
    log("Added " + currentFx.name + " to " + target.name);
  }

  function updatePlaylistItemDuration(playlistId, itemId, duration) {
    const playlists = loadPlaylists();
    const playlist = playlists.find((item) => item.id === playlistId);
    const entry = playlist && playlist.items.find((item) => item.id === itemId);
    if (!entry) return;
    entry.duration = clamp(Number(duration) || 5, 0.25, 3600);
    savePlaylists(playlists);
  }

  function deletePlaylistItem(playlistId, itemId) {
    const playlists = loadPlaylists();
    const playlist = playlists.find((item) => item.id === playlistId);
    if (!playlist) return;
    playlist.items = playlist.items.filter((item) => item.id !== itemId);
    savePlaylists(playlists);
    renderPlaylists();
  }

  function clearPlaylist(playlistId) {
    const playlists = loadPlaylists();
    const playlist = playlists.find((item) => item.id === playlistId);
    if (!playlist) return;
    playlist.items = [];
    savePlaylists(playlists);
    renderPlaylists();
  }

  async function playPlaylist(playlistId, shuffle = false) {
    const playlists = loadPlaylists();
    const playlist = playlists.find((item) => item.id === playlistId);
    if (!playlist || !playlist.items.length || !connected) return;

    const token = ++playlistRunToken;
    let items = playlist.items.slice();

    if (shuffle) {
      items = items.sort(() => Math.random() - 0.5);
    }

    log("PLAYLIST START: " + playlist.name);

    for (const item of items) {
      if (token !== playlistRunToken) break;
      currentFx = {
        id: item.fxId,
        name: item.fxName || ("FX " + item.fxId),
        kind: item.fxKind || "",
        page: item.fxPage || "effects"
      };
      setSummary();
      markSelectedEffect();
      await applySnapshot(item);
      await sleep(clamp(Number(item.duration) || 5, 0.25, 3600) * 1000);
    }

    if (token === playlistRunToken) log("PLAYLIST COMPLETE: " + playlist.name);
  }

  function stopPlaylists() {
    playlistRunToken++;
    log("PLAYLIST STOP");
  }

  function renderPlaylists() {
    const host = q("#namedPlaylistsContainer");
    if (!host) return;
    const playlists = loadPlaylists();

    if (!playlists.length) {
      host.innerHTML = '<div class="microcopy" style="text-align:center;padding:16px 0">No playlists yet. Create one above or add the current effect.</div>';
      return;
    }

    host.innerHTML = "";

    playlists.forEach((playlist) => {
      const wrap = document.createElement("section");
      wrap.className = "named-playlist";

      const header = document.createElement("div");
      header.className = "playlist-accordion-header";
      header.innerHTML =
        '<div><strong>' + playlist.name.replace(/[<>&]/g, "") + '</strong> <span class="playlist-count-pill">' +
        playlist.items.length + ' / 20</span></div>';

      const controls = document.createElement("div");
      controls.className = "playlist-controls-row";

      const play = document.createElement("button");
      play.className = "glass-btn primary";
      play.textContent = "PLAY";
      play.addEventListener("click", () => playPlaylist(playlist.id, false));

      const shuffle = document.createElement("button");
      shuffle.className = "glass-btn";
      shuffle.textContent = "SHUFFLE";
      shuffle.addEventListener("click", () => playPlaylist(playlist.id, true));

      const stop = document.createElement("button");
      stop.className = "glass-btn";
      stop.textContent = "STOP";
      stop.addEventListener("click", stopPlaylists);

      const add = document.createElement("button");
      add.className = "glass-btn";
      add.textContent = "+ CURRENT FX";
      add.addEventListener("click", () => {
        const playlistsNow = loadPlaylists();
        const selected = playlistsNow.find((item) => item.id === playlist.id);
        if (!selected || selected.items.length >= 20) return;
        selected.items.push({ id: makeId("fx"), ...currentControlSnapshot() });
        savePlaylists(playlistsNow);
        renderPlaylists();
      });

      const clear = document.createElement("button");
      clear.className = "glass-btn danger";
      clear.textContent = "CLEAR";
      clear.addEventListener("click", () => clearPlaylist(playlist.id));

      controls.append(play, stop, shuffle, add, clear);

      const list = document.createElement("div");
      list.className = "playlist-list";

      playlist.items.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "playlist-item";

        const num = document.createElement("span");
        num.className = "playlist-num";
        num.textContent = String(index + 1);

        const copy = document.createElement("div");
        copy.className = "sequence-copy";
        copy.innerHTML = '<strong>' + String(item.fxName || ("FX " + item.fxId)).replace(/[<>&]/g, "") + '</strong><small>WLED FX ' + item.fxId + '</small>';

        const durationWrap = document.createElement("label");
        durationWrap.className = "duration-wrap";
        durationWrap.innerHTML = '<span>DURATION</span><input class="glass-field" type="number" min="0.25" max="3600" step="0.25" value="' +
          clamp(Number(item.duration) || 5, 0.25, 3600) + '">';
        durationWrap.querySelector("input").addEventListener("change", (event) => {
          updatePlaylistItemDuration(playlist.id, item.id, event.currentTarget.value);
        });

        const actions = document.createElement("div");
        actions.className = "button-row";
        const remove = document.createElement("button");
        remove.className = "tiny-btn";
        remove.textContent = "DELETE";
        remove.addEventListener("click", () => deletePlaylistItem(playlist.id, item.id));
        actions.append(remove);

        row.append(num, copy, durationWrap, actions);
        list.append(row);
      });

      wrap.append(header, controls, list);
      host.append(wrap);
    });
  }

  function bindDirectionMirror() {
    const fwd = q("#dirFwdBtn");
    const rev = q("#dirRevBtn");
    const mirror = q("#mirrorBtn");

    function paintDir() {
      if (fwd) fwd.classList.toggle("is-active", direction === "FWD");
      if (rev) rev.classList.toggle("is-active", direction === "REV");
    }

    if (fwd) fwd.addEventListener("click", () => {
      direction = "FWD";
      paintDir();
      send("DIR=FWD");
    });

    if (rev) rev.addEventListener("click", () => {
      direction = "REV";
      paintDir();
      send("DIR=REV");
    });

    if (mirror) mirror.addEventListener("click", () => {
      mirrorOn = !mirrorOn;
      mirror.classList.toggle("primary", mirrorOn);
      mirror.textContent = mirrorOn ? "MIRROR ON" : "MIRROR OFF";
      send("MIRROR=" + (mirrorOn ? "1" : "0"));
    });

    paintDir();
  }

  qa(".tab").forEach((button) => {
    button.addEventListener("click", () => showPage(button.dataset.page));
  });

  if (q("#connectHub")) q("#connectHub").addEventListener("click", connectHub);
  if (q("#disconnectHub")) q("#disconnectHub").addEventListener("click", disconnectHub);
  if (q("#readStatus")) q("#readStatus").addEventListener("click", readStatus);
  if (q("#blackout")) q("#blackout").addEventListener("click", () => send("OFF"));

  if (q("#sendBannerText")) q("#sendBannerText").addEventListener("click", () => sendText(q("#bannerText").value));
  if (q("#clearBannerText")) q("#clearBannerText").addEventListener("click", () => {
    q("#bannerText").value = "";
    sendText("");
  });
  if (q("#bannerText")) q("#bannerText").addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendText(event.currentTarget.value);
    }
  });

  if (q("#loadPreset")) q("#loadPreset").addEventListener("click", () => {
    const slot = clamp(Number(q("#presetSlot").value) || 1, 1, 250);
    send("PLOAD=" + slot);
  });

  if (q("#savePreset")) q("#savePreset").addEventListener("click", () => {
    const slot = clamp(Number(q("#presetSlot").value) || 1, 1, 250);
    send("PSAVE=" + slot);
  });

  if (q("#deletePreset")) q("#deletePreset").addEventListener("click", () => {
    const slot = clamp(Number(q("#presetSlot").value) || 1, 1, 250);
    send("PDEL=" + slot);
  });

  if (q("#sendRaw")) q("#sendRaw").addEventListener("click", () => {
    const value = String(q("#rawCommand").value || "").trim();
    if (value) send(value);
  });

  if (q("#rawCommand")) q("#rawCommand").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const value = String(event.currentTarget.value || "").trim();
      if (value) send(value);
    }
  });

  if (q("#createNamedPlaylist")) q("#createNamedPlaylist").addEventListener("click", () => {
    const field = q("#newPlaylistName");
    createPlaylist(field ? field.value : "");
    if (field) field.value = "";
  });

  if (q("#addFxPlaylist")) q("#addFxPlaylist").addEventListener("click", addCurrentToPlaylist);
  if (q("#addBannerPlaylist")) q("#addBannerPlaylist").addEventListener("click", addCurrentToPlaylist);

  renderFx("#stripFxList", LINE_AUDIO_FX, "#stripFxSearch", "#stripFxCount", "effects");
  renderFx("#bannerFxList", BANNER_FX, "#bannerFxSearch", "#bannerFxCount", "banner");
  bindPercentControls();
  bindColors();
  bindDirectionMirror();
  renderPlaylists();
  setSummary();
  setConnectionUI(false);
  updateClientStatus();
  log("WLED host/client preview ready. Connect shynetyme.works1 over Bluetooth.");

  setInterval(() => {
    updateClientStatus();
  }, 1000);

  setInterval(() => {
    if (connected) readStatus();
  }, 5000);
})();