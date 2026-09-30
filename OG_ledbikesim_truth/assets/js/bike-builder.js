(() => {
  "use strict";

  const form = document.getElementById("bikeBuilderForm");
  if (!form) return;

  const summaryList = document.getElementById("buildSummary");
  const budgetSelect = document.getElementById("budget");
  const copyStatus = document.getElementById("copyStatus");
  const mainBike = document.getElementById("mainBikeGroup");
  const kidBike = document.getElementById("kidBikeGroup");
  const rearPanel = document.getElementById("rearViewPanel");
  const appIcons = document.getElementById("appControlIcons");
  const previewCard = document.querySelector(".preview-card");

  const touched = new Set();
  let currentView = "side";

  const bikeStyleLabels = {
    comfort: "Comfort / cruiser bicycle",
    mountain: "Mountain bike",
    bmx: "BMX bike",
    beachCruiser: "Beach cruiser",
    road: "Road bike",
    fatTire: "Fat-tire e-bike",
    stepThroughEb: "Step-through e-bike",
    cargo: "Cargo / delivery bike",
    recumbent: "Recumbent bicycle",
    balance: "Kid's balance bike"
  };

  const sizeConfig = {
    toddler: { label: "Toddler / balance bike", scale: 0.62 },
    preschool: { label: "Small child / preschool bicycle", scale: 0.72 },
    youth: { label: "Youth bicycle", scale: 0.84 },
    teen: { label: "Teen / small-adult bicycle", scale: 0.94 },
    adult: { label: "Adult bicycle", scale: 1 }
  };

  const bikeBodies = {
    comfort: {
      scale: 1,
      bounds: { minX: 105, maxX: 790, minY: 120, maxY: 560 },
      rearWheel: { x: 245, y: 438, r: 122 }, frontWheel: { x: 665, y: 438, r: 122 },
      frame: ["M245 438L450 438L382 286L245 438", "M382 286C418 352 449 350 482 326C520 298 536 252 568 238", "M450 438C495 360 527 292 568 238"],
      metal: ["M382 286L355 205M322 195H390", "M558 220L550 154L584 128", "M548 151C571 139 590 139 614 149"],
      forks: ["M578 264L665 438", "M595 262L680 435"], handlebar: "M550 154L584 128M548 151C571 139 590 139 614 149",
      frontBasket: { x: 608, y: 186, w: 182, h: 120 }, rearBasket: { x: 92, y: 246, w: 143, h: 102 },
      pouch: { x: 540, y: 164, w: 88, h: 54 }, seatPouch: "M332 214H397L386 266H345Z",
      flag: { x: 150, top: 62, bottom: 310 }, tail: { x: 166, y: 345 }, signal: { left: 106, right: 235, y: 365 }, helmet: { x: 430, y: 60 }
    },
    mountain: {
      scale: 1,
      bounds: { minX: 105, maxX: 790, minY: 115, maxY: 570 },
      rearWheel: { x: 245, y: 445, r: 124 }, frontWheel: { x: 670, y: 445, r: 124 },
      frame: ["M245 445L450 445L355 255L245 445", "M355 255L565 238L450 445"],
      metal: ["M355 255L322 182M292 176H365", "M554 238L560 166L610 138", "M548 166C580 151 608 154 638 171", "M602 286L622 248M586 288L606 250"],
      forks: ["M594 280L670 445", "M610 276L687 442"], handlebar: "M560 166L610 138M548 166C580 151 608 154 638 171",
      frontBasket: { x: 620, y: 180, w: 150, h: 96 }, rearBasket: { x: 92, y: 242, w: 138, h: 96 },
      pouch: { x: 556, y: 175, w: 76, h: 48 }, seatPouch: "M300 190H360L351 239H314Z",
      flag: { x: 150, top: 58, bottom: 305 }, tail: { x: 158, y: 342 }, signal: { left: 98, right: 227, y: 362 }, helmet: { x: 420, y: 54 }
    },
    bmx: {
      scale: 1.08,
      bounds: { minX: 165, maxX: 715, minY: 195, maxY: 565 },
      rearWheel: { x: 275, y: 456, r: 96 }, frontWheel: { x: 615, y: 456, r: 96 },
      frame: ["M275 456L440 456L345 330L275 456", "M345 330L530 338L440 456"],
      metal: ["M345 330L328 272M304 270H356", "M520 334V258M485 255H558"],
      forks: ["M530 338L615 456", "M514 335L602 454"], handlebar: "M520 258V224M485 224H558",
      frontBasket: { x: 574, y: 285, w: 108, h: 74 }, rearBasket: { x: 116, y: 314, w: 114, h: 72 },
      pouch: { x: 506, y: 278, w: 58, h: 38 }, seatPouch: "M300 296H346L339 334H309Z",
      flag: { x: 168, top: 118, bottom: 380 }, tail: { x: 156, y: 390 }, signal: { left: 96, right: 225, y: 410 }, helmet: { x: 400, y: 92 }
    },
    beachCruiser: {
      scale: 1,
      bounds: { minX: 105, maxX: 800, minY: 120, maxY: 570 },
      rearWheel: { x: 255, y: 446, r: 118 }, frontWheel: { x: 675, y: 446, r: 118 },
      frame: ["M255 446L445 446C430 376 398 332 356 292", "M356 292C416 295 470 300 532 304C566 307 594 288 605 252", "M445 446C520 380 566 316 605 252"],
      metal: ["M356 292L330 214M300 204H370", "M600 250L596 177L640 150", "M593 177C623 164 651 167 681 184"],
      forks: ["M615 276L675 446", "M630 272L690 443"], handlebar: "M596 177L640 150M593 177C623 164 651 167 681 184",
      frontBasket: { x: 624, y: 196, w: 146, h: 96 }, rearBasket: { x: 104, y: 248, w: 138, h: 98 },
      pouch: { x: 590, y: 196, w: 70, h: 42 }, seatPouch: "M305 214H372L360 268H318Z",
      flag: { x: 160, top: 74, bottom: 310 }, tail: { x: 170, y: 348 }, signal: { left: 110, right: 239, y: 368 }, helmet: { x: 432, y: 56 }
    },
    road: {
      scale: 1,
      bounds: { minX: 110, maxX: 785, minY: 135, maxY: 570 },
      rearWheel: { x: 258, y: 448, r: 116 }, frontWheel: { x: 668, y: 448, r: 116 },
      frame: ["M258 448L446 448L364 276L258 448", "M364 276L560 260L446 448"],
      metal: ["M364 276L338 203M306 196H364", "M556 260L566 185L618 158", "M563 187H648M618 158L598 180"],
      forks: ["M586 292L668 448", "M599 289L683 445"], handlebar: "M566 185H648M618 158L598 180",
      frontBasket: { x: 608, y: 230, w: 126, h: 78 }, rearBasket: { x: 104, y: 262, w: 126, h: 84 },
      pouch: { x: 554, y: 214, w: 66, h: 38 }, seatPouch: "M315 214H365L356 252H325Z",
      flag: { x: 158, top: 92, bottom: 320 }, tail: { x: 162, y: 360 }, signal: { left: 102, right: 231, y: 380 }, helmet: { x: 420, y: 70 }
    },
    fatTire: {
      scale: 0.96,
      bounds: { minX: 80, maxX: 825, minY: 105, maxY: 590 },
      rearWheel: { x: 250, y: 448, r: 136 }, frontWheel: { x: 675, y: 448, r: 136 },
      frame: ["M250 448L450 448L355 258L250 448", "M355 258L562 238L450 448"],
      metal: ["M355 258L326 174M294 166H360", "M552 238L560 166L612 136", "M546 166C579 151 607 153 640 170", "M405 280H490V350H405Z"],
      forks: ["M598 292L675 448", "M614 289L692 444"], handlebar: "M560 166L612 136M546 166C579 151 607 153 640 170",
      frontBasket: { x: 620, y: 180, w: 152, h: 98 }, rearBasket: { x: 94, y: 234, w: 142, h: 96 },
      pouch: { x: 557, y: 176, w: 78, h: 44 }, seatPouch: "M300 188H360L350 240H315Z",
      flag: { x: 150, top: 55, bottom: 298 }, tail: { x: 158, y: 336 }, signal: { left: 98, right: 227, y: 356 }, helmet: { x: 422, y: 54 }
    },
    stepThroughEb: {
      scale: 0.99,
      bounds: { minX: 100, maxX: 800, minY: 115, maxY: 575 },
      rearWheel: { x: 252, y: 446, r: 122 }, frontWheel: { x: 668, y: 446, r: 122 },
      frame: ["M252 446L446 446L380 292L252 446", "M380 292C422 326 467 324 508 304C546 286 574 262 586 232", "M446 446C512 370 554 309 586 232"],
      metal: ["M380 292L349 206M316 198H386", "M576 229L571 163L612 136", "M569 162C597 148 622 150 650 166", "M402 300H470V378H402Z"],
      forks: ["M608 282L668 446", "M623 279L683 443"], handlebar: "M571 163L612 136M569 162C597 148 622 150 650 166",
      frontBasket: { x: 614, y: 190, w: 160, h: 104 }, rearBasket: { x: 100, y: 244, w: 142, h: 98 },
      pouch: { x: 552, y: 176, w: 82, h: 46 }, seatPouch: "M323 215H384L372 267H334Z",
      flag: { x: 158, top: 64, bottom: 308 }, tail: { x: 166, y: 342 }, signal: { left: 106, right: 235, y: 362 }, helmet: { x: 430, y: 58 }
    },
    cargo: {
      scale: 0.92,
      bounds: { minX: 60, maxX: 820, minY: 110, maxY: 570 },
      rearWheel: { x: 215, y: 448, r: 110 }, frontWheel: { x: 700, y: 448, r: 110 },
      frame: ["M215 448L430 448L350 274L215 448", "M350 274L575 274L430 448"],
      metal: ["M350 274L320 198M292 190H360", "M566 272L566 190L610 160", "M560 190C590 176 617 178 646 194", "M112 276H352M112 276V320H352V276"],
      forks: ["M575 274L700 448", "M590 274L715 444"], handlebar: "M566 190L610 160M560 190C590 176 617 178 646 194",
      frontBasket: { x: 594, y: 216, w: 176, h: 108 }, rearBasket: { x: 78, y: 240, w: 170, h: 108 },
      pouch: { x: 542, y: 204, w: 78, h: 44 }, seatPouch: "M296 206H362L350 266H308Z",
      flag: { x: 108, top: 66, bottom: 306 }, tail: { x: 140, y: 352 }, signal: { left: 80, right: 209, y: 372 }, helmet: { x: 402, y: 58 }
    },
    recumbent: {
      scale: 0.96,
      bounds: { minX: 90, maxX: 825, minY: 165, maxY: 600 },
      rearWheel: { x: 245, y: 468, r: 120 }, frontWheel: { x: 710, y: 498, r: 88 },
      frame: ["M245 468L400 468L540 420L618 420L710 498", "M400 468L332 358L250 468", "M540 420L472 372L400 468"],
      metal: ["M330 356L300 282M292 280H356", "M620 420L650 362M648 360L690 334", "M642 362C662 350 688 352 709 366", "M486 356L410 338L364 388M365 388H415"],
      forks: ["M618 420L710 498"], handlebar: "M650 362L690 334M642 362C662 350 688 352 709 366",
      frontBasket: { x: 628, y: 380, w: 122, h: 80 }, rearBasket: { x: 116, y: 250, w: 132, h: 90 },
      pouch: { x: 610, y: 380, w: 62, h: 38 }, seatPouch: "M318 322H388L374 376H332Z",
      flag: { x: 146, top: 58, bottom: 308 }, tail: { x: 154, y: 360 }, signal: { left: 94, right: 223, y: 380 }, helmet: { x: 360, y: 118 }
    },
    balance: {
      scale: 1.08,
      bounds: { minX: 135, maxX: 675, minY: 205, maxY: 570 },
      rearWheel: { x: 292, y: 470, r: 84 }, frontWheel: { x: 574, y: 470, r: 84 },
      frame: ["M292 470L432 470L360 366L292 470", "M360 366L496 382L432 470"],
      metal: ["M360 366L340 310M316 304H374", "M490 380V318M455 314H526", "M360 350H405C438 350 448 330 448 308"],
      forks: ["M496 382L574 470", "M482 378L560 466"], handlebar: "M490 318V286M455 286H526",
      frontBasket: { x: 526, y: 342, w: 106, h: 68 }, rearBasket: { x: 150, y: 346, w: 108, h: 72 },
      pouch: { x: 474, y: 334, w: 52, h: 34 }, seatPouch: "M324 322H366L360 356H332Z",
      flag: { x: 182, top: 144, bottom: 384 }, tail: { x: 184, y: 408 }, signal: { left: 124, right: 253, y: 428 }, helmet: { x: 366, y: 128 }
    }
  };

  const equipmentLabels = {
    batteryBox: "Battery box",
    controllerBox: "Controller box",
    headlight: "Headlight",
    underglow: "Underglow",
    rearRack: "Rear rack",
    saddlebags: "Saddlebags",
    childSeat: "Child seat",
    cargoTrailer: "Cargo trailer",
    mirrors: "Mirrors",
    speakers: "Speakers",
    ledSign: "LED sign"
  };

  const yesNoLabels = {
    frameLights: "Frame lights",
    frontForks: "Front-fork lights",
    frontWheel: "Front-wheel lights",
    rearWheel: "Rear-wheel lights",
    handlebars: "Handlebar lights",
    frontBasket: "Front-basket lighting",
    rearBasket: "Rear-basket lighting",
    pouch: "Handlebar pouch",
    seatPouch: "Rear pouch",
    flagPole: "Flag-pole LEDs",
    appControl: "App control",
    rearBrake: "Rear tail-light assembly",
    turnSignals: "Turn signals",
    helmetLights: "Helmet lights"
  };

  const conditionalMap = {
    pouch: "pouchOptions",
    seatPouch: "seatPouchOptions",
    flagPole: "flagPoleOptions",
    appControl: "appControlOptions",
    rearBrake: "rearBrakeOptions",
    turnSignals: "turnSignalOptions",
    helmetLights: "helmetOptions"
  };

  const pathsMarkup = (paths) => paths.map((d) => `<path d="${d}"/>`).join("");

  const wheelMarkup = (wheel) => {
    const rim = Math.max(44, wheel.r - 22);
    const diagonal = Math.round(rim * 0.7);
    return `<circle class="bike-tire" cx="${wheel.x}" cy="${wheel.y}" r="${wheel.r}"/>
      <circle class="bike-rim" cx="${wheel.x}" cy="${wheel.y}" r="${rim}"/>
      <g class="bike-spoke"><path d="M${wheel.x} ${wheel.y-rim}V${wheel.y+rim}M${wheel.x-rim} ${wheel.y}H${wheel.x+rim}M${wheel.x-diagonal} ${wheel.y-diagonal}L${wheel.x+diagonal} ${wheel.y+diagonal}M${wheel.x-diagonal} ${wheel.y+diagonal}L${wheel.x+diagonal} ${wheel.y-diagonal}"/></g>`;
  };

  const basketMarkup = (id, basket) => {
    const slant = 16;
    return `<g id="${id}" class="zone zone-off" stroke-width="8"><path d="M${basket.x} ${basket.y}H${basket.x+basket.w}L${basket.x+basket.w-slant} ${basket.y+basket.h}H${basket.x+slant}Z"/><path d="M${basket.x+10} ${basket.y+26}H${basket.x+basket.w-10}M${basket.x+8} ${basket.y+basket.h-15}H${basket.x+basket.w-10}M${basket.x+Math.round(basket.w*.35)} ${basket.y+5}L${basket.x+Math.round(basket.w*.3)} ${basket.y+basket.h-5}M${basket.x+Math.round(basket.w*.7)} ${basket.y+5}L${basket.x+Math.round(basket.w*.65)} ${basket.y+basket.h-5}"/></g>`;
  };

  const tailMarkup = (id, x, y) => `<g id="${id}" class="tail-light zone zone-off" stroke-width="5"><rect class="tail-housing" x="${x}" y="${y}" width="80" height="38" rx="8"/><rect class="tail-pixel tail-outer" x="${x+6}" y="${y+7}" width="10" height="24" rx="2"/><rect class="tail-pixel tail-inner" x="${x+20}" y="${y+7}" width="10" height="24" rx="2"/><rect class="tail-pixel tail-center" x="${x+34}" y="${y+7}" width="12" height="24" rx="2"/><rect class="tail-pixel tail-inner" x="${x+50}" y="${y+7}" width="10" height="24" rx="2"/><rect class="tail-pixel tail-outer" x="${x+64}" y="${y+7}" width="10" height="24" rx="2"/></g>`;

  const signalsMarkup = (id, signal) => `<g id="${id}" class="turn-signal zone zone-off" stroke-width="3"><g class="signal-arrow signal-left"><path class="signal-segment signal-step-3" d="M${signal.left} ${signal.y}L${signal.left+33} ${signal.y-28}V${signal.y-12}H${signal.left+45}V${signal.y+13}H${signal.left+33}V${signal.y+29}Z"/><rect class="signal-segment signal-step-2" x="${signal.left+45}" y="${signal.y-12}" width="13" height="25" rx="2"/><rect class="signal-segment signal-step-1" x="${signal.left+58}" y="${signal.y-12}" width="13" height="25" rx="2"/></g><g class="signal-arrow signal-right"><rect class="signal-segment signal-step-1" x="${signal.right}" y="${signal.y-12}" width="13" height="25" rx="2"/><rect class="signal-segment signal-step-2" x="${signal.right+13}" y="${signal.y-12}" width="13" height="25" rx="2"/><path class="signal-segment signal-step-3" d="M${signal.right+71} ${signal.y}L${signal.right+38} ${signal.y-28}V${signal.y-12}H${signal.right+26}V${signal.y+13}H${signal.right+38}V${signal.y+29}Z"/></g></g>`;

  const equipmentMarkup = () => `
    <g id="batteryBoxSvg" class="equipment-layer equipment-off"><rect x="395" y="318" width="92" height="72" rx="10"/><path d="M418 340H464M418 360H464"/></g>
    <g id="controllerBoxSvg" class="equipment-layer equipment-off"><rect x="490" y="300" width="72" height="48" rx="9"/><circle cx="510" cy="324" r="5"/><circle cx="542" cy="324" r="5"/></g>
    <g id="headlightSvg" class="equipment-layer equipment-off"><circle cx="625" cy="212" r="24"/><path d="M604 212H646"/></g>
    <g id="underglowSvg" class="equipment-layer equipment-off equipment-light"><path d="M285 500C390 535 515 535 625 500" fill="none" stroke-width="18" stroke-linecap="round"/></g>
    <g id="rearRackSvg" class="equipment-layer equipment-off"><path d="M122 296H286M140 296L172 404M268 296L236 404" fill="none" stroke-width="12" stroke-linecap="round"/></g>
    <g id="saddlebagsSvg" class="equipment-layer equipment-off"><path d="M138 304H210L202 378H126Z"/><path d="M218 304H290L302 378H226Z"/></g>
    <g id="childSeatSvg" class="equipment-layer equipment-off"><path d="M230 194H314V294H230Z"/><path d="M240 194V156H304V194M244 230H300" fill="none" stroke-width="10"/></g>
    <g id="cargoTrailerSvg" class="equipment-layer equipment-off"><path d="M42 420H164V502H42Z"/><circle cx="64" cy="522" r="28"/><circle cx="144" cy="522" r="28"/><path d="M164 460L224 438" fill="none" stroke-width="10"/></g>
    <g id="mirrorsSvg" class="equipment-layer equipment-off"><circle cx="548" cy="112" r="22"/><circle cx="652" cy="112" r="22"/><path d="M560 130L576 158M640 130L620 158" fill="none" stroke-width="8"/></g>
    <g id="speakersSvg" class="equipment-layer equipment-off"><circle cx="550" cy="222" r="22"/><circle cx="606" cy="222" r="22"/><circle cx="550" cy="222" r="7"/><circle cx="606" cy="222" r="7"/></g>
    <g id="ledSignSvg" class="equipment-layer equipment-off equipment-light"><rect x="100" y="188" width="170" height="62" rx="8"/><text x="185" y="228" text-anchor="middle" font-size="24" font-weight="900">SHYNETYME</text></g>`;

  const renderSideBike = (group, styleKey) => {
    const body = bikeBodies[styleKey] || bikeBodies.comfort;
    group.innerHTML = `${wheelMarkup(body.rearWheel)}${wheelMarkup(body.frontWheel)}
      <g class="bike-metal">${pathsMarkup(body.frame)}${pathsMarkup(body.forks)}${pathsMarkup(body.metal)}</g>
      <g id="frameLightsSvg" class="zone zone-off" fill="none" stroke-width="16" stroke-linecap="round" stroke-linejoin="round">${pathsMarkup(body.frame)}</g>
      <g id="frontForksSvg" class="zone zone-off" fill="none" stroke-width="16" stroke-linecap="round">${pathsMarkup(body.forks)}</g>
      <circle id="frontWheelSvg" class="zone zone-off" cx="${body.frontWheel.x}" cy="${body.frontWheel.y}" r="${Math.max(42,body.frontWheel.r-12)}" fill="none" stroke-width="12"/>
      <circle id="rearWheelSvg" class="zone zone-off" cx="${body.rearWheel.x}" cy="${body.rearWheel.y}" r="${Math.max(42,body.rearWheel.r-12)}" fill="none" stroke-width="12"/>
      <path id="handlebarsSvg" class="zone zone-off" d="${body.handlebar}" fill="none" stroke-width="16" stroke-linecap="round"/>
      ${basketMarkup("frontBasketSvg", body.frontBasket)}${basketMarkup("rearBasketSvg", body.rearBasket)}
      <g id="flagPoleSvg" class="flag-pole zone zone-off" fill="none" stroke-linecap="round"><path class="flag-pole-light" d="M${body.flag.x} ${body.flag.bottom}V${body.flag.top}" stroke-width="12"/><path d="M${body.flag.x+7} ${body.flag.top+6}H${body.flag.x+132}L${body.flag.x+98} ${body.flag.top+48}L${body.flag.x+132} ${body.flag.top+90}H${body.flag.x+7}Z" fill="#e9ecef" stroke="#2d333b" stroke-width="4"/></g>
      <g id="handlebarPouchSvg" class="zone zone-off solid-green-zone" stroke-width="6"><rect x="${body.pouch.x}" y="${body.pouch.y}" width="${body.pouch.w}" height="${body.pouch.h}" rx="12"/></g>
      <g id="seatPouchSvg" class="zone zone-off solid-green-zone" stroke-width="6"><path d="${body.seatPouch}"/></g>
      ${tailMarkup("rearBrakeSvg",body.tail.x,body.tail.y)}${signalsMarkup("turnSignalsSvg",body.signal)}
      <g id="helmetSvg" transform="translate(${body.helmet.x} ${body.helmet.y})"><path d="M0 70C0 20 35 0 75 0s75 20 75 70v15H0Z" fill="#d9dde5" stroke="#2d333b" stroke-width="8"/><path id="helmetLightsSvg" class="zone zone-off" d="M18 68C22 30 45 18 75 18s53 12 57 50" fill="none" stroke-width="12" stroke-linecap="round"/><circle id="helmetFrontLight" cx="142" cy="70" r="10" fill="#b5bac3" stroke="#2d333b" stroke-width="4"/><circle id="helmetRearLight" cx="8" cy="70" r="10" fill="#b5bac3" stroke="#2d333b" stroke-width="4"/></g>
      ${equipmentMarkup()}`;
  };

  const renderRearView = (styleKey) => {
    const label = bikeStyleLabels[styleKey] || bikeStyleLabels.comfort;
    rearPanel.setAttribute("transform", "translate(0 0)");
    rearPanel.innerHTML = `<rect x="35" y="35" width="830" height="555" rx="28" fill="rgba(255,255,255,.96)" stroke="#171a20" stroke-width="6"/><text x="450" y="82" text-anchor="middle" font-size="26" font-weight="900" fill="#171a20">REAR SAFETY VIEW</text><g transform="translate(450 165) scale(1.2)"><text x="0" y="-34" text-anchor="middle" font-size="17" font-weight="900" fill="#171a20">PRIMARY BICYCLE</text><text x="0" y="-12" text-anchor="middle" font-size="15" font-weight="750" fill="#38404a">${label}</text><circle cx="0" cy="190" r="78" fill="#fff" stroke="#2d333b" stroke-width="14"/><path d="M0 42V222M-58 68H58" stroke="#2d333b" stroke-width="14" stroke-linecap="round"/>${tailMarkup("rearBrakeRearSvg",-40,105)}${signalsMarkup("turnSignalsRearSvg",{left:-122,right:51,y:124})}</g>`;
  };

  const fitTransform = (body, requestedScale, centerX = 450, availableWidth = 825, bottomY = 632) => {
    const width = body.bounds.maxX - body.bounds.minX;
    const height = body.bounds.maxY - body.bounds.minY;
    const scale = Math.min(requestedScale * body.scale, availableWidth / width, 535 / height);
    return {
      x: Math.round(centerX - ((body.bounds.minX + body.bounds.maxX) / 2) * scale),
      y: Math.round(bottomY - body.bounds.maxY * scale),
      scale
    };
  };

  const selectedValue = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value || "no";
  const isYes = (name) => selectedValue(name) === "yes";
  const checkedValues = (selector) => [...form.querySelectorAll(`${selector}:checked`)].map((input) => input.value);

  const setZone = (id, enabled) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.classList.toggle("zone-on", enabled);
    element.classList.toggle("zone-off", !enabled);
  };

  const installLayout = () => {
    document.getElementById("addKidBikeYes")?.closest(".question-row")?.remove();
    kidBike?.setAttribute("hidden", "");

    const setupButton = document.querySelector('[data-bs-target="#bikeSetup"]');
    if (setupButton) setupButton.textContent = "1. Bicycle size";

    const frameSelect = document.getElementById("frameSize");
    const frameRow = frameSelect?.closest(".question-row");
    if (frameRow && !document.getElementById("bikeBodyStyle")) {
      const bodyRow = document.createElement("div");
      bodyRow.className = "question-row";
      bodyRow.innerHTML = `<label class="question-label" for="bikeBodyStyle">Bicycle body style</label><select id="bikeBodyStyle" name="bikeBodyStyle" class="form-select">${Object.entries(bikeStyleLabels).map(([value,label]) => `<option value="${value}"${value === "comfort" ? " selected" : ""}>${label}</option>`).join("")}</select><div class="question-note mt-2">Choose the closest body style to the bicycle being planned.</div>`;
      frameRow.after(bodyRow);
    }

    const accordion = document.getElementById("builderAccordion");
    if (accordion && !document.getElementById("equipmentAddOns")) {
      const section = document.createElement("section");
      section.className = "accordion-item";
      section.innerHTML = `<h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#equipmentAddOns" aria-expanded="false" aria-controls="equipmentAddOns">8. Equipment and add-ons</button></h2><div id="equipmentAddOns" class="accordion-collapse collapse" data-bs-parent="#builderAccordion"><div class="accordion-body"><div class="equipment-options-grid">${Object.entries(equipmentLabels).map(([id,label]) => `<label class="equipment-option"><input class="equipment-checkbox" type="checkbox" id="${id}" value="${label}"><span>${label}</span></label>`).join("")}</div><div class="question-note mt-3">Selected equipment appears in the live view and build summary.</div></div></div>`;
      accordion.appendChild(section);
    }

    previewCard?.querySelector(".preview-toolbar")?.remove();
    previewCard?.querySelector(".card-body.border-top")?.remove();
    previewCard?.querySelector(".bike-preview-instructions")?.remove();

    const summaryHeader = summaryList?.closest(".summary-box")?.querySelector(".d-flex");
    const oldBudgetBadge = document.getElementById("budgetBadge");
    const budgetRow = budgetSelect?.closest(".question-row");
    if (summaryHeader && budgetSelect && oldBudgetBadge) {
      const budgetField = document.createElement("label");
      budgetField.className = "budget-select-field";
      budgetField.setAttribute("for", "budgetBadge");
      budgetField.innerHTML = '<span class="budget-select-label">Budget</span>';
      budgetSelect.id = "budgetBadge";
      budgetSelect.name = "Budget";
      budgetSelect.className = "form-select form-select-sm budget-select";
      budgetField.appendChild(budgetSelect);
      oldBudgetBadge.replaceWith(budgetField);
      budgetRow?.remove();
    }

    if (!document.getElementById("bikeBuilderIntegratedStyles")) {
      const style = document.createElement("style");
      style.id = "bikeBuilderIntegratedStyles";
      style.textContent = `
        .preview-card{position:sticky!important;top:5.1rem!important;z-index:20;align-self:start}
        .preview-multi-build-note{display:none!important}
        #buildSummary:empty{display:none}
        .summary-box.is-empty #copyBuild{opacity:.55}
        .budget-select-field{display:flex;align-items:center;gap:.5rem;margin:0;color:#fff;font-weight:800;white-space:nowrap}
        .budget-select{min-width:118px;width:auto;background-color:#fff;color:#111}
        @media(max-width:991.98px){.preview-card{order:-1;top:4.15rem!important;max-height:calc(100vh - 4.35rem);overflow:auto}.bike-stage,.bike-stage svg{min-height:300px!important;height:300px!important}}
        @media(max-width:575.98px){.bike-stage,.bike-stage svg{min-height:255px!important;height:255px!important}.budget-select-field{width:100%;justify-content:space-between}.budget-select{flex:0 0 125px}}
      `;
      document.head.appendChild(style);
    }
  };

  const installDefaults = () => {
    form.querySelectorAll("[data-yes-no]").forEach((container) => {
      const name = container.dataset.yesNo;
      container.innerHTML = `<input class="btn-check" type="radio" name="${name}" id="${name}Yes" value="yes"><label class="btn btn-outline-success" for="${name}Yes">Yes</label><input class="btn-check" type="radio" name="${name}" id="${name}No" value="no" checked><label class="btn btn-outline-danger" for="${name}No">No</label>`;
    });

    form.querySelectorAll(".app-control-option,.helmet-option,.equipment-checkbox").forEach((input) => { input.checked = false; });

    if (budgetSelect) {
      budgetSelect.replaceChildren();
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Select";
      placeholder.selected = true;
      budgetSelect.appendChild(placeholder);
      for (let amount = 50; amount <= 500; amount += 50) {
        const option = document.createElement("option");
        option.value = String(amount);
        option.textContent = `$${amount}`;
        budgetSelect.appendChild(option);
      }
    }
  };

  const updateConditionalOptions = () => Object.entries(conditionalMap).forEach(([name,id]) => {
    const panel = document.getElementById(id);
    if (panel) panel.hidden = !isYes(name);
  });

  const updateBike = () => {
    const styleKey = document.getElementById("bikeBodyStyle")?.value || "comfort";
    const sizeKey = document.getElementById("frameSize")?.value || "adult";
    const body = bikeBodies[styleKey] || bikeBodies.comfort;
    renderSideBike(mainBike, styleKey);
    renderRearView(styleKey);

    const requestedScale = ["toddler", "preschool", "youth"].includes(sizeKey)
      ? sizeConfig.adult.scale
      : sizeConfig[sizeKey].scale;
    const transform = fitTransform(body, requestedScale);
    mainBike.setAttribute("transform", `translate(${transform.x} ${transform.y}) scale(${transform.scale})`);

    const gapCenter = (body.rearWheel.x + body.frontWheel.x) / 2;
    const wheelBottom = Math.max(body.rearWheel.y + body.rearWheel.r, body.frontWheel.y + body.frontWheel.r);
    const iconScale = Math.max(.58, Math.min(.92, transform.scale * .85));
    appIcons?.setAttribute("transform", `translate(${Math.round(transform.x + gapCenter * transform.scale - 72 * iconScale)} ${Math.round(transform.y + wheelBottom * transform.scale - 43 * iconScale)}) scale(${iconScale})`);
  };

  const updateVisualStates = () => {
    const zoneMap = {
      frameLights: ["frameLightsSvg"], frontForks: ["frontForksSvg"], frontWheel: ["frontWheelSvg"], rearWheel: ["rearWheelSvg"],
      handlebars: ["handlebarsSvg"], frontBasket: ["frontBasketSvg"], rearBasket: ["rearBasketSvg"], pouch: ["handlebarPouchSvg"],
      seatPouch: ["seatPouchSvg"], flagPole: ["flagPoleSvg"], rearBrake: ["rearBrakeSvg","rearBrakeRearSvg"],
      turnSignals: ["turnSignalsSvg","turnSignalsRearSvg"], helmetLights: ["helmetLightsSvg"]
    };
    Object.entries(zoneMap).forEach(([name,ids]) => ids.forEach((id) => setZone(id,isYes(name))));

    const flag = document.getElementById("flagPoleSvg");
    flag?.classList.remove("flag-flash-red","flag-flash-orange","flag-solid-red");
    if (isYes("flagPole")) {
      const mode = document.getElementById("flagPoleStyle")?.value || "solid color red";
      flag?.classList.add(mode.includes("orange") ? "flag-flash-orange" : mode.includes("flashing") ? "flag-flash-red" : "flag-solid-red");
    }

    const tailAnimated = document.getElementById("rearBrakeStyle")?.value === "animated center-out";
    ["rearBrakeSvg","rearBrakeRearSvg"].forEach((id) => {
      const element = document.getElementById(id);
      element?.classList.toggle("tail-solid",isYes("rearBrake") && !tailAnimated);
      element?.classList.toggle("tail-animated",isYes("rearBrake") && tailAnimated);
    });

    const signalsAnimated = document.getElementById("turnSignalStyle")?.value === "animated directional gradient";
    ["turnSignalsSvg","turnSignalsRearSvg"].forEach((id) => {
      const element = document.getElementById(id);
      element?.classList.toggle("signal-solid-orange",isYes("turnSignals") && !signalsAnimated);
      element?.classList.toggle("signal-animated",isYes("turnSignals") && signalsAnimated);
    });

    const helmetOn = isYes("helmetLights");
    document.getElementById("helmetRearLight")?.setAttribute("fill",helmetOn && document.getElementById("helmetRed")?.checked ? "#ff1f3d" : "#b5bac3");
    document.getElementById("helmetFrontLight")?.setAttribute("fill",helmetOn && document.getElementById("helmetWhite")?.checked ? "#fff" : "#b5bac3");

    Object.keys(equipmentLabels).forEach((id) => {
      const layer = document.getElementById(`${id}Svg`);
      const enabled = Boolean(document.getElementById(id)?.checked);
      layer?.classList.toggle("equipment-on",enabled);
      layer?.classList.toggle("equipment-off",!enabled);
    });

    const controlsOn = isYes("appControl");
    const controlMap = { wifiIcon: "appWifi", bluetoothIcon: "appBluetooth", remoteIcon: "appRemote" };
    Object.entries(controlMap).forEach(([iconId,inputId]) => document.getElementById(iconId)?.classList.toggle("control-icon-on",controlsOn && Boolean(document.getElementById(inputId)?.checked)));
    appIcons?.classList.toggle("has-selection",controlsOn && Object.values(controlMap).some((id) => document.getElementById(id)?.checked));

    const rearRequested = isYes("rearBrake") || isYes("turnSignals");
    if (currentView === "rear" && !rearRequested) currentView = "side";
    mainBike.hidden = currentView === "rear";
    rearPanel.hidden = currentView !== "rear";
    if (appIcons) appIcons.hidden = currentView === "rear";
  };

  const lineForTouchedYesNo = (name) => {
    if (!touched.has(name)) return null;
    if (!isYes(name)) return `${yesNoLabels[name]}: Not requested`;
    if (name === "pouch") return `${yesNoLabels[name]}: ${document.getElementById("pouchStyle")?.selectedOptions[0]?.textContent || "Requested"}`;
    if (name === "seatPouch") return `${yesNoLabels[name]}: ${document.getElementById("seatPouchStyle")?.selectedOptions[0]?.textContent || "Requested"}`;
    if (name === "flagPole") return `${yesNoLabels[name]}: ${document.getElementById("flagPoleStyle")?.selectedOptions[0]?.textContent || "Requested"}`;
    if (name === "rearBrake") return `${yesNoLabels[name]}: ${document.getElementById("rearBrakeStyle")?.selectedOptions[0]?.textContent || "Requested"}`;
    if (name === "turnSignals") return `${yesNoLabels[name]}: ${document.getElementById("turnSignalStyle")?.selectedOptions[0]?.textContent || "Requested"}`;
    if (name === "appControl") {
      const values = checkedValues(".app-control-option");
      return `${yesNoLabels[name]}: ${values.length ? values.join(", ") : "Requested; method not selected"}`;
    }
    if (name === "helmetLights") {
      const values = checkedValues(".helmet-option");
      return `${yesNoLabels[name]}: ${values.length ? values.join(", ") : "Requested; options not selected"}`;
    }
    return `${yesNoLabels[name]}: Requested`;
  };

  const buildSummaryLines = () => {
    const lines = [];
    if (touched.has("frameSize")) lines.push(`Bicycle size: ${sizeConfig[document.getElementById("frameSize").value].label}`);
    if (touched.has("bikeBodyStyle")) lines.push(`Bicycle body: ${bikeStyleLabels[document.getElementById("bikeBodyStyle").value]}`);
    Object.keys(yesNoLabels).forEach((name) => {
      const line = lineForTouchedYesNo(name);
      if (line) lines.push(line);
    });
    const equipment = Object.keys(equipmentLabels).filter((id) => document.getElementById(id)?.checked).map((id) => equipmentLabels[id]);
    if (equipment.length) lines.push(`Equipment: ${equipment.join(", ")}`);
    if (touched.has("budget") && budgetSelect?.value) lines.push(`Budget: $${budgetSelect.value}`);
    return lines;
  };

  const updateSummary = () => {
    const lines = buildSummaryLines();
    if (summaryList) summaryList.innerHTML = lines.map((line) => `<li>${line}</li>`).join("");
    const summaryBox = summaryList?.closest(".summary-box");
    summaryBox?.classList.toggle("is-empty",lines.length === 0);
  };

  const sync = () => {
    updateBike();
    updateConditionalOptions();
    updateVisualStates();
    updateSummary();
  };

  const identifySelection = (target) => {
    if (target.name && yesNoLabels[target.name]) return target.name;
    if (target.id === "frameSize") return "frameSize";
    if (target.id === "bikeBodyStyle") return "bikeBodyStyle";
    if (target.id === "budgetBadge") return "budget";
    if (target.classList.contains("app-control-option")) return "appControl";
    if (target.classList.contains("helmet-option")) return "helmetLights";
    if (target.classList.contains("equipment-checkbox")) return "equipment";
    if (["pouchStyle","seatPouchStyle","flagPoleStyle","rearBrakeStyle","turnSignalStyle"].includes(target.id)) {
      return { pouchStyle:"pouch", seatPouchStyle:"seatPouch", flagPoleStyle:"flagPole", rearBrakeStyle:"rearBrake", turnSignalStyle:"turnSignals" }[target.id];
    }
    return null;
  };

  const installChuckStartCloud = () => {
    let attempts = 0;
    const show = () => {
      const widget = document.getElementById("dekeChuckWidget");
      const thought = document.getElementById("dekeChuckThought");
      const text = document.getElementById("dekeChuckText");
      const action = document.getElementById("dekeChuckAction");
      const trigger = document.getElementById("dekeChuckTrigger");
      if (!widget || !thought || !text || !action || !trigger) {
        attempts += 1;
        if (attempts < 80) window.setTimeout(show,100);
        return;
      }
      window.setTimeout(() => {
        text.textContent = "START HERE\nOpen Bicycle size first.\nChoose the size and body.\nThen open each section, make selections and watch the live bike update.";
        action.textContent = "Start here";
        action.href = "#bikeSetup";
        thought.hidden = false;
        thought.classList.add("is-visible","is-materializing");
        trigger.setAttribute("aria-expanded","true");
        widget.dataset.bikeStartCloud = "true";
      },900);
    };
    show();
  };

  installLayout();
  installDefaults();

  form.addEventListener("change", (event) => {
    const key = identifySelection(event.target);
    if (key) touched.add(key);
    if ((event.target.name === "rearBrake" || event.target.name === "turnSignals") && event.target.value === "yes") currentView = "rear";
    else if (event.target.id === "rearBrakeStyle" || event.target.id === "turnSignalStyle") currentView = "rear";
    else currentView = "side";
    sync();
  });

  form.addEventListener("reset", () => window.setTimeout(() => {
    touched.clear();
    installDefaults();
    const frameSize = document.getElementById("frameSize");
    const bodyStyle = document.getElementById("bikeBodyStyle");
    if (frameSize) frameSize.value = "adult";
    if (bodyStyle) bodyStyle.value = "comfort";
    currentView = "side";
    if (copyStatus) copyStatus.textContent = "";
    sync();
  },0));

  document.getElementById("copyBuild")?.addEventListener("click", async () => {
    const lines = buildSummaryLines();
    if (!lines.length) {
      if (copyStatus) copyStatus.textContent = "Make at least one selection before copying the build summary.";
      return;
    }
    const text = `SHYNETYME WORKS — LED BIKE SIM\n\n${lines.map((line) => `• ${line}`).join("\n")}`;
    try {
      await navigator.clipboard.writeText(text);
      if (copyStatus) copyStatus.textContent = "Build summary copied.";
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      if (copyStatus) copyStatus.textContent = "Build summary copied.";
    }
  });

  sync();
  installChuckStartCloud();
})();
