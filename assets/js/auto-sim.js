/**
 * Shared Auto, Home, and Bike simulator script
 *
 * CONTENTS
 * 1. Element helpers and page state
 * 2. Interactive controls and object rendering
 * 3. Local media / saved settings
 * 4. Responsive and accessibility behavior
 */

(()=>{
'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const root=document.documentElement,simulatorType=document.body.dataset.simulator||'auto',app=q('#appGrid'),rail=q('#sideRail'),toggle=q('#sidebarToggle'),pop=q('#devicePop'),drawer=q('#drawerPanel'),drawerEdge=q('#drawerEdgeToggle'),view=q('#mainView'),bikeView=q('#bikePreview'),label=q('#activeViewLabel'),target=q('#activeTarget'),effectSelect=q('#effectSelect'),drawerMeta=q('.drawer-meta'),viewport=q('#viewport');
let popTimer=null,activeTab=null,lastTab='effects',gesture=null,sidebarState='closed';
function viewportVars(){const v=window.visualViewport;const w=Math.round(v?.width||innerWidth),h=Math.round(v?.height||innerHeight);root.style.setProperty('--vh',h+'px');root.style.setProperty('--vw',w+'px');const nav=q('body>.navbar'),crumb=q('#page-subheader'),footer=q('.site-footer--compact');const visibleHeight=element=>element&&getComputedStyle(element).display!=='none'?Math.round(element.getBoundingClientRect().height):0;root.style.setProperty('--site-nav-h',visibleHeight(nav)+'px');root.style.setProperty('--site-crumb-h',visibleHeight(crumb)+'px');root.style.setProperty('--site-footer-h',visibleHeight(footer)+'px');const railW=Math.round(Math.min(246,Math.max(220,w*.26)));const peekW=Math.round(Math.min(184,Math.max(176,w*.19)));root.style.setProperty('--rail-w',railW+'px');root.style.setProperty('--rail-peek',Math.min(peekW,railW-48)+'px')}
function setSidebar(state='closed'){if(state===true)state='peek';if(state===false)state='closed';sidebarState=state;app.classList.toggle('sidebar-peek',state==='peek');app.classList.toggle('sidebar-open',state==='full');toggle.dataset.state=state;const label=state==='closed'?'Open sidebar halfway':state==='peek'?'Open sidebar fully':'Close sidebar';toggle.setAttribute('aria-label',label);toggle.title=label}
function closeDrawer(){stopMicSpectrum();drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');drawerEdge?.setAttribute('aria-label','Open lower controls');drawerEdge&&(drawerEdge.title='Open lower controls');qa('.dock-tab').forEach(x=>x.classList.remove('active'));activeTab=null}
function openDrawer(id,btn){qa('.panel-page').forEach(p=>p.classList.toggle('active',p.dataset.page===id));qa('.dock-tab').forEach(x=>x.classList.toggle('active',x===btn));btn.classList.remove('splash');void btn.offsetWidth;btn.classList.add('splash');drawer.classList.add('open');drawer.setAttribute('aria-hidden','false');drawerEdge?.setAttribute('aria-label','Close lower controls');drawerEdge&&(drawerEdge.title='Close lower controls');activeTab=id;lastTab=id;if(id!=='music')stopMicSpectrum()}
function closeOverlays(){closeDrawer();setSidebar('closed')}
toggle.addEventListener('click',e=>{e.stopPropagation();const next=sidebarState==='closed'?'peek':sidebarState==='peek'?'full':'closed';setSidebar(next)});
['contextmenu','copy','cut','dragstart','selectstart'].forEach(type=>rail.addEventListener(type,e=>e.preventDefault()));
qa('[data-rail]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();qa('[data-rail]').forEach(x=>x.classList.toggle('active',x===btn));q('#devicePane').hidden=btn.dataset.rail!=='devices';q('#groupPane').hidden=btn.dataset.rail!=='groups'}));
const HOLD_MS=2000,holdTimers=new WeakMap(),heldPower=new WeakSet();
function selectDevice(btn){qa('.device-tile').forEach(x=>x.classList.toggle('active',x===btn));const name=btn.dataset.name||'Selected';const color=getComputedStyle(btn).getPropertyValue('--device').trim()||'#18e9ff';target.textContent=name.toUpperCase();drawerMeta?.style.setProperty('--target-color',color);if(simulatorType==='bike'&&effectSelect)effectSelect.value='streaming-rainbow';pop.textContent=btn.dataset.count?`${name} · ${btn.dataset.count} DEVICES`:name;if(sidebarState==='peek')setSidebar('full');clearTimeout(popTimer);pop.classList.add('show');popTimer=setTimeout(()=>pop.classList.remove('show'),1100)}
function syncBikeZone(btn){if(simulatorType!=='bike'||!btn?.dataset.zone)return;qa(`[data-bike-zone="${btn.dataset.zone}"]`).forEach(zone=>{const on=btn.dataset.on!=='false';zone.classList.toggle('is-on',on);zone.classList.toggle('is-off',!on);zone.setAttribute('aria-pressed',String(on))})}
function toggleDevicePower(btn){const on=btn.dataset.on!=='false';btn.dataset.on=String(!on);btn.classList.toggle('off',on);btn.setAttribute('aria-pressed',String(!on));btn.classList.remove('holding');btn.classList.add('power-flash');syncBikeZone(btn);setTimeout(()=>btn.classList.remove('power-flash'),300);pop.textContent=`${btn.dataset.name||'Device'} · ${!on?'ON':'OFF'}`;clearTimeout(popTimer);pop.classList.add('show');popTimer=setTimeout(()=>pop.classList.remove('show'),900)}
qa('.device-tile').forEach(btn=>{
  btn.addEventListener('pointerdown',e=>{e.stopPropagation();selectDevice(btn);heldPower.delete(btn);btn.classList.add('holding');const timer=setTimeout(()=>{heldPower.add(btn);toggleDevicePower(btn)},HOLD_MS);holdTimers.set(btn,timer)});
  const cancelHold=()=>{const timer=holdTimers.get(btn);if(timer)clearTimeout(timer);holdTimers.delete(btn);btn.classList.remove('holding')};
  btn.addEventListener('pointerup',e=>{e.stopPropagation();cancelHold()});
  btn.addEventListener('pointercancel',cancelHold);
  btn.addEventListener('pointerleave',e=>{if(e.buttons)cancelHold()});
  btn.addEventListener('contextmenu',e=>e.preventDefault());
  btn.addEventListener('click',e=>{e.stopPropagation();if(heldPower.has(btn)){heldPower.delete(btn);return}selectDevice(btn);if(btn.dataset.clickToggle==='true')toggleDevicePower(btn)});
});
qa('[data-bike-zone]').forEach(zone=>{zone.addEventListener('click',e=>{e.stopPropagation();const btn=q(`.device-tile[data-zone="${zone.dataset.bikeZone}"]`);if(btn){selectDevice(btn);toggleDevicePower(btn)}});zone.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;e.preventDefault();const btn=q(`.device-tile[data-zone="${zone.dataset.bikeZone}"]`);if(btn){selectDevice(btn);toggleDevicePower(btn)}})});
q('.add-device')?.addEventListener('click',e=>{e.stopPropagation();pop.textContent='ADD DEVICE';pop.classList.add('show');clearTimeout(popTimer);popTimer=setTimeout(()=>pop.classList.remove('show'),1000)});
qa('.view-chip').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();closeDrawer();setSidebar('closed');qa('.view-chip').forEach(x=>x.classList.toggle('active',x===btn));if(label)label.textContent=btn.dataset.view||btn.textContent.trim();if(view&&btn.dataset.src){view.style.opacity='.16';const preload=new Image();const done=()=>{view.src=btn.dataset.src;view.alt=btn.dataset.alt||`ShyneTyme.Works ${simulatorType} ${btn.dataset.view||''} view`;view.style.opacity='1'};preload.onload=done;preload.onerror=done;preload.src=btn.dataset.src}if(bikeView&&btn.dataset.viewbox)bikeView.setAttribute('viewBox',btn.dataset.viewbox)}));
qa('.dock-tab').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();const id=btn.dataset.tab;if(activeTab===id&&drawer.classList.contains('open'))closeDrawer();else openDrawer(id,btn)}));
drawerEdge?.addEventListener('click',e=>{e.stopPropagation();if(drawer.classList.contains('open')){closeDrawer();return}const btn=qa('.dock-tab').find(x=>x.dataset.tab===lastTab)||q('.dock-tab');if(btn)openDrawer(btn.dataset.tab,btn)});
viewport.addEventListener('pointerdown',e=>{if(!e.target.closest('.view-chip,.fullscreen-trigger'))closeOverlays()});

