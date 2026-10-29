// Offline shell only. Never cache credentials, API responses, or private ZIP archives.
const CACHE='ashfall-admin-download-shell-v1';
const SHELL=['/admin-game-downloads.html','/admin-game-downloads.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('ashfall-admin-download-shell-')&&key!==CACHE).map(key=>caches.delete(key)))));self.clients.claim()});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 if(url.pathname!=='/admin-game-downloads.html'&&url.pathname!=='/admin-game-downloads.webmanifest')return;
 event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
});
