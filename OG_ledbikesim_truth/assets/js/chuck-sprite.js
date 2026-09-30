(() => {
  "use strict";

  const FRAME_COUNT = 6;
  const FRAME_INTERVAL_MS = 74;
  const FRAME_STEP_PERCENT = 100 / (FRAME_COUNT - 1);
  const instances = new WeakMap();

  const mount = ({ button, image, scanUrl, laptopUrl }) => {
    if (!button || !image || !scanUrl || !laptopUrl) return null;
    if (instances.has(button)) return instances.get(button);

    image.classList.add("chuck-idle-image");
    image.style.setProperty("display", "block", "important");
    image.style.setProperty("animation", "none", "important");
    image.style.setProperty("transform", "none", "important");

    const sprite = document.createElement("span");
    sprite.className = "chuck-frame-sprite";
    sprite.setAttribute("aria-hidden", "true");
    Object.assign(sprite.style, {
      position: "absolute",
      inset: "0",
      display: "block",
      width: "100%",
      height: "100%",
      opacity: "0",
      backgroundImage: `url("${scanUrl}")`,
      backgroundRepeat: "no-repeat",
      backgroundSize: "600% 100%",
      backgroundPosition: "0% center",
      filter: "drop-shadow(0 0 9px rgba(49, 230, 255, .82))",
      pointerEvents: "none",
      zIndex: "1",
      transition: "opacity .12s ease"
    });
    image.insertAdjacentElement("afterend", sprite);

    [scanUrl, laptopUrl].forEach((url) => {
      const preload = new Image();
      preload.decoding = "async";
      preload.src = url;
    });

    const urls = { scan: scanUrl, laptop: laptopUrl };
    let mode = "scan";
    let frame = 0;
    let running = false;
    let rafId = 0;
    let lastFrameAt = 0;

    const setFrame = (index) => {
      frame = ((index % FRAME_COUNT) + FRAME_COUNT) % FRAME_COUNT;
      sprite.style.backgroundPosition = `${frame * FRAME_STEP_PERCENT}% center`;
    };

    const setMode = (nextMode) => {
      const requested = nextMode === "laptop" ? "laptop" : "scan";
      if (requested === mode && sprite.style.backgroundImage) return;
      mode = requested;
      sprite.style.backgroundImage = `url("${urls[mode]}")`;
      setFrame(0);
    };

    const showIdle = () => {
      sprite.style.opacity = "0";
      image.style.setProperty("display", "block", "important");
      image.style.setProperty("opacity", "1", "important");
    };

    const showResearch = () => {
      image.style.setProperty("display", "none", "important");
      sprite.style.opacity = "1";
    };

    const tick = (now) => {
      if (!running) return;
      if (!lastFrameAt || now - lastFrameAt >= FRAME_INTERVAL_MS) {
        setFrame(frame + 1);
        lastFrameAt = now;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    const api = {
      start(nextMode = "scan") {
        setMode(nextMode);
        showResearch();
        button.classList.add("has-live-chuck-frames");
        if (running) return;
        running = true;
        lastFrameAt = 0;
        rafId = window.requestAnimationFrame(tick);
      },
      stop() {
        running = false;
        window.cancelAnimationFrame(rafId);
        button.classList.remove("has-live-chuck-frames");
        setFrame(0);
        showIdle();
      },
      setMode
    };

    showIdle();
    instances.set(button, api);
    return api;
  };

  window.ShynetymeChuckSprite = { mount };
})();
