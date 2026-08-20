# ESP32 #2 — WLED + Wi-Fi + BLE Orchestrator

## What actually goes on the ESP32

There is **one firmware image**, not three separate programs.

- **WLED** = the base firmware and LED engine.
- **Wi-Fi support** = already compiled into WLED through the ESP32 Arduino/ESP-IDF stack. No separate antenna/Wi-Fi driver is flashed.
- **BLE enumeration** = must be compiled into a custom WLED build as a usermod. This repo uses NimBLE-Arduino for that piece.

So the "put it together" point is the **custom WLED build**. GitHub Actions builds it in the cloud from the files in this folder and outputs one `.bin` file.

## Fast stock WLED firmware

Direct verified ESP32 binary:

https://github.com/wled/WLED/releases/download/v16.0.1/WLED_16.0.1_ESP32.bin

Official release page:

https://github.com/wled/WLED/releases/tag/v16.0.1

Use the stock binary if you want WLED + Wi-Fi immediately. BLE enumeration is not added until the custom build below is flashed.

## Connect WLED to ESP32 #1 router AP

After flashing stock or custom WLED:

1. Join Wi-Fi `WLED-AP`.
2. Default WLED AP password: `wled1234`.
3. Open `http://4.3.2.1`.
4. Open **Config -> WiFi Setup**.
5. Enter the SSID and password of the secured AP being broadcast by ESP32 #1.
6. Save and reboot.
7. Reconnect the phone to the ESP32 #1 AP. WLED will now be on that same network.

## Custom combined firmware

This folder contains:

- `platformio_override.ini` — tells WLED to build for the classic ESP32 and include the BLE usermod.
- `usermods/ShynetymeBLE/` — BLE scanner/enumerator source.
- `.github/workflows/build-esp32-2-wled.yml` — cloud build job.

The build output is one file named:

`Shynetyme_ESP32_2_WLED_BLE.bin`

That single image contains WLED + Wi-Fi + BLE scanning.

## Build location

GitHub repo -> **Actions** -> **Build ESP32 #2 WLED Orchestrator**.

The workflow also runs automatically when files in this folder change. Download the artifact named:

`Shynetyme-ESP32-2-WLED-BLE`

Then flash the `.bin` inside it to ESP32 #2.

## Board target

- Classic ESP32
- ESP32-D0WD-V3 rev 3.1
- 4 MB flash
- CP2102 USB-UART
- 30-pin DevKit/NodeMCU-32S-style board
