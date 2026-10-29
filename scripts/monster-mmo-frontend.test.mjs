import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
const js=readFileSync("public/monster-mmo.js","utf8");
const html=readFileSync("public/monster-mmo.html","utf8");
const css=readFileSync("public/monster-mmo.css","utf8");
test("creature frontend parses as a module",()=>{
 const result=spawnSync(process.execPath,["--check","--input-type=module"],{input:js,encoding:"utf8"});
 assert.equal(result.status,0,result.stderr);
});
test("online and offline maps share the 16 by 12 world",()=>{
 assert.match(js,/x<=16&&y>=1&&y<=12/);
 assert.match(js,/const width=16,height=12/);
 assert.match(js,/obstacles=new Set/);
 assert.match(js,/function render\(/);
 assert.match(js,/map\.style\.gridTemplateColumns/);
});
test("mobile controls and gameplay are wired",()=>{
 for(const id of ["world","party","battle","trainer","connect","disconnect","rest","encounter","log"])assert.ok(html.includes('id="'+id+'"'),"Missing "+id);
 for(const action of ["attack","capture","flee"])assert.ok(html.includes('data-action="'+action+'"'));
 for(const dir of ["up","down","left","right"])assert.ok(html.includes('data-move="'+dir+'"'));
 assert.match(js,/async function move\(/);
 assert.match(js,/function offlineAction\(/);
});
test("cloud play uses server intents and protects offline state",()=>{
 assert.match(js,/expected_version:version/);
 assert.match(js,/type:"move",direction/);
 assert.match(js,/offlineSave=structuredClone\(save\)/);
 assert.match(js,/credentials:"include"/);
 assert.match(js,/new WebSocket\(wsUrl\)/);
});

test("journal and starter selection are wired to original species",()=>{
 for(const id of ["journal","quests","starter-select","reset-preview"])assert.ok(html.includes('id="'+id+'"'),"Missing "+id);
 for(const id of ["mossbit","embercub","driftfin"])assert.ok(html.includes('data-starter="'+id+'"'),"Missing starter "+id);
 for(const id of ["mossbit","embercub","driftfin","gloamlet","thornspit","zipfang","grubruckle","mournwing","squibblex","glorpbot","noodloid","blipmoth"])assert.ok(js.includes(id+":["),"Missing original species "+id);
 assert.match(js,/function persist\(/);
 assert.match(js,/offlineSeen=new Set\(seen\)/);
 assert.match(js,/seen\.add\(id\)/);
});

test("eight original chibi infernal creature portraits are generated without external art",()=>{
 assert.match(js,/const infernalLooks=/);
 assert.match(js,/function monsterPortrait\(/);
 assert.match(js,/document\.createElementNS\("http:\/\/www\.w3\.org\/2000\/svg","svg"\)/);
 assert.match(js,/monsterPortrait\(battle\.id,"large"\)/);
 assert.match(js,/monsterPortrait\(id,"tiny"\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.ok(html.includes("Infernal Bestiary"));
});

test("original alien invasion episodes and creature roster exist",()=>{
 for(const id of ["story-title","story-text","story-progress"])assert.ok(html.includes('id="'+id+'"'));
 for(const id of ["squibblex","glorpbot","noodloid","blipmoth"])assert.ok(js.includes(id+":["));
 assert.match(js,/const invasionChapters=/);
 assert.match(js,/function renderStory\(/);
 assert.match(js,/ALIEN INVASION!/);
 assert.match(js,/const zone=territory\(save\.x,save\.y\)\.type/);
});

test("canonical ending is a demon-alien treaty, not either faction winning",()=>{
 assert.match(js,/FINAL EPISODE · THE GREAT GALACTIC DIVORCE OF EARTH/);
 assert.match(js,/They divide Earth into alien and infernal territories/);
 assert.match(js,/Hell is welcomed into intergalactic society/);
 assert.match(js,/moderately intelligent livestock with excellent snack-making capabilities/);
 assert.match(js,/Treaty signed\. Earth partitioned\. Humanity reclassified/);
 assert.match(js,/Witness the Treaty of Two Extremely Bad Landlords/);
});

test("player is a ten-percent Appendix 404 dual-faction handler",()=>{
 assert.match(js,/const controllerLore=/);
 assert.match(js,/Exactly ten percent of humans developed an Appendix 404/);
 assert.match(js,/Aliens hear an executive override/);
 assert.match(js,/Demons hear an ancient summoning command/);
 for(const id of ["controller-title","controller-text","controller-note"])assert.ok(html.includes('id="'+id+'"'));
 assert.match(js,/Pair your Appendix 404 with an alien/);
});

test("broken galactic calendar replaces the real-world origin year",()=>{
 assert.ok(html.includes('id="absurd-date"'));
 assert.match(js,/Year 7½ of the 43rd Yesterday/);
 assert.match(js,/Tuesday 92 of Month -3/);
 assert.match(js,/function nonsenseDate\(steps=0\)/);
 assert.match(js,/absurdWeekdays/);
 assert.match(js,/absurdMonths/);
 assert.doesNotMatch(js,/In 1999, a galactic firmware update/);
});

test("offline galactic bureau contracts award one-time capture supplies",()=>{
 assert.ok(html.includes('id="bureau-contracts"'));
 assert.ok(html.includes('id="bureau-status"'));
 for(const id of ["microwave","pigeons","toaster","treaty"])assert.match(js,new RegExp('id:"'+id+'"'));
 assert.match(js,/save\.claimedContracts\.includes\(id\)/);
 assert.match(js,/save\.bag=\(save\.bag\|\|0\)\+contract\.reward/);
 assert.match(js,/if\(connected\)\{action\("contract",\{id\}\);return\}/);
 assert.match(js,/function render\(\)\{renderStory\(\);renderBureau\(\);/);
});

test("faction commander bosses are playable, uncatchable, and award rewards once",()=>{
 assert.ok(html.includes('id="faction-commanders"'));
 assert.ok(html.includes('id="commander-status"'));
 for(const id of ["squibblex-prime","ember-auditor","glorp-collector"])assert.match(js,new RegExp('id:"'+id+'"'));
 assert.match(js,/battle=\{\.\.\.make\(boss\.species,boss\.level\),bossId:id,name:boss\.name\}/);
 assert.match(js,/if\(battle\.bossId\)\{log\("Commanders are contractually uncatchable/);
 assert.match(js,/save\.defeatedCommanders\.includes\(id\)/);
 assert.match(js,/const commanderReward=battle\.bossId\?defeatCommander\(battle\.bossId\):""/);
});

test("faction world has three reward landmarks and location-specific encounters",()=>{
 assert.ok(html.includes('id="territory-status"'));
 for(const id of ["dish","tax","border"])assert.match(js,new RegExp('id:"'+id+'"'));
 assert.match(js,/function visitLandmark\(x,y\)/);
 assert.match(js,/save\.visitedLandmarks\.includes\(site\.id\)/);
 assert.match(js,/const width=16,height=12/);
 assert.match(js,/zone==="alien"\?Object\.keys\(species\)/);
 assert.match(css,/tile\.zone-alien/);
 assert.match(css,/tile\.zone-demon/);
});

test("settlement NPCs support proximity dialogue and one-time landmark quest rewards",()=>{
 assert.ok(html.includes('id="settlement-npcs"'));
 assert.ok(html.includes('id="settlement-status"'));
 for(const id of ["mox","vex","quibble"])assert.match(js,new RegExp('id:"'+id+'"'));
 assert.match(js,/function speakToNPC\(id\)/);
 assert.match(js,/Math\.abs\(npc\.x-save\.x\)\+Math\.abs\(npc\.y-save\.y\)>1/);
 assert.match(js,/save\.npcQuestsDone\.includes\(id\)/);
 assert.match(js,/save\.bag=\(save\.bag\|\|0\)\+npc\.reward/);
 assert.match(js,/renderSettlements\(\)/);
});

test("twenty original monsters include six evolution lines",()=>{
 for(const id of ["ashhorn","mossreaper","cryptfin","voltmaw","squibmarshal","glorpcannon","hexpup","starjelly"])assert.match(js,new RegExp(id+':\\['));
 assert.match(js,/const evolutions=/);
 assert.match(js,/function evolveCreature\(creature\)/);
 assert.match(js,/function awardExperience\(creature,amount\)/);
 assert.match(js,/evolveCreature\(creature\)/);
});
test("offline battles support charged specials and guarding without changing staging actions",()=>{
 assert.ok(html.includes('data-action="special"'));
 assert.ok(html.includes('data-action="guard"'));
 assert.match(js,/function battleStrike\(attacker,defender,special=false\)/);
 assert.match(js,/if\(name==="attack"\|\|name==="special"\|\|name==="guard"\)/);
 assert.match(js,/lead\.energy-=2/);
 assert.match(js,/guarding\?\.35:1/);
 assert.doesNotMatch(js,/connected&&\["special","guard"\]\.includes\(b\.dataset\.action\)/);
});

test("offline battle adds original move names, status damage and accessible visual effects",()=>{
 assert.ok(html.includes('id="battle-effect"'));
 assert.match(js,/const speciesMoves=/);
 assert.match(js,/function inflictStatus\(attacker,defender\)/);
 assert.match(js,/function statusTick\(target\)/);
 assert.match(js,/function showBattleEffect\(kind,message\)/);
 assert.match(js,/if\(evolutionMessage\.includes\("EVOLVED"\)\)showBattleEffect/);
 assert.match(js,/p\.status=null;p\.energy=0/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});

test("online battle actions render server-confirmed effects and allow creature switching",()=>{
 assert.match(js,/btn\.textContent=battle\?"Switch":"Lead"/);
 assert.match(js,/action\("switch",\{index:i\}\)/);
 assert.match(js,/if\(name==="switch"\)/);
 assert.match(js,/if\(data\.message\?\.includes\("evolved into"\)\)showBattleEffect/);
 assert.doesNotMatch(js,/connected&&\["special","guard"\]\.includes\(b\.dataset\.action\)/);
});

test("online map, missions and bosses are enabled in the shared world",()=>{
 assert.match(js,/if\(connected\)\{action\("npc",\{id\}\);return\}/);
 assert.match(js,/if\(connected\)\{action\("commander",\{id\}\);return\}/);
 assert.match(js,/save\.visitedLandmarks=data\.player\.visitedLandmarks/);
 assert.match(js,/const width=16,height=12/);
});
