"use strict";
(() => {
  const q = (s) => document.querySelector(s);
  const qa = (s) => [...document.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const MUSIC_EFFECTS = [
    "VU",
    "SPECTRUM",
    "AUDIO_PULSE",
    "BEAT_FLASH",
    "SONIC_STREAM",
    "SONIC_BOOM",
    "RIPPLE",
    "STARBURST",
    "POPCORN",
    "DRIPDROP",
    "HEARTBEAT",
    "BLURZ",
    "FREQMAP",
    "FREQMATRIX",
    "FREQPIXELS",
    "FREQWAVE",
    "GRAVCENTER",
    "GRAVCENTRIC",
    "GRAVFREQ",
    "GRAVIMETER",
    "JUGGLES",
    "MATRIPIX",
    "MIDNOISE",
    "NOISEFIRE",
    "NOISEMETER",
    "NOISEMOVE",
    "PIXELS",
    "PIXELWAVE",
    "PLASMOID",
    "PUDDLEPEAK",
    "PUDDLES",
    "RIPPLE_PEAK",
    "ROCKTAVES",
    "WATERFALL",
    "DJ_LIGHT",
    "PS_GEQ_1D",
    "PS_SONIC_STREAM",
    "PS_SONIC_BOOM"
  ];

  const AUDIO_BANDS = [
    [43,86],[86,129],[129,216],[216,301],
    [301,430],[430,560],[560,818],[818,1120],
    [1120,1421],[1421,1895],[1895,2412],[2412,3015],
    [3015,3704],[3704,4479],[4479,7106],[7106,9259]
  ];

  const PLAYLIST_KEY = "stw-esp32-custom-v4";
  const PLAYLIST_SHUFFLE_KEY = "stw-esp32-playlist-shuffle-v2";
  const DEFAULT_PLAYLIST_SECONDS = 5;

  let micOn = false;
  let micStream = null;
  let audioCtx = null;
  let analyser = null;
  let audioRaf = 0;
  let audioBusy = false;
  let lastAudioSend = 0;
  let bassBase = 12;
  let lastBeat = 0;
  let playlistRunToken = 0;
  let playlistTimer = 0;
  let playlistRunning = false;
  let playlistShuffle = localStorage.getItem(PLAYLIST_SHUFFLE_KEY) === "1";
  let playlistLastIndex = -1;

  function snap() {
    return window.STWBLE?.snapshot?.() || {
      devices: [], groups: [], target: null, passkey: false, granted: []
    };
  }

  function selectedDevice() {
    const s = snap();
    return s.target?.type === "device"
      ? s.devices.find((d) => d.id === s.target.id) || null
      : null;
  }

  function targetPrimary() {
    const s = snap();
    if (s.target?.type === "device")
      return s.devices.find((d) => d.id === s.target.id) || null;
    if (s.target?.type === "group") {
      const g = s.groups?.find((x) => x.id === s.target.id);
      return s.devices.find((d) => g?.members?.includes(d.id)) || null;
    }
    return null;
  }

  function log(msg) {
    const x = q("#debugLog");
    if (!x) return;
    const ts = new Date().toLocaleTimeString();
    x.textContent = `${ts}  ${msg}\n${x.textContent}`.slice(0, 5000);
  }

  function prettyFx(fx) {
    return String(fx || "").replaceAll("_", " ");
  }

  function currentPalette() {
    return {
      main: q("#main")?.value?.toUpperCase() || "#FFFFFF",
      bg: q("#bg")?.value?.toUpperCase() || "#000000",
      fg: q("#fg")?.value?.toUpperCase() || "#FF2CA8",
    };
  }

  function updateSlider(x) {
    if (!x) return;
    const min = +x.min || 0;
    const max = +x.max || 255;
    const p = clamp(((+x.value - min) / (max - min)) * 100, 0, 100);
    const rail = x.closest(".sim-slider");
    if (rail) {
      const fill = rail.querySelector(".fill");
      const thumb = rail.querySelector(".thumb");
      if (fill) fill.style.width = p + "%";
      if (thumb) thumb.style.left = p + "%";
    }
    const out = q("#" + x.id + "V");
    if (out) out.textContent = Math.round(p) + "%";
  }

  function replaceRange(id, label, key, fallback) {
    const old = q("#" + id);
    if (!old) return null;
    const x = old.cloneNode(true);
    old.replaceWith(x);
    const row = x.closest(".slider-row");
    const lab = row?.querySelector("label");
    if (lab) lab.textContent = label;

    const st = targetPrimary()?.lastStatus || {};
    if (st[key] != null) x.value = st[key];
    else if (fallback != null) x.value = fallback;
    updateSlider(x);

    let timer = 0;
    const send = () => {
      const value = x.value;
      window.STWBLE.send(`${key}=${value}`, { fast: true });
      log(`TX ${key}=${value}`);
    };
    x.addEventListener("input", () => {
      updateSlider(x);
      clearTimeout(timer);
      timer = setTimeout(send, 55);
    });
    x.addEventListener("change", () => {
      clearTimeout(timer);
      send();
    });
    return x;
  }

  function suppressLegacyBrightnessOverride() {
    if (!window.STWBLE?.sendToDevice || window.STWBLE.__shyneFixWrapped) return;
    const raw = window.STWBLE.sendToDevice.bind(window.STWBLE);
    window.STWBLE.sendToDevice = async (id, text, opts = {}) => {
      if (String(text).trim() === "BRI=255" && opts?.fast) {
        log("Skipped legacy BRI=255 reconnect override.");
        return true;
      }
      return raw(id, text, opts);
    };
    window.STWBLE.__shyneFixWrapped = true;
  }

  function installBrightnessFix() {
    replaceRange("bri", "GLOBAL BRIGHTNESS", "BRI", 96);
    replaceRange("int", "BACKGROUND BRIGHTNESS", "BGB", 64);
  }

  function syncBrightnessFromStatus(st) {
    if (!st) return;
    const bri = q("#bri");
    const bg = q("#int");
    if (bri && st.BRI != null) {
      bri.value = st.BRI;
      updateSlider(bri);
    }
    if (bg && st.BGB != null) {
      bg.value = st.BGB;
      updateSlider(bg);
    }
  }

  function setSharedColor(role, hex) {
    const input = q("#" + role);
    if (input) input.value = hex.toUpperCase();
    const sw = q("#" + role + "Swatch");
    if (sw) sw.style.background = hex;
    const key = role === "main" ? "MAIN" : role === "bg" ? "BG" : "FG";
    window.STWBLE.send(`${key}=${hex.replace("#","").toUpperCase()}`, { fast: true });
  }

  function installMusicControls() {
    const musicPage = q("#music .music-layout");
    const micPanel = q("#music .music-control");
    if (!musicPage || !micPanel || q("#stwMusicFxPanel")) return;

    const fxPanel = document.createElement("section");
    fxPanel.id = "stwMusicFxPanel";
    fxPanel.className = "context-frame music-effects-frame";
    fxPanel.innerHTML = `
      <div class="context-title">MUSIC EFFECT</div>
      <select id="stwMusicFx" class="glass-field" style="width:100%;margin-bottom:8px"></select>
      <div class="microcopy" style="margin-bottom:9px">
        Selecting a music effect sends a real FX command and replaces the previous effect.
      </div>
      <div class="context-title" style="margin-top:10px">MUSIC COLORS</div>
      <div id="stwMusicColors" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px"></div>
    `;

    const spectrum = q("#music .spectrum-frame");
    if (spectrum) musicPage.insertBefore(fxPanel, spectrum);
    else musicPage.append(fxPanel);

    const sel = q("#stwMusicFx");
    for (const fx of MUSIC_EFFECTS) {
      const o = document.createElement("option");
      o.value = fx;
      o.textContent = prettyFx(fx);
      sel.append(o);
    }
    const now = targetPrimary()?.lastStatus?.FX || targetPrimary()?.lastFx;
    if (now && MUSIC_EFFECTS.includes(now)) sel.value = now;

    sel.addEventListener("change", async () => {
      const fx = sel.value;
      try {
        await window.STWBLE.send(`FX=${fx};AUDIO=1;AUDMODE=FULL;AUDAMT=255`);
        window.STWBLE.setLastFx?.(fx);
        const stateFx = q("#stateFx");
        if (stateFx) stateFx.textContent = prettyFx(fx);
        qa(".fx-item").forEach((b) => b.classList.toggle("on", b.dataset.fx === fx));
        log(`Music effect selected: ${fx}`);
      } catch (e) {
        log(`Music effect: ${e.message}`);
      }
    });

    const colorHost = q("#stwMusicColors");
    const labels = { main: "MAIN", bg: "BACKGROUND", fg: "FOREGROUND" };
    for (const role of ["main", "bg", "fg"]) {
      const wrap = document.createElement("label");
      wrap.style.cssText = "display:grid;gap:4px;color:#839ab0;font:800 6.3pt Oxanium";
      wrap.textContent = labels[role];
      const picker = document.createElement("input");
      picker.type = "color";
      picker.value = currentPalette()[role];
      picker.style.cssText = "width:100%;height:34px;border:0;background:transparent";
      picker.addEventListener("input", () => setSharedColor(role, picker.value));
      picker.addEventListener("change", () => setSharedColor(role, picker.value));
      wrap.append(picker);
      colorHost.append(wrap);
    }
  }

  function syncMusicColors() {
    const host = q("#stwMusicColors");
    if (!host) return;
    const p = currentPalette();
    const inputs = host.querySelectorAll('input[type="color"]');
    ["main","bg","fg"].forEach((role, i) => {
      if (inputs[i]) inputs[i].value = p[role];
    });
  }

  function bandValue(fd, lo, hi) {
    const hz = audioCtx.sampleRate / analyser.fftSize;
    const a = clamp(Math.floor(lo / hz), 0, fd.length - 1);
    const b = clamp(
      Math.ceil(Math.min(hi, audioCtx.sampleRate / 2) / hz),
      a + 1,
      fd.length
    );
    let sum = 0;
    for (let i = a; i < b; i++) sum += fd[i];
    return b > a ? sum / (b - a) : 0;
  }

  function hex2(v) {
    return clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0").toUpperCase();
  }

  function meter(id, v) {
    const x = q("#" + id);
    if (x) x.textContent = Math.round(v);
  }

  async function microphonePermissionState() {
    try {
      if (!navigator.permissions?.query) return "unknown";
      const p = await navigator.permissions.query({ name: "microphone" });
      return p.state || "unknown";
    } catch (_) {
      return "unknown";
    }
  }

  function setMicUi(live, detail = "") {
    const b = q("#micToggle");
    const s = q("#micState");
    if (b) b.textContent = live ? "STOP MICROPHONE" : "START MICROPHONE";
    if (s) {
      s.textContent = live ? "LIVE" : (detail || "OFF");
      s.classList.toggle("live", live);
    }
  }

  function stopMic(send = true) {
    micOn = false;
    if (audioRaf) cancelAnimationFrame(audioRaf);
    audioRaf = 0;
    micStream?.getTracks().forEach((t) => t.stop());
    micStream = null;
    audioCtx?.close().catch(() => {});
    audioCtx = null;
    analyser = null;
    audioBusy = false;
    qa(".spectrum-bar").forEach((b) => b.style.height = "4%");
    setMicUi(false);
    if (send) window.STWBLE.send("AUDIO=0");
  }

  async function startMic() {
    try {
      if (!window.isSecureContext) throw new Error("Microphone requires HTTPS.");
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error("Microphone API unavailable in this browser.");

      const before = await microphonePermissionState();
      log(`Microphone permission before request: ${before}`);

      micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC({ latencyHint: "interactive" });
      if (audioCtx.state === "suspended") await audioCtx.resume();

      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      analyser.smoothingTimeConstant = 0.28;
      audioCtx.createMediaStreamSource(micStream).connect(analyser);

      micOn = true;
      setMicUi(true);
      await window.STWBLE.send("AUDIO=1;AUDMODE=FULL;AUDAMT=255");
      lastAudioSend = 0;
      audioLoop();
      log("Microphone permission active; FFT audio streaming started.");
    } catch (e) {
      const state = await microphonePermissionState();
      log(`Microphone failed (${state}): ${e.name || "Error"} ${e.message}`);
      setMicUi(false, state === "denied" ? "BLOCKED" : "OFF");
      stopMic(false);
    }
  }

  async function sendAudio(vals, beat) {
    if (audioBusy) return;
    audioBusy = true;
    try {
      const bass = (vals[0]+vals[1]+vals[2]+vals[3]) / 4;
      const mid = (vals[4]+vals[5]+vals[6]+vals[7]+vals[8]+vals[9]) / 6;
      const high = (vals[10]+vals[11]+vals[12]+vals[13]+vals[14]+vals[15]) / 6;
      const level = vals.reduce((a,b) => a+b, 0) / vals.length;
      const packet = "F=" + vals.map(hex2).join("") + (beat ? "1" : "0");
      await window.STWBLE.send(packet, { fast: true });
      meter("stwAL", level);
      meter("stwAB", bass);
      meter("stwAM", mid);
      meter("stwAH", high);
      const tx = q("#stwATX");
      if (tx) tx.textContent = (+tx.textContent + 1) % 10000;
    } catch (e) {
      log(`Audio TX: ${e.message}`);
    } finally {
      audioBusy = false;
    }
  }

  function audioLoop(t = performance.now()) {
    if (!micOn || !analyser || !audioCtx) return;
    const fd = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(fd);
    const sens = +(q("#micSensitivity")?.value || 135) / 100;
    const vals = AUDIO_BANDS.map(([lo, hi]) =>
      clamp(bandValue(fd, lo, hi) * sens, 0, 255)
    );
    qa(".spectrum-bar").forEach((b, i) => {
      b.style.height = Math.max(4, vals[i] / 255 * 100).toFixed(1) + "%";
    });

    const bass = (vals[0] + vals[1] + vals[2] + vals[3]) / 4;
    bassBase = bassBase * 0.94 + bass * 0.06;
    const beat = bass > Math.max(24, bassBase * 1.35) && t - lastBeat > 165;
    if (beat) lastBeat = t;

    if (t - lastAudioSend >= 80) {
      lastAudioSend = t;
      sendAudio(vals, beat);
    }
    audioRaf = requestAnimationFrame(audioLoop);
  }

  async function audioLinkTest() {
    if (!snap().passkey) {
      log("Audio test needs a connected target.");
      return;
    }
    try {
      await window.STWBLE.send("AUDIO=1;AUDMODE=FULL;AUDAMT=255");
      for (let n = 0; n < 8; n++) {
        const vals = Array.from({ length: 16 }, (_, i) =>
          clamp((i < 4 ? 220 : i < 10 ? 130 : 75) + (n % 2 ? 25 : -15), 0, 255)
        );
        await sendAudio(vals, n % 2 === 0);
        await new Promise((r) => setTimeout(r, 120));
      }
      log("Synthetic FFT audio test sent.");
    } catch (e) {
      log(`Audio test: ${e.message}`);
    }
  }

  function installMicFix() {
    const old = q("#micToggle");
    if (!old) return;
    const b = old.cloneNode(true);
    old.replaceWith(b);
    b.addEventListener("click", () => micOn ? stopMic(true) : startMic());

    const panel = q("#music .music-control");
    if (!panel || q("#stwAudioTools")) return;

    const tools = document.createElement("div");
    tools.id = "stwAudioTools";
    tools.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px">
        <button id="stwAudioTest" class="glass-btn">AUDIO LINK TEST</button>
        <button id="stwAudioStop" class="glass-btn">STOP AUDIO TX</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin-top:8px">
        <div class="stw-meter"><small>LEVEL</small><b id="stwAL">0</b></div>
        <div class="stw-meter"><small>BASS</small><b id="stwAB">0</b></div>
        <div class="stw-meter"><small>MID</small><b id="stwAM">0</b></div>
        <div class="stw-meter"><small>HIGH</small><b id="stwAH">0</b></div>
        <div class="stw-meter"><small>TX</small><b id="stwATX">0</b></div>
      </div>
    `;
    panel.append(tools);
    q("#stwAudioTest").onclick = audioLinkTest;
    q("#stwAudioStop").onclick = () => stopMic(true);
  }

  function installStyles() {
    const s = document.createElement("style");
    s.textContent = `
      .music-effects-frame{min-height:160px}
      #stwMusicFxPanel input[type=color]{cursor:pointer}
      .stw-meter{padding:7px;border-radius:7px;background:rgba(4,16,35,.28);text-align:center}
      .stw-meter small{display:block;color:#70869d;font:700 6pt Oxanium}
      .stw-meter b{display:block;color:var(--blue);font:800 10pt Oxanium}
      .stw-playlist-time{display:grid;grid-template-columns:auto 76px;align-items:center;gap:5px;margin-left:auto;color:#70869d;font:700 6pt Oxanium}
      .stw-playlist-time input{width:76px;min-width:0;text-align:center}
      #stwPlaylistStatus{display:block;text-align:center;margin:7px 0;color:#70869d;font:700 6.4pt Oxanium}
      @media(max-width:820px){#music .music-layout{grid-template-columns:1fr}.stw-playlist-time{grid-template-columns:auto 68px}.stw-playlist-time input{width:68px}}
    `;
    document.head.append(s);
  }

  function readPlaylistData() {
    try {
      const list = JSON.parse(localStorage.getItem(PLAYLIST_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch (_) {
      return [];
    }
  }

  function writePlaylistData(list) {
    try {
      localStorage.setItem(PLAYLIST_KEY, JSON.stringify(list.slice(0, 100)));
    } catch (_) {}
  }

  function normalizedDuration(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return DEFAULT_PLAYLIST_SECONDS;
    return clamp(n, 0.25, 3600);
  }

  function ensurePlaylistDurations() {
    const list = readPlaylistData();
    let changed = false;
    list.forEach((item) => {
      const next = normalizedDuration(item.durationSec ?? item.duration ?? DEFAULT_PLAYLIST_SECONDS);
      if (item.durationSec !== next) {
        item.durationSec = next;
        changed = true;
      }
      if (Object.prototype.hasOwnProperty.call(item, "duration")) {
        delete item.duration;
        changed = true;
      }
    });
    if (changed) writePlaylistData(list);
    return list;
  }

  function setPlaylistStatus(text) {
    let x = q("#stwPlaylistStatus");
    if (!x) {
      x = document.createElement("span");
      x.id = "stwPlaylistStatus";
      q("#playlistList")?.before(x);
    }
    if (x) x.textContent = text;
  }

  function syncPlaylistShuffleButton() {
    const b = q("#shufflePlaylist");
    if (!b) return;
    b.classList.toggle("primary", playlistShuffle);
    b.textContent = playlistShuffle ? "SHUFFLE ON" : "SHUFFLE";
    b.setAttribute("aria-pressed", playlistShuffle ? "true" : "false");
  }

  function decoratePlaylistRows() {
    const host = q("#playlistList");
    if (!host) return;
    const list = ensurePlaylistDurations();
    const rows = qa("#playlistList .playlist-item");
    rows.forEach((row, i) => {
      if (row.querySelector(".stw-playlist-time")) return;
      const item = list[i];
      if (!item) return;
      const wrap = document.createElement("label");
      wrap.className = "stw-playlist-time";
      wrap.innerHTML = '<span>TIME SEC</span><input class="glass-field" type="number" min="0.25" max="3600" step="0.25">';
      const input = wrap.querySelector("input");
      input.value = normalizedDuration(item.durationSec);
      const save = () => {
        const current = readPlaylistData();
        if (!current[i]) return;
        const seconds = normalizedDuration(input.value);
        input.value = seconds;
        current[i].durationSec = seconds;
        writePlaylistData(current);
        setPlaylistStatus(`Item ${i + 1}: ${seconds}s`);
      };
      input.addEventListener("change", save);
      input.addEventListener("blur", save);
      const buttons = row.querySelector(".button-row");
      if (buttons) row.insertBefore(wrap, buttons);
      else row.append(wrap);
    });
  }

  function stopPlaylistDurationRun(reason = "Stopped · current effect held") {
    playlistRunning = false;
    playlistRunToken++;
    if (playlistTimer) clearTimeout(playlistTimer);
    playlistTimer = 0;
    const play = q("#playPlaylist");
    if (play) play.textContent = "PLAY";
    setPlaylistStatus(reason);
  }

  function choosePlaylistIndex(count, orderedIndex) {
    if (!playlistShuffle) return orderedIndex % count;
    if (count === 1) return 0;
    let next;
    do next = Math.floor(Math.random() * count);
    while (next === playlistLastIndex);
    return next;
  }

  function runPlaylistDurationStep(token, orderedIndex = 0) {
    if (!playlistRunning || token !== playlistRunToken) return;
    const list = ensurePlaylistDurations();
    const buttons = qa("#playlistList .playlist-item .load");
    const count = Math.min(list.length, buttons.length);
    if (!count) {
      stopPlaylistDurationRun("Playlist is empty");
      return;
    }
    const index = choosePlaylistIndex(count, orderedIndex);
    playlistLastIndex = index;
    const item = list[index];
    const seconds = normalizedDuration(item.durationSec);
    buttons[index].click();
    setPlaylistStatus(`${playlistShuffle ? "SHUFFLE" : "LOOP"} · ${item.name || prettyFx(item.fx) || `Item ${index + 1}`} · ${seconds}s`);
    playlistTimer = setTimeout(
      () => runPlaylistDurationStep(token, playlistShuffle ? orderedIndex : orderedIndex + 1),
      Math.max(250, Math.round(seconds * 1000))
    );
  }

  function startPlaylistDurationRun() {
    const list = ensurePlaylistDurations();
    if (!snap().passkey) {
      log("Playlist needs a connected target.");
      return;
    }
    if (!list.length) {
      log("Playlist is empty.");
      return;
    }
    playlistRunning = true;
    playlistRunToken++;
    if (playlistTimer) clearTimeout(playlistTimer);
    playlistLastIndex = -1;
    const token = playlistRunToken;
    const play = q("#playPlaylist");
    if (play) play.textContent = "RESTART";
    setPlaylistStatus(`${playlistShuffle ? "Shuffle" : "Ordered loop"} running with per-item durations`);
    runPlaylistDurationStep(token, 0);
  }

  function installPlaylistDuration() {
    const host = q("#playlistList");
    const oldPlay = q("#playPlaylist");
    const oldStop = q("#stopPlaylist");
    if (!host || !oldPlay || !oldStop || oldPlay.dataset.durationBound === "1") return;

    ensurePlaylistDurations();
    decoratePlaylistRows();

    const play = oldPlay.cloneNode(true);
    const stop = oldStop.cloneNode(true);
    play.dataset.durationBound = "1";
    stop.dataset.durationBound = "1";
    oldPlay.replaceWith(play);
    oldStop.replaceWith(stop);

    const shuffle = document.createElement("button");
    shuffle.id = "shufflePlaylist";
    shuffle.className = "glass-btn";
    shuffle.type = "button";
    stop.before(shuffle);
    syncPlaylistShuffleButton();

    play.textContent = "PLAY";
    play.addEventListener("click", startPlaylistDurationRun);
    stop.addEventListener("click", () => stopPlaylistDurationRun());
    shuffle.addEventListener("click", () => {
      playlistShuffle = !playlistShuffle;
      localStorage.setItem(PLAYLIST_SHUFFLE_KEY, playlistShuffle ? "1" : "0");
      syncPlaylistShuffleButton();
      if (playlistRunning) startPlaylistDurationRun();
      else setPlaylistStatus(playlistShuffle ? "Shuffle ready" : "Ordered loop ready");
    });

    const observer = new MutationObserver(() => {
      ensurePlaylistDurations();
      decoratePlaylistRows();
    });
    observer.observe(host, { childList: true });

    q("#clearPlaylist")?.addEventListener("click", () => stopPlaylistDurationRun("Playlist stopped"), true);
    setPlaylistStatus(playlistShuffle ? "Shuffle ready" : "Ordered loop ready");
    log("Playlist restored: ordered loop + shuffle + per-item TIME SEC; STOP holds current effect.");
  }

  function renderSavedAssignments() {
    const sel = q("#grantedBluetooth");
    if (!sel) return;
    const s = snap();
    const cur = sel.value;
    const seen = new Set([...sel.options].map((o) => o.value));

    for (const d of s.devices) {
      if (!d.bluetoothId || seen.has(d.bluetoothId)) continue;
      const o = document.createElement("option");
      o.value = d.bluetoothId;
      o.textContent = `${d.bluetoothName || d.name} — SAVED`;
      o.dataset.savedOnly = "1";
      sel.append(o);
      seen.add(d.bluetoothId);
    }

    if ([...sel.options].some((o) => o.value === cur)) sel.value = cur;
    else {
      const d = selectedDevice();
      if (d?.bluetoothId && [...sel.options].some((o) => o.value === d.bluetoothId))
        sel.value = d.bluetoothId;
    }
  }

  function installReconnectFix() {
    const old = q("#reconnectSelected");
    if (!old) return;
    const b = old.cloneNode(true);
    old.replaceWith(b);

    b.addEventListener("click", async () => {
      const d = selectedDevice();
      if (!d) return;
      b.disabled = true;
      const oldText = b.textContent;
      b.textContent = "RECONNECTING…";
      try {
        await window.STWBLE.refreshGranted();
        if (d.bluetoothId) {
          const ok = await window.STWBLE.connectAssigned(d.id);
          if (ok) {
            log(`Reconnected saved device ${d.bluetoothName || d.name}.`);
            setTimeout(() => window.STWBLE.readStatus(d.id), 160);
            return;
          }
        }
        log("Saved browser permission unavailable; opening Bluetooth picker.");
        await window.STWBLE.assignNew(d.id);
        setTimeout(() => window.STWBLE.readStatus(d.id), 160);
      } catch (e) {
        log(e.name === "NotFoundError" ? "Bluetooth selection cancelled." : `Reconnect: ${e.message}`);
      } finally {
        b.disabled = false;
        b.textContent = oldText || "RECONNECT";
        setTimeout(renderSavedAssignments, 0);
      }
    });
  }

  function syncMusicEffect(st) {
    const sel = q("#stwMusicFx");
    const fx = st?.FX || targetPrimary()?.lastFx;
    if (sel && MUSIC_EFFECTS.includes(fx)) sel.value = fx;
  }

  document.addEventListener("stw:ble", (e) => {
    const type = e.detail?.type;
    const id = e.detail?.deviceId;
    setTimeout(renderSavedAssignments, 0);

    if (type === "connected" && id) {
      setTimeout(() => window.STWBLE.readStatus(id), 160);
    }
    if (type === "status" && id) {
      const d = snap().devices.find((x) => x.id === id);
      syncBrightnessFromStatus(d?.lastStatus);
      syncMusicEffect(d?.lastStatus);
      syncMusicColors();
    }
    if (type === "target") {
      setTimeout(() => {
        syncBrightnessFromStatus(targetPrimary()?.lastStatus || {});
        syncMusicEffect(targetPrimary()?.lastStatus || {});
        syncMusicColors();
      }, 0);
    }
  });

  suppressLegacyBrightnessOverride();
  installStyles();
  installBrightnessFix();
  installMusicControls();
  installMicFix();
  installReconnectFix();
  installPlaylistDuration();
  renderSavedAssignments();
  syncBrightnessFromStatus(targetPrimary()?.lastStatus || {});
  syncMusicEffect(targetPrimary()?.lastStatus || {});
  log("V5.2 controller fix loaded: BGB background slider, firmware music FX, microphone diagnostics, saved-device reconnect, playlist duration + shuffle.");
})();