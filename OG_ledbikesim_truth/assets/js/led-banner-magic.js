(() => {
  "use strict";

  const canvas = document.getElementById("ledMagicCanvas");
  const effectLabel = document.getElementById("ledMagicEffectLabel");
  if (!canvas) return;

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;

  const palette = ["#31e6ff", "#48a9ff", "#9b83ff", "#ff5ab9", "#ffc562", "#55e6b5"];
  const effects = [
    {
      text: "SHYNETYME WORKS",
      label: "Rainbow color chase",
      mode: "scroll",
      duration: 7200
    },
    {
      text: "DIRECT YO LYTE",
      label: "Center-out pixel bloom",
      mode: "center",
      duration: 6100
    },
    {
      text: "CUSTOM LED BUILDS",
      label: "Electric scanner sweep",
      mode: "scan",
      duration: 6100
    },
    {
      text: "WEBSITES • BIKES • VANS • MORE",
      label: "Type-on sparkle",
      mode: "type",
      duration: 7600
    }
  ];

  let cssWidth = 0;
  let cssHeight = 0;
  let rows = 18;
  let columns = 96;
  let cellWidth = 8;
  let cellHeight = 8;
  let masks = [];
  let effectIndex = 0;
  let effectStartedAt = performance.now();
  let lastFrameAt = 0;
  let animationFrame = 0;

  const clamp = (value, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));

  function buildTextMask(text) {
    const scratch = document.createElement("canvas");
    const scratchContext = scratch.getContext("2d", { willReadFrequently: true });
    const fontSize = Math.max(9, Math.floor(rows * .66));

    scratchContext.font = `800 ${fontSize}px Oxanium, Trebuchet MS, sans-serif`;
    const measuredWidth = Math.ceil(scratchContext.measureText(text).width) + 6;
    scratch.width = Math.max(1, measuredWidth);
    scratch.height = rows;

    scratchContext.clearRect(0, 0, scratch.width, scratch.height);
    scratchContext.font = `800 ${fontSize}px Oxanium, Trebuchet MS, sans-serif`;
    scratchContext.fillStyle = "#fff";
    scratchContext.textAlign = "left";
    scratchContext.textBaseline = "middle";
    scratchContext.fillText(text, 3, rows / 2 + .5);

    const image = scratchContext.getImageData(0, 0, scratch.width, scratch.height);
    const points = [];

    for (let y = 0; y < scratch.height; y += 1) {
      for (let x = 0; x < scratch.width; x += 1) {
        const alpha = image.data[((y * scratch.width + x) * 4) + 3];
        if (alpha > 78) points.push({ x, y, alpha: alpha / 255 });
      }
    }

    return { width: scratch.width, height: scratch.height, points };
  }

  function resizeCanvas() {
    const bounds = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    cssWidth = Math.max(1, bounds.width);
    cssHeight = Math.max(1, bounds.height);
    rows = cssWidth < 560 ? 14 : 18;
    cellHeight = cssHeight / rows;
    columns = Math.max(36, Math.floor(cssWidth / cellHeight));
    cellWidth = cssWidth / columns;

    canvas.width = Math.round(cssWidth * pixelRatio);
    canvas.height = Math.round(cssHeight * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    masks = effects.map((effect) => buildTextMask(effect.text));
  }

  function colorAt(position) {
    const normalized = ((position % palette.length) + palette.length) % palette.length;
    return palette[Math.floor(normalized)];
  }

  function drawLed(gridX, gridY, color, alpha = 1, glow = 1) {
    if (gridX < -1 || gridX > columns + 1 || gridY < -1 || gridY > rows + 1) return;

    const x = (gridX + .5) * cellWidth;
    const y = (gridY + .5) * cellHeight;
    const radius = Math.max(1.05, Math.min(cellWidth, cellHeight) * .27);

    context.globalAlpha = clamp(alpha);
    context.fillStyle = color;
    context.shadowColor = color;
    context.shadowBlur = Math.max(2, Math.min(cellWidth, cellHeight) * .68 * glow);
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  function drawBackground(time) {
    context.save();
    context.shadowBlur = 0;

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        const twinkleSeed = (x * 17) + (y * 31);
        const twinkle = twinkleSeed % 43 === 0
          ? .045 + ((Math.sin((time * .003) + twinkleSeed) + 1) * .025)
          : .028;
        context.globalAlpha = twinkle;
        context.fillStyle = twinkleSeed % 2 ? "#31e6ff" : "#9b83ff";
        context.beginPath();
        context.arc(
          (x + .5) * cellWidth,
          (y + .5) * cellHeight,
          Math.max(.55, Math.min(cellWidth, cellHeight) * .095),
          0,
          Math.PI * 2
        );
        context.fill();
      }
    }

    context.restore();
  }

  function drawScroll(mask, elapsed, duration, fade) {
    const travelProgress = clamp(elapsed / Math.max(1, duration - 550));
    const originX = columns - (travelProgress * (mask.width + columns));

    mask.points.forEach((point) => {
      const wave = (point.x * .2) + (point.y * .08) + (elapsed * .0065);
      const shimmer = .76 + ((Math.sin((elapsed * .012) + point.x) + 1) * .12);
      drawLed(originX + point.x, point.y, colorAt(wave), point.alpha * fade * shimmer, 1.05);
    });
  }

  function drawCenter(mask, elapsed, fade) {
    const originX = (columns - mask.width) / 2;
    const reveal = clamp((elapsed - 280) / 1750);
    const halfWidth = mask.width / 2;
    const allowedDistance = halfWidth * reveal;
    const pulse = .78 + ((Math.sin(elapsed * .006) + 1) * .11);

    mask.points.forEach((point) => {
      const distance = Math.abs(point.x - halfWidth);
      if (distance > allowedDistance) return;

      const edgeBoost = clamp(1 - (Math.abs(distance - allowedDistance) / 4));
      const colorPosition = (distance * .18) + (elapsed * .0035);
      drawLed(
        originX + point.x,
        point.y,
        colorAt(colorPosition),
        point.alpha * fade * (pulse + (edgeBoost * .22)),
        1 + edgeBoost
      );
    });

    if (reveal < 1) {
      const leftEdge = originX + halfWidth - allowedDistance;
      const rightEdge = originX + halfWidth + allowedDistance;
      for (let y = 1; y < rows; y += 3) {
        drawLed(leftEdge - 1, y, "#ffc562", fade * .62, 1.3);
        drawLed(rightEdge + 1, rows - y - 1, "#31e6ff", fade * .62, 1.3);
      }
    }
  }

  function drawScan(mask, elapsed, fade) {
    const originX = (columns - mask.width) / 2;
    const scanPosition = (((elapsed - 220) % 2600) / 2600) * (mask.width + 14) - 7;

    mask.points.forEach((point) => {
      const distance = Math.abs(point.x - scanPosition);
      const scanStrength = clamp(1 - (distance / 6));
      const baseAlpha = .24 + (scanStrength * .82);
      const color = scanStrength > .72
        ? "#ffc562"
        : colorAt((point.x * .14) + (elapsed * .003));
      drawLed(originX + point.x, point.y, color, point.alpha * fade * baseAlpha, .75 + scanStrength);
    });

    for (let y = 0; y < rows; y += 2) {
      drawLed(originX + scanPosition, y, y % 4 ? "#31e6ff" : "#ff5ab9", fade * .32, 1.4);
    }
  }

  function drawType(mask, elapsed, fade) {
    const originX = (columns - mask.width) / 2;
    const reveal = clamp((elapsed - 260) / 2750);
    const revealColumn = mask.width * reveal;

    mask.points.forEach((point) => {
      if (point.x > revealColumn) return;
      const distanceToCursor = Math.abs(point.x - revealColumn);
      const spark = clamp(1 - (distanceToCursor / 5));
      const color = spark > .72
        ? "#ffc562"
        : colorAt((point.x * .17) + (point.y * .08) + (elapsed * .002));
      drawLed(originX + point.x, point.y, color, point.alpha * fade * (.72 + (spark * .35)), .9 + spark);
    });

    if (reveal < 1) {
      const cursorX = originX + revealColumn;
      for (let y = 1; y < rows - 1; y += 2) {
        const flicker = .35 + ((Math.sin((elapsed * .02) + y) + 1) * .22);
        drawLed(cursorX + ((y % 4) ? .35 : -.25), y, y % 3 ? "#ff5ab9" : "#31e6ff", fade * flicker, 1.35);
      }
    }
  }

  function setEffect(index, now = performance.now()) {
    effectIndex = (index + effects.length) % effects.length;
    effectStartedAt = now;
    const effect = effects[effectIndex];
    if (effectLabel) effectLabel.textContent = `${effect.label} · ${effectIndex + 1}/${effects.length}`;
  }

  function render(now) {
    animationFrame = window.requestAnimationFrame(render);
    if (now - lastFrameAt < 30) return;
    lastFrameAt = now;

    const effect = effects[effectIndex];
    let elapsed = now - effectStartedAt;

    if (elapsed >= effect.duration) {
      setEffect(effectIndex + 1, now);
      elapsed = 0;
    }

    const fadeIn = clamp(elapsed / 480);
    const fadeOut = clamp((effect.duration - elapsed) / 680);
    const fade = Math.min(fadeIn, fadeOut);

    context.clearRect(0, 0, cssWidth, cssHeight);
    drawBackground(now);
    context.save();
    context.globalCompositeOperation = "lighter";

    const mask = masks[effectIndex];
    if (mask) {
      if (effect.mode === "scroll") drawScroll(mask, elapsed, effect.duration, fade);
      if (effect.mode === "center") drawCenter(mask, elapsed, fade);
      if (effect.mode === "scan") drawScan(mask, elapsed, fade);
      if (effect.mode === "type") drawType(mask, elapsed, fade);
    }

    context.restore();
  }

  function advanceEffect() {
    setEffect(effectIndex + 1);
  }

  canvas.addEventListener("click", advanceEffect);
  canvas.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      advanceEffect();
    }
  });

  const resizeObserver = "ResizeObserver" in window
    ? new ResizeObserver(resizeCanvas)
    : null;

  if (resizeObserver) resizeObserver.observe(canvas);
  else window.addEventListener("resize", resizeCanvas, { passive: true });

  Promise.resolve(document.fonts?.ready).finally(() => {
    resizeCanvas();
    setEffect(0);
    animationFrame = window.requestAnimationFrame(render);
  });

  window.addEventListener("pagehide", () => {
    window.cancelAnimationFrame(animationFrame);
    resizeObserver?.disconnect();
  });
})();
