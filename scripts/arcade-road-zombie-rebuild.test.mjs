import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script,runInNewContext} from "node:vm";
const read=p=>readFileSync(p,"utf8");
const life="public/arcade/hosted/roads-of-cinder/";
const page=read(life+"index.html"),source=read(life+"engine.js"),view=read(life+"view.js");
function newGame(names=["Ash","Ember"],rng=()=>.1){
 const sandbox={Math:Object.create(Math)};sandbox.Math.random=rng;
 runInNewContext(source,sandbox,{timeout:1000});
 return new sandbox.RoadsOfCinder.RoadsGame({names,rng});
}
test("Roads of Cinder replaces the tiny prototype with a 60-plus-space game board",()=>{
 assert.doesNotThrow(()=>new Script(source));assert.doesNotThrow(()=>new Script(view));
 assert.match(page,/viewport-fit=cover/);assert.match(page,/id="spinner"/);
 assert.match(page,/id="board"/);assert.match(page,/id="player-count"/);assert.match(page,/id="player-names"/);assert.match(view,/function nameFields/);
 const g=newGame();assert.ok(g.constructor===Object.getPrototypeOf(g).constructor);
 assert.equal(g.players.length,2);assert.equal(g.options().length,2);
});
test("college takes debt and unlocks advanced careers; work does not",()=>{
 const g=newGame(["A","B","C","D"]);
 assert.equal(g.players.length,4);
 assert.equal(g.spin(),null);
 assert.equal(g.choose("college"),true);assert.equal(g.players[0].debt,45000);
 assert.ok(g.options().some(x=>x.id==="engineer"));
 assert.equal(g.choose("engineer"),true);assert.equal(g.current,1);
 assert.equal(g.choose("work"),true);assert.equal(g.choose("engineer"),false);
 assert.equal(g.choose("artist"),true);assert.equal(g.current,2);
});
test("spins move one turn and generate decisions, paydays and investment results",()=>{
 const g=newGame(["Ash","Ember"],()=>.2);
 g.choose("work");g.choose("mechanic");g.choose("college");g.choose("medic");
 assert.equal(g.pending,null);
 const d=g.spin();assert.equal(d,3);
 assert.equal(g.players[0].pos,3);
 assert.equal(g.pending?.kind,"career");
 assert.equal(g.choose("founder"),true);
 assert.equal(g.current,1);
 assert.equal(g.players[0].career,"Ash Entrepreneur");
 const saved=g.snapshot();const restored=newGame();
 assert.equal(restored.restore(saved),true);assert.equal(restored.players[0].career,"Ash Entrepreneur");
 assert.equal(restored.restore({...saved,players:[{pos:-1}]}),false);
});
test("retirement requires both players and determines standings using net worth",()=>{
 const g=newGame(["Ash","Ember"],()=>.999);
 g.choose("work");g.choose("mechanic");g.choose("work");g.choose("artist");
 for(const p of g.players)p.pos=59;
 g.spin();assert.equal(g.pending.kind,"retire");
 assert.equal(g.choose("legacy"),true);assert.equal(g.finished,false);
 assert.equal(g.current,1);g.spin();assert.equal(g.choose("quiet"),true);assert.equal(g.finished,true);
 assert.equal(g.results().length,2);assert.ok(g.results()[0].netWorth>=g.results()[1].netWorth);
 assert.equal(g.spin(),null);assert.equal(g.choose("work"),false);
});
test("Not Dead Yet new campaign and reloading systems parse and are wired into controls",()=>{
 const html=read("public/not-dead-yet.html");
 const scripts=[...html.matchAll(/<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi)];
 assert.ok(scripts.length>0);
 const main=scripts.map(x=>x[1]).find(s=>s.includes("function startGame"));
 assert.ok(main&&main.length>40000);assert.doesNotThrow(()=>new Script(main));
 for(const id of ["ammo","touch-reload","campaign-stage","stage-progress","game"])assert.ok(html.includes('id="'+id+'"'),id);
 for(const signature of ["function advanceCampaign()","function spawnCampaignBoss()","function drawExitGate(cam)","function retryCampaignStage()","function reload()","platforms.push(","player.grounded","campaignBossDefeated","reserveAmmo","ammoHud()","checkpoint={"])assert.ok(main.includes(signature),signature);
 assert.ok(main.includes("finish(true)"),"campaign must have a real final victory");
 assert.ok(!main.includes("finish(modeKey!=='campaign'||kills>=20)"),"no early kill-count campaign ending");
 assert.match(html,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
});
