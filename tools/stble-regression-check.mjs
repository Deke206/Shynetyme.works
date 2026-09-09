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
forbid(ui, '"SOLID"', "SOLID effect");
forbid(ui, '"GRADIENT"', "gradient effect");

need(html, 'id="shufflePlaylist"', "playlist shuffle");
need(html, 'id="playlistStatus"', "playlist status");
need(ui, "durationSec", "per-item playlist duration");
need(ui, "SHUFFLE_KEY", "persistent shuffle mode");
need(ui, "choosePlaylistIndex", "playlist runner");
need(ui, 'bri:"BRI"', "global brightness to BRI");
need(ui, 'int:"BGB"', "background brightness to BGB");
need(ui, "`BRI=${s.bri", "saved BRI");
need(ui, "`BGB=${s.bgb", "saved BGB");
need(ui, "saved-color-delete", "saved-color delete");
need(ui, "FX_CAPS", "effect color-role metadata");
need(html, 'id="bgbRow"', "background-brightness row");

need(core, "active.length !== requested.length", "all requested group devices must be connected");
need(core, "result.every(Boolean)", "all group writes must succeed");
need(core, 'target = { type: "group", id };', "group target selection");

if (errors.length) {
  console.error("STBLE regression gate FAILED:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log("STBLE regression gate PASS");
console.log("Verified: canonical two-script runtime, sync1 group fan-out, factual effect roles, BGB, saved-color delete, playlist duration + shuffle, Music/SOLID/gradient removed, no injected override patterns.");
