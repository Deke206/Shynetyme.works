/* Bike SIM viewport behavior only. */
(()=>{
  'use strict';
  const svg = document.getElementById('bikePreview');
  const zoneButtons = () => [...document.querySelectorAll('[data-bike-zone]')];

  window.addEventListener('sim:viewchange',event=>{
    const viewBox = event.detail?.view?.viewBox;
    if(svg && viewBox) svg.setAttribute('viewBox',viewBox);
  });

  window.addEventListener('sim:targetchange',event=>{
    const zone = event.detail?.zone;
    if(!zone) return;
    zoneButtons().filter(node=>node.dataset.bikeZone===zone).forEach(node=>{
      const on = !!event.detail.on;
      node.classList.toggle('is-on',on);
      node.classList.toggle('is-off',!on);
      node.setAttribute('aria-pressed',String(on));
    });
  });

  zoneButtons().forEach(zone=>{
    const activate = ()=>{
      const name = zone.getAttribute('aria-label') || zone.dataset.bikeZone || 'Bike part';
      window.dispatchEvent(new CustomEvent('sim:viewporttarget',{detail:{name,zone:zone.dataset.bikeZone}}));
    };
    zone.addEventListener('click',activate);
    zone.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();activate();}});
  });
})();
