# STBLE Controller Agent Rules

These rules apply to `tools/st-ble-*` and override generic repo guidance where more specific.

## Source of truth

The only active controller source is `main` and these canonical files:

- `tools/st-ble-ui-preview.html`
- `tools/st-ble-ui.css`
- `tools/st-ble-core.js`
- `tools/st-ble-ui.js`
- `tools/STBLE_FIRMWARE_CONTRACT.md`
- `tools/stble-regression-check.mjs`

Do not use, copy from, merge from, or restore any old branch, recovery page, picker snapshot, hotfix file, prior iteration file, or historical controller unless the user explicitly orders a rollback to that exact source.

Historical builds belong in the user's Google Drive archive `ESP32. Work/WebApp Debug`, not in the active runtime tree.

## Hardware / firmware baseline

Current physical-controller baseline: `ST_BT_V5_1_MAIN.ino`, status `VER=51`.

Treat V5.1 as the firmware actually in use unless the user explicitly flashes a newer sketch and that new version is verified from device status or serial output.

V5.1 has the direct effect engine and the verified BLE/state commands documented in `STBLE_FIRMWARE_CONTRACT.md`. It does **not** have the later V5.2 WLED-style catalog layer.

`ST_BT_V5_2_MAIN.ino` is a later development artifact. Its catalog-only effects (for example `ANDROID`, `FIRE_2012`, `PACMAN`, `PLASMA`, `PS_COMET`) must not be exposed as normal active effects on the V5.1 hardware baseline. Do not promote V5.2 assumptions merely because the source file exists.

Web/mobile CSS or HTML fixes do not change the ESP32 firmware baseline.

## Iteration lifecycle

Use exactly this lifecycle for one debugging objective:

1. Iteration 1 starts from the current accepted baseline on `main`.
2. Iteration 2 starts only from Iteration 1.
3. Iteration 3 starts only from Iteration 2.
4. Do not create Iteration 4.
5. When an iteration is accepted, it becomes the only forward source.
6. When Iteration 3 is accepted, promote that exact build as the new baseline and remove/retire prior iteration artifacts from the repository. Git history and the Drive WebApp Debug archive preserve history.
7. Never jump backward to an older snapshot to solve a new defect unless the user explicitly orders that rollback.

A regression never authorizes silently restoring old code. Diagnose the current iteration first.

## Current active build

The current active web controller is Iteration 2 on `main` at `tools/st-ble-ui-preview.html`.

Accepted behavior that must survive every edit:

- Dual-device/group sync from the verified sync baseline.
- A group with two or more checked members becomes the active target.
- Group send succeeds only if every requested connected member succeeds.
- Bluetooth actions are explicit/user-driven; no startup auto-connect.
- Bluetooth picker is restricted to devices advertising the ShyneTyme service UUID.
- Visible Bluetooth controls are ADD BLUETOOTH and FORGET only; do not restore ASSIGN or RECONNECT.
- While a manual Bluetooth chooser/GATT connection is in progress, ordinary effect/control sends are paused.
- MUSIC UI/web microphone/music effects remain removed until a separately proven/native audio path exists.
- SOLID is restored and must remain available; GRADIENT remains excluded unless explicitly requested.
- V5.1 direct effects are the active effect source. V5.2 catalog effects remain unavailable unless newer firmware is explicitly flashed and verified.
- WIPE is displayed as `STACK (WIPE)` because the verified V5.1 renderer advances the fill one LED at a time; the transmitted firmware ID remains `WIPE`.
- Do not invent DOMINO, LIGHTSABER, LIGHT TUBE, or other effect names unless an exact supported implementation is verified.
- Effect labels use verified V5.1 firmware color roles.
- Background brightness maps to firmware `BGB` and is shown only for effects that actually use the background role.
- Saved custom colors are deletable.
- Small/internal controls remain borderless; major section containers may retain framing.
- Effect Styling uses borderless minus/level/plus step controls, one firmware unit per tap; do not restore draggable styling sliders unless explicitly requested.
- DENSITY, TRAIL, DIRECTION, and MIRROR remain visible rather than hidden under MORE.
- Hue interaction stays dark at rest, lights under the finger, tracks continuously while dragging, and commits the selected role color.
- The Custom page presents the feature as `SEQUENCE`; no `My Light Sequence` name field.
- Sequence preserves per-item TIME SEC, ordered loop, SHUFFLE, STOP-holds-current-effect, browser-persistent play intent, and browser-persistent position.
- V5.1 has no firmware sequence scheduler. Never claim the ESP32 itself continues sequence timing after Chrome is frozen/closed. Browser timing remains foreground-dependent until firmware or native-app scheduling is added.

## Single-owner rule

- BLE transport/device/group state: `st-ble-core.js`
- UI/effects/colors/presets/sequence: `st-ble-ui.js`
- Markup: `st-ble-ui-preview.html`
- Styling: `st-ble-ui.css` or deliberately scoped static CSS in the canonical HTML

Fix the owning file. Do not neutralize one file from another.

Do not add runtime patch loaders, injected hotfix scripts, cloned controls, duplicate feature owners, or extra controller entry points.

## Verification rule — three fingers

For protocol/effect/transport claims verify, when available:

1. Current project code or exact firmware.
2. Authoritative API/spec/manufacturer documentation.
3. Independent implementation, second reference, CI result, or direct runtime observation.

If evidence does not establish the claim, mark it UNKNOWN. Never convert code review into a claim that physical LEDs were tested.

## Required workflow

1. Read this file and the current canonical files before editing.
2. Confirm the current iteration and do not source code from any older iteration.
3. State the accepted behaviors that must survive.
4. Compare BLE/effect commands with `ST_BT_V5_1_MAIN.ino` / the V5.1 firmware contract.
5. Do not use V5.2-only catalog behavior unless the user has explicitly flashed V5.2 and device status verifies it.
6. Make the smallest complete change in the owning canonical file.
7. Run JavaScript syntax checking on changed JS.
8. Run `node tools/stble-regression-check.mjs`.
9. Inspect the diff for duplicate owners, injected patches, lost controls, stale script references, and cache-tag mistakes.
10. Verify the GitHub Actions result when available.
11. Report TESTED/VERIFIED only for checks actually run. Physical device behavior remains user-tested until direct hardware instrumentation exists.

## Forbidden patterns

Do not introduce:

- `cloneNode()` as a feature override strategy.
- dynamically injected controller `<script>` tags or runtime style patches.
- `document.write()` controller loaders.
- reconnect logic tied to `focus`, `pageshow`, or visibility changes.
- a new `st-ble-*-fix.js`, `hotfix.js`, `patch.js`, recovery controller, picker snapshot, or alternate runtime entry page.
- ASSIGN/RECONNECT UI in the current Bluetooth workflow unless explicitly requested.
- `acceptAllDevices: true` for the ShyneTyme picker while the firmware advertises the verified service UUID.
- unconditional success when only one requested group member succeeds.
- reintroduction of removed Music/gradient behavior without explicit user direction.
- V5.2-only catalog effects on the V5.1 hardware baseline.
- invented effect names that do not map to a verified V5.1 firmware ID.
- use of any non-main branch as a source for current work without explicit user rollback instruction.
