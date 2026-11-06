import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
function zip(files){
 const local=[],central=[];let offset=0;
 for(const [name,body] of Object.entries(files)){
  const n=Buffer.from(name),b=Buffer.from(body),h=Buffer.alloc(30),c=Buffer.alloc(46);
  h.writeUInt32LE(0x04034b50);h.writeUInt32LE(b.length,18);h.writeUInt32LE(b.length,22);h.writeUInt16LE(n.length,26);
  c.writeUInt32LE(0x02014b50);c.writeUInt32LE(b.length,20);c.writeUInt32LE(b.length,24);c.writeUInt16LE(n.length,28);c.writeUInt32LE(offset,42);
  local.push(h,n,b);central.push(c,n);offset+=h.length+n.length+b.length;
 }
 const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(local.length/3,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
 const bytes=Buffer.concat([...local,directory,end]);return bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
}
function harness(){
 const stores=new Map();let fail=false;const key=x=>typeof x==='string'?x:x.url;
 const caches={async open(name){if(!stores.has(name))stores.set(name,new Map());const map=stores.get(name);return {
  async match(k){return map.get(key(k))?.clone()},async put(k,v){if(fail&&name!=='ashfall-god-installed-v1'&&key(k).endsWith('game.js'))throw Error('QuotaExceededError');map.set(key(k),v.clone())},async delete(k){return map.delete(key(k))},async keys(){return [...map.keys()]}
 }},async delete(name){return stores.delete(name)}};
 const nodes=new Map();const document={querySelector(s){if(!nodes.has(s))nodes.set(s,{addEventListener(){}});return nodes.get(s)},querySelectorAll(){return []}};
 const context={document,window:{addEventListener(){}},caches,Response,TextDecoder,DataView,Uint8Array,Blob,crypto:{randomUUID},console};
 let code=readFileSync('public/admin-offline/launcher.js','utf8');code=code.slice(0,code.lastIndexOf('(async()=>{try{await prepareOfflineApp();'))+'globalThis.install=extractZip;globalThis.installedCache=installedCache;})();';
 vm.runInNewContext(code,context);
 return {context,caches,stores,fail(){fail=true}};
}
const prefix='/admin-offline/play/example/';
test('successful replacement publishes complete cache and removes old copy',async()=>{
 const h=harness();await (await h.caches.open('ashfall-god-game-example-v1')).put(prefix+'index.html',new Response('old'));
 await h.context.install(zip({'index.html':'new','game.js':'script'}),'example',()=>{});
 const cache=await h.context.installedCache('example');assert.equal(await (await cache.match(prefix+'index.html')).text(),'new');assert.equal(await (await cache.match(prefix+'game.js')).text(),'script');assert.equal(h.stores.has('ashfall-god-game-example-v1'),false);
});
test('storage failure during replacement preserves previous game and cleans staging',async()=>{
 const h=harness();await h.context.install(zip({'index.html':'old','game.js':'old script'}),'example',()=>{});const before=[...h.stores.keys()].sort();h.fail();
 await assert.rejects(h.context.install(zip({'index.html':'new','game.js':'new script'}),'example',()=>{}),/QuotaExceeded/);
 assert.equal(await (await (await h.context.installedCache('example')).match(prefix+'index.html')).text(),'old');assert.deepEqual([...h.stores.keys()].sort(),before);
});
test('invalid paths and missing entry point cannot replace installed game',async()=>{
 const h=harness();await h.context.install(zip({'index.html':'old'}),'example',()=>{});
 for(const files of [{'../index.html':'bad'},{'game.js':'no entry'}])await assert.rejects(h.context.install(zip(files),'example',()=>{}));
 assert.equal(await (await (await h.context.installedCache('example')).match(prefix+'index.html')).text(),'old');
});
