import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script,runInNewContext} from "node:vm";
for(const id of ["glitch-munch","rift-wardens"]){
 const html=readFileSync("public/arcade/hosted/"+id+"/index.html","utf8");
 const source=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes("function start()"));
 test(id+" parses and uses the matching local score bridge",()=>{
  assert.ok(source);assert.doesNotThrow(()=>new Script(source));
  assert.ok(html.includes('data-game-id="cabinet-'+id+'"'));
  assert.ok(source.includes("ashfall:arcade-started"));
  assert.ok(source.includes("ashfall:arcade-finished"));
 });
 test(id+" invalidates stale frames after restart",()=>{
  const nodes=new Map(),handlers=new Map(),frames=[],events=[];
  const el=k=>{if(!nodes.has(k))nodes.set(k,{textContent:"",hidden:false,onclick:null,addEventListener:(type,fn)=>handlers.set(k+":"+type,fn)});return nodes.get(k)};
  const ctx={fillRect(){},strokeRect(){},clearRect(){},beginPath(){},arc(){},fill(){},stroke(){},moveTo(){},lineTo(){},closePath(){},setLineDash(){}};
  el("game").getContext=()=>ctx;el("game").width=960;el("game").height=560;
  const document={getElementById:el,querySelectorAll:()=>[],addEventListener:(type,fn)=>handlers.set("document:"+type,fn),dispatchEvent:e=>events.push(e)};
  const seededMath=Object.create(Math);seededMath.random=()=>0.5;
  const sandbox={document,window:{},Image:class{constructor(){this.complete=false;this.naturalWidth=0}set src(v){this._src=v}},localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>0},Math:seededMath,CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts.detail}},requestAnimationFrame:fn=>frames.push(fn)};
  const instrumented=id==="glitch-munch"?source.replace("hud()})();","hud();globalThis.__arcadeProbe={getLives:()=>lives,setEnemies:v=>{enemies=v},setPlayer:v=>{player=v},hit:stepEnemies};})();"):source;
  runInNewContext(instrumented,sandbox,{timeout:1000});
  el("start").onclick();
  assert.ok(frames.length>0);
  const stale=frames.shift();
  if(id==="glitch-munch")el("start").onclick();
  else {assert.equal(events.filter(e=>e.type==="ashfall:arcade-started").length,1);assert.ok(source.includes("if(running)return"));}
  const before=frames.length;
  if(id==="glitch-munch"){stale(100);assert.equal(frames.length,before);}
  assert.equal(events.filter(e=>e.type==="ashfall:arcade-started").length,id==="glitch-munch"?2:1);
  if(id==="glitch-munch"){
   sandbox.__arcadeProbe.setPlayer({x:1,y:1});
   sandbox.__arcadeProbe.setEnemies([{x:1,y:2,color:"#fff"},{x:2,y:1,color:"#fff"}]);
   const beforeLives=sandbox.__arcadeProbe.getLives();
   sandbox.__arcadeProbe.hit();
   assert.equal(sandbox.__arcadeProbe.getLives(),beforeLives-1,"multiple enemies cannot drain more than one life during recovery");
  }

 });
}
