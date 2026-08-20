/* Shared simulator control object. No viewport sizing or site-navigation code lives here. */
(()=>{
  'use strict';

  const clampText = value => String(value ?? '').replace(/[<>]/g,'');
  const configNode = document.getElementById('simConfig');
  let config = {};
  try { config = JSON.parse(configNode?.textContent || '{}'); } catch (error) { console.error('SIM config error', error); }

  class SimControls extends HTMLElement {
    connectedCallback(){
      this.config = config;
      this.drawerState = 'closed';
      this.lastTab = 'effects';
      this.render();
      this.bind();
    }

    render(){
      const views = (this.config.views || []).map((view,index)=>`<button class="sim-view-chip${index===0?' active':''}" type="button" data-view-index="${index}" style="--chip:${view.color || '#18e9ff'}">${clampText(view.label)}</button>`).join('');
      const devices = this.renderDevices(this.config.devices || []);
      const groups = this.renderDevices(this.config.groups || []);
      const effects = (this.config.effects || ['Solid','Chase','Breathe','Wave']).map(name=>`<option>${clampText(name)}</option>`).join('');
      const presets = (this.config.presets || ['Solid','Chase','Rainbow','Wave']).map((name,index)=>`<button class="sim-preset${index===0?' active':''}" type="button">${clampText(name)}</button>`).join('');
      const initialTarget = this.config.initialTarget || this.config.devices?.[0]?.name || 'TARGET';

      this.dataset.drawer = 'closed';
      this.innerHTML = `
        <header class="sim-topbar" aria-label="Simulator view controls">
          <div class="sim-view-strip">${views}</div>
          <div class="sim-status">
            <span class="connected"><span class="status-copy">● CONNECTED</span></span>
            <span class="status-copy">100%</span>
            <button class="sim-fullscreen" type="button" aria-label="Fullscreen simulator" title="Fullscreen">⛶</button>
          </div>
        </header>

        <aside class="sim-side-rail" data-state="closed" aria-label="Simulator target controls">
          <button class="sim-side-toggle" type="button" aria-label="Open target controls halfway" title="Open target controls halfway"><span>››</span></button>
          <div class="sim-rail-switch">
            <button class="active" type="button" data-rail="devices">${clampText(this.config.railLabel || 'DEVICES')}</button>
            <button type="button" data-rail="groups">GROUPS</button>
          </div>
          <div class="sim-device-stack" data-pane="devices">${devices}</div>
          <div class="sim-device-stack" data-pane="groups" hidden>${groups || '<button class="sim-device" type="button" disabled>NO GROUPS</button>'}</div>
        </aside>

        <section class="sim-drawer" aria-hidden="true">
          <div class="sim-drawer-meta"><span>ACTIVE TARGET</span><strong>${clampText(initialTarget).toUpperCase()}</strong></div>

          <div class="sim-panel active" data-panel="effects">
            <div class="sim-panel-grid">
              <section class="sim-box">
                <h3>LED EFFECTS</h3>
                <div class="sim-control-grid">
                  <div class="sim-control"><label for="simEffect">EFFECT</label><select id="simEffect">${effects}</select></div>
                  ${this.range('SPEED',68)}
                  ${this.range('BRIGHTNESS',82)}
                  ${this.range('INTENSITY',76)}
                  <div class="sim-control"><label>DIRECTION</label><div class="sim-direction"><button type="button" aria-label="Reverse direction">←</button><button type="button" class="active" aria-label="Forward direction">→</button></div></div>
                </div>
              </section>
              <section class="sim-box">
                <h3>SAVED COLORS</h3>
                <div class="sim-swatches">
                  <button class="sim-swatch active" type="button" style="--sw:#ff2ca8" aria-label="Hot pink"></button>
                  <button class="sim-swatch" type="button" style="--sw:#36bfff" aria-label="Light blue"></button>
                  <button class="sim-swatch" type="button" style="--sw:#ffd928" aria-label="Neon yellow"></button>
                  <button class="sim-swatch" type="button" style="--sw:#8b51ff" aria-label="Violet"></button>
                </div>
              </section>
            </div>
          </div>

          <div class="sim-panel" data-panel="music">
            <div class="sim-panel-grid">
              <section class="sim-box">
                <h3>MUSIC SYNC</h3>
                <div class="sim-music-row">
                  <button class="sim-track-button" type="button" data-audio-action="pick">＋ AUDIO</button>
                  <span class="sim-track-name" data-track-name>NO LOCAL TRACK SELECTED</span>
                  <button class="sim-track-button" type="button" data-audio-action="play">▶</button>
                </div>
                <input type="file" accept="audio/*" hidden data-audio-file>
                <audio preload="metadata" data-audio></audio>
              </section>
              <section class="sim-box">
                <h3>RESPONSE MODE</h3>
                <div class="sim-modes"><button class="sim-mode active" type="button">SPECTRUM</button><button class="sim-mode" type="button">PIANO</button><button class="sim-mode" type="button">STROBE</button></div>
              </section>
            </div>
          </div>

          <div class="sim-panel" data-panel="presets"><section class="sim-box"><h3>PRESETS</h3><div class="sim-presets">${presets}</div></section></div>
          <div class="sim-panel" data-panel="custom"><section class="sim-box"><h3>CUSTOM EFFECTS</h3><p style="margin:0;color:#b7c5d4">Custom effect editing stays inside this shared control object. The active simulator viewport remains visible behind it.</p></section></div>
        </section>

        <button class="sim-drawer-toggle" type="button" aria-label="Open lower controls" title="Open lower controls"><span>⌃</span></button>
        <nav class="sim-bottom-dock" aria-label="Simulator control tabs">
          <button class="sim-dock-tab" type="button" data-tab="effects" style="--tab:#18e9ff">LED EFFECTS</button>
          <button class="sim-dock-tab" type="button" data-tab="music" style="--tab:#36bfff">MUSIC SYNC</button>
          <button class="sim-dock-tab" type="button" data-tab="presets" style="--tab:#ffd928">PRESETS</button>
          <button class="sim-dock-tab" type="button" data-tab="custom" style="--tab:#ff2ca8">CUSTOM EFFECTS</button>
        </nav>`;
    }

    renderDevices(list){
      return list.map((device,index)=>`<button class="sim-device${index===0?' active':''}${device.on===false?' off':''}" type="button" data-device-index="${index}" data-device-name="${clampText(device.name)}" data-zone="${clampText(device.zone || '')}" data-on="${device.on===false?'false':'true'}" style="--device:${device.color || '#18e9ff'}">${clampText(device.label || device.name)}</button>`).join('');
    }

    range(label,value){
      const id = `sim${label[0]}${label.slice(1).toLowerCase()}`;
      return `<div class="sim-control"><label for="${id}">${label}</label><div class="sim-range"><input id="${id}" type="range" min="0" max="100" value="${value}"><output>${value}%</output></div></div>`;
    }

    bind(){
      const rail = this.querySelector('.sim-side-rail');
      const sideToggle = this.querySelector('.sim-side-toggle');
      const drawer = this.querySelector('.sim-drawer');
      const drawerToggle = this.querySelector('.sim-drawer-toggle');
      const drawerTarget = this.querySelector('.sim-drawer-meta strong');

      sideToggle.addEventListener('click',()=>{
        const state = rail.dataset.state || 'closed';
        const next = state === 'closed' ? 'peek' : state === 'peek' ? 'full' : 'closed';
        rail.dataset.state = next;
        sideToggle.setAttribute('aria-label', next === 'closed' ? 'Open target controls halfway' : next === 'peek' ? 'Open target controls fully' : 'Close target controls');
      });

      this.querySelectorAll('[data-rail]').forEach(button=>button.addEventListener('click',()=>{
        this.querySelectorAll('[data-rail]').forEach(item=>item.classList.toggle('active',item===button));
        this.querySelectorAll('[data-pane]').forEach(pane=>pane.hidden = pane.dataset.pane !== button.dataset.rail);
      }));

      this.querySelectorAll('.sim-device').forEach(button=>button.addEventListener('click',()=>{
        if(button.disabled) return;
        this.querySelectorAll('.sim-device').forEach(item=>item.classList.toggle('active',item===button));
        const name = button.dataset.deviceName || button.textContent.trim();
        drawerTarget.textContent = name.toUpperCase();
        const on = button.dataset.on !== 'false';
        button.dataset.on = String(!on);
        button.classList.toggle('off',on);
        window.dispatchEvent(new CustomEvent('sim:targetchange',{detail:{name,zone:button.dataset.zone,on:!on}}));
      }));

      window.addEventListener('sim:viewporttarget',event=>{
        const zone = event.detail?.zone;
        const name = event.detail?.name;
        const match = [...this.querySelectorAll('.sim-device')].find(button => zone ? button.dataset.zone === zone : button.dataset.deviceName === name);
        if(!match) return;
        this.querySelectorAll('.sim-device').forEach(item=>item.classList.toggle('active',item===match));
        drawerTarget.textContent = (match.dataset.deviceName || name || 'TARGET').toUpperCase();
        if(rail.dataset.state==='closed') rail.dataset.state='peek';
      });

      const setDrawer = (tab,forceOpen=true)=>{
        this.lastTab = tab || this.lastTab || 'effects';
        this.querySelectorAll('.sim-panel').forEach(panel=>panel.classList.toggle('active',panel.dataset.panel===this.lastTab));
        this.querySelectorAll('.sim-dock-tab').forEach(button=>button.classList.toggle('active',button.dataset.tab===this.lastTab && forceOpen));
        this.dataset.drawer = forceOpen ? 'open' : 'closed';
        drawer.setAttribute('aria-hidden',String(!forceOpen));
        drawerToggle.setAttribute('aria-label',forceOpen?'Close lower controls':'Open lower controls');
      };

      this.querySelectorAll('.sim-dock-tab').forEach(button=>button.addEventListener('click',()=>{
        const sameOpen = this.dataset.drawer === 'open' && this.lastTab === button.dataset.tab;
        setDrawer(button.dataset.tab,!sameOpen);
      }));
      drawerToggle.addEventListener('click',()=>setDrawer(this.lastTab,this.dataset.drawer!=='open'));

      this.querySelectorAll('.sim-view-chip').forEach(button=>button.addEventListener('click',()=>{
        this.querySelectorAll('.sim-view-chip').forEach(item=>item.classList.toggle('active',item===button));
        const index = Number(button.dataset.viewIndex || 0);
        const view = this.config.views?.[index] || {};
        window.dispatchEvent(new CustomEvent('sim:viewchange',{detail:{index,view}}));
      }));

      this.querySelectorAll('input[type="range"]').forEach(input=>input.addEventListener('input',()=>{
        const output = input.parentElement?.querySelector('output');
        if(output) output.value = `${input.value}%`;
      }));
      this.querySelectorAll('.sim-swatch').forEach(button=>button.addEventListener('click',()=>this.querySelectorAll('.sim-swatch').forEach(item=>item.classList.toggle('active',item===button))));
      this.querySelectorAll('.sim-preset').forEach(button=>button.addEventListener('click',()=>this.querySelectorAll('.sim-preset').forEach(item=>item.classList.toggle('active',item===button))));
      this.querySelectorAll('.sim-mode').forEach(button=>button.addEventListener('click',()=>this.querySelectorAll('.sim-mode').forEach(item=>item.classList.toggle('active',item===button))));
      this.querySelectorAll('.sim-direction button').forEach(button=>button.addEventListener('click',()=>this.querySelectorAll('.sim-direction button').forEach(item=>item.classList.toggle('active',item===button))));

      const shell = document.querySelector('.sim-shell');
      this.querySelector('.sim-fullscreen')?.addEventListener('click',async()=>{
        try{
          if(document.fullscreenElement) await document.exitFullscreen();
          else await shell?.requestFullscreen?.();
        }catch(error){ console.warn('Fullscreen unavailable',error); }
      });

      const audio = this.querySelector('[data-audio]');
      const picker = this.querySelector('[data-audio-file]');
      const trackName = this.querySelector('[data-track-name]');
      let objectUrl = '';
      this.querySelector('[data-audio-action="pick"]')?.addEventListener('click',()=>picker?.click());
      picker?.addEventListener('change',()=>{
        const file = picker.files?.[0];
        if(!file) return;
        if(objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = URL.createObjectURL(file);
        audio.src = objectUrl;
        trackName.textContent = file.name;
      });
      this.querySelector('[data-audio-action="play"]')?.addEventListener('click',async event=>{
        if(!audio.src) return;
        if(audio.paused){ await audio.play().catch(()=>{}); event.currentTarget.textContent='❚❚'; }
        else { audio.pause(); event.currentTarget.textContent='▶'; }
      });
    }
  }

  customElements.define('sim-controls',SimControls);
})();
