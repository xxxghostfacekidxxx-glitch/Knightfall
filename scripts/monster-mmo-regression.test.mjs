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
 const pause=await load("public/monster-mmo-pause-menu.js");
 const game=await load("public/monster-mmo.js");
 assert.match(pause,/battleTabs\.forEach\(b=>b\.addEventListener/);
 assert.match(pause,/section\.hidden=section\.dataset\.battleSection!==name/);
 assert.doesNotMatch(game,/querySelectorAll\("#battle-panel \[data-battle-tab\]"\)/);
});
test("combat is a single viewport rather than a scrolling page",async()=>{
 const css=await load("public/monster-mmo.css");
 assert.match(css,/Battle viewport v4/);
 assert.match(css,/body:has\(#battle-panel:not\(\[hidden\]\)\)\{overflow:hidden/);
 assert.match(css,/#battle-panel:not\(\[hidden\]\)\{\s*position:fixed!important;inset:0!important/);
 assert.match(css,/orientation:landscape/);
 assert.match(css,/#battle-panel:not\(\[hidden\]\) > #battle\.sr-only/);
 assert.match(css,/#battle-panel:not\(\[hidden\]\) > \[hidden\]\{display:none!important\}/);
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

test("original faction battle scenery and readable handheld theme ship together",async()=>{
 const stage=await load("public/monster-mmo-pixel-battle.js");
 const css=await load("public/monster-mmo.css");
 for(const cue of ["Orbiting saucers","Hellscape spires","Two-tone moon/planet","prefers-reduced-motion"])assert.ok(stage.includes(cue)||css.includes(cue),cue);
 assert.match(css,/--hh-pink:#ff63c8/);
 assert.match(css,/button\[aria-selected="true"\]/);
});
test("Creator Foundry lists official free game tools without shipping their binaries",async()=>{
 const html=await load("public/dev-toolkit.html");
 for(const name of ["Phaser 3 / 4","Tiled Map Editor","LDtk World Builder","Piskel Sprite Animator","LibreSprite"])assert.ok(html.includes(name),name);
 assert.match(html,/29 tools/);
});
