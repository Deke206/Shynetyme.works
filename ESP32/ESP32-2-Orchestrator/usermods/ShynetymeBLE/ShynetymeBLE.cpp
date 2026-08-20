#include "wled.h"

#ifdef ARDUINO_ARCH_ESP32
#include <NimBLEDevice.h>

class ShynetymeBLEScanCallbacks : public NimBLEScanCallbacks {
public:
  void onResult(const NimBLEAdvertisedDevice* device) override {
    Serial.printf("[BLE] %s RSSI=%d\n",
                  device->getAddress().toString().c_str(),
                  device->getRSSI());
  }
};

class ShynetymeBLE : public Usermod {
private:
  ShynetymeBLEScanCallbacks scanCallbacks;
  bool started = false;

public:
  void setup() override {
    NimBLEDevice::init("Shynetyme-WLED");

    NimBLEScan* scan = NimBLEDevice::getScan();
    scan->setScanCallbacks(&scanCallbacks, false);
    scan->setActiveScan(true);
    scan->setInterval(100);
    scan->setWindow(100);
    scan->setMaxResults(0);

    started = scan->start(0, false, true);
    Serial.printf("[BLE] scanner %s\n", started ? "started" : "failed to start");
  }

  void loop() override {
    NimBLEScan* scan = NimBLEDevice::getScan();
    if (started && !scan->isScanning()) {
      scan->start(0, false, true);
    }
  }

  void addToJsonInfo(JsonObject& root) override {
    JsonObject user = root["u"];
    if (user.isNull()) user = root.createNestedObject("u");
    JsonArray arr = user.createNestedArray("BLE Scanner");
    arr.add(started ? "running" : "stopped");
  }
};

static ShynetymeBLE shynetymeBLE;
REGISTER_USERMOD(shynetymeBLE);

#endif
