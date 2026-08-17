/**
 * ShyneTyme.Works — shared JavaScript book
 *
 * MODULE INDEX
 * 1. BTF product catalog data
 * 2. BTF recommendation-set data
 * 3. Chuck sprite animation engine
 * 4. Infotainment header
 * 5. Chuck helper widget
 * 6. Simulator-to-project design chain
 * 7. Site initialization and contact handoff
 *
 * Add a new shared object as a named section below. Page-only behavior belongs
 * in that page's one script file. CSS is never injected from JavaScript.
 */

/* ==========================================================================
   MODULE: BTF product catalog data
   ========================================================================== */

(() => {
  "use strict";
  const catalog = {"catalogVersion":"2026-08-09-fresh-rebuild-1","source":{"manufacturer":"BTF-LIGHTING","documents":["BTF-Lighting Addressable Pixel Strip Quotation List.pdf","BTF-Lighting FCOB Led Strip Price List.pdf"],"rules":"IP30 omitted; 24V-only/configurations omitted; cards grouped by product identity; FCOB middle-column parenthetical colors split into separate cards."},"totalItems":21,"categories":[{"id":"all","label":"All Products"},{"id":"Addressable Strips","label":"Addressable Strips"},{"id":"FCOB","label":"FCOB"}],"products":[{"id":"ws2812b-smd5050-rgb","category":"Addressable Strips","name":"WS2812B SMD 5050 RGB","subtitle":"Addressable Pixel Strip","description":"Input voltage: DC5V. LED Source: SMD 5050 RGB. IC Model: WS2812B. Individually addressable: each LED is separately controlled and 1 IC drives 1 LED. LED quantities offered in the source family: 30/60/100/144 LEDs per meter. PCB color: black or white. PCB width: 10mm for 30/60/100 LEDs and 12mm for 144 LEDs. Full-color RGB dream-color effects. Every LED is cuttable.","voltage":"5V","protection":"IP65 / IP67","image":"assets/catalog/btf/addressable-group-001.webp","imageAlt":"BTF-LIGHTING WS2812B SMD 5050 RGB","variants":[{"item":2,"length":"1m","density":"100 LEDs/m","voltage":"5V","protection":"IP65 / IP67","details":"1m 100 LEDs/m IP65 or IP67"},{"item":4,"length":"1m","density":"144 LEDs/m","voltage":"5V","protection":"IP65 / IP67","details":"1m 144 LEDs/m IP65 or IP67"},{"item":6,"length":"2m","density":"100 LEDs/m","voltage":"5V","protection":"IP65 / IP67","details":"2m 100 LEDs/m IP65 or IP67"},{"item":8,"length":"2m","density":"144 LEDs/m","voltage":"5V","protection":"IP65 / IP67","details":"2m 144 LEDs/m IP65 or IP67"},{"item":10,"length":"5m","density":"30 LEDs/m","voltage":"5V","protection":"IP65 / IP67","details":"5m 30 LEDs/m IP65 or IP67"},{"item":12,"length":"5m","density":"60 LEDs/m","voltage":"5V","protection":"IP65 / IP67","details":"5m 60 LEDs/m IP65 or IP67"}],"tags":["ws2812b","smd5050","rgb","5v","ip65","ip67"],"source":"Addressable quotation items 1-12"},{"id":"ws2812b-eco-smd5050-rgb","category":"Addressable Strips","name":"WS2812B ECO SMD 5050 RGB","subtitle":"Addressable Pixel Strip - ECO","description":"Input voltage: DC5V. LED Source: SMD 5050 RGB. IC family: WS2812B ECO, identified in the source as the alloy-wire version. Individually addressable with one IC driving one LED. The family supports 30/60/144 LEDs per meter, black or white PCB, full-color RGB dream-color effects, and individual LED cutting.","voltage":"5V","protection":"IP65 / IP67","image":"assets/catalog/btf/addressable-group-001.webp","imageAlt":"BTF-LIGHTING WS2812B ECO SMD 5050 RGB","variants":[{"item":14,"length":"1m","density":"144 LEDs/m","voltage":"5V","protection":"IP65 / IP67","details":"1m 144 LEDs/m IP65 or IP67"},{"item":16,"length":"5m","density":"30 LEDs/m","voltage":"5V","protection":"IP65 / IP67","details":"5m 30 LEDs/m IP65 or IP67"},{"item":18,"length":"5m","density":"60 LEDs/m","voltage":"5V","protection":"IP65 / IP67","details":"5m 60 LEDs/m IP65 or IP67"}],"tags":["ws2812b eco","smd5050","rgb","5v","ip65","ip67"],"source":"Addressable quotation items 13-18"},{"id":"ws2811-smd5050-rgb-ordinary","category":"Addressable Strips","name":"WS2811 SMD 5050 RGB","subtitle":"Ordinary Type","description":"Input voltage: DC12V. LED Source: SMD 5050 RGB. IC Model: WS2811. External IC design with one IC controlling 3 LEDs. Full-color RGB dream-color effects. Source family offers 30/48/60/96/144 LEDs per meter, black or white PCB, with width varying by density. Three LEDs per cut segment.","voltage":"12V","protection":"IP65 / IP67","image":"assets/catalog/btf/addressable-group-046.webp","imageAlt":"BTF-LIGHTING WS2811 SMD 5050 RGB","variants":[{"item":47,"length":"5m","density":"30 LEDs/m","voltage":"12V","protection":"IP65 / IP67","details":"5m 30 LEDs/m IP65 or IP67"},{"item":49,"length":"5m","density":"48 LEDs/m","voltage":"12V","protection":"IP65 / IP67","details":"5m 48 LEDs/m IP65 or IP67"},{"item":51,"length":"5m","density":"60 LEDs/m","voltage":"12V","protection":"IP65 / IP67","details":"5m 60 LEDs/m IP65 or IP67"},{"item":53,"length":"5m","density":"96 LEDs/m","voltage":"12V","protection":"IP65 / IP67","details":"5m 96 LEDs/m IP65 or IP67"},{"item":55,"length":"5m","density":"144 LEDs/m","voltage":"12V","protection":"IP65 / IP67","details":"5m 144 LEDs/m IP65 or IP67"}],"tags":["ws2811","smd5050","ordinary","12v","ip65","ip67"],"source":"Addressable quotation items 46-55"},{"id":"ws2811-smd5050-rgb-bright","category":"Addressable Strips","name":"WS2811 SMD 5050 RGB","subtitle":"Bright Type","description":"Input voltage: DC12V. LED Source: SMD 5050 RGB. IC Model: WS2811. External IC design with one IC controlling 3 LEDs. Full-color RGB dream-color effects. Source family offers 30/48/60/96/144 LEDs per meter, black or white PCB, with width varying by density. Three LEDs per cut segment.","voltage":"12V","protection":"IP65 / IP67","image":"assets/catalog/btf/addressable-group-046.webp","imageAlt":"BTF-LIGHTING WS2811 SMD 5050 RGB","variants":[{"item":57,"length":"5m","density":"30 LEDs/m","voltage":"12V","protection":"IP65 / IP67","details":"5m 30 LEDs/m IP65 or IP67"},{"item":59,"length":"5m","density":"48 LEDs/m","voltage":"12V","protection":"IP65 / IP67","details":"5m 48 LEDs/m IP65 or IP67"},{"item":61,"length":"5m","density":"60 LEDs/m","voltage":"12V","protection":"IP65 / IP67","details":"5m 60 LEDs/m IP65 or IP67"},{"item":63,"length":"5m","density":"96 LEDs/m","voltage":"12V","protection":"IP65 / IP67","details":"5m 96 LEDs/m IP65 or IP67"},{"item":65,"length":"5m","density":"144 LEDs/m","voltage":"12V","protection":"IP65 / IP67","details":"5m 144 LEDs/m IP65 or IP67"}],"tags":["ws2811","smd5050","bright","12v","ip65","ip67"],"source":"Addressable quotation items 56-65"},{"id":"sk6812rgbw-smd5050-rgbw","category":"Addressable Strips","name":"SK6812RGBW SMD 5050 RGBW 4IN1","subtitle":"Addressable RGBW Pixel Strip","description":"LED Source: SMD 5050 RGBW 4IN1. IC Model: SK6812RGBW. Each LED is separately controlled and one IC drives one LED. Full-color RGBW dream-color effects with warm, natural, or cool white options. Black or white PCB depending on configuration; every LED is cuttable.","voltage":"5V / 12V","protection":"IP65 / IP67","image":"assets/catalog/btf/addressable-group-070.webp","imageAlt":"BTF-LIGHTING SK6812RGBW SMD 5050 RGBW 4IN1","variants":[{"item":71,"length":"1m","density":"144 LEDs/m","voltage":"5V","protection":"IP65 / IP67","details":"1m 144 LEDs/m IP65 or IP67"},{"item":73,"length":"5m","density":"30 LEDs/m","voltage":"5V","protection":"IP65 / IP67","details":"5m 30 LEDs/m IP65 or IP67"},{"item":75,"length":"5m","density":"60 LEDs/m","voltage":"5V","protection":"IP65 / IP67","details":"5m 60 LEDs/m IP65 or IP67"},{"item":77,"length":"5m","density":"60 LEDs/m","voltage":"12V","protection":"IP65","details":"5m 60 LEDs/m IP65"},{"item":78,"length":"5m","density":"60 LEDs/m","voltage":"12V","protection":"IP67","details":"5m 60 LEDs/m IP67"}],"tags":["sk6812rgbw","smd5050","rgbw","5v","12v","ip65","ip67"],"source":"Addressable quotation items 70-78"},{"id":"ws2815-smd5050-rgb","category":"Addressable Strips","name":"WS2815 SMD 5050 RGB","subtitle":"Dual-Signal Addressable Strip","description":"Input voltage: DC12V. LED Source: SMD 5050 RGB. IC Model: WS2815. Individually addressable with one IC per LED. Dual-signal design uses a main data wire and backup data wire so downstream LEDs can continue after a single LED failure. Full-color RGB dream-color effects; every LED is cuttable.","voltage":"12V","protection":"IP65 / IP67 / IP68","image":"assets/catalog/btf/addressable-group-079.webp","imageAlt":"BTF-LIGHTING WS2815 SMD 5050 RGB","variants":[{"item":80,"length":"1m","density":"100 LEDs/m","voltage":"12V","protection":"IP65 / IP67","details":"1m 100 LEDs/m IP65 or IP67"},{"item":82,"length":"1m","density":"144 LEDs/m","voltage":"12V","protection":"IP65 / IP67","details":"1m 144 LEDs/m IP65 or IP67"},{"item":84,"length":"5m","density":"30 LEDs/m","voltage":"12V","protection":"IP65 / IP67","details":"5m 30 LEDs/m IP65 or IP67"},{"item":86,"length":"5m","density":"60 LEDs/m","voltage":"12V","protection":"IP65 / IP67","details":"5m 60 LEDs/m IP65 or IP67"},{"item":87,"length":"5m","density":"60 LEDs/m","voltage":"12V","protection":"IP68","details":"5m 60 LEDs/m IP68"}],"tags":["ws2815","smd5050","rgb","12v","dual signal","ip65","ip67","ip68"],"source":"Addressable quotation items 79-87"},{"id":"ws2813-smd5050-rgb","category":"Addressable Strips","name":"WS2813 SMD 5050 RGB","subtitle":"Backup-Data Addressable Strip","description":"Input voltage: DC5V. LED Source: SMD 5050 RGB. IC Model: WS2813. Individually addressable with backup-data signaling for break-point continuous transmission. Full-color RGB dream-color effects, black or white PCB, and each LED is cuttable.","voltage":"5V","protection":"IP65 / IP67","image":"assets/catalog/btf/addressable-group-088.webp","imageAlt":"BTF-LIGHTING WS2813 SMD 5050 RGB","variants":[{"item":89,"length":"1m","density":"100 LEDs/m","voltage":"5V","protection":"IP65 / IP67","details":"1m 100 LEDs/m IP65 or IP67"},{"item":91,"length":"1m","density":"144 LEDs/m","voltage":"5V","protection":"IP65 / IP67","details":"1m 144 LEDs/m IP65 or IP67"},{"item":93,"length":"5m","density":"30 LEDs/m","voltage":"5V","protection":"IP65 / IP67","details":"5m 30 LEDs/m IP65 or IP67"},{"item":95,"length":"5m","density":"60 LEDs/m","voltage":"5V","protection":"IP65 / IP67","details":"5m 60 LEDs/m IP65 or IP67"}],"tags":["ws2813","smd5050","rgb","5v","backup data","ip65","ip67"],"source":"Addressable quotation items 88-95"},{"id":"sk9822-smd5050-rgb","category":"Addressable Strips","name":"SK9822 SMD 5050 RGB","subtitle":"DATA + CLOCK Addressable Strip","description":"Input voltage: DC5V. LED Source: SMD 5050 RGB. IC Model: SK9822 (similar APA102). Each LED is individually addressable. Separate DATA and CLOCK signals provide a faster, more stable two-signal interface than a single data line. Full-color RGB dream-color effects.","voltage":"5V","protection":"IP65 / IP67","image":"assets/catalog/btf/addressable-group-096.webp","imageAlt":"BTF-LIGHTING SK9822 SMD 5050 RGB","variants":[{"item":97,"length":"1m","density":"144 LEDs/m","voltage":"5V","protection":"IP65 / IP67","details":"1m 144 LEDs/m IP65 or IP67"},{"item":99,"length":"5m","density":"30 LEDs/m","voltage":"5V","protection":"IP65 / IP67","details":"5m 30 LEDs/m IP65 or IP67"},{"item":101,"length":"5m","density":"60 LEDs/m","voltage":"5V","protection":"IP65 / IP67","details":"5m 60 LEDs/m IP65 or IP67"}],"tags":["sk9822","apa102","smd5050","rgb","5v","clock","ip65","ip67"],"source":"Addressable quotation items 96-101"},{"id":"tm1934-smd5050-rgb","category":"Addressable Strips","name":"TM1934 SMD 5050 RGB","subtitle":"Redundant-Signal Addressable Strip","description":"LED Source: SMD 5050 RGB. IC Model: TM1934. The 12V configuration uses an external IC controlling 3 LEDs. Dual-signal design includes main and backup data lines for break-point continuous transmission. Full-color RGB dream-color effects; black or white PCB.","voltage":"12V","protection":"IP65 / IP67","image":"assets/catalog/btf/addressable-group-106.webp","imageAlt":"BTF-LIGHTING TM1934 SMD 5050 RGB","variants":[{"item":107,"length":"5m","density":"30 LEDs/m","voltage":"12V","protection":"IP65 / IP67","details":"5m 30 LEDs/m IP65 or IP67"},{"item":109,"length":"5m","density":"60 LEDs/m","voltage":"12V","protection":"IP65 / IP67","details":"5m 60 LEDs/m IP65 or IP67"}],"tags":["tm1934","smd5050","rgb","12v","redundant signal","ip65","ip67"],"source":"Addressable quotation items 106-111; 24V configurations omitted"},{"id":"ws2814-smd5050-rgbw","category":"Addressable Strips","name":"WS2814 SMD 5050 RGBW 4IN1","subtitle":"RGBW Addressable Strip","description":"LED Source: SMD 5050 RGBW 4IN1. IC Model: WS2814. The 12V configuration uses an external IC controlling 3 LEDs. Full-color RGBW dream-color effects with warm or cool white. Black or white PCB depending on configuration.","voltage":"12V","protection":"IP65 / IP67 / IP68","image":"assets/catalog/btf/addressable-group-112.webp","imageAlt":"BTF-LIGHTING WS2814 SMD 5050 RGBW 4IN1","variants":[{"item":113,"length":"5m","density":"30 LEDs/m","voltage":"12V","protection":"IP65 / IP67","details":"5m 30 LEDs/m IP65 or IP67"},{"item":115,"length":"5m","density":"60 LEDs/m","voltage":"12V","protection":"IP65 / IP67","details":"5m 60 LEDs/m IP65 or IP67"},{"item":116,"length":"5m","density":"60 LEDs/m","voltage":"12V","protection":"IP68","details":"5m 60 LEDs/m IP68"},{"item":118,"length":"5m","density":"84 LEDs/m","voltage":"12V","protection":"IP65 / IP67","details":"5m 84 LEDs/m IP65 or IP67"},{"item":119,"length":"5m","density":"84 LEDs/m","voltage":"12V","protection":"IP68","details":"5m 84 LEDs/m IP68"}],"tags":["ws2814","smd5050","rgbw","12v","ip65","ip67","ip68"],"source":"Addressable quotation items 112-125; 24V configurations omitted"},{"id":"ws2805-smd5050-rgbcct","category":"Addressable Strips","name":"WS2805 SMD 5050 RGBCCT 5IN1","subtitle":"RGBCCT Redundant-Signal Strip","description":"LED Source: SMD 5050 RGBCCT 5IN1. IC Model: WS2805. The 12V configuration uses an external IC controlling 3 LEDs. Full-color RGBCCT dream-color output with tunable white from approximately 3000K to 6000K. Dual-signal design provides backup data transmission.","voltage":"12V","protection":"IP65 / IP67","image":"assets/catalog/btf/addressable-group-126.webp","imageAlt":"BTF-LIGHTING WS2805 SMD 5050 RGBCCT 5IN1","variants":[{"item":127,"length":"5m","density":"60 LEDs/m","voltage":"12V","protection":"IP65 / IP67","details":"5m 60 LEDs/m IP65 or IP67"}],"tags":["ws2805","smd5050","rgbcct","12v","dual signal","ip65","ip67"],"source":"Addressable quotation items 126-131; 24V configurations omitted"},{"id":"fcob-solid-warm-white-ip65","category":"FCOB","name":"FCOB Solid White Warm White","subtitle":"IP65 Silicone Coated","description":"Voltage family: DC12V/24V; this catalog retains the 12V configuration only. LED quantity: 480 or 528 LEDs/m. Wattage at 12V: 480 LEDs/m - 11W/m; 528 LEDs/m - 12W/m. FPCB width: 8mm for 480 LEDs/m and 10mm for 528 LEDs/m. White PCB. CRI >90, 180° view angle. Waterproof grade: IP65 silicone coating.","voltage":"12V","protection":"IP65","image":"assets/catalog/btf/fcob-group-010.webp","imageAlt":"BTF-LIGHTING FCOB Solid White Warm White","variants":[{"item":10,"length":"5m","density":"480 LEDs/m","voltage":"12V","protection":"IP65","details":"Warm White - 5m 480 LEDs/m"},{"item":11,"length":"5m","density":"528 LEDs/m","voltage":"12V","protection":"IP65","details":"Warm White - 5m 528 LEDs/m"}],"tags":["fcob","solid white","warm white","12v","ip65"],"source":"FCOB quotation items 10-11"},{"id":"fcob-solid-natural-white-ip65","category":"FCOB","name":"FCOB Solid White Natural White","subtitle":"IP65 Silicone Coated","description":"Voltage family: DC12V/24V; this catalog retains the 12V configuration only. LED quantity: 480 or 528 LEDs/m. Wattage at 12V: 480 LEDs/m - 11W/m; 528 LEDs/m - 12W/m. FPCB width: 8mm for 480 LEDs/m and 10mm for 528 LEDs/m. White PCB. CRI >90, 180° view angle. Waterproof grade: IP65 silicone coating.","voltage":"12V","protection":"IP65","image":"assets/catalog/btf/fcob-group-010.webp","imageAlt":"BTF-LIGHTING FCOB Solid White Natural White","variants":[{"item":10,"length":"5m","density":"480 LEDs/m","voltage":"12V","protection":"IP65","details":"Natural White - 5m 480 LEDs/m"},{"item":11,"length":"5m","density":"528 LEDs/m","voltage":"12V","protection":"IP65","details":"Natural White - 5m 528 LEDs/m"}],"tags":["fcob","solid white","natural white","12v","ip65"],"source":"FCOB quotation items 10-11"},{"id":"fcob-solid-cold-white-ip65","category":"FCOB","name":"FCOB Solid White Cold White","subtitle":"IP65 Silicone Coated","description":"Voltage family: DC12V/24V; this catalog retains the 12V configuration only. LED quantity: 480 or 528 LEDs/m. Wattage at 12V: 480 LEDs/m - 11W/m; 528 LEDs/m - 12W/m. FPCB width: 8mm for 480 LEDs/m and 10mm for 528 LEDs/m. White PCB. CRI >90, 180° view angle. Waterproof grade: IP65 silicone coating.","voltage":"12V","protection":"IP65","image":"assets/catalog/btf/fcob-group-010.webp","imageAlt":"BTF-LIGHTING FCOB Solid White Cold White","variants":[{"item":10,"length":"5m","density":"480 LEDs/m","voltage":"12V","protection":"IP65","details":"Cold White - 5m 480 LEDs/m"},{"item":11,"length":"5m","density":"528 LEDs/m","voltage":"12V","protection":"IP65","details":"Cold White - 5m 528 LEDs/m"}],"tags":["fcob","solid white","cold white","12v","ip65"],"source":"FCOB quotation items 10-11"},{"id":"fcob-solid-yellow-white-ip67","category":"FCOB","name":"FCOB Solid White Yellow White","subtitle":"IP67 Waterproof","description":"Voltage family: DC12V/24V; this catalog retains the 12V configuration only. LED quantity: 320 LEDs/m. Wattage at 12V: 7W/m. FPCB width: 10mm with black PCB. CRI >90, 180° view angle. Waterproof grade: IP67. Source color options: Yellow White 2700K, Warm White 3000K, Natural White 4000K, and Cold White 6000K.","voltage":"12V","protection":"IP67","image":"assets/catalog/btf/fcob-group-013.webp","imageAlt":"BTF-LIGHTING FCOB Solid White Yellow White","variants":[{"item":13,"length":"5m","density":"320 LEDs/m","voltage":"12V","protection":"IP67","details":"Yellow White - 5m 320 LEDs/m"}],"tags":["fcob","solid white","yellow white","12v","ip67"],"source":"FCOB quotation item 13"},{"id":"fcob-solid-warm-white-ip67","category":"FCOB","name":"FCOB Solid White Warm White","subtitle":"IP67 Waterproof","description":"Voltage family: DC12V/24V; this catalog retains the 12V configuration only. LED quantity: 320 LEDs/m. Wattage at 12V: 7W/m. FPCB width: 10mm with black PCB. CRI >90, 180° view angle. Waterproof grade: IP67. Source color options: Yellow White 2700K, Warm White 3000K, Natural White 4000K, and Cold White 6000K.","voltage":"12V","protection":"IP67","image":"assets/catalog/btf/fcob-group-013.webp","imageAlt":"BTF-LIGHTING FCOB Solid White Warm White","variants":[{"item":13,"length":"5m","density":"320 LEDs/m","voltage":"12V","protection":"IP67","details":"Warm White - 5m 320 LEDs/m"}],"tags":["fcob","solid white","warm white","12v","ip67"],"source":"FCOB quotation item 13"},{"id":"fcob-solid-natural-white-ip67","category":"FCOB","name":"FCOB Solid White Natural White","subtitle":"IP67 Waterproof","description":"Voltage family: DC12V/24V; this catalog retains the 12V configuration only. LED quantity: 320 LEDs/m. Wattage at 12V: 7W/m. FPCB width: 10mm with black PCB. CRI >90, 180° view angle. Waterproof grade: IP67. Source color options: Yellow White 2700K, Warm White 3000K, Natural White 4000K, and Cold White 6000K.","voltage":"12V","protection":"IP67","image":"assets/catalog/btf/fcob-group-013.webp","imageAlt":"BTF-LIGHTING FCOB Solid White Natural White","variants":[{"item":13,"length":"5m","density":"320 LEDs/m","voltage":"12V","protection":"IP67","details":"Natural White - 5m 320 LEDs/m"}],"tags":["fcob","solid white","natural white","12v","ip67"],"source":"FCOB quotation item 13"},{"id":"fcob-solid-cold-white-ip67","category":"FCOB","name":"FCOB Solid White Cold White","subtitle":"IP67 Waterproof","description":"Voltage family: DC12V/24V; this catalog retains the 12V configuration only. LED quantity: 320 LEDs/m. Wattage at 12V: 7W/m. FPCB width: 10mm with black PCB. CRI >90, 180° view angle. Waterproof grade: IP67. Source color options: Yellow White 2700K, Warm White 3000K, Natural White 4000K, and Cold White 6000K.","voltage":"12V","protection":"IP67","image":"assets/catalog/btf/fcob-group-013.webp","imageAlt":"BTF-LIGHTING FCOB Solid White Cold White","variants":[{"item":13,"length":"5m","density":"320 LEDs/m","voltage":"12V","protection":"IP67","details":"Cold White - 5m 320 LEDs/m"}],"tags":["fcob","solid white","cold white","12v","ip67"],"source":"FCOB quotation item 13"},{"id":"fcob-cct-2700-6000k-ip65","category":"FCOB","name":"FCOB 2700K-6000K","subtitle":"IP65 Silicone Coated Tunable White","description":"Voltage family: DC12V/24V; this catalog retains the 12V configuration only. LED quantity: 640 LEDs/m made from warm-white and cool-white channels. Wattage: 14W/m. FPCB width: 10mm, white or black PCB. Tunable CCT range: 2700K-6000K. CRI >90, 180° view angle. Waterproof grade: IP65 silicone coating.","voltage":"12V","protection":"IP65","image":"assets/catalog/btf/fcob-group-016.webp","imageAlt":"BTF-LIGHTING FCOB 2700K-6000K","variants":[{"item":18,"length":"5m","density":"640 LEDs/m","voltage":"12V","protection":"IP65","details":"5m 640 LEDs/m, tunable 2700K-6000K"}],"tags":["fcob","cct","2700k","6000k","12v","ip65"],"source":"FCOB quotation item 18"},{"id":"fcob-spi-rgbic-addressable-ip66","category":"FCOB","name":"FCOB SPI RGBIC Addressable Type","subtitle":"WS2811 - IP66","description":"Voltage family: DC12V/24V; this catalog retains the 12V configuration only. LED quantity: 864 LEDs/m. At 12V the strip is rated 12W/m. FPCB width: 12mm. IC Model: WS2811; 24 ICs/m, one IC controls 36 LEDs. RGBIC dream-color output. White PCB. Waterproof grade: IP66 heat-shrinkable sleeve.","voltage":"12V","protection":"IP66","image":"assets/catalog/btf/fcob-group-048.webp","imageAlt":"BTF-LIGHTING FCOB SPI RGBIC Addressable Type","variants":[{"item":50,"length":"5m","density":"864 LEDs/m","voltage":"12V","protection":"IP66","details":"5m 864 LEDs/m IP66"},{"item":51,"length":"7.5m","density":"864 LEDs/m","voltage":"12V","protection":"IP66","details":"7.5m 864 LEDs/m IP66"}],"tags":["fcob","ws2811","rgbic","addressable","12v","ip66"],"source":"FCOB quotation items 48-51"},{"id":"fcob-spi-rgbw-addressable-ip66","category":"FCOB","name":"FCOB SPI RGBW IC Addressable Type","subtitle":"WS2814 - IP66","description":"Voltage: DC12V. LED quantity: 768 LEDs/m. Wattage: 18W/m. FPCB width: 10mm. IC Model: WS2814; 16 ICs/m with one IC controlling 48 LEDs. RGBW IC dream-color output with warm, natural, or cool white. Cutting length: 62mm. CRI >90, 180° view angle. Waterproof grade: IP66 heat-shrinkable sleeve.","voltage":"12V","protection":"IP66","image":"assets/catalog/btf/fcob-group-060.webp","imageAlt":"BTF-LIGHTING FCOB SPI RGBW IC Addressable Type","variants":[{"item":61,"length":"5m","density":"768 LEDs/m","voltage":"12V","protection":"IP66","details":"5m 768 LEDs/m IP66"}],"tags":["fcob","ws2814","rgbw","addressable","12v","ip66"],"source":"FCOB quotation items 60-61"}]};
  window.SHYNETYME_BTF_CATALOG = catalog;
  window.SHYNETYME_BTF_READY = Promise.resolve(catalog);
})();



