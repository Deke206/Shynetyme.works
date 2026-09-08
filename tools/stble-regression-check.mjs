import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (name) => fs.readFileSync(path.join(root, "tools", name), "utf8");
const html = read("st-ble-ui-preview.html");
const ui = read("st-ble-ui.js");
const core = read("st-ble-core.js");
const errors = [];

function requireText(source, text, label) {
  if (!source.includes(text)) errors.push(`MISSING: ${label} (${JSON.stringify(text)})`);
}
function forbidText(source, text, label) {
  if (source.includes(text)) errors.push(`FORBIDDEN: ${label} (${JSON.stringify(text)})`);
}

// Canonical dependency chain: no runtime patch stack.
requireText(html, 'src="st-ble-core.js?', "canonical BLE core script");
requireText(html, 'src="st-ble-ui.js?', "canonical UI script");
for (const retired of ["st-ble-live.js", "st-ble-bgfix.js", "st-ble-playlist.js", "st-ble-hotfix.js", "st-ble-uuidfix.js"]) {
  forbidText(html, retired, `retired runtime script ${retired}`);
}
forbidText(html, "document.write(", "dynamic controller loader");

// Required visible controls and preserved playlist behavior.
requireText(html, 'id="musicFx"', "single Music effect picker");
requireText(html, 'id="micToggle"', "microphone control");
requireText(html, 'id="shufflePlaylist"', "playlist shuffle button");
requireText(html, 'id="playlistStatus"', "playlist status");
requireText(ui, "durationSec", "per-item playlist duration");
requireText(ui, "SHUFFLE_KEY", "persistent shuffle mode");
requireText(ui, "choosePlaylistIndex", "shuffle/ordered playlist runner");

// Music transport must use the compact firmware-supported packet and hardware verification.
requireText(ui, "pendingAudio=`A=", "compact A= audio packet");
requireText(ui, "status.ARX", "ESP32 audio receive counter verification");
requireText(ui, "status.AUDLIVE", "ESP32 audio-live verification");
requireText(ui, '"SPECTRUM"', "Spectrum music effect");
forbidText(ui, 'packet = "F="', "legacy long FFT packet transport");
forbidText(ui, 'packet="F="', "legacy long FFT packet transport");

// Music effects must not be duplicated into the normal FX list.
const fxStart = ui.indexOf("const FX_EFFECTS");
const musicStart = ui.indexOf("const MUSIC_EFFECTS");
if (fxStart < 0 || musicStart < 0 || musicStart <= fxStart) {
  errors.push("INVALID: FX_EFFECTS/MUSIC_EFFECTS declarations not found in expected order");
} else {
  const normalFxBlock = ui.slice(fxStart, musicStart);
  for (const musicFx of ["SPECTRUM", "VU", "AUDIO_PULSE", "BEAT_FLASH", "SONIC_STREAM", "SONIC_BOOM", "RIPPLE", "STARBURST", "POPCORN", "DRIPDROP", "HEARTBEAT"]) {
    if (normalFxBlock.includes(`\"${musicFx}\"`)) errors.push(`DUPLICATE: Music effect ${musicFx} appears in FX_EFFECTS`);
  }
}

// No normal implementation by monkey-patching DOM controls or page lifecycle reconnect hacks.
for (const source of [ui, core]) {
  forbidText(source, "cloneNode(", "control cloning/override strategy");
  forbidText(source, 'addEventListener("focus"', "focus-driven BLE behavior");
  forbidText(source, 'addEventListener("pageshow"', "pageshow-driven BLE behavior");
  forbidText(source, "document.write(", "dynamic boot injection");
}

// Command semantics that must stay consistent across live/saved state.
requireText(ui, 'bri: "BRI"', "global brightness maps to BRI");
requireText(ui, 'int: "BGB"', "background brightness maps to BGB");
requireText(ui, "`BRI=${s.bri", "saved state contains BRI");
requireText(ui, "`BGB=${s.bgb", "saved state contains BGB");

if (errors.length) {
  console.error("STBLE regression gate FAILED:\n- " + errors.join("\n- "));
  process.exit(1);
}

console.log("STBLE regression gate PASS");
console.log("Verified: canonical two-script runtime, Music-only audio effects, compact A= transport, ARX/AUDLIVE verification, playlist duration + shuffle, no injected override patterns.");