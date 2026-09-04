'use strict';
(()=>{
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const PALETTE_KEY='stw-esp32-effect-palettes-v1',PRESET_KEY='stw-esp32-presets-v3',PLAYLIST_KEY='stw-esp32-custom-v3',PLAYLIST_NAME_KEY='stw-esp32-playlist-name-v1',DEVICE_CFG_KEY='stw-esp32-device-config-v2';
const DEFAULT_PALETTE=Object.freeze({main:'#FFFFFF',bg:'#000000',fg:'#8000FF'});
let uiFx='AURORA',activeRole='main',activeFilter='',previewRaf=0,previewPhase=0,lastPreviewT=0,audioEnergy=0,playlistTimers=[],suppressSavedClickUntil=0,deviceFormDirty=false;

function loadJSON(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return v??fallback}catch(_){return fallback}}
function saveJSON(key,v){try{localStorage.setItem(key,JSON.stringify(v))}catch(_){}}
function currentPalette(){return {main:q('#main')?.value||DEFAULT_PALETTE.main,bg:q('#bg')?.value||DEFAULT_PALETTE.bg,fg:q('#fg')?.value||DEFAULT_PALETTE.fg}}
function readPalettes(){const v=loadJSON(PALETTE_KEY,{});return v&&typeof v==='object'?v:{}}
function hasPalette(fx){const p=readPalettes()[fx];return !!(p&&p.main&&p.bg&&p.fg)}
function effectPalette(fx){const p=readPalettes()[fx];return p&&p.main&&p.bg&&p.fg?{...p}:{...DEFAULT_PALETTE}}
function storePalette(fx=uiFx){const all=readPalettes();all[fx]=currentPalette();saveJSON(PALETTE_KEY,all);renderEffectSwatches()}
function setPalette(p,{transmit=false}={}){for(const k of ['main','bg','fg']){const x=q('#'+k);if(x&&p[k])x.value=p[k].toUpperCase()}syncColorUI();if(transmit&&typeof send==='function'){const c=currentPalette();send(`MAIN=${c.main.slice(1)};BG=${c.bg.slice(1)};FG=${c.fg.slice(1)}`,true)}}

function hexHue(hex){const s=String(hex||'#fff').replace('#','').padEnd(6,'f').slice(0,6),r=parseInt(s.slice(0,2),16)/255,g=parseInt(s.slice(2,4),16)/255,b=parseInt(s.slice(4,6),16)/255,max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;if(!d)return null;let h=max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;h=Math.round(h*60);return h<0?h+360:h}
function hueHex(h){const c=1,x=1-Math.abs((h/60)%2-1);let r=0,g=0,b=0;if(h<60){r=c;g=x}else if(h<120){r=x;g=c}else if(h<180){g=c;b=x}else if(h<240){g=x;b=c}else if(h<300){r=x;b=c}else{r=c;b=x}const z=v=>Math.round(v*255).toString(16).padStart(2,'0').toUpperCase();return '#'+z(r)+z(g)+z(b)}
function syncHue(){const h=hexHue(currentPalette()[activeRole]),range=q('#hueRange'),rail=q('#hueSelector'),value=q('#hueValue');if(h!=null&&range&&rail){range.value=h;rail.style.setProperty('--hx',(h/359*100)+'%')}if(value){value.textContent=currentPalette()[activeRole].toUpperCase();value.style.color=currentPalette()[activeRole]}}
function syncColorUI(){const p=currentPalette();for(const k of ['main','bg','fg']){const sw=q('#'+k+'Swatch');if(sw)sw.style.background=p[k]}const lp=q('#livePicker');if(lp)lp.value=p[activeRole];syncHue();syncSpectrumPickersLocal();renderEffectSwatches();updateLiveState()}
function applyRoleColor(role,hex){const x=q('#'+role);if(!x)return;x.value=hex.toUpperCase();x.dispatchEvent(new Event('input',{bubbles:true}));x.dispatchEvent(new Event('change',{bubbles:true}));syncColorUI()}
qa('.role').forEach(b=>b.addEventListener('click',()=>{qa('.role').forEach(x=>x.classList.remove('on'));b.classList.add('on');activeRole=b.dataset.role;syncColorUI()}));
for(const k of ['main','bg','fg'])q('#'+k)?.addEventListener('input',()=>{storePalette();syncColorUI()});

const hue=q('#hueRange'),hueRail=q('#hueSelector'),hueValue=q('#hueValue');
function applyHue(){if(!hue||!hueRail)return;const h=+hue.value,hex=hueHex(h);hueRail.style.setProperty('--hx',(h/359*100)+'%');if(hueValue){hueValue.textContent=hex;hueValue.style.color=hex}applyRoleColor(activeRole,hex)}
function endHue(){hueRail?.classList.remove('is-active');syncHue()}
if(hue&&hueRail){hue.addEventListener('pointerdown',()=>hueRail.classList.add('is-active'));hue.addEventListener('input',applyHue);hue.addEventListener('pointerup',endHue);hue.addEventListener('pointercancel',endHue);hue.addEventListener('change',()=>setTimeout(endHue,70));hue.addEventListener('blur',endHue)}

function updateGlass(x){const rail=x.closest('.railglass');if(!rail)return;const min=+x.min||0,max=+x.max||100,v=+x.value,p=Math.max(0,Math.min(100,(v-min)/(max-min)*100));rail.querySelector('.fill').style.width=p+'%';rail.querySelector('.thumb').style.left=p+'%';const o=q('#'+x.id+'V');if(o)o.textContent=x.id==='audamt'?x.value:Math.round(p)+'%'}
qa('.railglass input[type=range]').forEach(x=>{updateGlass(x);x.addEventListener('input',()=>updateGlass(x))});
q('#mirrorBtn')?.addEventListener('click',()=>{const m=q('#mirror');m.checked=!m.checked;m.dispatchEvent(new Event('change',{bubbles:true}));q('#mirrorBtn').classList.toggle('on',m.checked)});

function renderEffectSwatches(){const all=readPalettes();qa('.fx[data-fx]').forEach(b=>{const host=b.querySelector('.fx-palette');if(!host)return;host.innerHTML='';const p=all[b.dataset.fx];for(const c of p&&p.main&&p.bg&&p.fg?[p.main,p.bg,p.fg]:['#07101a','#07101a','#07101a']){const i=document.createElement('i');i.style.background=c;host.append(i)}})}
function selectEffect(btn,{transmitColors=true}={}){if(!btn?.dataset.fx)return;uiFx=btn.dataset.fx;setPalette(effectPalette(uiFx),{transmit:transmitColors});q('#activeFxName').textContent=btn.querySelector('b')?.textContent||uiFx;qa('.fx[data-fx]').forEach(x=>x.classList.toggle('on',x===btn));updateLiveState()}
qa('.fx[data-fx]').forEach(b=>b.addEventListener('click',()=>selectEffect(b),true));
qa('#music [data-fx]').forEach(b=>b.addEventListener('click',()=>{const match=q(`.fx[data-fx="${b.dataset.fx}"]`);if(match)selectEffect(match)}));

function filterFx(){const term=(q('#fxSearch')?.value||'').trim().toLowerCase();let n=0;qa('.fxlist .fx').forEach(x=>{const cat=x.dataset.cat||'',hit=(!term||x.textContent.toLowerCase().includes(term))&&(!activeFilter||cat.includes(activeFilter));x.classList.toggle('hide',!hit);if(hit)n++});q('#fxCount').textContent=n}
q('#fxSearch')?.addEventListener('input',filterFx);
qa('.filter-chip').forEach(b=>b.addEventListener('click',()=>{const same=activeFilter===b.dataset.filter;activeFilter=same?'':b.dataset.filter;qa('.filter-chip').forEach(x=>x.classList.toggle('on',x.dataset.filter===activeFilter));filterFx()}));

function ensureLedHost(selector,count){const host=q(selector);if(!host)return;while(host.children.length<count)host.append(document.createElement('i'))}
function previewColor(i,p){return [p.main,p.bg,p.fg][Math.abs(Math.floor(i))%3]}
function modeForFx(fx){return q(`.fx[data-fx="${fx}"]`)?.dataset.preview||'flow'}
function speedRate(){const n=Math.max(0,Math.min(1,(+q('#spd')?.value||128)/255));return 2.2+Math.pow(n,1.45)*62}
function paintLedSet(leds,p,mode,phase){const n=leds.length;if(!n)return;const bri=Math.max(.08,(+q('#bri')?.value||70)/255),inten=Math.max(.12,(+q('#int')?.value||190)/255),size=1+Math.round((+q('#size')?.value||72)/255*7),audioScale=Math.max(.12,audioEnergy);for(let i=0;i<n;i++){let c=p.bg,op=.11,on=false;
  if(mode==='off'){c='#000000';op=.04}
  else if(mode==='solid'){c=p.main;op=1}
  else if(mode==='chase'){const width=Math.max(2,size),period=width*3,k=Math.floor((i+phase)%period);on=k<width;c=on?previewColor(Math.floor(k/Math.max(1,width/3)),p):p.bg;op=on?1:.10}
  else if(mode==='flow'){const width=Math.max(3,size+2),k=Math.floor((i+phase)%(width*3));on=k<width;c=on?previewColor(Math.floor(k/Math.max(1,width/3)),p):p.bg;op=on?1:.09}
  else if(mode==='scanner'){const x=Math.abs(((phase%(2*n-2)))-(n-1)),d=Math.abs(i-x),tail=Math.max(2,size*.65);c=d<1?p.main:d<tail*.45?p.fg:d<tail?p.bg:p.bg;op=d<1?1:d<tail?Math.max(.12,.70-d/tail*.62):.06}
  else if(mode==='comet'){const head=Math.floor(phase%n),d=(head-i+n)%n,tail=Math.max(3,size+2);c=d===0?p.main:d<tail*.55?p.fg:d<tail?p.bg:p.bg;op=d===0?1:d<tail?Math.max(.10,1-d/tail):.05}
  else if(mode==='ripple'){const d=Math.abs(i-(n-1)/2),r=(phase%(n/2)),w=Math.max(1.2,size*.45),qd=Math.abs(d-r);c=qd<1?p.main:qd<w?p.fg:p.bg;op=qd<1?1:qd<w?.45:.06}
  else if(mode==='twinkle'||mode==='fireworks'){const seed=Math.sin(i*91.7+Math.floor(phase)*13.3)*43758.5453,rand=seed-Math.floor(seed);on=rand>(.90-inten*.22);c=previewColor(i+Math.floor(phase),p);op=on?1:.06}
  else if(mode==='rain'){const gap=Math.max(4,11-size),k=(i+Math.floor(phase*1.35))%gap;on=k<2;c=previewColor(i+Math.floor(phase),p);op=on?1:.06}
  else if(mode==='fire'){const flick=(Math.sin(i*2.7+phase*1.6)+1)/2;c=flick>.66?p.main:flick>.33?p.fg:p.bg;op=.25+flick*.75}
  else if(mode==='lightning'){const beat=Math.max(4,Math.round(15-inten*8)),strike=Math.floor(phase)%beat===0;on=strike&&(i%3!==0);c=on?previewColor(Math.floor(phase/beat)+i,p):p.bg;op=on?1:.06}
  else if(mode==='pulse'){const pulse=(Math.sin(phase*.45)+1)/2;c=previewColor(i,p);op=.08+pulse*.92}
  else if(mode==='balls'){const a=Math.floor((Math.sin(phase*.32)+1)/2*(n-1)),b=Math.floor((Math.sin(phase*.47+2)+1)/2*(n-1));const d=Math.min(Math.abs(i-a),Math.abs(i-b));c=d<1?p.main:d<2?p.fg:p.bg;op=d<1?1:d<2?.5:.06}
  else if(mode==='spectrum'){const band=i%9,h=audioEnergy>.02?audioScale:(Math.sin(phase*.32+band*.7)+1)/2;c=previewColor(Math.floor(i/Math.max(1,n/3)),p);op=.08+h*.92}
  else if(mode==='strobe'){const onFrame=Math.floor(phase)%4<2;c=onFrame?previewColor(Math.floor(i/Math.max(1,n/3)),p):p.bg;op=onFrame?1:.05}
  else if(mode==='rainbow'){const h=((i*360/n)+(phase*4.5))%360;c=hueHex(h);op=1}
  else{c=previewColor(i+Math.floor(phase),p);op=.9}
  const el=leds[i];el.style.background=c;el.style.color=c;el.style.opacity=Math.max(.03,Math.min(1,op*bri*(.55+.45*inten))).toFixed(2)
}}
function renderPreview(t=0){if(!lastPreviewT)lastPreviewT=t;const dt=Math.max(0,Math.min(.05,(t-lastPreviewT)/1000));lastPreviewT=t;const reactive=(typeof micOn!=='undefined'&&micOn)?(.72+audioEnergy*1.9):1;previewPhase+=dt*speedRate()*reactive*(q('#dir')?.value==='REV'?-1:1);const p=currentPalette(),mode=modeForFx(uiFx);paintLedSet(qa('#ledPreview i'),p,mode,previewPhase);paintLedSet(qa('#stateStrip i'),p,mode,previewPhase);previewRaf=requestAnimationFrame(renderPreview)}
ensureLedHost('#ledPreview',42);ensureLedHost('#stateStrip',24);previewRaf=requestAnimationFrame(renderPreview);

function updateLiveState(){const d=typeof ds!=='undefined'?ds[typeof ai==='number'?ai:0]:null;const i=typeof ai==='number'?ai:0;const deviceName=d?.device?.name||`ESP32 #${i+1}`;if(q('#stateDevice'))q('#stateDevice').textContent=deviceName;if(q('#stateFx'))q('#stateFx').textContent=uiFx;if(q('#activeFxName'))q('#activeFxName').textContent=q(`.fx[data-fx="${uiFx}"] b`)?.textContent||uiFx}

function captureState(name='Preset'){const p=currentPalette();return {name,fx:uiFx,...p,bri:q('#bri').value,spd:q('#spd').value,int:q('#int').value,size:q('#size').value,dens:q('#dens').value,trail:q('#trail').value,dir:q('#dir').value,mirror:q('#mirror').checked,audmode:q('#audmode')?.value||'FULL',audamt:q('#audamt')?.value||180}}
function applyState(s){if(!s)return;uiFx=s.fx||uiFx;setPalette({main:s.main||DEFAULT_PALETTE.main,bg:s.bg||DEFAULT_PALETTE.bg,fg:s.fg||DEFAULT_PALETTE.fg},{transmit:true});for(const k of ['bri','spd','int','size','dens','trail','audamt'])if(s[k]!=null&&q('#'+k)){q('#'+k).value=s[k];q('#'+k).dispatchEvent(new Event('input',{bubbles:true}));q('#'+k).dispatchEvent(new Event('change',{bubbles:true}))}if(s.dir&&q('#dir')){q('#dir').value=s.dir;q('#dir').dispatchEvent(new Event('change',{bubbles:true}))}if(s.audmode&&q('#audmode')){q('#audmode').value=s.audmode;q('#audmode').dispatchEvent(new Event('change',{bubbles:true}))}if(q('#mirror')){q('#mirror').checked=!!s.mirror;q('#mirror').dispatchEvent(new Event('change',{bubbles:true}));q('#mirrorBtn')?.classList.toggle('on',!!s.mirror)}const b=q(`.fx[data-fx="${uiFx}"]`);if(b)b.click();updateLiveState()}
function presets(){const x=loadJSON(PRESET_KEY,[]);return Array.isArray(x)?x:[]}
function savePresets(x){saveJSON(PRESET_KEY,x.slice(0,40))}
function playlist(){const x=loadJSON(PLAYLIST_KEY,[]);return Array.isArray(x)?x:[]}
function savePlaylist(x){saveJSON(PLAYLIST_KEY,x.slice(0,80))}

function showDialog({title='Confirm',message='',input=false,value='',ok='OK'}={}){return new Promise(resolve=>{const wrap=q('#appDialog'),ti=q('#dialogTitle'),msg=q('#dialogMessage'),inp=q('#dialogInput'),cancel=q('#dialogCancel'),yes=q('#dialogOk');ti.textContent=title;msg.textContent=message;inp.hidden=!input;inp.value=value;yes.textContent=ok;wrap.hidden=false;if(input)setTimeout(()=>{inp.focus();inp.select()},30);else setTimeout(()=>yes.focus(),30);const finish=v=>{wrap.hidden=true;cancel.onclick=yes.onclick=null;inp.onkeydown=null;resolve(v)};cancel.onclick=()=>finish(null);yes.onclick=()=>finish(input?inp.value:true);inp.onkeydown=e=>{if(e.key==='Enter')finish(inp.value);if(e.key==='Escape')finish(null)};wrap.onclick=e=>{if(e.target===wrap)finish(null)}})}
async function saveCurrentPreset(){const entered=await showDialog({title:'NAME PRESET',message:'Give this light state a name.',input:true,value:uiFx,ok:'SAVE'});if(entered===null)return;const name=entered.trim()||uiFx,list=presets();list.unshift(captureState(name));savePresets(list);renderPresets()}
function addToPlaylist(state){const list=playlist();list.push({...state,name:state.name||state.fx||'Effect'});savePlaylist(list);renderPlaylist()}
q('#saveLook')?.addEventListener('click',saveCurrentPreset);q('#saveFxPreset')?.addEventListener('click',saveCurrentPreset);q('#addFxPlaylist')?.addEventListener('click',()=>addToPlaylist(captureState(uiFx)));q('#addScene')?.addEventListener('click',()=>addToPlaylist(captureState(uiFx)));

function renderPresets(){const list=presets(),grid=q('#presetGrid');q('#presetCount').textContent=list.length?`${list.length} SAVED`:'';grid.innerHTML='';if(!list.length){grid.innerHTML='<div class="empty">No saved presets yet.</div>';return}list.forEach((p,i)=>{const card=document.createElement('article');card.className='preset-card';const title=document.createElement('b');title.textContent=p.name||`Preset ${i+1}`;const info=document.createElement('small');info.textContent=`${p.fx} · ${p.main} · ${p.bg} · ${p.fg}`;const actions=document.createElement('div');actions.className='actions';const load=document.createElement('button');load.className='tiny-btn';load.textContent='LOAD';load.onclick=()=>applyState(p);const add=document.createElement('button');add.className='tiny-btn';add.textContent='+ PLAYLIST';add.onclick=()=>addToPlaylist(p);const del=document.createElement('button');del.className='tiny-btn danger';del.textContent='DELETE';del.onclick=async()=>{const ok=await showDialog({title:'DELETE PRESET',message:`Delete “${p.name||p.fx}”?`,ok:'DELETE'});if(!ok)return;const x=presets();x.splice(i,1);savePresets(x);renderPresets()};actions.append(load,add,del);card.append(title,info,actions);grid.append(card)})}

function clearPlaylistTimers(){playlistTimers.forEach(clearTimeout);playlistTimers=[]}
function stopPlaylist({blackout=true}={}){clearPlaylistTimers();if(blackout&&typeof send==='function'){uiFx='OFF';if(typeof selectedFx!=='undefined')selectedFx='OFF';if(typeof markFx==='function')markFx();send('FX=OFF',true);updateLiveState()}}
function renderPlaylist(){const list=playlist(),host=q('#customScenes');q('#customCount').textContent=list.length?`${list.length} ITEMS`:'';host.innerHTML='';if(!list.length){host.innerHTML='<div class="empty">Add an effect or preset to build a playlist.</div>';return}list.forEach((s,i)=>{const row=document.createElement('div');row.className='playlist-row';const num=document.createElement('span');num.className='playlist-num';num.textContent=i+1;const text=document.createElement('span');const b=document.createElement('b');b.textContent=s.name||s.fx||`Item ${i+1}`;const sm=document.createElement('small');sm.textContent=`${s.fx} · ${s.main} · ${s.bg} · ${s.fg}`;text.append(b,sm);const actions=document.createElement('div');actions.className='actions';const load=document.createElement('button');load.className='tiny-btn';load.textContent='LOAD';load.onclick=()=>applyState(s);const del=document.createElement('button');del.className='tiny-btn danger';del.textContent='DELETE';del.onclick=async()=>{const ok=await showDialog({title:'DELETE PLAYLIST ITEM',message:`Remove “${s.name||s.fx}” from the playlist?`,ok:'DELETE'});if(!ok)return;const x=playlist();x.splice(i,1);savePlaylist(x);renderPlaylist()};actions.append(load,del);row.append(num,text,actions);host.append(row)})}
q('#playCustom')?.addEventListener('click',()=>{clearPlaylistTimers();const list=playlist();list.forEach((s,i)=>playlistTimers.push(setTimeout(()=>applyState(s),i*1200)))});q('#stopCustom')?.addEventListener('click',()=>stopPlaylist({blackout:true}));
const pn=q('#playlistName');if(pn){pn.value=localStorage.getItem(PLAYLIST_NAME_KEY)||'My Light Sequence';pn.addEventListener('input',()=>localStorage.setItem(PLAYLIST_NAME_KEY,pn.value))}

function syncSpectrumPickersLocal(){const map=[['spectrumLow','bg'],['spectrumMid','main'],['spectrumHigh','fg']];for(const [sid,rid] of map)if(q('#'+sid)&&q('#'+rid))q('#'+sid).value=q('#'+rid).value}
for(const [sid,rid] of [['spectrumLow','bg'],['spectrumMid','main'],['spectrumHigh','fg']])q('#'+sid)?.addEventListener('input',e=>{activeRole=rid;qa('.role').forEach(x=>x.classList.toggle('on',x.dataset.role===rid));applyRoleColor(rid,e.target.value)});
if(typeof updateSpectrumPalette==='function')updateSpectrumPalette=function(){const bars=qa('#spectrumBars i'),p=currentPalette();bars.forEach((bar,i)=>{const c=i<bars.length/3?p.bg:i<bars.length*2/3?p.main:p.fg;bar.style.background=c;bar.style.boxShadow=`0 0 6px ${c}`})};
if(typeof renderSpectrum==='function')renderSpectrum=function(fd){const bars=qa('#spectrumBars i');if(!bars.length||!fd?.length)return;const amount=Math.max(0,Math.min(1,(+q('#audamt')?.value||0)/255));let total=0;for(let i=0;i<bars.length;i++){const start=Math.floor(i*fd.length/bars.length),end=Math.max(start+1,Math.floor((i+1)*fd.length/bars.length));let sum=0;for(let n=start;n<end;n++)sum+=fd[n];const avg=sum/(end-start);total+=avg;const height=Math.max(4,Math.min(100,4+amount*(avg/255)*108));bars[i].style.height=height.toFixed(1)+'%'}audioEnergy=Math.max(0,Math.min(1,(total/bars.length)/255*amount*1.25));updateSpectrumPalette()};

function deleteSavedColor(color,button){const key='stw-esp32-saved-colors-v1',list=loadJSON(key,[]).filter(x=>String(x).toUpperCase()!==String(color).toUpperCase());saveJSON(key,list);button?.remove();suppressSavedClickUntil=Date.now()+500}
const savedHost=q('.saved');let holdTimer=null;
savedHost?.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-user-color]');if(!b)return;holdTimer=setTimeout(()=>{deleteSavedColor(b.dataset.userColor,b);holdTimer=null},650)});for(const ev of ['pointerup','pointercancel','pointerleave'])savedHost?.addEventListener(ev,()=>{if(holdTimer)clearTimeout(holdTimer);holdTimer=null});savedHost?.addEventListener('click',e=>{if(Date.now()<suppressSavedClickUntil){e.preventDefault();e.stopImmediatePropagation()}},true);

