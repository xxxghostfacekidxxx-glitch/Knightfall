import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const root="public/arcade/hosted/";
const groups={
 "ashfall-original-trio.js":["whack-a-bug","stack-tower","balance-stack"],
 "ashfall-original-sports.js":["basketball","bowling","penalty-shootout"],
 "ashfall-original-driving.js":["car-race","two-cars","crossy-road"],
 "ashfall-original-matching.js":["bubble-pop","candy-crush"],
 "ashfall-original-action.js":["doodle-jump","survivor","alien-battle"]
};
function harness(file,id){
 const listeners=new Map(),frames=[],store=new Map();
 const node=name=>({textContent:"",tagName:"DIV",addEventListener(type,fn){listeners.set(name+":"+type,fn)}});
 const elements=new Map();
 const get=name=>{if(!elements.has(name))elements.set(name,node(name));return elements.get(name)};
 const ctx={fillRect(){},beginPath(){},arc(){},fill(){},fillText(){},stroke(){},strokeRect(){},roundRect(){},save(){},restore(){},translate(){},rotate(){},moveTo(){},lineTo(){},set fillStyle(v){},set font(v){},set textAlign(v){},set strokeStyle(v){},set lineWidth(v){}};
 const canvas={...node("canvas"),getContext(){return ctx},getBoundingClientRect(){return {left:0,top:0,width:640,height:file.includes("trio")?500:480}}};
 canvas.addEventListener=(type,fn)=>listeners.set("canvas:"+type,fn);
 const document={querySelector(){return canvas},getElementById:get,addEventListener(type,fn){listeners.set("document:"+type,fn)},hidden:false};
 const window={addEventListener(){},AshFallArcade:{recordScore(){}}};
 const sandbox={window,document,location:{pathname:"/arcade/hosted/"+id+"/index.html"},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},Math,Number,Set,Array,Map,performance:{now:()=>0},requestAnimationFrame:fn=>{frames.push(fn);return frames.length},cancelAnimationFrame(){},console};
 runInNewContext(readFileSync(root+file,"utf8"),sandbox,{filename:file,timeout:1000});
 return {listeners,frames,elements,canvas};
}
for(const [file,ids] of Object.entries(groups)){
 for(const id of ids)test(id+" boots, starts, renders frames and accepts input",()=>{
  const h=harness(file,id);
  assert.ok(h.listeners.has("restart:click"),"restart control must be wired");
  h.listeners.get("restart:click")();
  for(let i=0;i<5;i++){const f=h.frames.shift();assert.ok(f,"game should schedule a frame");f((i+1)*16)}
  h.listeners.get("canvas:pointerdown")({clientX:320,clientY:240});
  assert.ok(h.elements.get("score").textContent!=="","score element should be populated");
  assert.ok(h.elements.get("status").textContent!=="","status element should be populated");
 });
}
