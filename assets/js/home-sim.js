/* Home SIM viewport behavior only. */
(()=>{
  'use strict';
  const image = document.getElementById('homeView');
  const label = document.getElementById('homeViewLabel');
  window.addEventListener('sim:viewchange',event=>{
    const view = event.detail?.view || {};
    if(view.src && image){ image.src = view.src; image.alt = view.alt || `ShyneTyme.Works Home SIM ${view.label || ''} view`; }
    if(label) label.textContent = view.label || '';
  });
})();
