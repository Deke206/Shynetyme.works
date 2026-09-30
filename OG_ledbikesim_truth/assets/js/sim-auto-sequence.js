(() => {
  "use strict";

  if (window.ShynetymeAutoSequence?.initialized) return;

  // BEGIN OBJECT: Presets and fixed Auto zones.
  const presets = {
    solid: ["Solid", false, false],
    breathe: ["Breathe", false, true],
    wipe: ["Color Wipe", true, true],
    chase: ["Chase", true, true],
    theater: ["Theater Chase", true, true],
    scanner: ["Scanner Sweep", false, true],
    twinkle: ["Random Twinkle", false, true],
    starlight: ["Star Lights", false, true],
    sections: ["Section Scramble", false, true],
    rainbow: ["Rainbow Palette", true, true]
  };

  const zones = [
    ["left-headlight", "Left headlight", "headlights", 0],
    ["right-headlight", "Right headlight", "headlights", 1],
    ["front-wheel-rim", "Front wheel rim", "rings", 0],
    ["rear-wheel-rim", "Rear wheel rim", "rings", 1],
    ["front-wheel-well", "Front wheel well", "wells", 0],
    ["rear-wheel-well", "Rear wheel well", "wells", 1],
    ["front-underglow", "Front underglow", "underglow", 0],
    ["side-underglow", "Side underglow", "underglow", 2],
    ["rear-underglow", "Rear underglow", "underglow", 1],
    ["rocker-panels", "Rocker panels", "rocker", 0]
  ].map(([id, label, group, index]) => ({ id, label, group, index }));
  // END OBJECT: Presets and fixed Auto zones.

  // BEGIN OBJECT: Simulator state.
  const key = "shynetymeAutoSequenceV1";
  const state = new Map();
  const steps = Array(10).fill(null);
  let selectedStep = 0;
  let activeZone = "";
  let timer = 0;

  const defaults = (index) => ({
    enabled: false,
    effect: "solid",
    direction: 1,
    colorA: ["#35e7ff", "#ff3bd4", "#ff8a3d", "#55e6b5"][index % 4],
    colorB: ["#9b7cff", "#31e6ff", "#ffe76a", "#31e6ff"][index % 4],
    brightness: 92,
    speed: 55
  });

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const get = (id) => {
    if (!state.has(id)) state.set(id, defaults(zones.findIndex((z) => z.id === id)));
    return state.get(id);
  };
  const snapshot = () => ({ zones: Object.fromEntries(zones.map((z) => [z.id, clone(get(z.id))])) });

  function save() {
    try {
      sessionStorage.setItem(key, JSON.stringify({
        version: 1,
        selectedStep,
        current: snapshot(),
        steps
      }));
    } catch (error) {
      console.warn("Auto sequence storage is unavailable.", error);
    }
  }

  function load() {
    try {
      const data = JSON.parse(sessionStorage.getItem(key));
      if (data?.version !== 1) return false;
      Object.entries(data.current?.zones || {}).forEach(([id, value]) => state.set(id, value));
      (data.steps || []).slice(0, 10).forEach((step, index) => { steps[index] = step; });
      selectedStep = Math.max(0, Math.min(9, Number(data.selectedStep) || 0));
      return true;
    } catch {
      return false;
    }
  }
  // END OBJECT: Simulator state.

  // BEGIN OBJECT: Fixed SVG mapping and visual effects.
  function mapVectors() {
    document.getElementById("stage")?.removeAttribute("data-mode");
    document.querySelectorAll(".auto-zone").forEach((group) => {
      group.classList.remove("is-off");
      group.classList.add("is-on");
    });

    zones.forEach((zone) => {
      const lines = document.querySelectorAll(`.auto-zone[data-zone="${zone.group}"] .led-line`);
      const line = lines[zone.index];
      if (line) {
        line.classList.add("auto-logical-led");
        line.dataset.autoLogicalZone = zone.id;
      }
    });
  }

  function speedDuration(speed) {
    return `${Math.max(.45, 3.2 - (speed / 100 * 2.65)).toFixed(2)}s`;
  }

  function renderVectors() {
    zones.forEach((zone) => {
      const value = get(zone.id);
      document.querySelectorAll(`[data-auto-logical-zone="${zone.id}"]`).forEach((line) => {
        line.dataset.effect = value.effect;
        line.style.setProperty("--za", value.colorA);
        line.style.setProperty("--zb", value.colorB);
        line.style.setProperty("--zbright", value.brightness / 100);
        line.style.setProperty("--zon", value.enabled ? 1 : 0);
        line.style.setProperty("--zspeed", speedDuration(value.speed));
        line.style.setProperty("--zdir", value.direction < 0 ? "reverse" : "normal");
      });
    });
  }
  // END OBJECT: Fixed SVG mapping and visual effects.

  // BEGIN OBJECT: Home-style area controls.
  function buildButtons() {
    const host = document.getElementById("controls");
    if (!host) return;
    host.className = "auto-zone-button-grid";
    host.innerHTML = zones.map((zone, index) => `
      <button type="button" class="auto-home-zone-button" data-auto-zone="${zone.id}" aria-pressed="false">
        <b>${index + 1}</b><span><strong>${zone.label}</strong><small>Open LED preset</small></span>
      </button>
    `).join("");
  }

  function buildDialog() {
    const dialog = document.createElement("dialog");
    dialog.id = "autoZoneDialog";
    dialog.className = "auto-zone-dialog";
    dialog.innerHTML = `
      <form id="autoZoneForm">
        <header><span><small>Auto LED area</small><h2 id="autoZoneTitle"></h2></span><button type="button" id="autoZoneClose">×</button></header>
        <main>
          <label class="check"><input id="autoZoneEnabled" type="checkbox"> Include this LED area</label>
          <label>Effect preset<select id="autoZoneEffect">${Object.entries(presets).map(([id, p]) => `<option value="${id}">${p[0]}</option>`).join("")}</select></label>
          <label id="autoDirectionWrap">Direction<select id="autoZoneDirection"><option value="1">Forward</option><option value="-1">Reverse</option></select></label>
          <div class="colors"><label>Primary<input id="autoColorA" type="color"></label><label>Second<input id="autoColorB" type="color"></label></div>
          <label>Brightness <output id="autoBrightOut"></output><input id="autoBrightness" type="range" min="10" max="100"></label>
          <label id="autoSpeedWrap">Speed <output id="autoSpeedOut"></output><input id="autoSpeed" type="range" min="1" max="100"></label>
        </main>
        <footer><button type="button" id="autoZoneCancel">Cancel</button><button type="button" id="autoZoneOff">Turn area off</button><button class="primary" type="submit">Apply preset</button></footer>
      </form>`;
    document.body.appendChild(dialog);
  }

  const fields = () => ({
    dialog: document.getElementById("autoZoneDialog"),
    title: document.getElementById("autoZoneTitle"),
    enabled: document.getElementById("autoZoneEnabled"),
    effect: document.getElementById("autoZoneEffect"),
    direction: document.getElementById("autoZoneDirection"),
    directionWrap: document.getElementById("autoDirectionWrap"),
    colorA: document.getElementById("autoColorA"),
    colorB: document.getElementById("autoColorB"),
    brightness: document.getElementById("autoBrightness"),
    brightOut: document.getElementById("autoBrightOut"),
    speed: document.getElementById("autoSpeed"),
    speedOut: document.getElementById("autoSpeedOut"),
    speedWrap: document.getElementById("autoSpeedWrap")
  });

  function dialogVisibility() {
    const f = fields();
    const preset = presets[f.effect.value];
    f.directionWrap.hidden = !preset[1];
    f.speedWrap.hidden = !preset[2];
    f.brightOut.textContent = `${f.brightness.value}%`;
    f.speedOut.textContent = f.speed.value;
  }

  function openDialog(id) {
    const zone = zones.find((item) => item.id === id);
    if (!zone) return;
    activeZone = id;
    const value = get(id);
    const f = fields();
    f.title.textContent = zone.label;
    f.enabled.checked = value.enabled;
    f.effect.value = value.effect;
    f.direction.value = value.direction;
    f.colorA.value = value.colorA;
    f.colorB.value = value.colorB;
    f.brightness.value = value.brightness;
    f.speed.value = value.speed;
    dialogVisibility();
    f.dialog.showModal?.() || f.dialog.setAttribute("open", "");
  }

  function closeDialog() {
    const dialog = fields().dialog;
    dialog.close?.() || dialog.removeAttribute("open");
    activeZone = "";
  }

  function bindDialog() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-auto-zone]");
      if (button) openDialog(button.dataset.autoZone);
    });

    ["autoZoneEffect", "autoZoneDirection", "autoColorA", "autoColorB", "autoBrightness", "autoSpeed"]
      .forEach((id) => document.getElementById(id).addEventListener("input", dialogVisibility));

    document.getElementById("autoZoneClose").onclick = closeDialog;
    document.getElementById("autoZoneCancel").onclick = closeDialog;
    document.getElementById("autoZoneOff").onclick = () => {
      if (activeZone) get(activeZone).enabled = false;
      render();
      closeDialog();
    };

    document.getElementById("autoZoneForm").onsubmit = (event) => {
      event.preventDefault();
      if (!activeZone) return;
      const f = fields();
      const preset = presets[f.effect.value];
      state.set(activeZone, {
        enabled: f.enabled.checked,
        effect: f.effect.value,
        direction: preset[1] ? Number(f.direction.value) : 1,
        colorA: f.colorA.value,
        colorB: f.colorB.value,
        brightness: Number(f.brightness.value),
        speed: preset[2] ? Number(f.speed.value) : 55
      });
      render();
      closeDialog();
    };
  }
  // END OBJECT: Home-style area controls.

  // BEGIN OBJECT: Ten-step sequence controller.
  function buildSequence() {
    const summary = document.getElementById("summary");
    const panel = summary?.closest("aside");
    if (!panel) return;

    panel.querySelectorAll(".control,.estimate,#review,#save").forEach((item) => { item.hidden = true; });
    const heading = panel.querySelector("h2");
    if (heading) heading.innerHTML = '<span id="count">0</span> / 10 selected';

    const section = document.createElement("section");
    section.className = "auto-sequence-panel";
    section.innerHTML = `
      <header><span><small>Ten-step controller</small><h2>Build sequence</h2></span><em id="sequenceStatus">Ready</em></header>
      <div id="sequenceSteps" class="sequence-steps"></div>
      <div class="sequence-edit"><button id="stepLoad">Load</button><button id="stepSave">Save current</button><button id="stepClear">Clear</button></div>
      <div class="sequence-options"><label>Seconds<input id="stepDuration" type="number" min="1" max="30" value="3"></label><label><input id="stepLoop" type="checkbox"> Loop</label><label><input id="stepShuffle" type="checkbox"> Shuffle</label><label><input id="stepAutoplay" type="checkbox"> Auto play</label></div>
      <div class="sequence-play"><button class="primary" id="sequencePlay">▶ Play sequence</button><button id="sequenceStop">■ Stop</button></div>
      <button class="request" id="autoRequest">Request this installation</button>`;
    panel.appendChild(section);

    const demo = document.getElementById("demo");
    if (demo) demo.hidden = true;
    const reset = document.getElementById("reset");
    if (reset) reset.classList.add("compact-reset");
  }

  function renderSteps() {
    const host = document.getElementById("sequenceSteps");
    if (!host) return;
    host.innerHTML = steps.map((step, index) => `<button data-step="${index}" class="${index === selectedStep ? "active" : ""} ${step ? "saved" : ""}"><b>${index + 1}</b><small>${step ? "Saved" : "Empty"}</small></button>`).join("");
  }

  function applyStep(step) {
    if (!step?.zones) return;
    Object.entries(step.zones).forEach(([id, value]) => state.set(id, clone(value)));
    render();
  }

  function seedSteps() {
    const effectNames = Object.keys(presets);
    const colorPairs = [["#35e7ff", "#9b7cff"], ["#ff3bd4", "#31e6ff"], ["#ff4a4a", "#ffb347"], ["#55e6b5", "#31e6ff"]];
    steps.forEach((step, stepIndex) => {
      if (step) return;
      const data = snapshot();
      zones.forEach((zone, zoneIndex) => {
        const value = data.zones[zone.id];
        const pair = colorPairs[(zoneIndex + stepIndex) % colorPairs.length];
        value.enabled = true;
        value.effect = effectNames[(zoneIndex + stepIndex) % effectNames.length];
        value.direction = (zoneIndex + stepIndex) % 2 ? -1 : 1;
        value.colorA = pair[0]; value.colorB = pair[1];
        value.brightness = 80 + ((zoneIndex + stepIndex) % 3) * 10;
        value.speed = 35 + ((zoneIndex * 9 + stepIndex * 7) % 60);
      });
      steps[stepIndex] = data;
    });
  }

  function stop(message = "Stopped") {
    clearTimeout(timer);
    timer = 0;
    const status = document.getElementById("sequenceStatus");
    if (status) status.textContent = message;
  }

  function play(index) {
    const saved = steps.map((step, i) => step ? i : -1).filter((i) => i >= 0);
    if (!saved.length) { seedSteps(); renderSteps(); }
    const available = steps.map((step, i) => step ? i : -1).filter((i) => i >= 0);
    const current = available.includes(index) ? index : available[0];
    selectedStep = current;
    applyStep(steps[current]);
    renderSteps();
    document.getElementById("sequenceStatus").textContent = `Playing ${current + 1}`;
    const seconds = Math.max(1, Math.min(30, Number(document.getElementById("stepDuration").value) || 3));
    timer = setTimeout(() => {
      const shuffle = document.getElementById("stepShuffle").checked;
      let next = shuffle ? available[Math.floor(Math.random() * available.length)] : available[available.indexOf(current) + 1];
      if (next === undefined && document.getElementById("stepLoop").checked) next = available[0];
      next === undefined ? stop("Sequence complete") : play(next);
    }, seconds * 1000);
  }

  function bindSequence() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-step]");
      if (button) { selectedStep = Number(button.dataset.step); renderSteps(); save(); }
    });
    document.getElementById("stepSave").onclick = () => { steps[selectedStep] = snapshot(); renderSteps(); render(); };
    document.getElementById("stepLoad").onclick = () => applyStep(steps[selectedStep]);
    document.getElementById("stepClear").onclick = () => { steps[selectedStep] = null; render(); };
    document.getElementById("sequencePlay").onclick = () => play(selectedStep);
    document.getElementById("sequenceStop").onclick = () => stop();
    document.getElementById("stepAutoplay").onchange = (event) => event.target.checked ? play(selectedStep) : stop();

    const oldReset = document.getElementById("reset");
    if (oldReset) {
      const reset = oldReset.cloneNode(true);
      oldReset.replaceWith(reset);
      reset.onclick = () => {
        stop("Ready"); state.clear(); steps.fill(null); selectedStep = 0;
        zones.forEach((zone, i) => state.set(zone.id, defaults(i)));
        sessionStorage.removeItem(key); render();
      };
    }
  }
  // END OBJECT: Ten-step sequence controller.

  // BEGIN OBJECT: Summary and contact handoff.
  function renderSummary() {
    const selected = zones.filter((zone) => get(zone.id).enabled);
    const count = document.getElementById("count");
    if (count) count.textContent = selected.length;
    const summary = document.getElementById("summary");
    if (summary) summary.innerHTML = selected.length ? selected.map((zone) => `<div class="sumrow"><span>${zone.label}</span><small>${presets[get(zone.id).effect][0]}</small></div>`).join("") : "<p>No LED areas selected.</p>";
  }

  function bindRequest() {
    document.getElementById("autoRequest").onclick = () => {
      const selectedZones = zones.filter((zone) => get(zone.id).enabled).map((zone) => ({ label: zone.label, ...get(zone.id), effectLabel: presets[get(zone.id).effect][0] }));
      const payload = { version: 1, simulator: "auto", vehicle: "Four-door sedan", selectedZones, sequenceSteps: steps };
      sessionStorage.setItem("shynetymeSimAutoSelections", JSON.stringify(payload));
      localStorage.setItem("shynetymeContactDraft", JSON.stringify({ source: "auto-sim", projectType: "Automobile LED installation", message: selectedZones.map((zone) => `${zone.label}: ${zone.effectLabel}`).join("\n") }));
      location.href = "contact.html?source=sim-auto#contact-request";
    };
  }
  // END OBJECT: Summary and contact handoff.

  function render() {
    renderVectors();
    document.querySelectorAll("[data-auto-zone]").forEach((button) => {
      const value = get(button.dataset.autoZone);
      button.setAttribute("aria-pressed", value.enabled);
      button.querySelector("small").textContent = value.enabled ? `${presets[value.effect][0]} - ${value.brightness}%` : "Open LED preset";
    });
    renderSummary(); renderSteps(); save();
  }

  // BEGIN OBJECT: Initialization.
  function initialize() {
    mapVectors(); buildButtons(); buildDialog(); buildSequence(); bindDialog(); bindSequence(); bindRequest();
    zones.forEach((zone, index) => state.set(zone.id, defaults(index)));
    if (!load()) seedSteps();
    render();
    window.ShynetymeAutoSequence = { initialized: true, zones, presets, state, steps, play, stop, openDialog };
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", initialize, { once: true })
    : initialize();
  // END OBJECT: Initialization.
})();
