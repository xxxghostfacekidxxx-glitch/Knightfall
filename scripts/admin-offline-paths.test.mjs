import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(path,'utf8');
const manifest=JSON.parse(read('public/admin-offline/manifest.webmanifest'));
function worker(){
 const handlers={},stores=new Map();let online=true;
 const key=value=>typeof value==='string'?new URL(value,'https://ash-fall.com').pathname:new URL(value.url).pathname;
 const caches={async open(name){if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);return {
  async addAll(paths){for(const path of paths)store.set(key(path),new Response(path===manifest.start_url?'arcade launcher':'asset'));},
  async put(request,response){store.set(key(request),response);},
  async match(request){return store.get(key(request))?.clone();}
 };},async keys(){return [...stores.keys()];},async delete(name){return stores.delete(name);}};
 const self={location:{origin:'https://ash-fall.com'},addEventListener(name,handler){handlers[name]=handler;},async skipWaiting(){},clients:{async claim(){}}};
 vm.runInNewContext(read('public/admin-offline/sw.js'),{self,caches,URL,Request,Response,fetch:async()=>{if(!online)throw Error('offline');return new Response('online');}});
 return {caches,offline(){online=false;},async install(){let promise;handlers.install({waitUntil(p){promise=p;}});await promise;},async get(path){let response;handlers.fetch({request:new Request('https://ash-fall.com'+path),respondWith(p){response=p;}});return response;}};
}
test('Android manifest uses a canonical launch path and real PNG install icons',()=>{
 assert.equal(manifest.start_url,'/admin-offline/');assert.equal(manifest.scope,'/admin-offline/');
 for(const size of [192,512]){
  const icon=manifest.icons.find(i=>i.sizes===`${size}x${size}`&&i.type==='image/png');assert.ok(icon);
  const png=readFileSync('public'+icon.src);assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);
 }
});
test('installed app starts offline through canonical, legacy, and query-string paths',async()=>{
 const sw=worker();await sw.install();sw.offline();
 for(const path of ['/admin-offline/','/admin-offline/index.html','/admin-offline','/admin-offline/?source=pwa','/admin-offline/index.html?source=pwa']){
  const response=await sw.get(path);assert.equal(response?.status,200,path);assert.equal(await response.text(),'arcade launcher',path);
 }
});
test('path repair preserves installed games and their cache-busting asset URLs',async()=>{
 const sw=worker();const cache=await sw.caches.open('ashfall-god-game-sanctuary-original-v1');
 await cache.put('/admin-offline/play/sanctuary-original/sanctuary.html',new Response('saved game'));
 await sw.install();sw.offline();
 const response=await sw.get('/admin-offline/play/sanctuary-original/sanctuary.html?v=1');assert.equal(await response.text(),'saved game');
 const missing=await sw.get('/admin-offline/play/sanctuary-original/missing.js');assert.equal(missing.status,404);
 assert.equal(await sw.get('/api/auth/me'),undefined);
});

test('admin dashboard links directly to the offline install path',()=>{
 const admin=read('public/admin.html');
 assert.match(admin,/href="\/admin-offline\/"/,'God dashboard must launch the canonical directory URL');
 assert.doesNotMatch(admin,/href="\/admin-offline\/index\.html"/,'Do not reintroduce a redirect during Android installation');
});

 test('worker serves the committed replacement cache instead of the legacy copy',async()=>{
 const sw=worker();await sw.install();
 const pointer=await sw.caches.open('ashfall-god-installed-v1');
 await pointer.put('/admin-offline/play/example/__installed__',new Response('ashfall-god-game-example-generation'));
 const game=await sw.caches.open('ashfall-god-game-example-generation');
 await game.put('/admin-offline/play/example/index.html',new Response('replacement'));
 sw.offline();assert.equal(await (await sw.get('/admin-offline/play/example/index.html')).text(),'replacement');
 });
