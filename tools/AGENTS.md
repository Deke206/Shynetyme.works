# STBLE Controller Agent Rules

These rules apply to `tools/st-ble-*` and override generic repo guidance where more specific.

## Authoritative runtime

Production/debug baseline is exactly:

- `tools/st-ble-ui-preview.html`
- `tools/st-ble-ui.css`
- `tools/st-ble-core.js`
- `tools/st-ble-ui.js`
- `firmware/ST_BT_V5_2_MAIN.ino` for the BLE/firmware command contract

Do not add runtime patch loaders, injected hotfix scripts, cloned controls, or secondary feature owners.

## Three-iteration rule

For one debugging objective, use at most three controlled iterations.

1. Iteration 1
2. Iteration 2
3. Iteration 3

Each iteration must preserve all previously accepted functionality unless the user explicitly removes it. If the user says `STOP`, promote the proven iteration to the canonical baseline. Do not create Iteration 4; diagnose within Iteration 3 or return to the last verified baseline.

Temporary debugging code must be removed or folded into its canonical owner before promotion.

## Regression contract

Every web-controller change must verify all of these before reporting success:

- Bluetooth picker remains user-driven; no picker/reconnect calls on `focus`, `pageshow`, or visibility changes.
- Previously granted BLE device may reconnect only through guarded core logic or an explicit user action.
- FX / COLORS contains non-music effects only.
- MUSIC owns music effects, microphone capture, audio analysis, and audio status UI.
- Selecting MUSIC stops any active playlist and selects a music effect, default `SPECTRUM`.
- Live microphone audio uses the firmware-supported compact `A=LLBBMMHHb` packet unless the firmware contract is deliberately changed and retested.
- A Music UI TX counter may increment only after a successful BLE write.
- Hardware audio success may be claimed only when firmware status proves receipt (`ARX` increases; `AUDLIVE=1`).
- Playlist preserves per-item `TIME SEC` duration.
- Playlist preserves ordered loop and `SHUFFLE` modes.
- `STOP` holds the current effect instead of forcing blackout unless explicitly requested.
- Global brightness maps to `BRI`.
- Background brightness maps to `BGB`.
- Preset/playlist serialization must use the same command meanings as live controls.
- SAVE/STARTUP behavior must apply the selected startup effect before saving it.

## Single-owner rule

A feature has one implementation owner.

- BLE transport/device state: `st-ble-core.js`
- UI state, effects, Music, presets, playlist: `st-ble-ui.js`
- Markup: `st-ble-ui-preview.html`
- Styling: `st-ble-ui.css`

Do not override one file from another to neutralize known behavior. Fix the owner.

## Verification rule

Before changing a protocol-dependent feature, verify three fingers when available:

1. Current project code/firmware.
2. An authoritative API/spec/manufacturer source.
3. A second implementation, independent reference, or direct runtime observation.

If all three are not available, mark the unsupported part `UNKNOWN` instead of guessing.

## Required workflow

Before editing:

1. Read the relevant canonical files and this file.
2. State the exact regression-sensitive behaviors being preserved.
3. Compare commands/selectors against `firmware/ST_BT_V5_2_MAIN.ino` when BLE or effects are involved.
4. Make the smallest complete change in the owning file.
5. Run `node --check` on JavaScript.
6. Run `node tools/stble-regression-check.mjs`.
7. Inspect the diff for duplicate owners, new patch files, and lost controls.
8. Report `TESTED` only for tests actually run. Physical LED behavior remains unverified until device evidence confirms it.

## Forbidden patterns

Do not introduce:

- `cloneNode()` to replace controls as a normal implementation strategy.
- dynamically injected `<script>` tags for controller fixes.
- `document.write()` controller boot loaders.
- reconnect logic tied to page `focus` or `pageshow`.
- separate Music effect lists in both MUSIC and FX / COLORS.
- unconditional success counters after BLE send calls.
- a new `st-ble-*-fix.js`, `hotfix.js`, `patch.js`, or similar runtime file instead of correcting the owner.

Historical files may exist for audit, but must not be referenced by the canonical HTML.