/* ==========================================================================
   MODULE: BTF recommendation-set data
   ========================================================================== */

window.SHYNETYME_BTF_RECOMMENDATION_SETS = {
  "bike": {
    "indoor": [
      {
        "id": "strip-ws2812b-smd5050-rgb",
        "name": "WS2812B SMD 5050 RGB",
        "category": "Addressable Strips"
      },
      {
        "id": "strip-ws2813-smd5050-rgb",
        "name": "WS2813 SMD 5050 RGB",
        "category": "Addressable Strips"
      },
      {
        "id": "strip-sk6812rgbw-smd5050-rgbw",
        "name": "SK6812RGBW SMD 5050 RGBW 4IN1",
        "category": "Addressable Strips"
      },
      {
        "id": "rope-ws2812b-360-5v",
        "name": "WS2812B 360° Round Reticulate Neon Rope — 5V",
        "category": "Neon & Rope"
      },
      {
        "id": "controller-wegoiot-wled-1ch",
        "name": "WeGoIOT Waterproof ESP32 WLED Controller — 1 Channel",
        "category": "Controllers & Signal"
      },
      {
        "id": "controller-wegoiot-wled-2ch",
        "name": "WeGoIOT Waterproof ESP32 WLED Controller — 2 Channel",
        "category": "Controllers & Signal"
      }
    ],
    "outdoor": [
      {
        "id": "strip-ws2812b-smd5050-rgb",
        "name": "WS2812B SMD 5050 RGB",
        "category": "Addressable Strips"
      },
      {
        "id": "strip-ws2815-smd5050-rgb",
        "name": "WS2815 SMD 5050 RGB",
        "category": "Addressable Strips"
      },
      {
        "id": "strip-ws2813-smd5050-rgb",
        "name": "WS2813 SMD 5050 RGB",
        "category": "Addressable Strips"
      },
      {
        "id": "strip-ws2805-smd5050-rgbcct",
        "name": "WS2805 SMD 5050 RGBCCT 5IN1",
        "category": "Addressable Strips"
      },
      {
        "id": "rope-ws2812b-360-12v",
        "name": "WS2812B 360° Round Reticulate Neon Rope — 12V",
        "category": "Neon & Rope"
      },
      {
        "id": "controller-wegoiot-wled-2ch",
        "name": "WeGoIOT Waterproof ESP32 WLED Controller — 2 Channel",
        "category": "Controllers & Signal"
      }
    ]
  },
  "auto": {
    "indoor": [
      {
        "id": "strip-ws2811-smd5050-rgb",
        "name": "WS2811 SMD 5050 RGB",
        "category": "Addressable Strips"
      },
      {
        "id": "strip-ws2815-smd5050-rgb",
        "name": "WS2815 SMD 5050 RGB",
        "category": "Addressable Strips"
      },
      {
        "id": "strip-tm1934-smd5050-rgb",
        "name": "TM1934 SMD 5050 RGB",
        "category": "Addressable Strips"
      },
      {
        "id": "strip-ws2814-smd5050-rgbw",
        "name": "WS2814 SMD 5050 RGBW 4IN1",
        "category": "Addressable Strips"
      },
      {
        "id": "strip-ws2805-smd5050-rgbcct",
        "name": "WS2805 SMD 5050 RGBCCT 5IN1",
        "category": "Addressable Strips"
      },
      {
        "id": "controller-wegoiot-wled-2ch",
        "name": "WeGoIOT Waterproof ESP32 WLED Controller — 2 Channel",
        "category": "Controllers & Signal"
      }
    ],
    "outdoor": [
      {
        "id": "strip-ws2815-smd5050-rgb",
        "name": "WS2815 SMD 5050 RGB",
        "category": "Addressable Strips"
      },
      {
        "id": "strip-tm1934-smd5050-rgb",
        "name": "TM1934 SMD 5050 RGB",
        "category": "Addressable Strips"
      },
      {
        "id": "strip-ws2814-smd5050-rgbw",
        "name": "WS2814 SMD 5050 RGBW 4IN1",
        "category": "Addressable Strips"
      },
      {
        "id": "strip-ws2805-smd5050-rgbcct",
        "name": "WS2805 SMD 5050 RGBCCT 5IN1",
        "category": "Addressable Strips"
      },
      {
        "id": "rope-ws2812b-360-12v",
        "name": "WS2812B 360° Round Reticulate Neon Rope — 12V",
        "category": "Neon & Rope"
      },
      {
        "id": "controller-wegoiot-wled-2ch",
        "name": "WeGoIOT Waterproof ESP32 WLED Controller — 2 Channel",
        "category": "Controllers & Signal"
      }
    ]
  },
  "home": {
    "indoor": [
      {
        "id": "fcob-solid-white-warm-white",
        "name": "FCOB Solid White — Warm White",
        "category": "FCOB"
      },
      {
        "id": "fcob-solid-white-natural-white",
        "name": "FCOB Solid White — Natural White",
        "category": "FCOB"
      },
      {
        "id": "fcob-cct-2700-6000",
        "name": "FCOB 2700K–6000K",
        "category": "FCOB"
      },
      {
        "id": "strip-sk6812rgbw-smd5050-rgbw",
        "name": "SK6812RGBW SMD 5050 RGBW 4IN1",
        "category": "Addressable Strips"
      },
      {
        "id": "fcob-spi-rgbic-addressable",
        "name": "FCOB SPI RGBIC Addressable Type",
        "category": "FCOB"
      },
      {
        "id": "controller-wegoiot-wled-2ch",
        "name": "WeGoIOT Waterproof ESP32 WLED Controller — 2 Channel",
        "category": "Controllers & Signal"
      }
    ],
    "outdoor": [
      {
        "id": "fcob-solid-white-warm-white",
        "name": "FCOB Solid White — Warm White",
        "category": "FCOB"
      },
      {
        "id": "fcob-solid-white-natural-white",
        "name": "FCOB Solid White — Natural White",
        "category": "FCOB"
      },
      {
        "id": "fcob-solid-white-cold-white",
        "name": "FCOB Solid White — Cold White",
        "category": "FCOB"
      },
      {
        "id": "fcob-spi-rgbw-addressable",
        "name": "FCOB SPI RGBW IC Addressable Type",
        "category": "FCOB"
      },
      {
        "id": "strip-ws2815-smd5050-rgb",
        "name": "WS2815 SMD 5050 RGB",
        "category": "Addressable Strips"
      },
      {
        "id": "rope-ws2812b-360-12v",
        "name": "WS2812B 360° Round Reticulate Neon Rope — 12V",
        "category": "Neon & Rope"
      }
    ]
  }
};



