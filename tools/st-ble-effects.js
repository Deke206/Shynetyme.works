const EFFECT_SHORTCUTS=[
['CHASE','CHASE'],['TRICOLOR CHASE','TRICOLOR_CHASE'],['RUNNING DOTS','RUNNING_DOTS'],['COLORFUL','COLOR_WAVES'],['GLITTER','GLITTER'],['SPARKLE+','SPARKLE'],['FLASH','FLASH'],['DUAL FLASH','DUAL_FLASH'],['FIREWORKS','FIREWORKS'],['RAIN','RAIN'],['TETRIX','TETRIX'],['PRIDE','PRIDE'],['PACIFICA','PACIFICA'],['SUNRISE','SUNRISE'],['FLOW','FLOW'],['DANCING SHADOWS','DANCING_SHADOWS'],['TWINKLEFOX','TWINKLEFOX'],['TWINKLECAT','TWINKLECAT'],['FLOW STRIPE','FLOW_STRIPE']
];
(()=>{const g=document.getElementById('shortcutGrid');if(!g)return;for(const [name,fx] of EFFECT_SHORTCUTS){const b=document.createElement('button');b.className='btn pc';b.textContent=name;b.onclick=()=>{selectedFx=fx;markFx();send('FX='+fx)};g.appendChild(b)}})();
