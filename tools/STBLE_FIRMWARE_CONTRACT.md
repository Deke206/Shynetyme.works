# ShyneTyme BT V5.2 — Web Controller Contract

Authoritative firmware source outside this repo:

`Google Drive / ESP32. Work / ST_BT_V5_2_MAIN.ino`

This document contains only the protocol/state facts the web controller has verified against that source. If the `.ino` changes, update this contract before changing web-controller assumptions.

## BLE UUIDs

- Service: `78170001-7A32-4B19-913A-5354594D4501`
- Command: `78170002-7A32-4B19-913A-5354594D4501`
- Status: `78170003-7A32-4B19-913A-5354594D4501`

## Core commands used by the web app

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
| Intensity | `INT=0..255` |
| Size | `SIZE=1..255` |
| Density | `DENS=1..255` |
| Trail | `TRAIL=1..255` |
| Direction | `DIR=FWD` / `DIR=REV` |
| Mirror | `MIRROR=0` / `MIRROR=1` |
| Audio enable | `AUDIO=0` / `AUDIO=1` |
| Audio mode | `AUDMODE=OFF|LEVEL|BEAT|SPECTRUM|FULL` |
| Audio amount | `AUDAMT=0..255` |
| Status | `STATUS` |
| Save settings | `SAVE` |
| Reboot | `REBOOT` |

## Preferred microphone packet

The firmware explicitly defines the compact packet to avoid BLE write/notify congestion:

```text
A=LLBBMMHHb
```

Where:

- `LL` = audio level, 00–FF
- `BB` = bass, 00–FF
- `MM` = mid, 00–FF
- `HH` = high, 00–FF
- `b` = beat flag, `0` or `1`

When accepted, firmware increments `ARX`, synthesizes the internal 16-bin representation from bass/mid/high, and refreshes audio-live timing.

The optional long packet `F=<32 hex chars>[beat]` exists in firmware but is **not the default Web Bluetooth transport**. Do not switch the browser controller to `F=` without an explicit transport/MTU test and physical verification.

## Audio status fields

The web app may use these to verify real hardware receipt:

- `AUDIO`
- `AUDLIVE`
- `AUDMODE`
- `AUDAMT`
- `LEVEL`
- `BASS`
- `MID`
- `HIGH`
- `ARX` — compact audio receive count
- `FRX` — 16-bin/FFT receive count

A moving browser spectrograph is not proof of LED audio. The web app may claim audio receipt only when `ARX` (or deliberately tested `FRX`) increases on the ESP32.

## Direct music effects

These belong in the MUSIC tab, not duplicated in FX / COLORS:

- `SPECTRUM`
- `VU`
- `AUDIO_PULSE`
- `BEAT_FLASH`
- `SONIC_STREAM`
- `SONIC_BOOM`
- `RIPPLE`
- `STARBURST`
- `POPCORN`
- `DRIPDROP`
- `HEARTBEAT`

`SPECTRUM` directly renders `audioBass`, `audioMid`, and `audioHigh` across three LED regions. The browser may analyze 16 bands for visualization, but the compact firmware-direct spectrum receives bass/mid/high through `A=`.

## Persistence rules

Firmware `SAVE` stores the **currently active** state. Therefore a startup-effect workflow must:

1. Apply the desired startup effect/state.
2. Send `SAVE`.
3. Optionally restore the current live state if not rebooting.
4. Send `REBOOT` only after saving when reboot is requested.

## Change discipline

If web code expects a command/status field not documented here, first verify it against the current `.ino`. Mark it `UNKNOWN` until verified. Do not infer WLED API behavior from effect names; V5.2 contains adapted WLED-style renderers, not the WLED runtime.