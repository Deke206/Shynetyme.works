"use strict";
(() => {
  const q = (s) => document.querySelector(s);
  const qa = (s) => [...document.querySelectorAll(s)];

  const PLAYLIST_KEY = "stw-esp32-custom-v4";
  const SHUFFLE_KEY = "stw-esp32-playlist-shuffle-v1";
  const PLAYER_STATE_KEY = "stw-esp32-playlist-player-v2";
  const DEFAULT_DURATION_MS = 5000;
  const MIN_DURATION_MS = 250;
  const MAX_DURATION_MS = 3600000;

  let running = false;
  let shuffle = localStorage.getItem(SHUFFLE_KEY) === "1";
  let runToken = 0;
  let orderedIndex = 0;
  let currentIndex = -1;
  let lastIndex = -1;
  let nextAt = 0;
  let timer = 0;
  let recoverBusy = false;
  let decorateQueued = false;

  function log(msg) {
    const x = q("#debugLog");
    if (!x) return;
    const ts = new Date().toLocaleTimeString();
    x.textContent = `${ts}  ${msg}\n${x.textContent}`.slice(0, 5000);
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function playlist() {
    try {
      const x = JSON.parse(localStorage.getItem(PLAYLIST_KEY) || "[]");
      return Array.isArray(x) ? x : [];
    } catch (_) {
      return [];
    }
  }

  function savePlaylist(list) {
    localStorage.setItem(PLAYLIST_KEY, JSON.stringify(Array.isArray(list) ? list : []));
  }

  function durationMs(item) {
    const v = Number(item?.durationMs);
    return Number.isFinite(v)
      ? clamp(Math.round(v), MIN_DURATION_MS, MAX_DURATION_MS)
      : DEFAULT_DURATION_MS;
  }

  function loadButtons() {
    return qa("#playlistList .playlist-item .load");
  }

  function setStatus(text) {
    const x = q("#stwPlaylistStatus");
    if (x) x.textContent = text;
  }

  function savePlayerState() {
    try {
      localStorage.setItem(
        PLAYER_STATE_KEY,
        JSON.stringify({
          running,
          shuffle,
          orderedIndex,
          currentIndex,
          lastIndex,
          nextAt,
          savedAt: Date.now(),
        }),
      );
    } catch (_) {}
  }

  function restorePlayerState() {
    try {
      const s = JSON.parse(localStorage.getItem(PLAYER_STATE_KEY) || "null");
      if (!s || typeof s !== "object") return;
      running = !!s.running;
      shuffle = typeof s.shuffle === "boolean" ? s.shuffle : shuffle;
      orderedIndex = Math.max(0, Number(s.orderedIndex) || 0);
      currentIndex = Number.isInteger(s.currentIndex) ? s.currentIndex : -1;
      lastIndex = Number.isInteger(s.lastIndex) ? s.lastIndex : currentIndex;
      nextAt = Math.max(0, Number(s.nextAt) || 0);
    } catch (_) {}
  }

  function syncShuffleButton() {
    const b = q("#shufflePlaylist");
    if (!b) return;
    b.classList.toggle("primary", shuffle);
    b.textContent = shuffle ? "SHUFFLE ON" : "SHUFFLE";
    b.setAttribute("aria-pressed", shuffle ? "true" : "false");
  }

  function syncPlayButton() {
    const play = q("#playPlaylist");
    if (play) play.textContent = running ? "RESTART LOOP" : "PLAY";
  }

  function stopLoop({ keepEffect = true, reason = "Stopped" } = {}) {
    running = false;
    runToken++;
    clearTimeout(timer);
    timer = 0;
    nextAt = 0;
    syncPlayButton();
    setStatus(reason);
    savePlayerState();
    if (!keepEffect) window.STWBLE?.send?.("FX=OFF");
  }

  function chooseNext(count) {
    if (!shuffle) {
      const n = orderedIndex % count;
      orderedIndex = (orderedIndex + 1) % count;
      return n;
    }
    if (count === 1) return 0;
    let n;
    do n = Math.floor(Math.random() * count);
    while (n === lastIndex);
    return n;
  }

  function normalizeDurations() {
    const list = playlist();
    let changed = false;
    for (const item of list) {
      const d = durationMs(item);
      if (item.durationMs !== d) {
        item.durationMs = d;
        changed = true;
      }
    }
    if (changed) savePlaylist(list);
    return list;
  }

  function saveRowDuration(index, seconds) {
    const list = playlist();
    if (!list[index]) return;
    const ms = clamp(
      Math.round((Number(seconds) || DEFAULT_DURATION_MS / 1000) * 1000),
      MIN_DURATION_MS,
      MAX_DURATION_MS,
    );
    list[index].durationMs = ms;
    savePlaylist(list);
    if (running && index === currentIndex) {
      nextAt = Date.now() + ms;
      scheduleCurrent(runToken, ms);
      savePlayerState();
      setStatus(`${shuffle ? "SHUFFLE" : "LOOP"} · duration ${formatDuration(ms)}`);
    }
  }

  function formatDuration(ms) {
    const sec = ms / 1000;
    return `${sec >= 10 || Number.isInteger(sec) ? sec.toFixed(0) : sec.toFixed(2)}s`;
  }

  function decoratePlaylistRows() {
    decorateQueued = false;
    const list = normalizeDurations();
    const rows = qa("#playlistList .playlist-item");
    rows.forEach((row, index) => {
      if (!list[index] || row.querySelector(".stw-duration")) return;
      const controls = row.querySelector(".button-row") || row;
      const wrap = document.createElement("label");
      wrap.className = "stw-duration";
      wrap.style.cssText =
        "display:inline-flex;align-items:center;gap:4px;color:#718aa0;font:800 5.8pt Oxanium;white-space:nowrap";
      wrap.innerHTML = `<span>TIME</span><input type="number" min="0.25" max="3600" step="0.25" inputmode="decimal" aria-label="Effect duration in seconds" style="width:58px;height:24px;border:1px solid rgba(132,211,255,.2);border-radius:5px;background:rgba(7,25,52,.25);color:#dff2ff;padding:0 5px"><span>SEC</span>`;
      const input = wrap.querySelector("input");
      input.value = String(durationMs(list[index]) / 1000);
      input.addEventListener("change", () => saveRowDuration(index, input.value));
      input.addEventListener("blur", () => saveRowDuration(index, input.value));
      controls.prepend(wrap);

      const small = row.querySelector("small");
      if (small && !small.dataset.stwDurationMeta) {
        small.dataset.stwDurationMeta = "1";
        small.textContent = `${small.textContent} · ${formatDuration(durationMs(list[index]))}`;
      }
    });
  }

  function queueDecorate() {
    if (decorateQueued) return;
    decorateQueued = true;
    queueMicrotask(decoratePlaylistRows);
  }

  async function reconnectSavedTarget() {
    if (recoverBusy) return !!window.STWBLE?.snapshot?.().passkey;
    if (!window.STWBLE?.snapshot || !window.STWBLE?.connectAssigned) return false;
    if (window.STWBLE.snapshot().passkey) return true;

    recoverBusy = true;
    try {
      await window.STWBLE.refreshGranted?.();
      const ids = window.STWBLE.targetMemberIds?.() || [];
      const s = window.STWBLE.snapshot();
      for (const id of ids) {
        const d = s.devices?.find((x) => x.id === id);
        if (!d?.bluetoothId || d.bleStatus === "connected") continue;
        try {
          await window.STWBLE.connectAssigned(id);
        } catch (e) {
          log(`Background reconnect: ${e.message}`);
        }
      }
      return !!window.STWBLE.snapshot().passkey;
    } finally {
      recoverBusy = false;
    }
  }

  function scheduleCurrent(token, waitMs) {
    clearTimeout(timer);
    timer = setTimeout(() => runStep(token), Math.max(0, waitMs));
  }

  async function applyIndex(index, token, remainingMs = null) {
    if (!running || token !== runToken) return;

    const list = normalizeDurations();
    const buttons = loadButtons();
    const count = Math.min(list.length, buttons.length);
    if (!count || index < 0 || index >= count) {
      stopLoop({ reason: "Playlist is empty" });
      return;
    }

    if (!window.STWBLE?.snapshot?.().passkey) {
      setStatus("Reconnecting saved BLE controller…");
      const ok = await reconnectSavedTarget();
      if (!running || token !== runToken) return;
      if (!ok) {
        setStatus("Playlist paused · saved BLE permission unavailable");
        scheduleCurrent(token, 1800);
        return;
      }
    }

    currentIndex = index;
    lastIndex = index;
    const item = list[index];
    const hold = remainingMs == null ? durationMs(item) : clamp(remainingMs, 50, durationMs(item));
    const name = item?.name || item?.fx || `Item ${index + 1}`;

    setStatus(`${shuffle ? "SHUFFLE" : "LOOP"} · ${name} · ${formatDuration(hold)}`);

    // Reuse the base UI's verified LOAD/applyState path. There is no extra transition gap.
    buttons[index].click();

    nextAt = Date.now() + hold;
    savePlayerState();
    scheduleCurrent(token, hold);
  }

  async function runStep(token) {
    if (!running || token !== runToken) return;
    const list = normalizeDurations();
    const count = Math.min(list.length, loadButtons().length);
    if (!count) {
      stopLoop({ reason: "Playlist is empty" });
      return;
    }
    const index = chooseNext(count);
    await applyIndex(index, token);
  }

  async function resumeFromSavedPosition(reason = "resume") {
    if (!running) return;
    const list = normalizeDurations();
    const count = Math.min(list.length, loadButtons().length);
    if (!count) {
      stopLoop({ reason: "Playlist is empty" });
      return;
    }

    runToken++;
    const token = runToken;
    syncPlayButton();

    const ok = await reconnectSavedTarget();
    if (!running || token !== runToken) return;
    if (!ok) {
      setStatus("Playlist waiting for saved BLE controller");
      scheduleCurrent(token, 1800);
      return;
    }

    const now = Date.now();
    if (currentIndex >= 0 && currentIndex < count && nextAt > now) {
      const remain = nextAt - now;
      log(`Playlist ${reason}: restored item ${currentIndex + 1} with ${formatDuration(remain)} remaining.`);
      await applyIndex(currentIndex, token, remain);
      return;
    }

    log(`Playlist ${reason}: advancing from saved position.`);
    await runStep(token);
  }

  function startLoop() {
    if (!playlist().length) {
      log("Playlist is empty.");
      return;
    }

    running = true;
    runToken++;
    orderedIndex = 0;
    currentIndex = -1;
    lastIndex = -1;
    nextAt = 0;
    savePlayerState();
    syncPlayButton();
    log(`Playlist loop started${shuffle ? " in shuffle mode" : " in order"}.`);
    runStep(runToken);
  }

  function install() {
    restorePlayerState();
    normalizeDurations();

    const oldPlay = q("#playPlaylist");
    const oldStop = q("#stopPlaylist");
    if (!oldPlay || !oldStop || q("#shufflePlaylist")) return;

    // Clone PLAY/STOP so the old one-pass timers and FX=OFF stop behavior are removed.
    const play = oldPlay.cloneNode(true);
    const stop = oldStop.cloneNode(true);
    oldPlay.replaceWith(play);
    oldStop.replaceWith(stop);

    play.addEventListener("click", startLoop);
    stop.addEventListener("click", () => {
      stopLoop({ keepEffect: true, reason: "Stopped · current effect held" });
      log("Playlist stopped; current effect left running.");
    });

    const shuffleBtn = document.createElement("button");
    shuffleBtn.id = "shufflePlaylist";
    shuffleBtn.className = "glass-btn";
    shuffleBtn.type = "button";
    stop.before(shuffleBtn);
    shuffleBtn.addEventListener("click", () => {
      shuffle = !shuffle;
      localStorage.setItem(SHUFFLE_KEY, shuffle ? "1" : "0");
      syncShuffleButton();
      savePlayerState();
      setStatus(
        running
          ? `${shuffle ? "SHUFFLE" : "LOOP"} · mode changed`
          : `${shuffle ? "Shuffle" : "Ordered"} ready`,
      );
      if (running) startLoop();
    });
    syncShuffleButton();
    syncPlayButton();

    const status = document.createElement("span");
    status.id = "stwPlaylistStatus";
    status.className = "microcopy";
    status.style.cssText = "display:block;text-align:center;margin-top:7px";
    status.textContent = running
      ? "Restoring persistent playlist…"
      : shuffle
        ? "Shuffle ready"
        : "Ordered loop ready";
    q("#playlistList")?.before(status);

    const host = q("#playlistList");
    if (host) {
      new MutationObserver(queueDecorate).observe(host, { childList: true, subtree: true });
      queueDecorate();
    }

    // Clearing the list stops the runner before the base UI removes entries.
    q("#clearPlaylist")?.addEventListener(
      "click",
      () => stopLoop({ reason: "Playlist stopped" }),
      true,
    );

    const recover = (reason) => {
      if (!running || document.visibilityState === "hidden") return;
      clearTimeout(timer);
      resumeFromSavedPosition(reason).catch((e) => log(`Playlist ${reason}: ${e.message}`));
    };

    document.addEventListener("visibilitychange", () => {
      savePlayerState();
      if (document.visibilityState === "hidden") {
        if (running) setStatus("Playlist state saved · background recovery armed");
        return;
      }
      recover("foreground");
    });
    window.addEventListener("pageshow", () => recover("pageshow"));
    window.addEventListener("focus", () => recover("focus"));
    window.addEventListener("pagehide", savePlayerState);
    window.addEventListener("beforeunload", savePlayerState);

    document.addEventListener("stw:ble", (e) => {
      if (!running) return;
      if (e.detail?.type === "disconnected" && document.visibilityState === "visible") {
        setTimeout(() => recover("BLE reconnect"), 350);
      }
    });

    if (running) {
      setTimeout(() => recover("page restore"), 650);
    }

    log("Playlist player loaded: persistent loop/shuffle, per-item duration, saved-position resume, BLE recovery.");
  }

  install();
})();
