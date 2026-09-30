(() => {
  "use strict";

  if (window.ShyneTymeLedSimEffectDialog) return;

  const MODULE_VERSION = "2026.08.09-effect-dialog-groups-step6";

  const EFFECT_RULES = Object.freeze({
    solid: Object.freeze({ addressableOnly: false, colorRequired: false, density: false, intensity: false }),
    breathe: Object.freeze({ addressableOnly: false, colorRequired: false, density: false, intensity: true }),
    wave: Object.freeze({ addressableOnly: true, colorRequired: false, density: true, intensity: true }),
    wipe: Object.freeze({ addressableOnly: true, colorRequired: false, density: false, intensity: true }),
    chase: Object.freeze({ addressableOnly: true, colorRequired: false, density: true, intensity: true }),
    theater: Object.freeze({ addressableOnly: true, colorRequired: false, density: true, intensity: true }),
    scanner: Object.freeze({ addressableOnly: true, colorRequired: false, density: false, intensity: true }),
    twinkle: Object.freeze({ addressableOnly: true, colorRequired: false, density: true, intensity: true }),
    starlight: Object.freeze({ addressableOnly: true, colorRequired: false, density: true, intensity: true }),
    sections: Object.freeze({ addressableOnly: true, colorRequired: false, density: true, intensity: true }),
    rainbow: Object.freeze({ addressableOnly: true, colorRequired: true, density: false, intensity: true })
  });

  const DIRECTIONS = Object.freeze([
    Object.freeze({ value: 1, label: "Start → End" }),
    Object.freeze({ value: -1, label: "End → Start" }),
    Object.freeze({ value: 2, label: "Middle → Ends" }),
    Object.freeze({ value: -2, label: "Ends → Middle" })
  ]);

  const SEGMENT_MODES = Object.freeze([
    Object.freeze({ value: "together", label: "Together" }),
    Object.freeze({ value: "alternate", label: "Alternating" }),
    Object.freeze({ value: "stagger", label: "Staggered" })
  ]);

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function text(value, fallback = "") {
    const normalized = String(value ?? "").trim();
    return normalized || fallback;
  }

  function clamp(value, min, max, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
  }

  function make(tag, className, attrs = {}) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    Object.entries(attrs).forEach(([key, value]) => {
      if (value !== null && value !== undefined) element.setAttribute(key, String(value));
    });
    return element;
  }

  function normalizeCapabilityEntry(source = {}) {
    const meta = source.meta && typeof source.meta === "object" ? source.meta : source;
    const colorMode = text(meta.colorMode, "unknown").toLowerCase();
    const whiteOnly = Boolean(meta.whiteOnly) || ["ww", "wwa", "white", "single-white"].includes(colorMode);
    const addressable = Boolean(meta.addressable);
    const groupedPixels = Boolean(meta.groupedPixels);
    const dedicatedWhite = Boolean(meta.dedicatedWhite);
    const canColor = !whiteOnly && ["rgb", "rgbic", "rgbw", "rgbcct", "gradient", "color"].some((token) => colorMode.includes(token));

    return {
      addressable,
      groupedPixels,
      dedicatedWhite,
      whiteOnly,
      canColor,
      colorMode,
      canDirection: addressable,
      canDensity: addressable,
      canSegments: addressable,
      canGradient: canColor && addressable
    };
  }

  function intersectCapabilities(entries) {
    if (!entries.length) return normalizeCapabilityEntry({});
    const normalized = entries.map(normalizeCapabilityEntry);
    return {
      addressable: normalized.every((item) => item.addressable),
      groupedPixels: normalized.some((item) => item.groupedPixels),
      dedicatedWhite: normalized.every((item) => item.dedicatedWhite),
      whiteOnly: normalized.every((item) => item.whiteOnly),
      canColor: normalized.every((item) => item.canColor),
      colorMode: normalized.every((item) => item.colorMode === normalized[0].colorMode) ? normalized[0].colorMode : "mixed",
      canDirection: normalized.every((item) => item.canDirection),
      canDensity: normalized.every((item) => item.canDensity),
      canSegments: normalized.every((item) => item.canSegments),
      canGradient: normalized.every((item) => item.canGradient)
    };
  }

  function resolveCapabilities(target) {
    if (!target) return normalizeCapabilityEntry({});
    const meta = target.meta && typeof target.meta === "object" ? target.meta : {};

    if (target.type === "group") {
      const memberCapabilities = Array.isArray(meta.memberCapabilities) ? meta.memberCapabilities : [];
      if (memberCapabilities.length) return intersectCapabilities(memberCapabilities);
    }

    return normalizeCapabilityEntry(meta);
  }

  function effectRule(effectName) {
    return EFFECT_RULES[effectName] || EFFECT_RULES.solid;
  }

  function getAvailableEffects(capabilities, presetApi = window.ShynetymeSimPresets) {
    if (!presetApi) return [];
    return presetApi.order.filter((name) => {
      const rule = effectRule(name);
      if (rule.addressableOnly && !capabilities.addressable) return false;
      if (rule.colorRequired && !capabilities.canColor) return false;
      return true;
    });
  }

  function defaultSettings(target, presetApi = window.ShynetymeSimPresets) {
    const base = presetApi?.defaultSettings ? presetApi.defaultSettings() : {
      effect: "solid", direction: 1, brightness: 100, speed: 55, intensity: 60, colors: ["#35e7ff", "#9b7cff", "#ff5ab9"]
    };
    return {
      ...base,
      density: 50,
      segments: 1,
      segmentMode: "together",
      transition: 25,
      duration: 0,
      targetKey: target ? `${target.type}:${target.id}` : ""
    };
  }

  function normalizeSettings(settings, capabilities, presetApi = window.ShynetymeSimPresets) {
    const available = getAvailableEffects(capabilities, presetApi);
    let effect = text(settings?.effect, "solid");
    if (!available.includes(effect)) effect = available[0] || "solid";
    const preset = presetApi?.getPreset ? presetApi.getPreset(effect) : { intensity: 60, colorMode: "single" };

    return {
      effect,
      direction: [1, -1, 2, -2].includes(Number(settings?.direction)) ? Number(settings.direction) : 1,
      brightness: Math.round(clamp(settings?.brightness, 0, 100, 100)),
      speed: Math.round(clamp(settings?.speed, 0, 100, 55)),
      intensity: Math.round(clamp(settings?.intensity, 0, 100, preset.intensity ?? 60)),
      density: Math.round(clamp(settings?.density, 1, 100, 50)),
      segments: Math.round(clamp(settings?.segments, 1, 32, 1)),
      segmentMode: SEGMENT_MODES.some((item) => item.value === settings?.segmentMode) ? settings.segmentMode : "together",
      transition: Math.round(clamp(settings?.transition, 0, 100, 25)),
      duration: Math.round(clamp(settings?.duration, 0, 86400, 0)),
      colors: Array.isArray(settings?.colors) ? settings.colors.slice(0, 3) : [...(presetApi?.defaultColors || ["#35e7ff", "#9b7cff", "#ff5ab9"])],
      paletteMode: capabilities.canColor ? preset.colorMode : "white-only"
    };
  }

  function visibleControls(target, effectName, presetApi = window.ShynetymeSimPresets) {
    const capabilities = resolveCapabilities(target);
    const preset = presetApi?.getPreset ? presetApi.getPreset(effectName) : {};
    const rule = effectRule(effectName);
    return {
      colors: capabilities.canColor,
      gradient: capabilities.canGradient && preset.colorMode === "gradient",
      brightness: true,
      speed: Boolean(preset.hasSpeed),
      direction: capabilities.canDirection && Boolean(preset.directional),
      density: capabilities.canDensity && Boolean(rule.density),
      intensity: Boolean(rule.intensity),
      segments: capabilities.canSegments,
      transition: true,
      duration: true
    };
  }

  function storageKey(shellApi, target) {
    const simId = shellApi.state.getState().simId;
    return `shynetyme-led-sim:${simId}:effect:${target.type}:${target.id}`;
  }

  function loadSettings(shellApi, target, capabilities, presetApi) {
    const targetSettings = target?.meta?.effectSettings && typeof target.meta.effectSettings === "object"
      ? clone(target.meta.effectSettings)
      : {};
    const fallback = { ...defaultSettings(target, presetApi), ...targetSettings };
    try {
      const raw = window.sessionStorage?.getItem(storageKey(shellApi, target));
      return normalizeSettings(raw ? { ...fallback, ...JSON.parse(raw) } : fallback, capabilities, presetApi);
    } catch (_) {
      return normalizeSettings(fallback, capabilities, presetApi);
    }
  }

  function saveSettings(shellApi, target, settings) {
    try {
      window.sessionStorage?.setItem(storageKey(shellApi, target), JSON.stringify(settings));
    } catch (_) {
      // Session persistence is best-effort; the UI still functions without it.
    }
  }

  function dispatch(name, detail) {
    if (typeof window.CustomEvent === "function") {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    }
  }

  function mountEffectDialog(shellApi, options = {}) {
    if (!shellApi?.state || typeof shellApi.getActiveTarget !== "function") {
      throw new TypeError("Effect dialog requires a mounted ShyneTyme LED SIM shell.");
    }

    const presetApi = options.presetApi || window.ShynetymeSimPresets;
    if (!presetApi) throw new Error("Effect dialog requires sim-preset-core.js.");

    let currentTarget = null;
    let capabilities = resolveCapabilities(null);
    let settings = null;
    let lastFocus = null;

    const overlay = make("div", "sim-effect-overlay", { hidden: "", "data-sim-effect-dialog": MODULE_VERSION });
    const dialog = make("section", "sim-effect-dialog sim-attention-frame", {
      role: "dialog", "aria-modal": "true", "aria-labelledby": "sim-effect-dialog-title"
    });
    const header = make("header", "sim-effect-header");
    const heading = make("div", "sim-effect-heading");
    const kicker = make("p", "sim-effect-kicker");
    kicker.textContent = "Active target controls";
    const title = make("h2", "sim-effect-title", { id: "sim-effect-dialog-title" });
    title.textContent = "LED Effect";
    const targetLine = make("p", "sim-effect-target");
    heading.append(kicker, title, targetLine);
    const closeButton = make("button", "sim-effect-close", { type: "button", "aria-label": "Close effect controls" });
    closeButton.textContent = "×";
    header.append(heading, closeButton);

    const capabilityBar = make("div", "sim-effect-capabilities", { "aria-live": "polite" });
    const body = make("div", "sim-effect-body");
    const footer = make("footer", "sim-effect-footer");
    const resetButton = make("button", "sim-effect-button", { type: "button" });
    resetButton.textContent = "Reset";
    const applyButton = make("button", "sim-effect-button sim-effect-button--primary", { type: "button" });
    applyButton.textContent = "Apply Effect";
    footer.append(resetButton, applyButton);
    dialog.append(header, capabilityBar, body, footer);
    overlay.append(dialog);
    document.body.append(overlay);

    function createRange(label, key, min, max, suffix = "%") {
      const field = make("label", "sim-effect-field");
      const head = make("span", "sim-effect-field__head");
      const name = make("span", "sim-effect-field__label");
      name.textContent = label;
      const value = make("output", "sim-effect-field__value");
      value.textContent = `${settings[key]}${suffix}`;
      head.append(name, value);
      const input = make("input", "sim-effect-range", { type: "range", min, max, value: settings[key] });
      input.addEventListener("input", () => {
        settings[key] = Number(input.value);
        value.textContent = `${settings[key]}${suffix}`;
        preview("control-change");
      });
      field.append(head, input);
      return field;
    }

    function createSelect(label, key, choices) {
      const field = make("label", "sim-effect-field");
      const name = make("span", "sim-effect-field__label");
      name.textContent = label;
      const select = make("select", "sim-effect-select");
      choices.forEach((item) => {
        const option = make("option", "", { value: item.value });
        option.textContent = item.label;
        if (String(item.value) === String(settings[key])) option.selected = true;
        select.append(option);
      });
      select.addEventListener("change", () => {
        settings[key] = key === "direction" ? Number(select.value) : select.value;
        preview("control-change");
      });
      field.append(name, select);
      return field;
    }

    function createNumber(label, key, min, max, suffix = "") {
      const field = make("label", "sim-effect-field");
      const name = make("span", "sim-effect-field__label");
      name.textContent = label;
      const row = make("span", "sim-effect-number-row");
      const input = make("input", "sim-effect-number", { type: "number", min, max, value: settings[key] });
      const suffixNode = make("span", "sim-effect-number__suffix");
      suffixNode.textContent = suffix;
      input.addEventListener("change", () => {
        settings[key] = Math.round(clamp(input.value, min, max, settings[key]));
        input.value = settings[key];
        preview("control-change");
      });
      row.append(input, suffixNode);
      field.append(name, row);
      return field;
    }

    function renderColors(preset) {
      if (!capabilities.canColor) return null;
      const section = make("section", "sim-effect-section sim-effect-colors");
      const headingNode = make("h3", "sim-effect-section__title");
      headingNode.textContent = preset.colorMode === "gradient" ? "Gradient colors" : "Colors";
      const grid = make("div", "sim-effect-color-grid");
      const count = preset.colorMode === "single" ? 1 : preset.colorMode === "two" ? 2 : 3;
      for (let index = 0; index < count; index += 1) {
        const label = make("label", "sim-effect-color");
        const name = make("span", "sim-effect-color__label");
        name.textContent = count === 1 ? "Color" : `Color ${index + 1}`;
        const input = make("input", "sim-effect-color__input", { type: "color", value: settings.colors[index] || presetApi.defaultColors[index] });
        input.addEventListener("input", () => {
          settings.colors[index] = input.value;
          preview("color-change");
        });
        label.append(name, input);
        grid.append(label);
      }
      section.append(headingNode, grid);
      return section;
    }

    function render() {
      if (!currentTarget) return;
      capabilities = resolveCapabilities(currentTarget);
      const available = getAvailableEffects(capabilities, presetApi);
      if (!available.includes(settings.effect)) settings.effect = available[0] || "solid";
      settings = normalizeSettings(settings, capabilities, presetApi);
      const preset = presetApi.getPreset(settings.effect);
      const visible = visibleControls(currentTarget, settings.effect, presetApi);

      targetLine.textContent = `${currentTarget.label} · ${currentTarget.type}`;
      capabilityBar.replaceChildren();
      const badges = [
        capabilities.addressable ? "Addressable" : "Whole-run",
        capabilities.whiteOnly ? "White only" : capabilities.canColor ? "Color capable" : "No color metadata",
        capabilities.groupedPixels ? "Grouped pixels" : null,
        capabilities.dedicatedWhite ? "Dedicated white" : null
      ].filter(Boolean);
      badges.forEach((label) => {
        const badge = make("span", "sim-effect-capability");
        badge.textContent = label;
        capabilityBar.append(badge);
      });

      body.replaceChildren();

      const effectSection = make("section", "sim-effect-section");
      const effectHeading = make("h3", "sim-effect-section__title");
      effectHeading.textContent = "Effect";
      const effectSelect = make("select", "sim-effect-select sim-effect-select--effect", { "aria-label": "Effect" });
      available.forEach((name) => {
        const option = make("option", "", { value: name });
        const label = capabilities.whiteOnly && name === "wipe" ? "Wipe" : presetApi.getPreset(name).label;
        option.textContent = label;
        if (name === settings.effect) option.selected = true;
        effectSelect.append(option);
      });
      const effectNote = make("p", "sim-effect-note");
      effectNote.textContent = capabilities.whiteOnly
        ? "White-only target: brightness and spatial animation are available; RGB colors and gradients are intentionally hidden."
        : preset.note;
      effectSelect.addEventListener("change", () => {
        settings.effect = effectSelect.value;
        const nextPreset = presetApi.getPreset(settings.effect);
        settings.intensity = nextPreset.intensity ?? settings.intensity;
        settings.paletteMode = capabilities.canColor ? nextPreset.colorMode : "white-only";
        render();
        preview("effect-change");
      });
      effectSection.append(effectHeading, effectSelect, effectNote);
      body.append(effectSection);

      const colorSection = renderColors(preset);
      if (colorSection) body.append(colorSection);

      const motionSection = make("section", "sim-effect-section");
      const motionHeading = make("h3", "sim-effect-section__title");
      motionHeading.textContent = "Light & motion";
      const grid = make("div", "sim-effect-control-grid");
      if (visible.brightness) grid.append(createRange("Brightness", "brightness", 0, 100));
      if (visible.speed) grid.append(createRange("Speed", "speed", 0, 100));
      if (visible.direction) grid.append(createSelect("Direction", "direction", DIRECTIONS));
      if (visible.density) grid.append(createRange("Density", "density", 1, 100));
      if (visible.intensity) grid.append(createRange("Intensity", "intensity", 0, 100));
      motionSection.append(motionHeading, grid);
      body.append(motionSection);

      if (visible.segments) {
        const segmentSection = make("section", "sim-effect-section");
        const segmentHeading = make("h3", "sim-effect-section__title");
        segmentHeading.textContent = "Segments";
        const segmentGrid = make("div", "sim-effect-control-grid");
        segmentGrid.append(createNumber("Segment count", "segments", 1, 32));
        segmentGrid.append(createSelect("Segment behavior", "segmentMode", SEGMENT_MODES));
        segmentSection.append(segmentHeading, segmentGrid);
        body.append(segmentSection);
      }

      const timingSection = make("section", "sim-effect-section");
      const timingHeading = make("h3", "sim-effect-section__title");
      timingHeading.textContent = "Timing";
      const timingGrid = make("div", "sim-effect-control-grid");
      if (visible.transition) timingGrid.append(createRange("Transition", "transition", 0, 100));
      if (visible.duration) timingGrid.append(createNumber("Duration", "duration", 0, 86400, "sec · 0 = continuous"));
      timingSection.append(timingHeading, timingGrid);
      body.append(timingSection);
    }

    function payload(reason) {
      return {
        reason,
        target: clone(currentTarget),
        targetKey: currentTarget ? `${currentTarget.type}:${currentTarget.id}` : "",
        capabilities: clone(capabilities),
        settings: clone(settings),
        preset: currentTarget && settings ? clone(presetApi.getPreset(settings.effect)) : null,
        simId: shellApi.state.getState().simId
      };
    }

    function preview(reason = "preview") {
      if (!currentTarget || !settings) return;
      saveSettings(shellApi, currentTarget, settings);
      options.onPreview?.(payload(reason), api);
      dispatch("shynetyme:led-sim-effect-preview", payload(reason));
    }

    function apply() {
      if (!currentTarget || !settings) return false;
      saveSettings(shellApi, currentTarget, settings);
      const effectLabel = presetApi.getPreset(settings.effect).label;

      if (currentTarget.type === "device" && options.devicesApi?.getDevice?.(currentTarget.id)) {
        const existingDevice = options.devicesApi.getDevice(currentTarget.id);
        options.devicesApi.updateDevice(currentTarget.id, {
          currentEffect: capabilities.whiteOnly ? `${effectLabel} · White` : effectLabel,
          meta: { ...clone(existingDevice.meta || {}), effectSettings: clone(settings) }
        });
        currentTarget = shellApi.getActiveTarget();
      } else if (currentTarget.type === "group" && options.groupsApi?.applyGroupEffect) {
        options.groupsApi.applyGroupEffect(currentTarget.id, clone(settings), capabilities.whiteOnly ? `${effectLabel} · White` : effectLabel);
        currentTarget = shellApi.getActiveTarget();
      } else {
        shellApi.updateTarget({
          meta: {
            ...(currentTarget.meta || {}),
            currentEffect: capabilities.whiteOnly ? `${effectLabel} · White` : effectLabel,
            effectSettings: clone(settings)
          }
        });
        currentTarget = shellApi.getActiveTarget();
      }

      options.onApply?.(payload("apply"), api);
      dispatch("shynetyme:led-sim-effect-apply", payload("apply"));
      close();
      return true;
    }

    function open(target = shellApi.getActiveTarget()) {
      if (!target) return false;
      currentTarget = clone(target);
      capabilities = resolveCapabilities(currentTarget);
      settings = loadSettings(shellApi, currentTarget, capabilities, presetApi);
      lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      render();
      overlay.hidden = false;
      document.documentElement.classList.add("sim-effect-open");
      closeButton.focus();
      options.onOpen?.(payload("open"), api);
      dispatch("shynetyme:led-sim-effect-open", payload("open"));
      return true;
    }

    function close() {
      overlay.hidden = true;
      document.documentElement.classList.remove("sim-effect-open");
      if (lastFocus?.focus) lastFocus.focus();
      options.onClose?.(api);
    }

    closeButton.addEventListener("click", close);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });
    resetButton.addEventListener("click", () => {
      if (!currentTarget) return;
      settings = normalizeSettings(defaultSettings(currentTarget, presetApi), capabilities, presetApi);
      render();
      preview("reset");
    });
    applyButton.addEventListener("click", apply);
    document.addEventListener("keydown", (event) => {
      if (!overlay.hidden && event.key === "Escape") close();
    });

    function handleDeviceOpen(event) {
      const eventTarget = event?.detail?.target || shellApi.getActiveTarget();
      if (eventTarget) open(eventTarget);
    }
    function handleGroupOpen(event) {
      const eventTarget = event?.detail?.target || shellApi.getActiveTarget();
      if (eventTarget) open(eventTarget);
    }
    window.addEventListener("shynetyme:led-sim-device-open", handleDeviceOpen);
    window.addEventListener("shynetyme:led-sim-group-open", handleGroupOpen);

    const api = Object.freeze({
      version: MODULE_VERSION,
      root: overlay,
      open,
      close,
      apply,
      isOpen() { return !overlay.hidden; },
      getTarget() { return clone(currentTarget); },
      getCapabilities() { return clone(capabilities); },
      getSettings() { return clone(settings); },
      setSettings(patch = {}) {
        if (!currentTarget) throw new Error("Open the effect dialog before changing settings.");
        settings = normalizeSettings({ ...settings, ...clone(patch) }, capabilities, presetApi);
        render();
        preview("settings-update");
        return clone(settings);
      },
      visibleControls(effectName = settings?.effect || "solid") {
        return visibleControls(currentTarget || shellApi.getActiveTarget(), effectName, presetApi);
      },
      destroy() {
        window.removeEventListener("shynetyme:led-sim-device-open", handleDeviceOpen);
        window.removeEventListener("shynetyme:led-sim-group-open", handleGroupOpen);
        overlay.remove();
      }
    });

    return api;
  }

  window.ShyneTymeLedSimEffectDialog = Object.freeze({
    version: MODULE_VERSION,
    effectRules: EFFECT_RULES,
    directions: DIRECTIONS,
    resolveCapabilities,
    getAvailableEffects,
    visibleControls,
    normalizeSettings,
    mountEffectDialog
  });
})();
