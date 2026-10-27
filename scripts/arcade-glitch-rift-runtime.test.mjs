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
  const sandbox={document,window:{},localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>0},Math,CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts.detail}},requestAnimationFrame:fn=>frames.push(fn)};
  runInNewContext(source,sandbox,{timeout:1000});
  el("start").onclick();
  assert.ok(frames.length>0);
  const stale=frames.shift();
  if(id==="glitch-munch")el("start").onclick();
  else {assert.equal(events.filter(e=>e.type==="ashfall:arcade-started").length,1);assert.ok(source.includes("if(running)return"));}
  const before=frames.length;
  if(id==="glitch-munch"){stale(100);assert.equal(frames.length,before);}
  assert.equal(events.filter(e=>e.type==="ashfall:arcade-started").length,id==="glitch-munch"?2:1);
 });
}
