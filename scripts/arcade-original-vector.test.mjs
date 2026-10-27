import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script,runInNewContext} from "node:vm";
const source=readFileSync("public/arcade/hosted/ashfall-original-vector.js","utf8");
test("vector shooter engine parses",()=>assert.doesNotThrow(()=>new Script(source)));
for(const id of ["neon-vector","prism-panic"])test(id+" boots, runs, restarts without duplicate loops",()=>{
 const page=readFileSync("public/arcade/hosted/"+id+"/index.html","utf8");
 assert.ok(page.includes('data-game-id="cabinet-'+id+'"'));
 assert.ok(page.includes("ashfall-original-vector.js"));
 const listeners=new Map(),frames=[],nodes=new Map();
 const node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:"",addEventListener:(name,fn)=>listeners.set(id+":"+name,fn)});return nodes.get(id)};
 const ctx={fillRect(){},beginPath(){},arc(){},fill(){},fillText(){},moveTo(){},lineTo(){},closePath(){},save(){},restore(){},translate(){},stroke(){}};
 const canvas={getContext:()=>ctx,addEventListener:(name,fn)=>listeners.set("canvas:"+name,fn),getBoundingClientRect:()=>({left:0,top:0,width:640,height:480})};
 const doc={querySelector:()=>canvas,getElementById:node,addEventListener:(name,fn)=>listeners.set("document:"+name,fn),dispatchEvent(){}};
 runInNewContext(source,{document:doc,location:{pathname:"/arcade/hosted/"+id+"/index.html"},Math,Number,Set,CustomEvent:class{},localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>0},requestAnimationFrame:fn=>frames.push(fn)},{timeout:1000});
 listeners.get("restart:click")();
 for(let i=0;i<6;i++){const frame=frames.shift();assert.ok(frame);frame((i+1)*16)}
 const stale=frames.shift();listeners.get("restart:click")();const count=frames.length;stale(1000);assert.equal(frames.length,count);
 listeners.get("canvas:pointerdown")({clientX:320,clientY:240});
 assert.equal(nodes.get("score").textContent,"0");
});
