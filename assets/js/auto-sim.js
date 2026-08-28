/**
 * ShyneTyme.Works SIM compatibility entry point.
 *
 * SHARED RESPONSIBILITY
 * - Auto, Bike, and Home control UI/behavior belongs in:
 *     assets/css/sim-controls.css
 *     assets/js/sim-controls.js
 *
 * PAGE-SPECIFIC RESPONSIBILITY
 * - Viewport/object geometry, placement, drawing, animation, and scene styling
 *   stay in the simulator-specific CSS/JS files.
 *
 * This file exists only because current Home/Bike pages already reference
 * assets/js/auto-sim.js. Do not add control logic here.
 */
(()=>{
  'use strict';

  const VERSION='20260827-shared-sim-controls-v1';
  const root=document.documentElement;

  // Compatibility aliases keep older viewport CSS aligned with the shared
  // control shell until each viewport stylesheet is fully separated.
  root.style.setProperty('--topbar','var(--topbar-h)');
  root.style.setProperty('--dock','var(--dock-h)');
  root.style.setProperty('--rail-w','var(--rail-full)');

  if(!document.querySelector('link[data-shynetyme-sim-controls]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=`assets/css/sim-controls.css?v=${VERSION}`;
    link.dataset.shynetymeSimControls='shared';
    document.head.appendChild(link);
  }

  if(window.ShynetymeSharedSimControlsLoading||window.ShynetymeSharedSimControlsLoaded)return;
  window.ShynetymeSharedSimControlsLoading=true;

  const script=document.createElement('script');
  script.src=`assets/js/sim-controls.js?v=${VERSION}`;
  script.dataset.shynetymeSimControls='shared';
  script.onload=()=>{
    window.ShynetymeSharedSimControlsLoading=false;
    window.ShynetymeSharedSimControlsLoaded=true;
  };
  script.onerror=()=>{
    window.ShynetymeSharedSimControlsLoading=false;
    console.error('ShyneTyme shared SIM controls failed to load.');
  };
  document.body.appendChild(script);
})();
