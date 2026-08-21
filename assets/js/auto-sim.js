/* Compatibility loader for the rebuilt SIM pages.
   The authoritative shared control behavior is assets/js/sim-controls.js. */
(()=>{
  if(document.querySelector('script[data-sim-controls-loader]'))return;
  const script=document.createElement('script');
  script.src='assets/js/sim-controls.js?v=20260821-sim-rebuild';
  script.dataset.simControlsLoader='true';
  document.head.appendChild(script);
})();
