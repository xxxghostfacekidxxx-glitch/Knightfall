import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const dir="public/arcade/hosted/cards-against-chaos/";
const read=(name)=>readFileSync(dir+name,"utf8");
const game=read("index.html"),cabinet=read("cabinet.js"),css=read("cabinet.css"),online=read("online.js");
test("cabinet keeps its 4-seat game IDs and dual-mode tabs without duplicates",()=>{
 const ids=[...game.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size,"No duplicate IDs in rebuilt page");
 for(const id of ["cac-shell","cac-tab-local","cac-tab-online","cac-local-view","cac-online-view",
  "cac-fullscreen","setup","game","prompt-panel","judging-panel","scoreboard","status","prompt-text",
  "player-count","win-score","player-inputs","hand","answers","start","new-game",
  "cards-online-table","cards-online-form","cards-online-list","cards-online-prompt",
  "cards-online-hand","cards-online-choices","cards-online-scores","cac-online-lobby"])
  assert.ok(ids.includes(id),"Missing game control "+id);
 assert.match(game,/role="tablist"/);
 assert.match(game,/role="tabpanel"/);
 assert.match(game,/aria-selected="true"/);
 assert.match(game,/id="cac-online-view"[^>]*hidden/);
 assert.doesNotMatch(game,/<style>/,"Old inline styles must not override cabinet theme");
 assert.match(game,/cabinet\.css\?v=/);
 assert.match(game,/cabinet\.js\?v=/);
 assert.ok(existsSync(dir+"base-deck.js"));
 assert.ok(existsSync(dir+"deck-mixer.js"));
 assert.ok(existsSync(dir+"expansion-packs.js"));
});
test("fullscreen requests native immersive mode, then a browser-safe focus fallback",()=>{
 assert.match(cabinet,/requestFullscreen\(/);
 assert.match(cabinet,/document\.exitFullscreen/);
 assert.match(cabinet,/setFocusMode\(true\)/);
 assert.match(cabinet,/fullscreenchange/);
 assert.match(cabinet,/Escape/);
 assert.match(cabinet,/aria-pressed/);
 assert.match(css,/\.cac-shell:fullscreen/);
 assert.match(css,/body\.cac-focus-mode/);
 assert.match(css,/height:100dvh/);
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
test("playing local and online switches the stage without breaking matches or bubbles",()=>{
 assert.match(game,/window\.CACCabinet\?\.setPlaying\(true\)/);
 assert.match(game,/window\.CACCabinet\?\.setPlaying\(false\)/);
 assert.match(online,/window\.CACCabinet\?\.showMatch\(Boolean\(selected\)\)/);
 assert.match(online,/window\.CACCabinet\?\.showMatch\(false\)/);
 assert.match(cabinet,/params\.has\("match"\)\|\|params\.has\("invite"\)/);
 assert.match(cabinet,/activateMode\("online"\)/);
 assert.match(game,/data-card-pack-mode="local"/);
 assert.match(game,/data-card-pack-mode="online"/);
 assert.match(online,/expansion_ids:expansionIds/);
 assert.match(game,/drawThemedCard\(poolState/);
 assert.match(game,/id="cards-local-adult"/);
 assert.match(game,/id="cards-online-adult"/);
});
