import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script,runInNewContext} from "node:vm";
for(const id of ["cinder-chess","ashen-dominion"]){
 const html=readFileSync("public/arcade/hosted/"+id+"/index.html","utf8");
 const source=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>id==="cinder-chess"?s.includes("function movesFor("):s.includes("function endTurn()"));
 test(id+" initializes, resets and emits match start",()=>{
  assert.doesNotThrow(()=>new Script(source));
  const nodes=new Map(),events=[],timers=[];
  const node=k=>{if(!nodes.has(k))nodes.set(k,{textContent:"",innerHTML:"",disabled:false,onclick:null,addEventListener(){},append(){},classList:{add(){}}});return nodes.get(k)};
  node("map").getContext=()=>({clearRect(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},arc(){},fillText(){}});
  const document={getElementById:node,createElement:()=>({classList:{add(){}},setAttribute(){},addEventListener(){}}),dispatchEvent:e=>events.push(e)};
  const sandbox={document,Math,localStorage:{getItem:()=>null,setItem(){}},CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts.detail}},setTimeout:fn=>{timers.push(fn);return timers.length},clearTimeout(){}};
  runInNewContext(source,sandbox,{timeout:1000});
  assert.equal(events.filter(e=>e.type==="ashfall:arcade-started").length,1);
  node(id==="cinder-chess"?"new":"reset").onclick();
  assert.equal(events.filter(e=>e.type==="ashfall:arcade-started").length,2);
 });
}
test("chess reset invalidates queued computer moves",()=>{
 const html=readFileSync("public/arcade/hosted/cinder-chess/index.html","utf8");
 assert.ok(html.includes("if(token===gameToken)aiMove()"));
 assert.ok(html.includes("clearTimeout(aiTimer)"));
});
