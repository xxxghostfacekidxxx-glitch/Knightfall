import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script,runInNewContext} from "node:vm";
const source=readFileSync("public/arcade/hosted/ashfall-original-runner.js","utf8");
test("runner engine parses",()=>assert.doesNotThrow(()=>new Script(source)));
for(const id of ["slush-rush","rusty-sky"]){
 test(id+" restart cancels old frames and resets input",()=>{
  const nodes=new Map(),handlers=new Map(),frames=[],events=[];
  const node=k=>{if(!nodes.has(k))nodes.set(k,{textContent:"",addEventListener:(name,fn)=>handlers.set(k+":"+name,fn)});return nodes.get(k)};
  const ctx={fillRect(){},beginPath(){},arc(){},fill(){},fillText(){}};
  const canvas={getContext:()=>ctx,addEventListener:(name,fn)=>handlers.set("canvas:"+name,fn)};
  const document={querySelector:()=>canvas,getElementById:node,addEventListener:(name,fn)=>handlers.set("document:"+name,fn),dispatchEvent:e=>events.push(e)};
  const sandbox={document,location:{pathname:"/arcade/hosted/"+id+"/index.html"},localStorage:{getItem:()=>null,setItem(){}},Math,Set,Number,performance:{now:()=>0},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}},requestAnimationFrame:fn=>frames.push(fn)};
  const exposed=source.replace("})();","globalThis.__runner={setBoundary:()=>{world.y=420;world.invuln=0;},getLife:()=>world.life,getInvuln:()=>world.invuln};})();");
  runInNewContext(exposed,sandbox,{timeout:1000});
  handlers.get("restart:click")();
  const stale=frames.shift();
  handlers.get("restart:click")();
  const queued=frames.length;
  stale(100);
  assert.equal(frames.length,queued,"old frame must not reschedule");
  assert.equal(events.filter(e=>e.type==="ashfall:arcade-started").length,2);
  if(id==="rusty-sky"){
   sandbox.__runner.setBoundary();
   frames.shift()(16);
   assert.equal(sandbox.__runner.getLife(),2,"one boundary hit costs one life");
   assert.ok(sandbox.__runner.getInvuln()>0,"boundary hit grants recovery window");
   frames.shift()(32);
   assert.equal(sandbox.__runner.getLife(),2,"next frame cannot instantly drain another life");
  }
 });
}
