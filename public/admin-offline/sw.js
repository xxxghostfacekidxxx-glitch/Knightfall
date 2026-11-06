const SHELL='ashfall-god-shell-v11';
const START='/admin-offline/';
const SHELL_FILES=[START,'/admin-offline/launcher.js','/admin-offline/manifest.webmanifest','/admin-offline/icon-192.png','/admin-offline/icon-512.png','/arcade/original-creations.json'];
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(SHELL);
  // Pages redirects index.html to the directory URL. Cache the final URL so
  // Android's launch navigation never depends on an online redirect.
  await cache.addAll(SHELL_FILES);
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('ashfall-god-shell-')&&key!==SHELL)await caches.delete(key);await self.clients.claim();})())});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const u=new URL(event.request.url);if(u.origin!==self.location.origin)return;
 const match=/^\/admin-offline\/play\/([a-z0-9-]+)\//.exec(u.pathname);
 if(match){event.respondWith((async()=>{const index=await caches.open('ashfall-god-installed-v1');const record=await index.match('/admin-offline/play/'+match[1]+'/__installed__');const name=record?await record.text():'ashfall-god-game-'+match[1]+'-v1';const c=await caches.open(name);return await c.match(event.request,{ignoreSearch:true})||new Response('This game asset is not installed on this device.',{status:404,headers:{'content-type':'text/plain','cache-control':'no-store'}})})());return;}
 const path=u.pathname==='/admin-offline/index.html'||u.pathname==='/admin-offline'?START:u.pathname;
 if(SHELL_FILES.includes(path)){
  event.respondWith((async()=>{
   const cache=await caches.open(SHELL);
   try{
    const response=await fetch(new Request(new URL(path,u.origin),{cache:'no-store',credentials:'same-origin'}));
    if(!response.ok)throw Error('App shell request failed');
    await cache.put(path,response.clone());return response;
   }catch{
    return await cache.match(path)||new Response('Offline Arcade is not saved yet. Reconnect and open /admin-offline/ once.',{status:503,headers:{'content-type':'text/plain'}});
   }
  })());
 }
});
