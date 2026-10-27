import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script,runInNewContext} from "node:vm";
const source=readFileSync("public/arcade/hosted/ashfall-original-runner.js","utf8");
test("original runner engine parses",()=>assert.doesNotThrow(()=>new Script(source)));
for(const id of ["slush-rush","rusty-sky"])test(id+" boots, accepts input, and animates",()=>{
 const html=readFileSync("public/arcade/hosted/"+id+"/index.html","utf8");
 assert.ok(html.includes('data-game-id="cabinet-'+id+'"'));
 assert.ok(html.includes("ashfall-original-runner.js"));
 const handlers=new Map(),frames=[],elements=new Map();
 const el=k=>{if(!elements.has(k))elements.set(k,{textContent:"",addEventListener:(ev,fn)=>handlers.set(k+":"+ev,fn)});return elements.get(k)};
 const canvas={getContext:()=>({fillRect(){},beginPath(){},arc(){},fill(){},fillText(){}}),addEventListener:(ev,fn)=>handlers.set("canvas:"+ev,fn),getBoundingClientRect:()=>({left:0,top:0,width:640,height:480})};
 const document={querySelector:()=>canvas,getElementById:el,addEventListener:(ev,fn)=>handlers.set("document:"+ev,fn),dispatchEvent(){}};
 runInNewContext(source,{document,window:{},location:{pathname:"/arcade/hosted/"+id+"/index.html"},Math,Number,Set,CustomEvent:class{},localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>0},requestAnimationFrame:fn=>frames.push(fn)},{timeout:1000});
 handlers.get("restart:click")();
 for(let i=0;i<5;i++){const fn=frames.shift();assert.ok(fn);fn((i+1)*16)}
 handlers.get("canvas:pointerdown")({preventDefault(){}});
 assert.ok(elements.get("score").textContent!=="");
});
