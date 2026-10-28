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
test("map has 10 by 8 grid and safe walkable rules",()=>{
 assert.match(js,/x<=10&&y>=1&&y<=8/);
 assert.match(js,/obstacles=new Set/);
 assert.match(js,/function render\(/);
 assert.match(css,/grid-template-columns:repeat\(10/);
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
 assert.match(js,/const keys=connected\?Object\.keys\(species\)\.slice\(0,8\):Object\.keys\(species\)/);
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
