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


test("Not Dead Yet 1.0 adds melee combat through the same kill reward path as bullets",()=>{
 const html=read("public/not-dead-yet.html");
 const main=[...html.matchAll(/<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes("function startGame"));
 assert.doesNotThrow(()=>new Script(main));
 assert.match(main,/function melee\(\)/);
 assert.match(main,/function finishZombie\(z\)/);
 assert.match(main,/if\(z\.hp<=0\)finishZombie\(z\)/);
 assert.match(main,/meleeCooldown=\.9/);
 assert.match(main,/z\.hp-=z\.type==='boss'\?2:3/);
 assert.match(main,/meleeFlash>0/);
 assert.match(main,/function barrelBlast\(prop\)/);
 assert.match(main,/if\(p\.type==='barrel'\)barrelBlast\(p\)/);
 assert.match(main,/if\(z\.hp<=0\)finishZombie\(z\)/);
 assert.match(main,/if\(k==='e'&&!e\.repeat\)melee\(\)/);
 assert.match(main,/\$\('touch-melee'\)\.addEventListener/);
 assert.match(html,/id="touch-melee"/);
});
test("Not Dead Yet movement repairs preserve character dash stats and forgiving jumps",()=>{
 const html=read("public/not-dead-yet.html");
 const main=[...html.matchAll(/<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes("function startGame"));
 assert.match(main,/jumpBufferTimer=\.14/);
 assert.match(main,/coyoteTimer>0/);
 assert.match(main,/if\(player\.grounded&&jumpBufferTimer>0\)jump\(\)/);
 assert.match(main,/survivor'\)\.value==='dredge'\?3\.55/);
 assert.match(main,/survivor'\)\.value==='guttermaw'\?3\.35/);
 assert.match(main,/meleeCooldown=0;meleeFlash=0;coyoteTimer=0;jumpBufferTimer=0/);
 assert.match(main,/meleeCooldown=0;meleeFlash=0;coyoteTimer=\.12;jumpBufferTimer=0/);
});
test("Not Dead Yet tactical indicators and collapsible progression panels retain every action",()=>{
 const html=read("public/not-dead-yet.html"),css=read("public/not-dead-yet-overhaul.css");
 for(const id of ["vitality-bar","magazine-bar","dash-bar","melee-bar","combat-objective",
  "touch-melee","difficulty","buy-upgrade","buy-barrel","buy-guttermaw","buy-dredge","buy-health",
  "cloud-load","cloud-save","achievement-list","run-leaderboard","resume-checkpoint"]){
  const count=[...html.matchAll(new RegExp('id="'+id+'"','g'))].length;
  assert.equal(count,1,"missing or duplicated "+id);
 }
 assert.equal((html.match(/class="zombie-service-panel"/g)||[]).length,4);
 assert.match(html,/not-dead-yet-overhaul\.css\?v=20261103-combat-rebuild1/);
 assert.match(css,/\.combat-telemetry/);
 assert.match(css,/\.zombie-lobby/);
 assert.match(css,/#game-stage:is\(:fullscreen,\.immersive-fallback\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});

test("Nightmare threats scale actual health, spawn rates, kills and account score metadata",()=>{
 const html=read("public/not-dead-yet.html");
 const main=[...html.matchAll(/<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes("function startGame"));
 assert.match(main,/const difficulties=\{/);
 assert.match(main,/enemyHealth:1\.65/);
 assert.match(main,/difficulty\.enemyHealth/);
 assert.match(main,/difficulty\.health/);
 assert.match(main,/difficulty\.spawn/);
 assert.match(main,/difficulty\.score/);
 assert.match(main,/difficulty:difficultyKey,survived/);
 assert.match(main,/function pollGamepad\(\)/);
 assert.match(main,/edge\('melee',pressed\(3\),melee\)/);
 assert.match(html,/value="nightmare"/);
});
