/* Shared simulator control object. No viewport sizing or site-navigation code lives here. */
(()=>{
  'use strict';

  const clean=value=>String(value??'').replace(/[<>]/g,'');
  const configNode=document.getElementById('simConfig');
  let config={};
  try{config=JSON.parse(configNode?.textContent||'{}')}catch(error){console.error('SIM config error',error)}

  class SimControls extends HTMLElement{
    connectedCallback(){
      this.config=config;
      this.lastTab='effects';
      this.bottomState='hidden';
      this.render();
      this.bind();
    }

    renderDevices(list){
      return list.map((device,index)=>`<button class="sim-device${index===0?' active':''}${device.on===false?' off':''}" type="button" data-device-index="${index}" data-device-name="${clean(device.name)}" data-zone="${clean(device.zone||'')}" data-on="${device.on===false?'false':'true'}" style="--device:${device.color||'#18e9ff'}">${clean(device.label||device.name)}</button>`).join('');
    }

    range(label,value){
      const id=`sim${label[0]}${label.slice(1).toLowerCase()}`;
      return `<div><label class="sim-label" for="${id}">${label}</label><div class="sim-range"><input id="${id}" type="range" min="0" max="100" value="${value}"><output>${value}%</output></div></div>`;
    }

    render(){
      const views=(this.config.views||[]).map((view,index)=>`<button class="sim-view-chip${index===0?' active':''}" type="button" data-view-index="${index}" style="--chip:${view.color||'#18e9ff'}">${clean(view.label)}</button>`).join('');
      const devices=this.renderDevices(this.config.devices||[]);
      const groups=this.renderDevices(this.config.groups||[]);
      const effects=(this.config.effects||['Solid','Chase','Breathe','Wave']).map(name=>`<option>${clean(name)}</option>`).join('');
      const presetColors=['#18e9ff','#36bfff','#ff2ca8','#ffd928','#8b51ff','#18e9ff','#ffd928','#ff2ca8'];
      const presets=(this.config.presets||['Solid','Chase','Rainbow','Wave']).map((name,index)=>`<button class="sim-preset${index===0?' active':''}" type="button" style="--preset:${presetColors[index%presetColors.length]}">${clean(name)}</button>`).join('');
      const initialTarget=this.config.initialTarget||this.config.devices?.[0]?.name||'TARGET';

      this.innerHTML=`
        <header class="sim-topbar" aria-label="Simulator view controls">
          <div class="sim-view-strip">${views}</div>
          <div class="sim-status"><span class="connected"><span class="status-copy">● CONNECTED</span></span><span class="status-copy">100%</span><button class="sim-fullscreen" type="button" aria-label="Fullscreen simulator" title="Fullscreen">⛶</button></div>
        </header>

        <aside class="sim-side-rail" data-state="closed" aria-label="Simulator target controls">
          <button class="sim-side-toggle" type="button" aria-label="Open target controls halfway" title="Open target controls halfway"><span class="sim-rail-state" aria-hidden="true"><span class="sim-rail-step">›</span><span class="sim-rail-step">›</span><span class="sim-rail-step">›</span></span></button>
          <div class="sim-rail-switch"><button class="active" type="button" data-rail="devices">${clean(this.config.railLabel||'DEVICES')}</button><button type="button" data-rail="groups">GROUPS</button></div>
          <div class="sim-device-stack" data-pane="devices">${devices}</div>
          <div class="sim-device-stack" data-pane="groups" hidden>${groups||'<button class="sim-device" type="button" disabled>NO GROUPS</button>'}</div>
        </aside>

        <section class="sim-bottom-sheet" data-state="hidden" aria-label="Simulator lower controls">
          <button class="sim-drawer-toggle" type="button" aria-label="Show control tabs" title="Show control tabs"><span aria-hidden="true">⌃</span></button>
          <nav class="sim-bottom-dock" aria-label="Simulator control tabs">
            <button class="sim-dock-tab" type="button" data-tab="effects" style="--tab:#18e9ff">LED EFFECTS</button>
            <button class="sim-dock-tab" type="button" data-tab="music" style="--tab:#36bfff">MUSIC SYNC</button>
            <button class="sim-dock-tab" type="button" data-tab="presets" style="--tab:#ffd928">PRESETS</button>
            <button class="sim-dock-tab" type="button" data-tab="custom" style="--tab:#ff2ca8">CUSTOM EFFECTS</button>
          </nav>
          <section class="sim-drawer" aria-hidden="true">
            <div class="sim-drawer-meta"><span>ACTIVE TARGET</span><strong>${clean(initialTarget).toUpperCase()}</strong></div>

            <div class="sim-panel active" data-panel="effects"><div class="sim-panel-center"><div class="sim-panel-grid">
              <section class="sim-chrome-box sim-control-box"><span class="sim-object-tab center">LED EFFECTS</span><div class="sim-effect-grid">
                <div><label class="sim-label" for="simEffect">EFFECT</label><select class="sim-select" id="simEffect">${effects}</select></div>
                ${this.range('SPEED',68)}${this.range('BRIGHTNESS',82)}${this.range('INTENSITY',76)}
                <div><label class="sim-label">DIRECTION</label><div class="sim-direction"><button type="button" aria-label="Reverse direction">←</button><button type="button" class="active" aria-label="Forward direction">→</button></div></div>
              </section>
              <section class="sim-chrome-box sim-control-box"><span class="sim-object-tab center">SAVED COLORS</span><div class="sim-swatches"><button class="sim-swatch active" type="button" style="--sw:#ff2ca8" aria-label="Hot pink"></button><button class="sim-swatch" type="button" style="--sw:#36bfff" aria-label="Light blue"></button><button class="sim-swatch" type="button" style="--sw:#ffd928" aria-label="Neon yellow"></button><button class="sim-swatch" type="button" style="--sw:#8b51ff" aria-label="Violet"></button></div></section>
            </div></div></div>

            <div class="sim-panel" data-panel="music"><div class="sim-panel-center"><div class="sim-music-three">
              <section class="sim-chrome-box sim-music-player"><span class="sim-object-tab">MUSIC PLAYER</span><div class="sim-track-now" data-track-name>NO TRACK LOADED</div><div class="sim-transport"><button type="button" data-audio-action="prev" aria-label="Previous track">◀</button><button class="sim-play" type="button" data-audio-action="play" aria-label="Play or pause">▶</button><button type="button" data-audio-action="next" aria-label="Next track">▶</button></div><input class="sim-track-seek" data-track-seek type="range" min="0" max="100" value="0" aria-label="Track position"><div class="sim-player-foot"><span data-track-time>0:00</span><button class="sim-track-add" type="button" data-audio-action="pick">＋ AUDIO</button></div><input type="file" accept="audio/*" multiple hidden data-audio-file><audio preload="metadata" data-audio></audio></section>
              <section class="sim-chrome-box sim-music-scene"><span class="sim-object-tab">MUSIC SCENE</span><div class="sim-music-top"><div><label class="sim-label">MIC SOURCE</label><select class="sim-select" data-mic-source><option value="off">Select source</option><option value="phone">Phone Mic</option><option value="device">Device Mic</option></select></div><div><label class="sim-label">SENSITIVITY</label><div class="sim-range"><input data-sensitivity type="range" min="0" max="100" value="75"><output>75%</output></div></div></div><div class="sim-eq" data-eq>${'<i></i>'.repeat(16)}</div><div class="sim-modes"><button class="sim-mode active" type="button">SPECTRUM</button><button class="sim-mode" type="button">PIANO</button><button class="sim-mode" type="button">STROBE</button></div></section>
              <aside class="sim-chrome-box sim-music-playlist"><span class="sim-object-tab">PLAYLIST</span><div class="sim-playlist" data-playlist><div class="sim-track-now">ADD LOCAL AUDIO</div></div></aside>
            </div></div></div>

            <div class="sim-panel" data-panel="presets"><div class="sim-panel-center"><section class="sim-chrome-box sim-control-box" style="width:min(780px,95%)"><span class="sim-object-tab center">PRESETS</span><div class="sim-presets">${presets}</div></section></div></div>
            <div class="sim-panel" data-panel="custom"><div class="sim-panel-center"><section class="sim-chrome-box sim-control-box" style="width:min(700px,94%)"><span class="sim-object-tab center">CUSTOM EFFECTS</span><div class="sim-custom-list"><button class="sim-custom-item active" type="button">LA NIGHTS</button><button class="sim-custom-item" type="button">BEAST MODE</button><button class="sim-custom-item" type="button">CYBER FLOW</button></div></section></div></div>
          </section>
        </section>`;
    }

    bind(){
      const rail=this.querySelector('.sim-side-rail');
      const sideToggle=this.querySelector('.sim-side-toggle');
      const sheet=this.querySelector('.sim-bottom-sheet');
      const drawer=this.querySelector('.sim-drawer');
      const drawerToggle=this.querySelector('.sim-drawer-toggle');
      const drawerTarget=this.querySelector('.sim-drawer-meta strong');
      const viewport=document.querySelector('.sim-viewport');

      const setRail=state=>{
        rail.dataset.state=state;
        const label=state==='closed'?'Open target controls halfway':state==='peek'?'Open target controls fully':'Close target controls';
        sideToggle.setAttribute('aria-label',label);sideToggle.title=label;
      };
      sideToggle.addEventListener('click',event=>{event.stopPropagation();const state=rail.dataset.state||'closed';setRail(state==='closed'?'peek':state==='peek'?'full':'closed')});

      const setBottomState=(state,tab=this.lastTab)=>{
        if(tab)this.lastTab=tab;
        this.bottomState=state;
        sheet.dataset.state=state;
        const open=state==='open';
        drawer.setAttribute('aria-hidden',String(!open));
        this.querySelectorAll('.sim-panel').forEach(panel=>panel.classList.toggle('active',panel.dataset.panel===this.lastTab));
        this.querySelectorAll('.sim-dock-tab').forEach(button=>button.classList.toggle('active',button.dataset.tab===this.lastTab));
        const label=state==='hidden'?'Show control tabs':state==='peek'?'Open selected controls':'Hide lower controls';
        drawerToggle.setAttribute('aria-label',label);drawerToggle.title=label;
      };
      setBottomState('hidden','effects');

      drawerToggle.addEventListener('click',event=>{
        event.stopPropagation();
        if(this.bottomState==='hidden')setBottomState('peek');
        else if(this.bottomState==='peek')setBottomState('open');
        else setBottomState('hidden');
      });
      this.querySelectorAll('.sim-dock-tab').forEach(button=>button.addEventListener('click',event=>{event.stopPropagation();setBottomState('open',button.dataset.tab)}));

      this.querySelectorAll('[data-rail]').forEach(button=>button.addEventListener('click',event=>{event.stopPropagation();this.querySelectorAll('[data-rail]').forEach(item=>item.classList.toggle('active',item===button));this.querySelectorAll('[data-pane]').forEach(pane=>pane.hidden=pane.dataset.pane!==button.dataset.rail)}));

      this.querySelectorAll('.sim-device').forEach(button=>button.addEventListener('click',event=>{
        event.stopPropagation();if(button.disabled)return;
        this.querySelectorAll('.sim-device').forEach(item=>item.classList.toggle('active',item===button));
        const name=button.dataset.deviceName||button.textContent.trim();drawerTarget.textContent=name.toUpperCase();
        const color=getComputedStyle(button).getPropertyValue('--device').trim()||'#18e9ff';this.querySelector('.sim-drawer-meta')?.style.setProperty('--target-color',color);
        const on=button.dataset.on!=='false';button.dataset.on=String(!on);button.classList.toggle('off',on);
        window.dispatchEvent(new CustomEvent('sim:targetchange',{detail:{name,zone:button.dataset.zone,on:!on}}));
      }));

      window.addEventListener('sim:viewporttarget',event=>{
        const zone=event.detail?.zone,name=event.detail?.name;
        const match=[...this.querySelectorAll('.sim-device')].find(button=>zone?button.dataset.zone===zone:button.dataset.deviceName===name);
        if(!match)return;
        this.querySelectorAll('.sim-device').forEach(item=>item.classList.toggle('active',item===match));
        drawerTarget.textContent=(match.dataset.deviceName||name||'TARGET').toUpperCase();
        if(rail.dataset.state==='closed')setRail('peek');
      });

      /* Touch/click in the viewport closes overlays to the requested resting states:
         lower controls stop at the visible tab row; left rail returns to tab-only. */
      viewport?.addEventListener('pointerdown',event=>{
        if(event.target.closest?.('button,input,select'))return;
        if(this.bottomState==='open')setBottomState('peek');
        if(rail.dataset.state!=='closed')setRail('closed');
      });

      /* Panels are solid at rest. They become translucent only while the user is actively touching/adjusting them. */
      const clearAdjust=()=>{sheet.classList.remove('adjusting');rail.classList.remove('adjusting')};
      drawer.addEventListener('pointerdown',()=>sheet.classList.add('adjusting'));
      rail.addEventListener('pointerdown',event=>{if(!event.target.closest('.sim-side-toggle'))rail.classList.add('adjusting')});
      ['pointerup','pointercancel'].forEach(type=>window.addEventListener(type,clearAdjust));
      this.querySelectorAll('.sim-drawer input,.sim-drawer select').forEach(control=>control.addEventListener('input',()=>{sheet.classList.add('adjusting');clearTimeout(this.adjustTimer);this.adjustTimer=setTimeout(()=>sheet.classList.remove('adjusting'),260)}));

      this.querySelectorAll('.sim-view-chip').forEach(button=>button.addEventListener('click',event=>{event.stopPropagation();this.querySelectorAll('.sim-view-chip').forEach(item=>item.classList.toggle('active',item===button));const index=Number(button.dataset.viewIndex||0);const view=this.config.views?.[index]||{};window.dispatchEvent(new CustomEvent('sim:viewchange',{detail:{index,view}}))}));

      this.querySelectorAll('.sim-range input').forEach(input=>input.addEventListener('input',()=>{const output=input.parentElement?.querySelector('output');if(output)output.value=`${input.value}%`}));
      this.querySelectorAll('.sim-swatch').forEach(button=>button.addEventListener('click',()=>this.querySelectorAll('.sim-swatch').forEach(item=>item.classList.toggle('active',item===button))));
      this.querySelectorAll('.sim-preset').forEach(button=>button.addEventListener('click',()=>this.querySelectorAll('.sim-preset').forEach(item=>item.classList.toggle('active',item===button))));
      this.querySelectorAll('.sim-mode').forEach(button=>button.addEventListener('click',()=>this.querySelectorAll('.sim-mode').forEach(item=>item.classList.toggle('active',item===button))));
      this.querySelectorAll('.sim-direction button').forEach(button=>button.addEventListener('click',()=>this.querySelectorAll('.sim-direction button').forEach(item=>item.classList.toggle('active',item===button))));
      this.querySelectorAll('.sim-custom-item').forEach(button=>button.addEventListener('click',()=>this.querySelectorAll('.sim-custom-item').forEach(item=>item.classList.toggle('active',item===button))));

      const shell=document.querySelector('.sim-shell');
      this.querySelector('.sim-fullscreen')?.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await shell?.requestFullscreen?.()}catch(error){console.warn('Fullscreen unavailable',error)}});

      this.bindAudio();
    }

    bindAudio(){
      const audio=this.querySelector('[data-audio]'),picker=this.querySelector('[data-audio-file]'),trackName=this.querySelector('[data-track-name]'),seek=this.querySelector('[data-track-seek]'),time=this.querySelector('[data-track-time]'),playlist=this.querySelector('[data-playlist]'),play=this.querySelector('[data-audio-action="play"]');
      const prev=this.querySelector('[data-audio-action="prev"]'),next=this.querySelector('[data-audio-action="next"]');
      let tracks=[],index=0,urls=[];
      const fmt=value=>{if(!Number.isFinite(value))return'0:00';const min=Math.floor(value/60),sec=Math.floor(value%60);return`${min}:${String(sec).padStart(2,'0')}`};
      const render=()=>{if(!tracks.length){playlist.innerHTML='<div class="sim-track-now">ADD LOCAL AUDIO</div>';return}playlist.innerHTML=tracks.map((track,i)=>`<button type="button" class="sim-playlist-row${i===index?' active':''}" data-track-index="${i}"><span>${String(i+1).padStart(2,'0')}</span><strong>${clean(track.name)}</strong></button>`).join('');playlist.querySelectorAll('[data-track-index]').forEach(button=>button.addEventListener('click',()=>load(Number(button.dataset.trackIndex),true)))};
      const load=(i,autoplay=false)=>{if(!tracks.length)return;index=(i+tracks.length)%tracks.length;audio.src=tracks[index].url;trackName.textContent=tracks[index].name;seek.value='0';time.textContent='0:00';render();if(autoplay)audio.play().catch(()=>{})};
      this.querySelector('[data-audio-action="pick"]')?.addEventListener('click',()=>picker?.click());
      picker?.addEventListener('change',()=>{urls.forEach(url=>URL.revokeObjectURL(url));urls=[];tracks=[...(picker.files||[])].filter(file=>file.type.startsWith('audio/')||/\.(mp3|m4a|aac|wav|ogg|oga|flac|opus|webm)$/i.test(file.name)).map(file=>{const url=URL.createObjectURL(file);urls.push(url);return{name:file.name,url}});index=0;render();if(tracks.length)load(0,false);picker.value=''});
      play?.addEventListener('click',async()=>{if(!tracks.length)return;if(!audio.src)load(index,false);if(audio.paused){await audio.play().catch(()=>{});play.textContent='❚❚'}else{audio.pause();play.textContent='▶'}});
      prev?.addEventListener('click',()=>{if(tracks.length)load(index-1,true)});next?.addEventListener('click',()=>{if(tracks.length)load(index+1,true)});
      audio?.addEventListener('play',()=>{play.textContent='❚❚'});audio?.addEventListener('pause',()=>{play.textContent='▶'});audio?.addEventListener('ended',()=>{if(tracks.length)load(index+1,true)});audio?.addEventListener('timeupdate',()=>{if(audio.duration){seek.value=String(audio.currentTime/audio.duration*100);time.textContent=fmt(audio.currentTime)}});seek?.addEventListener('input',()=>{if(audio.duration)audio.currentTime=Number(seek.value)/100*audio.duration});
      render();
    }
  }

  customElements.define('sim-controls',SimControls);
})();
