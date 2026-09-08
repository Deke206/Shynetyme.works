"use strict";
(() => {
  const q = (s) => document.querySelector(s);
  const qa = (s) => [...document.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const FX_EFFECTS = [
    "SOLID","RAINBOW","RAINBOW_GLITTER","COMET","METEOR","SCANNER","DUAL_SCANNER","POLICE",
    "CHASE","TRICOLOR_CHASE","RUNNING_DOTS","THEATER","WIPE","FLOW","FLOW_STRIPE","COLOR_WAVES",
    "SPARKLE","GLITTER","TWINKLE","TWINKLEFOX","TWINKLECAT","FIREWORKS","RAIN","TETRIX","FIRE",
    "LIGHTNING","PACIFICA","SUNRISE","DANCING_SHADOWS","PRIDE","SINELON","JUGGLE","BOUNCING_BALLS",
    "LAVA_LAMP","MAGMA","AURORA","BREATHE","FLASH","DUAL_FLASH"
  ];

  const MUSIC_EFFECTS = [
    "SPECTRUM","VU","AUDIO_PULSE","BEAT_FLASH","SONIC_STREAM","SONIC_BOOM",
    "RIPPLE","STARBURST","POPCORN","DRIPDROP","HEARTBEAT"
  ];
  const MUSIC_SET = new Set(MUSIC_EFFECTS);

  const EFFECT_META = {
    SOLID: "1 COLOR",
    RAINBOW: "BUILT-IN COLOR",
    RAINBOW_GLITTER: "BUILT-IN + MAIN",
    POLICE: "2 COLORS",
    FLASH: "2 COLORS",
    DUAL_FLASH: "2 COLORS",
    SPECTRUM: "MUSIC · 3 COLORS",
    VU: "MUSIC · 3 COLORS",
    AUDIO_PULSE: "MUSIC · 3 COLORS",
    BEAT_FLASH: "MUSIC · 3 COLORS",
    SONIC_STREAM: "MUSIC · 3 COLORS",
    SONIC_BOOM: "MUSIC · 3 COLORS",
    RIPPLE: "MUSIC · 3 COLORS",
    STARBURST: "MUSIC · 3 COLORS",
    POPCORN: "MUSIC · 3 COLORS",
    DRIPDROP: "MUSIC · 3 COLORS",
    HEARTBEAT: "MUSIC · 3 COLORS"
  };

  const SAVED_KEY = "stw-esp32-saved-colors-v2";
  const PRESET_KEY = "stw-esp32-presets-v4";
  const PLAYLIST_KEY = "stw-esp32-custom-v4";
  const PLAYLIST_NAME_KEY = "stw-esp32-playlist-name-v2";
  const SHUFFLE_KEY = "stw-esp32-playlist-shuffle-v1";
  const DEFAULT_PLAYLIST_SECONDS = 5;
  const REQUIRED_COLORS = ["#DFFF00", "#FF00AA", "#0080FF", "#FFFFFF", "#000000"];

  const AUDIO_BANDS = [
    [43,86],[86,129],[129,216],[216,301],[301,430],[430,560],[560,818],[818,1120],
    [1120,1421],[1421,1895],[1895,2412],[2412,3015],[3015,3704],[3704,4479],[4479,7106],[7106,9259]
  ];

  let snap = window.STWBLE?.snapshot?.() || { devices: [], groups: [], target: null, passkey: false, granted: [] };
  let activePage = "device";
  let activeFx = "RAINBOW";
  let activeRole = "main";
  let formDirty = false;

  let playlistRunning = false;
  let playlistShuffle = localStorage.getItem(SHUFFLE_KEY) === "1";
  let playlistRunToken = 0;
  let playlistTimer = 0;
  let playlistLastIndex = -1;

  let micOn = false;
  let micStream = null;
  let audioCtx = null;
  let analyser = null;
  let audioRaf = 0;
  let lastAudioFrame = 0;
  let bassBase = 12;
  let lastBeat = 0;
  let pendingAudio = null;
  let audioPumpBusy = false;
  let audioTxOk = 0;
  let audioTxFail = 0;
  let verifyTimer = 0;
  let lastVerifiedArx = null;

  function loadJSON(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function prettyFx(fx) {
    return String(fx || "").replace(/^PS_/, "PS ").replaceAll("_", " ");
  }

  function log(message) {
    const out = q("#debugLog");
    if (!out) return;
    const ts = new Date().toLocaleTimeString();
    out.textContent = `${ts}  ${message}\n${out.textContent}`.slice(0, 8000);
  }

  function selectedDevice() {
    return snap.target?.type === "device" ? snap.devices.find((d) => d.id === snap.target.id) || null : null;
  }

  function primaryTarget() {
    if (snap.target?.type === "device") return selectedDevice();
    if (snap.target?.type === "group") {
      const g = snap.groups.find((x) => x.id === snap.target.id);
      return snap.devices.find((d) => g?.members?.includes(d.id)) || null;
    }
    return null;
  }

  function currentStatus() {
    return primaryTarget()?.lastStatus || {};
  }

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

  function updateGate() {
    qa(".tab.gated").forEach((b) => {
      b.classList.toggle("locked", !snap.passkey);
      b.setAttribute("aria-disabled", snap.passkey ? "false" : "true");
    });
    ["fxcolor","music","presets","custom"].forEach((id) => q(`#${id}`)?.classList.toggle("locked-page", !snap.passkey));
    if (!snap.passkey && activePage !== "device") showPage("device", false);
  }

  async function showPage(id, userAction = true) {
    if (id !== "device" && !snap.passkey) id = "device";
    activePage = id;
    qa(".tab").forEach((b) => b.classList.toggle("on", b.dataset.page === id));
    qa(".page").forEach((p) => p.classList.toggle("on", p.id === id));

    if (id === "music" && userAction && snap.passkey) {
      stopPlaylist("Playlist stopped for MUSIC", true);
      await selectMusicEffect("SPECTRUM", { enableAudio: true, logIt: false });
    }
  }

  qa(".tab").forEach((b) => b.addEventListener("click", () => showPage(b.dataset.page, true)));

  function updateHeader() {
    q("#stateDevice").textContent = snap.targetLabel || "NONE";
    q("#stateFx").textContent = prettyFx(activeFx);
    q("#bleSummary").textContent = `${snap.devices.filter((d) => d.bleStatus === "connected").length} LOCAL BLE`;
    updateGate();
    paintStateStrip();
  }

  function currentPalette() {
    return {
      main: (q("#main")?.value || "#FFFFFF").toUpperCase(),
      bg: (q("#bg")?.value || "#000000").toUpperCase(),
      fg: (q("#fg")?.value || "#8000FF").toUpperCase()
    };
  }

  function setPaletteUI(p) {
    for (const role of ["main","bg","fg"]) {
      const value = (p[role] || currentPalette()[role]).toUpperCase();
      if (q(`#${role}`)) q(`#${role}`).value = value;
      if (q(`#${role}Swatch`)) q(`#${role}Swatch`).style.background = value;
    }
    syncHue();
  }

  function paintStateStrip() {
    const host = q("#stateStrip");
    if (!host) return;
    if (!host.children.length) {
      for (let i = 0; i < 30; i++) host.append(document.createElement("i"));
    }
    const p = currentPalette();
    [...host.children].forEach((el, i) => {
      if (activeFx === "RAINBOW" || activeFx === "RAINBOW_GLITTER") {
        el.style.background = `hsl(${(i * 12 + Date.now()/40) % 360} 100% 55%)`;
      } else {
        el.style.background = i % 3 === 0 ? p.bg : (i % 3 === 1 ? p.fg : p.main);
      }
    });
  }
  setInterval(() => { if (activeFx.startsWith("RAINBOW")) paintStateStrip(); }, 120);

  function renderDevices() {
    const host = q("#deviceList");
    if (!host) return;
    host.innerHTML = "";
    for (const d of snap.devices) {
      const selected = snap.target?.type === "device" && snap.target.id === d.id;
      const card = document.createElement("article");
      card.className = `device-card${selected ? " selected" : ""}`;
      card.dataset.id = d.id;
      card.innerHTML = `<div class="esp32-art"><span class="esp32-chip">ESP32</span><span class="esp32-usb"></span></div><div class="device-info"><div class="device-name"></div><div class="device-bt"></div></div><i class="ble-dot ${d.bleStatus}"></i><button class="power-ring ${d.powered ? "on" : ""}" aria-label="Power">⏻</button>`;
      card.querySelector(".device-name").textContent = d.name;
      card.querySelector(".device-bt").textContent = d.bluetoothName || "Bluetooth not assigned";
      card.addEventListener("click", (e) => {
        if (e.target.closest(".power-ring")) return;
        window.STWBLE.selectDevice(d.id);
      });
      card.querySelector(".power-ring").addEventListener("click", async (e) => {
        e.stopPropagation();
        try { await window.STWBLE.togglePower(d.id); } catch (err) { log(err.message); }
      });
      host.append(card);
    }
  }

  function populateGranted() {
    const sel = q("#grantedBluetooth");
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="">Previously granted Bluetooth devices</option>';
    const seen = new Set();
    for (const b of snap.granted || []) {
      const o = document.createElement("option");
      o.value = b.id; o.textContent = b.name || b.id; sel.append(o); seen.add(b.id);
    }
    for (const d of snap.devices) {
      if (!d.bluetoothId || seen.has(d.bluetoothId)) continue;
      const o = document.createElement("option");
      o.value = d.bluetoothId; o.textContent = `${d.bluetoothName || d.name} — SAVED`; sel.append(o); seen.add(d.bluetoothId);
    }
    if ([...sel.options].some((o) => o.value === cur)) sel.value = cur;
    else if (selectedDevice()?.bluetoothId) sel.value = selectedDevice().bluetoothId;
  }

  function loadDeviceForm(force = false) {
    const d = selectedDevice();
    q("#deviceTools")?.classList.toggle("locked-panel", !d);
    if (!d) return;
    if (formDirty && !force) return;
    q("#settingsDeviceName").textContent = d.name;
    q("#deviceName").value = d.name;
    q("#leds").value = d.config?.leds ?? 300;
    q("#gpio").value = d.config?.gpio ?? 13;
    q("#order").value = d.config?.order || "GRB";
    q("#segFrom").value = d.config?.segFrom ?? 0;
    q("#segTo").value = d.config?.segTo ?? Math.max(0, (d.config?.leds ?? 300) - 1);
    q("#startupFx").value = FX_EFFECTS.includes(d.config?.startupFx) ? d.config.startupFx : "RAINBOW";
    formDirty = false;
  }

  ["deviceName","leds","gpio","order","segFrom","segTo","startupFx"].forEach((id) => q(`#${id}`)?.addEventListener("input", () => { formDirty = true; }));

  q("#addLogicalDevice")?.addEventListener("click", () => window.STWBLE.addLogicalDevice());
  q("#addBluetooth")?.addEventListener("click", async () => {
    let d = selectedDevice();
    if (!d && snap.devices[0]) { window.STWBLE.selectDevice(snap.devices[0].id); await sleep(0); snap = window.STWBLE.snapshot(); d = selectedDevice(); }
    if (!d) return;
    try { await window.STWBLE.assignNew(d.id); } catch (e) { log(e.name === "NotFoundError" ? "Bluetooth selection cancelled." : e.message); }
  });
  q("#assignGranted")?.addEventListener("click", async () => {
    const d = selectedDevice(), btId = q("#grantedBluetooth")?.value;
    if (!d || !btId) return;
    try { await window.STWBLE.assignGranted(d.id, btId); } catch (e) { log(e.message); }
  });
  q("#reconnectSelected")?.addEventListener("click", async () => {
    const d = selectedDevice(); if (!d) return;
    try {
      await window.STWBLE.refreshGranted();
      const ok = d.bluetoothId ? await window.STWBLE.connectAssigned(d.id) : false;
      if (!ok) log("Saved Bluetooth connection unavailable. Use ADD BLUETOOTH — ONE TIME.");
    } catch (e) { log(e.message); }
  });
  q("#unassignBluetooth")?.addEventListener("click", () => { const d = selectedDevice(); if (d) window.STWBLE.unassignBluetooth(d.id); });

  function deviceFormConfig() {
    return {
      leds: +q("#leds").value,
      gpio: +q("#gpio").value,
      order: q("#order").value,
      segFrom: +q("#segFrom").value,
      segTo: +q("#segTo").value,
      startupFx: q("#startupFx").value
    };
  }

  async function saveSettings(reboot) {
    const d = selectedDevice(); if (!d) return;
    try {
      const cfg = deviceFormConfig();
      await window.STWBLE.saveDeviceConfig(d.id, cfg, { reboot: false });
      window.STWBLE.renameDevice(d.id, q("#deviceName").value);
      if (reboot) {
        const startup = cfg.startupFx || "RAINBOW";
        const ok = await sendDevice(d.id, `FX=${startup}`);
        if (!ok) throw new Error("Startup effect write failed");
        if (!(await sendDevice(d.id, "SAVE"))) throw new Error("Startup save failed");
        if (!(await sendDevice(d.id, "REBOOT"))) throw new Error("Reboot command failed");
      }
      formDirty = false;
      log(reboot ? "Settings saved; selected startup effect saved; reboot sent." : "Device settings saved.");
    } catch (e) { log(`Settings: ${e.message}`); }
  }
  q("#saveDeviceSettings")?.addEventListener("click", () => saveSettings(false));
  q("#saveDeviceReboot")?.addEventListener("click", () => saveSettings(true));
  q("#saveStartup")?.addEventListener("click", async () => {
    const d = selectedDevice(); if (!d) return;
    const startupFx = q("#startupFx").value || "RAINBOW";
    const restoreFx = currentStatus().FX || d.lastFx || activeFx || "RAINBOW";
    try {
      await window.STWBLE.saveStartup(d.id, `FX=${startupFx}`, `FX=${restoreFx}`, startupFx);
      log(`Startup effect saved: ${startupFx}`);
    } catch (e) { log(`Startup: ${e.message}`); }
  });

  q("#readStatus")?.addEventListener("click", async () => {
    const ids = window.STWBLE.targetMemberIds();
    if (!ids.length) return;
    for (const id of ids) {
      const s = await window.STWBLE.readStatus(id);
      if (s) log(`STATUS ${id}: ${Object.entries(s).map(([k,v]) => `${k}=${v}`).join(" · ")}`);
    }
  });
  q("#blackout")?.addEventListener("click", async () => { stopMusic(true); stopPlaylist("Stopped", true); if (await send("FX=OFF")) { activeFx = "OFF"; window.STWBLE.setLastFx("OFF"); updateHeader(); } });
  q("#sendRaw")?.addEventListener("click", async () => { const cmd = q("#rawCommand").value.trim(); if (cmd) { const ok = await send(cmd); log(`${ok ? "TX" : "TX FAIL"}: ${cmd}`); } });

  function renderGroups() {
    const host = q("#groupList"); if (!host) return;
    host.innerHTML = "";
    for (const g of snap.groups) {
      const card = document.createElement("article");
      card.className = "group-card";
      const selected = snap.target?.type === "group" && snap.target.id === g.id;
      card.innerHTML = `<div class="group-title"><b></b><button class="tiny-btn select">${selected ? "SELECTED" : "SELECT"}</button><button class="tiny-btn danger del">DELETE</button></div><div class="group-members"></div>`;
      card.querySelector("b").textContent = g.name;
      const members = card.querySelector(".group-members");
      for (const d of snap.devices) {
        const label = document.createElement("label");
        label.innerHTML = `<input type="checkbox" value="${d.id}" ${g.members.includes(d.id) ? "checked" : ""}> ${d.name}`;
        label.querySelector("input").addEventListener("change", () => {
          const ids = [...members.querySelectorAll("input:checked")].map((x) => x.value);
          window.STWBLE.setGroupMembers(g.id, ids);
        });
        members.append(label);
      }
      card.querySelector(".select").addEventListener("click", () => window.STWBLE.selectGroup(g.id));
      card.querySelector(".del").addEventListener("click", () => window.STWBLE.deleteGroup(g.id));
      host.append(card);
    }
  }
  q("#createGroup")?.addEventListener("click", () => {
    try { window.STWBLE.createGroup(q("#groupName").value); q("#groupName").value = ""; } catch (e) { log(e.message); }
  });

  function updateSlider(x) {
    if (!x) return;
    const min = +x.min || 0, max = +x.max || 255;
    const pct = clamp(((+x.value - min) / (max - min)) * 100, 0, 100);
    const rail = x.closest(".sim-slider");
    if (rail) {
      const fill = rail.querySelector(".fill"), thumb = rail.querySelector(".thumb");
      if (fill) fill.style.width = `${pct}%`;
      if (thumb) thumb.style.left = `${pct}%`;
    }
    const out = q(`#${x.id}V`);
    if (out) out.textContent = x.id === "micSensitivity" ? `${(+x.value / 100).toFixed(2)}×` : `${Math.round(pct)}%`;
  }
  function updateAllSliders() { qa(".sim-slider input").forEach(updateSlider); }

  const SLIDERS = { bri: "BRI", spd: "SPD", int: "BGB", size: "SIZE", dens: "DENS", trail: "TRAIL" };
  for (const [id, key] of Object.entries(SLIDERS)) {
    const x = q(`#${id}`); if (!x) continue;
    let timer = 0;
    x.addEventListener("input", () => {
      updateSlider(x); clearTimeout(timer);
      timer = setTimeout(() => send(`${key}=${x.value}`, { fast: true }), 55);
    });
    x.addEventListener("change", () => { clearTimeout(timer); send(`${key}=${x.value}`, { fast: true }); });
  }
  q("#dir")?.addEventListener("change", () => send(`DIR=${q("#dir").value}`, { fast: true }));
  q("#mirrorBtn")?.addEventListener("click", () => {
    q("#mirror").checked = !q("#mirror").checked;
    q("#mirrorBtn").classList.toggle("primary", q("#mirror").checked);
    send(`MIRROR=${q("#mirror").checked ? 1 : 0}`, { fast: true });
  });

  function rgbToHue(hex) {
    const h = hex.replace("#", "");
    const r = parseInt(h.slice(0,2),16)/255, g = parseInt(h.slice(2,4),16)/255, b = parseInt(h.slice(4,6),16)/255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max-min;
    if (!d) return 0;
    let hue = max === r ? 60 * (((g-b)/d)%6) : max === g ? 60 * ((b-r)/d + 2) : 60 * ((r-g)/d + 4);
    return hue < 0 ? hue + 360 : hue;
  }
  function hueHex(h) {
    const c = 1, x = 1 - Math.abs(((h/60)%2)-1);
    let r=0,g=0,b=0;
    if (h<60){r=c;g=x;} else if(h<120){r=x;g=c;} else if(h<180){g=c;b=x;} else if(h<240){g=x;b=c;} else if(h<300){r=x;b=c;} else {r=c;b=x;}
    const z=(v)=>Math.round(v*255).toString(16).padStart(2,"0").toUpperCase();
    return `#${z(r)}${z(g)}${z(b)}`;
  }
  function syncHue() {
    const value = currentPalette()[activeRole];
    const h = rgbToHue(value);
    if (q("#hueRange")) q("#hueRange").value = Math.round(h);
    if (q("#hueSelector")) q("#hueSelector").style.setProperty("--hx", `${h/359*100}%`);
    if (q("#hueValue")) { q("#hueValue").textContent = value; q("#hueValue").style.color = value; }
  }
  qa(".role").forEach((b) => b.addEventListener("click", () => {
    activeRole = b.dataset.role;
    qa(".role").forEach((x) => x.classList.toggle("on", x === b));
    syncHue();
  }));
  q("#hueRange")?.addEventListener("input", () => {
    updateSlider(q("#hueRange"));
    const hex = hueHex(+q("#hueRange").value);
    q(`#${activeRole}`).value = hex;
    q(`#${activeRole}Swatch`).style.background = hex;
    q("#hueValue").textContent = hex; q("#hueValue").style.color = hex;
  });
  q("#hueRange")?.addEventListener("change", async () => {
    const p = currentPalette();
    await send(`MAIN=${p.main.slice(1)};BG=${p.bg.slice(1)};FG=${p.fg.slice(1)}`, { fast: true });
    paintStateStrip();
  });

  function savedColors() {
    const list = loadJSON(SAVED_KEY, REQUIRED_COLORS);
    return [...new Set([...REQUIRED_COLORS, ...list].map((x) => String(x).toUpperCase()))].slice(0,24);
  }
  function renderSavedColors() {
    const host = q("#savedColors"); if (!host) return;
    host.innerHTML = "";
    for (const c of savedColors()) {
      const b = document.createElement("button");
      b.className = "saved-color"; b.style.setProperty("--c", c); b.title = c;
      b.addEventListener("click", async () => {
        q(`#${activeRole}`).value = c; q(`#${activeRole}Swatch`).style.background = c; syncHue();
        const p = currentPalette(); await send(`MAIN=${p.main.slice(1)};BG=${p.bg.slice(1)};FG=${p.fg.slice(1)}`, { fast: true }); paintStateStrip();
      });
      host.append(b);
    }
  }
  q("#saveColor")?.addEventListener("click", () => { const c = currentPalette()[activeRole]; saveJSON(SAVED_KEY, [c, ...savedColors().filter((x)=>x!==c)]); renderSavedColors(); });

  function renderEffects() {
    const host = q("#effectList"); if (!host) return;
    const filter = (q("#fxSearch")?.value || "").trim().toLowerCase();
    host.innerHTML = "";
    const shown = FX_EFFECTS.filter((fx) => !filter || prettyFx(fx).toLowerCase().includes(filter));
    q("#fxCount").textContent = `${shown.length}/${FX_EFFECTS.length}`;
    for (const fx of shown) {
      const b = document.createElement("button");
      b.className = `fx-item${activeFx === fx ? " on" : ""}`;
      b.dataset.fx = fx;
      b.innerHTML = `<span>${prettyFx(fx)}</span><small>${EFFECT_META[fx] || "3 COLORS"}</small>`;
      b.addEventListener("click", () => selectNormalEffect(fx));
      host.append(b);
    }
  }
  q("#fxSearch")?.addEventListener("input", renderEffects);

  async function selectNormalEffect(fx) {
    stopPlaylist("Playlist stopped", true);
    stopMusic(true);
    const ok = await send(`FX=${fx}`);
    if (!ok) return false;
    activeFx = fx; window.STWBLE.setLastFx(fx); updateHeader(); renderEffects();
    return true;
  }

  function syncFromStatus(status) {
    if (!status) return;
    if (status.FX) activeFx = status.FX;
    const p = {
      main: status.MAIN ? `#${status.MAIN}` : currentPalette().main,
      bg: status.BG ? `#${status.BG}` : currentPalette().bg,
      fg: status.FG ? `#${status.FG}` : currentPalette().fg
    };
    setPaletteUI(p);
    const map = { bri: "BRI", spd: "SPD", int: "BGB", size: "SIZE", dens: "DENS", trail: "TRAIL" };
    for (const [id,key] of Object.entries(map)) if (status[key] != null && q(`#${id}`)) { q(`#${id}`).value = status[key]; updateSlider(q(`#${id}`)); }
    if (status.DIR && q("#dir")) q("#dir").value = status.DIR;
    if (status.MIRROR != null && q("#mirror")) { q("#mirror").checked = +status.MIRROR > 0; q("#mirrorBtn")?.classList.toggle("primary", q("#mirror").checked); }
    updateHeader(); renderEffects();
    if (q("#musicFx") && MUSIC_SET.has(activeFx)) q("#musicFx").value = activeFx;
  }

  function captureState(name = activeFx) {
    const p = currentPalette();
    return {
      name, fx: activeFx, ...p,
      bri: +q("#bri").value,
      bgb: +q("#int").value,
      spd: +q("#spd").value,
      size: +q("#size").value,
      dens: +q("#dens").value,
      trail: +q("#trail").value,
      dir: q("#dir").value,
      mirror: q("#mirror").checked,
      durationSec: DEFAULT_PLAYLIST_SECONDS
    };
  }

  function buildStateCommand(s) {
    return [
      `FX=${s.fx || activeFx}`,
      `MAIN=${String(s.main || currentPalette().main).replace("#","")}`,
      `BG=${String(s.bg || currentPalette().bg).replace("#","")}`,
      `FG=${String(s.fg || currentPalette().fg).replace("#","")}`,
      `BRI=${s.bri ?? q("#bri").value}`,
      `BGB=${s.bgb ?? s.int ?? q("#int").value}`,
      `SPD=${s.spd ?? q("#spd").value}`,
      `SIZE=${s.size ?? q("#size").value}`,
      `DENS=${s.dens ?? q("#dens").value}`,
      `TRAIL=${s.trail ?? q("#trail").value}`,
      `DIR=${s.dir || q("#dir").value}`,
      `MIRROR=${s.mirror ? 1 : 0}`
    ].join(";");
  }

  async function applyState(s) {
    if (MUSIC_SET.has(s.fx)) {
      await showPage("music", false);
      await selectMusicEffect(s.fx, { enableAudio: true });
      return;
    }
    stopMusic(true);
    activeFx = s.fx || activeFx;
    setPaletteUI({ main:s.main, bg:s.bg, fg:s.fg });
    if (s.bri != null) q("#bri").value = s.bri;
    if (s.bgb != null || s.int != null) q("#int").value = s.bgb ?? s.int;
    for (const id of ["spd","size","dens","trail"]) if (s[id] != null) q(`#${id}`).value = s[id];
    q("#dir").value = s.dir || "FWD"; q("#mirror").checked = !!s.mirror; updateAllSliders();
    const ok = await send(buildStateCommand(s));
    if (ok) { window.STWBLE.setLastFx(activeFx); updateHeader(); renderEffects(); }
  }

  function presets() { const x = loadJSON(PRESET_KEY, []); return Array.isArray(x) ? x : []; }
  function savePresets(x) { saveJSON(PRESET_KEY, x.slice(0,50)); }
  function renderPresets() {
    const host = q("#presetGrid"); if (!host) return;
    const list = presets(); q("#presetCount").textContent = list.length ? `${list.length} SAVED` : ""; host.innerHTML = "";
    if (!list.length) { host.innerHTML = '<div class="microcopy" style="text-align:center">No presets saved yet.</div>'; return; }
    list.forEach((p,i) => {
      const card = document.createElement("article"); card.className = "preset-card";
      card.innerHTML = '<div class="preset-title"></div><div class="preset-meta"></div><div class="preset-colors"><i></i><i></i><i></i></div><div class="button-row"><button class="tiny-btn load">LOAD</button><button class="tiny-btn add">+ PLAYLIST</button><button class="tiny-btn danger del">DELETE</button></div>';
      card.querySelector(".preset-title").textContent = p.name || prettyFx(p.fx); card.querySelector(".preset-meta").textContent = prettyFx(p.fx);
      [p.main,p.bg,p.fg].forEach((c,n) => { if (card.querySelectorAll(".preset-colors i")[n]) card.querySelectorAll(".preset-colors i")[n].style.background = c || "#000000"; });
      card.querySelector(".load").addEventListener("click", () => applyState(p));
      card.querySelector(".add").addEventListener("click", () => addPlaylist(p));
      card.querySelector(".del").addEventListener("click", () => { const x=presets(); x.splice(i,1); savePresets(x); renderPresets(); });
      host.append(card);
    });
  }
  function saveCurrentPreset() {
    const name = prompt("Preset name", prettyFx(activeFx)); if (name === null) return;
    const list = presets(); list.unshift(captureState(name.trim() || prettyFx(activeFx))); savePresets(list); renderPresets();
  }
  q("#saveFxPreset")?.addEventListener("click", saveCurrentPreset);
  q("#saveCurrentPreset")?.addEventListener("click", saveCurrentPreset);

  function playlist() {
    const x = loadJSON(PLAYLIST_KEY, []);
    if (!Array.isArray(x)) return [];
    let changed = false;
    x.forEach((s) => {
      const n = Number(s.durationSec ?? s.duration ?? DEFAULT_PLAYLIST_SECONDS);
      const d = Number.isFinite(n) ? clamp(n,0.25,3600) : DEFAULT_PLAYLIST_SECONDS;
      if (s.durationSec !== d) { s.durationSec = d; changed = true; }
      if (Object.prototype.hasOwnProperty.call(s,"duration")) { delete s.duration; changed = true; }
    });
    if (changed) saveJSON(PLAYLIST_KEY,x);
    return x;
  }
  function savePlaylist(x) { saveJSON(PLAYLIST_KEY, x.slice(0,100)); }
  function addPlaylist(state) {
    if (MUSIC_SET.has(state.fx)) { log("Music effects are live in the MUSIC tab and are not added to the normal playlist."); return; }
    const list = playlist(); list.push({ ...state, durationSec: Number(state.durationSec) || DEFAULT_PLAYLIST_SECONDS }); savePlaylist(list); renderPlaylist();
  }
  q("#addFxPlaylist")?.addEventListener("click", () => addPlaylist(captureState(prettyFx(activeFx))));
  q("#addCurrentFx")?.addEventListener("click", () => addPlaylist(captureState(prettyFx(activeFx))));

  function renderPlaylist() {
    const host = q("#playlistList"); if (!host) return;
    const list = playlist(); host.innerHTML = "";
    if (!list.length) { host.innerHTML = '<div class="microcopy" style="text-align:center">Playlist is empty.</div>'; return; }
    list.forEach((s,i) => {
      const row = document.createElement("article"); row.className = "playlist-item";
      row.innerHTML = '<span class="playlist-num"></span><span><b></b><small></small></span><label style="display:grid;grid-template-columns:auto 70px;gap:5px;align-items:center;margin-left:auto"><small>TIME SEC</small><input class="glass-field duration" type="number" min="0.25" max="3600" step="0.25"></label><div class="button-row"><button class="tiny-btn load">LOAD</button><button class="tiny-btn danger del">DELETE</button></div>';
      row.querySelector(".playlist-num").textContent = i+1; row.querySelector("b").textContent = s.name || prettyFx(s.fx); row.querySelector("small").textContent = prettyFx(s.fx);
      const dur = row.querySelector(".duration"); dur.value = s.durationSec || DEFAULT_PLAYLIST_SECONDS;
      dur.addEventListener("change", () => { const x=playlist(); if(!x[i])return; x[i].durationSec=clamp(+dur.value||DEFAULT_PLAYLIST_SECONDS,0.25,3600); dur.value=x[i].durationSec; savePlaylist(x); });
      row.querySelector(".load").addEventListener("click", () => applyState(s));
      row.querySelector(".del").addEventListener("click", () => { const x=playlist(); x.splice(i,1); savePlaylist(x); renderPlaylist(); });
      host.append(row);
    });
  }

  function syncShuffleButton() {
    const b=q("#shufflePlaylist"); if(!b)return; b.classList.toggle("primary",playlistShuffle); b.textContent=playlistShuffle?"SHUFFLE ON":"SHUFFLE"; b.setAttribute("aria-pressed",playlistShuffle?"true":"false");
  }
  function stopPlaylist(reason="Stopped · current effect held", keepEffect=true) {
    playlistRunning=false; playlistRunToken++; if(playlistTimer)clearTimeout(playlistTimer); playlistTimer=0;
    if(q("#playPlaylist"))q("#playPlaylist").textContent="PLAY";
    if(q("#playlistStatus"))q("#playlistStatus").textContent=reason;
    if(!keepEffect)send("FX=OFF");
  }
  function choosePlaylistIndex(count,orderedIndex) {
    if(!playlistShuffle)return orderedIndex%count; if(count===1)return 0; let n; do n=Math.floor(Math.random()*count); while(n===playlistLastIndex); return n;
  }
  async function runPlaylistStep(token,orderedIndex=0) {
    if(!playlistRunning||token!==playlistRunToken)return;
    const list=playlist(); if(!list.length){stopPlaylist("Playlist is empty");return;}
    const index=choosePlaylistIndex(list.length,orderedIndex); playlistLastIndex=index; const item=list[index];
    await applyState(item); if(!playlistRunning||token!==playlistRunToken)return;
    const sec=clamp(+item.durationSec||DEFAULT_PLAYLIST_SECONDS,0.25,3600);
    if(q("#playlistStatus"))q("#playlistStatus").textContent=`${playlistShuffle?"SHUFFLE":"LOOP"} · ${item.name||prettyFx(item.fx)} · ${sec}s`;
    playlistTimer=setTimeout(()=>runPlaylistStep(token,playlistShuffle?orderedIndex:orderedIndex+1),Math.max(250,Math.round(sec*1000)));
  }
  function startPlaylist() {
    const list=playlist(); if(!snap.passkey){log("Playlist needs a connected target.");return;} if(!list.length){log("Playlist is empty.");return;}
    stopMusic(true); playlistRunning=true; playlistRunToken++; playlistLastIndex=-1; const token=playlistRunToken;
    q("#playPlaylist").textContent="RESTART"; runPlaylistStep(token,0);
  }
  q("#playPlaylist")?.addEventListener("click",startPlaylist);
  q("#stopPlaylist")?.addEventListener("click",()=>stopPlaylist());
  q("#shufflePlaylist")?.addEventListener("click",()=>{playlistShuffle=!playlistShuffle;localStorage.setItem(SHUFFLE_KEY,playlistShuffle?"1":"0");syncShuffleButton();if(playlistRunning)startPlaylist();});
  q("#clearPlaylist")?.addEventListener("click",()=>{stopPlaylist("Playlist cleared");savePlaylist([]);renderPlaylist();});
  q("#playlistName").value=localStorage.getItem(PLAYLIST_NAME_KEY)||"My Light Sequence";
  q("#playlistName")?.addEventListener("input",e=>localStorage.setItem(PLAYLIST_NAME_KEY,e.target.value));

  function hex2(v) { return clamp(Math.round(v),0,255).toString(16).padStart(2,"0").toUpperCase(); }
  function bandValue(fd,lo,hi) {
    if(!audioCtx||!analyser)return 0; const hz=audioCtx.sampleRate/analyser.fftSize;
    const a=clamp(Math.floor(lo/hz),0,fd.length-1),b=clamp(Math.ceil(Math.min(hi,audioCtx.sampleRate/2)/hz),a+1,fd.length);
    let sum=0;for(let i=a;i<b;i++)sum+=fd[i];return b>a?sum/(b-a):0;
  }
  function renderSpectrumBase() {
    const host=q("#spectrograph"),labels=q("#bandLabels"); if(!host||!labels)return; host.innerHTML="";labels.innerHTML="";
    AUDIO_BANDS.forEach(([lo],i)=>{const bar=document.createElement("i");bar.className="spectrum-bar";host.append(bar);const label=document.createElement("span");label.textContent=i%2===0?(lo>=1000?`${(lo/1000).toFixed(1)}k`:String(lo)):"";labels.append(label);});
  }
  function setMusicUi(state,text=state) {
    if(q("#micState")){q("#micState").textContent=text;q("#micState").classList.toggle("live",state==="LIVE");}
    if(q("#micToggle"))q("#micToggle").textContent=micOn?"STOP MICROPHONE":"START MICROPHONE";
  }
  function setMusicMetric(id,value){if(q(`#${id}`))q(`#${id}`).textContent=String(value);}
  function setMusicLink(text,good=false){if(q("#musicLinkState")){q("#musicLinkState").textContent=text;q("#musicLinkState").classList.toggle("live",good);}}

  async function selectMusicEffect(fx,{enableAudio=true,logIt=true}={}) {
    if(!MUSIC_SET.has(fx))fx="SPECTRUM";
    stopPlaylist("Playlist stopped for MUSIC",true);
    const cmd=enableAudio?`FX=${fx};AUDIO=1;AUDMODE=FULL;AUDAMT=255`:`FX=${fx}`;
    const ok=await send(cmd);
    if(!ok){setMusicLink("BLE COMMAND FAILED",false);return false;}
    activeFx=fx;window.STWBLE.setLastFx(fx);if(q("#musicFx"))q("#musicFx").value=fx;updateHeader();renderEffects();
    if(logIt)log(`Music effect selected: ${fx}`);return true;
  }
  q("#musicFx")?.addEventListener("change",()=>selectMusicEffect(q("#musicFx").value,{enableAudio:true}));

  async function pumpAudio() {
    if(audioPumpBusy)return; audioPumpBusy=true;
    while(pendingAudio&&micOn){const packet=pendingAudio;pendingAudio=null;const ok=await send(packet,{fast:true});if(ok){audioTxOk++;setMusicMetric("musicTx",audioTxOk);}else{audioTxFail++;setMusicMetric("musicFail",audioTxFail);setMusicLink("BLE AUDIO TX FAILED",false);}}
    audioPumpBusy=false;
  }
  function queueAudio(level,bass,mid,high,beat) {
    pendingAudio=`A=${hex2(level)}${hex2(bass)}${hex2(mid)}${hex2(high)}${beat?"1":"0"}`;pumpAudio();
  }
  async function verifyAudioRx() {
    clearTimeout(verifyTimer); if(!micOn)return;
    const d=primaryTarget(); if(!d){setMusicLink("NO TARGET",false);return;}
    const status=await window.STWBLE.readStatus(d.id);
    if(!micOn)return;
    if(status){
      const arx=Number(status.ARX); setMusicMetric("musicRx",Number.isFinite(arx)?arx:"?");
      const audlive=String(status.AUDLIVE||"0")==="1";
      const fx=status.FX||activeFx;
      if(Number.isFinite(arx)&&lastVerifiedArx!==null&&arx>lastVerifiedArx&&audlive&&MUSIC_SET.has(fx))setMusicLink("ESP32 AUDIO RX VERIFIED",true);
      else if(Number.isFinite(arx)&&lastVerifiedArx!==null&&arx===lastVerifiedArx)setMusicLink("NO AUDIO RX INCREASE",false);
      lastVerifiedArx=Number.isFinite(arx)?arx:lastVerifiedArx;
    }
    verifyTimer=setTimeout(verifyAudioRx,2500);
  }
  function audioLoop(t=performance.now()) {
    if(!micOn||!analyser||!audioCtx)return;
    const fd=new Uint8Array(analyser.frequencyBinCount);analyser.getByteFrequencyData(fd);
    const sens=(+q("#micSensitivity").value||135)/100;
    const vals=AUDIO_BANDS.map(([lo,hi])=>clamp(bandValue(fd,lo,hi)*sens,0,255));
    qa(".spectrum-bar").forEach((b,i)=>b.style.height=`${Math.max(4,vals[i]/255*100).toFixed(1)}%`);
    const bass=(vals[0]+vals[1]+vals[2]+vals[3])/4;
    const mid=(vals[4]+vals[5]+vals[6]+vals[7]+vals[8]+vals[9])/6;
    const high=(vals[10]+vals[11]+vals[12]+vals[13]+vals[14]+vals[15])/6;
    const level=Math.max(bass,mid,high,vals.reduce((a,b)=>a+b,0)/vals.length);
    bassBase=bassBase*.94+bass*.06;const beat=bass>Math.max(24,bassBase*1.35)&&t-lastBeat>165;if(beat)lastBeat=t;
    setMusicMetric("musicLevel",Math.round(level));setMusicMetric("musicBass",Math.round(bass));setMusicMetric("musicMid",Math.round(mid));setMusicMetric("musicHigh",Math.round(high));
    if(t-lastAudioFrame>=70){lastAudioFrame=t;queueAudio(level,bass,mid,high,beat);}
    audioRaf=requestAnimationFrame(audioLoop);
  }
  async function startMusic() {
    if(micOn){stopMusic(true);return;}
    if(!snap.passkey){setMusicLink("CONNECT ESP32 FIRST",false);return;}
    try{
      if(!window.isSecureContext)throw new Error("HTTPS is required for microphone access");
      if(!navigator.mediaDevices?.getUserMedia)throw new Error("Microphone API unavailable");
      const fx=q("#musicFx")?.value||"SPECTRUM";
      if(!(await selectMusicEffect(fx,{enableAudio:true,logIt:false})))throw new Error("ESP32 rejected music effect command");
      micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
      const AC=window.AudioContext||window.webkitAudioContext;audioCtx=new AC({latencyHint:"interactive"});if(audioCtx.state==="suspended")await audioCtx.resume();
      analyser=audioCtx.createAnalyser();analyser.fftSize=1024;analyser.minDecibels=-90;analyser.maxDecibels=-10;analyser.smoothingTimeConstant=.28;audioCtx.createMediaStreamSource(micStream).connect(analyser);
      micOn=true;pendingAudio=null;audioTxOk=0;audioTxFail=0;lastAudioFrame=0;lastVerifiedArx=null;setMusicMetric("musicTx",0);setMusicMetric("musicFail",0);setMusicUi("LIVE","LIVE");setMusicLink("VERIFYING ESP32 AUDIO RX…",false);
      const d=primaryTarget();if(d){const s=await window.STWBLE.readStatus(d.id);const arx=Number(s?.ARX);if(Number.isFinite(arx)){lastVerifiedArx=arx;setMusicMetric("musicRx",arx);}}
      audioLoop();verifyTimer=setTimeout(verifyAudioRx,1300);log(`Microphone started for ${fx}; compact A= audio stream active.`);
    }catch(e){log(`Music start failed: ${e.message}`);setMusicLink(`FAILED: ${e.message}`,false);stopMusic(false);}
  }
  function stopMusic(sendOff=true) {
    micOn=false;if(audioRaf)cancelAnimationFrame(audioRaf);audioRaf=0;if(verifyTimer)clearTimeout(verifyTimer);verifyTimer=0;pendingAudio=null;
    micStream?.getTracks().forEach(t=>t.stop());micStream=null;audioCtx?.close().catch(()=>{});audioCtx=null;analyser=null;audioPumpBusy=false;qa(".spectrum-bar").forEach(b=>b.style.height="4%");setMusicUi("OFF","OFF");
    if(sendOff&&snap.passkey)send("AUDIO=0");
  }
  q("#micToggle")?.addEventListener("click",startMusic);
  q("#micSensitivity")?.addEventListener("input",e=>updateSlider(e.target));

  function fillStartupEffects(){const sel=q("#startupFx");if(!sel)return;const value=sel.value||"RAINBOW";sel.innerHTML="";for(const fx of FX_EFFECTS){const o=document.createElement("option");o.value=fx;o.textContent=prettyFx(fx);sel.append(o);}sel.value=FX_EFFECTS.includes(value)?value:"RAINBOW";}

  document.addEventListener("stw:ble", (e) => {
    const oldTarget=JSON.stringify(snap.target);snap=window.STWBLE.snapshot();renderDevices();populateGranted();renderGroups();updateHeader();
    if(JSON.stringify(snap.target)!==oldTarget){formDirty=false;loadDeviceForm(true);syncFromStatus(currentStatus());}
    else loadDeviceForm(false);
    if(e.detail?.type==="status"&&e.detail?.deviceId){const d=snap.devices.find(x=>x.id===e.detail.deviceId);if(d&&(!snap.target||snap.target.type!=="device"||snap.target.id===d.id))syncFromStatus(d.lastStatus);}
    if(e.detail?.type==="connected"&&e.detail?.deviceId)setTimeout(()=>window.STWBLE.readStatus(e.detail.deviceId),150);
    if(["connect-error","tx-error","status-error","granted-error"].includes(e.detail?.type))log(`${e.detail.type}: ${e.detail.message||"unknown error"}`);
  });

  fillStartupEffects();renderDevices();populateGranted();renderGroups();renderSavedColors();renderEffects();renderPresets();renderPlaylist();renderSpectrumBase();syncShuffleButton();updateAllSliders();syncHue();updateHeader();loadDeviceForm(true);
  if(q("#playlistStatus"))q("#playlistStatus").textContent=playlistShuffle?"Shuffle ready":"Ordered loop ready";
  log("Controller loaded: single UI owner, dedicated MUSIC path, compact A= audio, per-item playlist duration + shuffle.");
})();