/* ==========================================================================
   MODULE: Chuck sprite animation engine
   ========================================================================== */

(() => {
  "use strict";

  const VERSION = "pet-atlas-v1";
  const COLS = 8;
  const ROWS = 11;
  const instances = new WeakMap();

  const STATES = Object.freeze({
    idle:          { row: 0, frames: 6, interval: 185, loop: true },
    "run-right":  { row: 1, frames: 8, interval: 86,  loop: true },
    "run-left":   { row: 2, frames: 8, interval: 86,  loop: true },
    wave:          { row: 3, frames: 4, interval: 155, loop: false },
    jump:          { row: 4, frames: 5, interval: 125, loop: false },
    failure:       { row: 5, frames: 8, interval: 165, loop: false },
    waiting:       { row: 6, frames: 6, interval: 190, loop: false },
    "active-work":{ row: 7, frames: 6, interval: 170, loop: false },
    review:        { row: 8, frames: 6, interval: 185, loop: false },
    celebrate:     { row: 9, frames: 6, interval: 130, loop: false },
    sleep:         { row:10, frames: 6, interval: 265, loop: false }
  });

  const normalizeState = (name) => {
    if (STATES[name]) return name;
    if (name === "scan") return "review";
    if (name === "laptop") return "active-work";
    return "idle";
  };

  const mount = ({ button, image, atlasUrl }) => {
    if (!button || !atlasUrl) return null;
    if (instances.has(button)) return instances.get(button);

    const fallback = image || button.querySelector("img");
    if (fallback) fallback.classList.add("chuck-fallback-image");

    let sprite = button.querySelector(".deke-chuck-atlas-sprite");
    if (!sprite) {
      sprite = document.createElement("span");
      sprite.className = "deke-chuck-atlas-sprite";
      sprite.setAttribute("aria-hidden", "true");
      button.appendChild(sprite);
    }

    sprite.style.backgroundImage = `url("${atlasUrl}")`;
    sprite.hidden = true;

    let timer = 0;
    let destroyed = false;
    let ready = false;
    let currentState = "idle";
    let currentFrame = 0;
    let onComplete = null;
    let loopOverride = null;

    const clearTimer = () => {
      window.clearTimeout(timer);
      timer = 0;
    };

    const setFrame = (stateName, frameIndex) => {
      const state = STATES[stateName] || STATES.idle;
      const safeFrame = Math.max(0, Math.min(state.frames - 1, frameIndex));
      const x = safeFrame === 0 ? 0 : (safeFrame / (COLS - 1)) * 100;
      const y = state.row === 0 ? 0 : (state.row / (ROWS - 1)) * 100;
      sprite.style.backgroundPosition = `${x}% ${y}%`;
      sprite.dataset.chuckState = stateName;
      sprite.dataset.chuckFrame = String(safeFrame);
      button.dataset.chuckState = stateName;
    };

    const finishCycle = () => {
      const callback = onComplete;
      onComplete = null;
      if (typeof callback === "function") callback(currentState);
    };

    const advance = () => {
      if (destroyed || !ready) return;
      const state = STATES[currentState] || STATES.idle;
      const shouldLoop = loopOverride ?? state.loop;
      currentFrame += 1;

      if (currentFrame >= state.frames) {
        if (!shouldLoop) {
          currentFrame = state.frames - 1;
          setFrame(currentState, currentFrame);
          clearTimer();
          finishCycle();
          return;
        }
        currentFrame = 0;
      }

      setFrame(currentState, currentFrame);
      timer = window.setTimeout(advance, state.interval);
    };

    const play = (name = "idle", options = {}) => {
      if (destroyed) return;
      const stateName = normalizeState(name);
      clearTimer();
      currentState = stateName;
      currentFrame = 0;
      loopOverride = typeof options.loop === "boolean" ? options.loop : null;
      onComplete = typeof options.onComplete === "function" ? options.onComplete : null;
      setFrame(currentState, 0);
      button.classList.toggle("is-chuck-running", currentState === "run-right" || currentState === "run-left");
      button.classList.toggle("is-chuck-sleeping", currentState === "sleep");

      if (!ready) return;
      const state = STATES[currentState];
      timer = window.setTimeout(advance, state.interval);
    };

    const api = {
      version: VERSION,
      play,
      playOnce(name, callback) {
        play(name, {
          loop: false,
          onComplete: () => {
            if (typeof callback === "function") callback(name);
          }
        });
      },
      start(mode = "run-right") {
        play(normalizeState(mode), { loop: true });
      },
      stop() {
        play("idle", { loop: true });
      },
      pause() {
        clearTimer();
      },
      resume() {
        play(currentState, { loop: loopOverride ?? (STATES[currentState]?.loop ?? true) });
      },
      destroy() {
        destroyed = true;
        clearTimer();
        sprite.remove();
        if (fallback) fallback.hidden = false;
        instances.delete(button);
      },
      get state() { return currentState; },
      get ready() { return ready; }
    };

    const preload = new Image();
    preload.decoding = "async";
    preload.onload = () => {
      if (destroyed) return;
      ready = true;
      sprite.hidden = false;
      if (fallback) fallback.hidden = true;
      play(currentState || "idle", { loop: true });
    };
    preload.onerror = () => {
      sprite.hidden = true;
      if (fallback) fallback.hidden = false;
    };
    preload.src = atlasUrl;

    setFrame("idle", 0);
    instances.set(button, api);
    return api;
  };

  window.ShynetymeChuckSprite = { VERSION, STATES, mount };
})();



/* ==========================================================================
   MODULE: Infotainment header
   ========================================================================== */

