import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext,Script} from "node:vm";
const source=readFileSync("public/arcade/hosted/ashfall-mini-games.js","utf8");
test("shared four-game engine parses",()=>assert.doesNotThrow(()=>new Script(source)));
for(const id of ["particle-clicker","cube-composer","skifree","ball-and-wall"]){
 test(id+" starts, animates, restarts and keeps a single animation loop",()=>{
  const html=readFileSync("public/arcade/hosted/"+id+"/index.html","utf8");
  assert.ok(html.includes("/arcade/hosted/ashfall-mini-games.js"));
  const elements=new Map(),listeners=new Map(),frames=[];
  const el=k=>{if(!elements.has(k))elements.set(k,{textContent:"",value:"",hidden:false,disabled:false,style:{},href:"",addEventListener:(event,fn)=>listeners.set(k+":"+event,fn)});return elements.get(k)};
  const ctx={fillRect(){},strokeRect(){},fillText(){},beginPath(){},arc(){},fill(){},stroke(){},moveTo(){},lineTo(){},roundRect(){},save(){},restore(){},translate(){}};
  const canvas={width:960,height:600,getContext:()=>ctx,addEventListener:(event,fn)=>listeners.set("canvas:"+event,fn),getBoundingClientRect:()=>({left:0,top:0,width:960,height:600})};
  elements.set("game",canvas);
  const doc={getElementById:el,addEventListener:(event,fn)=>listeners.set("document:"+event,fn),fullscreenElement:null,hidden:false};
  const store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
  const location={pathname:"/arcade/hosted/"+id+"/index.html",search:"",href:"https://ash-fall.com/arcade/hosted/"+id+"/index.html"};
  const window={addEventListener(){}};
  const sandbox={document:doc,window,location,URLSearchParams,localStorage,performance:{now:()=>0},requestAnimationFrame:fn=>frames.push(fn),Math,Number,Promise,Set,console};
  runInNewContext(source.replace("})();","globalThis.__miniTest={getState:()=>state};})();"),sandbox,{timeout:1500});
  assert.equal(typeof listeners.get("start:click"),"function");
  listeners.get("start:click")();
  assert.ok(frames.length>0);
  for(let i=0;i<4;i++){const frame=frames.shift();assert.ok(frame);frame((i+1)*16)}
  const stale=frames.shift();assert.ok(stale);
  listeners.get("start:click")();
  const queued=frames.length;
  stale(999);
  assert.equal(frames.length,queued,"stale animation frame must not reschedule after restart");
  assert.equal(elements.get("score").textContent,"0");
  if(id==="cube-composer"){
   sandbox.__miniTest.getState().level=9;
   listeners.get("start:click")();
   assert.equal(sandbox.__miniTest.getState().level,1,"new puzzle run must reset level");
  }
 });
}
