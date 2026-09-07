"use strict";
(() => {
  const q = (s) => document.querySelector(s);
  const qa = (s) => [...document.querySelectorAll(s)];
  const PLAYLIST_KEY = "stw-esp32-custom-v4";
  const SHUFFLE_KEY = "stw-esp32-playlist-shuffle-v1";
  const STEP_MS = 1300;

  let running = false;
  let shuffle = localStorage.getItem(SHUFFLE_KEY) === "1";
  let runToken = 0;
  let lastIndex = -1;
  let timer = 0;

  function log(msg) {
    const x = q("#debugLog");
    if (!x) return;
    const ts = new Date().toLocaleTimeString();
    x.textContent = `${ts}  ${msg}\n${x.textContent}`.slice(0, 5000);
  }

  function playlist() {
    try {
      const x = JSON.parse(localStorage.getItem(PLAYLIST_KEY) || "[]");
      return Array.isArray(x) ? x : [];
    } catch (_) {
      return [];
    }
  }

  function loadButtons() {
    return qa("#playlistList .playlist-item .load");
  }

  function setStatus(text) {
    const x = q("#stwPlaylistStatus");
    if (x) x.textContent = text;
  }

  function syncShuffleButton() {
    const b = q("#shufflePlaylist");
    if (!b) return;
    b.classList.toggle("primary", shuffle);
    b.textContent = shuffle ? "SHUFFLE ON" : "SHUFFLE";
    b.setAttribute("aria-pressed", shuffle ? "true" : "false");
  }

  function stopLoop({ keepEffect = true, reason = "Stopped" } = {}) {
    running = false;
    runToken++;
    clearTimeout(timer);
    timer = 0;
    const play = q("#playPlaylist");
    if (play) play.textContent = "PLAY";
    setStatus(reason);
    if (!keepEffect) window.STWBLE?.send?.("FX=OFF");
  }

  function chooseNext(count, orderedIndex) {
    if (!shuffle) return orderedIndex % count;
    if (count === 1) return 0;
    let n;
    do n = Math.floor(Math.random() * count);
    while (n === lastIndex);
    return n;
  }

  async function runStep(token, orderedIndex = 0) {
    if (!running || token !== runToken) return;

    const list = playlist();
    const buttons = loadButtons();
    const count = Math.min(list.length, buttons.length);
    if (!count) {
      stopLoop({ reason: "Playlist is empty" });
      return;
    }

    const index = chooseNext(count, orderedIndex);
    lastIndex = index;
    const item = list[index];
    const name = item?.name || item?.fx || `Item ${index + 1}`;
    setStatus(`${shuffle ? "SHUFFLE" : "LOOP"} · ${name}`);

    // Reuse the page's existing verified playlist LOAD/applyState path.
    buttons[index].click();

    timer = setTimeout(() => {
      runStep(token, shuffle ? orderedIndex : orderedIndex + 1);
    }, STEP_MS);
  }

  function startLoop() {
    if (!window.STWBLE?.snapshot?.().passkey) {
      log("Playlist needs a connected target.");
      return;
    }
    if (!playlist().length) {
      log("Playlist is empty.");
      return;
    }

    running = true;
    runToken++;
    lastIndex = -1;
    const token = runToken;
    const play = q("#playPlaylist");
    if (play) play.textContent = "RESTART LOOP";
    log(`Playlist loop started${shuffle ? " in shuffle mode" : " in order"}.`);
    runStep(token, 0);
  }

  function install() {
    const oldPlay = q("#playPlaylist");
    const oldStop = q("#stopPlaylist");
    if (!oldPlay || !oldStop || q("#shufflePlaylist")) return;

    // Clone PLAY/STOP so the old one-pass timers and FX=OFF stop behavior are removed.
    const play = oldPlay.cloneNode(true);
    const stop = oldStop.cloneNode(true);
    oldPlay.replaceWith(play);
    oldStop.replaceWith(stop);

    play.textContent = "PLAY";
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
      setStatus(running ? `${shuffle ? "SHUFFLE" : "LOOP"} · mode changed` : `${shuffle ? "Shuffle" : "Ordered"} ready`);
      if (running) startLoop();
    });
    syncShuffleButton();

    const status = document.createElement("span");
    status.id = "stwPlaylistStatus";
    status.className = "microcopy";
    status.style.cssText = "display:block;text-align:center;margin-top:7px";
    status.textContent = shuffle ? "Shuffle ready" : "Ordered loop ready";
    q("#playlistList")?.before(status);

    // Clearing the list must also stop our continuous runner.
    q("#clearPlaylist")?.addEventListener("click", () => stopLoop({ reason: "Playlist stopped" }), true);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && running)
        setStatus("Loop running in background tab");
    });

    log("Playlist player loaded: continuous loop + shuffle; STOP holds current effect.");
  }

  install();
})();