(() => {
  "use strict";

  if (window.ShynetymeInfotainmentLoaded?.initialized) {
    window.ShynetymeInfotainmentLoaded.init?.();
    return;
  }

  const SLIDE_MS = 10000;
  const FEED_REFRESH_MS = 15 * 60 * 1000;
  const PROXY_PREFIX = "https://api.allorigins.win/raw?url=";

  const FALLBACK_QUOTES = Object.freeze([
    { text: "The strongest kind of shine is the kind that helps somebody else be seen.", author: "ShyneTyme.Works" },
    { text: "A little useful light, shared on purpose, can travel farther than we ever see.", author: "ShyneTyme.Works" },
    { text: "Good work compounds when people make room for one another to keep doing it.", author: "ShyneTyme.Works" },
    { text: "Progress gets brighter when skill, courage, and compassion are passed forward.", author: "ShyneTyme.Works" }
  ]);

  const QUOTE_SOURCE = "https://dummyjson.com/quotes/random/10";

  const FEEDS = Object.freeze({
    hfot: { type: "rss", url: "https://www.hfotusa.org/blog/feed/" },
    dvids: { type: "rss", url: "https://www.dvidshub.net/rss/news" },
    redcross: { type: "html", url: "https://www.redcross.org/about-us/news-and-events/latest-news.html", match: /redcross\.org/i },
    habitat: { type: "html", url: "https://www.habitat.org/newsroom", match: /habitat\.org/i },
    ldf: { type: "html", url: "https://www.naacpldf.org/news/", match: /naacpldf\.org/i },
    naacp: { type: "html", url: "https://naacp.org/news", match: /naacp\.org/i }
  });

  const HUMANITARIAN_SPOTLIGHTS = Object.freeze([
    {
      key: "redcross",
      kicker: "HUMANITARIAN SPOTLIGHT",
      name: "American Red Cross",
      domain: "redcross.org",
      summary: "Disaster relief, lifesaving blood services, emergency training, international humanitarian work, and support for military members, veterans, and their families.",
      donate: "https://www.redcross.org/donate/donation.html/",
      home: "https://www.redcross.org/",
      news: "https://www.redcross.org/about-us/news-and-events/latest-news.html",
      scene: "assets/images/hero-scene-marina.webp"
    },
    {
      key: "habitat",
      kicker: "COMMUNITY SPOTLIGHT",
      name: "Habitat for Humanity",
      domain: "habitat.org",
      summary: "Affordable housing, homebuilding and repair, neighborhood revitalization, disaster recovery, and community development carried out with families and volunteers.",
      donate: "https://www.habitat.org/support",
      home: "https://www.habitat.org/",
      news: "https://www.habitat.org/newsroom",
      scene: "assets/images/hero-scene-work.webp"
    }
  ]);

  const RIGHTS_SPOTLIGHTS = Object.freeze([
    {
      key: "ldf",
      kicker: "CIVIL RIGHTS SPOTLIGHT",
      name: "NAACP Legal Defense Fund",
      domain: "naacpldf.org",
      summary: "Litigation, advocacy, and public education focused on racial justice, equal citizenship, voting rights, education, and a stronger democracy.",
      donate: "https://www.naacpldf.org/support/ways-to-give/",
      home: "https://www.naacpldf.org/",
      news: "https://www.naacpldf.org/news/",
      scene: "assets/images/hero-scene-dance.webp"
    },
    {
      key: "naacp",
      kicker: "CIVIL RIGHTS SPOTLIGHT",
      name: "NAACP",
      domain: "naacp.org",
      summary: "Civil-rights advocacy, civic engagement, policy work, and community action focused on equal rights, equal opportunity, and democratic participation.",
      donate: "https://naacp.org/donate",
      home: "https://naacp.org/",
      news: "https://naacp.org/news",
      scene: "assets/images/hero-scene-school.webp"
    }
  ]);

  const SERVICE_SPOTLIGHTS = Object.freeze([
    {
      kicker: "CURRENT SERVICE · LEADERSHIP · TEAMWORK",
      name: "Master Sgt. Stephania Abdul-Zahir · Air National Guard",
      summary: "A 2026 DVIDS profile follows Abdul-Zahir as she leads medical-detachment support, maintains readiness for fellow Airmen, pursues a doctorate, and mentors others while serving with the 121st Air Refueling Wing.",
      source: "DVIDS",
      domain: "dvidshub.net",
      url: "https://www.dvidshub.net/news/565686/proud-service-air-national-guard",
      image: "https://d1ldvf68ux039x.cloudfront.net/thumbs/photos/2605/9695570/1000w_q95.jpg",
      fallbackImage: "assets/images/hero-scene-work.webp"
    },
    {
      kicker: "CURRENT SERVICE · READINESS · TEAMWORK",
      name: "Airman 1st Class Jacob Barnes · U.S. Air Force",
      summary: "DVIDS profiled Barnes in 2026 for expanding beyond aircraft maintenance into security-forces augmentee training, building a wider skill set to strengthen his wing's readiness and teamwork.",
      source: "DVIDS",
      domain: "dvidshub.net",
      url: "https://www.dvidshub.net/news/562835/multi-capable-airman-strengthens-100-arws-readiness",
      image: "https://d1ldvf68ux039x.cloudfront.net/thumbs/photos/2604/9618433/1000w_q95.jpg",
      fallbackImage: "assets/images/hero-scene-work.webp"
    },
    {
      kicker: "VETERAN SPOTLIGHT · RESILIENCE · FAMILY",
      name: "Army Sgt. Nate Shumaker · Veteran",
      summary: "Homes For Our Troops highlighted Shumaker in 2026 as a living Army veteran continuing an active family life, pursuing athletic goals, and building greater independence in a specially adapted HFOT home.",
      source: "HFOT",
      domain: "hfotusa.org",
      url: "https://www.hfotusa.org/foundation-for-family-a-fathers-day-tribute/",
      image: "assets/images/hero-scene-work.webp",
      fallbackImage: "assets/images/hero-scene-work.webp"
    }
  ]);

  const GHOST_FALLBACKS = Object.freeze({
    redcross: [{ title: "Red Cross responds as wildfires consume millions of acres out West", description: "Current American Red Cross reporting on disaster response and help for affected communities.", url: "https://www.redcross.org/about-us/news-and-events/latest-news.html" }],
    habitat: [{ title: "Lowe's renews partnership with Habitat for Humanity to support home repair projects", description: "Habitat reported new support for more than 200 home-repair projects across 20 U.S. affiliates.", url: "https://www.habitat.org/newsroom" }],
    ldf: [{ title: "Civil rights groups challenge weakened student civil-rights protections", description: "Current Legal Defense Fund reporting on civil-rights protections, education, voting rights, and equal citizenship.", url: "https://www.naacpldf.org/news/" }],
    naacp: [{ title: "NAACP civil-rights advocacy and community action", description: "Current NAACP news and advocacy on equal rights, civic participation, education, and opportunity.", url: "https://naacp.org/news" }],
    dvids: [{ title: "Multi-Capable Airman strengthens 100 ARW's readiness", description: "DVIDS profiled Airman 1st Class Jacob Barnes expanding his skills to strengthen unit readiness and teamwork.", url: "https://www.dvidshub.net/news/562835/multi-capable-airman-strengthens-100-arws-readiness" }],
    hfot: [{ title: "Foundation for Family: A Father's Day Tribute", description: "Homes For Our Troops highlighted living Army veteran Nate Shumaker's family life, independence, and athletic goals.", url: "https://www.hfotusa.org/foundation-for-family-a-fathers-day-tribute/" }]
  });

  const feedCache = new Map();
  const feedOffsets = new Map();
  let quotePool = [...FALLBACK_QUOTES];
  let lastQuoteKey = "";
  let quoteLoadedAt = 0;
  let humanitarianIndex = Math.floor(Math.random() * HUMANITARIAN_SPOTLIGHTS.length);
  let rightsIndex = Math.floor(Math.random() * RIGHTS_SPOTLIGHTS.length);
  let serviceIndex = Math.floor(Math.random() * SERVICE_SPOTLIGHTS.length);
  let ghostTimer = 0;

  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const orgIcon = (domain, size = 128) =>
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;

  const resolveUrl = (href, base) => {
    try { return new URL(href, base).href; } catch { return ""; }
  };

  const uniqueItems = (items) => {
    const seen = new Set();
    return items.filter((item) => {
      const key = `${item.url}|${item.title}`;
      if (!item.title || !item.url || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const stripMarkup = (value = "") => {
    const doc = new DOMParser().parseFromString(String(value), "text/html");
    return (doc.body?.textContent || "").replace(/\s+/g, " ").trim();
  };

  const parseRss = (text) => {
    const xml = new DOMParser().parseFromString(text, "application/xml");
    if (xml.querySelector("parsererror")) return [];
    return uniqueItems([...xml.querySelectorAll("item")].map((item) => ({
      title: item.querySelector("title")?.textContent?.trim() || "",
      url: item.querySelector("link")?.textContent?.trim() || "",
      description: stripMarkup(item.querySelector("description")?.textContent || "").slice(0, 260),
      published: item.querySelector("pubDate")?.textContent?.trim() || ""
    })).filter((item) => item.title && item.url)).slice(0, 18);
  };

  const parseHtml = (text, source) => {
    const doc = new DOMParser().parseFromString(text, "text/html");
    const candidates = [...doc.querySelectorAll("h2 a, h3 a, article a, .post-title a, .entry-title a")];
    return uniqueItems(candidates.map((link) => {
      const title = link.textContent?.replace(/\s+/g, " ").trim() || "";
      const url = resolveUrl(link.getAttribute("href") || "", source.url);
      const article = link.closest("article, li, .card, .cmp-teaser, .news-item") || link.parentElement?.parentElement;
      const description = (article?.querySelector("p")?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 210);
      return { title, url, description };
    }).filter((item) => item.title.length >= 18 && item.title.length <= 180 && source.match.test(item.url))).slice(0, 12);
  };

  const fetchText = async (url) => {
    const attempts = [url, `${PROXY_PREFIX}${encodeURIComponent(url)}`];
    for (const requestUrl of attempts) {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 6500);
      try {
        const response = await fetch(requestUrl, {
          cache: "no-store",
          mode: "cors",
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        if (text.trim()) return text;
      } catch {
        // Try the next transport. Static fallback content remains usable if both fail.
      } finally {
        window.clearTimeout(timeout);
      }
    }
    return "";
  };

  const loadQuotePool = async (force = false) => {
    if (!force && quoteLoadedAt && Date.now() - quoteLoadedAt < FEED_REFRESH_MS && quotePool.length > FALLBACK_QUOTES.length) {
      return quotePool;
    }

    const text = await fetchText(QUOTE_SOURCE);
    if (!text) return quotePool;

    try {
      const payload = JSON.parse(text);
      const sourceQuotes = Array.isArray(payload) ? payload : [payload];
      const liveQuotes = sourceQuotes
        .map((item) => ({
          text: String(item.quote || item.content || "").replace(/\s+/g, " ").trim(),
          author: String(item.author || "Unknown").replace(/\s+/g, " ").trim()
        }))
        .filter((item) => item.text.length >= 20 && item.text.length <= 180 && item.author);

      if (liveQuotes.length) {
        quotePool = [...liveQuotes, ...FALLBACK_QUOTES];
        quoteLoadedAt = Date.now();
      }
    } catch {
      // Recovered ShyneTyme.Works quotes remain available when the live source is unavailable.
    }
    return quotePool;
  };

  const nextQuote = () => {
    const candidates = quotePool.length ? quotePool : FALLBACK_QUOTES;
    let quote = candidates[Math.floor(Math.random() * candidates.length)] || FALLBACK_QUOTES[0];
    if (candidates.length > 1) {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const candidate = candidates[Math.floor(Math.random() * candidates.length)];
        const key = `${candidate.text}|${candidate.author}`;
        if (key !== lastQuoteKey) {
          quote = candidate;
          break;
        }
      }
    }
    lastQuoteKey = `${quote.text}|${quote.author}`;
    return quote;
  };

  const loadFeed = async (key, force = false) => {
    const source = FEEDS[key];
    if (!source) return [];
    const cached = feedCache.get(key);
    if (!force && cached && Date.now() - cached.loadedAt < FEED_REFRESH_MS) return cached.items;

    const text = await fetchText(source.url);
    const items = text
      ? (source.type === "rss" ? parseRss(text) : parseHtml(text, source))
      : [];

    if (items.length) feedCache.set(key, { loadedAt: Date.now(), items });
    return items.length ? items : (cached?.items || []);
  };

  const nextFeedItem = (key) => {
    const items = feedCache.get(key)?.items || [];
    if (!items.length) return null;
    const offset = feedOffsets.get(key) || 0;
    const item = items[offset % items.length];
    feedOffsets.set(key, (offset + 1) % items.length);
    return item;
  };

  const iconAction = (href, domain, label) => {
    const initials = domain.split(".")[0].slice(0, 2).toUpperCase();
    return `
      <a class="infotainment-icon-button" href="${href}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">
        <span class="infotainment-icon-fallback" aria-hidden="true">${escapeHtml(initials)}</span>
        <img src="${orgIcon(domain)}" alt="" width="32" height="32" loading="lazy">
      </a>`;
  };

  const liveHeadline = (key, fallbackHref, fallbackText, label) => `
    <p class="infotainment-live-line" data-live-feed="${key}">
      <span>${escapeHtml(label)}</span>
      <a href="${fallbackHref}" target="_blank" rel="noopener noreferrer">${escapeHtml(fallbackText)}</a>
    </p>`;

  const ghostLayer = (keys) => `
    <div class="infotainment-ghost-layer" data-ghost-keys="${keys.join(",")}" aria-hidden="true">
      <div class="infotainment-ghost-card" data-ghost-slot="0"></div>
      <div class="infotainment-ghost-card" data-ghost-slot="1"></div>
      <div class="infotainment-ghost-card" data-ghost-slot="2"></div>
    </div>`;

  const currentHumanitarian = () => HUMANITARIAN_SPOTLIGHTS[humanitarianIndex % HUMANITARIAN_SPOTLIGHTS.length];
  const currentRights = () => RIGHTS_SPOTLIGHTS[rightsIndex % RIGHTS_SPOTLIGHTS.length];

  const nonprofitPanel = (spotlight, panelType) => `
    <div class="infotainment-panel" data-spotlight-panel="${panelType}">
      <p class="infotainment-kicker" data-spotlight-kicker>${escapeHtml(spotlight.kicker)}</p>
      <h2 data-spotlight-title>${escapeHtml(spotlight.name)}</h2>
      <p data-spotlight-summary>${escapeHtml(spotlight.summary)}</p>
      <p class="infotainment-live-line" data-live-feed="${spotlight.key}" data-spotlight-live>
        <span>LATEST</span>
        <a href="${spotlight.news}" target="_blank" rel="noopener noreferrer">${escapeHtml(spotlight.name)} news</a>
      </p>
      <div class="infotainment-actions" data-spotlight-actions>
        ${iconAction(spotlight.donate, spotlight.domain, `Donate to ${spotlight.name}`)}
        ${iconAction(spotlight.home, spotlight.domain, `Visit ${spotlight.name}`)}
      </div>
    </div>`;


  const featureMedia = (spotlight, type) => `
    <a class="infotainment-feature-media" data-feature-media="${type}" href="${spotlight.home || spotlight.url}" target="_blank" rel="noopener noreferrer" aria-label="Visit ${escapeHtml(spotlight.name)}">
      <img class="infotainment-feature-scene" data-feature-scene src="${spotlight.scene || spotlight.image || 'assets/images/hero-scene-work.webp'}" alt="" loading="lazy">
      <span class="infotainment-feature-shade" aria-hidden="true"></span>
      <span class="infotainment-feature-mark">
        <img data-feature-icon src="${orgIcon(spotlight.domain, 128)}" alt="" width="64" height="64" loading="lazy">
        <strong data-feature-name>${escapeHtml(spotlight.name)}</strong>
      </span>
    </a>`;

  const splitPanel = (media, panel) => `<div class="infotainment-split">${media}${panel}</div>`;

  const motionArt = (kind) => {
    const art = {
      humanitarian: `
        <g class="motion-art__orbit">
          <circle cx="205" cy="205" r="116"/><path d="M90 205 H320 M205 89 C162 132 162 278 205 321 M205 89 C248 132 248 278 205 321"/>
          <path d="M105 160 C145 145 175 145 205 160 C240 176 270 176 310 160 M105 250 C145 265 175 265 205 250 C240 235 270 235 310 250"/>
          <path d="M500 105 V177 H430 V245 H500 V317 H570 V245 H640 V177 H570 V105 Z"/>
          <path class="motion-art__pulse" d="M348 224 H410 L438 188 L470 260 L515 203 L552 224 H710"/>
        </g>`,
      rights: `
        <g class="motion-art__orbit">
          <path d="M400 72 V310 M300 112 H500 M335 112 L270 230 M465 112 L530 230"/>
          <path d="M225 230 H318 C312 270 232 270 225 230 Z M482 230 H575 C568 270 488 270 482 230 Z"/>
          <path d="M315 310 H485 M350 310 V345 M450 310 V345 M300 345 H500"/>
          <g class="motion-art__people"><circle cx="120" cy="220" r="19"/><path d="M120 239 V325 M86 273 L120 250 L154 273 M95 325 L120 290 L145 325"/><circle cx="680" cy="220" r="19"/><path d="M680 239 V325 M646 273 L680 250 L714 273 M655 325 L680 290 L705 325"/></g>
        </g>`,
      service: `
        <g class="motion-art__orbit">
          <path d="M100 320 V215 C100 158 140 124 184 124 C228 124 268 158 268 215 V320"/>
          <path d="M128 158 C150 125 218 125 240 158 M120 196 H248"/>
          <path d="M372 110 L395 160 L450 166 L408 201 L420 258 L372 230 L324 258 L336 201 L294 166 L349 160 Z"/>
          <path d="M520 320 V214 L626 136 L732 214 V320 H660 V252 H590 V320 Z"/>
          <path class="motion-art__pulse" d="M282 305 H336 L358 277 L386 331 L422 291 L448 305 H500"/>
        </g>`,
      quote: `
        <g class="motion-art__orbit">
          <path d="M135 110 C80 145 76 220 116 250 C156 280 220 252 222 201 C224 163 200 139 170 139 C180 112 198 92 225 74"/>
          <path d="M410 110 C355 145 351 220 391 250 C431 280 495 252 497 201 C499 163 475 139 445 139 C455 112 473 92 500 74"/>
          <path d="M600 90 L642 132 L692 96 L720 151 L772 138"/>
        </g>`
    };
    return `<div class="infotainment-motion-art" aria-hidden="true"><svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" focusable="false">${art[kind] || art.quote}</svg></div>`;
  };

  const imageMedia = (src, alt) => `<img class="infotainment-slide__media" src="${src}" alt="${escapeHtml(alt)}" loading="lazy">`;

  const slideShell = (index, kind, inner, media, ghostKeys = []) => `
    <section class="infotainment-slide${index === 0 ? " is-active" : ""}" data-slide-index="${index}" data-slide-kind="${kind}" aria-hidden="${index === 0 ? "false" : "true"}">
      ${media}
      <div class="infotainment-slide__wash" aria-hidden="true"></div>
      ${motionArt(kind)}
      ${ghostLayer(ghostKeys)}
      <div class="infotainment-shell"><div class="infotainment-frame">${inner}</div></div>
    </section>`;

  const humanitarianSlide = () => {
    const spotlight = currentHumanitarian();
    return slideShell(
      0,
      "humanitarian",
      splitPanel(featureMedia(spotlight, "humanitarian"), nonprofitPanel(spotlight, "humanitarian")),
      imageMedia(spotlight.scene, "Humanitarian and community service spotlight"),
      ["redcross", "habitat"]
    );
  };

  const rightsSlide = () => {
    const spotlight = currentRights();
    return slideShell(
      1,
      "rights",
      splitPanel(featureMedia(spotlight, "rights"), nonprofitPanel(spotlight, "rights")),
      imageMedia(spotlight.scene, "Civil rights and community action spotlight"),
      ["ldf", "naacp"]
    );
  };

  const currentService = () => SERVICE_SPOTLIGHTS[serviceIndex % SERVICE_SPOTLIGHTS.length];

  const servicePanel = (spotlight) => `
    <div class="infotainment-panel infotainment-panel--service" data-service-panel>
      <p class="infotainment-kicker" data-service-kicker>${escapeHtml(spotlight.kicker)}</p>
      <h2 data-service-title>${escapeHtml(spotlight.name)}</h2>
      <p data-service-summary>${escapeHtml(spotlight.summary)}</p>
      <p class="infotainment-live-line" data-service-link>
        <span data-service-source>${escapeHtml(spotlight.source)}</span>
        <a href="${spotlight.url}" target="_blank" rel="noopener noreferrer">Read the original story</a>
      </p>
      <div class="infotainment-actions">
        ${iconAction(spotlight.url, spotlight.domain, `Read the original ${spotlight.source} story about ${spotlight.name}`)}
        ${iconAction("https://www.hfotusa.org/get-involved/support_our_mission/ways_donate/", "hfotusa.org", "Donate to Homes For Our Troops")}
        ${iconAction("https://www.redcross.org/get-help/military-families.html", "redcross.org", "American Red Cross services for military and veteran families")}
      </div>
    </div>`;

  const serviceMedia = (spotlight) => `
    <a class="infotainment-feature-media infotainment-feature-media--person" data-service-media href="${spotlight.url}" target="_blank" rel="noopener noreferrer" aria-label="Read the original ${escapeHtml(spotlight.source)} story about ${escapeHtml(spotlight.name)}">
      <img class="infotainment-feature-person" data-service-image src="${spotlight.image}" data-fallback-src="${spotlight.fallbackImage}" alt="${escapeHtml(spotlight.name)}" loading="lazy">
      <span class="infotainment-feature-shade" aria-hidden="true"></span>
      <span class="infotainment-feature-source"><img src="${orgIcon(spotlight.domain, 128)}" alt="" width="28" height="28"><strong data-service-media-source>${escapeHtml(spotlight.source)}</strong></span>
    </a>`;

  const serviceSlide = () => {
    const spotlight = currentService();
    return slideShell(
      2,
      "service",
      splitPanel(serviceMedia(spotlight), servicePanel(spotlight)),
      imageMedia("assets/images/hero-scene-work.webp", "Current service, courage and teamwork spotlight"),
      ["dvids", "hfot", "redcross"]
    );
  };

  const quoteSlide = () => {
    const quote = nextQuote();
    return slideShell(3, "quote", `
      <div class="infotainment-panel infotainment-panel--quote">
        <p class="infotainment-kicker">A LITTLE LYTE FOR THE ROAD</p>
        <blockquote class="infotainment-quote">
          <p data-infotainment-quote>“${escapeHtml(quote.text)}”</p>
          <footer data-infotainment-author>— ${escapeHtml(quote.author)}</footer>
        </blockquote>
      </div>`,
      imageMedia("assets/images/hero-scene-school.webp", "Community learning and creative lighting scene"),
      ["redcross", "habitat", "ldf", "naacp", "dvids", "hfot"]
    );
  };

  const buildSlides = () => [humanitarianSlide(), rightsSlide(), serviceSlide(), quoteSlide()].join("");

  const renderSpotlight = (root, type, spotlight) => {
    const panel = root.querySelector(`[data-spotlight-panel="${type}"]`);
    if (!panel || !spotlight) return;
    panel.querySelector("[data-spotlight-kicker]").textContent = spotlight.kicker;
    panel.querySelector("[data-spotlight-title]").textContent = spotlight.name;
    panel.querySelector("[data-spotlight-summary]").textContent = spotlight.summary;
    const live = panel.querySelector("[data-spotlight-live]");
    live.dataset.liveFeed = spotlight.key;
    const liveLink = live.querySelector("a");
    liveLink.href = spotlight.news;
    liveLink.textContent = `${spotlight.name} news`;
    panel.querySelector("[data-spotlight-actions]").innerHTML =
      iconAction(spotlight.donate, spotlight.domain, `Donate to ${spotlight.name}`) +
      iconAction(spotlight.home, spotlight.domain, `Visit ${spotlight.name}`);
    const media = root.querySelector(`[data-feature-media="${type}"]`);
    if (media) {
      media.href = spotlight.home;
      const scene = media.querySelector("[data-feature-scene]");
      if (scene) scene.src = spotlight.scene;
      const icon = media.querySelector("[data-feature-icon]");
      if (icon) icon.src = orgIcon(spotlight.domain, 128);
      const name = media.querySelector("[data-feature-name]");
      if (name) name.textContent = spotlight.name;
      media.setAttribute("aria-label", `Visit ${spotlight.name}`);
    }
    const item = nextFeedItem(spotlight.key);
    if (item) {
      liveLink.href = item.url;
      liveLink.textContent = item.title;
    }
  };

  const refreshServiceSpotlight = (root) => {
    const spotlight = currentService();
    const panel = root.querySelector("[data-service-panel]");
    const media = root.querySelector("[data-service-media]");
    if (!panel || !media) return;

    panel.querySelector("[data-service-kicker]").textContent = spotlight.kicker;
    panel.querySelector("[data-service-title]").textContent = spotlight.name;
    panel.querySelector("[data-service-summary]").textContent = spotlight.summary;
    panel.querySelector("[data-service-source]").textContent = spotlight.source;
    const link = panel.querySelector("[data-service-link] a");
    link.href = spotlight.url;
    link.textContent = "Read the original story";

    media.href = spotlight.url;
    media.setAttribute("aria-label", `Read the original ${spotlight.source} story about ${spotlight.name}`);
    const image = media.querySelector("[data-service-image]");
    image.src = spotlight.image;
    image.dataset.fallbackSrc = spotlight.fallbackImage;
    image.alt = spotlight.name;
    const source = media.querySelector("[data-service-media-source]");
    if (source) source.textContent = spotlight.source;
    const sourceIcon = media.querySelector(".infotainment-feature-source img");
    if (sourceIcon) sourceIcon.src = orgIcon(spotlight.domain, 128);
  };

  const ghostItemsForSlide = (slide) => {
    const keys = (slide.querySelector("[data-ghost-keys]")?.dataset.ghostKeys || "")
      .split(",").map((key) => key.trim()).filter(Boolean);
    const pool = [];
    keys.forEach((key) => {
      const liveItems = feedCache.get(key)?.items || [];
      const items = liveItems.length ? liveItems : (GHOST_FALLBACKS[key] || []);
      items.slice(0, 5).forEach((item) => pool.push({ ...item, key }));
    });
    if (pool.length < 3) {
      keys.forEach((key) => {
        (GHOST_FALLBACKS[key] || []).forEach((item) => {
          if (!pool.some((candidate) => candidate.title === item.title)) pool.push({ ...item, key });
        });
      });
    }
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  };

  const FEED_LABELS = Object.freeze({
    redcross: "RED CROSS",
    habitat: "HABITAT",
    ldf: "LDF",
    naacp: "NAACP",
    dvids: "DVIDS",
    hfot: "HFOT"
  });

  const populateGhosts = (slide) => {
    const cards = [...slide.querySelectorAll(".infotainment-ghost-card")];
    if (!cards.length) return;
    const items = ghostItemsForSlide(slide);
    cards.forEach((card, index) => {
      const item = items[index];
      if (!item) {
        card.replaceChildren();
        card.classList.remove("is-readable");
        return;
      }
      const excerpt = item.description ? `<p>${escapeHtml(item.description)}</p>` : "";
      card.innerHTML = `<span>${escapeHtml(FEED_LABELS[item.key] || item.key)}</span><strong>${escapeHtml(item.title)}</strong>${excerpt}`;
      card.classList.toggle("is-readable", index === 0);
    });
  };

  const startGhostCycle = (slide) => {
    window.clearInterval(ghostTimer);
    populateGhosts(slide);
    const cards = [...slide.querySelectorAll(".infotainment-ghost-card")].filter((card) => card.textContent.trim());
    if (cards.length < 2) return;
    let activeGhost = 0;
    ghostTimer = window.setInterval(() => {
      cards[activeGhost].classList.remove("is-readable");
      activeGhost = (activeGhost + 1) % cards.length;
      cards[activeGhost].classList.add("is-readable");
    }, 3000);
  };

  const hydrateFeedTargets = (root, keys = Object.keys(FEEDS)) => {
    keys.forEach((key) => {
      const item = nextFeedItem(key);
      if (!item) return;
      root.querySelectorAll(`[data-live-feed="${key}"] a`).forEach((link) => {
        link.textContent = item.title;
        link.href = item.url;
      });
    });
  };

  const loadAllFeeds = async (root, force = false) => {
    const keys = Object.keys(FEEDS);
    await Promise.allSettled(keys.map((key) => loadFeed(key, force)));
    hydrateFeedTargets(root, keys);
    const activeSlide = root.querySelector(".infotainment-slide.is-active");
    if (activeSlide) {
      if (activeSlide.dataset.slideKind === "service") refreshServiceSpotlight(root);
      startGhostCycle(activeSlide);
    }
  };

  const initSlider = (root) => {
    if (!root || root.dataset.infotainmentReady === "true") return;
    root.dataset.infotainmentReady = "true";
    root.style.setProperty("--infotainment-duration", `${SLIDE_MS}ms`);
    root.setAttribute("tabindex", "0");
    root.setAttribute("aria-roledescription", "rotating spotlight");

    const stage = document.createElement("div");
    stage.className = "infotainment-stage";
    stage.innerHTML = buildSlides();
    root.prepend(stage);
    root.classList.add("is-ready");

    const slides = [...stage.querySelectorAll(".infotainment-slide")];
    stage.addEventListener("error", (event) => {
      const target = event.target;
      if (target.matches?.(".infotainment-icon-button img")) {
        target.style.display = "none";
        return;
      }
      const image = target.closest?.("img[data-fallback-src]");
      if (!image || image.dataset.fallbackApplied === "true") return;
      image.dataset.fallbackApplied = "true";
      image.src = image.dataset.fallbackSrc;
    }, true);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let index = 0;
    let timer = 0;
    let paused = reduceMotion;
    let cycleCount = 0;

    const restartProgress = () => {
      root.classList.remove("is-timing");
      void root.offsetWidth;
      if (!paused) root.classList.add("is-timing");
    };

    const schedule = () => {
      window.clearTimeout(timer);
      if (!paused) timer = window.setTimeout(() => show(index + 1), SLIDE_MS);
      restartProgress();
    };

    const refreshQuote = (slide) => {
      if (slide.dataset.slideKind !== "quote") return;
      const quote = nextQuote();
      const text = slide.querySelector("[data-infotainment-quote]");
      const author = slide.querySelector("[data-infotainment-author]");
      if (text) text.textContent = `“${quote.text}”`;
      if (author) author.textContent = `— ${quote.author}`;
    };

    function show(nextIndex) {
      const normalized = (nextIndex + slides.length) % slides.length;
      const wrapped = nextIndex >= slides.length || nextIndex < 0;
      slides.forEach((slide) => {
        slide.classList.remove("is-active", "is-entering");
        slide.setAttribute("aria-hidden", "true");
      });
      index = normalized;
      const next = slides[index];
      next.classList.add("is-active", "is-entering");
      next.setAttribute("aria-hidden", "false");

      if (next.dataset.slideKind === "humanitarian") {
        humanitarianIndex = (humanitarianIndex + 1) % HUMANITARIAN_SPOTLIGHTS.length;
        renderSpotlight(root, "humanitarian", currentHumanitarian());
      } else if (next.dataset.slideKind === "rights") {
        rightsIndex = (rightsIndex + 1) % RIGHTS_SPOTLIGHTS.length;
        renderSpotlight(root, "rights", currentRights());
      } else if (next.dataset.slideKind === "service") {
        serviceIndex = (serviceIndex + 1) % SERVICE_SPOTLIGHTS.length;
        refreshServiceSpotlight(root);
      }

      refreshQuote(next);
      startGhostCycle(next);
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => next.classList.remove("is-entering")));

      if (wrapped && index === 0) {
        cycleCount += 1;
        hydrateFeedTargets(root);
        if (cycleCount % 12 === 0) {
          loadAllFeeds(root, true);
          loadQuotePool(true);
        }
      }
      schedule();
    }

    root.addEventListener("click", (event) => {
      if (event.button !== 0 || event.target.closest("a, button, iframe")) return;
      event.preventDefault();
      show(index - 1);
    });

    root.addEventListener("contextmenu", (event) => {
      if (event.target.closest("a, button, iframe")) return;
      event.preventDefault();
      show(index + 1);
    });

    root.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        show(index - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        show(index + 1);
      } else if (event.key === " ") {
        event.preventDefault();
        paused = !paused;
        root.classList.toggle("is-paused", paused);
        schedule();
      }
    });

    loadAllFeeds(root);
    loadQuotePool();
    startGhostCycle(slides[0]);
    schedule();
  };

  const init = () => {
    document.querySelectorAll("header[data-shynetyme-infotainment]").forEach(initSlider);
  };

  window.ShynetymeInfotainmentLoaded = { initialized: true, init };
  init();
})();



