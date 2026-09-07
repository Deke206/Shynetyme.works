"use strict";
(() => {
  const q=(s)=>document.querySelector(s), qa=(s)=>[...document.querySelectorAll(s)];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const ROLE_KEYS={main:"MAIN",bg:"BG",fg:"FG"};
  const ROLE_BRI_KEYS={main:"MAINB",bg:"BGB",fg:"FGB"};
  const PRESET_KEY="stw-esp32-presets-v5-live";
  const OLD_PRESET_KEY="stw-esp32-presets-v4";
  const roleBri={main:255,bg:96,fg:255};
  let role="main", wheel=null,wctx=null,marker=null,roleBriInput=null,roleBriOut=null;
  let wheelPointer=false,colorTimer=0,reconnectTimer=0,reconnectAttempts=0,reconnectBusy=false;
  let micOn=false,micStream=null,audioCtx=null,analyser=null,audioRaf=0,audioBusy=false,lastAudioSend=0,bassBase=12,lastBeat=0;
  const AUDIO_BANDS=[[43,86],[86,129],[129,216],[216,301],[301,430],[430,560],[560,818],[818,1120],[1120,1421],[1421,1895],[1895,2412],[2412,3015],[3015,3704],[3704,4479],[4479,7106],[7106,9259]];

  function log(msg){const x=q("#debugLog");if(!x)return;const ts=new Date().toLocaleTimeString();x.textContent=`${ts}  ${msg}\n${x.textContent}`.slice(0,5000)}
  function snap(){return window.STWBLE?.snapshot?.()||{devices:[],target:null,passkey:false}}
  function selectedDevice(){const s=snap();return s.target?.type==="device"?s.devices.find(d=>d.id===s.target.id)||null:null}
  function targetPrimary(){const s=snap();if(s.target?.type==="device")return s.devices.find(d=>d.id===s.target.id)||null;if(s.target?.type==="group"){const g=s.groups?.find(x=>x.id===s.target.id);return s.devices.find(d=>g?.members?.includes(d.id))||null}return null}
  function currentFx(){return targetPrimary()?.lastStatus?.FX||targetPrimary()?.lastFx||q("#stateFx")?.textContent?.trim().replaceAll(" ","_")||"RAINBOW"}
  function currentPalette(){return{main:q("#main")?.value?.toUpperCase()||"#000000",bg:q("#bg")?.value?.toUpperCase()||"#000000",fg:q("#fg")?.value?.toUpperCase()||"#000000"}}
  function safeJSON(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch(_){return f}}
  function saveJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}}

  // Prevent the older page listener from forcing global output back to 255 on every BLE connection.
  if(window.STWBLE?.sendToDevice){
    const rawSendToDevice=window.STWBLE.sendToDevice.bind(window.STWBLE);
    window.STWBLE.sendToDevice=async(id,text,opts={})=>{
      if(String(text).trim()==="BRI=255"&&opts?.fast){log("Skipped legacy BRI=255 reconnect override.");return true}
      return rawSendToDevice(id,text,opts)
    };
  }

  function cloneRange(id,label,key){
    const old=q("#"+id);if(!old)return null;
    const x=old.cloneNode(true);old.replaceWith(x);
    const row=x.closest(".slider-row");if(row?.querySelector("label"))row.querySelector("label").textContent=label;
    const send=()=>window.STWBLE.send(`${key}=${x.value}`,{fast:true});
    let timer=0;
    x.addEventListener("input",()=>{updateSlider(x);clearTimeout(timer);timer=setTimeout(send,55)});
    x.addEventListener("change",()=>{clearTimeout(timer);send()});
    return x;
  }
  function updateSlider(x){
    const min=+x.min||0,max=+x.max||255,p=clamp(((+x.value-min)/(max-min))*100,0,100),rail=x.closest(".sim-slider");
    if(rail){const fill=rail.querySelector(".fill"),thumb=rail.querySelector(".thumb");if(fill)fill.style.width=p+"%";if(thumb)thumb.style.left=p+"%"}
    const out=q("#"+x.id+"V");if(out)out.textContent=Math.round(p)+"%";
  }
  function restoreGlobalControls(){
    const bri=cloneRange("bri","GLOBAL BRIGHTNESS","BRI");
    const int=cloneRange("int","INTENSITY","INT");
    const st=targetPrimary()?.lastStatus||{};
    if(bri&&st.BRI!=null)bri.value=st.BRI;
    else if(bri)bri.value=96;
    if(int&&st.INT!=null)int.value=st.INT;
    else if(int)int.value=180;
    if(bri)updateSlider(bri);if(int)updateSlider(int);
  }

  function injectStyles(){
    const s=document.createElement("style");s.textContent=`
      .stw-wheel-wrap{display:grid;grid-template-columns:minmax(180px,260px) minmax(150px,1fr);gap:14px;align-items:center;margin-top:10px}
      .stw-wheel-box{position:relative;width:min(68vw,250px);aspect-ratio:1;margin:auto;touch-action:none}
      .stw-wheel{width:100%;height:100%;display:block;border-radius:50%;box-shadow:0 0 22px rgba(0,191,255,.18),inset 0 0 0 1px rgba(255,255,255,.1);touch-action:none}
      .stw-wheel-marker{position:absolute;width:16px;height:16px;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 2px #0009,0 0 10px #fff7;pointer-events:none;transform:translate(-50%,-50%)}
      .stw-role-bright{display:grid;gap:8px;align-content:center}.stw-role-bright b{font:800 8pt Oxanium;color:var(--blue)}
      .stw-role-bright .sim-slider{min-width:130px}.stw-role-value{color:var(--yellow);font:800 8pt Oxanium;text-align:right}
      .stw-audio-tools{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}.stw-audio-meters{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin-top:8px}
      .stw-audio-meter{padding:7px;border:1px solid rgba(132,211,255,.16);border-radius:7px;background:rgba(4,16,35,.28);text-align:center}.stw-audio-meter small{display:block;color:#70869d;font:700 6pt Oxanium}.stw-audio-meter b{display:block;color:var(--blue);font:800 10pt Oxanium}
      @media(max-width:620px){.stw-wheel-wrap{grid-template-columns:1fr}.stw-audio-meters{grid-template-columns:repeat(3,1fr)}}`;
    document.head.append(s);
  }

  function hsvToHex(h,s,v=1){
    const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;let r=0,g=0,b=0;
    if(h<60){r=c;g=x}else if(h<120){r=x;g=c}else if(h<180){g=c;b=x}else if(h<240){g=x;b=c}else if(h<300){r=x;b=c}else{r=c;b=x}
    const z=n=>Math.round((n+m)*255).toString(16).padStart(2,"0").toUpperCase();return`#${z(r)}${z(g)}${z(b)}`
  }
  function hexToHsv(hex){
    const s=hex.replace("#","");const r=parseInt(s.slice(0,2),16)/255,g=parseInt(s.slice(2,4),16)/255,b=parseInt(s.slice(4,6),16)/255,max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;let h=0;
    if(d){if(max===r)h=60*(((g-b)/d)%6);else if(max===g)h=60*((b-r)/d+2);else h=60*((r-g)/d+4);if(h<0)h+=360}
    return{h,s:max?d/max:0,v:max}
  }
  function drawWheel(){
    if(!wheel||!wctx)return;const w=wheel.width,h=wheel.height,cx=w/2,cy=h/2,r=Math.min(cx,cy),img=wctx.createImageData(w,h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const dx=x-cx,dy=y-cy,d=Math.sqrt(dx*dx+dy*dy),i=(y*w+x)*4;if(d>r){img.data[i+3]=0;continue}let a=Math.atan2(dy,dx)*180/Math.PI;if(a<0)a+=360;const hex=hsvToHex(a,clamp(d/r,0,1),1),n=parseInt(hex.slice(1),16);img.data[i]=(n>>16)&255;img.data[i+1]=(n>>8)&255;img.data[i+2]=n&255;img.data[i+3]=255}
    wctx.putImageData(img,0,0);positionMarker()
  }
  function positionMarker(){
    if(!wheel||!marker)return;const hsv=hexToHsv(q("#"+role)?.value||"#FFFFFF"),r=wheel.width/2*hsv.s,a=hsv.h*Math.PI/180;marker.style.left=(50+Math.cos(a)*r/wheel.width*100)+"%";marker.style.top=(50+Math.sin(a)*r/wheel.height*100)+"%"
  }
  function setRole(next){
    role=next;qa(".role[data-role]").forEach(b=>b.classList.toggle("on",b.dataset.role===role));
    if(roleBriInput){roleBriInput.value=roleBri[role];updateRoleBriUI()}
    positionMarker()
  }
  function updateRoleBriUI(){if(!roleBriInput)return;const v=+roleBriInput.value;if(roleBriOut)roleBriOut.textContent=v;const lab=q("#stwRoleBriLabel");if(lab)lab.textContent=`${role.toUpperCase()} BRIGHTNESS`}
  function sendRoleColor(hex){clearTimeout(colorTimer);colorTimer=setTimeout(()=>window.STWBLE.send(`${ROLE_KEYS[role]}=${hex.slice(1)}`,{fast:true}),45)}
  function wheelPick(ev,final=false){
    const rect=wheel.getBoundingClientRect(),x=(ev.clientX-rect.left)/rect.width*wheel.width,y=(ev.clientY-rect.top)/rect.height*wheel.height,cx=wheel.width/2,cy=wheel.height/2,dx=x-cx,dy=y-cy,r=wheel.width/2,d=Math.min(r,Math.sqrt(dx*dx+dy*dy));let h=Math.atan2(dy,dx)*180/Math.PI;if(h<0)h+=360;const hex=hsvToHex(h,d/r,1),input=q("#"+role);if(input)input.value=hex;
    const sw=q("#"+role+"Swatch");if(sw)sw.style.background=hex;positionMarker();sendRoleColor(hex);if(final)window.STWBLE.send(`${ROLE_KEYS[role]}=${hex.slice(1)}`,{fast:true})
  }
  function installColorWheel(){
    const frame=q(".colors-frame"),bar=frame?.querySelector(".rolebar");if(!frame||!bar)return;
    q("#hueSelector")?.setAttribute("hidden","");q(".hue-readout")?.setAttribute("hidden","");
    qa(".role[data-role]").forEach(b=>b.addEventListener("click",()=>setRole(b.dataset.role)));
    const wrap=document.createElement("div");wrap.className="stw-wheel-wrap";wrap.innerHTML=`<div class="stw-wheel-box"><canvas id="stwWheel" class="stw-wheel" width="250" height="250"></canvas><span id="stwWheelMarker" class="stw-wheel-marker"></span></div><div class="stw-role-bright"><b id="stwRoleBriLabel">MAIN BRIGHTNESS</b><div class="sim-slider"><span class="fill"></span><span class="thumb"></span><input id="stwRoleBri" type="range" min="0" max="255" value="255"></div><span id="stwRoleBriV" class="stw-role-value">255</span><span class="microcopy">Select MAIN / BACKGROUND / FOREGROUND, then choose color and brightness independently.</span></div>`;
    bar.after(wrap);wheel=q("#stwWheel");wctx=wheel.getContext("2d");marker=q("#stwWheelMarker");roleBriInput=q("#stwRoleBri");roleBriOut=q("#stwRoleBriV");
    wheel.addEventListener("pointerdown",e=>{wheelPointer=true;wheel.setPointerCapture?.(e.pointerId);wheelPick(e)});wheel.addEventListener("pointermove",e=>{if(wheelPointer)wheelPick(e)});for(const ev of ["pointerup","pointercancel"]){wheel.addEventListener(ev,e=>{if(wheelPointer){wheelPointer=false;wheelPick(e,true)}})}
    let t=0;roleBriInput.addEventListener("input",()=>{roleBri[role]=+roleBriInput.value;updateRoleBriUI();clearTimeout(t);t=setTimeout(()=>window.STWBLE.send(`${ROLE_BRI_KEYS[role]}=${roleBri[role]}`,{fast:true}),45)});roleBriInput.addEventListener("change",()=>window.STWBLE.send(`${ROLE_BRI_KEYS[role]}=${roleBri[role]}`,{fast:true}));
    drawWheel();setRole("main")
  }

  function syncStatus(st){
    if(!st)return;
    if(st.MAINB!=null)roleBri.main=+st.MAINB;if(st.BGB!=null)roleBri.bg=+st.BGB;if(st.FGB!=null)roleBri.fg=+st.FGB;
    if(st.BRI!=null&&q("#bri")){q("#bri").value=st.BRI;updateSlider(q("#bri"))}
    if(st.INT!=null&&q("#int")){q("#int").value=st.INT;updateSlider(q("#int"))}
    if(roleBriInput){roleBriInput.value=roleBri[role];updateRoleBriUI()}
    positionMarker()
  }

  function captureState(name){const p=currentPalette();return{name,fx:currentFx(),...p,globalBri:+q("#bri").value,intensity:+q("#int").value,mainBri:roleBri.main,bgBri:roleBri.bg,fgBri:roleBri.fg,spd:+q("#spd").value,size:+q("#size").value,dens:+q("#dens").value,trail:+q("#trail").value,dir:q("#dir").value,mirror:q("#mirror").checked}}
  function presets(){let p=safeJSON(PRESET_KEY,null);if(Array.isArray(p))return p;const old=safeJSON(OLD_PRESET_KEY,[]);p=Array.isArray(old)?old.map(x=>({name:x.name||x.fx||"Saved Look",fx:x.fx||"RAINBOW",main:x.main||"#FFFFFF",bg:x.bg||"#000000",fg:x.fg||"#FFFFFF",globalBri:96,intensity:180,mainBri:x.bri??255,bgBri:x.int??96,fgBri:255,spd:x.spd??180,size:x.size??96,dens:x.dens??128,trail:x.trail??170,dir:x.dir||"FWD",mirror:!!x.mirror})):[];saveJSON(PRESET_KEY,p);return p}
  function savePresets(p){saveJSON(PRESET_KEY,p.slice(0,60))}
  async function applyPreset(p){
    const fxBtn=qa(".fx-item").find(b=>b.dataset.fx===p.fx);if(fxBtn)fxBtn.click();
    for(const k of ["main","bg","fg"]){if(p[k]&&q("#"+k)){q("#"+k).value=p[k];const sw=q("#"+k+"Swatch");if(sw)sw.style.background=p[k]}}
    roleBri.main=p.mainBri??255;roleBri.bg=p.bgBri??96;roleBri.fg=p.fgBri??255;
    const vals={bri:p.globalBri??96,int:p.intensity??180,spd:p.spd??180,size:p.size??96,dens:p.dens??128,trail:p.trail??170};for(const[k,v]of Object.entries(vals)){if(q("#"+k)){q("#"+k).value=v;updateSlider(q("#"+k))}}
    q("#dir").value=p.dir||"FWD";q("#mirror").checked=!!p.mirror;if(roleBriInput){roleBriInput.value=roleBri[role];updateRoleBriUI()}positionMarker();
    const pal=currentPalette();const cmd=`FX=${p.fx};MAIN=${pal.main.slice(1)};BG=${pal.bg.slice(1)};FG=${pal.fg.slice(1)};MAINB=${roleBri.main};BGB=${roleBri.bg};FGB=${roleBri.fg};BRI=${vals.bri};INT=${vals.int};SPD=${vals.spd};SIZE=${vals.size};DENS=${vals.dens};TRAIL=${vals.trail};DIR=${q("#dir").value};MIRROR=${q("#mirror").checked?1:0}`;
    await window.STWBLE.send(cmd);window.STWBLE.setLastFx(p.fx);log(`Loaded preset: ${p.name}`)
  }
  function renderPresets(){
    const host=q("#presetGrid");if(!host)return;const list=presets();const count=q("#presetCount");if(count)count.textContent=list.length?`${list.length} SAVED`:"";host.innerHTML="";
    if(!list.length){host.innerHTML='<div class="microcopy" style="text-align:center">No presets saved yet.</div>';return}
    list.forEach((p,i)=>{const card=document.createElement("article");card.className="preset-card";card.innerHTML='<div class="preset-title"></div><div class="preset-meta"></div><div class="preset-colors"><i></i><i></i><i></i></div><div class="button-row"><button class="tiny-btn load">LOAD</button><button class="tiny-btn danger del">DELETE</button></div>';card.querySelector(".preset-title").textContent=p.name;card.querySelector(".preset-meta").textContent=(p.fx||"").replaceAll("_"," ");[p.main,p.bg,p.fg].forEach((c,n)=>{card.querySelectorAll(".preset-colors i")[n].style.background=c||"#000"});card.querySelector(".load").onclick=()=>applyPreset(p);card.querySelector(".del").onclick=()=>{const x=presets();x.splice(i,1);savePresets(x);renderPresets()};host.append(card)})
  }
  function installPresets(){
    for(const id of ["saveFxPreset","saveCurrentPreset"]){const old=q("#"+id);if(!old)continue;const b=old.cloneNode(true);old.replaceWith(b);b.addEventListener("click",()=>{const def=(currentFx()||"Saved Look").replaceAll("_"," "),name=prompt("Name this preset",def);if(name===null)return;const list=presets();list.unshift(captureState(name.trim()||def));savePresets(list);renderPresets();log(`Saved preset: ${name.trim()||def}`)})}
    renderPresets()
  }

  function bandValue(fd,lo,hi){const hz=audioCtx.sampleRate/analyser.fftSize,a=clamp(Math.floor(lo/hz),0,fd.length-1),b=clamp(Math.ceil(Math.min(hi,audioCtx.sampleRate/2)/hz),a+1,fd.length);let sum=0;for(let i=a;i<b;i++)sum+=fd[i];return b>a?sum/(b-a):0}
  function hex2(v){return clamp(Math.round(v),0,255).toString(16).padStart(2,"0").toUpperCase()}
  function meter(id,v){const x=q("#"+id);if(x)x.textContent=Math.round(v)}
  function installAudio(){
    const old=q("#micToggle");if(!old)return;const b=old.cloneNode(true);old.replaceWith(b);
    const panel=q(".music-control");const tools=document.createElement("div");tools.innerHTML=`<div class="stw-audio-tools"><button id="stwAudioTest" class="glass-btn">AUDIO LINK TEST</button><button id="stwAudioStop" class="glass-btn">STOP AUDIO TX</button></div><div class="stw-audio-meters"><div class="stw-audio-meter"><small>LEVEL</small><b id="stwAL">0</b></div><div class="stw-audio-meter"><small>BASS</small><b id="stwAB">0</b></div><div class="stw-audio-meter"><small>MID</small><b id="stwAM">0</b></div><div class="stw-audio-meter"><small>HIGH</small><b id="stwAH">0</b></div><div class="stw-audio-meter"><small>TX</small><b id="stwATX">0</b></div></div><div class="microcopy" style="margin-top:7px">Audio stays layered over the effect selected in FX / COLORS. Frames are coalesced so old microphone data cannot backlog the BLE link.</div>`;panel?.append(tools);
    b.addEventListener("click",()=>micOn?stopMic(true):startMic());q("#stwAudioStop").onclick=()=>stopMic(true);q("#stwAudioTest").onclick=audioLinkTest
  }
  async function startMic(){
    try{if(!navigator.mediaDevices?.getUserMedia)throw Error("Microphone API unavailable");micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});const AC=window.AudioContext||window.webkitAudioContext;audioCtx=new AC({latencyHint:"interactive"});if(audioCtx.state==="suspended")await audioCtx.resume();analyser=audioCtx.createAnalyser();analyser.fftSize=1024;analyser.minDecibels=-90;analyser.maxDecibels=-10;analyser.smoothingTimeConstant=.28;audioCtx.createMediaStreamSource(micStream).connect(analyser);micOn=true;q("#micToggle").textContent="STOP MICROPHONE";q("#micState").textContent="LIVE";q("#micState").classList.add("live");await window.STWBLE.send("AUDIO=1;AUDMODE=FULL;AUDAMT=255");lastAudioSend=0;audioLoop();log("Microphone audio stream started.")}catch(e){log(`Microphone: ${e.message}`);stopMic(false)}
  }
  function stopMic(send=true){micOn=false;if(audioRaf)cancelAnimationFrame(audioRaf);audioRaf=0;micStream?.getTracks().forEach(t=>t.stop());micStream=null;audioCtx?.close().catch(()=>{});audioCtx=null;analyser=null;audioBusy=false;q("#micToggle").textContent="START MICROPHONE";q("#micState").textContent="OFF";q("#micState").classList.remove("live");if(send)window.STWBLE.send("AUDIO=0")}
  function audioProtocol(){const v=parseFloat(targetPrimary()?.lastStatus?.VER||"5.2");return Number.isFinite(v)&&v<5?"A":"F"}
  async function sendAudio(vals,beat){
    if(audioBusy)return;audioBusy=true;try{const bass=(vals[0]+vals[1]+vals[2]+vals[3])/4,mid=(vals[4]+vals[5]+vals[6]+vals[7]+vals[8]+vals[9])/6,high=(vals[10]+vals[11]+vals[12]+vals[13]+vals[14]+vals[15])/6,level=vals.reduce((a,b)=>a+b,0)/vals.length;let packet;if(audioProtocol()==="F")packet="F="+vals.map(hex2).join("")+(beat?"1":"0");else packet="A="+hex2(level)+hex2(bass)+hex2(mid)+hex2(high)+(beat?"1":"0");await window.STWBLE.send(packet,{fast:true});meter("stwAL",level);meter("stwAB",bass);meter("stwAM",mid);meter("stwAH",high);const tx=q("#stwATX");if(tx)tx.textContent=(+(tx.textContent||0)+1)%10000}catch(e){log(`Audio TX: ${e.message}`)}finally{audioBusy=false}}
  function audioLoop(t=performance.now()){
    if(!micOn||!analyser||!audioCtx)return;const fd=new Uint8Array(analyser.frequencyBinCount);analyser.getByteFrequencyData(fd);const sens=+(q("#micSensitivity")?.value||135)/100,vals=AUDIO_BANDS.map(([lo,hi])=>clamp(bandValue(fd,lo,hi)*sens,0,255));qa(".spectrum-bar").forEach((b,i)=>b.style.height=Math.max(4,vals[i]/255*100).toFixed(1)+"%");const bass=(vals[0]+vals[1]+vals[2]+vals[3])/4;bassBase=bassBase*.94+bass*.06;const beat=bass>Math.max(24,bassBase*1.35)&&t-lastBeat>165;if(beat)lastBeat=t;if(t-lastAudioSend>=80){lastAudioSend=t;sendAudio(vals,beat)}audioRaf=requestAnimationFrame(audioLoop)
  }
  async function audioLinkTest(){
    if(!snap().passkey){log("Audio test needs a connected target.");return}const btn=q("#stwAudioTest");btn.disabled=true;const old=btn.textContent;btn.textContent="TESTING…";try{await window.STWBLE.send("AUDIO=1;AUDMODE=FULL;AUDAMT=255");for(let n=0;n<8;n++){const vals=Array.from({length:16},(_,i)=>clamp((i<4?220:i<10?130:75)+(n%2?25:-15),0,255));await sendAudio(vals,n%2===0);await new Promise(r=>setTimeout(r,120))}log("Synthetic audio test sent.")}finally{btn.textContent=old;btn.disabled=false}}

  async function reconnectNow(id,manual=true){
    if(reconnectBusy)return false;reconnectBusy=true;try{const s=snap(),d=s.devices.find(x=>x.id===id);if(!d?.bluetoothId){if(manual){log("No saved Bluetooth assignment — opening picker.");return await window.STWBLE.assignNew(id)}return false}if(d.bleStatus==="connected")window.STWBLE.disconnectDevice(id);await new Promise(r=>setTimeout(r,220));await window.STWBLE.refreshGranted();const ok=await window.STWBLE.connectAssigned(id);if(ok){reconnectAttempts=0;log(`Reconnected ${d.name}.`);setTimeout(()=>window.STWBLE.readStatus(id),160);return true}log("Saved-device reconnect did not complete. Tap RECONNECT again to reselect if needed.");return false}catch(e){log(`Reconnect: ${e.message}`);return false}finally{reconnectBusy=false}}
  function installReconnect(){
    const old=q("#reconnectSelected");if(old){const b=old.cloneNode(true);old.replaceWith(b);let reselectNext=false;b.addEventListener("click",async()=>{const d=selectedDevice();if(!d)return;if(reselectNext){reselectNext=false;b.textContent="RECONNECT";try{await window.STWBLE.assignNew(d.id);setTimeout(()=>window.STWBLE.readStatus(d.id),160)}catch(e){log(e.name==="NotFoundError"?"Bluetooth selection cancelled.":e.message)}return}b.disabled=true;b.textContent="RECONNECTING…";const ok=await reconnectNow(d.id,true);b.disabled=false;if(ok)b.textContent="RECONNECT";else{reselectNext=true;b.textContent="RESELECT BLUETOOTH"}})}
    document.addEventListener("visibilitychange",()=>{if(document.visibilityState!=="visible")return;const d=selectedDevice();if(d?.bluetoothId&&d.bleStatus!=="connected")setTimeout(()=>reconnectNow(d.id,false),250)})
  }
  function scheduleReconnect(deviceId){clearTimeout(reconnectTimer);if(document.visibilityState!=="visible"||reconnectAttempts>=3)return;reconnectTimer=setTimeout(async()=>{const d=snap().devices.find(x=>x.id===deviceId);if(!d?.bluetoothId||d.bleStatus==="connected")return;reconnectAttempts++;await reconnectNow(deviceId,false);if(snap().devices.find(x=>x.id===deviceId)?.bleStatus!=="connected")scheduleReconnect(deviceId)},650+reconnectAttempts*700)}

  function installStartupSave(){
    const old=q("#saveStartup");if(!old)return;const b=old.cloneNode(true);old.replaceWith(b);b.addEventListener("click",async()=>{const d=selectedDevice();if(!d)return;const fx=q("#startupFx")?.value||currentFx(),p=currentPalette(),cmd=`FX=${fx};MAIN=${p.main.slice(1)};BG=${p.bg.slice(1)};FG=${p.fg.slice(1)};MAINB=${roleBri.main};BGB=${roleBri.bg};FGB=${roleBri.fg};BRI=${q("#bri").value};INT=${q("#int").value};SPD=${q("#spd").value};SIZE=${q("#size").value};DENS=${q("#dens").value};TRAIL=${q("#trail").value};DIR=${q("#dir").value};MIRROR=${q("#mirror").checked?1:0}`;try{await window.STWBLE.saveStartup(d.id,cmd,"",fx);log(`Startup state saved to ESP32 flash for ${d.name}.`)}catch(e){log(e.message)}})
  }

  document.addEventListener("stw:ble",e=>{
    const type=e.detail?.type,id=e.detail?.deviceId;if(type==="connected"&&id){setTimeout(()=>window.STWBLE.readStatus(id),160);reconnectAttempts=0}
    if(type==="status"&&id){const d=snap().devices.find(x=>x.id===id);syncStatus(d?.lastStatus)}
    if(type==="disconnected"&&id)scheduleReconnect(id)
    if(type==="target")setTimeout(()=>syncStatus(targetPrimary()?.lastStatus||{}),0)
  });

  injectStyles();restoreGlobalControls();installColorWheel();installPresets();installAudio();installReconnect();installStartupSave();
  syncStatus(targetPrimary()?.lastStatus||{});
  log("Live controls loaded: RGB wheel, 3 role brightness, global brightness/intensity, coalesced audio, named presets, reconnect recovery.");
})();
