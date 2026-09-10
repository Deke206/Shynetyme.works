import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (name) => fs.readFileSync(path.join(root, "tools", name), "utf8");
const html = read("st-ble-ui-preview.html");
const ui = read("st-ble-ui.js");
const core = read("st-ble-core.js");
const errors = [];
const need = (src, text, label) => { if (!src.includes(text)) errors.push(`MISSING: ${label} (${JSON.stringify(text)})`); };
const forbid = (src, text, label) => { if (src.includes(text)) errors.push(`FORBIDDEN: ${label} (${JSON.stringify(text)})`); };
const count = (src, text) => src.split(text).length - 1;

need(html, 'src="st-ble-core.js?', "canonical BLE core");
need(html, 'src="st-ble-ui.js?', "canonical UI");
for (const retired of ["st-ble-live.js","st-ble-bgfix.js","st-ble-playlist.js","st-ble-hotfix.js","st-ble-uuidfix.js"]) forbid(html, retired, `retired runtime ${retired}`);
for (const src of [html, ui, core]) {
  forbid(src, "document.write(", "dynamic controller loader");
  forbid(src, "cloneNode(", "control cloning override");
  forbid(src, 'addEventListener("focus"', "focus-driven BLE");
  forbid(src, 'addEventListener("pageshow"', "pageshow-driven BLE");
}

forbid(html, 'data-page="music"', "Music tab");
forbid(html, 'id="micToggle"', "microphone control");
forbid(ui, "MUSIC_EFFECTS", "web Music implementation");
forbid(ui, '"GRADIENT"', "gradient effect");
for (const v52Only of ["ANDROID","FIRE_2012","PACMAN","PLASMA","PS_COMET","CANDLE_MULTI","STROBE_MEGA"]) forbid(ui, `"${v52Only}"`, `V5.2-only catalog effect ${v52Only}`);
need(ui, '"SOLID"', "SOLID firmware effect restored");
need(ui, 'WIPE: "STACK (WIPE)"', "verified stack label mapped to WIPE");

need(html, 'id="shufflePlaylist"', "sequence shuffle");
need(html, 'id="playlistStatus"', "sequence status");
need(html, '<div class="context-title">SEQUENCE</div>', "Sequence title");
forbid(html, 'id="playlistName"', "obsolete playlist name field");
need(ui, "durationSec", "per-item sequence duration");
need(ui, "SHUFFLE_KEY", "persistent shuffle mode");
need(ui, "PLAYLIST_RUN_KEY", "persistent sequence play intent");
need(ui, "PLAYLIST_POS_KEY", "persistent sequence position");
need(ui, "choosePlaylistIndex", "sequence runner");

need(ui, 'bri:"BRI"', "global brightness to BRI");
need(ui, 'int:"BGB"', "background brightness to BGB");
need(ui, "`BRI=${s.bri", "saved BRI");
need(ui, "`BGB=${s.bgb", "saved BGB");
need(ui, "saved-color-delete", "saved-color delete");
need(ui, "FX_CAPS", "effect color-role metadata");
need(html, 'id="bgbRow"', "background-brightness row");

forbid(html, "sim-slider", "old draggable styling slider");
if (count(html, 'class="step-btn"') !== 12) errors.push(`EXPECTED 12 step buttons, found ${count(html, 'class="step-btn"')}`);
if (count(html, 'data-step-value') !== 6) errors.push(`EXPECTED 6 styling values, found ${count(html, 'data-step-value')}`);
need(ui, 'qa(".step-btn")', "step-button controller");
need(ui, 'Number(button.dataset.delta', "one-unit step calculation");
need(html, '<div class="more-style">', "always-visible density/trail area");
forbid(html, '<details class="more-style">', "collapsed MORE styling controls");

need(ui, 'hueSelector.setPointerCapture', "finger-captured hue interaction");
need(ui, 'addEventListener("pointermove"', "continuous hue pointer tracking");
need(ui, 'style.setProperty("--hx"', "visible hue position tracking");
need(html, '.hue-selector.dragging .hue-spectrum', "dark-to-live hue illumination");

need(core, "active.length !== requested.length", "all requested group devices must be connected");
need(core, "result.every(Boolean)", "all group writes must succeed");
need(core, 'target = { type: "group", id };', "group target selection");

if (errors.length) {
  console.error("STBLE regression gate FAILED:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log("STBLE regression gate PASS");
console.log("Verified: canonical two-script runtime, sync1 group fan-out, V5.1 direct effects, SOLID + STACK(WIPE), factual color roles, BGB, borderless step controls, finger-tracked hue, saved-color delete, sequence duration + shuffle + persistent play intent, Music/gradient absent, no injected override patterns.");
