import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const sw=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');

function harness({offline=false}={}){
  const events=new Map(),requests=[],lookups=[];
  class TestRequest{
    constructor(input,options={}){
      this.url=typeof input==='string'?input:input.url;
      this.method=input.method||'GET';
      this.mode=input.mode||'cors';
      this.destination=input.destination||'';
      this.headers=input.headers||{has:()=>false};
      this.cache=options.cache||input.cache||'default';
    }
  }
  const caches={
    match:async(request,options)=>{
      const url=typeof request==='string'?request:request.url;
      lookups.push({url,options});
      if(url.includes('/arcade/hosted/hex-and-whisk/'))return {source:'offline-kitchen'};
      return undefined;
    }
  };
  const self={location:{origin:'https://ash-fall.com'},addEventListener:(name,fn)=>events.set(name,fn)};
  const fetch=async request=>{
    requests.push({url:request.url,cache:request.cache});
    if(offline)throw Error('Network unavailable');
    return {ok:true,source:'network'};
  };
  vm.runInNewContext(sw,{self,caches,fetch,Request:TestRequest,URL,console,Response},{timeout:1000});
  async function dispatch(path,{destination='script',mode='cors'}={}){
    const request=new TestRequest({url:'https://ash-fall.com'+path,method:'GET',mode,destination});
    let response;
    events.get('fetch')({request,respondWith(value){response=value;}});
    return response===undefined?null:await response;
  }
  return {requests,lookups,dispatch};
}

test('PWA revalidates hosted JavaScript modules and CSS without stale HTTP cache',async()=>{
  const h=harness();
  assert.equal((await h.dispatch('/arcade/hosted/imp-inferno/cabinet.mjs?v=14')).source,'network');
  assert.equal((await h.dispatch('/arcade/hosted/hex-and-whisk/game.css',{destination:'style'})).source,'network');
  assert.deepEqual(h.requests.map(r=>r.cache),['no-store','no-store']);
});
test('large artwork and unrelated scripts keep their ordinary cache behavior',async()=>{
  const h=harness();
  assert.equal(await h.dispatch('/arcade/hosted/imp-inferno/furnace.webp',{destination:'image'}),null);
  assert.equal(await h.dispatch('/unrelated.js'),null);
  assert.equal(h.requests.length,0);
});
test('offline merge kitchen keeps its previously cached game code',async()=>{
  const h=harness({offline:true});
  assert.equal((await h.dispatch('/arcade/hosted/hex-and-whisk/engine.mjs?v=2')).source,'offline-kitchen');
  assert.equal(h.requests[0].cache,'no-store');
  assert.equal(h.lookups[0].options.ignoreSearch,true);
});
test('hosted game pages still revalidate HTML and use kitchen offline fallback',async()=>{
  const h=harness();
  assert.equal((await h.dispatch('/arcade/hosted/ash-sudoku/index.html',{destination:'document',mode:'navigate'})).source,'network');
  assert.equal(h.requests[0].cache,'no-store');
  const offline=harness({offline:true});
  assert.equal((await offline.dispatch('/arcade/hosted/hex-and-whisk/index.html',{destination:'document',mode:'navigate'})).source,'offline-kitchen');
});
