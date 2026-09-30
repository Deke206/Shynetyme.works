(() => {
  "use strict";

  if (window.ShyneTymeLedSimDevices) {
    return;
  }

  const MODULE_VERSION = "2026.08.09-devices-groups-step6";
  const CONNECTION_TYPES = new Set(["wifi", "bluetooth"]);
  const CONNECTION_STATES = new Set(["connected", "connecting", "offline", "unknown"]);
  const POWER_STATES = new Set(["on", "off"]);

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function text(value, fallback = "") {
    const normalized = String(value ?? "").trim();
    return normalized || fallback;
  }

  function slug(value, fallback = "device") {
    const normalized = text(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return normalized || fallback;
  }

  function normalizeConnectionType(value) {
    const normalized = text(value, "wifi").toLowerCase();
    return CONNECTION_TYPES.has(normalized) ? normalized : "wifi";
  }

  function normalizeConnectionState(value) {
    const normalized = text(value, "unknown").toLowerCase();
    return CONNECTION_STATES.has(normalized) ? normalized : "unknown";
  }

  function normalizePower(value) {
    const normalized = text(value, "off").toLowerCase();
    return POWER_STATES.has(normalized) ? normalized : "off";
  }

  function normalizeDevice(device, index = 0) {
    if (!device || typeof device !== "object") {
      throw new TypeError("LED SIM device must be an object.");
    }

    const label = text(device.label || device.name, `LED Area ${index + 1}`);
    const id = text(device.id, slug(label, `device-${index + 1}`));
    const ledCountNumber = Number(device.ledCount);

    return {
      id,
      label,
      controllerType: text(device.controllerType || device.controller, "Controller not set"),
      ledType: text(device.ledType, "LED type not set"),
      ledCount: Number.isFinite(ledCountNumber) && ledCountNumber >= 0
        ? Math.round(ledCountNumber)
        : null,
      connectionType: normalizeConnectionType(device.connectionType || device.connection),
      connectionState: normalizeConnectionState(device.connectionState || device.status),
      power: normalizePower(device.power),
      currentEffect: text(device.currentEffect || device.effect || device.stateSummary, "Ready"),
      meta: device.meta && typeof device.meta === "object" ? clone(device.meta) : {}
    };
  }

  function createElement(tagName, className, attributes = {}) {
    const element = document.createElement(tagName);

    if (className) {
      element.className = className;
    }

    Object.entries(attributes).forEach(([name, value]) => {
      if (value !== null && value !== undefined) {
        element.setAttribute(name, String(value));
      }
    });

    return element;
  }

  function connectionIcon(type) {
    const wrap = createElement("span", "sim-device-card__connection-icon", {
      "aria-hidden": "true"
    });

    if (type === "bluetooth") {
      wrap.innerHTML = `
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <path d="M12 2v20l6-6-6-4 6-4-6-6Zm2 5.7 1.8 1.2L14 10.1V7.7Zm0 6.2 1.8 1.2L14 16.3v-2.4ZM6.5 7.5l9 9M6.5 16.5l9-9"/>
        </svg>`;
    } else {
      wrap.innerHTML = `
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <path d="M3 9.5a14 14 0 0 1 18 0M6.4 13a9 9 0 0 1 11.2 0M9.7 16.4a4 4 0 0 1 4.6 0M12 20h.01"/>
        </svg>`;
    }

    return wrap;
  }

  function connectionTypeLabel(type) {
    return type === "bluetooth" ? "Bluetooth" : "Wi-Fi";
  }

  function connectionStateLabel(state) {
    if (state === "connected") return "Connected";
    if (state === "connecting") return "Connecting";
    if (state === "offline") return "Offline";
    return "Unavailable";
  }

  function formatLedSummary(device) {
    const parts = [device.ledType];
    if (Number.isFinite(device.ledCount)) {
      parts.push(`${device.ledCount.toLocaleString()} LEDs`);
    }
    return parts.join(" · ");
  }

  function targetFromDevice(device) {
    return {
      type: "device",
      id: device.id,
      label: device.label,
      deviceId: device.id,
      connection: device.connectionState,
      power: device.power,
      meta: {
        controllerType: device.controllerType,
        ledType: device.ledType,
        ledCount: device.ledCount,
        connectionType: device.connectionType,
        currentEffect: device.currentEffect,
        ...clone(device.meta)
      }
    };
  }

  function createDeviceCard(device, handlers = {}) {
    const card = createElement("article", "sim-device-card sim-attention-frame", {
      "data-device-id": device.id,
      "data-connection-type": device.connectionType,
      "data-connection-state": device.connectionState,
      "data-power": device.power
    });

    const openButton = createElement("button", "sim-device-card__open", {
      type: "button",
      "aria-label": `Open controls for ${device.label}`
    });

    const headingRow = createElement("div", "sim-device-card__heading");
    const headingText = createElement("div", "sim-device-card__heading-text");
    const name = createElement("h3", "sim-device-card__name");
    name.textContent = device.label;
    const controller = createElement("p", "sim-device-card__controller");
    controller.textContent = device.controllerType;
    headingText.append(name, controller);

    const connection = createElement("span", "sim-device-card__connection", {
      "data-connection-state": device.connectionState,
      title: `${connectionTypeLabel(device.connectionType)} · ${connectionStateLabel(device.connectionState)}`
    });
    connection.append(connectionIcon(device.connectionType));
    const connectionWords = createElement("span", "sim-device-card__connection-words");
    const connectionType = createElement("strong", "sim-device-card__connection-type");
    connectionType.textContent = connectionTypeLabel(device.connectionType);
    const connectionState = createElement("small", "sim-device-card__connection-state");
    connectionState.textContent = connectionStateLabel(device.connectionState);
    connectionWords.append(connectionType, connectionState);
    connection.append(connectionWords);
    headingRow.append(headingText, connection);

    const specs = createElement("div", "sim-device-card__specs");
    const ledSummary = createElement("span", "sim-device-card__led-summary");
    ledSummary.textContent = formatLedSummary(device);
    specs.append(ledSummary);

    const effect = createElement("div", "sim-device-card__effect");
    const effectLabel = createElement("span", "sim-device-card__effect-label");
    effectLabel.textContent = "Current";
    const effectValue = createElement("strong", "sim-device-card__effect-value");
    effectValue.textContent = device.currentEffect;
    effect.append(effectLabel, effectValue);

    const openHint = createElement("span", "sim-device-card__open-hint");
    openHint.textContent = "Tap for controls";

    openButton.append(headingRow, specs, effect, openHint);
    openButton.addEventListener("click", () => handlers.onOpen?.(device));

    const footer = createElement("div", "sim-device-card__footer");
    const powerState = createElement("span", "sim-device-card__power-state", {
      "data-power": device.power
    });
    const powerDot = createElement("span", "sim-device-card__power-dot", { "aria-hidden": "true" });
    const powerWords = createElement("span", "sim-device-card__power-words");
    const powerCaption = createElement("small", "sim-device-card__power-caption");
    powerCaption.textContent = "Power";
    const powerValue = createElement("strong", "sim-device-card__power-value");
    powerValue.textContent = device.power === "on" ? "ON" : "OFF";
    powerWords.append(powerCaption, powerValue);
    powerState.append(powerDot, powerWords);

    const powerButton = createElement("button", "sim-device-card__power-button", {
      type: "button",
      "aria-pressed": String(device.power === "on"),
      "aria-label": `${device.power === "on" ? "Turn off" : "Turn on"} ${device.label}`
    });
    const powerGlyph = createElement("span", "sim-device-card__power-glyph", { "aria-hidden": "true" });
    powerGlyph.textContent = "⏻";
    const powerButtonText = createElement("span", "sim-device-card__power-button-text");
    powerButtonText.textContent = device.power === "on" ? "Turn Off" : "Turn On";
    powerButton.append(powerGlyph, powerButtonText);
    powerButton.addEventListener("click", () => handlers.onPowerToggle?.(device));

    footer.append(powerState, powerButton);
    card.append(openButton, footer);

    return card;
  }

  function mountDevicesTab(shellApi, options = {}) {
    if (!shellApi || typeof shellApi.getSlot !== "function" || !shellApi.state) {
      throw new TypeError("Devices tab requires a mounted ShyneTyme LED SIM shell API.");
    }

    const slot = shellApi.getSlot("devices");
    if (!(slot instanceof Element)) {
      throw new Error("LED SIM Devices slot was not found.");
    }

    let devices = Array.isArray(options.devices)
      ? options.devices.map((device, index) => normalizeDevice(device, index))
      : [];

    const view = createElement("section", "sim-devices-view", {
      "data-sim-devices": MODULE_VERSION
    });
    const toolbar = createElement("header", "sim-devices-toolbar");
    const heading = createElement("div", "sim-devices-toolbar__heading");
    const kicker = createElement("p", "sim-devices-toolbar__kicker");
    kicker.textContent = "Connected lighting areas";
    const title = createElement("h2", "sim-devices-toolbar__title");
    title.textContent = "Devices";
    const summary = createElement("p", "sim-devices-toolbar__summary", { "aria-live": "polite" });
    heading.append(kicker, title, summary);

    const addButton = createElement("button", "sim-devices-add", {
      type: "button",
      "data-sim-add-device": "true"
    });
    const addGlyph = createElement("span", "sim-devices-add__glyph", { "aria-hidden": "true" });
    addGlyph.textContent = "+";
    const addWords = createElement("span", "sim-devices-add__words");
    addWords.textContent = "ADD DEVICE";
    addButton.append(addGlyph, addWords);
    toolbar.append(heading, addButton);

    const grid = createElement("div", "sim-devices-grid", {
      "data-sim-device-grid": "true"
    });
    const empty = createElement("div", "sim-devices-empty sim-attention-frame");
    const emptyTitle = createElement("h3", "sim-devices-empty__title");
    emptyTitle.textContent = "No lighting areas yet";
    const emptyCopy = createElement("p", "sim-devices-empty__copy");
    emptyCopy.textContent = "Add the first controller or LED area to start building this SIM.";
    const emptyAdd = createElement("button", "sim-devices-empty__add", { type: "button" });
    emptyAdd.textContent = "+ ADD DEVICE";
    empty.append(emptyTitle, emptyCopy, emptyAdd);

    view.append(toolbar, grid, empty);
    slot.replaceChildren(view);

    function dispatch(name, detail) {
      if (typeof window.CustomEvent === "function" && typeof window.dispatchEvent === "function") {
        window.dispatchEvent(new CustomEvent(name, { detail }));
      }
    }

    let devicesChangePending = false;
    let devicesChangeReason = "update";
    function scheduleDevicesChange(reason = "update") {
      devicesChangeReason = reason;
      if (devicesChangePending) return;
      devicesChangePending = true;
      const flush = () => {
        devicesChangePending = false;
        dispatch("shynetyme:led-sim-devices-change", {
          reason: devicesChangeReason,
          devices: clone(devices),
          shell: { simId: shellApi.state.getState().simId }
        });
      };
      if (typeof queueMicrotask === "function") queueMicrotask(flush);
      else Promise.resolve().then(flush);
    }

    function findIndex(deviceId) {
      return devices.findIndex((device) => device.id === String(deviceId));
    }

    function currentCounts() {
      return {
        total: devices.length,
        connected: devices.filter((device) => device.connectionState === "connected").length,
        on: devices.filter((device) => device.power === "on").length
      };
    }

    function updateSummary() {
      const counts = currentCounts();
      if (!counts.total) {
        summary.textContent = "What exists · connection status · power state";
        return;
      }

      summary.textContent = `${counts.total.toLocaleString()} ${counts.total === 1 ? "area" : "areas"} · ${counts.connected.toLocaleString()} connected · ${counts.on.toLocaleString()} on`;
    }

    function syncSelectedCard() {
      const target = shellApi.state.getActiveTarget?.() || shellApi.state.getTarget();
      grid.querySelectorAll(".sim-device-card").forEach((card) => {
        const selected = target?.type === "device" && target.id === card.dataset.deviceId;
        card.classList.toggle("is-selected", selected);
        card.setAttribute("data-selected", String(selected));
      });
    }

    function reconcileActiveTarget(options = {}) {
      const target = shellApi.state.getActiveTarget?.() || shellApi.state.getTarget();
      if (target?.type !== "device") return target;

      const index = findIndex(target.id);
      if (index < 0) {
        if (options.clearMissing !== false) shellApi.state.clearTarget();
        return null;
      }

      const refreshed = targetFromDevice(devices[index]);
      if (typeof shellApi.state.refreshTarget === "function") {
        shellApi.state.refreshTarget(refreshed);
      } else {
        shellApi.state.setTarget(refreshed);
      }
      return refreshed;
    }

    function openDevice(device) {
      const selected = clone(device);
      (shellApi.state.selectTarget || shellApi.state.setTarget).call(shellApi.state, targetFromDevice(selected));
      options.onOpenDevice?.(selected, shellApi);
      dispatch("shynetyme:led-sim-device-open", {
        device: selected,
        target: shellApi.state.getTarget(),
        shell: { simId: shellApi.state.getState().simId }
      });
    }

    function togglePower(device) {
      const index = findIndex(device.id);
      if (index < 0) return;

      const nextPower = devices[index].power === "on" ? "off" : "on";
      devices[index] = { ...devices[index], power: nextPower };

      const target = shellApi.state.getTarget();
      if (target?.type === "device" && target.id === device.id) {
        shellApi.state.updateTarget({
          power: nextPower,
          meta: { currentEffect: devices[index].currentEffect }
        });
      }

      const updated = clone(devices[index]);
      options.onPowerChange?.(updated, nextPower, shellApi);
      dispatch("shynetyme:led-sim-device-power", {
        device: updated,
        power: nextPower,
        shell: { simId: shellApi.state.getState().simId }
      });
      scheduleDevicesChange("power");
      render();
    }

    function render() {
      grid.replaceChildren();
      empty.hidden = devices.length > 0;
      grid.hidden = devices.length === 0;

      devices.forEach((device) => {
        grid.append(createDeviceCard(device, {
          onOpen: openDevice,
          onPowerToggle: togglePower
        }));
      });

      updateSummary();
      syncSelectedCard();
    }

    function requestAddDevice() {
      options.onAddDevice?.(api, shellApi);
      dispatch("shynetyme:led-sim-add-device", {
        shell: { simId: shellApi.state.getState().simId },
        deviceCount: devices.length
      });
    }

    addButton.addEventListener("click", requestAddDevice);
    emptyAdd.addEventListener("click", requestAddDevice);

    const unsubscribe = shellApi.state.subscribe(() => syncSelectedCard(), { immediate: false });

    const api = Object.freeze({
      version: MODULE_VERSION,
      root: view,
      getDevices() {
        return clone(devices);
      },
      getDevice(deviceId) {
        const device = devices[findIndex(deviceId)];
        return device ? clone(device) : null;
      },
      setDevices(nextDevices = []) {
        if (!Array.isArray(nextDevices)) {
          throw new TypeError("setDevices expects an array.");
        }
        devices = nextDevices.map((device, index) => normalizeDevice(device, index));
        reconcileActiveTarget();
        scheduleDevicesChange("set");
        render();
        return this.getDevices();
      },
      addDevice(device) {
        const normalized = normalizeDevice(device, devices.length);
        if (findIndex(normalized.id) >= 0) {
          throw new Error(`LED SIM device id already exists: ${normalized.id}`);
        }
        devices.push(normalized);
        scheduleDevicesChange("add");
        render();
        return clone(normalized);
      },
      updateDevice(deviceId, patch = {}) {
        const index = findIndex(deviceId);
        if (index < 0) {
          throw new Error(`LED SIM device not found: ${deviceId}`);
        }

        const incoming = clone(patch);
        const mergedMeta = incoming?.meta && typeof incoming.meta === "object"
          ? { ...clone(devices[index].meta), ...incoming.meta }
          : clone(devices[index].meta);
        const updated = normalizeDevice({
          ...devices[index],
          ...incoming,
          id: devices[index].id,
          meta: mergedMeta
        }, index);
        devices[index] = updated;

        const target = shellApi.state.getTarget();
        if (target?.type === "device" && target.id === updated.id) {
          shellApi.state.setTarget(targetFromDevice(updated));
        }

        scheduleDevicesChange("update");
        render();
        return clone(updated);
      },
      removeDevice(deviceId) {
        const index = findIndex(deviceId);
        if (index < 0) return false;
        devices.splice(index, 1);

        const target = shellApi.state.getTarget();
        if (target?.type === "device" && target.id === String(deviceId)) {
          shellApi.state.clearTarget();
        }

        scheduleDevicesChange("remove");
        render();
        return true;
      },
      selectDevice(deviceId, options = {}) {
        const device = devices[findIndex(deviceId)];
        if (!device) return false;
        const selected = clone(device);
        (shellApi.state.selectTarget || shellApi.state.setTarget).call(shellApi.state, targetFromDevice(selected));
        if (options.open === true) {
          options.onOpenDevice?.(selected, shellApi);
          dispatch("shynetyme:led-sim-device-open", {
            device: selected,
            target: shellApi.state.getTarget(),
            shell: { simId: shellApi.state.getState().simId }
          });
        }
        return clone(selected);
      },
      reconcileActiveTarget,
      openDevice(deviceId) {
        const device = devices[findIndex(deviceId)];
        if (!device) return false;
        openDevice(device);
        return true;
      },
      destroy() {
        unsubscribe();
        slot.replaceChildren();
      }
    });

    render();
    return api;
  }

  window.ShyneTymeLedSimDevices = Object.freeze({
    version: MODULE_VERSION,
    normalizeDevice,
    targetFromDevice,
    createDeviceCard,
    mountDevicesTab
  });
})();
