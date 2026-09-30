(() => {
  "use strict";

  if (window.ShyneTymeLedSimGroups) return;

  const MODULE_VERSION = "2026.08.09-groups-step6";
  const STORAGE_VERSION = 1;
  const POWER_OVERRIDES = new Set(["on", "off"]);
  const NUMERIC_OVERRIDE_RULES = Object.freeze({
    brightness: [0, 100],
    speed: [0, 100],
    intensity: [0, 100],
    density: [1, 100],
    segments: [1, 32],
    transition: [0, 100],
    duration: [0, 86400]
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

  function slug(value, fallback = "group") {
    const normalized = text(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return normalized || fallback;
  }

  function make(tag, className, attrs = {}) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    Object.entries(attrs).forEach(([key, value]) => {
      if (value !== null && value !== undefined) element.setAttribute(key, String(value));
    });
    return element;
  }

  function dispatch(name, detail) {
    if (typeof window.CustomEvent === "function" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    }
  }

  function uniqueIds(values = []) {
    return [...new Set((Array.isArray(values) ? values : []).map((value) => text(value)).filter(Boolean))];
  }

  function normalizeOverride(input = {}) {
    const source = input && typeof input === "object" ? input : {};
    const output = {};

    if (text(source.effect)) output.effect = text(source.effect);
    if (POWER_OVERRIDES.has(source.power)) output.power = source.power;
    if ([1, -1, 2, -2].includes(Number(source.direction))) output.direction = Number(source.direction);
    if (SEGMENT_MODES.some((item) => item.value === source.segmentMode)) output.segmentMode = source.segmentMode;

    Object.entries(NUMERIC_OVERRIDE_RULES).forEach(([key, [min, max]]) => {
      if (source[key] === "" || source[key] === null || source[key] === undefined) return;
      const number = Number(source[key]);
      if (Number.isFinite(number)) output[key] = Math.round(Math.min(max, Math.max(min, number)));
    });

    if (Array.isArray(source.colors) && source.colors.length) {
      const colors = source.colors.slice(0, 3).map((value) => text(value)).filter(Boolean);
      if (colors.length) output.colors = colors;
    }

    return output;
  }

  function normalizeGroup(group, index = 0) {
    if (!group || typeof group !== "object") throw new TypeError("LED SIM group must be an object.");
    const label = text(group.label || group.name, `Group ${index + 1}`);
    const id = text(group.id, slug(label, `group-${index + 1}`));
    const memberIds = uniqueIds(group.memberIds || group.members);
    const sourceOverrides = group.overrides && typeof group.overrides === "object" ? group.overrides : {};
    const overrides = {};
    memberIds.forEach((memberId) => {
      const normalized = normalizeOverride(sourceOverrides[memberId]);
      if (Object.keys(normalized).length) overrides[memberId] = normalized;
    });

    const sharedSource = group.shared && typeof group.shared === "object" ? group.shared : {};
    return {
      id,
      label,
      memberIds,
      shared: {
        currentEffect: text(sharedSource.currentEffect || group.currentEffect, "Ready"),
        effectSettings: sharedSource.effectSettings && typeof sharedSource.effectSettings === "object"
          ? clone(sharedSource.effectSettings)
          : group.effectSettings && typeof group.effectSettings === "object"
            ? clone(group.effectSettings)
            : null
      },
      overrides,
      meta: group.meta && typeof group.meta === "object" ? clone(group.meta) : {}
    };
  }

  function getMemberDevices(group, devicesApi) {
    if (!devicesApi?.getDevice) return [];
    return group.memberIds.map((id) => devicesApi.getDevice(id)).filter(Boolean);
  }

  function summarizeConnection(devices) {
    if (!devices.length) return "unknown";
    const states = devices.map((device) => device.connectionState || "unknown");
    if (states.every((state) => state === "connected")) return "connected";
    if (states.some((state) => state === "connecting")) return "connecting";
    if (states.every((state) => state === "offline" || state === "unknown")) return "offline";
    return "mixed";
  }

  function summarizePower(devices) {
    if (!devices.length) return "unknown";
    const states = devices.map((device) => device.power || "off");
    if (states.every((state) => state === "on")) return "on";
    if (states.every((state) => state === "off")) return "off";
    return "mixed";
  }

  function memberCapability(device) {
    return device?.meta && typeof device.meta === "object" ? clone(device.meta) : {};
  }

  function targetFromGroup(group, devicesApi) {
    const members = getMemberDevices(group, devicesApi);
    return {
      type: "group",
      id: group.id,
      label: group.label,
      groupId: group.id,
      connection: summarizeConnection(members),
      power: summarizePower(members),
      memberCount: members.length,
      meta: {
        ...clone(group.meta),
        memberIds: members.map((device) => device.id),
        memberCapabilities: members.map(memberCapability),
        currentEffect: group.shared.currentEffect,
        effectSettings: clone(group.shared.effectSettings),
        overrides: clone(group.overrides)
      }
    };
  }

  function effectiveMemberSettings(group, deviceId) {
    const base = group?.shared?.effectSettings && typeof group.shared.effectSettings === "object"
      ? clone(group.shared.effectSettings)
      : {};
    const override = normalizeOverride(group?.overrides?.[deviceId]);
    return { ...base, ...override, colors: override.colors ? clone(override.colors) : clone(base.colors) };
  }

  function mountGroupsTab(shellApi, devicesApi, options = {}) {
    if (!shellApi?.state || typeof shellApi.getSlot !== "function") {
      throw new TypeError("Groups tab requires a mounted ShyneTyme LED SIM shell.");
    }
    if (!devicesApi?.getDevices || !devicesApi?.getDevice) {
      throw new TypeError("Groups tab requires the ShyneTyme Devices API.");
    }

    const slot = shellApi.getSlot("groups");
    if (!(slot instanceof Element)) throw new Error("LED SIM Groups slot was not found.");

    const simId = shellApi.state.getState().simId;
    const storageKey = `shynetyme-led-sim:${simId}:groups:v${STORAGE_VERSION}`;
    const presetApi = options.presetApi || window.ShynetymeSimPresets || null;
    const effectApi = options.effectDialogApi || window.ShyneTymeLedSimEffectDialog || null;
    let groups = [];
    let editingGroupId = null;
    let lastFocus = null;

    function hydrate() {
      const seeded = Array.isArray(options.groups) ? options.groups : null;
      if (seeded) {
        groups = seeded.map((group, index) => normalizeGroup(group, index));
        return;
      }
      try {
        const raw = window.sessionStorage?.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : [];
        groups = Array.isArray(parsed) ? parsed.map((group, index) => normalizeGroup(group, index)) : [];
      } catch (_) {
        groups = [];
      }
    }

    function persist() {
      try {
        window.sessionStorage?.setItem(storageKey, JSON.stringify(groups));
      } catch (_) {
        // Best-effort session persistence.
      }
    }

    function findIndex(groupId) {
      return groups.findIndex((group) => group.id === String(groupId));
    }

    function getGroup(groupId) {
      const group = groups[findIndex(groupId)];
      return group ? clone(group) : null;
    }

    function reconcileGroup(group) {
      const existingIds = new Set(devicesApi.getDevices().map((device) => device.id));
      const memberIds = group.memberIds.filter((id) => existingIds.has(id));
      const overrides = {};
      memberIds.forEach((id) => {
        if (group.overrides[id] && Object.keys(group.overrides[id]).length) overrides[id] = clone(group.overrides[id]);
      });
      return normalizeGroup({ ...group, memberIds, overrides });
    }

    function reconcileGroups() {
      groups = groups.map(reconcileGroup);
      persist();
      reconcileActiveTarget();
    }

    function reconcileActiveTarget() {
      const target = shellApi.getActiveTarget?.() || shellApi.state.getTarget();
      if (target?.type !== "group") return target;
      const group = groups[findIndex(target.id)];
      if (!group) {
        shellApi.clearTarget?.();
        return null;
      }
      const refreshed = targetFromGroup(group, devicesApi);
      shellApi.refreshTarget?.(refreshed);
      return refreshed;
    }

    function selectGroup(groupId, openControls = false) {
      const group = groups[findIndex(groupId)];
      if (!group) return false;
      const target = targetFromGroup(group, devicesApi);
      shellApi.selectTarget?.(target);
      if (openControls) {
        dispatch("shynetyme:led-sim-group-open", {
          group: clone(group),
          target: shellApi.getActiveTarget(),
          shell: { simId }
        });
      }
      return clone(target);
    }

    const view = make("section", "sim-groups-view", { "data-sim-groups": MODULE_VERSION });
    const toolbar = make("header", "sim-groups-toolbar");
    const heading = make("div", "sim-groups-toolbar__heading");
    const kicker = make("p", "sim-groups-toolbar__kicker");
    kicker.textContent = "Linked lighting targets";
    const title = make("h2", "sim-groups-toolbar__title");
    title.textContent = "Groups";
    const summary = make("p", "sim-groups-toolbar__summary", { "aria-live": "polite" });
    heading.append(kicker, title, summary);
    const createButton = make("button", "sim-groups-create", { type: "button" });
    createButton.textContent = "+ CREATE GROUP";
    toolbar.append(heading, createButton);

    const grid = make("div", "sim-groups-grid");
    const empty = make("div", "sim-groups-empty sim-attention-frame");
    const emptyTitle = make("h3", "sim-groups-empty__title");
    emptyTitle.textContent = "No groups yet";
    const emptyCopy = make("p", "sim-groups-empty__copy");
    emptyCopy.textContent = "Create a group to control several LED areas together while keeping member-specific overrides where needed.";
    const emptyCreate = make("button", "sim-groups-empty__create", { type: "button" });
    emptyCreate.textContent = "+ CREATE GROUP";
    empty.append(emptyTitle, emptyCopy, emptyCreate);
    view.append(toolbar, grid, empty);
    slot.replaceChildren(view);

    const overlay = make("div", "sim-group-editor-overlay", { hidden: "", "data-sim-group-editor": MODULE_VERSION });
    const dialog = make("section", "sim-group-editor sim-attention-frame", {
      role: "dialog", "aria-modal": "true", "aria-labelledby": `${simId}-group-editor-title`
    });
    const dialogHeader = make("header", "sim-group-editor__header");
    const dialogHeading = make("div", "sim-group-editor__heading");
    const dialogKicker = make("p", "sim-group-editor__kicker");
    dialogKicker.textContent = "Group manager";
    const dialogTitle = make("h2", "sim-group-editor__title", { id: `${simId}-group-editor-title` });
    const closeButton = make("button", "sim-group-editor__close", { type: "button", "aria-label": "Close group editor" });
    closeButton.textContent = "×";
    dialogHeading.append(dialogKicker, dialogTitle);
    dialogHeader.append(dialogHeading, closeButton);
    const dialogBody = make("div", "sim-group-editor__body");
    const dialogFooter = make("footer", "sim-group-editor__footer");
    const deleteButton = make("button", "sim-group-editor__button sim-group-editor__button--danger", { type: "button" });
    deleteButton.textContent = "Delete Group";
    const cancelButton = make("button", "sim-group-editor__button", { type: "button" });
    cancelButton.textContent = "Cancel";
    const saveButton = make("button", "sim-group-editor__button sim-group-editor__button--primary", { type: "button" });
    saveButton.textContent = "Save Group";
    dialogFooter.append(deleteButton, cancelButton, saveButton);
    dialog.append(dialogHeader, dialogBody, dialogFooter);
    overlay.append(dialog);
    document.body.append(overlay);

    function availableEffectsForDevice(device) {
      if (!presetApi) return [];
      if (effectApi?.resolveCapabilities && effectApi?.getAvailableEffects) {
        const caps = effectApi.resolveCapabilities({ type: "device", id: device.id, label: device.label, meta: device.meta });
        return effectApi.getAvailableEffects(caps, presetApi);
      }
      return [...presetApi.order];
    }

    function visibleForDevice(device, effectName) {
      if (effectApi?.visibleControls) {
        return effectApi.visibleControls({ type: "device", id: device.id, label: device.label, meta: device.meta }, effectName, presetApi);
      }
      const addressable = Boolean(device?.meta?.addressable);
      const canColor = !device?.meta?.whiteOnly;
      return { colors: canColor, brightness: true, speed: true, direction: addressable, density: addressable, intensity: true, segments: addressable, transition: true, duration: true };
    }

    function overrideCount(override) {
      return Object.keys(normalizeOverride(override)).length;
    }

    function createOverrideSelect(label, value, choices, onChange) {
      const field = make("label", "sim-group-override-field");
      const caption = make("span", "sim-group-override-field__label");
      caption.textContent = label;
      const select = make("select", "sim-group-override-select");
      const inherit = make("option", "", { value: "" });
      inherit.textContent = "Use group setting";
      select.append(inherit);
      choices.forEach((item) => {
        const option = make("option", "", { value: item.value });
        option.textContent = item.label;
        if (String(item.value) === String(value ?? "")) option.selected = true;
        select.append(option);
      });
      select.addEventListener("change", () => onChange(select.value));
      field.append(caption, select);
      return field;
    }

    function createOverrideNumber(label, value, min, max, placeholder, onChange) {
      const field = make("label", "sim-group-override-field");
      const caption = make("span", "sim-group-override-field__label");
      caption.textContent = label;
      const input = make("input", "sim-group-override-number", {
        type: "number", min, max, value: value ?? "", placeholder
      });
      input.addEventListener("change", () => onChange(input.value));
      field.append(caption, input);
      return field;
    }

    function renderOverrideEditor(container, groupDraft, device) {
      const memberId = device.id;
      const override = normalizeOverride(groupDraft.overrides[memberId]);
      const effectiveEffect = override.effect || groupDraft.shared.effectSettings?.effect || "solid";
      const visible = visibleForDevice(device, effectiveEffect);
      const effects = availableEffectsForDevice(device).map((name) => ({ value: name, label: presetApi?.getPreset?.(name)?.label || name }));
      const gridNode = make("div", "sim-group-override-grid");

      function setKey(key, rawValue) {
        const next = normalizeOverride({ ...(groupDraft.overrides[memberId] || {}) });
        if (rawValue === "" || rawValue === null || rawValue === undefined) delete next[key];
        else if (key in NUMERIC_OVERRIDE_RULES) next[key] = Number(rawValue);
        else if (key === "direction") next[key] = Number(rawValue);
        else next[key] = rawValue;
        const normalized = normalizeOverride(next);
        if (Object.keys(normalized).length) groupDraft.overrides[memberId] = normalized;
        else delete groupDraft.overrides[memberId];
        renderEditor(groupDraft);
      }

      gridNode.append(createOverrideSelect("Effect", override.effect, effects, (value) => setKey("effect", value)));
      if (visible.brightness) gridNode.append(createOverrideNumber("Brightness", override.brightness, 0, 100, "Group", (value) => setKey("brightness", value)));
      if (visible.speed) gridNode.append(createOverrideNumber("Speed", override.speed, 0, 100, "Group", (value) => setKey("speed", value)));
      if (visible.direction) gridNode.append(createOverrideSelect("Direction", override.direction, DIRECTIONS, (value) => setKey("direction", value)));
      if (visible.density) gridNode.append(createOverrideNumber("Density", override.density, 1, 100, "Group", (value) => setKey("density", value)));
      if (visible.intensity) gridNode.append(createOverrideNumber("Intensity", override.intensity, 0, 100, "Group", (value) => setKey("intensity", value)));
      if (visible.segments) {
        gridNode.append(createOverrideNumber("Segments", override.segments, 1, 32, "Group", (value) => setKey("segments", value)));
        gridNode.append(createOverrideSelect("Segment behavior", override.segmentMode, SEGMENT_MODES, (value) => setKey("segmentMode", value)));
      }
      if (visible.transition) gridNode.append(createOverrideNumber("Transition", override.transition, 0, 100, "Group", (value) => setKey("transition", value)));
      if (visible.duration) gridNode.append(createOverrideNumber("Duration sec", override.duration, 0, 86400, "Group", (value) => setKey("duration", value)));
      gridNode.append(createOverrideSelect("Power", override.power, [
        { value: "on", label: "Force ON" },
        { value: "off", label: "Force OFF" }
      ], (value) => setKey("power", value)));

      if (visible.colors) {
        const colorField = make("div", "sim-group-override-colors");
        const label = make("span", "sim-group-override-field__label");
        label.textContent = "Colors";
        const toggle = make("input", "", { type: "checkbox" });
        toggle.checked = Array.isArray(override.colors) && override.colors.length > 0;
        const toggleLabel = make("label", "sim-group-override-color-toggle");
        toggleLabel.append(toggle, document.createTextNode(" Override group colors"));
        colorField.append(label, toggleLabel);
        if (toggle.checked) {
          const row = make("div", "sim-group-override-color-row");
          const baseColors = override.colors || groupDraft.shared.effectSettings?.colors || presetApi?.defaultColors || ["#35e7ff", "#9b7cff", "#ff5ab9"];
          for (let i = 0; i < 3; i += 1) {
            const input = make("input", "sim-group-override-color", { type: "color", value: baseColors[i] || "#ffffff", "aria-label": `Override color ${i + 1}` });
            input.addEventListener("input", () => {
              const colors = [...(groupDraft.overrides[memberId]?.colors || baseColors)];
              colors[i] = input.value;
              groupDraft.overrides[memberId] = normalizeOverride({ ...(groupDraft.overrides[memberId] || {}), colors });
            });
            row.append(input);
          }
          colorField.append(row);
        }
        toggle.addEventListener("change", () => {
          if (toggle.checked) {
            const colors = clone(groupDraft.shared.effectSettings?.colors || presetApi?.defaultColors || ["#35e7ff", "#9b7cff", "#ff5ab9"]);
            groupDraft.overrides[memberId] = normalizeOverride({ ...(groupDraft.overrides[memberId] || {}), colors });
          } else if (groupDraft.overrides[memberId]) {
            const next = { ...groupDraft.overrides[memberId] };
            delete next.colors;
            const normalized = normalizeOverride(next);
            if (Object.keys(normalized).length) groupDraft.overrides[memberId] = normalized;
            else delete groupDraft.overrides[memberId];
          }
          renderEditor(groupDraft);
        });
        gridNode.append(colorField);
      }

      const reset = make("button", "sim-group-override-reset", { type: "button" });
      reset.textContent = "Reset member to group settings";
      reset.disabled = overrideCount(override) === 0;
      reset.addEventListener("click", () => {
        delete groupDraft.overrides[memberId];
        renderEditor(groupDraft);
      });
      container.append(gridNode, reset);
    }

    function renderEditor(groupDraft) {
      editingGroupId = groupDraft.id || null;
      const isNew = !editingGroupId || findIndex(editingGroupId) < 0;
      dialogTitle.textContent = isNew ? "Create Group" : `Edit ${groupDraft.label}`;
      deleteButton.hidden = isNew;
      dialogBody.replaceChildren();

      const identity = make("section", "sim-group-editor__section");
      const identityTitle = make("h3", "sim-group-editor__section-title");
      identityTitle.textContent = "Group name";
      const nameInput = make("input", "sim-group-name-input", { type: "text", maxlength: 60, value: groupDraft.label, placeholder: "Example: Front Exterior" });
      nameInput.addEventListener("input", () => { groupDraft.label = text(nameInput.value, groupDraft.label); });
      identity.append(identityTitle, nameInput);
      dialogBody.append(identity);

      const membersSection = make("section", "sim-group-editor__section");
      const membersTitle = make("h3", "sim-group-editor__section-title");
      membersTitle.textContent = "Members";
      const membersCopy = make("p", "sim-group-editor__copy");
      membersCopy.textContent = "Members inherit the group effect unless a field is overridden below.";
      const memberList = make("div", "sim-group-member-list");
      const devices = devicesApi.getDevices();
      devices.forEach((device) => {
        const row = make("label", "sim-group-member-choice");
        const checkbox = make("input", "", { type: "checkbox", value: device.id });
        checkbox.checked = groupDraft.memberIds.includes(device.id);
        const words = make("span", "sim-group-member-choice__words");
        const strong = make("strong");
        strong.textContent = device.label;
        const small = make("small");
        small.textContent = `${device.ledType} · ${device.connectionState} · ${device.power}`;
        words.append(strong, small);
        row.append(checkbox, words);
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) groupDraft.memberIds = uniqueIds([...groupDraft.memberIds, device.id]);
          else {
            groupDraft.memberIds = groupDraft.memberIds.filter((id) => id !== device.id);
            delete groupDraft.overrides[device.id];
          }
          renderEditor(groupDraft);
        });
        memberList.append(row);
      });
      if (!devices.length) {
        const none = make("p", "sim-group-editor__copy");
        none.textContent = "Add at least one Device before creating a group.";
        memberList.append(none);
      }
      membersSection.append(membersTitle, membersCopy, memberList);
      dialogBody.append(membersSection);

      if (groupDraft.memberIds.length) {
        const sharedSection = make("section", "sim-group-editor__section");
        const sharedHead = make("div", "sim-group-editor__section-head");
        const sharedText = make("div");
        const sharedTitle = make("h3", "sim-group-editor__section-title");
        sharedTitle.textContent = "Shared group effect";
        const sharedCopy = make("p", "sim-group-editor__copy");
        sharedCopy.textContent = `Current: ${groupDraft.shared.currentEffect || "Ready"}`;
        sharedText.append(sharedTitle, sharedCopy);
        const controlButton = make("button", "sim-group-control-button", { type: "button" });
        controlButton.textContent = "OPEN GROUP EFFECTS";
        controlButton.addEventListener("click", () => {
          if (isNew) return;
          closeEditor();
          selectGroup(groupDraft.id, true);
        });
        controlButton.disabled = isNew;
        sharedHead.append(sharedText, controlButton);
        sharedSection.append(sharedHead);
        dialogBody.append(sharedSection);

        const overridesSection = make("section", "sim-group-editor__section");
        const overridesTitle = make("h3", "sim-group-editor__section-title");
        overridesTitle.textContent = "Member overrides";
        const overridesCopy = make("p", "sim-group-editor__copy");
        overridesCopy.textContent = "Leave a field blank to inherit the group. Only deliberate differences are stored.";
        overridesSection.append(overridesTitle, overridesCopy);

        groupDraft.memberIds.forEach((memberId) => {
          const device = devicesApi.getDevice(memberId);
          if (!device) return;
          const details = make("details", "sim-group-member-override");
          const summaryNode = make("summary", "sim-group-member-override__summary");
          const summaryWords = make("span");
          const memberName = make("strong");
          memberName.textContent = device.label;
          const count = overrideCount(groupDraft.overrides[memberId]);
          const status = make("small");
          status.textContent = count ? `${count} override${count === 1 ? "" : "s"}` : "Inherits group";
          summaryWords.append(memberName, status);
          summaryNode.append(summaryWords);
          details.append(summaryNode);
          const content = make("div", "sim-group-member-override__body");
          renderOverrideEditor(content, groupDraft, device);
          details.append(content);
          overridesSection.append(details);
        });
        dialogBody.append(overridesSection);
      }

      saveButton.disabled = !devicesApi.getDevices().length;
      saveButton.onclick = () => {
        const label = text(nameInput.value);
        if (!label || !groupDraft.memberIds.length) return;
        groupDraft.label = label;
        if (isNew) {
          const baseId = slug(label, `group-${groups.length + 1}`);
          let id = baseId;
          let suffix = 2;
          while (findIndex(id) >= 0) id = `${baseId}-${suffix++}`;
          groupDraft.id = id;
          groups.push(normalizeGroup(groupDraft, groups.length));
          persist();
          render();
          selectGroup(id, false);
          dispatch("shynetyme:led-sim-group-create", { group: getGroup(id), target: shellApi.getActiveTarget(), simId });
        } else {
          const index = findIndex(groupDraft.id);
          groups[index] = normalizeGroup(groupDraft, index);
          persist();
          reconcileActiveTarget();
          render();
          dispatch("shynetyme:led-sim-group-update", { group: getGroup(groupDraft.id), target: shellApi.getActiveTarget(), simId });
        }
        closeEditor();
      };

      deleteButton.onclick = () => {
        if (isNew) return;
        removeGroup(groupDraft.id);
        closeEditor();
      };
    }

    function openEditor(groupId = null) {
      const existing = groupId ? getGroup(groupId) : null;
      const draft = existing || normalizeGroup({ id: "", label: `Group ${groups.length + 1}`, memberIds: [], shared: { currentEffect: "Ready", effectSettings: null }, overrides: {} }, groups.length);
      if (!existing) draft.id = "";
      lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      renderEditor(draft);
      overlay.hidden = false;
      document.documentElement.classList.add("sim-group-editor-open");
      closeButton.focus();
    }

    function closeEditor() {
      overlay.hidden = true;
      document.documentElement.classList.remove("sim-group-editor-open");
      editingGroupId = null;
      if (lastFocus?.focus) lastFocus.focus();
    }

    function render() {
      grid.replaceChildren();
      empty.hidden = groups.length > 0;
      grid.hidden = groups.length === 0;
      const totalMembers = groups.reduce((sum, group) => sum + group.memberIds.length, 0);
      summary.textContent = groups.length
        ? `${groups.length} ${groups.length === 1 ? "group" : "groups"} · ${totalMembers} member assignment${totalMembers === 1 ? "" : "s"}`
        : "Build reusable multi-area targets";

      const active = shellApi.getActiveTarget?.() || shellApi.state.getTarget();
      groups.forEach((group) => {
        const members = getMemberDevices(group, devicesApi);
        const card = make("article", `sim-group-card sim-attention-frame ${active?.type === "group" && active.id === group.id ? "is-selected" : ""}`.trim(), {
          "data-group-id": group.id
        });
        const open = make("button", "sim-group-card__open", { type: "button", "aria-label": `Control ${group.label}` });
        const head = make("div", "sim-group-card__head");
        const headText = make("div", "sim-group-card__head-text");
        const name = make("h3", "sim-group-card__name");
        name.textContent = group.label;
        const memberLine = make("p", "sim-group-card__members");
        memberLine.textContent = `${members.length} ${members.length === 1 ? "member" : "members"}`;
        headText.append(name, memberLine);
        const status = make("span", "sim-group-card__status", {
          "data-connection": summarizeConnection(members), "data-power": summarizePower(members)
        });
        status.textContent = `${summarizeConnection(members)} · ${summarizePower(members)}`;
        head.append(headText, status);
        const effect = make("div", "sim-group-card__effect");
        const effectLabel = make("span");
        effectLabel.textContent = "Current";
        const effectValue = make("strong");
        effectValue.textContent = group.shared.currentEffect || "Ready";
        effect.append(effectLabel, effectValue);
        const overrides = make("p", "sim-group-card__override-summary");
        const overrideMembers = Object.values(group.overrides).filter((value) => overrideCount(value) > 0).length;
        overrides.textContent = overrideMembers ? `${overrideMembers} member override${overrideMembers === 1 ? "" : "s"}` : "All members inherit group settings";
        open.append(head, effect, overrides);
        open.addEventListener("click", () => selectGroup(group.id, true));
        const actions = make("div", "sim-group-card__actions");
        const edit = make("button", "sim-group-card__edit", { type: "button" });
        edit.textContent = "MEMBERS & OVERRIDES";
        edit.addEventListener("click", () => {
          shellApi.selectTarget?.(targetFromGroup(group, devicesApi));
          openEditor(group.id);
        });
        actions.append(edit);
        card.append(open, actions);
        grid.append(card);
      });
    }

    function setGroups(nextGroups = []) {
      if (!Array.isArray(nextGroups)) throw new TypeError("setGroups expects an array.");
      groups = nextGroups.map((group, index) => normalizeGroup(group, index)).map(reconcileGroup);
      persist();
      reconcileActiveTarget();
      render();
      return clone(groups);
    }

    function addGroup(group) {
      const normalized = reconcileGroup(normalizeGroup(group, groups.length));
      if (findIndex(normalized.id) >= 0) throw new Error(`LED SIM group id already exists: ${normalized.id}`);
      groups.push(normalized);
      persist();
      render();
      dispatch("shynetyme:led-sim-group-create", { group: clone(normalized), simId });
      return clone(normalized);
    }

    function updateGroup(groupId, patch = {}) {
      const index = findIndex(groupId);
      if (index < 0) throw new Error(`LED SIM group not found: ${groupId}`);
      const existing = groups[index];
      const incoming = clone(patch);
      groups[index] = reconcileGroup(normalizeGroup({
        ...existing,
        ...incoming,
        id: existing.id,
        shared: { ...existing.shared, ...(incoming.shared || {}) },
        overrides: incoming.overrides ? { ...existing.overrides, ...incoming.overrides } : existing.overrides,
        meta: { ...existing.meta, ...(incoming.meta || {}) }
      }, index));
      persist();
      reconcileActiveTarget();
      render();
      dispatch("shynetyme:led-sim-group-update", { group: clone(groups[index]), target: shellApi.getActiveTarget(), simId });
      return clone(groups[index]);
    }

    function removeGroup(groupId) {
      const index = findIndex(groupId);
      if (index < 0) return false;
      const removed = groups.splice(index, 1)[0];
      persist();
      const target = shellApi.getActiveTarget?.() || shellApi.state.getTarget();
      if (target?.type === "group" && target.id === String(groupId)) shellApi.clearTarget?.();
      render();
      dispatch("shynetyme:led-sim-group-remove", { group: clone(removed), simId });
      return true;
    }

    function setMemberOverride(groupId, deviceId, patch = {}) {
      const index = findIndex(groupId);
      if (index < 0) throw new Error(`LED SIM group not found: ${groupId}`);
      if (!groups[index].memberIds.includes(String(deviceId))) throw new Error(`Device is not a member of group: ${deviceId}`);
      const next = normalizeOverride({ ...(groups[index].overrides[deviceId] || {}), ...clone(patch) });
      if (Object.keys(next).length) groups[index].overrides[deviceId] = next;
      else delete groups[index].overrides[deviceId];
      persist();
      reconcileActiveTarget();
      render();
      dispatch("shynetyme:led-sim-group-override-change", {
        groupId: groups[index].id, deviceId: String(deviceId), override: clone(next), effective: effectiveMemberSettings(groups[index], String(deviceId)), simId
      });
      return clone(next);
    }

    function clearMemberOverride(groupId, deviceId) {
      const index = findIndex(groupId);
      if (index < 0) return false;
      const existed = Boolean(groups[index].overrides[deviceId]);
      delete groups[index].overrides[deviceId];
      persist();
      reconcileActiveTarget();
      render();
      return existed;
    }

    function applyGroupEffect(groupId, settings, effectLabel = null) {
      const index = findIndex(groupId);
      if (index < 0) throw new Error(`LED SIM group not found: ${groupId}`);
      const group = groups[index];
      const nextSettings = settings && typeof settings === "object" ? clone(settings) : {};
      const label = text(effectLabel, presetApi?.getPreset?.(nextSettings.effect)?.label || nextSettings.effect || "Effect");
      group.shared.effectSettings = nextSettings;
      group.shared.currentEffect = label;

      const effectiveMembers = group.memberIds.map((deviceId) => {
        const effective = effectiveMemberSettings(group, deviceId);
        const device = devicesApi.getDevice(deviceId);
        if (device && devicesApi.updateDevice) {
          const effectiveLabel = presetApi?.getPreset?.(effective.effect)?.label || effective.effect || label;
          devicesApi.updateDevice(deviceId, {
            currentEffect: effectiveLabel,
            meta: {
              activeGroupId: group.id,
              activeGroupLabel: group.label,
              groupEffectSettings: clone(effective)
            }
          });
        }
        return { deviceId, settings: effective };
      });

      groups[index] = normalizeGroup(group, index);
      persist();
      reconcileActiveTarget();
      render();
      dispatch("shynetyme:led-sim-group-effect-apply", {
        group: clone(groups[index]), effectiveMembers: clone(effectiveMembers), target: shellApi.getActiveTarget(), simId
      });
      return { group: clone(groups[index]), effectiveMembers };
    }

    createButton.addEventListener("click", () => openEditor());
    emptyCreate.addEventListener("click", () => openEditor());
    closeButton.addEventListener("click", closeEditor);
    cancelButton.addEventListener("click", closeEditor);
    overlay.addEventListener("click", (event) => { if (event.target === overlay) closeEditor(); });
    document.addEventListener("keydown", (event) => { if (!overlay.hidden && event.key === "Escape") closeEditor(); });

    const unsubscribeState = shellApi.state.subscribe(() => render(), { immediate: false });
    function handleDevicesChange() {
      reconcileGroups();
      render();
    }
    window.addEventListener("shynetyme:led-sim-devices-change", handleDevicesChange);

    const api = Object.freeze({
      version: MODULE_VERSION,
      root: view,
      getGroups() { return clone(groups); },
      getGroup,
      setGroups,
      addGroup,
      updateGroup,
      removeGroup,
      selectGroup,
      openEditor,
      closeEditor,
      reconcileActiveTarget,
      setMemberOverride,
      clearMemberOverride,
      getMemberOverride(groupId, deviceId) {
        return clone(groups[findIndex(groupId)]?.overrides?.[deviceId] || {});
      },
      getEffectiveMemberSettings(groupId, deviceId) {
        const group = groups[findIndex(groupId)];
        return group ? effectiveMemberSettings(group, String(deviceId)) : null;
      },
      applyGroupEffect,
      targetFromGroup(groupId) {
        const group = groups[findIndex(groupId)];
        return group ? targetFromGroup(group, devicesApi) : null;
      },
      destroy() {
        unsubscribeState();
        window.removeEventListener("shynetyme:led-sim-devices-change", handleDevicesChange);
        overlay.remove();
        slot.replaceChildren();
      }
    });

    hydrate();
    reconcileGroups();
    render();
    return api;
  }

  window.ShyneTymeLedSimGroups = Object.freeze({
    version: MODULE_VERSION,
    normalizeGroup,
    normalizeOverride,
    targetFromGroup,
    effectiveMemberSettings,
    mountGroupsTab
  });
})();
