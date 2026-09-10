"use strict";
(() => {
  const q = (s) => document.querySelector(s);
  const qa = (s) => [...document.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const DIRECT_FX = [
    "RAINBOW","RAINBOW_GLITTER","COMET","METEOR","SCANNER","DUAL_SCANNER","POLICE",
    "CHASE","TRICOLOR_CHASE","RUNNING_DOTS","THEATER","WIPE","FLOW","FLOW_STRIPE","COLOR_WAVES",
    "SPARKLE","GLITTER","TWINKLE","TWINKLEFOX","TWINKLECAT","FIREWORKS","RAIN","TETRIX","FIRE",
    "LIGHTNING","PACIFICA","SUNRISE","DANCING_SHADOWS","PRIDE","SINELON","JUGGLE","BOUNCING_BALLS",
    "LAVA_LAMP","MAGMA","AURORA","BREATHE","FLASH","DUAL_FLASH"
  ];
  const CATALOG_FX = [
    "ANDROID","CANDLE_MULTI","CHASE_RAINBOW","COLORTWINKLES","FAIRYTWINKLE","FIRE_2012",
    "FIREWORKS_STARBURST","HALLOWEEN_EYES","METEOR_SMOOTH","MULTI_COMET","PLASMA","RAINBOW_RUNNER",
    "RIPPLE_RAINBOW","STROBE_MEGA","TWO_DOTS","SHIMMER","COLOR_CLOUDS","PACMAN","ANTS","PS_COMET"
  ];
  const FX_EFFECTS = [...DIRECT_FX, ...CATALOG_FX];

  const THREE = ["bg", "fg", "main"];
  const TWO_FG_MAIN = ["fg", "main"];
  const FX_CAPS = Object.fromEntries(FX_EFFECTS.map((fx) => [fx, { roles: THREE }]));
  Object.assign(FX_CAPS, {
    RAINBOW: { roles: [], label: "BUILT-IN COLOR" },
    RAINBOW_GLITTER: { roles: ["main"], label: "MAIN + BUILT-IN" },
    COMET: { roles: TWO_FG_MAIN }, METEOR: { roles: TWO_FG_MAIN }, POLICE: { roles: TWO_FG_MAIN },
    GLITTER: { roles: TWO_FG_MAIN }, FIREWORKS: { roles: TWO_FG_MAIN }, RAIN: { roles: TWO_FG_MAIN },
    LIGHTNING: { roles: TWO_FG_MAIN }, SINELON: { roles: TWO_FG_MAIN }, JUGGLE: { roles: TWO_FG_MAIN },
    BOUNCING_BALLS: { roles: TWO_FG_MAIN },
    FLASH: { roles: ["bg", "main"] },
    STROBE_MEGA: { roles: ["bg", "main"] },
    METEOR_SMOOTH: { roles: ["bg", "fg"] },
    PS_COMET: { roles: ["bg", "fg"] }
  });

  const SAVED_KEY = "stw-esp32-saved-colors-v3";
  const OLD_SAVED_KEY = "stw-esp32-saved-colors-v2";
  const PRESET_KEY = "stw-esp32-presets-v4";
  const PLAYLIST_KEY = "stw-esp32-custom-v4";
  const PLAYLIST_NAME_KEY = "stw-esp32-playlist-name-v2";
  const SHUFFLE_KEY = "stw-esp32-playlist-shuffle-v1";
  const DEFAULT_PLAYLIST_SECONDS = 5;
  const BUILTIN_COLORS = ["#DFFF00", "#FF00AA", "#0080FF", "#FFFFFF", "#000000"];

  let snap = window.STWBLE?.snapshot?.() || { devices: [], groups: [], target: null, passkey: false, granted: [] };
  let activePage = "device", activeFx = "RAINBOW", activeRole = "main", formDirty = false;
  let playlistRunning = false, playlistShuffle = localStorage.getItem(SHUFFLE_KEY) === "1";
  let playlistRunToken = 0, playlistTimer = 0, playlistLastIndex = -1;

  const loadJSON = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const saveJSON = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const prettyFx = (fx) => String(fx || "").replace(/^PS_/, "PS ").replaceAll("_", " ");
  const rolesFor = (fx) => FX_CAPS[fx]?.roles || THREE;
  const metaFor = (fx) => FX_CAPS[fx]?.label || rolesFor(fx).map((r) => r.toUpperCase()).join(" · ");

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
  function targetStatuses() {
    const ids = window.STWBLE?.targetMemberIds?.() || [];
    return ids.map((id) => snap.devices.find((d) => d.id === id)?.lastStatus || null);
  }
  function catalogSupported() {
    const statuses = targetStatuses();
    return statuses.length > 0 && statuses.every((s) => s && String(s.VER) === "52" && Number(s.FXCOUNT) > 51);
  }
  const visibleEffects = () => catalogSupported() ? FX_EFFECTS : DIRECT_FX;

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
    ["fxcolor", "presets", "custom"].forEach((id) => q(`#${id}`)?.classList.toggle("locked-page", !snap.passkey));
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

  function populateGranted() {
    const sel = q("#grantedBluetooth"); if (!sel) return;
    const cur = sel.value; sel.innerHTML = '<option value="">Previously granted Bluetooth devices</option>';
    const seen = new Set();
    for (const b of snap.granted || []) { const o = document.createElement("option"); o.value = b.id; o.textContent = b.name || b.id; sel.append(o); seen.add(b.id); }
    for (const d of snap.devices) if (d.bluetoothId && !seen.has(d.bluetoothId)) { const o = document.createElement("option"); o.value = d.bluetoothId; o.textContent = `${d.bluetoothName || d.name} — SAVED`; sel.append(o); }
    if ([...sel.options].some((o) => o.value === cur)) sel.value = cur;
    else if (selectedDevice()?.bluetoothId) sel.value = selectedDevice().bluetoothId;
  }

  function loadDeviceForm(force = false) {
    const d = selectedDevice(); q("#deviceTools")?.classList.toggle("locked-panel", !d); if (!d || (formDirty && !force)) return;
    q("#settingsDeviceName").textContent = d.name; q("#deviceName").value = d.name;
    q("#leds").value = d.config?.leds ?? 300; q("#gpio").value = d.config?.gpio ?? 13; q("#order").value = d.config?.order || "GRB";
    q("#segFrom").value = d.config?.segFrom ?? 0; q("#segTo").value = d.config?.segTo ?? Math.max(0, (d.config?.leds ?? 300) - 1);
    const allowed = visibleEffects();
    q("#startupFx").value = allowed.includes(d.config?.startupFx) ? d.config.startupFx : "RAINBOW"; formDirty = false;
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
    const d = selectedDevice(), btId = q("#grantedBluetooth")?.value; if (!d || !btId) return;
    try { await window.STWBLE.assignGranted(d.id, btId); } catch (e) { log(e.message); }
  });
  q("#reconnectSelected")?.addEventListener("click", async () => {
    const d = selectedDevice(); if (!d) return;
    try { await window.STWBLE.refreshGranted(); if (!(d.bluetoothId && await window.STWBLE.connectAssigned(d.id))) log("Saved Bluetooth unavailable. Use ADD BLUETOOTH — ONE TIME."); } catch (e) { log(e.message); }
  });
  q("#unassignBluetooth")?.addEventListener("click", () => { const d = selectedDevice(); if (d) window.STWBLE.unassignBluetooth(d.id); });

  const deviceFormConfig = () => ({ leds:+q("#leds").value, gpio:+q("#gpio").value, order:q("#order").value, segFrom:+q("#segFrom").value, segTo:+q("#segTo").value, startupFx:q("#startupFx").value });
  async function saveSettings(reboot) {
    const d = selectedDevice(); if (!d) return;
    try {
      const cfg = deviceFormConfig(); await window.STWBLE.saveDeviceConfig(d.id, cfg, { reboot:false }); window.STWBLE.renameDevice(d.id, q("#deviceName").value);
      if (reboot) { const fx = cfg.startupFx || "RAINBOW"; if (!(await sendDevice(d.id, `FX=${fx}`)) || !(await sendDevice(d.id, "SAVE")) || !(await sendDevice(d.id, "REBOOT"))) throw Error("Save/reboot failed"); }
      formDirty = false; log(reboot ? "Settings saved; startup saved; reboot sent." : "Device settings saved.");
    } catch (e) { log(`Settings: ${e.message}`); }
  }
  q("#saveDeviceSettings")?.addEventListener("click", () => saveSettings(false));
  q("#saveDeviceReboot")?.addEventListener("click", () => saveSettings(true));
  q("#saveStartup")?.addEventListener("click", async () => {
    const d = selectedDevice(); if (!d) return; const startupFx = q("#startupFx").value || "RAINBOW", restoreFx = currentStatus().FX || d.lastFx || activeFx;
    try { await window.STWBLE.saveStartup(d.id, `FX=${startupFx}`, `FX=${restoreFx}`, startupFx); log(`Startup effect saved: ${startupFx}`); } catch (e) { log(`Startup: ${e.message}`); }
  });
  q("#readStatus")?.addEventListener("click", async () => { for (const id of window.STWBLE.targetMemberIds()) { const s = await window.STWBLE.readStatus(id); if (s) log(`STATUS ${id}: ${Object.entries(s).map(([k,v]) => `${k}=${v}`).join(" · ")}`); } });
  q("#blackout")?.addEventListener("click", async () => { stopPlaylist("Stopped", true); if (await send("FX=OFF")) { activeFx = "OFF"; window.STWBLE.setLastFx("OFF"); updateHeader(); } });
  q("#sendRaw")?.addEventListener("click", async () => { const cmd = q("#rawCommand").value.trim(); if (cmd) log(`${await send(cmd) ? "TX" : "TX FAIL"}: ${cmd}`); });

  function renderGroups() {
    const host = q("#groupList"); if (!host) return; host.innerHTML = "";
    for (const g of snap.groups) {
      const card = document.createElement("article"), selected = snap.target?.type === "group" && snap.target.id === g.id;
      card.className = "group-card"; card.innerHTML = `<div class="group-title"><b></b><button class="tiny-btn select">${selected ? "SYNC ACTIVE" : "USE GROUP"}</button><button class="tiny-btn danger del">DELETE</button></div><div class="group-members"></div>`;
      card.querySelector("b").textContent = g.name; const members = card.querySelector(".group-members");
      for (const d of snap.devices) { const label = document.createElement("label"); label.innerHTML = `<input type="checkbox" value="${d.id}" ${g.members.includes(d.id) ? "checked" : ""}> ${d.name}`; label.querySelector("input").addEventListener("change", () => window.STWBLE.setGroupMembers(g.id, [...members.querySelectorAll("input:checked")].map((x) => x.value))); members.append(label); }
      card.querySelector(".select").addEventListener("click", () => window.STWBLE.selectGroup(g.id)); card.querySelector(".del").addEventListener("click", () => window.STWBLE.deleteGroup(g.id)); host.append(card);
    }
  }
  q("#createGroup")?.addEventListener("click", () => { try { window.STWBLE.createGroup(q("#groupName").value); q("#groupName").value = ""; } catch (e) { log(e.message); } });

  function updateSlider(x) {
    if (!x) return; const min = +x.min || 0, max = +x.max || 255, pct = clamp(((+x.value - min) / (max - min)) * 100, 0, 100), rail = x.closest(".sim-slider");
    if (rail) { rail.querySelector(".fill")?.style.setProperty("width", `${pct}%`); rail.querySelector(".thumb")?.style.setProperty("left", `${pct}%`); }
    const out = q(`#${x.id}V`); if (out) out.textContent = `${Math.round(pct)}%`;
  }
  const updateAllSliders = () => qa(".sim-slider input").forEach(updateSlider);
  const SLIDERS = { bri:"BRI", spd:"SPD", int:"BGB", size:"SIZE", dens:"DENS", trail:"TRAIL" };
  for (const [id, key] of Object.entries(SLIDERS)) {
    const x = q(`#${id}`); if (!x) continue; let timer = 0;
    x.addEventListener("input", () => { updateSlider(x); clearTimeout(timer); timer = setTimeout(() => send(`${key}=${x.value}`, { fast:true }), 55); });
    x.addEventListener("change", () => { clearTimeout(timer); send(`${key}=${x.value}`, { fast:true }); });
  }
  q("#dir")?.addEventListener("change", () => send(`DIR=${q("#dir").value}`, { fast:true }));
  q("#mirrorBtn")?.addEventListener("click", () => { q("#mirror").checked = !q("#mirror").checked; q("#mirrorBtn").classList.toggle("primary", q("#mirror").checked); send(`MIRROR=${q("#mirror").checked ? 1 : 0}`, { fast:true }); });

  function currentPalette() { return { main:(q("#main")?.value || "#FFFFFF").toUpperCase(), bg:(q("#bg")?.value || "#000000").toUpperCase(), fg:(q("#fg")?.value || "#8000FF").toUpperCase() }; }
  function setPaletteUI(p) { for (const role of ["main","bg","fg"]) { const value = (p[role] || currentPalette()[role]).toUpperCase(); q(`#${role}`).value = value; q(`#${role}Swatch`).style.background = value; } syncHue(); }
  function rgbToHue(hex) { const h=hex.replace("#", ""); const r=parseInt(h.slice(0,2),16)/255,g=parseInt(h.slice(2,4),16)/255,b=parseInt(h.slice(4,6),16)/255,max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min; if(!d)return 0; let hue=max===r?60*(((g-b)/d)%6):max===g?60*((b-r)/d+2):60*((r-g)/d+4); return hue<0?hue+360:hue; }
  function hueHex(h) { const c=1,x=1-Math.abs(((h/60)%2)-1); let r=0,g=0,b=0; if(h<60){r=c;g=x;}else if(h<120){r=x;g=c;}else if(h<180){g=c;b=x;}else if(h<240){g=x;b=c;}else if(h<300){r=x;b=c;}else{r=c;b=x;} const z=(v)=>Math.round(v*255).toString(16).padStart(2,"0").toUpperCase(); return `#${z(r)}${z(g)}${z(b)}`; }
  function syncHue() { const value=currentPalette()[activeRole], h=rgbToHue(value); q("#hueRange").value=Math.round(h); q("#hueSelector").style.setProperty("--hx",`${h/359*100}%`); q("#hueValue").textContent=value; q("#hueValue").style.color=value; }
  qa(".role").forEach((b) => b.addEventListener("click", () => { activeRole=b.dataset.role; qa(".role").forEach((x)=>x.classList.toggle("on",x===b)); syncHue(); }));
  q("#hueRange")?.addEventListener("input", () => { const hex=hueHex(+q("#hueRange").value); q(`#${activeRole}`).value=hex; q(`#${activeRole}Swatch`).style.background=hex; q("#hueValue").textContent=hex; q("#hueValue").style.color=hex; });
  q("#hueRange")?.addEventListener("change", async () => { const p=currentPalette(); await send(`MAIN=${p.main.slice(1)};BG=${p.bg.slice(1)};FG=${p.fg.slice(1)}`,{fast:true}); });

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
    const host=q("#savedColors"); if(!host)return; host.innerHTML="";
    const items=[...BUILTIN_COLORS.map((color)=>({color,builtin:true})),...customColors().map((color)=>({color,builtin:false}))];
    for(const {color,builtin} of items){
      const wrap=document.createElement("span"); wrap.className="saved-color-wrap";
      const b=document.createElement("button"); b.className="saved-color"; b.style.setProperty("--c",color); b.title=color;
      b.addEventListener("click",async()=>{q(`#${activeRole}`).value=color;q(`#${activeRole}Swatch`).style.background=color;syncHue();const p=currentPalette();await send(`MAIN=${p.main.slice(1)};BG=${p.bg.slice(1)};FG=${p.fg.slice(1)}`,{fast:true});});
      wrap.append(b);
      if(!builtin){const del=document.createElement("button");del.className="saved-color-delete";del.type="button";del.textContent="×";del.title=`Delete ${color}`;del.addEventListener("click",(e)=>{e.stopPropagation();saveJSON(SAVED_KEY,customColors().filter((c)=>c!==color));renderSavedColors();});wrap.append(del);}
      host.append(wrap);
    }
  }
  q("#saveColor")?.addEventListener("click",()=>{const c=currentPalette()[activeRole];saveJSON(SAVED_KEY,[c,...customColors().filter((x)=>x!==c)].slice(0,19));renderSavedColors();});

  function applyEffectCapabilities(fx) {
    const roles=rolesFor(fx); q("#bgbRow")?.classList.toggle("control-unavailable",!roles.includes("bg"));
    qa(".role").forEach((b)=>{const available=roles.includes(b.dataset.role);b.classList.toggle("role-unavailable",!available);b.disabled=!available;});
    if(!roles.includes(activeRole)){activeRole=roles.includes("main")?"main":roles.includes("fg")?"fg":roles.includes("bg")?"bg":"main";qa(".role").forEach((b)=>b.classList.toggle("on",b.dataset.role===activeRole));}
    q("#colorCapability").textContent=roles.length?`USES ${metaFor(fx)}`:"BUILT-IN COLOR — USER COLOR ROLES NOT USED";
  }
  function renderEffects() {
    const host=q("#effectList"); if(!host)return; const filter=(q("#fxSearch")?.value||"").trim().toLowerCase(); host.innerHTML="";
    const available=visibleEffects();
    const shown=available.filter((fx)=>!filter||prettyFx(fx).toLowerCase().includes(filter)); q("#fxCount").textContent=`${shown.length}/${available.length}`;
    for(const fx of shown){const b=document.createElement("button");b.className=`fx-item${activeFx===fx?" on":""}`;b.dataset.fx=fx;b.innerHTML=`<span>${prettyFx(fx)}</span><small>${metaFor(fx)}</small>`;b.addEventListener("click",()=>selectEffect(fx));host.append(b);}
  }
  q("#fxSearch")?.addEventListener("input",renderEffects);
  async function selectEffect(fx){
    stopPlaylist("Playlist stopped",true);
    if(CATALOG_FX.includes(fx)&&!catalogSupported()){log(`FX BLOCKED: ${fx} · active target has not verified V5.2 catalog support`);return false;}
    if(!(await send(`FX=${fx}`)))return false;
    if(CATALOG_FX.includes(fx)){
      const ids=window.STWBLE.targetMemberIds();
      const states=await Promise.all(ids.map((id)=>window.STWBLE.readStatus(id)));
      const accepted=states.length===ids.length&&states.every((s)=>s?.FX===fx);
      if(!accepted){
        const actual=states.map((s,i)=>`#${i+1}:${s?.FX||"?"}`).join(" · ");
        log(`FX REJECTED: ${fx} · ${actual}`);
        const first=states.find((s)=>s?.FX&&FX_EFFECTS.includes(s.FX));
        if(first)activeFx=first.FX;
        applyEffectCapabilities(activeFx);updateHeader();renderEffects();return false;
      }
      log(`FX VERIFIED: ${fx}`);
    }
    activeFx=fx;window.STWBLE.setLastFx(fx);applyEffectCapabilities(fx);updateHeader();renderEffects();return true;
  }

  function syncFromStatus(status){if(!status)return;if(status.FX&&FX_EFFECTS.includes(status.FX))activeFx=status.FX;setPaletteUI({main:status.MAIN?`#${status.MAIN}`:currentPalette().main,bg:status.BG?`#${status.BG}`:currentPalette().bg,fg:status.FG?`#${status.FG}`:currentPalette().fg});for(const[id,key]of Object.entries({bri:"BRI",spd:"SPD",int:"BGB",size:"SIZE",dens:"DENS",trail:"TRAIL"}))if(status[key]!=null&&q(`#${id}`)){q(`#${id}`).value=status[key];updateSlider(q(`#${id}`));}if(status.DIR)q("#dir").value=status.DIR;if(status.MIRROR!=null){q("#mirror").checked=+status.MIRROR>0;q("#mirrorBtn").classList.toggle("primary",q("#mirror").checked);}fillStartupEffects();applyEffectCapabilities(activeFx);updateHeader();renderEffects();}

  function captureState(name=activeFx){const p=currentPalette();return{name,fx:activeFx,...p,bri:+q("#bri").value,bgb:+q("#int").value,spd:+q("#spd").value,size:+q("#size").value,dens:+q("#dens").value,trail:+q("#trail").value,dir:q("#dir").value,mirror:q("#mirror").checked,durationSec:DEFAULT_PLAYLIST_SECONDS};}
  function buildStateCommand(s){return[`FX=${s.fx||activeFx}`,`MAIN=${String(s.main||currentPalette().main).replace("#","")}`,`BG=${String(s.bg||currentPalette().bg).replace("#","")}`,`FG=${String(s.fg||currentPalette().fg).replace("#","")}`,`BRI=${s.bri??q("#bri").value}`,`BGB=${s.bgb??q("#int").value}`,`SPD=${s.spd??q("#spd").value}`,`SIZE=${s.size??q("#size").value}`,`DENS=${s.dens??q("#dens").value}`,`TRAIL=${s.trail??q("#trail").value}`,`DIR=${s.dir||q("#dir").value}`,`MIRROR=${s.mirror?1:0}`].join(";");}
  async function applyState(s){if(CATALOG_FX.includes(s.fx)&&!catalogSupported()){log(`STATE BLOCKED: ${s.fx} requires verified V5.2 catalog support`);return;}activeFx=FX_EFFECTS.includes(s.fx)?s.fx:activeFx;setPaletteUI({main:s.main,bg:s.bg,fg:s.fg});for(const id of["bri","spd","size","dens","trail"])if(s[id]!=null)q(`#${id}`).value=s[id];if(s.bgb!=null)q("#int").value=s.bgb;q("#dir").value=s.dir||"FWD";q("#mirror").checked=!!s.mirror;updateAllSliders();if(await send(buildStateCommand(s))){window.STWBLE.setLastFx(activeFx);applyEffectCapabilities(activeFx);updateHeader();renderEffects();}}

  const presets=()=>{const x=loadJSON(PRESET_KEY,[]);return Array.isArray(x)?x:[];}; const savePresets=(x)=>saveJSON(PRESET_KEY,x.slice(0,50));
  function renderPresets(){const host=q("#presetGrid");if(!host)return;const list=presets();q("#presetCount").textContent=list.length?`${list.length} SAVED`:"";host.innerHTML="";if(!list.length){host.innerHTML='<div class="microcopy" style="text-align:center">No presets saved yet.</div>';return;}list.forEach((p,i)=>{const card=document.createElement("article");card.className="preset-card";card.innerHTML='<div class="preset-title"></div><div class="preset-meta"></div><div class="preset-colors"><i></i><i></i><i></i></div><div class="button-row"><button class="tiny-btn load">LOAD</button><button class="tiny-btn add">+ PLAYLIST</button><button class="tiny-btn danger del">DELETE</button></div>';card.querySelector(".preset-title").textContent=p.name||prettyFx(p.fx);card.querySelector(".preset-meta").textContent=`${prettyFx(p.fx)} · ${metaFor(p.fx)}`;[p.main,p.bg,p.fg].forEach((c,n)=>card.querySelectorAll(".preset-colors i")[n].style.background=c||"#000");card.querySelector(".load").onclick=()=>applyState(p);card.querySelector(".add").onclick=()=>addPlaylist(p);card.querySelector(".del").onclick=()=>{const x=presets();x.splice(i,1);savePresets(x);renderPresets();};host.append(card);});}
  function saveCurrentPreset(){const name=prompt("Preset name",prettyFx(activeFx));if(name===null)return;const list=presets();list.unshift(captureState(name.trim()||prettyFx(activeFx)));savePresets(list);renderPresets();}
  q("#saveFxPreset")?.addEventListener("click",saveCurrentPreset);q("#saveCurrentPreset")?.addEventListener("click",saveCurrentPreset);

  function playlist(){const x=loadJSON(PLAYLIST_KEY,[]);if(!Array.isArray(x))return[];let changed=false;x.forEach((s)=>{const n=Number(s.durationSec??s.duration??DEFAULT_PLAYLIST_SECONDS),d=Number.isFinite(n)?clamp(n,.25,3600):DEFAULT_PLAYLIST_SECONDS;if(s.durationSec!==d){s.durationSec=d;changed=true;}if("duration"in s){delete s.duration;changed=true;}});if(changed)saveJSON(PLAYLIST_KEY,x);return x;}
  const savePlaylist=(x)=>saveJSON(PLAYLIST_KEY,x.slice(0,100));function addPlaylist(state){const list=playlist();list.push({...state,durationSec:Number(state.durationSec)||DEFAULT_PLAYLIST_SECONDS});savePlaylist(list);renderPlaylist();}
  q("#addFxPlaylist")?.addEventListener("click",()=>addPlaylist(captureState(prettyFx(activeFx))));q("#addCurrentFx")?.addEventListener("click",()=>addPlaylist(captureState(prettyFx(activeFx))));
  function renderPlaylist(){const host=q("#playlistList");if(!host)return;const list=playlist();host.innerHTML="";if(!list.length){host.innerHTML='<div class="microcopy" style="text-align:center">Playlist is empty.</div>';return;}list.forEach((s,i)=>{const row=document.createElement("article");row.className="playlist-item";row.innerHTML='<span class="playlist-num"></span><span><b></b><small></small></span><label class="duration-wrap"><small>TIME SEC</small><input class="glass-field duration" type="number" min="0.25" max="3600" step="0.25"></label><div class="button-row"><button class="tiny-btn load">LOAD</button><button class="tiny-btn danger del">DELETE</button></div>';row.querySelector(".playlist-num").textContent=i+1;row.querySelector("b").textContent=s.name||prettyFx(s.fx);row.querySelector("small").textContent=prettyFx(s.fx);const dur=row.querySelector(".duration");dur.value=s.durationSec||DEFAULT_PLAYLIST_SECONDS;dur.onchange=()=>{const x=playlist();if(!x[i])return;x[i].durationSec=clamp(+dur.value||DEFAULT_PLAYLIST_SECONDS,.25,3600);dur.value=x[i].durationSec;savePlaylist(x);};row.querySelector(".load").onclick=()=>applyState(s);row.querySelector(".del").onclick=()=>{const x=playlist();x.splice(i,1);savePlaylist(x);renderPlaylist();};host.append(row);});}
  function syncShuffleButton(){const b=q("#shufflePlaylist");if(!b)return;b.classList.toggle("primary",playlistShuffle);b.textContent=playlistShuffle?"SHUFFLE ON":"SHUFFLE";b.setAttribute("aria-pressed",playlistShuffle?"true":"false");}
  function stopPlaylist(reason="Stopped · current effect held",keepEffect=true){playlistRunning=false;playlistRunToken++;clearTimeout(playlistTimer);playlistTimer=0;q("#playPlaylist").textContent="PLAY";q("#playlistStatus").textContent=reason;if(!keepEffect)send("FX=OFF");}
  function choosePlaylistIndex(count,ordered){if(!playlistShuffle)return ordered%count;if(count===1)return 0;let n;do n=Math.floor(Math.random()*count);while(n===playlistLastIndex);return n;}
  async function runPlaylistStep(token,ordered=0){if(!playlistRunning||token!==playlistRunToken)return;const list=playlist();if(!list.length){stopPlaylist("Playlist is empty");return;}const index=choosePlaylistIndex(list.length,ordered);playlistLastIndex=index;const item=list[index];await applyState(item);if(!playlistRunning||token!==playlistRunToken)return;const sec=clamp(+item.durationSec||DEFAULT_PLAYLIST_SECONDS,.25,3600);q("#playlistStatus").textContent=`${playlistShuffle?"SHUFFLE":"LOOP"} · ${item.name||prettyFx(item.fx)} · ${sec}s`;playlistTimer=setTimeout(()=>runPlaylistStep(token,playlistShuffle?ordered:ordered+1),Math.max(250,Math.round(sec*1000)));}
  function startPlaylist(){const list=playlist();if(!snap.passkey){log("Playlist needs a connected target.");return;}if(!list.length){log("Playlist is empty.");return;}playlistRunning=true;playlistRunToken++;playlistLastIndex=-1;q("#playPlaylist").textContent="RESTART";runPlaylistStep(playlistRunToken,0);}
  q("#playPlaylist")?.addEventListener("click",startPlaylist);q("#stopPlaylist")?.addEventListener("click",()=>stopPlaylist());q("#shufflePlaylist")?.addEventListener("click",()=>{playlistShuffle=!playlistShuffle;localStorage.setItem(SHUFFLE_KEY,playlistShuffle?"1":"0");syncShuffleButton();if(playlistRunning)startPlaylist();});q("#clearPlaylist")?.addEventListener("click",()=>{stopPlaylist("Playlist cleared");savePlaylist([]);renderPlaylist();});
  q("#playlistName").value=localStorage.getItem(PLAYLIST_NAME_KEY)||"My Light Sequence";q("#playlistName")?.addEventListener("input",(e)=>localStorage.setItem(PLAYLIST_NAME_KEY,e.target.value));

  function fillStartupEffects(){const sel=q("#startupFx");if(!sel)return;const value=sel.value||"RAINBOW",available=visibleEffects();sel.innerHTML="";for(const fx of available){const o=document.createElement("option");o.value=fx;o.textContent=prettyFx(fx);sel.append(o);}sel.value=available.includes(value)?value:"RAINBOW";}

  document.addEventListener("stw:ble",(e)=>{const oldTarget=JSON.stringify(snap.target);snap=window.STWBLE.snapshot();renderDevices();populateGranted();renderGroups();updateHeader();if(JSON.stringify(snap.target)!==oldTarget){formDirty=false;fillStartupEffects();loadDeviceForm(true);syncFromStatus(currentStatus());}else loadDeviceForm(false);if(e.detail?.type==="status"&&e.detail?.deviceId){const d=snap.devices.find((x)=>x.id===e.detail.deviceId);if(d&&(!snap.target||snap.target.type!=="device"||snap.target.id===d.id))syncFromStatus(d.lastStatus);}if(e.detail?.type==="connected"&&e.detail?.deviceId)setTimeout(async()=>{const s=await window.STWBLE.readStatus(e.detail.deviceId);if(s)log(`FW ${e.detail.deviceId}: VER=${s.VER||"?"} · FXCOUNT=${s.FXCOUNT||"?"} · CATALOG=${String(s.VER)==="52"&&Number(s.FXCOUNT)>51?"YES":"NO"}`);},150);if(["connect-error","tx-error","status-error","granted-error"].includes(e.detail?.type))log(`${e.detail.type}: ${e.detail.message||"unknown error"}`);});

  fillStartupEffects();renderDevices();populateGranted();renderGroups();renderSavedColors();renderEffects();renderPresets();renderPlaylist();syncShuffleButton();updateAllSliders();syncHue();applyEffectCapabilities(activeFx);updateHeader();loadDeviceForm(true);
  q("#playlistStatus").textContent=playlistShuffle?"Shuffle ready":"Ordered loop ready";
  log("Iteration 2 loaded: sync1 preserved · catalog gated by firmware · music removed · factual color roles · saved-color delete.");
})();