/* ==========================================================================
   MODULE: Chuck helper widget
   ========================================================================== */

(() => {
  "use strict";

  if (window.ShynetymeChuck?.mounted) return;

  const REVISION = "20260814-chuck-atlas-v1";
  const scriptElement = document.currentScript;
  const scriptUrl = scriptElement?.src
    ? new URL(scriptElement.src, window.location.href)
    : new URL("assets/js/site-chuck.js", window.location.href);
  const siteRoot = new URL("../../", scriptUrl);

  const atlasUrl = new URL(`assets/brand/pet-chuck-v2-atlas.png?v=${REVISION}`, siteRoot).href;
  const fallbackImageUrl = new URL("assets/brand/pet-chuck-mark.png", siteRoot).href;
  const bikeBuilderUrl = new URL("ledbikesim.html", siteRoot).href;
  const homeBuilderUrl = new URL("ledhomesim.html", siteRoot).href;
  const autoBuilderUrl = new URL("LEDAutoSim.html", siteRoot).href;
  const aboutDekeUrl = new URL("aboutme.html", siteRoot).href;

  const ensureWidget = () => {
    const existing = document.getElementById("dekeChuckWidget");
    if (existing) return existing;
    const widget = document.createElement("div");
    widget.className = "deke-chuck-widget";
    widget.id = "dekeChuckWidget";
    widget.innerHTML = `
      <div class="deke-chuck-thought" id="dekeChuckThought" role="status" aria-live="polite" hidden>
        <button class="deke-chuck-thought__close" id="dekeChuckClose" type="button" aria-label="Close Chuck's message">×</button>
        <p class="deke-chuck-thought__text" id="dekeChuckText"></p>
        <a class="deke-chuck-thought__action" id="dekeChuckAction" href="#"></a>
        <div class="deke-chuck-thought__choices" id="dekeChuckChoices" hidden></div>
      </div>
      <button class="deke-chuck-trigger" id="dekeChuckTrigger" type="button" aria-expanded="false" aria-controls="dekeChuckThought" aria-label="Tickle Chuck for another thought">
        <img class="chuck-fallback-image" src="${fallbackImageUrl}" width="118" height="118" alt="Chuck, the ShyneTyme.Works robot-cat helper">
        <span class="deke-chuck-scroll-sprite" aria-hidden="true"></span>
      </button>`;
    document.body.appendChild(widget);
    return widget;
  };

  const widget = ensureWidget();
  const trigger = widget.querySelector("#dekeChuckTrigger");
  const thought = widget.querySelector("#dekeChuckThought");
  const text = widget.querySelector("#dekeChuckText");
  const action = widget.querySelector("#dekeChuckAction");
  const choices = widget.querySelector("#dekeChuckChoices");
  const close = widget.querySelector("#dekeChuckClose");

  if (!trigger || !thought || !text || !action || !choices || !close) return;
  if (widget.dataset.chuckMounted === "true") return;
  widget.dataset.chuckMounted = "true";

  const simChoices = [
    { label: "Bike", href: bikeBuilderUrl },
    { label: "Home", href: homeBuilderUrl },
    { label: "Auto", href: autoBuilderUrl }
  ];

  /* Useful prompts only. Tutorial chatter intentionally removed. */
  const rotatingMessages = [
    { text: "What do you want to light?", choices: simChoices },
    { text: "Need Shyne?\nTry the LED SIM Factory.", choices: simChoices }
  ];

  const MESSAGE_VISIBLE_MS = 11000;
  const SCROLL_STOP_MS = 560;
  const AMBIENT_MIN_MS = 2800;
  const AMBIENT_MAX_MS = 5200;
  const AMBIENT_STATES = ["wave", "jump", "waiting", "active-work", "review", "celebrate", "sleep", "wave", "active-work"];

  let chuckAnimation = null;
  let messageIndex = -1;
  let previousScrollY = window.scrollY;
  let scrollStopTimer = 0;
  let hideTimer = 0;
  let ambientTimer = 0;
  let clickActionIndex = 0;

  const randomAmbientDelay = () => Math.round(AMBIENT_MIN_MS + Math.random() * (AMBIENT_MAX_MS - AMBIENT_MIN_MS));
  const clearAmbient = () => {
    window.clearTimeout(ambientTimer);
    ambientTimer = 0;
  };

  const scheduleAmbient = (delay = randomAmbientDelay()) => {
    clearAmbient();
    ambientTimer = window.setTimeout(() => {
      if (!chuckAnimation || document.hidden || widget.classList.contains("is-searching")) {
        scheduleAmbient(1200);
        return;
      }
      const state = AMBIENT_STATES[Math.floor(Math.random() * AMBIENT_STATES.length)] || "wave";
      chuckAnimation.playOnce(state, () => {
        chuckAnimation.stop();
        scheduleAmbient();
      });
    }, delay);
  };

  Promise.resolve(window.ShynetymeChuckSprite || null).then((spriteApi) => {
    chuckAnimation = spriteApi?.mount({
      button: trigger,
      image: trigger.querySelector("img"),
      atlasUrl
    }) || null;
    chuckAnimation?.stop();
    scheduleAmbient(1100);
  });

  const hideThought = () => {
    window.clearTimeout(hideTimer);
    thought.classList.remove("is-visible", "is-materializing", "has-choices");
    trigger.setAttribute("aria-expanded", "false");
    window.setTimeout(() => {
      if (!thought.classList.contains("is-visible")) thought.hidden = true;
    }, 820);
  };

  const materializeThought = () => {
    thought.classList.remove("is-materializing");
    void thought.offsetWidth;
    thought.classList.add("is-materializing");
  };

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

  const renderChoices = (items = []) => {
    choices.innerHTML = items.map((item, index) => {
      const label = escapeHtml(item?.label || `Choice ${index + 1}`);
      const href = escapeHtml(item?.href || "#");
      const actionName = escapeHtml(item?.action || "");
      const className = item?.primary ? " is-primary" : "";
      return `<a class="deke-chuck-thought__choice${className}" href="${href}" data-chuck-choice="${actionName}">${label}</a>`;
    }).join("");
    choices.hidden = !items.length;
    thought.classList.toggle("has-choices", Boolean(items.length));
  };

  const showMessage = (message, visibleMs = MESSAGE_VISIBLE_MS) => {
    if (!message) return;
    window.clearTimeout(hideTimer);
    text.textContent = String(message.text || "");

    const messageChoices = Array.isArray(message.choices) ? message.choices.filter(Boolean) : [];
    renderChoices(messageChoices);

    if (messageChoices.length) {
      action.hidden = true;
      action.textContent = "";
      action.removeAttribute("href");
    } else if (message.label && message.href) {
      action.hidden = false;
      action.textContent = String(message.label);
      action.href = String(message.href);
    } else {
      action.hidden = true;
      action.textContent = "";
      action.removeAttribute("href");
    }

    thought.hidden = false;
    materializeThought();
    window.requestAnimationFrame(() => {
      thought.classList.add("is-visible");
      trigger.setAttribute("aria-expanded", "true");
    });

    if (visibleMs > 0) hideTimer = window.setTimeout(hideThought, visibleMs);
  };

  const showChoices = (textValue, choiceItems, visibleMs = 0) => {
    showMessage({ text: textValue, choices: choiceItems }, visibleMs);
  };

  const showNextMessage = () => {
    messageIndex = (messageIndex + 1) % rotatingMessages.length;
    showMessage(rotatingMessages[messageIndex]);
  };

  const playOnceThenAmbient = (state) => {
    if (!chuckAnimation) return;
    clearAmbient();
    chuckAnimation.playOnce(state, () => {
      chuckAnimation.stop();
      scheduleAmbient();
    });
  };

  const handleScroll = () => {
    hideThought();
    clearAmbient();
    const currentScrollY = window.scrollY;
    const direction = currentScrollY < previousScrollY ? "research" : "laptop";
    previousScrollY = currentScrollY;
    widget.classList.add("is-searching");
    widget.classList.toggle("is-scroll-research", direction === "research");
    widget.classList.toggle("is-scroll-laptop", direction === "laptop");
    chuckAnimation?.pause();

    window.clearTimeout(scrollStopTimer);
    scrollStopTimer = window.setTimeout(() => {
      widget.classList.remove("is-searching", "is-scroll-research", "is-scroll-laptop");
      chuckAnimation?.stop();
      scheduleAmbient(900);
    }, SCROLL_STOP_MS);
  };

  trigger.addEventListener("click", () => {
    widget.classList.remove("is-searching", "is-scroll-research", "is-scroll-laptop");
    const clickStates = ["wave", "celebrate", "jump"];
    playOnceThenAmbient(clickStates[clickActionIndex++ % clickStates.length]);
    showNextMessage();
  });

  choices.addEventListener("click", (event) => {
    const choice = event.target.closest("[data-chuck-choice]");
    if (!choice) return;
    const actionName = choice.dataset.chuckChoice || "";
    if (actionName === "dismiss") {
      event.preventDefault();
      hideThought();
      return;
    }
    if (actionName === "next") {
      event.preventDefault();
      showNextMessage();
      return;
    }
    if (actionName) {
      event.preventDefault();
      document.dispatchEvent(new CustomEvent("shynetyme:chuck-choice", {
        detail: { action: actionName, element: choice }
      }));
    }
  });

  close.addEventListener("click", hideThought);
  window.addEventListener("scroll", handleScroll, { passive: true });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hideThought();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearAmbient();
      chuckAnimation?.pause();
    } else {
      chuckAnimation?.stop();
      scheduleAmbient(700);
    }
  });

  /* Callable emotional states for future site events. */
  document.addEventListener("shynetyme:chuck-success", () => playOnceThenAmbient("celebrate"));
  document.addEventListener("shynetyme:chuck-failure", () => playOnceThenAmbient("failure"));
  document.addEventListener("shynetyme:chuck-working", () => playOnceThenAmbient("active-work"));
  document.addEventListener("shynetyme:chuck-review", () => playOnceThenAmbient("review"));

  window.ShynetymeChuck = {
    mounted: true,
    widget,
    showMessage,
    showChoices,
    showNextMessage,
    hideThought,
    showWelcome: () => showMessage(rotatingMessages[0], MESSAGE_VISIBLE_MS),
    play: (state, options = {}) => chuckAnimation?.play(state, options),
    playOnce: (state) => playOnceThenAmbient(state),
    urls: {
      siteRoot: siteRoot.href,
      bike: bikeBuilderUrl,
      home: homeBuilderUrl,
      auto: autoBuilderUrl,
      about: aboutDekeUrl,
      atlas: atlasUrl
    }
  };

  window.addEventListener("pagehide", () => {
    clearAmbient();
    chuckAnimation?.pause();
    window.clearTimeout(scrollStopTimer);
    window.clearTimeout(hideTimer);
  }, { once: true });
})();