// Remove the core's immediate ORDER write: device configuration is committed only by Save.
const orderNode=q('#order');if(orderNode){const clone=orderNode.cloneNode(true);orderNode.replaceWith(clone)}
function defaultDeviceCfg(){return {leds:300,gpio:13,order:'GRB',segFrom:0,segTo:299,startupFx:'AURORA'}}
function loadDeviceCfgs(){const v=loadJSON(DEVICE_CFG_KEY,[]);return [0,1].map(i=>({...defaultDeviceCfg(),...(v[i]||{})}))}
let deviceCfgs=loadDeviceCfgs();
function saveDeviceCfgs(){saveJSON(DEVICE_CFG_KEY,deviceCfgs);renderDeviceMeta()}
function readDeviceForm(){return {leds:+q('#leds').value,gpio:+q('#gpio').value,order:q('#order').value,segFrom:+q('#segFrom').value,segTo:+q('#segTo').value,startupFx:q('#startupFx').value||uiFx}}
function renderDeviceMeta(){for(let i=0;i<2;i++){const c=deviceCfgs[i]||defaultDeviceCfg(),m=q('#deviceMeta'+i);if(m)m.textContent=`${c.leds} LEDs · GPIO ${c.gpio} · ${c.segFrom}–${c.segTo}`}}
function loadDeviceForm(i){const c=deviceCfgs[i]||defaultDeviceCfg();q('#leds').value=c.leds;q('#gpio').value=c.gpio;q('#order').value=c.order;q('#segFrom').value=c.segFrom;q('#segTo').value=c.segTo;q('#segTo').max=Math.max(0,c.leds-1);q('#segFrom').max=Math.max(0,c.leds-1);if(q('#startupFx'))q('#startupFx').value=c.startupFx||uiFx;q('#deviceSettingsTarget').textContent=q('#sync')?.checked?'SYNC BOTH':`ESP32 #${i+1}`;deviceFormDirty=false;renderDeviceMeta()}
function validateDeviceCfg(c){if(!Number.isFinite(c.leds)||c.leds<1||c.leds>600)return 'LED count must be 1–600.';if(!Number.isFinite(c.gpio)||c.gpio<0||c.gpio>39)return 'GPIO must be 0–39.';if(c.segFrom<0||c.segTo<c.segFrom||c.segTo>=c.leds)return `Effect range must stay inside 0–${c.leds-1}.`;return ''}
for(const id of ['leds','gpio','order','segFrom','segTo','startupFx'])q('#'+id)?.addEventListener('input',()=>{deviceFormDirty=true;if(id==='leds'){const max=Math.max(0,(+q('#leds').value||1)-1);q('#segFrom').max=max;q('#segTo').max=max}});
function parseStatusObject(text){const o={};for(const p of String(text||'').split(';')){const n=p.indexOf('=');if(n>0)o[p.slice(0,n)]=p.slice(n+1)}return o}
function updateCfgFromStatus(i,text){const st=parseStatusObject(text),c={...(deviceCfgs[i]||defaultDeviceCfg())};if(st.CFGLEDS||st.LEDS)c.leds=+(st.CFGLEDS||st.LEDS)||c.leds;if(st.CFGPIN||st.PIN)c.gpio=+(st.CFGPIN||st.PIN);if(st.ORDER)c.order=st.ORDER;deviceCfgs[i]=c;saveDeviceCfgs();if(i===ai&&!deviceFormDirty)loadDeviceForm(i)}

