import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script,runInNewContext} from "node:vm";
for(const id of ["rooftop-riot","colossus-clash"]){
 const html=readFileSync("public/arcade/hosted/"+id+"/index.html","utf8");
 const source=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes("function start()"));
 test(id+" parses and cancels stale animation frames",()=>{
  assert.ok(source);assert.doesNotThrow(()=>new Script(source));
  const nodes=new Map(),frames=[],events=[],listeners=new Map();
  const node=k=>{if(!nodes.has(k))nodes.set(k,{textContent:"",hidden:false,style:{},addEventListener:(name,fn)=>listeners.set(k+":"+name,fn)});return nodes.get(k)};
  const ctx={clearRect(){},fillRect(){},strokeRect(){},beginPath(){},arc(){},fill(){},stroke(){},moveTo(){},lineTo(){},closePath(){},save(){},restore(){},translate(){},createLinearGradient(){return{addColorStop(){}}}};
  node("game").getContext=()=>ctx;
  const document={getElementById:node,querySelector:()=>null,addEventListener:(name,fn)=>listeners.set("document:"+name,fn),dispatchEvent:e=>events.push(e)};
  const sandbox={document,window:{},localStorage:{getItem:()=>null,setItem(){}},location:{href:"https://ash-fall.com",pathname:"/arcade"},performance:{now:()=>0},Math,CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts.detail}},requestAnimationFrame:fn=>frames.push(fn)};
  runInNewContext(source,sandbox,{timeout:1000});
  node("start").onclick();
  const old=frames.shift();
  node("start").onclick();
  const pending=frames.length;
  old(16);
  assert.equal(frames.length,pending,"old loop must not reschedule after restart");
  assert.equal(events.filter(e=>e.type==="ashfall:arcade-started").length,2);
  if(id==="rooftop-riot"){
   assert.ok(html.includes('data-score-selector="#shards"'),"leaderboard must read collected shards");
   assert.ok(source.includes("ashfall:arcade-finished"));
  }
 });
}
