(() => {
  "use strict";

  if (window.ShynetymeSimPresets) {
    return;
  }

  // BEGIN OBJECT: Shared simulator effect preset definitions.
  // Every simulator can read this registry so preset names, WLED IDs,
  // direction controls, speed controls, and default color modes stay aligned.
  const PRESETS = Object.freeze({
    solid: Object.freeze({
      label: "Solid",
      wledId: 0,
      directional: false,
      hasSpeed: false,
      intensity: 100,
      colorMode: "single",
      note: "Solid uses one steady color. Direction and speed are not used."
    }),
    breathe: Object.freeze({
      label: "Breathe",
      wledId: 2,
      directional: false,
      hasSpeed: true,
      intensity: 100,
      colorMode: "two",
      note: "Breathe fades the entire area between foreground and background colors. It has no forward or reverse direction."
    }),
    wipe: Object.freeze({
      label: "Color wipe",
      wledId: 3,
      directional: true,
      hasSpeed: true,
      intensity: 58,
      colorMode: "two",
      note: "Color wipe travels along the installation path and supports forward or reverse playback."
    }),
    wave: Object.freeze({
      label: "Brightness wave",
      wledId: null,
      directional: true,
      hasSpeed: true,
      intensity: 62,
      colorMode: "single",
      note: "A ShyneTyme spatial brightness wave raises and lowers neighboring pixels or sections as it travels along an addressable run."
    }),
    chase: Object.freeze({
      label: "Chase",
      wledId: 28,
      directional: true,
      hasSpeed: true,
      intensity: 68,
      colorMode: "gradient",
      note: "Chase moves a bright foreground head and trail over the selected background."
    }),
    theater: Object.freeze({
      label: "Theater chase",
      wledId: 13,
      directional: true,
      hasSpeed: true,
      intensity: 60,
      colorMode: "two",
      note: "Theater chase advances separated foreground light groups over the background color."
    }),
    scanner: Object.freeze({
      label: "Scanner sweep",
      wledId: 6,
      directional: false,
      hasSpeed: true,
      intensity: 72,
      colorMode: "two",
      note: "Scanner automatically sweeps out and back, so it does not use a direction control."
    }),
    twinkle: Object.freeze({
      label: "Random twinkle",
      wledId: 17,
      directional: false,
      hasSpeed: true,
      intensity: 52,
      colorMode: "two",
      note: "Random LEDs light in the foreground color over the selected background. It has no direction control."
    }),
    starlight: Object.freeze({
      label: "Star lights",
      wledId: 80,
      directional: false,
      hasSpeed: true,
      intensity: 62,
      colorMode: "two",
      note: "Independent stars rise brightly and fade into the background color. It has no direction control."
    }),
    sections: Object.freeze({
      label: "Section scramble",
      wledId: null,
      directional: false,
      hasSpeed: true,
      intensity: 70,
      colorMode: "gradient",
      note: "This ShyneTyme preset divides a long run into independently phased sections. It has no global direction control."
    }),
    rainbow: Object.freeze({
      label: "Rainbow palette",
      wledId: 9,
      directional: true,
      hasSpeed: true,
      intensity: 100,
      colorMode: "gradient",
      note: "Rainbow palette cycles the chosen three-color palette along the path."
    })
  });
  // END OBJECT: Shared simulator effect preset definitions.

  // BEGIN OBJECT: Shared preset order used by every generated preset menu.
  const PRESET_ORDER = Object.freeze([
    "solid",
    "breathe",
    "wave",
    "wipe",
    "chase",
    "theater",
    "scanner",
    "twinkle",
    "starlight",
    "sections",
    "rainbow"
  ]);
  // END OBJECT: Shared preset order used by every generated preset menu.

  // BEGIN OBJECT: Shared default LED-area settings.
  const DEFAULT_COLORS = Object.freeze([
    "#35e7ff",
    "#9b7cff",
    "#ff5ab9"
  ]);

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getPreset(effectName) {
    return PRESETS[effectName] || PRESETS.solid;
  }

  function defaultSettings() {
    const preset = PRESETS.solid;

    return {
      effect: "solid",
      direction: 1,
      brightness: 100,
      speed: 55,
      intensity: preset.intensity,
      paletteMode: preset.colorMode,
      colors: [...DEFAULT_COLORS],
      syncTarget: "",
      mirror: false,
      mirrorDirection: "same"
    };
  }

  function normalizeColors(settings) {
    const colors = Array.isArray(settings?.colors)
      ? [...settings.colors]
      : [...DEFAULT_COLORS];

    while (colors.length < 3) {
      colors.push(DEFAULT_COLORS[colors.length]);
    }

    if (settings?.paletteMode === "single") {
      return [colors[0], colors[0], colors[0]];
    }

    if (settings?.paletteMode === "two") {
      return [colors[0], colors[1], colors[0]];
    }

    return colors.slice(0, 3);
  }

  function hexToRgb(hex) {
    const normalized = String(hex || "#000000")
      .replace("#", "")
      .padEnd(6, "0")
      .slice(0, 6);

    return [0, 2, 4].map((offset) => (
      Number.parseInt(normalized.slice(offset, offset + 2), 16)
    ));
  }

  function optionLabel(effectName) {
    const preset = getPreset(effectName);
    const id = preset.wledId === null
      ? "ST"
      : String(preset.wledId).padStart(2, "0");

    return `${id} · ${preset.label}`;
  }
  // END OBJECT: Shared default LED-area settings.

  // BEGIN OBJECT: Public simulator preset API.
  window.ShynetymeSimPresets = Object.freeze({
    presets: PRESETS,
    order: PRESET_ORDER,
    defaultColors: DEFAULT_COLORS,
    clone,
    getPreset,
    defaultSettings,
    normalizeColors,
    hexToRgb,
    optionLabel
  });
  // END OBJECT: Public simulator preset API.
})();