document.addEventListener('pointerdown',e=>{if(sidebarState!=='closed'&&!rail.contains(e.target)&&!e.target.closest('.sidebar-toggle'))setSidebar('closed')},{capture:true});
qa('input[type=range]').forEach(r=>r.addEventListener('input',()=>{const s=r.parentElement.querySelector('span');if(s)s.textContent=r.value+'%'}));
qa('.swatch').forEach(btn=>btn.addEventListener('click',()=>{qa('.swatch').forEach(x=>x.classList.toggle('active',x===btn));try{localStorage.setItem('shynetymeActiveSavedColor',btn.dataset.color||'')}catch(_){}}));
const picker=q('#savedColorPicker'),addColor=q('#addSavedColor'),saved=q('#savedColors');
addColor?.addEventListener('click',()=>picker?.click());picker?.addEventListener('input',()=>{const color=picker.value;let sw=qa('.swatch',saved).find(x=>x.dataset.dynamic==='true');if(!sw){sw=document.createElement('button');sw.type='button';sw.className='swatch';sw.dataset.dynamic='true';sw.setAttribute('aria-label','Saved custom color');saved.insertBefore(sw,addColor)}sw.dataset.color=color;sw.style.setProperty('--sw',color);qa('.swatch',saved).forEach(x=>x.classList.toggle('active',x===sw));sw.onclick=()=>qa('.swatch',saved).forEach(x=>x.classList.toggle('active',x===sw));try{localStorage.setItem('shynetymeSavedCustomColor',color)}catch(_){}});try{const c=localStorage.getItem('shynetymeSavedCustomColor');if(c){picker.value=c;picker.dispatchEvent(new Event('input'))}}catch(_){}
qa('.mini-mode').forEach(btn=>btn.addEventListener('click',()=>{qa('.mini-mode').forEach(x=>x.classList.toggle('active',x===btn))}));
const audio=q('#musicAudio'),trackPicker=q('#trackPicker'),addTracks=q('#addTracks'),playlist=q('#playlist'),playTrack=q('#playTrack'),prevTrack=q('#prevTrack'),nextTrack=q('#nextTrack'),trackSeek=q('#trackSeek'),currentTrack=q('#currentTrack'),trackTime=q('#trackTime');
const demoTracks=[
  {name:'Feels Good To Be',artist:'Jason Shaw · Hip-Hop',url:'https://audionautix.com/Music/FeelsGood2B.mp3',remote:true},
  {name:'Hip Hop 1',artist:'Jason Shaw · Hip-Hop',url:'https://audionautix.com/Music/HipHop1.mp3',remote:true}
];
let tracks=demoTracks.map(t=>({...t})),trackIndex=0,localUrls=[];
const MAX_LOCAL_AUDIO_BYTES=150*1024*1024;
const fmtTime=v=>{if(!Number.isFinite(v))return'0:00';const m=Math.floor(v/60),sec=Math.floor(v%60);return`${m}:${String(sec).padStart(2,'0')}`};
function renderPlaylist(){playlist.innerHTML='';tracks.slice(0,3).forEach((t,i)=>{const row=document.createElement('button');row.type='button';row.className='playlist-row'+(i===trackIndex?' active':'');row.innerHTML=`<span>${String(i+1).padStart(2,'0')}</span><span class="track-copy"><strong>${t.name}</strong><small>${t.artist||'LOCAL AUDIO'}</small></span>`;row.addEventListener('click',e=>{e.stopPropagation();loadTrack(i,true)});playlist.appendChild(row)})}
function loadTrack(i,autoplay=false){if(!tracks.length)return;trackIndex=(i+tracks.length)%tracks.length;const t=tracks[trackIndex];audio.src=t.url;currentTrack.textContent=`${t.name} · ${t.artist||'LOCAL AUDIO'}`;trackSeek.value='0';trackTime.textContent='0:00';renderPlaylist();if(autoplay)audio.play().catch(()=>{currentTrack.textContent=`${t.name} · TAP PLAY TO RETRY`})}
addTracks?.addEventListener('click',e=>{e.stopPropagation();trackPicker?.click()});
trackPicker?.addEventListener('change',()=>{
  const audioExt=/\.(mp3|m4a|aac|wav|ogg|oga|flac|opus|webm)$/i;
  const files=[...trackPicker.files].filter(file=>file.type?.startsWith('audio/')||audioExt.test(file.name));
  const totalBytes=files.reduce((sum,file)=>sum+file.size,0);
  if(totalBytes>MAX_LOCAL_AUDIO_BYTES){
    currentTrack.textContent=`LOCAL AUDIO LIMIT · ${(totalBytes/1024/1024).toFixed(1)} MB SELECTED · 150 MB MAX`;
    trackPicker.value='';
    return;
  }
  if(!files.length){
    currentTrack.textContent='NO SUPPORTED AUDIO FILES SELECTED';
    return;
  }
  localUrls.forEach(url=>URL.revokeObjectURL(url));
  localUrls=[];
  tracks=files.map(file=>{
    const url=URL.createObjectURL(file);
    localUrls.push(url);
    return{name:file.webkitRelativePath||file.name,artist:'LOCAL FILE · NOT UPLOADED',url};
  });
  trackIndex=0;
  loadTrack(0,false);
  currentTrack.textContent=`${tracks.length} LOCAL FILE${tracks.length===1?'':'S'} · ${(totalBytes/1024/1024).toFixed(1)} MB · NOT UPLOADED`;
  trackPicker.value='';
});
playTrack?.addEventListener('click',e=>{e.stopPropagation();if(!tracks.length)return;if(!audio.src)loadTrack(trackIndex,false);if(audio.paused)audio.play().catch(()=>{});else audio.pause()});
prevTrack?.addEventListener('click',e=>{e.stopPropagation();if(tracks.length)loadTrack(trackIndex-1,true)});nextTrack?.addEventListener('click',e=>{e.stopPropagation();if(tracks.length)loadTrack(trackIndex+1,true)});
const setPlayGlyph=playing=>{if(playTrack)playTrack.innerHTML=`<span class="play-glyph">${playing?'❚❚':'▶'}</span>`};audio?.addEventListener('play',()=>setPlayGlyph(true));audio?.addEventListener('pause',()=>setPlayGlyph(false));audio?.addEventListener('ended',()=>{if(tracks.length)loadTrack(trackIndex+1,true)});audio?.addEventListener('timeupdate',()=>{if(audio.duration){trackSeek.value=String((audio.currentTime/audio.duration)*100);trackTime.textContent=fmtTime(audio.currentTime)}});audio?.addEventListener('error',()=>{const t=tracks[trackIndex];if(t)currentTrack.textContent=`${t.name} · STREAM UNAVAILABLE`});trackSeek?.addEventListener('input',()=>{if(audio.duration)audio.currentTime=(Number(trackSeek.value)/100)*audio.duration});renderPlaylist();loadTrack(0,false);
const eqBars=qa('#eq i'),sensitivityRange=q('[data-page="music"] .music-top .slider input'),micSource=q('#micSource');
let spectrumCtx=null,spectrumAnalyser=null,spectrumStream=null,spectrumRAF=0,spectrumData=null,micStarting=false;
function flattenSpectrum(){eqBars.forEach(bar=>bar.style.height='4%')}
function drawSpectrum(){if(!spectrumAnalyser||!spectrumData){flattenSpectrum();return}spectrumAnalyser.getByteFrequencyData(spectrumData);const gain=Math.max(.15,(Number(sensitivityRange?.value||75)/75));const bins=spectrumData.length;eqBars.forEach((bar,i)=>{const start=Math.floor(i*bins/eqBars.length),end=Math.max(start+1,Math.floor((i+1)*bins/eqBars.length));let sum=0;for(let n=start;n<end;n++)sum+=spectrumData[n];const avg=sum/(end-start);const pct=Math.max(4,Math.min(100,(avg/255)*112*gain));bar.style.height=pct.toFixed(1)+'%'});spectrumRAF=requestAnimationFrame(drawSpectrum)}
async function startMicSpectrum(){if(spectrumStream||micStarting)return;if(!navigator.mediaDevices?.getUserMedia){flattenSpectrum();return}micStarting=true;try{spectrumStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});spectrumCtx=new (window.AudioContext||window.webkitAudioContext)();if(spectrumCtx.state==='suspended')await spectrumCtx.resume();spectrumAnalyser=spectrumCtx.createAnalyser();spectrumAnalyser.fftSize=128;spectrumAnalyser.smoothingTimeConstant=.72;const src=spectrumCtx.createMediaStreamSource(spectrumStream);src.connect(spectrumAnalyser);spectrumData=new Uint8Array(spectrumAnalyser.frequencyBinCount);cancelAnimationFrame(spectrumRAF);drawSpectrum()}catch(_){stopMicSpectrum();flattenSpectrum()}finally{micStarting=false}}
function stopMicSpectrum(){cancelAnimationFrame(spectrumRAF);spectrumRAF=0;if(spectrumStream){spectrumStream.getTracks().forEach(t=>t.stop());spectrumStream=null}if(spectrumCtx){spectrumCtx.close().catch(()=>{});spectrumCtx=null}spectrumAnalyser=null;spectrumData=null;flattenSpectrum()}
micSource?.addEventListener('change',()=>{if(micSource.value==='off'){stopMicSpectrum();return}startMicSpectrum()});

