(() => {
  "use strict";

  if (window.ShyneTymeLedSimCore) {
    return;
  }

  const CORE_VERSION = "2026.08.09-active-target-step4";
  const DEFAULT_TAB = "devices";
  const STORAGE_VERSION = 1;

  const APP_TABS = Object.freeze([
    Object.freeze({ id: "devices", label: "Devices" }),
    Object.freeze({ id: "groups", label: "Groups" }),
    Object.freeze({ id: "music", label: "Music Sync" }),
    Object.freeze({ id: "presets", label: "Presets" }),
    Object.freeze({ id: "custom", label: "Custom Effects" })
  ]);

  const TAB_IDS = new Set(APP_TABS.map((tab) => tab.id));
  const TARGET_TYPES = new Set(["device", "area", "group"]);

  // Current shared tabs all preserve the selected target. This table is explicit so
  // later modules can narrow compatibility without silently replacing the active target.
  const TARGET_COMPATIBILITY = Object.freeze({
    devices: Object.freeze(["device", "area", "group"]),
    groups: Object.freeze(["device", "area", "group"]),
    music: Object.freeze(["device", "area", "group"]),
    presets: Object.freeze(["device", "area", "group"]),
    custom: Object.freeze(["device", "area", "group"])
  });

  function clone(value) {
    if (value === undefined) {
      return undefined;
    }

    return JSON.parse(JSON.stringify(value));
  }

  function slug(value, fallback = "sim") {
    const normalized = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return normalized || fallback;
  }

  function normalizeTab(tabId) {
    return TAB_IDS.has(tabId) ? tabId : DEFAULT_TAB;
  }

  function normalizeTarget(target) {
    if (target === null || target === undefined) {
      return null;
    }

    if (typeof target !== "object") {
      throw new TypeError("LED SIM target must be an object, null, or undefined.");
    }

    const type = String(target.type || "").toLowerCase();
    const id = String(target.id || "").trim();
    const label = String(target.label || "").trim();

    if (!TARGET_TYPES.has(type)) {
      throw new TypeError("LED SIM target.type must be device, area, or group.");
    }

    if (!id) {
      throw new TypeError("LED SIM target.id is required.");
    }

    if (!label) {
      throw new TypeError("LED SIM target.label is required.");
    }

    return {
      type,
      id,
      label,
      deviceId: target.deviceId ? String(target.deviceId) : null,
      areaId: target.areaId ? String(target.areaId) : null,
      groupId: target.groupId ? String(target.groupId) : null,
      connection: target.connection ? String(target.connection) : "unknown",
      power: target.power ? String(target.power) : "unknown",
      memberCount: target.memberCount !== null
        && target.memberCount !== undefined
        && target.memberCount !== ""
        && Number.isFinite(Number(target.memberCount))
        ? Number(target.memberCount)
        : null,
      meta: target.meta && typeof target.meta === "object"
        ? clone(target.meta)
        : {}
    };
  }

  function targetKey(target) {
    return target ? `${target.type}:${target.id}` : "";
  }

  function isTargetCompatible(tabId, target) {
    if (!target) return true;
    const activeTab = normalizeTab(tabId);
    const allowed = TARGET_COMPATIBILITY[activeTab] || [];
    return allowed.includes(target.type);
  }

  class TargetStateModel {
    constructor(options = {}) {
      this.simId = slug(options.simId || "shared", "shared");
      this.persist = options.persist !== false;
      this.storageKey = options.storageKey || `shynetyme-led-sim:${this.simId}:shell:v${STORAGE_VERSION}`;
      this.listeners = new Set();
      this.state = {
        simId: this.simId,
        activeTab: DEFAULT_TAB,
        target: null,
        revision: 0
      };

      this.#hydrate();
    }

    #hydrate() {
      if (!this.persist || !window.sessionStorage) {
        return;
      }

      try {
        const raw = window.sessionStorage.getItem(this.storageKey);
        if (!raw) {
          return;
        }

        const saved = JSON.parse(raw);
        this.state.activeTab = normalizeTab(saved.activeTab);
        this.state.target = normalizeTarget(saved.target);
      } catch (error) {
        console.warn("ShyneTyme LED SIM state hydration skipped:", error);
      }
    }

    #save() {
      if (!this.persist || !window.sessionStorage) {
        return;
      }

      try {
        window.sessionStorage.setItem(this.storageKey, JSON.stringify({
          activeTab: this.state.activeTab,
          target: this.state.target
        }));
      } catch (error) {
        console.warn("ShyneTyme LED SIM state persistence skipped:", error);
      }
    }

    #emit(reason, previousState) {
      const detail = {
        reason,
        state: this.getState(),
        previousState: clone(previousState)
      };

      this.listeners.forEach((listener) => {
        try {
          listener(detail);
        } catch (error) {
          console.error("ShyneTyme LED SIM state subscriber failed:", error);
        }
      });

      if (typeof window.CustomEvent === "function" && typeof window.dispatchEvent === "function") {
        window.dispatchEvent(new CustomEvent("shynetyme:led-sim-state-change", { detail }));

        const previousKey = targetKey(previousState?.target);
        const nextKey = targetKey(detail.state.target);
        const targetChanged = previousKey !== nextKey
          || JSON.stringify(previousState?.target || null) !== JSON.stringify(detail.state.target || null);

        if (targetChanged) {
          window.dispatchEvent(new CustomEvent("shynetyme:led-sim-active-target-change", {
            detail: {
              reason,
              target: clone(detail.state.target),
              targetKey: nextKey,
              previousTarget: clone(previousState?.target || null),
              previousTargetKey: previousKey,
              activeTab: detail.state.activeTab,
              simId: this.simId
            }
          }));
        }
      }
    }

    #commit(nextState, reason) {
      const previousState = this.getState();
      this.state = {
        ...nextState,
        simId: this.simId,
        revision: this.state.revision + 1
      };
      this.#save();
      this.#emit(reason, previousState);
      return this.getState();
    }

    getState() {
      return clone(this.state);
    }

    getActiveTab() {
      return this.state.activeTab;
    }

    getTarget() {
      return clone(this.state.target);
    }

    getActiveTarget() {
      return this.getTarget();
    }

    getTargetKey() {
      return targetKey(this.state.target);
    }

    hasActiveTarget() {
      return Boolean(this.state.target);
    }

    isActiveTarget(typeOrTarget, id) {
      const currentKey = this.getTargetKey();
      if (!currentKey) return false;

      if (typeof typeOrTarget === "object" && typeOrTarget) {
        return currentKey === targetKey(normalizeTarget(typeOrTarget));
      }

      return currentKey === `${String(typeOrTarget || "").toLowerCase()}:${String(id || "")}`;
    }

    isTargetCompatible(tabId = this.state.activeTab) {
      return isTargetCompatible(tabId, this.state.target);
    }

    setActiveTab(tabId) {
      const activeTab = normalizeTab(tabId);
      if (activeTab === this.state.activeTab) {
        return this.getState();
      }

      return this.#commit({
        ...this.state,
        activeTab
      }, "tab-change");
    }

    setTarget(target) {
      const normalized = normalizeTarget(target);
      const current = JSON.stringify(this.state.target);
      const next = JSON.stringify(normalized);

      if (current === next) {
        return this.getState();
      }

      return this.#commit({
        ...this.state,
        target: normalized
      }, "target-select");
    }

    selectTarget(target) {
      return this.setTarget(target);
    }

    updateTarget(patch = {}) {
      if (!this.state.target) {
        throw new Error("Cannot update LED SIM target before a target is selected.");
      }

      const normalized = normalizeTarget({
        ...this.state.target,
        ...clone(patch),
        meta: {
          ...this.state.target.meta,
          ...(patch.meta && typeof patch.meta === "object" ? clone(patch.meta) : {})
        }
      });

      if (JSON.stringify(normalized) === JSON.stringify(this.state.target)) {
        return this.getState();
      }

      return this.#commit({
        ...this.state,
        target: normalized
      }, "target-update");
    }

    refreshTarget(target) {
      if (!this.state.target) return this.getState();
      const normalized = normalizeTarget(target);
      if (targetKey(normalized) !== this.getTargetKey()) {
        return this.getState();
      }
      return this.updateTarget(normalized);
    }

    clearTarget() {
      if (!this.state.target) {
        return this.getState();
      }

      return this.#commit({
        ...this.state,
        target: null
      }, "target-clear");
    }

    reset(options = {}) {
      const keepTarget = options.keepTarget === true;
      return this.#commit({
        ...this.state,
        activeTab: DEFAULT_TAB,
        target: keepTarget ? this.state.target : null
      }, "reset");
    }

    subscribe(listener, options = {}) {
      if (typeof listener !== "function") {
        throw new TypeError("LED SIM state subscriber must be a function.");
      }

      this.listeners.add(listener);

      if (options.immediate !== false) {
        listener({
          reason: "subscribe",
          state: this.getState(),
          previousState: null
        });
      }

      return () => this.listeners.delete(listener);
    }
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

  function describeTarget(target) {
    if (!target) {
      return {
        type: "No target",
        label: "Select a device, area, or group",
        status: "Your target stays selected while you move between tabs."
      };
    }

    const typeLabel = target.type === "group"
      ? "Group"
      : target.type === "area"
        ? "LED Area"
        : "Device";

    const statusParts = [];
    if (target.connection && target.connection !== "unknown") {
      statusParts.push(target.connection);
    }
    if (target.power && target.power !== "unknown") {
      statusParts.push(target.power);
    }
    if (target.type === "group" && Number.isFinite(target.memberCount)) {
      statusParts.push(`${target.memberCount} ${target.memberCount === 1 ? "member" : "members"}`);
    }

    return {
      type: typeLabel,
      label: target.label,
      status: statusParts.length ? statusParts.join(" · ") : "Ready for controls"
    };
  }

  function mountShell(root, options = {}) {
    const mountPoint = typeof root === "string"
      ? document.querySelector(root)
      : root;

    if (!(mountPoint instanceof Element)) {
      throw new Error("ShyneTyme LED SIM shell mount point was not found.");
    }

    const simId = slug(options.simId || mountPoint.dataset.simId || "shared", "shared");
    const state = options.stateModel instanceof TargetStateModel
      ? options.stateModel
      : new TargetStateModel({ simId, persist: options.persist !== false });

    const shell = createElement("section", "sim-core-shell sim-attention-frame", {
      "data-sim-core": CORE_VERSION,
      "data-sim-id": simId
    });

    const header = createElement("header", "sim-core-header");
    const headingWrap = createElement("div", "sim-core-heading");
    const kicker = createElement("p", "sim-core-kicker");
    kicker.textContent = options.kicker || "ShyneTyme LED Control Core";
    const title = createElement("h2", "sim-core-title");
    title.textContent = options.title || "LED SIM Controls";
    headingWrap.append(kicker, title);

    const targetBar = createElement("div", "sim-core-target", {
      "aria-live": "polite",
      "data-sim-current-target": "true"
    });
    const targetType = createElement("span", "sim-core-target__type");
    const targetLabel = createElement("strong", "sim-core-target__label");
    const targetStatus = createElement("span", "sim-core-target__status");
    targetBar.append(targetType, targetLabel, targetStatus);
    header.append(headingWrap, targetBar);

    const tabList = createElement("div", "sim-core-tabs", {
      role: "tablist",
      "aria-label": "LED SIM controls"
    });
    const tabButtons = new Map();
    const panels = new Map();

    APP_TABS.forEach((tab) => {
      const button = createElement("button", "sim-core-tab", {
        type: "button",
        role: "tab",
        id: `${simId}-sim-tab-${tab.id}`,
        "aria-controls": `${simId}-sim-panel-${tab.id}`,
        "data-sim-tab": tab.id
      });
      button.textContent = tab.label;
      button.addEventListener("click", () => state.setActiveTab(tab.id));
      tabList.append(button);
      tabButtons.set(tab.id, button);
    });

    const panelHost = createElement("div", "sim-core-panels");

    APP_TABS.forEach((tab) => {
      const panel = createElement("section", "sim-core-panel", {
        role: "tabpanel",
        id: `${simId}-sim-panel-${tab.id}`,
        "aria-labelledby": `${simId}-sim-tab-${tab.id}`,
        "data-sim-slot": tab.id,
        tabindex: "0"
      });
      panelHost.append(panel);
      panels.set(tab.id, panel);
    });

    shell.append(header, tabList, panelHost);
    mountPoint.replaceChildren(shell);

    function render(nextState) {
      const activeTab = normalizeTab(nextState.activeTab);

      tabButtons.forEach((button, tabId) => {
        const active = tabId === activeTab;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", String(active));
        button.tabIndex = active ? 0 : -1;
      });

      panels.forEach((panel, tabId) => {
        const active = tabId === activeTab;
        panel.classList.toggle("is-active", active);
        panel.hidden = !active;
      });

      const description = describeTarget(nextState.target);
      targetType.textContent = description.type;
      targetLabel.textContent = description.label;
      targetStatus.textContent = description.status;
      targetBar.dataset.targetType = nextState.target?.type || "none";
      targetBar.dataset.connection = nextState.target?.connection || "unknown";
      targetBar.dataset.power = nextState.target?.power || "unknown";
      targetBar.dataset.compatible = String(isTargetCompatible(activeTab, nextState.target));
      shell.dataset.activeTab = activeTab;
      shell.dataset.targetKey = targetKey(nextState.target);
      shell.dataset.hasActiveTarget = String(Boolean(nextState.target));
      shell.dataset.targetCompatible = String(isTargetCompatible(activeTab, nextState.target));
    }

    const unsubscribe = state.subscribe(({ state: nextState }) => render(nextState));

    return Object.freeze({
      version: CORE_VERSION,
      root: mountPoint,
      shell,
      state,
      tabs: APP_TABS,
      getSlot(tabId) {
        return panels.get(normalizeTab(tabId)) || null;
      },
      setActiveTab(tabId) {
        return state.setActiveTab(tabId);
      },
      setTarget(target) {
        return state.setTarget(target);
      },
      selectTarget(target) {
        return state.selectTarget(target);
      },
      updateTarget(patch) {
        return state.updateTarget(patch);
      },
      refreshTarget(target) {
        return state.refreshTarget(target);
      },
      getActiveTarget() {
        return state.getActiveTarget();
      },
      getActiveTargetKey() {
        return state.getTargetKey();
      },
      hasActiveTarget() {
        return state.hasActiveTarget();
      },
      isTargetCompatible(tabId) {
        return state.isTargetCompatible(tabId);
      },
      clearTarget() {
        return state.clearTarget();
      },
      destroy() {
        unsubscribe();
        mountPoint.replaceChildren();
      }
    });
  }

  window.ShyneTymeLedSimCore = Object.freeze({
    version: CORE_VERSION,
    tabs: APP_TABS,
    targetTypes: Object.freeze([...TARGET_TYPES]),
    targetCompatibility: TARGET_COMPATIBILITY,
    isTargetCompatible,
    createStateModel(options) {
      return new TargetStateModel(options);
    },
    mountShell,
    normalizeTarget,
    targetKey
  });
})();
