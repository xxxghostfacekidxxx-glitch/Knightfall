import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script,runInNewContext} from "node:vm";
const html=readFileSync("public/arcade/hosted/tether-tangle/index.html","utf8");
const source=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes("function init()"));
test("Tether Tangle exposes real score, not best stage, to account bridge",()=>{
 assert.ok(source);assert.doesNotThrow(()=>new Script(source));
 assert.ok(html.includes('id="score"'));
 assert.ok(html.includes('data-score-selector="#score"'));
 assert.ok(source.includes("ashfall:arcade-finished"));
 assert.ok(source.includes("ashfall:arcade-started"));
});
test("Tether Tangle restarts invalidate old physics frames and restore visible score",()=>{
 assert.ok(source.includes("if(token!==runToken||!running)return"));
 assert.ok(source.includes("runToken++"));
 assert.ok(source.includes("requestAnimationFrame(t=>loop(t,token))"));
 assert.ok(source.includes("$('score').textContent=score"));
});

test("Tether Tangle retry removes unbanked stars, stage win banks them and old loops cancel",()=>{
 const nodes=new Map(),events=[],frames=[];
 const ctx={clearRect(){},fillRect(){},beginPath(){},arc(){},fill(){},stroke(){},moveTo(){},lineTo(){},save(){},restore(){},translate(){},rotate(){},fillText(){},createLinearGradient(){return{addColorStop(){}}}};
 const canvas={width:960,height:520,getContext:()=>ctx,addEventListener(){},getBoundingClientRect:()=>({left:0,top:0,width:960,height:520})};
 nodes.set("game",canvas);
 const node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:"",hidden:false,onclick:null});return nodes.get(id)};
 const document={getElementById:node,dispatchEvent:e=>events.push(e)};
 const sandbox={document,window:{},Math,localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>0},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}},requestAnimationFrame:fn=>frames.push(fn)};
 const exposed=source.replace("draw()})();","draw();globalThis.__tether={setStars:(n)=>{score=n;collectedThis=n;},setStage:(total,earned)=>{score=total;collectedThis=earned;},win:()=>{won=true;},getScore:()=>score};})();");
 assert.notEqual(exposed,source);
 runInNewContext(exposed,sandbox,{timeout:1000});
 const stale=frames.shift();
 node("start").onclick();
 const count=frames.length;
 stale(16);
 assert.equal(frames.length,count,"old frame must not schedule another frame");
 sandbox.__tether.setStars(2);
 node("reset").onclick();
 assert.equal(sandbox.__tether.getScore(),0,"restarting a failed stage removes unbanked stars");
 sandbox.__tether.setStars(2);
 sandbox.__tether.win();
 node("next").onclick();
 assert.equal(sandbox.__tether.getScore(),2,"clearing a stage banks earned stars");
 sandbox.__tether.setStage(4,2);
 sandbox.__tether.win();
 node("reset").onclick();
 assert.equal(sandbox.__tether.getScore(),2,"Reset must not allow replaying a completed stage to farm stars");
 assert.ok(events.filter(e=>e.type==="ashfall:arcade-started").length>=3);
});