/* ==========================================================================
   MODULE: Simulator-to-project design chain
   ========================================================================== */

(() => {
  "use strict";

  if (window.ShynetymeDesignChain?.initialized) return;

  const chuck = window.ShynetymeChuck;
  if (!chuck?.showMessage || !chuck?.showChoices) return;

  const scriptUrl = document.currentScript?.src
    ? new URL(document.currentScript.src, window.location.href)
    : new URL("assets/js/customer-design-chain.js", window.location.href);
  const siteRoot = new URL("../../", scriptUrl);
  const pageKey = (window.location.pathname.split("/").filter(Boolean).pop() || "index.html").toLowerCase();

  const DESIGN_KEY = "shynetymeDesignChainDraft";
  const CONTACT_KEY = "shynetymeContactDraft";
  const RECOMMENDATIONS_URL = new URL("project-recommendations.html", siteRoot);
  const CONTACT_URL = new URL("contact.html", siteRoot);

  const projectPages = {
    "ledbikesim.html": { type: "bike", label: "LED Bike Simulator" },
    "ledhomesim.html": { type: "home", label: "LED Home Simulator" },
    "ledautosim.html": { type: "auto", label: "LED Auto Simulator" }
  };

  const serviceSupport = {
    measurement: {
      id: "service-measurement-layout",
      name: "Measurement and Layout Package",
      category: "Design",
      description: "Final lengths, zone map, wire routes, controller placement and power-injection points are verified before ordering."
    },
    installation: {
      id: "service-installation-hardware",
      name: "Installation Hardware and Fabrication",
      category: "Installation",
      description: "Mounting, brackets, channels, fasteners, adhesives, sealing and custom fabrication are finalized for the selected project."
    },
    power: {
      id: "service-power-design",
      name: "Power, Fusing and Distribution Design",
      category: "Power",
      description: "Wire gauge, fusing, conversion, supply capacity and injection are calculated from the exact selected lighting rows."
    }
  };

  const catalogPromise = Promise.resolve(window.SHYNETYME_BTF_CATALOG || { products: [] });

  const setsPromise = Promise.resolve(window.SHYNETYME_BTF_RECOMMENDATION_SETS || {});

  let inputTimer = 0;
  let hasAnnouncedSuggestions = false;

  const readDraft = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(DESIGN_KEY) || "null");
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  };

  const isVisible = (element) => {
    if (!(element instanceof HTMLElement) || element.hidden) return false;
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden";
  };

  const fieldLabel = (field) => {
    const explicit = field.id ? document.querySelector(`label[for="${CSS.escape(field.id)}"]`) : null;
    const wrapping = field.closest("label");
    return String(
      explicit?.textContent ||
      wrapping?.textContent ||
      field.getAttribute("aria-label") ||
      field.getAttribute("title") ||
      field.name ||
      field.id ||
      "Option"
    ).replace(/\s+/g, " ").trim().slice(0, 120);
  };

  const collectSelections = () => {
    const selections = [];
    const fields = [...document.querySelectorAll("main input, main select, main textarea, form input, form select, form textarea")];

    for (const field of fields) {
      if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) continue;
      if (field.disabled || field.type === "hidden" || field.closest("#dekeChuckWidget")) continue;
      if (!isVisible(field) && !["checkbox", "radio"].includes(field.type)) continue;

      let value = "";
      if (field instanceof HTMLInputElement && ["checkbox", "radio"].includes(field.type)) {
        if (!field.checked) continue;
        value = field.value && field.value !== "on" ? field.value : "Selected";
      } else if (field instanceof HTMLSelectElement) {
        value = field.selectedOptions[0]?.textContent?.trim() || field.value;
        if (!value || /^(select|choose|none)/i.test(value)) continue;
      } else {
        value = String(field.value || "").trim();
        if (!value) continue;
      }

      selections.push({
        label: fieldLabel(field),
        value: String(value).replace(/\s+/g, " ").trim().slice(0, 180)
      });
      if (selections.length >= 90) break;
    }

    [...document.querySelectorAll("main [aria-pressed='true'], main .is-selected, main .selected")]
      .filter((element) => !element.closest("nav, .navbar, #dekeChuckWidget, .carousel-indicators"))
      .map((element) => String(element.getAttribute("aria-label") || element.textContent || "").replace(/\s+/g, " ").trim())
      .filter((value) => value && value.length <= 140)
      .slice(0, 30)
      .forEach((value) => selections.push({ label: "Selected area or effect", value }));

    return selections.filter((selection, index, list) =>
      list.findIndex((item) => `${item.label}|${item.value}` === `${selection.label}|${selection.value}`) === index
    );
  };

  const collectVisibleSummary = () => {
    const candidates = [
      document.getElementById("buildSummary"),
      document.getElementById("homeBuildSummary"),
      document.querySelector(".build-summary"),
      document.querySelector("[id*='build'][id*='summary']"),
      document.querySelector("[class*='build'][class*='summary']")
    ].filter(Boolean);
    return candidates
      .map((element) => String(element.textContent || "").replace(/\s+/g, " ").trim())
      .find((value) => value.length >= 20)
      ?.slice(0, 5000) || "";
  };

  const selectionText = (selections) => selections
    .map((selection) => `${selection.label}: ${selection.value}`)
    .join("\n");

  const detectsOutdoor = (type, text) => {
    const normalized = String(text || "").toLowerCase();
    if (type === "bike") {
      return /wheel|frame|basket|flag|turn signal|tail|brake|delivery|rain|outdoor|exterior|waterproof/.test(normalized);
    }
    if (type === "auto") {
      return /underglow|underbody|rocker|wheel|grille|exterior|outside|roof|truck bed|bumper|rain|waterproof/.test(normalized);
    }
    return /garage|path|yard|outdoor|exterior|soffit|patio|roof|landscape|porch|driveway|fence|pool|waterproof/.test(normalized);
  };

  const buildProductMap = (items = []) => {
    const map = new Map();
    const legacyCatalogIds = {
      "strip-ws2811-smd5050-rgb": "ws2811-smd5050-rgb-ordinary",
      "fcob-solid-white-warm-white": "fcob-solid-warm-white-ip65",
      "fcob-solid-white-natural-white": "fcob-solid-natural-white-ip65",
      "fcob-solid-white-cold-white": "fcob-solid-cold-white-ip65",
      "fcob-cct-2700-6000": "fcob-cct-2700-6000k-ip65",
      "fcob-spi-rgbic-addressable": "fcob-spi-rgbic-addressable-ip66",
      "fcob-spi-rgbw-addressable": "fcob-spi-rgbw-addressable-ip66"
    };
    items.forEach((product) => {
      map.set(product.id, product);
      map.set(`strip-${product.id}`, product);
      (product.legacyIds || []).forEach((legacyId) => map.set(legacyId, product));
    });
    Object.entries(legacyCatalogIds).forEach(([legacyId, currentId]) => {
      const product = map.get(currentId);
      if (product) map.set(legacyId, product);
    });
    return map;
  };

  const recommendationEngine = async (type, selections, existing = {}) => {
    const [catalog, sets] = await Promise.all([catalogPromise, setsPromise]);
    const summary = `${selectionText(selections)} ${existing.summary || ""}`;
    const environment = detectsOutdoor(type, summary) ? "outdoor" : "indoor";
    const pool = Array.isArray(sets?.[type]?.[environment]) ? sets[type][environment] : [];
    const productMap = buildProductMap(catalog.products || []);
    const recommendations = [...new Map(pool
      .map((entry) => productMap.get(entry.id))
      .filter(Boolean)
      .map((product) => [product.id, product])).values()]
      .map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        voltages: product.voltages,
        waterproof: product.waterproof,
        image: product.image || "",
        sourceItems: product.sourceItems
      }));

    const flags = { ...(existing.flags || {}) };
    if (type === "home" && /garage/i.test(summary)) flags.garageBorder = true;
    if (type === "home" && /panel|story animation/i.test(summary)) flags.garagePanelStories = true;

    return {
      environment,
      recommendedProducts: recommendations,
      recommendedFamilyIds: recommendations.map((product) => product.id),
      supportItems: [serviceSupport.measurement, serviceSupport.installation, serviceSupport.power],
      flags
    };
  };

  const saveDraft = async (reason = "simulator-input") => {
    const page = projectPages[pageKey];
    if (!page) return readDraft();

    const previous = readDraft() || {};
    const sameProject = previous.projectType === page.type;
    const selections = collectSelections();
    const visibleSummary = collectVisibleSummary();
    const recommendation = await recommendationEngine(page.type, selections, {
      ...(sameProject ? previous : {}),
      summary: visibleSummary || (sameProject ? previous.summary : "") || ""
    });

    const selectedIds = sameProject && previous.selectionCustomized && Array.isArray(previous.selectedFamilyIds)
      ? previous.selectedFamilyIds.filter((id) => recommendation.recommendedFamilyIds.includes(id))
      : recommendation.recommendedFamilyIds;

    const draft = {
      version: 2,
      source: "simulator",
      reason,
      projectType: page.type,
      projectLabel: page.label,
      simulatorPage: pageKey,
      environment: recommendation.environment,
      selections,
      summary: visibleSummary || selectionText(selections),
      recommendedProducts: recommendation.recommendedProducts,
      recommendedFamilyIds: recommendation.recommendedFamilyIds,
      selectedFamilyIds: selectedIds,
      supportItems: recommendation.supportItems,
      selectedSupportIds: sameProject && previous.selectionCustomized && Array.isArray(previous.selectedSupportIds)
        ? previous.selectedSupportIds
        : recommendation.supportItems.map((item) => item.id),
      selectionCustomized: Boolean(sameProject && previous.selectionCustomized),
      flags: recommendation.flags,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(DESIGN_KEY, JSON.stringify(draft));
    return draft;
  };

  const materialSummary = (draft) => {
    const productMap = new Map((draft.recommendedProducts || []).map((product) => [product.id, product]));
    const selectedProducts = (draft.selectedFamilyIds || draft.recommendedFamilyIds || [])
      .map((id) => productMap.get(id))
      .filter(Boolean);
    const selectionLines = draft.selections?.length
      ? draft.selections.map((item) => `- ${item.label}: ${item.value}`).join("\n")
      : "- Simulator options will be finalized during consultation.";
    const productLines = selectedProducts.length
      ? selectedProducts.map((product) => `- ${product.name} (${product.voltages}; ${product.waterproof})`).join("\n")
      : "- Exact catalog rows will be finalized during consultation.";
    const supportLines = (draft.supportItems || [])
      .filter((item) => !draft.selectedSupportIds || draft.selectedSupportIds.includes(item.id))
      .map((item) => `- ${item.name}`)
      .join("\n");

    return [
      draft.projectLabel || "ShyneTyme.Works LED Project",
      `Environment: ${draft.environment || "indoor"}`,
      "",
      "Simulator selections:",
      selectionLines,
      "",
      "Selected exact catalog items:",
      productLines,
      "",
      "Project services:",
      supportLines,
      draft.flags?.garagePanelStories ? "\nComing soon interest: Garage-door LED panel story animations." : ""
    ].filter(Boolean).join("\n");
  };

  const writeContactDraft = async (draft = readDraft()) => {
    if (!draft) return null;
    const catalog = await catalogPromise;
    const productMap = buildProductMap(catalog.products || []);
    const selectedProducts = [...new Map((draft.selectedFamilyIds || draft.recommendedFamilyIds || [])
      .map((id) => productMap.get(id))
      .filter(Boolean)
      .map((product) => [product.id, product])).values()];
    const selectedSupport = (draft.supportItems || [])
      .filter((item) => !draft.selectedSupportIds || draft.selectedSupportIds.includes(item.id));
    const now = new Date().toISOString();

    const project = [
      ...selectedProducts.map((product) => ({
        key: `design-${product.id}`,
        productId: product.id,
        productName: product.name,
        category: product.category,
        sourceItems: product.sourceItems,
        variant: {
          item: product.sourceItem || "Selected",
          length: product.length,
          voltage: product.voltages,
          density: product.densities,
          waterproof: product.waterproof,
          width: product.widths,
          detail: product.productDetails || product.description
        },
        addedAt: now
      })),
      ...selectedSupport.map((item) => ({
        key: `design-${item.id}`,
        productId: item.id,
        productName: item.name,
        category: item.category,
        sourceItems: item.description,
        variant: null,
        addedAt: now
      }))
    ];

    const contactDraft = {
      source: "design-chain",
      createdAt: now,
      project,
      summary: materialSummary(draft),
      requestType: "Complete LED materials and installation consultation",
      pricingModel: "ShyneTyme.Works-supplied materials, design, controls, fabrication and installation",
      designDraft: draft
    };
    localStorage.setItem(CONTACT_KEY, JSON.stringify(contactDraft));
    return contactDraft;
  };

  const recommendationsHref = (draft = readDraft()) => {
    const url = new URL(RECOMMENDATIONS_URL);
    if (draft?.projectType) url.searchParams.set("type", draft.projectType);
    if (draft?.environment) url.searchParams.set("environment", draft.environment);
    return url.href;
  };

  const showSuggestionsReady = (draft) => {
    if (!draft) return;
    const total = draft.recommendedFamilyIds?.length || 0;
    chuck.showChoices(
      `I matched ${total} exact catalog items\nfor this ${draft.environment} ${draft.projectType} build.`,
      [
        { label: "Suggested Items", href: recommendationsHref(draft), primary: true },
        { label: "Keep Designing", action: "dismiss" }
      ],
      0
    );
  };

  const showBuildDecision = async () => {
    const draft = await saveDraft("build-output");
    if (!draft) return;
    await writeContactDraft(draft);
    chuck.showChoices(
      "How about reviewing the exact catalog items matched to your selections?",
      [
        { label: "Go Here", href: recommendationsHref(draft), primary: true },
        { label: "Consultation", action: "consultation" }
      ],
      0
    );
  };

  const installHomeComingSoon = (attempt = 0) => {
    if (pageKey !== "ledhomesim.html" || document.getElementById("garagePanelStoryComingSoon")) return;
    const candidates = [...document.querySelectorAll("main label, main button, main h2, main h3, main h4, main .form-check, main .option-card, main .accordion-item")]
      .filter((element) => /garage/i.test(element.textContent || ""));
    const anchor = candidates.sort((a, b) => (a.textContent || "").length - (b.textContent || "").length)[0]
      || document.querySelector("main form")
      || document.querySelector("main");
    if (!anchor && attempt < 12) {
      window.setTimeout(() => installHomeComingSoon(attempt + 1), 350);
      return;
    }
    if (!anchor) return;

    const card = document.createElement("div");
    card.id = "garagePanelStoryComingSoon";
    card.className = "design-chain-coming-soon";
    card.innerHTML = `
      <strong>Garage-Door LED Panel Story Animations</strong>
      <p>Animated panel stories for children, holidays and custom scenes are planned. Garage-door border lighting can be designed now.</p>
      <button class="btn btn-outline-light btn-sm" type="button">Coming Soon</button>`;
    const block = anchor.closest(".accordion-item, .option-card, .form-check, section, fieldset") || anchor;
    block.insertAdjacentElement("afterend", card);

    card.querySelector("button")?.addEventListener("click", async () => {
      const draft = await saveDraft("garage-panel-coming-soon") || {};
      draft.flags = { ...(draft.flags || {}), garagePanelStories: true, garageBorder: true };
      draft.environment = "outdoor";
      localStorage.setItem(DESIGN_KEY, JSON.stringify(draft));
      chuck.showChoices(
        "Panel story animations are coming soon. Garage border items can be reviewed now.",
        [
          { label: "Suggested Border Items", href: recommendationsHref(draft), primary: true },
          { label: "Keep Designing", action: "dismiss" }
        ],
        0
      );
    });
  };

  const isBuildOutputControl = (control) => {
    const label = [control.textContent, control.getAttribute("aria-label"), control.getAttribute("title"), control.id, control.getAttribute("name")]
      .filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    const isCopy = /copy.*(build|summary|notes)|(?:build|summary|notes).*copy/i.test(label);
    const isSend = /(send|request|submit|contact|consult).*(build|quote|project|notes|install)|(?:build|quote|project|notes).*(send|request|submit|contact|consult)/i.test(label);
    const contactLink = control instanceof HTMLAnchorElement
      && /contact\.html/i.test(control.getAttribute("href") || "")
      && Boolean(control.closest("main"));
    return { isCopy, isSend: isSend || contactLink };
  };

  const bindSimulatorEvents = () => {
    if (!projectPages[pageKey]) return;
    const scheduleSave = () => {
      window.clearTimeout(inputTimer);
      inputTimer = window.setTimeout(async () => {
        const draft = await saveDraft("simulator-input");
        if (!draft || hasAnnouncedSuggestions || !draft.selections.length) return;
        hasAnnouncedSuggestions = true;
        showSuggestionsReady(draft);
      }, 650);
    };
    document.addEventListener("change", scheduleSave, true);
    document.addEventListener("input", scheduleSave, true);
    document.addEventListener("click", (event) => {
      const control = event.target.closest("button, a, input[type='button'], input[type='submit']");
      if (!control || control.closest("nav, footer, #dekeChuckWidget")) return;
      const output = isBuildOutputControl(control);
      if (output.isCopy) {
        window.setTimeout(showBuildDecision, 120);
      } else if (output.isSend) {
        event.preventDefault();
        event.stopPropagation();
        showBuildDecision();
      }
    }, true);
  };

  document.addEventListener("shynetyme:chuck-choice", async (event) => {
    if (event.detail?.action !== "consultation") return;
    const draft = projectPages[pageKey] ? await saveDraft("consultation") : readDraft();
    if (draft) await writeContactDraft(draft);
    const url = new URL(CONTACT_URL);
    url.searchParams.set("source", "design-chain");
    url.hash = "contact-request";
    window.location.href = url.href;
  });

  installHomeComingSoon();
  bindSimulatorEvents();

  /* Chuck no longer auto-opens tutorial clouds on page load.
     Contextual guidance remains event-driven after the customer actually interacts. */

  window.ShynetymeDesignChain = {
    initialized: true,
    readDraft,
    saveDraft,
    writeContactDraft,
    recommendationsHref,
    recommendationEngine
  };
})();



