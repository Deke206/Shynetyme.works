# ESP32 #2 — Phone plan

This folder is for the second ESP32 only.

## What we are using on the Android phone

1. **ESP32_Flasher** — flash WLED over USB OTG
   - https://play.google.com/store/apps/details?id=com.esp_flash.esp_flash_app

2. **Serial USB Terminal (Kai Morich)** — CP2102 serial console/debug
   - https://play.google.com/store/apps/details?id=de.kai_morich.serial_usb_terminal

3. **WLED Android app** — control WLED after the board is on Wi-Fi
   - https://play.google.com/store/apps/details?id=ca.cgagnier.wlednativeandroid

4. **WLED stable firmware**
   - https://github.com/wled/WLED/releases/tag/v16.0.1

## Execution order

1. Phone + USB OTG + ESP32 #2.
2. Download the WLED ESP32 binary from the stable release page.
3. Flash it with ESP32_Flasher.
4. Join `WLED-AP` and give WLED the secured ESP32-router Wi-Fi credentials.
5. Open the WLED Android app and add/discover ESP32 #2.
6. When LED wiring is ready, set the LED data GPIO and start building effects/presets.

No NAT-router setup is repeated here. No camera work here. This is the ESP32 #2 phone/WLED workflow.
