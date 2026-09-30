(() => {
  'use strict';

  const STORAGE_KEY = 'shynetymeSimAutoSelectionsV4';
  const ZONES = {
    exterior: [
      'front-bumper', 'grille', 'headlights', 'front-wheel-wells', 'rocker-panels',
      'mirrors', 'door-handles', 'window-trim', 'roof-accent', 'rear-wheel-wells',
      'rear-bumper', 'trunk-lip', 'taillights', 'underglow', 'license-plate-area'
    ],
    interior: [
      'dashboard', 'center-console', 'front-footwells', 'rear-footwells',
      'front-door-panels', 'rear-door-panels', 'under-seat', 'rear-deck',
      'trunk-cargo', 'cup-holder-accent', 'seat-accent', 'dash-trim'
    ]
  };

  const LABELS = {
    'front-bumper': 'Front Bumper',
    'grille': 'Grille',
    'headlights': 'Headlights',
    'front-wheel-wells': 'Front Wheel Wells',
    'rocker-panels': 'Side Skirts / Rocker Panels',
    'mirrors': 'Mirrors',
    'door-handles': 'Door Handles',
    'window-trim': 'Window Trim',
    'roof-accent': 'Roof Accent',
    'rear-wheel-wells': 'Rear Wheel Wells',
    'rear-bumper': 'Rear Bumper',
    'trunk-lip': 'Trunk Lip',
    'taillights': 'Taillights',
    'underglow': 'Underglow / Underbody',
    'license-plate-area': 'License Plate Area',
    'dashboard': 'Dashboard',
    'center-console': 'Center Console',
    'front-footwells': 'Front Footwells',
    'rear-footwells': 'Rear Footwells',
    'front-door-panels': 'Front Door Panels',
    'rear-door-panels': 'Rear Door Panels',
    'under-seat': 'Under-Seat Lighting',
    'rear-deck': 'Rear Deck',
    'trunk-cargo': 'Trunk / Cargo Area',
    'cup-holder-accent': 'Cup-Holder Accent',
    'seat-accent': 'Seat Accent',
    'dash-trim': 'Ambient Dash Trim'
  };

  const selected = new Set();
  const page = document.querySelector('.sim-auto-page');
  const countNodes = [...document.querySelectorAll('[data-selected-count]')];
  const zoneButtons = document.querySelector('[data-zone-buttons]');
  const zoneHeading = document.querySelector('[data-zone-heading]');
  const zoneKicker = document.querySelector('[data-zone-kicker]');
  let activeTab = 'exterior';

  const allKnownZones = new Set([...ZONES.exterior, ...ZONES.interior]);

  function save() {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...selected]));
  }

  function load() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved)) {
        saved.filter(id => allKnownZones.has(id)).forEach(id => selected.add(id));
      }
    } catch (error) {
      console.warn('LED Sim Auto selections could not be restored.', error);
    }
  }

  function renderZoneButtons() {
    const ids = ZONES[activeTab];
    zoneKicker.textContent = activeTab;
    zoneHeading.textContent = `Choose ${activeTab} areas`;
    zoneButtons.replaceChildren(...ids.map(id => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sim-zone-option';
      button.dataset.zoneTarget = id;
      button.textContent = LABELS[id];
      button.classList.toggle('is-selected', selected.has(id));
      button.setAttribute('aria-pressed', String(selected.has(id)));
      button.addEventListener('click', () => toggleZone(id));
      return button;
    }));
  }

  function syncUI() {
    document.querySelectorAll('.sim-zone').forEach(zone => {
      const active = selected.has(zone.dataset.zone);
      zone.classList.toggle('is-selected', active);
      zone.setAttribute('aria-pressed', String(active));
    });

    document.querySelectorAll('[data-zone-target]').forEach(button => {
      const active = selected.has(button.dataset.zoneTarget);
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
    });

    countNodes.forEach(node => { node.textContent = String(selected.size); });
    save();
    window.dispatchEvent(new CustomEvent('sedanZoneChange', { detail: { selected: [...selected] } }));
  }

  function toggleZone(id, force) {
    if (!allKnownZones.has(id)) return;
    const shouldSelect = typeof force === 'boolean' ? force : !selected.has(id);
    shouldSelect ? selected.add(id) : selected.delete(id);
    syncUI();
  }

  function setTab(tab) {
    if (!ZONES[tab]) return;
    activeTab = tab;
    document.querySelectorAll('[data-tab]').forEach(button => {
      const active = button.dataset.tab === tab;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('[data-panel]').forEach(panel => {
      const active = panel.dataset.panel === tab;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });
    renderZoneButtons();
  }

  document.querySelectorAll('.sim-zone').forEach(zone => {
    zone.addEventListener('click', () => toggleZone(zone.dataset.zone));
    zone.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleZone(zone.dataset.zone);
      }
    });
  });

  document.querySelectorAll('[data-tab]').forEach(button => {
    button.addEventListener('click', () => setTab(button.dataset.tab));
  });

  document.querySelector('[data-clear]').addEventListener('click', () => {
    selected.clear();
    page.classList.remove('is-previewing');
    document.querySelector('[data-preview]').classList.remove('is-active');
    document.querySelector('[data-preview]').setAttribute('aria-pressed', 'false');
    syncUI();
  });

  document.querySelector('[data-preview]').addEventListener('click', event => {
    const active = page.classList.toggle('is-previewing');
    event.currentTarget.classList.toggle('is-active', active);
    event.currentTarget.setAttribute('aria-pressed', String(active));
    event.currentTarget.textContent = active ? 'Show all zones' : 'Preview selections';
  });

  document.querySelector('[data-next]').addEventListener('click', () => {
    const payload = [...selected].map(id => ({
      id,
      label: LABELS[id],
      view: ZONES.exterior.includes(id) ? 'exterior' : 'interior'
    }));
    sessionStorage.setItem('shynetymeSimAutoSelections', JSON.stringify(payload));
    const params = new URLSearchParams();
    if (payload.length) params.set('autoZones', payload.map(item => item.label).join(', '));
    window.location.href = `../contact.html${params.toString() ? `?${params}` : ''}`;
  });

  window.getSelectedSedanZones = () => [...selected];
  window.setSelectedSedanZones = ids => {
    selected.clear();
    (Array.isArray(ids) ? ids : []).filter(id => allKnownZones.has(id)).forEach(id => selected.add(id));
    syncUI();
  };

  load();
  setTab(activeTab);
  syncUI();
})();
