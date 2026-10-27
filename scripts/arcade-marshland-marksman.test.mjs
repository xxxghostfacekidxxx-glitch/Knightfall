import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script,runInNewContext} from "node:vm";
const html=readFileSync("public/arcade/hosted/marshland-marksman/index.html","utf8");
const source=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes("function target()"));
test("Marshland Marksman parses and uses first-party save API",()=>{
 assert.ok(source);assert.doesNotThrow(()=>new Script(source));
 assert.ok(html.includes('/arcade-save.js'));
});
test("Marshland Marksman restart invalidates old frames and preserves one active run",()=>{
 const nodes=new Map(),listeners=new Map(),frames=[],cancelled=[],events=[];
 const node=k=>{if(!nodes.has(k))nodes.set(k,{textContent:"",hidden:false,addEventListener:(type,fn)=>listeners.set(k+":"+type,fn)});return nodes.get(k)};
 const ctx={fillRect(){},beginPath(){},arc(){},ellipse(){},fill(){},moveTo(){},lineTo(){},stroke(){},save(){},translate(){},restore(){},fillText(){},createLinearGradient(){return{addColorStop(){}}}};
 node("game").getContext=()=>ctx;node("game").width=960;node("game").height=540;node("game").getBoundingClientRect=()=>({left:0,top:0,width:960,height:540});
 const document={getElementById:node,querySelector:()=>({requestFullscreen(){}}),addEventListener:(type,fn)=>listeners.set("document:"+type,fn),dispatchEvent:e=>events.push(e)};
 const sandbox={document,window:{},location:{pathname:"/arcade/hosted/marshland-marksman/index.html"},localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>0},Math,CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts.detail}},requestAnimationFrame:fn=>{frames.push(fn);return frames.length},cancelAnimationFrame:id=>cancelled.push(id)};
 runInNewContext(source,sandbox,{timeout:1000});
 listeners.get("start:click")();
 const stale=frames.shift();
 listeners.get("start:click")();
 const before=frames.length;
 stale(20);
 assert.equal(frames.length,before,"old run frame must not reschedule");
 assert.equal(events.filter(e=>e.type==="ashfall:arcade-started").length,2);
 assert.equal(node("score").textContent,"0");
 assert.ok(cancelled.length>=1);
});
