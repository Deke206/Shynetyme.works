'use strict';

const STW_SERVICE_UUID='78170001-7a32-4b19-913a-5354594d4501';
const STW_COMMAND_UUID='78170002-7a32-4b19-913a-5354594d4501';
const STW_STATUS_UUID ='78170003-7a32-4b19-913a-5354594d4501';
const STW_DEVICE_KEY='stw-esp32-devices-v4';
const STW_GROUP_KEY='stw-esp32-groups-v1';
const STW_TARGET_KEY='stw-esp32-target-v2';
const enc=new TextEncoder(),dec=new TextDecoder();

const DEFAULT_CONFIG=Object.freeze({leds:300,gpio:13,order:'GRB',segFrom:0,segTo:299,startupFx:'RAINBOW'});
const clone=o=>JSON.parse(JSON.stringify(o));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const uid=p=>`${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;

function loadJSON(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return v??fallback}catch(_){return fallback}}
function saveJSON(key,v){try{localStorage.setItem(key,JSON.stringify(v))}catch(_){}}
function newLogicalDevice(name){return {id:uid('dev'),name,bluetoothId:null,bluetoothName:'',config:clone(DEFAULT_CONFIG),lastFx:'RAINBOW',powered:true}}
function normalizeDevice(d,i){return {id:d?.id||uid('dev'),name:d?.name||`ESP32 ${i+1}`,bluetoothId:d?.bluetoothId||null,bluetoothName:d?.bluetoothName||'',config:{...clone(DEFAULT_CONFIG),...(d?.config||{})},lastFx:d?.lastFx||'RAINBOW',powered:d?.powered!==false}}
let devices=(loadJSON(STW_DEVICE_KEY,[])||[]).map(normalizeDevice);
if(!devices.length)devices=[newLogicalDevice('ESP32 1'),newLogicalDevice('ESP32 2')];
let groups=(loadJSON(STW_GROUP_KEY,[])||[]).map(g=>({id:g.id||uid('grp'),name:g.name||'Group',members:Array.isArray(g.members)?g.members:[]}));
let target=loadJSON(STW_TARGET_KEY,null);
let granted=new Map();
let connectLock=Promise.resolve();
let autoConnectTimer=0;
let manualBluetoothEpoch=0;
const runtimes=new Map();

function runtime(id){if(!runtimes.has(id))runtimes.set(id,{bt:null,server:null,cmd:null,st:null,status:'idle',queue:Promise.resolve(),lastStatus:{},disconnectHandler:null,error:'',auto:false});return runtimes.get(id)}
devices.forEach(d=>runtime(d.id));
function saveDevices(){saveJSON(STW_DEVICE_KEY,devices)}
function saveGroups(){saveJSON(STW_GROUP_KEY,groups)}
function saveTarget(){saveJSON(STW_TARGET_KEY,target)}
function deviceById(id){return devices.find(d=>d.id===id)||null}
function groupById(id){return groups.find(g=>g.id===id)||null}
function connected(id){return runtime(id).status==='connected'&&!!runtime(id).cmd}
function withConnectLock(task){const p=connectLock.then(task,task);connectLock=p.catch(()=>{});return p}
function waitFor(promise,ms,label){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error(label)),ms);Promise.resolve(promise).then(v=>{clearTimeout(timer);resolve(v)},e=>{clearTimeout(timer);reject(e)})})}
function chunks(text){const parts=String(text||'').split(';').map(x=>x.trim()).filter(Boolean),out=[];let cur='';for(const p of parts){const next=cur?`${cur};${p}`:p;if(next.length<=18)cur=next;else{if(cur)out.push(cur);cur=p}}if(cur)out.push(cur);return out}
function emit(type='state',extra={}){document.dispatchEvent(new CustomEvent('stw:ble',{detail:{type,...snapshot(),...extra}}))}
function targetMemberIds(){if(!target)return[];if(target.type==='device')return deviceById(target.id)?[target.id]:[];if(target.type==='group'){const g=groupById(target.id);return g?g.members.filter(id=>deviceById(id)):[]}return[]}
function hasPasskey(){const ids=targetMemberIds();if(!ids.length)return false;if(target?.type==='group'&&ids.length<2)return false;return ids.every(connected)}
function targetLabel(){if(!target)return'NONE';if(target.type==='device')return deviceById(target.id)?.name||'NONE';const g=groupById(target.id);if(!g)return'NONE';return g.members.map(id=>deviceById(id)?.name).filter(Boolean).join('🔗')||g.name}
function snapshot(){return {
  devices:devices.map(d=>{const r=runtime(d.id);return {...clone(d),bleStatus:d.bluetoothId?(r.status==='connected'?'connected':r.status==='connecting'?'connecting':'assigned'):'unassigned',error:r.error||'',lastStatus:{...r.lastStatus}}}),
  groups:clone(groups),target:target?clone(target):null,targetLabel:targetLabel(),passkey:hasPasskey(),granted:[...granted.values()].map(d=>({id:d.id,name:d.name||'Bluetooth device'}))
}}

function beginManualBluetooth(){manualBluetoothEpoch++;if(autoConnectTimer){clearTimeout(autoConnectTimer);autoConnectTimer=0}for(const r of runtimes.values()){if(r.auto&&r.status==='connecting'){try{r.bt?.gatt?.disconnect()}catch(_){}r.status='assigned';r.server=r.cmd=r.st=null;r.auto=false}}connectLock=Promise.resolve()}
function releaseExistingAssignment(btId,keepId){const owner=devices.find(x=>x.id!==keepId&&x.bluetoothId===btId);if(!owner)return;disconnectDevice(owner.id);owner.bluetoothId=null;owner.bluetoothName='';runtime(owner.id).status='idle';saveDevices();emit('reassigned',{deviceId:owner.id})}

async function writeRaw(id,text,fast=false){const r=runtime(id);if(!connected(id))throw new Error('Device not connected');const c=r.cmd,b=enc.encode(text);let op;const longPacket=b.length>18;if(longPacket&&c.properties?.write&&c.writeValueWithResponse)op=c.writeValueWithResponse(b);else if(fast&&c.properties?.writeWithoutResponse&&c.writeValueWithoutResponse)op=c.writeValueWithoutResponse(b);else if(c.properties?.write&&c.writeValueWithResponse)op=c.writeValueWithResponse(b);else if(c.writeValue)op=c.writeValue(b);else if(c.properties?.writeWithoutResponse&&c.writeValueWithoutResponse)op=c.writeValueWithoutResponse(b);else throw new Error('No BLE write method');await waitFor(op,longPacket?2400:1800,'Bluetooth write timed out')}
function queueWrite(id,text,fast=false){const r=runtime(id);const run=async()=>{for(const part of chunks(text))await writeRaw(id,part,fast);return true};r.queue=r.queue.then(run,run).catch(e=>{r.error=e.message;emit('tx-error',{deviceId:id,message:e.message});return false});return r.queue}
async function sendToIds(ids,text,{fast=false}={}){const active=[...new Set(ids)].filter(connected);if(!active.length)return false;const result=await Promise.all(active.map(id=>queueWrite(id,text,fast)));return result.some(Boolean)}
async function sendToTarget(text,opts={}){return sendToIds(targetMemberIds(),text,opts)}
async function sendToDevice(id,text,opts={}){return sendToIds([id],text,opts)}

function parseStatus(text){const o={};for(const p of String(text||'').split(';')){const n=p.indexOf('=');if(n>0)o[p.slice(0,n)]=p.slice(n+1)}return o}
async function readStatus(id){const r=runtime(id);if(!connected(id)||!r.st)return null;try{await queueWrite(id,'STATUS');await sleep(100);const v=await waitFor(r.st.readValue(),1800,'Status read timed out'),o=parseStatus(dec.decode(v));r.lastStatus={...r.lastStatus,...o};const d=deviceById(id);if(d){if(o.CFGLEDS||o.LEDS)d.config.leds=+(o.CFGLEDS||o.LEDS)||d.config.leds;if(o.CFGPIN||o.PIN)d.config.gpio=+(o.CFGPIN||o.PIN);if(o.ORDER)d.config.order=o.ORDER;if(o.FX)d.lastFx=o.FX;saveDevices()}emit('status',{deviceId:id,status:o});return o}catch(e){r.error=e.message;emit('status-error',{deviceId:id,message:e.message});return null}}

async function refreshGranted(){granted.clear();if(!navigator.bluetooth?.getDevices){emit('granted');return[]}try{const list=await navigator.bluetooth.getDevices();for(const d of list)granted.set(d.id,d);emit('granted');return list}catch(e){emit('granted-error',{message:e.message});return[]}}
function attachDisconnect(id,bt){const r=runtime(id);if(r.disconnectHandler)try{bt.removeEventListener('gattserverdisconnected',r.disconnectHandler)}catch(_){}r.disconnectHandler=()=>{r.status='assigned';r.server=r.cmd=r.st=null;r.queue=Promise.resolve();r.auto=false;emit('disconnected',{deviceId:id})};bt.addEventListener('gattserverdisconnected',r.disconnectHandler)}
async function openGatt(bt,{auto=false}={}){if(bt.gatt?.connected)return bt.gatt;let last;const attempts=auto?1:2;for(let n=0;n<attempts;n++){try{await sleep(n?320:100);return await waitFor(bt.gatt.connect(),auto?3000:4500,'Bluetooth connection timed out')}catch(e){last=e;try{bt.gatt?.disconnect()}catch(_){}}}throw last||new Error('Bluetooth connection failed')}
async function connectAssigned(id,{auto=false,epoch=manualBluetoothEpoch}={}){if(!auto)beginManualBluetooth();const d=deviceById(id),r=runtime(id);if(!d?.bluetoothId)throw new Error('No Bluetooth device assigned');if(connected(id))return true;if(auto&&epoch!==manualBluetoothEpoch)return false;let bt=granted.get(d.bluetoothId);if(!bt){await refreshGranted();bt=granted.get(d.bluetoothId)}if(!bt){r.status='assigned';r.error='Bluetooth permission is not available for this saved device';emit('connect-missing',{deviceId:id});return false}r.bt=bt;r.status='connecting';r.auto=auto;r.error='';emit('connecting',{deviceId:id,auto});try{await withConnectLock(async()=>{if(auto&&epoch!==manualBluetoothEpoch)throw new Error('Auto reconnect cancelled');attachDisconnect(id,bt);r.server=await openGatt(bt,{auto});if(auto&&epoch!==manualBluetoothEpoch)throw new Error('Auto reconnect cancelled');const svc=await waitFor(r.server.getPrimaryService(STW_SERVICE_UUID),auto?2200:3200,'ShyneTyme BLE service not found');r.cmd=await waitFor(svc.getCharacteristic(STW_COMMAND_UUID),auto?1800:2400,'Control characteristic not found');r.st=await waitFor(svc.getCharacteristic(STW_STATUS_UUID),auto?1800:2400,'Status characteristic not found')});r.status='connected';r.auto=false;d.bluetoothName=bt.name||d.bluetoothName;saveDevices();emit('connected',{deviceId:id,auto});return true}catch(e){r.status='assigned';r.auto=false;r.error=e.message==='Auto reconnect cancelled'?'':e.message;try{r.server?.disconnect()}catch(_){}r.server=r.cmd=r.st=null;if(e.message!=='Auto reconnect cancelled')emit('connect-error',{deviceId:id,message:e.message});return false}}
async function assignGranted(id,btId){beginManualBluetooth();const d=deviceById(id);if(!d)throw new Error('Unknown device');await refreshGranted();const bt=granted.get(btId);if(!bt)throw new Error('That Bluetooth device is not granted to this page');releaseExistingAssignment(bt.id,id);d.bluetoothId=bt.id;d.bluetoothName=bt.name||'Bluetooth device';saveDevices();emit('assigned',{deviceId:id});return connectAssigned(id)}
async function assignNew(id){beginManualBluetooth();if(!navigator.bluetooth)throw new Error('Web Bluetooth is not available');if(!window.isSecureContext)throw new Error('HTTPS is required for Bluetooth');const bt=await navigator.bluetooth.requestDevice({acceptAllDevices:true,optionalServices:[STW_SERVICE_UUID]});granted.set(bt.id,bt);const d=deviceById(id);if(!d)throw new Error('Unknown device');releaseExistingAssignment(bt.id,id);d.bluetoothId=bt.id;d.bluetoothName=bt.name||'Bluetooth device';saveDevices();emit('assigned',{deviceId:id});return connectAssigned(id)}
async function autoConnect(){const epoch=manualBluetoothEpoch;await refreshGranted();if(epoch!==manualBluetoothEpoch)return false;let ids=targetMemberIds();if(!ids.length){const first=devices.find(d=>d.bluetoothId&&granted.has(d.bluetoothId));ids=first?[first.id]:[]}for(const id of ids){if(epoch!==manualBluetoothEpoch)break;const d=deviceById(id);if(d?.bluetoothId&&granted.has(d.bluetoothId))await connectAssigned(id,{auto:true,epoch})}if(epoch!==manualBluetoothEpoch)return false;if(!target){const first=devices.find(d=>connected(d.id));if(first)target={type:'device',id:first.id}}saveTarget();emit('autoconnect-complete');return true}
function disconnectDevice(id){const r=runtime(id);try{r.server?.disconnect()}catch(_){}r.status=deviceById(id)?.bluetoothId?'assigned':'unassigned';r.auto=false;r.server=r.cmd=r.st=null;r.queue=Promise.resolve();emit('disconnected',{deviceId:id})}

function selectDevice(id){if(!deviceById(id))return false;target={type:'device',id};saveTarget();emit('target');return true}
function selectGroup(id){const g=groupById(id);if(!g)return false;target={type:'group',id};saveTarget();emit('target');return true}
function clearTarget(){target=null;saveTarget();emit('target')}
function addLogicalDevice(name){const d=newLogicalDevice((name||`ESP32 ${devices.length+1}`).trim()||`ESP32 ${devices.length+1}`);devices.push(d);runtime(d.id);saveDevices();emit('devices');return d.id}
function removeLogicalDevice(id){const d=deviceById(id);if(!d)return false;disconnectDevice(id);devices=devices.filter(x=>x.id!==id);groups=groups.map(g=>({...g,members:g.members.filter(x=>x!==id)})).filter(g=>g.members.length);if(target?.type==='device'&&target.id===id)target=null;if(target?.type==='group'&&!groupById(target.id))target=null;saveDevices();saveGroups();saveTarget();emit('devices');return true}
function renameDevice(id,name){const d=deviceById(id);if(!d)return false;d.name=(name||'').trim()||d.name;saveDevices();emit('devices');return true}
function unassignBluetooth(id){beginManualBluetooth();const d=deviceById(id);if(!d)return false;disconnectDevice(id);d.bluetoothId=null;d.bluetoothName='';runtime(id).status='idle';saveDevices();if(target?.type==='device'&&target.id===id)clearTarget();emit('unassigned',{deviceId:id});return true}

function createGroup(name){const clean=(name||'').trim();if(!clean)throw new Error('Group name required');const g={id:uid('grp'),name:clean,members:[]};groups.push(g);saveGroups();emit('groups');return g.id}
function renameGroup(id,name){const g=groupById(id);if(!g)return false;g.name=(name||'').trim()||g.name;saveGroups();emit('groups');return true}
function setGroupMembers(id,members){const g=groupById(id);if(!g)return false;g.members=[...new Set(members)].filter(x=>deviceById(x));saveGroups();emit('groups');return true}
function deleteGroup(id){groups=groups.filter(g=>g.id!==id);if(target?.type==='group'&&target.id===id)target=null;saveGroups();saveTarget();emit('groups');return true}

function validateConfig(c){if(!Number.isFinite(c.leds)||c.leds<1||c.leds>600)return'LED count must be 1–600';if(!Number.isFinite(c.gpio)||c.gpio<0||c.gpio>39)return'GPIO must be 0–39';if(!['RGB','GRB','BRG','GBR','RBG','BGR'].includes(c.order))return'Invalid pixel order';if(c.segFrom<0||c.segTo<c.segFrom||c.segTo>=c.leds)return`Effect range must stay inside 0–${c.leds-1}`;return''}
async function saveDeviceConfig(id,cfg,{reboot=false}={}){const d=deviceById(id);if(!d)throw new Error('Select one device');const c={...d.config,...cfg,leds:+cfg.leds,gpio:+cfg.gpio,segFrom:+cfg.segFrom,segTo:+cfg.segTo};const err=validateConfig(c);if(err)throw new Error(err);if(!connected(id))throw new Error('Selected device is not connected');await sendToDevice(id,`LEDS=${c.leds};PIN=${c.gpio};ORDER=${c.order};SAVE`);if(reboot)await sendToDevice(id,'REBOOT');d.config=c;saveDevices();emit('config',{deviceId:id});return true}
async function saveStartup(id,startupCommand,restoreCommand,startupFx){const d=deviceById(id);if(!d||!connected(id))throw new Error('Selected device is not connected');await sendToDevice(id,startupCommand);await sendToDevice(id,'SAVE');if(restoreCommand&&restoreCommand!==startupCommand)await sendToDevice(id,restoreCommand);d.config.startupFx=startupFx;saveDevices();emit('config',{deviceId:id});return true}
function setLastFx(fx){for(const id of targetMemberIds()){const d=deviceById(id);if(d){d.lastFx=fx;d.powered=fx!=='OFF'}}saveDevices();emit('effect')}
async function togglePower(id){const d=deviceById(id);if(!d||!connected(id))return false;if(d.powered){await sendToDevice(id,'FX=OFF');d.powered=false}else{await sendToDevice(id,`FX=${d.lastFx&&d.lastFx!=='OFF'?d.lastFx:'RAINBOW'}`);d.powered=true}saveDevices();emit('power',{deviceId:id});return d.powered}

window.STWBLE={snapshot,refreshGranted,assignGranted,assignNew,connectAssigned,disconnectDevice,unassignBluetooth,selectDevice,selectGroup,clearTarget,addLogicalDevice,removeLogicalDevice,renameDevice,createGroup,renameGroup,setGroupMembers,deleteGroup,send:sendToTarget,sendToDevice,readStatus,saveDeviceConfig,saveStartup,setLastFx,togglePower,targetMemberIds,hasPasskey,autoConnect};
queueMicrotask(()=>{emit('ready');autoConnectTimer=setTimeout(()=>{autoConnectTimer=0;autoConnect()},1200)});