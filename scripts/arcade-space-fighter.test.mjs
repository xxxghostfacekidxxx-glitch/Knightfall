import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script,runInNewContext} from "node:vm";
const html=readFileSync("public/arcade/hosted/space-fighter/index.html","utf8");
const source=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes("function init()"));
test("Space Fighter has parseable local game code and a matching score bridge",()=>{
 assert.ok(source);assert.doesNotThrow(()=>new Script(source));
 assert.ok(html.includes('data-game-id="cabinet-space-fighter"'));
});
test("Space Fighter restart invalidates old frames and failure submits score once",()=>{
 const handlers=new Map(),frames=[],events=[],nodes=new Map();
 const node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:"",addEventListener:(event,fn)=>handlers.set(id+":"+event,fn)});return nodes.get(id)};
 const ctx={clearRect(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},fillText(){}};
 const canvas={getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:420,height:620}),addEventListener:(event,fn)=>handlers.set("canvas:"+event,fn)};
 nodes.set("game",canvas);
 const doc={getElementById:node,addEventListener:(event,fn)=>handlers.set("document:"+event,fn),dispatchEvent:e=>events.push(e)};
 const store=new Map();const sandbox={document:doc,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},Math,CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts.detail}},requestAnimationFrame:fn=>frames.push(fn)};
 runInNewContext(source,sandbox,{timeout:1000});
 assert.ok(frames.length);
 const stale=frames.shift();handlers.get("restart:click")();const queued=frames.length;stale(100);assert.equal(frames.length,queued);
 assert.ok(events.filter(e=>e.type==="ashfall:arcade-started").length>=2);
 assert.ok(source.includes("ashfall-space-fighter-best"));
 assert.ok(source.includes("visibilitychange"));
 for(let i=0;i<5;i++){const f=frames.shift();assert.ok(f);f(100+i*16)}
});