/* ==========================================================================
   MODULE: Site initialization and contact handoff
   ========================================================================== */

(() => {
  "use strict";

  if (window.ShynetymeSiteGuide?.initialized) return;
  window.ShynetymeSiteGuide = { initialized: true };

  const CONTACT_DRAFT_KEY = "shynetymeContactDraft";
  const PROJECT_STORAGE_KEY = "shynetymeBtfProject";

  const scriptUrl = document.currentScript?.src
    ? new URL(document.currentScript.src, window.location.href)
    : new URL("assets/js/site.js", window.location.href);
  const siteRoot = new URL("../../", scriptUrl);

  const getPageKey = () => (window.location.pathname.split("/").filter(Boolean).pop() || "index.html").toLowerCase();

  const readContactDraft = () => {
    try {
      const draft = JSON.parse(localStorage.getItem(CONTACT_DRAFT_KEY) || "null");
      return draft && typeof draft === "object" ? draft : null;
    } catch {
      return null;
    }
  };

  const inferProjectType = (draft) => {
    const text = JSON.stringify(draft?.project || []).toLowerCase();
    if (/house|home|room|garage|pathway|yard|property|architectural|exterior/.test(text)) return "House Exterior";
    if (/car|vehicle|auto/.test(text)) return "Car";
    if (/motorcycle/.test(text)) return "Motorcycle";
    if (/boat|marina/.test(text)) return "Boat";
    if (/bike|bicycle|e-bike/.test(text)) return "Bicycle";
    return "Special Request";
  };

  const installContactRequestFields = () => {
    if (getPageKey() !== "contact.html") return;

    const form = document.querySelector(".contact-form");
    const fieldsRow = form?.querySelector(".row.g-3");
    const message = form?.querySelector("#contactMessage");
    if (!form || !fieldsRow || !message || document.getElementById("contactProjectDetails")) return;

    form.id = "contact-request";
    const draft = readContactDraft();
    const project = Array.isArray(draft?.project) ? draft.project : [];
    const selectionSummary = String(draft?.summary || "").trim();

    const section = document.createElement("div");
    section.id = "contactProjectDetails";
    section.className = "col-12";
    section.innerHTML = `
      <section class="contact-project-details" aria-labelledby="contactProjectDetailsTitle">
        <div class="contact-project-details__heading">
          <div>
            <p class="section-kicker mb-1">Project logistics</p>
            <h2 id="contactProjectDetailsTitle" class="h4 mb-1">Materials, delivery and installation address</h2>
          </div>
          <span class="contact-project-details__count">${project.length} selected</span>
        </div>
        <p class="contact-project-details__note">ShyneTyme.Works supplies the approved materials as part of the complete project quote. A material deposit is collected before products are ordered.</p>

        <div class="row g-3">
          <div class="col-12">
            <label class="form-label" for="serviceAddress">Service address</label>
            <input class="form-control" id="serviceAddress" name="service_address" type="text" autocomplete="street-address" placeholder="Street address where the installation will be completed">
          </div>
          <div class="col-md-5">
            <label class="form-label" for="serviceCity">City</label>
            <input class="form-control" id="serviceCity" name="service_city" type="text" autocomplete="address-level2" value="Los Angeles">
          </div>
          <div class="col-md-3">
            <label class="form-label" for="serviceState">State</label>
            <input class="form-control" id="serviceState" name="service_state" type="text" autocomplete="address-level1" value="CA">
          </div>
          <div class="col-md-4">
            <label class="form-label" for="serviceZip">ZIP code</label>
            <input class="form-control" id="serviceZip" name="service_zip" type="text" inputmode="numeric" autocomplete="postal-code">
          </div>
          <div class="col-md-6">
            <label class="form-label" for="materialDelivery">Material delivery</label>
            <select class="form-select" id="materialDelivery" name="material_delivery">
              <option value="hold-for-installation">Hold materials for the scheduled installation</option>
              <option value="service-address">Ship materials to the service address</option>
              <option value="customer-address">Ship materials to a different customer address</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="appointmentTiming">Appointment timing</label>
            <select class="form-select" id="appointmentTiming" name="appointment_timing">
              <option>Schedule after materials arrive</option>
              <option>Need an on-site measurement first</option>
              <option>Requesting an estimate only</option>
            </select>
          </div>
          <div class="col-12 d-none" id="shippingAddressGroup">
            <label class="form-label" for="shippingAddress">Different shipping address</label>
            <textarea class="form-control" id="shippingAddress" name="shipping_address" rows="3" autocomplete="shipping street-address" placeholder="Recipient name and complete delivery address"></textarea>
          </div>
          <div class="col-12">
            <label class="form-label" for="catalogSelectionSummary">Selected catalog systems</label>
            <textarea class="form-control contact-selection-summary" id="catalogSelectionSummary" name="catalog_selections" rows="${project.length ? Math.min(14, Math.max(5, project.length * 3)) : 4}" readonly placeholder="Selections added from the BTF-LIGHTING project catalog will appear here.">${selectionSummary}</textarea>
            <input id="catalogSelectionJson" name="catalog_selection_json" type="hidden" value="">
          </div>
          <div class="col-12">
            <div class="form-check">
              <input class="form-check-input" id="materialDepositAcknowledgement" name="material_deposit_acknowledgement" type="checkbox" value="Acknowledged">
              <label class="form-check-label" for="materialDepositAcknowledgement">I understand that approved project materials require a deposit before ShyneTyme.Works places the order.</label>
            </div>
          </div>
        </div>
      </section>`;

    message.closest(".col-12")?.insertAdjacentElement("beforebegin", section);

    const projectJson = section.querySelector("#catalogSelectionJson");
    if (projectJson) projectJson.value = JSON.stringify(project);

    const delivery = section.querySelector("#materialDelivery");
    const shippingGroup = section.querySelector("#shippingAddressGroup");
    const updateShippingVisibility = () => {
      shippingGroup?.classList.toggle("d-none", delivery?.value !== "customer-address");
    };
    delivery?.addEventListener("change", updateShippingVisibility);
    updateShippingVisibility();

    const projectType = form.querySelector("#contactProject");
    if (draft && projectType) projectType.value = inferProjectType(draft);

    if (selectionSummary && !message.value.trim()) {
      message.value = [
        "I am requesting a complete materials-and-installation quote for the selected lighting systems.",
        "",
        selectionSummary,
        "",
        "Project measurements and effect goals:",
        "Preferred timeline:"
      ].join("\n");
    }

    form.addEventListener("submit", () => {
      if (!selectionSummary || message.value.includes(selectionSummary)) return;
      message.value = `${message.value.trim()}\n\nSelected catalog systems:\n${selectionSummary}`.trim();
    });

    if (window.location.hash === "#contact-request") {
      window.setTimeout(() => form.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    }
  };

  document.documentElement.lang = document.documentElement.lang || "en";
  installContactRequestFields();
})();
