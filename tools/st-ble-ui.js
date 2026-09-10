"use strict";
(() => {
  const q = (s) => document.querySelector(s);
  const qa = (s) => [...document.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Active hardware baseline: ST_BT_V5_1_MAIN.ino / VER=51.
  // Only verified direct V5.1 firmware effect IDs belong here.
  const DIRECT_FX = [
    "SOLID","RAINBOW","RAINBOW_GLITTER","COMET","METEOR","SCANNER","DUAL_SCANNER","POLICE",
    "CHASE","TRICOLOR_CHASE","RUNNING_DOTS","THEATER","WIPE","FLOW","FLOW_STRIPE","COLOR_WAVES",
    "SPARKLE","GLITTER","TWINKLE","TWINKLEFOX","TWINKLECAT","FIREWORKS","RAIN","TETRIX","FIRE",
    "LIGHTNING","PACIFICA","SUNRISE","PRIDE","SINELON","JUGGLE","BOUNCING_BALLS",
    "LAVA_LAMP","MAGMA","AURORA","BREATHE","FLASH","DUAL_FLASH"
  ];
  const FX_EFFECTS = DIRECT_FX;

  const THREE = ["bg", "fg", "main"];
  const TWO_FG_MAIN = ["fg", "main"];
  const FX_CAPS = Object.fromEntries(FX_EFFECTS.map((fx) => [fx, { roles: THREE }]));
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
    FLASH: { roles: ["bg", "main"] }
  });

  const SAVED_KEY = "stw-esp32-saved-colors-v3";
  const OLD_SAVED_KEY = "stw-esp32-saved-colors-v2";
  const PRESET_KEY = "stw-esp32-presets-v4";
  const PLAYLIST_KEY = "stw-esp32-custom-v4";
  const SHUFFLE_KEY = "stw-esp32-playlist-shuffle-v1";
  const PLAYLIST_RUN_KEY = "stw-esp32-sequence-running-v1";
  const PLAYLIST_POS_KEY = "stw-esp32-sequence-position-v1";
  const DEFAULT_PLAYLIST_SECONDS = 5;
  const BUILTIN_COLORS = ["#DFFF00", "#FF00AA", "#0080FF", "#FFFFFF", "#000000"];
  const STYLE_CONTROLS = Object.freeze({
    bri: { key: "BRI", min: 0, max: 255 },
    spd: { key: "SPD", min: 1, max: 255 },
    int: { key: "BGB", min: 0, max: 255 },
    size: { key: "SIZE", min: 1, max: 255 },
    dens: { key: "DENS", min: 1, max: 255 },
    trail: { key: "TRAIL", min: 1, max: 255 }
  });

  let snap = window.STWBLE?.snapshot?.() || { devices: [], groups: [], target: null, passkey: false, granted: [] };
  let activePage = "device", activeFx = "RAINBOW", activeRole = "main", formDirty = false;
  let playlistRunning = false, playlistShuffle = localStorage.getItem(SHUFFLE_KEY) === "1";
  let playlistRunToken = 0, playlistTimer = 0, playlistLastIndex = -1;
  let hueDragging = false, hueDirty = false;

  const loadJSON = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const saveJSON = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const prettyFx = (fx) => String(fx || "").replace(/^PS_/, "PS ").replaceAll("_", " ");
  const rolesFor = (fx) => FX_CAPS[fx]?.roles || THREE;
  const metaFor = (fx) => FX_CAPS[fx]?.label || rolesFor(fx).map((r) => r.toUpperCase()).join(" · ");
  const visibleEffects = () => DIRECT_FX;

  function log(message) {
    const out = q("#debugLog");
    if (!out) return;
    out.textContent = `${new Date().toLocaleTimeString()}  ${message}\n${out.textContent}`.slice(0, 8000);
  }

  const selectedDevice = () => snap.target?.type === "device" ? snap.devices.find((d) => d.id === snap.target.id) || null : null;
  function primaryTarget() {
    if (snap.target?.type === "device") return selectedDevice();
    if (snap.target?.type === "group") {
      const g = snap.groups.find((x) => x.id === snap.target.id);
      return snap.devices.find((d) => g?.members?.includes(d.id)) || null;
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

  function updateGate() {
    qa(".tab.gated").forEach((b) => {
      b.classList.toggle("locked", !snap.passkey);
      b.setAttribute("aria-disabled", snap.passkey ? "false" : "true");
    });
    ["effects", "colors", "presets", "custom"].forEach((id) => q(`#${id}`)?.classList.toggle("locked-page", !snap.passkey));
    if (!snap.passkey && activePage !== "device") showPage("device");
  }
  function showPage(id) {
    if (id !== "device" && !snap.passkey) id = "device";
    activePage = id;
    qa(".tab").forEach((b) => b.classList.toggle("on", b.dataset.page === id));
    qa(".page").forEach((p) => p.classList.toggle("on", p.id === id));
  }
  qa(".tab").forEach((b) => b.addEventListener("click", () => showPage(b.dataset.page)));

  function updateHeader() {
    q("#bleSummary").textContent = `${snap.devices.filter((d) => d.bleStatus === "connected").length} LOCAL BLE`;
    q("#targetSummary").textContent = snap.targetLabel || "NONE";
    q("#effectSummary").textContent = prettyFx(activeFx);
    updateGate();
  }

  function renderDevices() {
    const host = q("#deviceList"); if (!host) return;
    host.innerHTML = "";
    for (const d of snap.devices) {
      const selected = snap.target?.type === "device" && snap.target.id === d.id;
      const card = document.createElement("article");
      card.className = `device-card${selected ? " selected" : ""}`;
      card.innerHTML = `<div class="esp32-art"><span class="esp32-chip">ESP32</span><span class="esp32-usb"></span></div><div class="device-info"><div class="device-name"></div><div class="device-bt"></div></div><i class="ble-dot ${d.bleStatus}"></i><button class="power-ring ${d.powered ? "on" : ""}" aria-label="Power">⏻</button>`;
      card.querySelector(".device-name").textContent = d.name;
      card.querySelector(".device-bt").textContent = d.bluetoothName || "Bluetooth not assigned";
      card.addEventListener("click", (e) => { if (!e.target.closest(".power-ring")) window.STWBLE.selectDevice(d.id); });
      card.querySelector(".power-ring").addEventListener("click", async (e) => { e.stopPropagation(); await window.STWBLE.togglePower(d.id); });
      host.append(card);
    }
  }

  function loadDeviceForm(force = false) {
    const d = selectedDevice();
    q("#deviceTools")?.classList.toggle("locked-panel", !d);
    if (!d || (formDirty && !force)) return;
    q("#settingsDeviceName").textContent = d.name;
    q("#deviceName").value = d.name;
    q("#leds").value = d.config?.leds ?? 300;
    q("#gpio").value = d.config?.gpio ?? 13;
    q("#order").value = d.config?.order || "GRB";
    q("#segFrom").value = d.config?.segFrom ?? 0;
    q("#segTo").value = d.config?.segTo ?? Math.max(0, (d.config?.leds ?? 300) - 1);
    const allowed = visibleEffects();
    q("#startupFx").value = allowed.includes(d.config?.startupFx) ? d.config.startupFx : "RAINBOW";
    formDirty = false;
  }
  ["deviceName","leds","gpio","order","segFrom","segTo","startupFx"].forEach((id) => q(`#${id}`)?.addEventListener("input", () => { formDirty = true; }));
  q("#addLogicalDevice")?.addEventListener("click", () => window.STWBLE.addLogicalDevice());
  q("#addBluetooth")?.addEventListener("click", async () => {
    let d = selectedDevice();
    if (!d && snap.devices[0]) {
      window.STWBLE.selectDevice(snap.devices[0].id);
      await sleep(0);
      snap = window.STWBLE.snapshot();
      d = selectedDevice();
    }
    if (!d) return;
    try { await window.STWBLE.assignNew(d.id); }
    catch (e) { log(e.name === "NotFoundError" ? "Bluetooth selection cancelled." : e.message); }
  });
  q("#unassignBluetooth")?.addEventListener("click", () => { const d = selectedDevice(); if (d) window.STWBLE.unassignBluetooth(d.id); });

  const deviceFormConfig = () => ({ leds:+q("#leds").value, gpio:+q("#gpio").value, order:q("#order").value, segFrom:+q("#segFrom").value, segTo:+q("#segTo").value, startupFx:q("#startupFx").value });
  async function saveSettings(reboot) {
    const d = selectedDevice(); if (!d) return;
    try {
      const cfg = deviceFormConfig();
      await window.STWBLE.saveDeviceConfig(d.id, cfg, { reboot:false });
      window.STWBLE.renameDevice(d.id, q("#deviceName").value);
      if (reboot) {
        const fx = cfg.startupFx || "RAINBOW";
        if (!(await sendDevice(d.id, `FX=${fx}`)) || !(await sendDevice(d.id, "SAVE")) || !(await sendDevice(d.id, "REBOOT"))) throw Error("Save/reboot failed");
      }
      formDirty = false;
      log(reboot ? "Settings saved; startup saved; reboot sent." : "Device settings saved.");
    } catch (e) { log(`Settings: ${e.message}`); }
  }
  q("#saveDeviceSettings")?.addEventListener("click", () => saveSettings(false));
  q("#saveDeviceReboot")?.addEventListener("click", () => saveSettings(true));
  q("#saveStartup")?.addEventListener("click", async () => {
    const d = selectedDevice(); if (!d) return;
    const startupFx = q("#startupFx").value || "RAINBOW", restoreFx = currentStatus().FX || d.lastFx || activeFx;
    try { await window.STWBLE.saveStartup(d.id, `FX=${startupFx}`, `FX=${restoreFx}`, startupFx); log(`Startup effect saved: ${startupFx}`); }
    catch (e) { log(`Startup: ${e.message}`); }
  });
  q("#readStatus")?.addEventListener("click", async () => {
    for (const id of window.STWBLE.targetMemberIds()) {
      const s = await window.STWBLE.readStatus(id);
      if (s) log(`STATUS ${id}: ${Object.entries(s).map(([k,v]) => `${k}=${v}`).join(" · ")}`);
    }
  });
  q("#blackout")?.addEventListener("click", async () => {
    stopPlaylist("Stopped", true);
    if (await send("FX=OFF")) { activeFx = "OFF"; window.STWBLE.setLastFx("OFF"); updateHeader(); }
  });
  q("#sendRaw")?.addEventListener("click", async () => {
    const cmd = q("#rawCommand").value.trim();
    if (cmd) log(`${await send(cmd) ? "TX" : "TX FAIL"}: ${cmd}`);
  });

  function renderGroups() {
    const host = q("#groupList"); if (!host) return;
    host.innerHTML = "";
    for (const g of snap.groups) {
      const card = document.createElement("article"), selected = snap.target?.type === "group" && snap.target.id === g.id;
      card.className = "group-card";
      card.innerHTML = `<div class="group-title"><b></b><button class="tiny-btn select">${selected ? "SYNC ACTIVE" : "USE GROUP"}</button><button class="tiny-btn danger del">DELETE</button></div><div class="group-members"></div>`;
      card.querySelector("b").textContent = g.name;
      const members = card.querySelector(".group-members");
      for (const d of snap.devices) {
        const label = document.createElement("label");
        label.innerHTML = `<input type="checkbox" value="${d.id}" ${g.members.includes(d.id) ? "checked" : ""}> ${d.name}`;
        label.querySelector("input").addEventListener("change", () => window.STWBLE.setGroupMembers(g.id, [...members.querySelectorAll("input:checked")].map((x) => x.value)));
        members.append(label);
      }
      card.querySelector(".select").addEventListener("click", () => window.STWBLE.selectGroup(g.id));
      card.querySelector(".del").addEventListener("click", () => window.STWBLE.deleteGroup(g.id));
      host.append(card);
    }
  }
  q("#createGroup")?.addEventListener("click", () => {
    try { window.STWBLE.createGroup(q("#groupName").value); q("#groupName").value = ""; }
    catch (e) { log(e.message); }
  });

  // Numeric Effect Styling controls. User enters 0-100%; blur or Enter commits to firmware.
  const rawToPercent = (id, raw) => {
    const c = STYLE_CONTROLS[id];
    if (!c) return 0;
    return clamp(Math.round(((Number(raw) - c.min) / Math.max(1, c.max - c.min)) * 100), 0, 100);
  };
  const percentToRaw = (id, pct) => {
    const c = STYLE_CONTROLS[id];
    if (!c) return 0;
    return Math.round(c.min + (clamp(Number(pct), 0, 100) / 100) * (c.max - c.min));
  };
  function paintPercent(id, pct) {
    const input = q(`[data-percent-for="${id}"]`);
    input?.closest(".percent-control")?.querySelector(".fill")?.style.setProperty("width", `${clamp(Number(pct),0,100)}%`);
  }
  function updateSlider(x) {
    if (!x) return;
    const pct = rawToPercent(x.id, x.value);
    const input = q(`[data-percent-for="${x.id}"]`);
    if (input) {
      input.value = String(pct);
      input.dataset.lastValid = String(pct);
    }
    paintPercent(x.id, pct);
  }
  const updateAllSliders = () => Object.keys(STYLE_CONTROLS).forEach((id) => updateSlider(q(`#${id}`)));
  function restorePercent(input) {
    const id = input?.dataset.percentFor;
    if (!id) return;
    updateSlider(q(`#${id}`));
  }
  async function commitPercent(input) {
    const id = input?.dataset.percentFor, cfg = STYLE_CONTROLS[id];
    if (!id || !cfg) return false;
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
    const ok = await send(`${cfg.key}=${raw}`, { fast:true });
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
    input.addEventListener("input", () => {
      const pct = Number(input.value);
      if (String(input.value).trim() && Number.isFinite(pct) && pct >= 0 && pct <= 100) paintPercent(input.dataset.percentFor, pct);
    });
    input.addEventListener("blur", () => { void commitPercent(input); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); input.blur(); }
      if (e.key === "Escape") { e.preventDefault(); restorePercent(input); input.blur(); }
    });
  });
  q("#dir")?.addEventListener("change", () => send(`DIR=${q("#dir").value}`, { fast:true }));
  q("#mirrorBtn")?.addEventListener("click", () => {
    q("#mirror").checked = !q("#mirror").checked;
    q("#mirrorBtn").classList.toggle("primary", q("#mirror").checked);
    send(`MIRROR=${q("#mirror").checked ? 1 : 0}`, { fast:true });
  });

  function currentPalette() {
    return {
      main:(q("#main")?.value || "#FFFFFF").toUpperCase(),
      bg:(q("#bg")?.value || "#000000").toUpperCase(),
      fg:(q("#fg")?.value || "#8000FF").toUpperCase()
    };
  }
  function setPaletteUI(p) {
    for (const role of ["main","bg","fg"]) {
      const value = (p[role] || currentPalette()[role]).toUpperCase();
      q(`#${role}`).value = value;
      q(`#${role}Swatch`).style.background = value;
    }
    syncHue();
  }
  function rgbToHue(hex) {
    const h=hex.replace("#", "");
    const r=parseInt(h.slice(0,2),16)/255,g=parseInt(h.slice(2,4),16)/255,b=parseInt(h.slice(4,6),16)/255,max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
    if(!d)return 0;
    let hue=max===r?60*(((g-b)/d)%6):max===g?60*((b-r)/d+2):60*((r-g)/d+4);
    return hue<0?hue+360:hue;
  }
  function hueHex(h) {
    const c=1,x=1-Math.abs(((h/60)%2)-1); let r=0,g=0,b=0;
    if(h<60){r=c;g=x;}else if(h<120){r=x;g=c;}else if(h<180){g=c;b=x;}else if(h<240){g=x;b=c;}else if(h<300){r=x;b=c;}else{r=c;b=x;}
    const z=(v)=>Math.round(v*255).toString(16).padStart(2,"0").toUpperCase();
    return `#${z(r)}${z(g)}${z(b)}`;
  }
  function syncHue() {
    const value=currentPalette()[activeRole], h=rgbToHue(value);
    q("#hueRange").value=Math.round(h);
    q("#hueSelector").style.setProperty("--hx",`${h/359*100}%`);
    q("#hueValue").textContent=value;
    q("#hueValue").style.color=value;
  }
  function liveHue(h) {
    const hex=hueHex(h);
    q("#hueRange").value = Math.round(h);
    q("#hueSelector").style.setProperty("--hx",`${h/359*100}%`);
    q(`#${activeRole}`).value=hex;
    q(`#${activeRole}Swatch`).style.background=hex;
    q("#hueValue").textContent=hex;
    q("#hueValue").style.color=hex;
    hueDirty = true;
  }
  function hueFromPointer(e) {
    const box = q("#hueSelector").getBoundingClientRect();
    return clamp(((e.clientX - box.left) / Math.max(1, box.width)) * 359, 0, 359);
  }
  async function commitHue() {
    if (!hueDirty) return;
    hueDirty = false;
    const p=currentPalette();
    await send(`MAIN=${p.main.slice(1)};BG=${p.bg.slice(1)};FG=${p.fg.slice(1)}`,{fast:true});
  }
  qa(".role").forEach((b) => b.addEventListener("click", () => {
    activeRole=b.dataset.role;
    qa(".role").forEach((x)=>x.classList.toggle("on",x===b));
    syncHue();
  }));
  const hueSelector = q("#hueSelector");
  hueSelector?.addEventListener("pointerdown", (e) => {
    hueDragging = true;
    hueSelector.classList.add("dragging");
    try { hueSelector.setPointerCapture(e.pointerId); } catch {}
    liveHue(hueFromPointer(e));
  });
  hueSelector?.addEventListener("pointermove", (e) => { if (hueDragging) liveHue(hueFromPointer(e)); });
  const finishHue = async (e) => {
    if (!hueDragging) return;
    hueDragging = false;
    hueSelector.classList.remove("dragging");
    try { if (e?.pointerId != null) hueSelector.releasePointerCapture(e.pointerId); } catch {}
    await commitHue();
    syncHue();
  };
  hueSelector?.addEventListener("pointerup", finishHue);
  hueSelector?.addEventListener("pointercancel", finishHue);
  q("#hueRange")?.addEventListener("input", () => liveHue(Number(q("#hueRange").value)));
  q("#hueRange")?.addEventListener("change", commitHue);

  function customColors() {
    let list = loadJSON(SAVED_KEY, null);
    if (!Array.isArray(list)) {
      const old = loadJSON(OLD_SAVED_KEY, []);
      list = Array.isArray(old) ? old.filter((c) => !BUILTIN_COLORS.includes(String(c).toUpperCase())) : [];
      saveJSON(SAVED_KEY, list);
    }
    return list.map((c) => String(c).toUpperCase()).filter((c) => /^#[0-9A-F]{6}$/.test(c));
  }
  function renderSavedColors() {
    const host=q("#savedColors"); if(!host)return;
    host.innerHTML="";
    const items=[...BUILTIN_COLORS.map((color)=>({color,builtin:true})),...customColors().map((color)=>({color,builtin:false}))];
    for(const {color,builtin} of items){
      const wrap=document.createElement("span"); wrap.className="saved-color-wrap";
      const b=document.createElement("button"); b.className="saved-color"; b.style.setProperty("--c",color); b.title=color;
      b.addEventListener("click",async()=>{
        q(`#${activeRole}`).value=color;
        q(`#${activeRole}Swatch`).style.background=color;
        syncHue();
        const p=currentPalette();
        await send(`MAIN=${p.main.slice(1)};BG=${p.bg.slice(1)};FG=${p.fg.slice(1)}`,{fast:true});
      });
      wrap.append(b);
      if(!builtin){
        const del=document.createElement("button");
        del.className="saved-color-delete"; del.type="button"; del.textContent="×"; del.title=`Delete ${color}`;
        del.addEventListener("click",(e)=>{e.stopPropagation();saveJSON(SAVED_KEY,customColors().filter((c)=>c!==color));renderSavedColors();});
        wrap.append(del);
      }
      host.append(wrap);
    }
  }
  q("#saveColor")?.addEventListener("click",()=>{
    const c=currentPalette()[activeRole];
    saveJSON(SAVED_KEY,[c,...customColors().filter((x)=>x!==c)].slice(0,19));
    renderSavedColors();
  });

  function applyEffectCapabilities(fx) {
    const roles=rolesFor(fx);
    q("#bgbRow")?.classList.toggle("control-unavailable",!roles.includes("bg"));
    qa(".role").forEach((b)=>{
      const available=roles.includes(b.dataset.role);
      b.classList.toggle("role-unavailable",!available);
      b.disabled=!available;
    });
    if(!roles.includes(activeRole)){
      activeRole=roles.includes("main")?"main":roles.includes("fg")?"fg":roles.includes("bg")?"bg":"main";
      qa(".role").forEach((b)=>b.classList.toggle("on",b.dataset.role===activeRole));
    }
    q("#colorCapability").textContent=roles.length?`USES ${metaFor(fx)}`:"BUILT-IN COLOR — USER COLOR ROLES NOT USED";
  }
  function renderEffects() {
    const host=q("#effectList"); if(!host)return;
    const filter=(q("#fxSearch")?.value||"").trim().toLowerCase();
    host.innerHTML="";
    const available=visibleEffects();
    const shown=available.filter((fx)=>!filter||prettyFx(fx).toLowerCase().includes(filter)||fx.toLowerCase().includes(filter));
    q("#fxCount").textContent=`${shown.length}/${available.length}`;
    for(const fx of shown){
      const b=document.createElement("button");
      b.className=`fx-item${activeFx===fx?" on":""}`;
      b.dataset.fx=fx;
      b.innerHTML=`<span>${prettyFx(fx)}</span><small>${metaFor(fx)}</small>`;
      b.addEventListener("click",()=>selectEffect(fx));
      host.append(b);
    }
  }
  q("#fxSearch")?.addEventListener("input",renderEffects);
  async function selectEffect(fx){
    stopPlaylist("Sequence stopped",true);
    if(!(await send(`FX=${fx}`)))return false;
    activeFx=fx;
    window.STWBLE.setLastFx(fx);
    applyEffectCapabilities(fx);
    updateHeader();
    renderEffects();
    return true;
  }

  function syncFromStatus(status){
    if(!status)return;
    if(status.FX&&FX_EFFECTS.includes(status.FX))activeFx=status.FX;
    setPaletteUI({
      main:status.MAIN?`#${status.MAIN}`:currentPalette().main,
      bg:status.BG?`#${status.BG}`:currentPalette().bg,
      fg:status.FG?`#${status.FG}`:currentPalette().fg
    });
    for(const[id,key]of Object.entries({bri:"BRI",spd:"SPD",int:"BGB",size:"SIZE",dens:"DENS",trail:"TRAIL"})){
      if(status[key]!=null&&q(`#${id}`)){q(`#${id}`).value=status[key];updateSlider(q(`#${id}`));}
    }
    if(status.DIR)q("#dir").value=status.DIR;
    if(status.MIRROR!=null){q("#mirror").checked=+status.MIRROR>0;q("#mirrorBtn").classList.toggle("primary",q("#mirror").checked);}
    fillStartupEffects();
    applyEffectCapabilities(activeFx);
    updateHeader();
    renderEffects();
  }

  function captureState(name=activeFx){
    const p=currentPalette();
    return{name,fx:activeFx,...p,bri:+q("#bri").value,bgb:+q("#int").value,spd:+q("#spd").value,size:+q("#size").value,dens:+q("#dens").value,trail:+q("#trail").value,dir:q("#dir").value,mirror:q("#mirror").checked,durationSec:DEFAULT_PLAYLIST_SECONDS};
  }
  function buildStateCommand(s){
    return[
      `FX=${s.fx||activeFx}`,
      `MAIN=${String(s.main||currentPalette().main).replace("#","")}`,
      `BG=${String(s.bg||currentPalette().bg).replace("#","")}`,
      `FG=${String(s.fg||currentPalette().fg).replace("#","")}`,
      `BRI=${s.bri??q("#bri").value}`,
      `BGB=${s.bgb??q("#int").value}`,
      `SPD=${s.spd??q("#spd").value}`,
      `SIZE=${s.size??q("#size").value}`,
      `DENS=${s.dens??q("#dens").value}`,
      `TRAIL=${s.trail??q("#trail").value}`,
      `DIR=${s.dir||q("#dir").value}`,
      `MIRROR=${s.mirror?1:0}`
    ].join(";");
  }
  async function applyState(s){
    activeFx=FX_EFFECTS.includes(s.fx)?s.fx:activeFx;
    setPaletteUI({main:s.main,bg:s.bg,fg:s.fg});
    for(const id of["bri","spd","size","dens","trail"])if(s[id]!=null)q(`#${id}`).value=s[id];
    if(s.bgb!=null)q("#int").value=s.bgb;
    q("#dir").value=s.dir||"FWD";
    q("#mirror").checked=!!s.mirror;
    updateAllSliders();
    if(await send(buildStateCommand(s))){
      window.STWBLE.setLastFx(activeFx);
      applyEffectCapabilities(activeFx);
      updateHeader();
      renderEffects();
    }
  }

  const presets=()=>{const x=loadJSON(PRESET_KEY,[]);return Array.isArray(x)?x:[];};
  const savePresets=(x)=>saveJSON(PRESET_KEY,x.slice(0,50));
  function renderPresets(){
    const host=q("#presetGrid");if(!host)return;
    const list=presets();q("#presetCount").textContent=list.length?`${list.length} SAVED`:"";host.innerHTML="";
    if(!list.length){host.innerHTML='<div class="microcopy" style="text-align:center">No presets saved yet.</div>';return;}
    list.forEach((p,i)=>{
      const card=document.createElement("article");card.className="preset-card";
      card.innerHTML='<div class="preset-title"></div><div class="preset-meta"></div><div class="preset-colors"><i></i><i></i><i></i></div><div class="button-row"><button class="tiny-btn load">LOAD</button><button class="tiny-btn add">+ SEQUENCE</button><button class="tiny-btn danger del">DELETE</button></div>';
      card.querySelector(".preset-title").textContent=p.name||prettyFx(p.fx);
      card.querySelector(".preset-meta").textContent=`${prettyFx(p.fx)} · ${metaFor(p.fx)}`;
      [p.main,p.bg,p.fg].forEach((c,n)=>card.querySelectorAll(".preset-colors i")[n].style.background=c||"#000");
      card.querySelector(".load").onclick=()=>applyState(p);
      card.querySelector(".add").onclick=()=>addPlaylist(p);
      card.querySelector(".del").onclick=()=>{const x=presets();x.splice(i,1);savePresets(x);renderPresets();};
      host.append(card);
    });
  }
  function saveCurrentPreset(){
    const name=prompt("Preset name",prettyFx(activeFx));if(name===null)return;
    const list=presets();list.unshift(captureState(name.trim()||prettyFx(activeFx)));savePresets(list);renderPresets();
  }
  q("#saveFxPreset")?.addEventListener("click",saveCurrentPreset);
  q("#saveCurrentPreset")?.addEventListener("click",saveCurrentPreset);

  function playlist(){
    const x=loadJSON(PLAYLIST_KEY,[]);if(!Array.isArray(x))return[];
    let changed=false;
    x.forEach((s)=>{
      const n=Number(s.durationSec??s.duration??DEFAULT_PLAYLIST_SECONDS),d=Number.isFinite(n)?clamp(n,.25,3600):DEFAULT_PLAYLIST_SECONDS;
      if(s.durationSec!==d){s.durationSec=d;changed=true;}
      if("duration"in s){delete s.duration;changed=true;}
    });
    if(changed)saveJSON(PLAYLIST_KEY,x);
    return x;
  }
  const savePlaylist=(x)=>saveJSON(PLAYLIST_KEY,x.slice(0,100));
  function addPlaylist(state){const list=playlist();list.push({...state,durationSec:Number(state.durationSec)||DEFAULT_PLAYLIST_SECONDS});savePlaylist(list);renderPlaylist();}
  q("#addFxPlaylist")?.addEventListener("click",()=>addPlaylist(captureState(prettyFx(activeFx))));
  q("#addCurrentFx")?.addEventListener("click",()=>addPlaylist(captureState(prettyFx(activeFx))));

  function renderPlaylist(){
    const host=q("#playlistList");if(!host)return;
    const list=playlist();host.innerHTML="";
    if(!list.length){host.innerHTML='<div class="microcopy" style="text-align:center">Sequence is empty.</div>';return;}
    list.forEach((s,i)=>{
      const row=document.createElement("article");row.className="playlist-item";
      row.innerHTML='<span class="playlist-num"></span><span><b></b><small></small></span><label class="duration-wrap"><small>TIME SEC</small><input class="glass-field duration" type="number" min="0.25" max="3600" step="0.25"></label><div class="button-row"><button class="tiny-btn load">LOAD</button><button class="tiny-btn danger del">DELETE</button></div>';
      row.querySelector(".playlist-num").textContent=i+1;
      row.querySelector("b").textContent=s.name||prettyFx(s.fx);
      row.querySelector("small").textContent=prettyFx(s.fx);
      const dur=row.querySelector(".duration");dur.value=s.durationSec||DEFAULT_PLAYLIST_SECONDS;
      dur.onchange=()=>{const x=playlist();if(!x[i])return;x[i].durationSec=clamp(+dur.value||DEFAULT_PLAYLIST_SECONDS,.25,3600);dur.value=x[i].durationSec;savePlaylist(x);};
      row.querySelector(".load").onclick=()=>applyState(s);
      row.querySelector(".del").onclick=()=>{const x=playlist();x.splice(i,1);savePlaylist(x);renderPlaylist();};
      host.append(row);
    });
  }
  function syncShuffleButton(){
    const b=q("#shufflePlaylist");if(!b)return;
    b.classList.toggle("primary",playlistShuffle);
    b.textContent=playlistShuffle?"SHUFFLE ON":"SHUFFLE";
    b.setAttribute("aria-pressed",playlistShuffle?"true":"false");
  }
  function stopPlaylist(reason="Stopped · current effect held",keepEffect=true){
    playlistRunning=false;playlistRunToken++;clearTimeout(playlistTimer);playlistTimer=0;
    localStorage.setItem(PLAYLIST_RUN_KEY,"0");
    q("#playPlaylist").textContent="PLAY";
    q("#playlistStatus").textContent=reason;
    if(!keepEffect)send("FX=OFF");
  }
  function choosePlaylistIndex(count,ordered){
    if(!playlistShuffle)return ordered%count;
    if(count===1)return 0;
    let n;do n=Math.floor(Math.random()*count);while(n===playlistLastIndex);return n;
  }
  async function runPlaylistStep(token,ordered=0){
    if(!playlistRunning||token!==playlistRunToken)return;
    const list=playlist();if(!list.length){stopPlaylist("Sequence is empty");return;}
    const index=choosePlaylistIndex(list.length,ordered);playlistLastIndex=index;
    localStorage.setItem(PLAYLIST_POS_KEY,String(index));
    const item=list[index];await applyState(item);
    if(!playlistRunning||token!==playlistRunToken)return;
    const sec=clamp(+item.durationSec||DEFAULT_PLAYLIST_SECONDS,.25,3600);
    q("#playlistStatus").textContent=`${playlistShuffle?"SHUFFLE":"LOOP"} · ${item.name||prettyFx(item.fx)} · ${sec}s`;
    playlistTimer=setTimeout(()=>runPlaylistStep(token,playlistShuffle?ordered:ordered+1),Math.max(250,Math.round(sec*1000)));
  }
  function startPlaylist(resume=false){
    const list=playlist();
    if(!snap.passkey){log("Sequence needs a connected target.");return;}
    if(!list.length){log("Sequence is empty.");return;}
    playlistRunning=true;playlistRunToken++;playlistLastIndex=-1;
    localStorage.setItem(PLAYLIST_RUN_KEY,"1");
    q("#playPlaylist").textContent="RESTART";
    const start=resume?clamp(Number(localStorage.getItem(PLAYLIST_POS_KEY)||0),0,Math.max(0,list.length-1)):0;
    runPlaylistStep(playlistRunToken,start);
  }
  q("#playPlaylist")?.addEventListener("click",()=>startPlaylist(false));
  q("#stopPlaylist")?.addEventListener("click",()=>stopPlaylist());
  q("#shufflePlaylist")?.addEventListener("click",()=>{
    playlistShuffle=!playlistShuffle;localStorage.setItem(SHUFFLE_KEY,playlistShuffle?"1":"0");syncShuffleButton();
    if(playlistRunning)startPlaylist(true);
  });
  q("#clearPlaylist")?.addEventListener("click",()=>{stopPlaylist("Sequence cleared");savePlaylist([]);localStorage.removeItem(PLAYLIST_POS_KEY);renderPlaylist();});

  function fillStartupEffects(){
    const sel=q("#startupFx");if(!sel)return;
    const value=sel.value||"RAINBOW",available=visibleEffects();sel.innerHTML="";
    for(const fx of available){const o=document.createElement("option");o.value=fx;o.textContent=prettyFx(fx);sel.append(o);}
    sel.value=available.includes(value)?value:"RAINBOW";
  }

  document.addEventListener("stw:ble",(e)=>{
    const oldTarget=JSON.stringify(snap.target);
    snap=window.STWBLE.snapshot();
    renderDevices();renderGroups();updateHeader();
    if(JSON.stringify(snap.target)!==oldTarget){formDirty=false;fillStartupEffects();loadDeviceForm(true);syncFromStatus(currentStatus());}
    else loadDeviceForm(false);
    if(e.detail?.type==="status"&&e.detail?.deviceId){
      const d=snap.devices.find((x)=>x.id===e.detail.deviceId);
      if(d&&(!snap.target||snap.target.type!=="device"||snap.target.id===d.id))syncFromStatus(d.lastStatus);
    }
    if(e.detail?.type==="connected"&&e.detail?.deviceId){
      setTimeout(async()=>{
        const s=await window.STWBLE.readStatus(e.detail.deviceId);
        if(s)log(`FW ${e.detail.deviceId}: VER=${s.VER||"?"}`);
        snap=window.STWBLE.snapshot();
        if(localStorage.getItem(PLAYLIST_RUN_KEY)==="1"&&!playlistRunning&&snap.passkey)startPlaylist(true);
      },150);
    }
    if(["connect-error","tx-error","status-error","granted-error"].includes(e.detail?.type))log(`${e.detail.type}: ${e.detail.message||"unknown error"}`);
  });

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
  q("#playlistStatus").textContent=localStorage.getItem(PLAYLIST_RUN_KEY)==="1"?"Resume pending · connect target":"Ordered loop ready";
  if(localStorage.getItem(PLAYLIST_RUN_KEY)==="1"&&snap.passkey)startPlaylist(true);
  log("Iteration 2 current: V5.1 direct effects · SOLID restored · WIPE kept factual · percentage-entry styling · separate glass Effects/Colors tabs · Sequence state persists in browser.");
})();
