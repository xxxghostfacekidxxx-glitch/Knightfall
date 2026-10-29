(() => {
'use strict';
const status=document.querySelector('#status'), games=document.querySelector('#games'), bar=document.querySelector('#progress');
const ids=['sanctuary-original','ashfall-infernal-reign-dev'], PREFIX='/admin-offline/play/';
const say=t=>status.textContent=t;
const safeName=name=>name && !name.startsWith('/') && !name.includes('\\') && name.split('/').every(part=>part!=='.'&&part!=='..') && !name.includes('?') && !name.includes('#');
async function inflate(bytes, method) {
 if(method===0)return bytes;
 if(method!==8)throw Error('Unsupported ZIP compression: '+method);
 if(!('DecompressionStream' in window))throw Error('This browser cannot unpack ZIP files. Use a current Chromium browser.');
 const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
 return new Uint8Array(await new Response(stream).arrayBuffer());
}
const u16=(v,p)=>v.getUint16(p,true),u32=(v,p)=>v.getUint32(p,true);
async function extractZip(buffer, id, onProgress) {
 const v=new DataView(buffer), bytes=new Uint8Array(buffer), dec=new TextDecoder();
 let eocd=-1;for(let p=buffer.byteLength-22;p>=Math.max(0,buffer.byteLength-65557);p--){if(u32(v,p)===0x06054b50){eocd=p;break;}}
 if(eocd<0)throw Error('Invalid ZIP: central directory missing');
 const total=u16(v,eocd+10),start=u32(v,eocd+16);\n if(start>=buffer.byteLength || total===0)throw Error('Empty or invalid ZIP package');
 if(total>20000)throw Error('Package contains too many files');
 let p=start, entries=[], size=0;
 for(let i=0;i<total;i++){
  if(p+46>buffer.byteLength || u32(v,p)!==0x02014b50)throw Error('Invalid ZIP entry');
  const method=u16(v,p+10),compressed=u32(v,p+20),uncompressed=u32(v,p+24),n=u16(v,p+28),extra=u16(v,p+30),comment=u16(v,p+32),offset=u32(v,p+42);
  if(p+46+n+extra+comment>buffer.byteLength)throw Error('Truncated ZIP directory');\n  const name=dec.decode(bytes.subarray(p+46,p+46+n));p+=46+n+extra+comment;
  if(name.endsWith('/'))continue;\n  if(!name || entries.some(e=>e.name===name))throw Error('Duplicate or empty ZIP asset path');
  if(!safeName(name))throw Error('Unsafe archive filename');
  if(uncompressed>100*1024*1024)throw Error('Individual asset too large');
  size+=uncompressed;if(size>650*1024*1024)throw Error('Package exceeds 650 MB offline storage limit');
  entries.push({name,method,compressed,uncompressed,offset});
 }
 const cacheName='ashfall-god-game-'+id+'-v1';\n const stagingName='ashfall-god-stage-'+id+'-v1';\n await caches.delete(stagingName);\n const cache=await caches.open(stagingName);
 try{
  for(let i=0;i<entries.length;i++){
   const e=entries[i],o=e.offset;
   if(o+30>buffer.byteLength || u32(v,o)!==0x04034b50)throw Error('Invalid local ZIP entry');
   const data=o+30+u16(v,o+26)+u16(v,o+28);
   if(data+e.compressed>buffer.byteLength)throw Error('Truncated ZIP asset');
   const raw=await inflate(bytes.subarray(data,data+e.compressed),e.method);
   if(raw.length!==e.uncompressed)throw Error('ZIP asset size mismatch');
   const ext=e.name.split('.').pop().toLowerCase();
   const mime=({html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',mjs:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',json:'application/json',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',glb:'model/gltf-binary',gltf:'model/gltf+json',wasm:'application/wasm',mp3:'audio/mpeg',ogg:'audio/ogg',woff2:'font/woff2'})[ext]||'application/octet-stream';
   await cache.put(PREFIX+id+'/'+e.name,new Response(raw,{headers:{'content-type':mime,'cache-control':'private, max-age=31536000'}}));
   onProgress(Math.round((i+1)/entries.length*100));
  }
  if(!(await cache.match(PREFIX+id+'/sanctuary.html')))throw Error('Game entry point missing');
 }catch(err){await caches.delete('ashfall-god-game-'+id+'-v1');throw err;}
}
async function storageStatus(){
 const el=document.querySelector('#storage-status');if(!el)return;
 try{if(!navigator.storage?.estimate){el.textContent='Storage estimate unavailable in this browser.';return}
 const {usage=0,quota=0}=await navigator.storage.estimate();
 const mb=n=>(n/1048576).toFixed(1)+' MB';
 el.textContent='Device storage: '+mb(usage)+' used'+(quota?' of '+mb(quota)+' available quota':'')+'. Offline games use browser storage and can be cleared by the device.';
 }catch(e){el.textContent='Device storage estimate unavailable.'}
}
async function updateButtons(){
 for(const id of ids){
  const cache=await caches.open('ashfall-god-game-'+id+'-v1');
  const installed=!!(await cache.match(PREFIX+id+'/sanctuary.html'));
  document.querySelector('[data-play="'+id+'"]').hidden=!installed;
  document.querySelector('[data-remove="'+id+'"]').disabled=!installed;
 }
}
async function auth(){
 try{const r=await fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store'});if(!r.ok)throw Error('Login required');
 const data=await r.json();if(!['admin','god'].includes(data.user?.role))throw Error('Administrator access required');
 say('Administrator verified. Install games to this device.');games.hidden=false;return true;
 }catch(e){
  const installed=await Promise.all(ids.map(async id=>{const c=await caches.open('ashfall-god-game-'+id+'-v1');return !!(await c.match(PREFIX+id+'/sanctuary.html'));}));
  if(!navigator.onLine && installed.some(Boolean)){say('Offline mode: previously installed games available on this device.');games.hidden=false;document.querySelectorAll('[data-install]').forEach(b=>b.disabled=true);return false;}
  say(e.message+'. Online admin login is required to install games.');games.hidden=true;return false;
 }
}
document.querySelectorAll('[data-install]').forEach(b=>b.onclick=async()=>{
 const id=b.dataset.install;b.disabled=true;bar.hidden=false;bar.value=0;
 try{
  if(!await auth())throw Error('Online admin verification required');
  say('Downloading private '+id+' package…');
  const r=await fetch('/api/admin/game-downloads/'+id,{credentials:'same-origin',cache:'no-store'});
  if(!r.ok)throw Error('Private package unavailable (HTTP '+r.status+'). Check R2 upload workflow.');
  const buffer=await r.arrayBuffer();say('Installing '+id+' ('+Math.round(buffer.byteLength/1048576)+' MB)…');
  await extractZip(buffer,id,p=>{bar.value=p;say('Installing '+id+': '+p+'%');});
  say('Installed '+id+'. Ready for offline play.');await updateButtons();
 }catch(e){say('Install failed: '+e.message)}finally{b.disabled=false;bar.hidden=true;}
});
document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=async()=>{await caches.delete('ashfall-god-game-'+b.dataset.remove+'-v1');say('Local game removed.');await updateButtons();await storageStatus()});
let promptEvent;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();promptEvent=e;document.querySelector('#install-app').hidden=false});
document.querySelector('#install-app').onclick=async()=>{if(promptEvent){await promptEvent.prompt();promptEvent=null}};
(async()=>{if('serviceWorker' in navigator)try{await navigator.serviceWorker.register('/admin-offline/sw.js',{scope:'/admin-offline/'});await navigator.serviceWorker.ready;}catch(e){say('Offline service worker unavailable: '+e.message)}
 await updateButtons();await storageStatus();await auth();})();
})();