import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext,Script} from "node:vm";
const root="public/arcade/hosted/cinder-lander/";
const source=readFileSync(root+"game.js","utf8");
test("Cinder Lander parses and is wired into the hosted arcade",()=>{
 assert.doesNotThrow(()=>new Script(source));
 const page=readFileSync(root+"index.html","utf8");
 for(const id of ["lander-field","restart","score","best","fuel","velocity","altitude","level","left","right","thrust","status"])assert.ok(page.includes('id="'+id+'"'));
 assert.ok(page.includes('data-game-id="cabinet-cinder-lander"'));
});
test("Cinder Lander starts, advances flight physics, and accepts touch thrust",()=>{
 const handlers=new Map(),frames=[],els=new Map(),storage=new Map();
 const element=id=>{if(!els.has(id))els.set(id,{textContent:"",addEventListener:(type,fn)=>handlers.set(id+":"+type,fn),setPointerCapture(){}});return els.get(id)};
 const ctx={fillRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},arc(){},save(){},restore(){},translate(){},rotate(){},fillText(){},createLinearGradient(){return {addColorStop(){}}}};
 const canvas={getContext:()=>ctx};
 const doc={querySelector:()=>canvas,getElementById:element,addEventListener:(type,fn)=>handlers.set("document:"+type,fn),dispatchEvent(){}};
 const sandbox={document:doc,window:{},location:{pathname:"/arcade/hosted/cinder-lander/index.html"},Math,Set,Number,CustomEvent:class{},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},performance:{now:()=>0},requestAnimationFrame:fn=>frames.push(fn)};
 runInNewContext(source,sandbox,{timeout:1000});
 assert.ok(handlers.has("restart:click"));
 handlers.get("restart:click")();
 handlers.get("thrust:pointerdown")({preventDefault(){},pointerId:1});
 for(let i=0;i<12;i++){const f=frames.shift();assert.ok(f,"flight must schedule frames");f((i+1)*16)}
 assert.ok(Number(els.get("fuel").textContent)<100,"thrust should consume fuel");
 assert.ok(Number(els.get("altitude").textContent)>=0);
});
