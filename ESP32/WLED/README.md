# WLED for ESP32 #2

Quick access for the Shynetyme ESP32 LED controller.

## Install

- WLED Web Installer: https://install.wled.me/
- Official WLED releases: https://github.com/wled/WLED/releases
- Current stable release page (v16.0.1): https://github.com/wled/WLED/releases/tag/v16.0.1
- Official WLED repository: https://github.com/wled/WLED
- WLED documentation: https://kno.wled.ge/

## Board we are using

Classic ESP32 DevKit / NodeMCU-32S-style board
- ESP32-D0WD-V3 rev 3.1
- 4 MB flash
- CP2102 USB-UART
- 30-pin board

## Goal

1. Flash WLED to ESP32 #2.
2. Join it to the secured ESP32 NAT-router access point.
3. Configure the LED data GPIO after wiring is chosen.

## Fast path

Use the Web Installer first. If manual flashing is needed, use the official release page above and choose the ESP32 build that matches this classic 4 MB ESP32 board.
