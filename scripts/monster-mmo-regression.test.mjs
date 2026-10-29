import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const load=async path=>readFile(new URL("../"+path,import.meta.url),"utf8");
test("battle commands have matching selectable panels",async()=>{
 const html=await load("public/monster-mmo.html");
 for(const tab of ["fight","party","bag"]){
  assert.match(html,new RegExp('data-battle-tab="'+tab+'"'));
  assert.match(html,new RegExp('data-battle-section="'+tab+'"'));
 }
 const js=await load("public/monster-mmo.js");
 assert.match(js,/querySelectorAll\("#battle-panel \[data-battle-tab\]"\)/);
 assert.match(js,/section\.hidden=section\.dataset\.battleSection!==selected/);
});
test("combat is a single viewport rather than a scrolling page",async()=>{
 const css=await load("public/monster-mmo.css");
 assert.match(css,/Battle viewport v4/);
 assert.match(css,/body:has\(#battle-panel:not\(\[hidden\]\)\)\{overflow:hidden/);
 assert.match(css,/#battle-panel:not\(\[hidden\]\)\{\s*position:fixed!important;inset:0!important/);
 assert.match(css,/orientation:landscape/);
});
test("pause menu holds nonessential UI",async()=>{
 const html=await load("public/monster-mmo.html");
 const js=await load("public/monster-mmo-pause-menu.js");
 for(const tab of ["creatures","bag","map","missions","bestiary"]){
  assert.match(html,new RegExp('data-pause-tab="'+tab+'"'));
 }
 assert.match(js,/pause-content/);
});
test("sprite atlas supports every species and both battle viewpoints",async()=>{
 const js=await load("public/monster-mmo-sprite-atlas.js");
 const ids=js.match(/const ids="([^"]+)"/)?.[1].split(" ");
 assert.equal(ids?.length,55);
 assert.match(js,/sprite\(ids\[n\],frame,true\)/);
 assert.match(js,/\(back\?4:0\)/);
});
test("quest step tracking and region survive save normalization",async()=>{
 const frontend=await load("public/monster-mmo.js");
 const backend=await load("backend/src/index.mmo-staging.js");
 assert.match(frontend,/typeof save\.routeQuestSteps!=="object"/);
 assert.match(backend,/const clean=\{region:validatedRegion/);
 assert.match(backend,/monsterRegions\[validatedRegion\]\.blocked\.has/);
});
