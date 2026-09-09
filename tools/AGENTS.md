# STBLE Controller Agent Rules

These rules apply to `tools/st-ble-*` and override generic repo guidance where more specific.

## Canonical runtime

The active web controller is exactly:

- `tools/st-ble-ui-preview.html`
- `tools/st-ble-ui.css`
- `tools/st-ble-core.js`
- `tools/st-ble-ui.js`
- `tools/STBLE_FIRMWARE_CONTRACT.md`

The exact V5.2 INO kept in the user's ESP32 Work / WebApp Debug archive is firmware ground truth when available. Do not invent firmware capabilities from UI code.

Do not add runtime patch loaders, injected hotfix scripts, cloned controls, or secondary feature owners.

## Three-iteration rule

For one debugging objective, use at most three controlled iterations: Iteration 1, Iteration 2, Iteration 3. Each iteration preserves all previously accepted behavior unless the user explicitly removes it. When the user approves/STOPs an iteration, promote that exact build as the new baseline. Do not create Iteration 4; diagnose within Iteration 3 or return to the last verified baseline.

## Current accepted baseline

- `20260908-sync1` is the proven dual-device/group-sync baseline.
- Dual-device sync logic in `st-ble-core.js` is regression-sensitive. Do not rewrite it for presentation/effect edits.
- When a group has two or more checked members, that group becomes the active target.
- A group send succeeds only when every requested member is connected and every GATT write succeeds.
- Startup Bluetooth autoconnect is disabled; Bluetooth actions remain explicit/user-driven.

## Current Iteration-2 direction

- MUSIC UI and web microphone/music effects are removed until a native/proven audio path is implemented.
- Do not reintroduce Music effects into FX / COLORS as substitutes.
- SOLID and GRADIENT are intentionally excluded from the visible effect list.
- Effect labels must describe verified color roles; never default everything to “3 COLORS” when firmware says otherwise.
- Background brightness maps to firmware `BGB` and is shown only when the selected effect actually uses the background role.
- Saved custom colors must be deletable.
- Small/internal controls are borderless; animated/perimeter framing is reserved for major section containers.
- The old live-state LED preview strip is removed.
- Playlist preserves per-item `TIME SEC`, ordered loop, `SHUFFLE`, and STOP-holds-current-effect.
- Browser playlist timing is a foreground feature; do not claim guaranteed hidden-tab/background execution.

## Single-owner rule

- BLE transport/device/group state: `st-ble-core.js`
- UI state/effects/colors/presets/playlist: `st-ble-ui.js`
- Markup: `st-ble-ui-preview.html`
- Styling: `st-ble-ui.css` or static styles in canonical HTML when deliberately scoped; never runtime-injected styles/scripts.

Fix the owning file. Do not neutralize one file from another.

## Verification rule — three fingers

For protocol/effect claims, verify when available:

1. Current project code/firmware.
2. Authoritative API/spec/manufacturer source.
3. Independent implementation, second reference, or direct runtime observation.

If the evidence does not establish a claim, mark it UNKNOWN instead of guessing.

## Required workflow

1. Read this file and the relevant canonical files before editing.
2. State which accepted behaviors must survive the change.
3. Compare BLE/effect commands against V5.2 firmware or the repo firmware contract.
4. Make the smallest complete edit in the feature owner.
5. Run `node --check` on changed JavaScript.
6. Run `node tools/stble-regression-check.mjs`.
7. Inspect the diff for duplicate owners, patch files, lost controls, and cache-tag mistakes.
8. Report TESTED only for checks actually run. Physical LED behavior remains unverified until device testing confirms it.

## Forbidden patterns

Do not introduce:

- `cloneNode()` as a feature override strategy.
- dynamically injected controller `<script>` tags or style patches.
- `document.write()` controller loaders.
- reconnect logic tied to `focus`, `pageshow`, or visibility changes.
- a new `st-ble-*-fix.js`, `hotfix.js`, `patch.js`, or similar runtime file.
- unconditional success when only one member of a requested group succeeded.
- reintroduction of removed Music/SOLID/gradient behavior without explicit user direction.

Historical files may remain for audit but must not be referenced by canonical HTML.