qa('.preset,.custom-item').forEach(btn=>btn.addEventListener('click',()=>{if(btn.dataset.preset==='streaming-rainbow'&&effectSelect)effectSelect.value='streaming-rainbow';btn.animate([{transform:'scale(1)'},{transform:'scale(.94)',filter:'brightness(1.6)'},{transform:'scale(1)'}],{duration:220})}));
const fade=on=>drawer.classList.toggle('adjusting',on);drawer.addEventListener('pointerdown',e=>{if(e.target.closest('input,select,button'))fade(true)});drawer.addEventListener('pointerup',()=>setTimeout(()=>fade(false),90));drawer.addEventListener('pointercancel',()=>fade(false));
document.addEventListener('pointerdown',e=>{const mobile=matchMedia('(max-width:820px)').matches;if(!mobile)return;const h=window.visualViewport?.height||innerHeight;if(e.clientX<25)gesture={kind:'rail-open',x:e.clientX,y:e.clientY};else if(sidebarState!=='closed'&&e.clientX<Math.max(205,parseInt(getComputedStyle(root).getPropertyValue('--rail-w'))||236))gesture={kind:'rail-close',x:e.clientX,y:e.clientY};else if(e.clientY>h-30)gesture={kind:'dock-open',x:e.clientX,y:e.clientY};else if(drawer.classList.contains('open'))gesture={kind:'dock-close',x:e.clientX,y:e.clientY}},{passive:true});
document.addEventListener('pointerup',e=>{if(!gesture)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y,k=gesture.kind;gesture=null;if(k==='rail-open'&&dx>38&&Math.abs(dx)>Math.abs(dy))setSidebar('peek');if(k==='rail-close'&&dx<-38&&Math.abs(dx)>Math.abs(dy))setSidebar('closed');if(k==='dock-open'&&dy<-32&&Math.abs(dy)>Math.abs(dx)){const b=q('.dock-tab');openDrawer(b.dataset.tab,b)}if(k==='dock-close'&&dy>34&&Math.abs(dy)>Math.abs(dx))closeDrawer()},{passive:true});
async function requestFullscreen(){try{if(!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen({navigationUI:'hide'});if(screen.orientation?.lock)await screen.orientation.lock('landscape')}catch(_){}}
function maybeFullscreen(){if(matchMedia('(max-width:820px) and (orientation:landscape)').matches)setTimeout(requestFullscreen,80)}
q('#fullscreenTrigger')?.addEventListener('click',async e=>{e.stopPropagation();q('#fullscreenCallout')?.classList.add('used');try{if(document.fullscreenElement)await document.exitFullscreen();else await requestFullscreen()}catch(_){}});
['resize','orientationchange','fullscreenchange'].forEach(ev=>addEventListener(ev,()=>{viewportVars();if(ev==='orientationchange')maybeFullscreen()},{passive:true}));window.visualViewport?.addEventListener('resize',viewportVars,{passive:true});
document.addEventListener('pointerdown',()=>{if(matchMedia('(max-width:820px) and (orientation:landscape)').matches&&!document.fullscreenElement)requestFullscreen()},{once:true,passive:true});
viewportVars();setSidebar('closed');qa('#devicePane .device-tile').forEach(syncBikeZone);const initialDevice=q('#devicePane .device-tile.active');if(initialDevice)selectDevice(initialDevice);maybeFullscreen();
window.addEventListener('pagehide',()=>localUrls.forEach(url=>URL.revokeObjectURL(url)),{once:true});
})();
