const SHELL='ashfall-god-shell-v6',SHELL_FILES=['/admin-offline/index.html','/admin-offline/launcher.js','/admin-offline/manifest.webmanifest','/arcade/original-creations.json'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(SHELL).then(c=>c.addAll(SHELL_FILES)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('ashfall-god-shell-')&&key!==SHELL)await caches.delete(key);await self.clients.claim();})())});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const u=new URL(event.request.url);if(u.origin!==self.location.origin)return;
 const match=/^\/admin-offline\/play\/([a-z0-9-]+)\//.exec(u.pathname);
 if(match){event.respondWith((async()=>{const c=await caches.open('ashfall-god-game-'+match[1]+'-v1');return await c.match(event.request,{ignoreSearch:true})||new Response('This game asset is not installed on this device.',{status:404,headers:{'content-type':'text/plain','cache-control':'no-store'}})})());return;}
 if(SHELL_FILES.includes(u.pathname)){event.respondWith(fetch(event.request).then(async r=>{if(!r.ok)throw Error('offline');const c=await caches.open(SHELL);await c.put(event.request,r.clone());return r;}).catch(()=>caches.match(event.request).then(r=>r||new Response('App shell unavailable',{status:503}))));}
});