const coreSyncUI=typeof syncUI==='function'?syncUI:null;
if(coreSyncUI){syncUI=function(st){const draft=deviceFormDirty?readDeviceForm():null;coreSyncUI(st);if(st?.FX){uiFx=st.FX;qa('.fx[data-fx]').forEach(x=>x.classList.toggle('on',x.dataset.fx===uiFx));updateLiveState()}if(draft){q('#leds').value=draft.leds;q('#gpio').value=draft.gpio;q('#order').value=draft.order;q('#segFrom').value=draft.segFrom;q('#segTo').value=draft.segTo;q('#startupFx').value=draft.startupFx}updateLiveState()}}
const coreParse=typeof parseStatus==='function'?parseStatus:null;if(coreParse){parseStatus=function(i,text,syncUIAfter=false){coreParse(i,text,syncUIAfter);updateCfgFromStatus(i,text)}}
const coreUse=typeof use==='function'?use:null;if(coreUse){use=function(i){deviceFormDirty=false;coreUse(i);if(typeof ds!=='undefined'&&ds[i]?.state&&Object.keys(ds[i].state).length&&coreSyncUI){coreSyncUI(ds[i].state);if(ds[i].state.FX)uiFx=ds[i].state.FX}loadDeviceForm(i);updateLiveState()}}

