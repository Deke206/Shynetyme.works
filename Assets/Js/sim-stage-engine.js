/**
 * ShyneTyme.Works - Unified Dynamic SIM Stage Engine
 * Powers Auto, Home, Bike, and Boat 3D/Flash-style LED Simulators
 */

(function () {
  'use strict';

  // --- STAGE CONFIGURATIONS ---
  const STAGE_MODES = {
    auto: {
      name: 'AUTO SIM',
      label: 'Vehicle LED Stage',
      devices: [
        { id: 'underglow', name: 'UNDER GLOW', color: '#18e9ff', on: true },
        { id: 'wheels', name: 'WHEEL LIGHTS', color: '#8b51ff', on: false },
        { id: 'front', name: 'FRONT ACCENT', color: '#ffd928', on: false },
        { id: 'rear', name: 'REAR ACCENT', color: '#ff2ca8', on: false },
        { id: 'interior', name: 'INTERIOR LIGHT', color: '#18e9ff', on: false },
        { id: 'signals', name: 'TURN SIGNALS', color: '#ffd928', on: false }
      ],
      views: [
        { id: 'rear', name: 'REAR 3/4', img: 'assets/images/auto-sim-cyberpunk-rear34.jpg' },
        { id: 'front', name: 'FRONT 3/4', img: 'assets/images/auto-sim-v55-front34.png' },
        { id: 'side', name: 'SIDE', img: 'assets/images/auto-sim-v56-side.png' },
        { id: 'top', name: 'TOP', img: 'assets/images/auto-sim-v55-top.png' }
      ],
      svgPaths: {
        rear: [
          { type: 'underglow', path: 'M 150 480 Q 400 520 650 480', width: 14, glow: '#18e9ff' },
          { type: 'rear', path: 'M 220 320 L 580 320 M 240 340 L 560 340', width: 6, glow: '#ff2ca8' },
          { type: 'wheels', path: 'M 210 440 A 35 35 0 1 1 211 440 M 590 440 A 35 35 0 1 1 591 440', width: 5, glow: '#8b51ff' }
        ],
        front: [
          { type: 'underglow', path: 'M 140 470 Q 400 510 660 470', width: 14, glow: '#18e9ff' },
          { type: 'front', path: 'M 250 310 L 550 310 M 280 330 L 520 330', width: 6, glow: '#ffd928' },
          { type: 'wheels', path: 'M 220 430 A 35 35 0 1 1 221 430 M 580 430 A 35 35 0 1 1 581 430', width: 5, glow: '#8b51ff' }
        ],
        side: [
          { type: 'underglow', path: 'M 100 450 L 700 450', width: 14, glow: '#18e9ff' },
          { type: 'wheels', path: 'M 200 420 A 40 40 0 1 1 201 420 M 600 420 A 40 40 0 1 1 601 420', width: 6, glow: '#8b51ff' }
        ],
        top: [
          { type: 'underglow', path: 'M 250 150 L 550 150 L 550 450 L 250 450 Z', width: 10, glow: '#18e9ff' },
          { type: 'interior', path: 'M 350 250 L 450 250 L 450 350 L 350 350 Z', width: 8, glow: '#18e9ff' }
        ]
      }
    },
    home: {
      name: 'HOME SIM',
      label: 'Estate & Architectural Stage',
      devices: [
        { id: 'roofline', name: 'ROOFLINE EAVES', color: '#18e9ff', on: true },
        { id: 'patio', name: 'PATIO DECK', color: '#3cff70', on: false },
        { id: 'landscape', name: 'LANDSCAPE ACCENT', color: '#ffd928', on: false },
        { id: 'pillars', name: 'ARCH PILLARS', color: '#ff2ca8', on: false }
      ],
      views: [
        { id: 'facade', name: 'FACADE', img: 'assets/images/home-sim-modern-house.webp' },
        { id: 'backyard', name: 'BACKYARD', img: 'assets/images/ledhomesimbackyard.png' },
        { id: 'estate', name: 'ESTATE FRONT', img: 'assets/images/modernsimhome.png' }
      ],
      svgPaths: {
        facade: [
          { type: 'roofline', path: 'M 100 200 L 400 100 L 700 200 M 150 220 L 650 220', width: 10, glow: '#18e9ff' },
          { type: 'patio', path: 'M 200 450 L 600 450', width: 12, glow: '#3cff70' },
          { type: 'pillars', path: 'M 250 250 L 250 450 M 550 250 L 550 450', width: 8, glow: '#ff2ca8' }
        ],
        backyard: [
          { type: 'patio', path: 'M 150 420 Q 400 460 650 420', width: 12, glow: '#3cff70' },
          { type: 'landscape', path: 'M 100 480 L 700 480', width: 8, glow: '#ffd928' }
        ],
        estate: [
          { type: 'roofline', path: 'M 120 180 L 400 80 L 680 180', width: 10, glow: '#18e9ff' },
          { type: 'pillars', path: 'M 300 200 L 300 420 M 500 200 L 500 420', width: 8, glow: '#ff2ca8' }
        ]
      }
    },
    bike: {
      name: 'BIKE SIM',
      label: 'Motorcycle & E-Bike Stage',
      devices: [
        { id: 'front_wheel', name: 'FRONT RIM RING', color: '#18e9ff', on: true },
        { id: 'rear_wheel', name: 'REAR RIM RING', color: '#ff2ca8', on: false },
        { id: 'frame_spine', name: 'FRAME SPINE', color: '#ffd928', on: false },
        { id: 'engine_glow', name: 'ENGINE BAY GLOW', color: '#3cff70', on: false }
      ],
      views: [
        { id: 'street', name: 'STREET PROFILE', img: 'assets/images/bike-planner-street.jpg' },
        { id: 'ride', name: 'NIGHT RIDE', img: 'assets/images/hero-scene-led-ride.webp' }
      ],
      svgPaths: {
        street: [
          { type: 'front_wheel', path: 'M 200 380 A 55 55 0 1 1 201 380', width: 6, glow: '#18e9ff' },
          { type: 'rear_wheel', path: 'M 600 380 A 55 55 0 1 1 601 380', width: 6, glow: '#ff2ca8' },
          { type: 'frame_spine', path: 'M 250 320 L 400 260 L 520 320', width: 8, glow: '#ffd928' },
          { type: 'engine_glow', path: 'M 360 320 Q 400 380 440 320 Z', width: 7, glow: '#3cff70' }
        ],
        ride: [
          { type: 'front_wheel', path: 'M 220 370 A 50 50 0 1 1 221 370', width: 6, glow: '#18e9ff' },
          { type: 'rear_wheel', path: 'M 580 370 A 50 50 0 1 1 581 370', width: 6, glow: '#ff2ca8' }
        ]
      }
    },
    boat: {
      name: 'BOAT SIM',
      label: 'Marine & Yacht Stage',
      devices: [
        { id: 'rubrail', name: 'UNDER-RUBRAIL', color: '#18e9ff', on: true },
        { id: 'transom', name: 'TRANSOM UNDERWATER', color: '#36bfff', on: false },
        { id: 'tower', name: 'TOWER SPEAKERS', color: '#ffd928', on: false },
        { id: 'cabin', name: 'CABIN COCKPIT', color: '#ff2ca8', on: false }
      ],
      views: [
        { id: 'marina', name: 'MARINA DOCK', img: 'assets/images/hero-scene-marina.webp' }
      ],
      svgPaths: {
        marina: [
          { type: 'rubrail', path: 'M 120 360 Q 400 340 680 360', width: 12, glow: '#18e9ff' },
          { type: 'transom', path: 'M 620 420 Q 670 460 720 420', width: 14, glow: '#36bfff' },
          { type: 'cabin', path: 'M 300 300 L 500 300', width: 8, glow: '#ff2ca8' }
        ]
      }
    }
  };

  // --- STATE ---
  let state = {
    mode: 'auto',
    viewId: 'rear',
    activeDevice: 'underglow',
    speed: 68,
    brightness: 82,
    intensity: 76,
    effect: 'Streaming Rainbow',
    direction: 'right',
    animFrame: null,
    phase: 0
  };

  // --- DOM ELEMENTS ---
  let el = {};

  function init() {
    // Parse URL parameter if set (e.g. simulator.html?mode=home)
    const params = new URLSearchParams(window.location.search);
    const initialMode = params.get('mode');
    if (initialMode && STAGE_MODES[initialMode.toLowerCase()]) {
      state.mode = initialMode.toLowerCase();
    }

    cacheDOM();
    bindEvents();
    renderStageMode(state.mode);
    startAnimationLoop();
  }

  function cacheDOM() {
    el.stageModeButtons = document.querySelectorAll('[data-stage-mode]');
    el.viewStrip = document.getElementById('viewStrip');
    el.devicePane = document.getElementById('devicePane');
    el.viewportImg = document.getElementById('viewportImg');
    el.svgOverlay = document.getElementById('simLedSvg');
    el.activeTargetText = document.getElementById('activeTarget');
    el.simDrawerHandle = document.getElementById('simDrawerHandle');
    el.simControlDrawer = document.getElementById('simControlDrawer');
    el.simDrawerSurface = document.getElementById('simDrawerSurface');
    el.speedRange = document.getElementById('speedRange');
    el.speedOutput = document.getElementById('speedOutput');
    el.brightnessRange = document.getElementById('brightnessRange');
    el.brightnessOutput = document.getElementById('brightnessOutput');
    el.effectSelect = document.getElementById('effectSelect');
  }

  function bindEvents() {
    // Stage Mode Switcher (AUTO, HOME, BIKE, BOAT)
    el.stageModeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.stageMode;
        if (mode && STAGE_MODES[mode]) {
          state.mode = mode;
          renderStageMode(mode);
        }
      });
    });

    // Control Drawer toggle
    if (el.simDrawerHandle && el.simDrawerSurface) {
      el.simDrawerHandle.addEventListener('click', () => {
        const expanded = el.simDrawerHandle.getAttribute('aria-expanded') === 'true';
        el.simDrawerHandle.setAttribute('aria-expanded', !expanded);
        if (!expanded) {
          el.simDrawerSurface.removeAttribute('inert');
          el.simControlDrawer.classList.add('is-open');
        } else {
          el.simDrawerSurface.setAttribute('inert', '');
          el.simControlDrawer.classList.remove('is-open');
        }
      });
    }

    // Range Sliders
    if (el.speedRange) {
      el.speedRange.addEventListener('input', (e) => {
        state.speed = parseInt(e.target.value, 10);
        if (el.speedOutput) el.speedOutput.textContent = `${state.speed}%`;
      });
    }

    if (el.brightnessRange) {
      el.brightnessRange.addEventListener('input', (e) => {
        state.brightness = parseInt(e.target.value, 10);
        if (el.brightnessOutput) el.brightnessOutput.textContent = `${state.brightness}%`;
      });
    }

    if (el.effectSelect) {
      el.effectSelect.addEventListener('change', (e) => {
        state.effect = e.target.value;
      });
    }
  }

  function renderStageMode(modeKey) {
    const config = STAGE_MODES[modeKey];
    if (!config) return;

    // Update active tab buttons
    el.stageModeButtons.forEach(btn => {
      const active = btn.dataset.stageMode === modeKey;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active);
    });

    // Render View Chips
    if (el.viewStrip) {
      el.viewStrip.innerHTML = config.views.map((v, i) => `
        <button 
          type="button"
          class="view-chip ${i === 0 ? 'active' : ''}" 
          data-view-id="${v.id}"
          data-img="${v.img}"
          aria-pressed="${i === 0 ? 'true' : 'false'}"
        >${v.name}</button>
      `).join('');

      el.viewStrip.querySelectorAll('.view-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          el.viewStrip.querySelectorAll('.view-chip').forEach(c => {
            c.classList.remove('active');
            c.setAttribute('aria-pressed', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');
          state.viewId = btn.dataset.viewId;
          if (el.viewportImg) el.viewportImg.src = btn.dataset.img;
          renderSVGOverlay();
        });
      });
    }

    // Set initial view image
    state.viewId = config.views[0].id;
    if (el.viewportImg) el.viewportImg.src = config.views[0].img;

    // Render Side Rail Device Tiles
    if (el.devicePane) {
      el.devicePane.innerHTML = config.devices.map((d, i) => `
        <button
          type="button"
          class="device-tile ${d.on ? 'active' : 'off'}"
          data-device-id="${d.id}"
          data-on="${d.on}"
          style="--device: ${d.color}"
        >
          <span class="power-symbol" aria-hidden="true">⏻</span>
          <span class="device-label">${d.name}</span>
        </button>
      `).join('');

      state.activeDevice = config.devices[0].name;
      if (el.activeTargetText) el.activeTargetText.textContent = state.activeDevice;

      el.devicePane.querySelectorAll('.device-tile').forEach(tile => {
        tile.addEventListener('click', () => {
          const deviceId = tile.dataset.deviceId;
          const target = config.devices.find(d => d.id === deviceId);
          if (target) {
            target.on = !target.on;
            tile.dataset.on = target.on;
            tile.classList.toggle('active', target.on);
            tile.classList.toggle('off', !target.on);
            state.activeDevice = target.name;
            if (el.activeTargetText) el.activeTargetText.textContent = target.name;
            renderSVGOverlay();
          }
        });
      });
    }

    renderSVGOverlay();
  }

  function renderSVGOverlay() {
    if (!el.svgOverlay) return;
    const config = STAGE_MODES[state.mode];
    if (!config || !config.svgPaths[state.viewId]) {
      el.svgOverlay.innerHTML = '';
      return;
    }

    const paths = config.svgPaths[state.viewId];
    const devices = config.devices;

    el.svgOverlay.innerHTML = paths.map(p => {
      const dev = devices.find(d => d.id === p.type);
      if (dev && !dev.on) return ''; // don't draw if toggled off

      return `
        <path 
          d="${p.path}" 
          stroke="${dev ? dev.color : p.glow}" 
          stroke-width="${p.width}" 
          fill="none" 
          stroke-linecap="round" 
          style="filter: drop-shadow(0 0 ${state.intensity / 6}px ${dev ? dev.color : p.glow}); opacity: ${state.brightness / 100}"
        />
      `;
    }).join('');
  }

  function startAnimationLoop() {
    function frame() {
      state.phase += (state.speed / 1000);
      // Animate stroke phase for LED streaming effect
      if (el.svgOverlay) {
        const paths = el.svgOverlay.querySelectorAll('path');
        paths.forEach((p, idx) => {
          const dashOffset = (state.phase * 50 + idx * 20) % 100;
          p.style.strokeDasharray = '20 10';
          p.style.strokeDashoffset = dashOffset;
        });
      }
      state.animFrame = requestAnimationFrame(frame);
    }
    frame();
  }

  // Initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
