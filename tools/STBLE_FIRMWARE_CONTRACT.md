# ShyneTyme BT V5.1 — Active Web Controller Contract

Current physical-controller baseline:

`ST_BT_V5_1_MAIN.ino`

Expected status version:

`VER=51`

A later `ST_BT_V5_2_MAIN.ino` exists as development work, but it is **not** the active hardware assumption unless the user explicitly flashes it and device status/serial output verifies the change.

## BLE UUIDs

- Service: `78170001-7A32-4B19-913A-5354594D4501`
- Command: `78170002-7A32-4B19-913A-5354594D4501`
- Status: `78170003-7A32-4B19-913A-5354594D4501`

V5.1 advertises the service UUID and names boards `ShyneTyme-MAIN-XXXX`.

## Verified V5.1 commands

| Purpose | Command |
| --- | --- |
| Effect | `FX=<name>` |
| Main color | `MAIN=RRGGBB` |
| Background color | `BG=RRGGBB` |
| Foreground color | `FG=RRGGBB` |
| Global brightness | `BRI=0..255` |
| Background brightness | `BGB=0..255` |
| Foreground brightness | `FGB=0..255` |
| Main brightness | `MAINB=0..255` |
| Speed | `SPD=1..255` |
| Intensity | `INT=1..255` |
| Size | `SIZE=1..255` |
| Density | `DENS=1..255` |
| Trail | `TRAIL=1..255` |
| Direction | `DIR=FWD` / `DIR=REV` |
| Mirror | `MIRROR=0` / `MIRROR=1` |
| Pixel order | `ORDER=<order>` |
| Audio enable | `AUDIO=0` / `AUDIO=1` |
| Audio mode | `AUDMODE=<mode>` |
| Audio amount | `AUDAMT=0..255` |
| Compact audio | `A=LLBBMMHHb` |
| Status | `STATUS` |
| Save settings/startup | `SAVE` / `STARTUP` |
| Load settings | `LOAD` |
| ESP32 preset save | `PSAVE=1..8` |
| ESP32 preset load | `PLOAD=1..8` |
| ESP32 preset delete | `PDEL=1..8` |
| Reboot | `REBOOT` |

## V5.1 direct effect set

These are compiled directly into `ST_BT_V5_1_MAIN.ino`:

- `OFF`
- `SOLID`
- `RAINBOW`
- `RAINBOW_GLITTER`
- `COMET`
- `METEOR`
- `SCANNER`
- `DUAL_SCANNER`
- `POLICE`
- `CHASE`
- `TRICOLOR_CHASE`
- `RUNNING_DOTS`
- `THEATER`
- `WIPE`
- `FLOW`
- `FLOW_STRIPE`
- `COLOR_WAVES`
- `SPARKLE`
- `GLITTER`
- `TWINKLE`
- `TWINKLEFOX`
- `TWINKLECAT`
- `FIREWORKS`
- `RAIN`
- `TETRIX`
- `FIRE`
- `LIGHTNING`
- `PACIFICA`
- `SUNRISE`
- `DANCING_SHADOWS`
- `PRIDE`
- `SINELON`
- `JUGGLE`
- `RIPPLE`
- `SONIC_STREAM`
- `SONIC_BOOM`
- `STARBURST`
- `BOUNCING_BALLS`
- `POPCORN`
- `DRIPDROP`
- `LAVA_LAMP`
- `MAGMA`
- `AURORA`
- `HEARTBEAT`
- `BREATHE`
- `FLASH`
- `DUAL_FLASH`
- `VU`
- `SPECTRUM`
- `AUDIO_PULSE`
- `BEAT_FLASH`

The current web UI deliberately hides/removes `SOLID` and the audio/music effects per user direction. That does not mean the firmware lacks them.

## Not part of V5.1

The V5.2 WLED-style catalog layer is **not** part of the V5.1 hardware contract. Do not expose catalog-only names such as:

- `ANDROID`
- `FIRE_2012`
- `PACMAN`
- `PLASMA`
- `PS_COMET`
- other `WLED_CATALOG` entries

unless V5.2 or later is explicitly flashed and verified.

## Status fields used by the web app

V5.1 reports:

- `VER=51`
- `NAME`
- `FX`
- `BG`
- `FG`
- `MAIN`
- `BGB`
- `FGB`
- `MAINB`
- `BRI`
- `SPD`
- `INT`
- `SIZE`
- `DENS`
- `TRAIL`
- `DIR`
- `MIRROR`
- `ORDER`
- `LEDS`
- `CFGLEDS`
- `PIN`
- `CFGPIN`
- `AUDIO`
- `AUDLIVE`
- `AUDMODE`
- `AUDAMT`
- `LEVEL`
- `BASS`
- `MID`
- `HIGH`
- `ARX`
- `HEAP`
- `UP`

V5.1 does **not** report the V5.2 `FXCOUNT` catalog capability field.

## Background brightness

`BGB` is a real independent firmware control in V5.1. The firmware stores `backgroundBase` separately, applies `backgroundBrightness`, and refreshes role colors independently from foreground/main brightness.

The UI should show BGB only when the selected effect actually renders the background role.

## Compact audio packet

V5.1 accepts:

```text
A=LLBBMMHHb
```

where `LL`, `BB`, `MM`, and `HH` are hex bytes and `b` is the beat flag. Accepted packets increment `ARX`.

The current web controller has its Music/microphone surface removed by user direction. Do not reintroduce it unless explicitly requested and separately proven.

## Persistence

Firmware `SAVE` stores the currently active state. Startup workflows must apply the desired startup state before `SAVE`; reboot only after saving when requested.

## Change discipline

1. Treat V5.1 / `VER=51` as the active hardware baseline.
2. Do not infer support from a newer sketch merely because that file exists.
3. Do not expose a command/effect that is absent from V5.1 unless the user explicitly upgrades the firmware and the new version is verified.
4. Web/CSS/mobile layout edits do not change the ESP32 firmware baseline.
5. Physical behavior remains user-tested unless direct hardware instrumentation is available.