for(let i=0;i<2;i++){const card=q('#d'+i);card?.addEventListener('click',e=>{if(e.target.closest('#con'+i))return;use(i)});card?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();use(i)}})}
q('#sync')?.addEventListener('change',()=>{q('#deviceSettingsTarget').textContent=q('#sync').checked?'SYNC BOTH':`ESP32 #${ai+1}`});

const coreSaveConfig=typeof saveConfig==='function'?saveConfig:null;
if(coreSaveConfig){saveConfig=async function(reboot=false){const c=readDeviceForm(),err=validateDeviceCfg(c);if(err){q('#status').textContent=err;return}const active=typeof targets==='function'?targets():[];if(!active.length){q('#status').textContent='Connect the focused ESP32 before saving settings.';return}await coreSaveConfig(reboot);const ids=q('#sync')?.checked?active.map(d=>d.i):[ai];for(const i of ids)deviceCfgs[i]={...c};saveDeviceCfgs();deviceFormDirty=false;loadDeviceForm(ai);q('#status').textContent=`Settings sent to ${q('#sync')?.checked?'both controllers':`ESP32 #${ai+1}`}: ${c.leds} LEDs · GPIO ${c.gpio} · ${c.order}. Effect range ${c.segFrom}–${c.segTo} saved in the app.`;q('#deviceSaveNote').textContent='Device settings saved. Effect range is retained per controller in the app; no verified FROM/TO firmware command exists in the current controller protocol.'}}

function buildEffectCommand(fx){const p=effectPalette(fx);return `FX=${fx};MAIN=${p.main.slice(1)};BG=${p.bg.slice(1)};FG=${p.fg.slice(1)};BRI=${q('#bri').value};SPD=${q('#spd').value};INT=${q('#int').value};SIZE=${q('#size').value};DENS=${q('#dens').value};TRAIL=${q('#trail').value};DIR=${q('#dir').value};MIRROR=${q('#mirror').checked?1:0}`}
async function saveStartupEffect(){const active=typeof targets==='function'?targets():[];if(!active.length){q('#status').textContent='Connect the focused ESP32 before saving startup.';return}const fx=q('#startupFx').value||uiFx,restore=buildEffectCommand(uiFx);await send(buildEffectCommand(fx),true);await send('SAVE',true);if(fx!==uiFx)await send(restore,true);const ids=q('#sync')?.checked?active.map(d=>d.i):[ai];for(const i of ids)deviceCfgs[i]={...(deviceCfgs[i]||defaultDeviceCfg()),startupFx:fx};saveDeviceCfgs();q('#status').textContent=`Startup state saved as ${fx} for ${q('#sync')?.checked?'both controllers':`ESP32 #${ai+1}`}.`}
q('#saveStartup')?.addEventListener('click',saveStartupEffect);
function fillStartupFx(){const sel=q('#startupFx');if(!sel)return;sel.innerHTML='';for(const b of qa('.fx[data-fx]')){if(b.dataset.fx==='OFF')continue;const o=document.createElement('option');o.value=b.dataset.fx;o.textContent=b.querySelector('b')?.textContent||b.dataset.fx;sel.append(o)}}fillStartupFx();

renderEffectSwatches();syncColorUI();filterFx();renderPresets();renderPlaylist();renderDeviceMeta();loadDeviceForm(typeof ai==='number'?ai:0);updateLiveState();
if(typeof activateTab==='function')activateTab('device');
})();
