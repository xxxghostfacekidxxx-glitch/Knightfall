import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script,runInNewContext} from "node:vm";
const root="public/arcade/hosted/";
const js=readFileSync(root+"ashfall-original-driving.js","utf8");
test("driving engine parses",()=>assert.doesNotThrow(()=>new Script(js)));
for(const id of ["car-race","two-cars","crossy-road"]){
 test(id+" has new game and account score bridge",()=>{
  const page=readFileSync(root+id+"/index.html","utf8");
  assert.ok(page.includes("ashfall-original-driving.js"));
  assert.ok(page.includes('data-game-id="cabinet-'+id+'"'));
  assert.ok(page.includes('id="score"'));
 });
}
test("all three road mechanics exist",()=>{
 for(const id of ["car-race","two-cars","crossy-road"])assert.ok(js.includes(id));
 assert.ok(js.includes("steps>=30"));
 assert.ok(js.includes("localStorage.setItem"));
});
test("Ash Crossing awards points only after crossing five lanes",()=>{
 const handlers=new Map(),frames=[],nodes=new Map();
 const node=k=>{if(!nodes.has(k))nodes.set(k,{textContent:"",addEventListener:(ev,fn)=>handlers.set(k+":"+ev,fn)});return nodes.get(k)};
 const ctx={fillRect(){},fillText(){}};
 const canvas={getContext:()=>ctx,addEventListener:(ev,fn)=>handlers.set("canvas:"+ev),getBoundingClientRect:()=>({left:0,top:0,width:640,height:500})};
 const document={querySelector:()=>canvas,getElementById:node,addEventListener:(ev,fn)=>handlers.set("document:"+ev),dispatchEvent(){}};
 const randomMath=Object.create(Math);randomMath.random=()=>.5;
 runInNewContext(js,{document,location:{pathname:"/arcade/hosted/crossy-road/index.html"},Math:randomMath,Number,CustomEvent:class{},localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>0},requestAnimationFrame:fn=>frames.push(fn)},{timeout:1000});
 handlers.get("restart:click")();
 const key=handlers.get("document:keydown");
 key({key:"ArrowUp"});
 assert.equal(nodes.get("score").textContent,"0","one safe step is not a complete crossing");
 for(let i=0;i<10;i++){const f=frames.shift();assert.ok(f);f((i+1)*16)}
 key({key:"ArrowUp"});
 assert.equal(nodes.get("score").textContent,"0","reaching only the second lane must not grant a crossing bonus");
});
