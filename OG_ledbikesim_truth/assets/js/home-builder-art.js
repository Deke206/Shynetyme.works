(() => {
  "use strict";
  const preview = document.getElementById("homePreview");
  if (!preview) return;
  preview.innerHTML = `
    <title id="homePreviewTitle">Interactive exterior home lighting preview</title>
    <desc id="homePreviewDesc">Four detailed views demonstrate selected lighting zones around the front, garage, rear patio, staircase, gazebo, garden and paths.</desc>
    <defs>
      <linearGradient id="homeRgbGradient" x1="0" x2="1"><stop offset="0" stop-color="#ff5ab9"/><stop offset=".25" stop-color="#ffb65c"/><stop offset=".5" stop-color="#ffe76a"/><stop offset=".72" stop-color="#55e6b5"/><stop offset="1" stop-color="#31e6ff"/></linearGradient>
      <linearGradient id="lawnGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#183b35"/><stop offset="1" stop-color="#071c22"/></linearGradient>
      <linearGradient id="houseGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8e3ef"/><stop offset="1" stop-color="#8294aa"/></linearGradient>
      <filter id="homeGlow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <pattern id="paverPattern" width="24" height="16" patternUnits="userSpaceOnUse"><rect width="24" height="16" fill="#47515e"/><path d="M0 0H24M0 16H24M12 0V16" stroke="#778493" stroke-width="1"/></pattern>
    </defs>
    <g id="viewPlan" class="home-view-layer">
      <rect x="55" y="40" width="890" height="595" rx="28" class="lot-surface"/><path d="M70 54H930V620H70Z" class="property-line"/>
      <g class="plan-house"><path d="M300 180H690V420H300Z" class="house-fill"/><path d="M585 180H690V335H585Z" class="garage-fill"/><path d="M300 180H690V420H300Z" class="structure-line"/><path d="M585 180V335H690" class="structure-line"/><path d="M330 420H560V525H330Z" class="patio-fill"/><path d="M330 420H560V525H330Z" data-zone="patio" class="home-zone zone-off"/></g>
      <path d="M690 245H930V520H805V340H690Z" class="driveway-fill"/><path d="M690 245H930M690 335H805V520" data-zone="driveway" class="home-zone zone-off"/>
      <path d="M70 345C155 340 206 320 300 305" class="path-fill"/><path d="M78 345C165 342 218 320 300 305" data-zone="frontPath" class="home-zone zone-off"/>
      <g class="gazebo-plan"><circle cx="760" cy="505" r="78" class="gazebo-fill"/><path d="M705 505H815M760 450V560M720 465L800 545M800 465L720 545" class="structure-line thin"/><circle cx="760" cy="505" r="78" data-zone="gazebo" class="home-zone zone-off"/></g>
      <path d="M560 485C630 465 660 520 704 510" class="path-fill"/><path d="M560 485C630 465 660 520 704 510" data-zone="gardenPath" class="home-zone zone-off"/>
      <g class="garden-bed"><path d="M100 480C155 445 225 450 275 490C238 550 145 560 98 525Z"/><path d="M130 505C170 475 220 480 245 508"/></g><path d="M100 480C155 445 225 450 275 490C238 550 145 560 98 525Z" data-zone="gardenBeds" class="home-zone zone-off"/>
      <g class="tree-plan"><circle cx="160" cy="155" r="58"/><circle cx="208" cy="135" r="45"/><circle cx="200" cy="184" r="48"/></g><path d="M120 155C145 105 220 95 245 165C235 220 155 235 120 180Z" data-zone="tree" class="home-zone zone-off"/><path d="M70 80H930V620H70Z" data-zone="fence" class="home-zone zone-off fence-zone"/>
      <text x="495" y="120" class="view-heading">TOP-DOWN PROPERTY PLAN</text><text x="495" y="605" class="view-caption">House footprint · Garage · Patio · Gazebo · Garden · Paths</text>
    </g>
    <g id="viewFront" class="home-view-layer" hidden>
      <rect x="0" y="500" width="1000" height="180" class="ground-fill"/><path d="M100 500H900L850 635H150Z" class="driveway-front"/>
      <g class="house-front"><path d="M170 500V230L420 95L650 220L785 165L920 260V500Z" class="house-fill"/><path d="M170 230L420 95L650 220L785 165L920 260" class="structure-line roof"/><path d="M170 500V230M650 220V500M920 500V260" class="structure-line"/>
        <g class="second-story"><rect x="285" y="235" width="92" height="88" class="window-fill"/><rect x="462" y="235" width="92" height="88" class="window-fill"/><path d="M285 235H377V323H285ZM462 235H554V323H462Z" data-zone="windows" class="home-zone zone-off"/></g>
        <rect x="260" y="372" width="110" height="128" class="door-fill"/><path d="M260 500V372H370V500" data-zone="frontDoor" class="home-zone zone-off"/><path d="M225 370H405M230 370V500M400 370V500" data-zone="porch" class="home-zone zone-off"/>
        <g id="garageFront"><rect x="680" y="330" width="205" height="170" rx="5" class="garage-door-fill"/><path id="garageDoorLines" d="M680 330H885V500H680ZM782 330V500" class="garage-detail"/><path d="M680 500V330H885V500" data-zone="garage" class="home-zone zone-off"/></g>
        <path d="M170 230L420 95L650 220L785 165L920 260" data-zone="roofline" class="home-zone zone-off"/><path d="M100 635L260 500M900 635L885 500" data-zone="driveway" class="home-zone zone-off"/><path d="M120 610C190 580 220 535 290 500" data-zone="frontPath" class="home-zone zone-off"/>
      </g><text x="500" y="48" class="view-heading">FRONT ELEVATION + GARAGE</text><text x="500" y="655" class="view-caption">Roofline · Windows · Porch · Door · Garage · Driveway</text>
    </g>
    <g id="viewRear" class="home-view-layer" hidden>
      <rect x="0" y="510" width="1000" height="170" class="ground-fill"/><path d="M125 510V235L340 105L590 205L760 135L905 245V510Z" class="house-fill"/><path d="M125 235L340 105L590 205L760 135L905 245" class="structure-line roof"/><path d="M125 510V235M590 205V510M905 510V245" class="structure-line"/><path d="M125 235L340 105L590 205L760 135L905 245" data-zone="rearRoofline" class="home-zone zone-off"/>
      <g class="second-story"><rect x="280" y="235" width="105" height="85" class="window-fill"/><rect x="470" y="235" width="105" height="85" class="window-fill"/><rect x="675" y="230" width="92" height="82" class="window-fill"/><path d="M280 235H385V320H280ZM470 235H575V320H470ZM675 230H767V312H675Z" data-zone="windows" class="home-zone zone-off"/></g>
      <g class="patio-door"><rect x="235" y="365" width="220" height="145" class="glass-fill"/><path d="M235 510V365H455V510M345 365V510" data-zone="patioDoor" class="home-zone zone-off"/></g>
      <g class="wall-lamps"><path d="M205 395V430M475 395V430" class="lamp-arm"/><path d="M190 420H220L212 455H198ZM460 420H490L482 455H468Z" data-zone="wallLamps" class="home-zone zone-off lamp-zone"/></g>
      <g class="rear-staircase"><path d="M770 510H610L730 330H860" class="stair-body"/><path d="M765 490H625M750 466H641M735 442H657M720 418H673M705 394H689M690 370H705M675 346H721" class="stair-treads"/><path d="M610 510L730 330H860M640 510L750 350H860" data-zone="stairs" class="home-zone zone-off"/></g>
      <g class="second-story"><path d="M700 330H875V365H700Z" class="landing-fill"/><path d="M700 330H875V365H700" data-zone="balcony" class="home-zone zone-off"/></g>
      <path d="M160 510H605L655 630H110Z" class="patio-fill"/><path d="M160 510H605L655 630H110Z" data-zone="patio" class="home-zone zone-off"/><text x="500" y="48" class="view-heading">REAR FACE + PATIO ACCESS</text><text x="500" y="655" class="view-caption">Patio door · Wall lamps · Second-story landing · Exterior stairs</text>
    </g>
    <g id="viewGarden" class="home-view-layer" hidden>
      <rect x="0" y="0" width="1000" height="680" class="garden-sky"/><path d="M0 430C230 370 410 425 600 400C770 375 875 400 1000 350V680H0Z" class="garden-ground"/>
      <g class="garden-house"><path d="M45 420V210L250 120L460 210V420Z" class="house-fill"/><path d="M45 210L250 120L460 210" class="structure-line roof"/><rect x="120" y="290" width="180" height="130" class="glass-fill"/><path d="M120 420V290H300V420M210 290V420" data-zone="patioDoor" class="home-zone zone-off"/><path d="M80 315H105L98 350H87ZM320 315H345L338 350H327Z" data-zone="wallLamps" class="home-zone zone-off lamp-zone"/></g>
      <path d="M55 420H390L450 535H20Z" class="patio-fill"/><path d="M55 420H390L450 535H20Z" data-zone="patio" class="home-zone zone-off"/>
      <g class="gazebo-perspective"><path d="M610 245L760 175L910 245L875 275H645Z" class="gazebo-roof"/><path d="M645 275V500M875 275V500M690 265V500M830 265V500" class="structure-line"/><path d="M610 245L760 175L910 245M645 275V500M875 275V500M690 265V500M830 265V500" data-zone="gazebo" class="home-zone zone-off"/></g>
      <path d="M420 540C535 475 595 525 660 500" class="path-fill wide"/><path d="M420 540C535 475 595 525 660 500" data-zone="gardenPath" class="home-zone zone-off"/>
      <g class="garden-beds-perspective"><path d="M520 565C590 525 690 535 730 585C650 635 560 630 505 600Z"/><path d="M755 525C820 492 905 505 945 548C890 605 802 603 742 565Z"/></g><path d="M520 565C590 525 690 535 730 585C650 635 560 630 505 600Z M755 525C820 492 905 505 945 548C890 605 802 603 742 565Z" data-zone="gardenBeds" class="home-zone zone-off"/>
      <g class="garden-tree"><path d="M525 390V510" class="tree-trunk"/><circle cx="520" cy="330" r="78"/><circle cx="465" cy="355" r="58"/><circle cx="575" cy="355" r="58"/></g><path d="M525 390V510M455 340C470 250 585 240 610 340C600 420 470 435 440 365Z" data-zone="tree" class="home-zone zone-off"/><path d="M25 465V280M25 300H470M470 300V430M900 470V305M900 325H975" data-zone="fence" class="home-zone zone-off fence-zone"/>
      <text x="500" y="48" class="view-heading">BACKYARD + GARDEN VANTAGE</text><text x="500" y="655" class="view-caption">Patio · Gazebo · Garden path · Beds · Fence · Tree accents</text>
    </g>`;
})();
