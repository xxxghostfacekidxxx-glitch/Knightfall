import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script,runInNewContext} from "node:vm";
const html=readFileSync("public/arcade/hosted/particle-panic/index.html","utf8");
const source=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes("function save("));
test("Particle Panic parses and has local account bridge",()=>{
 assert.ok(source);assert.doesNotThrow(()=>new Script(source));
 assert.ok(html.includes('data-game-id="cabinet-particle-panic"'));
});
test("Particle Panic saves progress automatically and on page hide",()=>{
 const nodes=new Map(),handlers=new Map(),intervals=[],saved=new Map(),events=[];
 const node=k=>{if(!nodes.has(k))nodes.set(k,{textContent:"",innerHTML:"",append(){},addEventListener:(type,fn)=>handlers.set(k+":"+type,fn)});return nodes.get(k)};
 const canvas={getContext:()=>({clearRect(){},beginPath(){},arc(){},fill(){}})};
 nodes.set("particles",canvas);
 const document={getElementById:node,createElement:()=>({append(){},addEventListener(){}}),addEventListener:(type,fn)=>handlers.set("document:"+type,fn),dispatchEvent:e=>events.push(e),hidden:false};
 const window={addEventListener:(type,fn)=>handlers.set("window:"+type,fn)};
 const sandbox={document,window,Math,Date,CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts.detail}},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},setInterval:(fn,ms)=>intervals.push({fn,ms}),requestAnimationFrame(){}};
 runInNewContext(source,sandbox,{timeout:1000});
 assert.ok(intervals.some(x=>x.ms===15000));
 intervals.find(x=>x.ms===15000).fn();
 assert.ok(saved.has("particle-panic-save-v1"));
 document.hidden=true;
 handlers.get("document:visibilitychange")();
 handlers.get("window:pagehide")();
 assert.equal(events.filter(e=>e.type==="ashfall:arcade-started").length,1);
});
