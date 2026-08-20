/* Auto SIM viewport behavior only. */
(()=>{
  'use strict';
  const image = document.getElementById('autoView');
  const label = document.getElementById('autoViewLabel');
  window.addEventListener('sim:viewchange',event=>{
    const view = event.detail?.view || {};
    if(view.src && image){ image.src = view.src; image.alt = view.alt || `ShyneTyme.Works Auto SIM ${view.label || ''} view`; }
    if(label) label.textContent = view.label || '';
  });
})();
