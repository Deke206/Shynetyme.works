(() => {
  "use strict";

  if (window.ShyneTymeLedSimAddDevice) return;

  const MODULE_VERSION = "2026.08.09-add-device-active-target-step4";

  // Controller choices are planning templates only. They do not certify electrical compatibility.
  const CONTROLLER_TEMPLATES = Object.freeze([
    Object.freeze({
      id: "esp32-wled-wifi-12-24",
      label: "ESP32 / WLED · Wi-Fi",
      voltage: "12V / 24V template",
      connectionType: "wifi",
      note: "Planning template for fixed installations. Final power, level shifting and controller compatibility must be verified per build."
    }),
    Object.freeze({
      id: "esp32-dual-radio-12-24",
      label: "ESP32 · Bluetooth / Wi-Fi",
      voltage: "12V / 24V template",
      connectionType: "wifi",
      note: "Planning template for an ESP32 controller exposing Wi-Fi and/or Bluetooth control. Hardware details remain intentionally undefined."
    }),
    Object.freeze({
      id: "sp602e-portable-5v",
      label: "SP602E-style Portable · Bluetooth",
      voltage: "5V portable template",
      connectionType: "bluetooth",
      note: "Portable 5V Bluetooth-style planning template for bicycle, vehicle and compact builds. Treat as a UI template until exact hardware is selected."
    })
  ]);

  // Compact names intentionally combine IC/family + package/form + capability.
  // Width is deliberately not part of this model.
  const STRIP_TEMPLATES = Object.freeze([
    Object.freeze({
      id: "ws2812b-ic5050-rgbic",
      code: "WS2812B_IC5050_RGBIC",
      family: "WS2812B",
      label: "WS2812B · Individual RGBIC",
      capability: "RGBIC / addressable",
      voltages: ["5V"],
      protection: ["IP65", "IP67"],
      formats: ["regular", "rope", "string"],
      colorMode: "rgbic",
      addressable: true,
      backupData: false,
      catalogNote: "Current catalog includes IP65/IP67 WS2812B regular strip, rope and string-style products."
    }),
    Object.freeze({
      id: "ws2811-grouped-rgbic",
      code: "WS2811_GROUPED_RGBIC",
      family: "WS2811",
      label: "WS2811 · Grouped RGBIC",
      capability: "RGBIC / grouped addressable",
      voltages: ["12V", "24V"],
      protection: ["IP65", "IP67"],
      formats: ["regular"],
      colorMode: "rgbic",
      addressable: true,
      groupedPixels: true,
      backupData: false,
      catalogNote: "Current catalog includes 12V and 24V WS2811 IP65/IP67 grouped-pixel strips."
    }),
    Object.freeze({
      id: "ws2813-ic5050-rgbic-backup",
      code: "WS2813_IC5050_RGBIC_BACKUP",
      family: "WS2813",
      label: "WS2813 · RGBIC + Backup Data",
      capability: "RGBIC / addressable / backup data",
      voltages: ["5V"],
      protection: ["IP65", "IP67"],
      formats: ["regular"],
      colorMode: "rgbic",
      addressable: true,
      backupData: true,
      catalogNote: "Current catalog includes WS2813 IP65/IP67 backup-data pixel strip variants."
    }),
    Object.freeze({
      id: "ws2814-ic5050-rgbw",
      code: "WS2814_IC5050_RGBW",
      family: "WS2814",
      label: "WS2814 · RGBW Addressable",
      capability: "RGB + dedicated white / addressable",
      voltages: ["12V", "24V"],
      protection: ["IP65", "IP67"],
      formats: ["regular"],
      colorMode: "rgbw",
      addressable: true,
      dedicatedWhite: true,
      backupData: false,
      catalogNote: "Current catalog includes IP65/IP67 WS2814 RGBW strips with warm- or cool-white emitter options."
    }),
    Object.freeze({
      id: "ws2815-ic5050-rgbic-backup",
      code: "WS2815_IC5050_RGBIC_BACKUP",
      family: "WS2815",
      label: "WS2815 · RGBIC + Backup Data",
      capability: "RGBIC / addressable / backup data",
      voltages: ["12V"],
      protection: ["IP65", "IP67"],
      formats: ["regular"],
      colorMode: "rgbic",
      addressable: true,
      backupData: true,
      catalogNote: "The source catalog also contains IP68 WS2815 listings, but this SIM template intentionally exposes only IP65/IP67 for now."
    }),
    Object.freeze({
      id: "ws2811-fcob-wwa",
      code: "WS2811_FCOB_WWA",
      family: "WS2811",
      label: "WS2811 FCOB · WWA",
      capability: "White-hue addressable / flowing white",
      voltages: ["24V"],
      protection: ["IP30"],
      formats: ["regular"],
      colorMode: "wwa",
      addressable: true,
      whiteOnly: true,
      backupData: false,
      catalogNote: "Current catalog's addressable flowing-white FCOB is an indoor/protected IP30 item.",
      warning: "WWA emits dimmable white hues only. It can be sequenced because it is addressable, but it cannot produce RGB colors."
    })
  ]);

  const LED_COUNT_CHOICES = Object.freeze([30, 60, 100, 120, 144, 150, 200, 240, 300, "custom"]);
  const FORMAT_LABELS = Object.freeze({
    regular: "Regular Strip",
    rope: "Rope",
    string: "String"
  });

  const DEFAULT_HOME_PLACEMENTS = Object.freeze([
    Object.freeze({ id: "front-door-trim", label: "Front Door Trim", environment: "outdoor" }),
    Object.freeze({ id: "garage-door", label: "Garage Door", environment: "outdoor" }),
    Object.freeze({ id: "front-windows", label: "Front Windows", environment: "outdoor" }),
    Object.freeze({ id: "patio", label: "Patio", environment: "outdoor" }),
    Object.freeze({ id: "hallway", label: "Hallway", environment: "indoor" }),
    Object.freeze({ id: "pathway", label: "Pathway", environment: "outdoor" }),
    Object.freeze({ id: "garden", label: "Garden", environment: "outdoor" }),
    Object.freeze({ id: "stair-rail", label: "Stair Rail", environment: "indoor" }),
    Object.freeze({ id: "gazebo", label: "Gazebo", environment: "outdoor" }),
    Object.freeze({ id: "overhang", label: "Overhang", environment: "outdoor" }),
    Object.freeze({ id: "custom-area", label: "Custom Area", environment: "custom" })
  ]);

  const CUSTOM_ENVIRONMENTS = Object.freeze([
    Object.freeze({ id: "indoor", label: "Indoor / dry" }),
    Object.freeze({ id: "protected", label: "Protected / damp" }),
    Object.freeze({ id: "outdoor", label: "Outdoor / weather exposed" }),
    Object.freeze({ id: "wet", label: "Wet / submersed concept" })
  ]);

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function text(value, fallback = "") {
    const v = String(value ?? "").trim();
    return v || fallback;
  }

  function slug(value, fallback = "area") {
    const v = text(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return v || fallback;
  }

  function make(tag, className, attrs = {}) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    Object.entries(attrs).forEach(([key, value]) => {
      if (value !== null && value !== undefined) el.setAttribute(key, String(value));
    });
    return el;
  }

  function getStrip(stripId) {
    return STRIP_TEMPLATES.find((item) => item.id === stripId) || STRIP_TEMPLATES[0];
  }

  function getController(controllerId) {
    return CONTROLLER_TEMPLATES.find((item) => item.id === controllerId) || CONTROLLER_TEMPLATES[0];
  }

  function normalizePlacements(input) {
    const source = Array.isArray(input) && input.length ? input : DEFAULT_HOME_PLACEMENTS;
    return source.map((item, index) => {
      if (typeof item === "string") {
        return { id: slug(item, `placement-${index + 1}`), label: item, environment: "custom" };
      }
      return {
        id: text(item.id, slug(item.label, `placement-${index + 1}`)),
        label: text(item.label, `Area ${index + 1}`),
        environment: text(item.environment, "custom").toLowerCase()
      };
    });
  }

  function selectedPlacement(state, placements) {
    return placements.find((item) => item.id === state.placementId) || placements[0];
  }

  function effectiveEnvironment(state, placements) {
    const placement = selectedPlacement(state, placements);
    if (placement?.environment === "custom") return state.customEnvironment || "indoor";
    return placement?.environment || "indoor";
  }

  function needsOutdoorProtection(environment) {
    return environment === "outdoor" || environment === "protected";
  }

  function validateState(state, placements) {
    const errors = [];
    const warnings = [];
    const strip = getStrip(state.stripId);
    const placement = selectedPlacement(state, placements);
    const environment = effectiveEnvironment(state, placements);
    const count = state.ledCount === "custom" ? Number(state.customLedCount) : Number(state.ledCount);

    if (!state.controllerId) errors.push("Select a controller template.");
    if (!state.stripId) errors.push("Select an LED strip / IC template.");
    if (!Number.isInteger(count) || count <= 0) errors.push("Enter a valid positive LED count.");
    if (!state.format) errors.push("Select a physical format.");
    if (!state.placementId) errors.push("Select a placement.");
    if (placement?.id === "custom-area" && !text(state.customAreaName)) errors.push("Name the custom LED area.");

    if (environment === "wet") {
      errors.push("No wet/submersed IP68 UV/WS2818 template exists in the current Drive catalog. Do not substitute IP65/IP67 for a pond/submersed build.");
    } else if (needsOutdoorProtection(environment) && !["IP65", "IP67"].includes(state.protection)) {
      errors.push("This placement needs an outdoor template. Choose an IP65 or IP67 option.");
    }

    if (strip.whiteOnly) warnings.push(strip.warning);
    if (strip.catalogNote) warnings.push(strip.catalogNote);

    return { errors, warnings, count, strip, placement, environment };
  }

  function initialState(placements) {
    const strip = STRIP_TEMPLATES[0];
    return {
      step: 0,
      controllerId: CONTROLLER_TEMPLATES[0].id,
      stripId: strip.id,
      protection: strip.protection.includes("IP65") ? "IP65" : strip.protection[0],
      ledCount: 60,
      customLedCount: "",
      format: strip.formats[0],
      placementId: placements[0]?.id || "",
      customAreaName: "",
      customEnvironment: "indoor"
    };
  }

  function mountAddDeviceWizard(shellApi, devicesApi, options = {}) {
    if (!shellApi?.state || typeof shellApi.setActiveTab !== "function") {
      throw new TypeError("Add Device wizard requires a mounted ShyneTyme LED SIM shell.");
    }
    if (!devicesApi || typeof devicesApi.addDevice !== "function") {
      throw new TypeError("Add Device wizard requires the ShyneTyme Devices API.");
    }

    const placements = normalizePlacements(options.placements);
    const simId = shellApi.state.getState().simId;
    let state = initialState(placements);

    const overlay = make("div", "sim-add-device-overlay", { hidden: "", "data-sim-add-device-wizard": MODULE_VERSION });
    const dialog = make("section", "sim-add-device-dialog sim-attention-frame", {
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": `${simId}-add-device-title`
    });
    const header = make("header", "sim-add-device-header");
    const headingWrap = make("div", "sim-add-device-heading");
    const kicker = make("p", "sim-add-device-kicker");
    kicker.textContent = "Build an LED area";
    const title = make("h2", "sim-add-device-title", { id: `${simId}-add-device-title` });
    title.textContent = "Add Device";
    const closeButton = make("button", "sim-add-device-close", { type: "button", "aria-label": "Close Add Device" });
    closeButton.textContent = "×";
    headingWrap.append(kicker, title);
    header.append(headingWrap, closeButton);

    const stepper = make("ol", "sim-add-device-stepper", { "aria-label": "Add Device progress" });
    const stepNames = ["Controller", "LED Strip / IC", "LED Count", "Format", "Placement"];
    stepNames.forEach((name, index) => {
      const li = make("li", "sim-add-device-stepper__item", { "data-step-index": index });
      const n = make("span", "sim-add-device-stepper__number");
      n.textContent = String(index + 1);
      const words = make("span", "sim-add-device-stepper__label");
      words.textContent = name;
      li.append(n, words);
      stepper.append(li);
    });

    const body = make("div", "sim-add-device-body");
    const panel = make("div", "sim-add-device-panel");
    const summary = make("aside", "sim-add-device-summary sim-attention-frame", { "aria-live": "polite" });
    body.append(panel, summary);

    const footer = make("footer", "sim-add-device-footer");
    const back = make("button", "sim-add-device-button", { type: "button" });
    back.textContent = "Back";
    const next = make("button", "sim-add-device-button sim-add-device-button--primary", { type: "button" });
    next.textContent = "Next";
    footer.append(back, next);

    dialog.append(header, stepper, body, footer);
    overlay.append(dialog);
    document.body.append(overlay);

    function optionButton(label, active, onClick, extraClass = "") {
      const button = make("button", `sim-add-device-choice ${active ? "is-selected" : ""} ${extraClass}`.trim(), {
        type: "button",
        "aria-pressed": String(Boolean(active))
      });
      button.textContent = label;
      button.addEventListener("click", onClick);
      return button;
    }

    function renderController() {
      const wrap = make("div", "sim-add-device-section");
      const h = make("h3", "sim-add-device-section__title");
      h.textContent = "1. Controller template";
      const note = make("p", "sim-add-device-section__note");
      note.textContent = "These are planning templates only. Final electrical and firmware compatibility will be defined later.";
      const grid = make("div", "sim-add-device-card-grid");
      CONTROLLER_TEMPLATES.forEach((item) => {
        const card = make("button", `sim-add-device-template ${state.controllerId === item.id ? "is-selected" : ""}`, {
          type: "button",
          "aria-pressed": String(state.controllerId === item.id)
        });
        const name = make("strong", "sim-add-device-template__name");
        name.textContent = item.label;
        const volts = make("span", "sim-add-device-template__meta");
        volts.textContent = item.voltage;
        const copy = make("small", "sim-add-device-template__copy");
        copy.textContent = item.note;
        card.append(name, volts, copy);
        card.addEventListener("click", () => { state.controllerId = item.id; render(); });
        grid.append(card);
      });
      wrap.append(h, note, grid);
      panel.append(wrap);
    }

    function renderStrip() {
      const wrap = make("div", "sim-add-device-section");
      const h = make("h3", "sim-add-device-section__title");
      h.textContent = "2. LED strip / IC";
      const note = make("p", "sim-add-device-section__note");
      note.textContent = "Choose by IC + light capability + environment. Width is intentionally not part of the device model.";
      const grid = make("div", "sim-add-device-strip-grid");

      STRIP_TEMPLATES.forEach((item) => {
        const card = make("button", `sim-add-device-strip ${state.stripId === item.id ? "is-selected" : ""}`, {
          type: "button",
          "aria-pressed": String(state.stripId === item.id)
        });
        const code = make("strong", "sim-add-device-strip__code");
        code.textContent = item.code;
        const friendly = make("span", "sim-add-device-strip__label");
        friendly.textContent = item.label;
        const capability = make("small", "sim-add-device-strip__capability");
        capability.textContent = `${item.capability} · ${item.voltages.join(" / ")}`;
        const protections = make("span", "sim-add-device-strip__badges");
        item.protection.forEach((ip) => {
          const badge = make("span", "sim-add-device-badge");
          badge.textContent = ip;
          protections.append(badge);
        });
        card.append(code, friendly, capability, protections);
        card.addEventListener("click", () => {
          state.stripId = item.id;
          state.protection = item.protection.includes("IP65") ? "IP65" : item.protection[0];
          if (!item.formats.includes(state.format)) state.format = item.formats[0];
          render();
        });
        grid.append(card);
      });

      const selected = getStrip(state.stripId);
      const protectionBox = make("div", "sim-add-device-subchoice");
      const protectionLabel = make("strong", "sim-add-device-subchoice__label");
      protectionLabel.textContent = "Protection";
      const protectionButtons = make("div", "sim-add-device-choice-row");
      selected.protection.forEach((ip) => {
        protectionButtons.append(optionButton(ip, state.protection === ip, () => { state.protection = ip; render(); }));
      });
      protectionBox.append(protectionLabel, protectionButtons);

      if (selected.warning) {
        const warning = make("div", "sim-add-device-warning");
        warning.textContent = selected.warning;
        protectionBox.append(warning);
      }

      wrap.append(h, note, grid, protectionBox);
      panel.append(wrap);
    }

    function renderCount() {
      const wrap = make("div", "sim-add-device-section");
      const h = make("h3", "sim-add-device-section__title");
      h.textContent = "3. LED count";
      const note = make("p", "sim-add-device-section__note");
      note.textContent = "Preset buttons stop at 300. Custom remains available for any deliberate positive count.";
      const choices = make("div", "sim-add-device-count-grid");
      LED_COUNT_CHOICES.forEach((value) => {
        const label = value === "custom" ? "Custom" : String(value);
        choices.append(optionButton(label, state.ledCount === value, () => { state.ledCount = value; render(); }));
      });
      wrap.append(h, note, choices);
      if (state.ledCount === "custom") {
        const custom = make("label", "sim-add-device-field");
        const caption = make("span", "sim-add-device-field__label");
        caption.textContent = "Custom LED count";
        const input = make("input", "sim-add-device-input", { type: "number", min: "1", step: "1", inputmode: "numeric" });
        input.value = state.customLedCount;
        input.addEventListener("input", () => { state.customLedCount = input.value; renderSummary(); });
        custom.append(caption, input);
        wrap.append(custom);
      }
      panel.append(wrap);
    }

    function renderFormat() {
      const wrap = make("div", "sim-add-device-section");
      const h = make("h3", "sim-add-device-section__title");
      h.textContent = "4. Physical format";
      const note = make("p", "sim-add-device-section__note");
      note.textContent = "Format describes how the lighting is physically presented; it does not encode strip width.";
      const strip = getStrip(state.stripId);
      const choices = make("div", "sim-add-device-choice-row sim-add-device-choice-row--large");
      strip.formats.forEach((format) => {
        choices.append(optionButton(FORMAT_LABELS[format] || format, state.format === format, () => { state.format = format; render(); }));
      });
      wrap.append(h, note, choices);
      panel.append(wrap);
    }

    function renderPlacement() {
      const wrap = make("div", "sim-add-device-section");
      const h = make("h3", "sim-add-device-section__title");
      h.textContent = "5. Placement";
      const note = make("p", "sim-add-device-section__note");
      note.textContent = "This SIM supplies the placement list. The placement becomes the device/area name unless you choose Custom Area.";
      const choices = make("div", "sim-add-device-placement-grid");
      placements.forEach((item) => {
        const button = optionButton(item.label, state.placementId === item.id, () => { state.placementId = item.id; render(); });
        button.dataset.environment = item.environment;
        choices.append(button);
      });
      wrap.append(h, note, choices);

      const placement = selectedPlacement(state, placements);
      if (placement?.id === "custom-area") {
        const customFields = make("div", "sim-add-device-custom-placement");
        const nameField = make("label", "sim-add-device-field");
        const nameCaption = make("span", "sim-add-device-field__label");
        nameCaption.textContent = "Area name";
        const nameInput = make("input", "sim-add-device-input", { type: "text", maxlength: "80", placeholder: "Example: Pond Edge, Rear Basket, Cabin Shelf" });
        nameInput.value = state.customAreaName;
        nameInput.addEventListener("input", () => { state.customAreaName = nameInput.value; renderSummary(); });
        nameField.append(nameCaption, nameInput);

        const env = make("div", "sim-add-device-field");
        const envCaption = make("span", "sim-add-device-field__label");
        envCaption.textContent = "Environment";
        const envChoices = make("div", "sim-add-device-choice-row");
        CUSTOM_ENVIRONMENTS.forEach((item) => {
          envChoices.append(optionButton(item.label, state.customEnvironment === item.id, () => { state.customEnvironment = item.id; render(); }));
        });
        env.append(envCaption, envChoices);
        customFields.append(nameField, env);
        wrap.append(customFields);
      }

      const validation = validateState(state, placements);
      if (validation.errors.length || validation.warnings.length) {
        const status = make("div", "sim-add-device-validation");
        validation.errors.forEach((message) => {
          const row = make("p", "sim-add-device-validation__error");
          row.textContent = message;
          status.append(row);
        });
        validation.warnings.forEach((message) => {
          const row = make("p", "sim-add-device-validation__warning");
          row.textContent = message;
          status.append(row);
        });
        wrap.append(status);
      }

      panel.append(wrap);
    }

    function renderSummary() {
      summary.replaceChildren();
      const validation = validateState(state, placements);
      const controller = getController(state.controllerId);
      const strip = validation.strip;
      const placement = validation.placement;
      const areaName = placement?.id === "custom-area" ? text(state.customAreaName, "Custom Area") : placement?.label || "Area";

      const h = make("h3", "sim-add-device-summary__title");
      h.textContent = areaName;
      const lines = [
        ["Controller", controller.label],
        ["LED", strip.code],
        ["Capability", strip.capability],
        ["Protection", state.protection],
        ["Count", Number.isFinite(validation.count) && validation.count > 0 ? `${validation.count} LEDs` : "Set count"],
        ["Format", FORMAT_LABELS[state.format] || state.format],
        ["Environment", validation.environment]
      ];
      summary.append(h);
      lines.forEach(([key, value]) => {
        const row = make("div", "sim-add-device-summary__row");
        const k = make("span", "sim-add-device-summary__key");
        k.textContent = key;
        const v = make("strong", "sim-add-device-summary__value");
        v.textContent = value;
        row.append(k, v);
        summary.append(row);
      });
      if (strip.whiteOnly) {
        const warning = make("p", "sim-add-device-summary__warning");
        warning.textContent = "White-hue only: dimmable + sequence-addressable; no RGB output.";
        summary.append(warning);
      }
    }

    function render() {
      panel.replaceChildren();
      stepper.querySelectorAll(".sim-add-device-stepper__item").forEach((item, index) => {
        item.classList.toggle("is-active", index === state.step);
        item.classList.toggle("is-complete", index < state.step);
      });
      if (state.step === 0) renderController();
      if (state.step === 1) renderStrip();
      if (state.step === 2) renderCount();
      if (state.step === 3) renderFormat();
      if (state.step === 4) renderPlacement();
      back.disabled = state.step === 0;
      next.textContent = state.step === 4 ? "Create Device" : "Next";
      renderSummary();
    }

    function open() {
      state = initialState(placements);
      overlay.hidden = false;
      document.documentElement.classList.add("sim-add-device-open");
      render();
      closeButton.focus();
    }

    function close() {
      overlay.hidden = true;
      document.documentElement.classList.remove("sim-add-device-open");
    }

    function finish() {
      const validation = validateState(state, placements);
      if (validation.errors.length) {
        render();
        return false;
      }
      const controller = getController(state.controllerId);
      const strip = validation.strip;
      const placement = validation.placement;
      const areaName = placement.id === "custom-area" ? text(state.customAreaName, "Custom Area") : placement.label;
      const baseId = slug(areaName, "led-area");
      let id = baseId;
      let suffix = 2;
      while (devicesApi.getDevice(id)) id = `${baseId}-${suffix++}`;

      const device = devicesApi.addDevice({
        id,
        label: areaName,
        controllerType: controller.label,
        ledType: `${strip.code} · ${state.protection}`,
        ledCount: validation.count,
        connectionType: controller.connectionType,
        connectionState: "connecting",
        power: "off",
        currentEffect: strip.whiteOnly ? "White sequence ready" : "Ready",
        meta: {
          controllerTemplateId: controller.id,
          controllerTemplateOnly: true,
          stripTemplateId: strip.id,
          stripCode: strip.code,
          stripFamily: strip.family,
          stripCapability: strip.capability,
          colorMode: strip.colorMode,
          addressable: strip.addressable,
          dedicatedWhite: Boolean(strip.dedicatedWhite),
          whiteOnly: Boolean(strip.whiteOnly),
          backupData: Boolean(strip.backupData),
          groupedPixels: Boolean(strip.groupedPixels),
          protection: state.protection,
          physicalFormat: state.format,
          placementId: placement.id,
          placementEnvironment: validation.environment
        }
      });

      // A newly created lighting area becomes the canonical active target immediately.
      // It remains selected when the user moves into Music, Presets, Groups or Custom Effects.
      if (typeof devicesApi.selectDevice === "function") {
        devicesApi.selectDevice(device.id);
      } else if (window.ShyneTymeLedSimDevices?.targetFromDevice) {
        (shellApi.selectTarget || shellApi.setTarget)(window.ShyneTymeLedSimDevices.targetFromDevice(device));
      }
      shellApi.setActiveTab("devices");
      options.onCreate?.(clone(device), { shellApi, devicesApi });
      if (typeof window.CustomEvent === "function") {
        window.dispatchEvent(new CustomEvent("shynetyme:led-sim-device-created", {
          detail: { device: clone(device), shell: { simId } }
        }));
      }
      close();
      return device;
    }

    back.addEventListener("click", () => {
      if (state.step > 0) { state.step -= 1; render(); }
    });
    next.addEventListener("click", () => {
      if (state.step < 4) { state.step += 1; render(); }
      else finish();
    });
    closeButton.addEventListener("click", close);
    overlay.addEventListener("click", (event) => { if (event.target === overlay) close(); });
    document.addEventListener("keydown", (event) => {
      if (!overlay.hidden && event.key === "Escape") close();
    });

    function addRequestListener(event) {
      if (event.detail?.shell?.simId && event.detail.shell.simId !== simId) return;
      open();
    }
    window.addEventListener("shynetyme:led-sim-add-device", addRequestListener);

    const api = Object.freeze({
      version: MODULE_VERSION,
      root: overlay,
      open,
      close,
      finish,
      getState: () => clone(state),
      getPlacements: () => clone(placements),
      setPlacementOptions(nextPlacements) {
        const normalized = normalizePlacements(nextPlacements);
        placements.splice?.(0, placements.length, ...normalized);
        state = initialState(placements);
        render();
      },
      destroy() {
        window.removeEventListener("shynetyme:led-sim-add-device", addRequestListener);
        overlay.remove();
        document.documentElement.classList.remove("sim-add-device-open");
      }
    });

    return api;
  }

  window.ShyneTymeLedSimAddDevice = Object.freeze({
    version: MODULE_VERSION,
    controllerTemplates: CONTROLLER_TEMPLATES,
    stripTemplates: STRIP_TEMPLATES,
    ledCountChoices: LED_COUNT_CHOICES,
    formatLabels: FORMAT_LABELS,
    defaultHomePlacements: DEFAULT_HOME_PLACEMENTS,
    normalizePlacements,
    validateState,
    mountAddDeviceWizard
  });
})();
