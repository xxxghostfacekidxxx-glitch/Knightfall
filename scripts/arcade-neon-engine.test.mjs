import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script,runInNewContext} from "node:vm";
const source=readFileSync("public/arcade/hosted/ashfall-neon-engine.js","utf8");
test("neon engine parses",()=>assert.doesNotThrow(()=>new Script(source)));
for(const game of ["neon-drift","cinder-defense"]){
 test(game+" initializes, starts, moves, scores and restarts",()=>{
  const listeners=new Map(),els=new Map(),frames=[],events=[],store=new Map();
  const element=id=>{if(!els.has(id))els.set(id,{textContent:"",dataset:{},addEventListener:(name,fn)=>listeners.set(id+":"+name,fn),setPointerCapture(){}});return els.get(id)};
  const ctx={beginPath(){},arc(){},fill(){},fillRect(){},stroke(){},moveTo(){},lineTo(){},fillText(){},set fillStyle(x){},set strokeStyle(x){},set font(x){},set textAlign(x){}};
  const canvas=element("game");canvas.width=900;canvas.height=540;canvas.getContext=()=>ctx;canvas.getBoundingClientRect=()=>({left:0,top:0,width:900,height:540});
  const buttons=["ArrowUp","ArrowLeft","ArrowDown","ArrowRight"].map(key=>({dataset:{key},addEventListener:(name,fn)=>listeners.set(key+":"+name,fn),setPointerCapture(){}}));
  const doc={getElementById:element,querySelectorAll:()=>buttons,addEventListener:(name,fn)=>listeners.set("document:"+name,fn),dispatchEvent:e=>events.push(e)};
  const sandbox={document:doc,location:{search:"?game="+game},URLSearchParams,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},performance:{now:()=>0},requestAnimationFrame:fn=>frames.push(fn),CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}},window:{},Math,Set,Promise};
  runInNewContext(source,sandbox);
  assert.equal(element("title").textContent,game==="neon-drift"?"Neon Drift":"Cinder Defense");
  assert.equal(typeof listeners.get("ArrowLeft:pointerdown"),"function");
  listeners.get("start:click")();
  assert.equal(element("status").textContent,"Playing");
  assert.equal(frames.length,1);
  listeners.get("document:keydown")({key:"ArrowLeft",preventDefault(){}});
  frames.shift()(16);
  assert.ok(frames.length>=1);
  listeners.get("document:keydown")({key:"A",preventDefault(){}});
  doc.hidden=true;
  listeners.get("document:visibilitychange")();
  assert.match(element("status").textContent,/Paused/);
  doc.hidden=false;
  listeners.get("start:click")();
  assert.equal(element("score").textContent,"0");
  assert.equal(element("status").textContent,"Playing");
 });
}
