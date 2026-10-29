import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
const html=readFileSync("public/chaos-cartridge.html","utf8");
const ids=[...html.matchAll(/<article class="cartridge-cabinet arcade-flat-card" data-game-id="([^"]+)"/g)].map(m=>m[1]);
assert.ok(ids.length>50,"Arcade shelf unexpectedly empty");
assert.equal(new Set(ids).size,ids.length,"Duplicate arcade shelf game IDs found");
const retired=["cabinet-dino-run","cabinet-balloon-pop","cabinet-hanoi","2048","asteroids","snake","pong","blockfall","breakout","minesweeper","wordle-style-word-game","flappy-bird-style","hextris","maze-muncher","sokoban","air-hockey","lights-out","whack-a-mole","custom-tetris","memory-match","curvy-snake"];
for(const id of retired)assert.ok(!ids.includes(id),"Retired imported or duplicate arcade listing reappeared: "+id);
const originalTargets=["hexa-havoc","cinder-maze","ash-crateworks","void-hockey","void-lanterns","whack-a-bug","pyre-stacks","crypt-pairs","ash-serpent","neon-drift","cinder-defense"];
for(const id of originalTargets)assert.ok(ids.includes(id),"Expected original arcade listing missing: "+id);
console.log("Arcade shelf verified: "+ids.length+" unique entries, "+retired.length+" retired duplicates absent.");

const catalog=readFileSync("public/arcade-30-games.html","utf8");
const cards=[...catalog.matchAll(/<article class="game"[^>]*>[\s\S]*?<\/article>/g)].map(m=>m[0]);
const headingCount=Number(catalog.match(/ARCADE × (\d+)/)?.[1]);
assert.ok(headingCount>100,"Catalog heading must contain its cabinet count");
assert.equal(cards.length,headingCount,"Secondary arcade catalog count must match its heading");
const hrefs=cards.map(c=>c.match(/class="play" href="([^"]+)"/)?.[1]);
assert.ok(hrefs.every(Boolean),"Each catalog card needs a play link");
assert.equal(new Set(hrefs).size,hrefs.length,"Duplicate play links in secondary catalog");
for(const slug of ["dino-run","balloon-pop","hanoi"])assert.ok(!hrefs.includes("/arcade/hosted/"+slug+"/index.html"),"Adapted clone reintroduced: "+slug);
for(const game of ["neon-drift","cinder-defense"])assert.ok(hrefs.includes("/arcade/hosted/ashfall-neon-engine.html?game="+game),"New Ash-Fall engine missing: "+game);
console.log("Secondary catalog verified: "+cards.length+" unique original entries.");

const {existsSync}=await import("node:fs");
const retiredDirs=["dino-run","balloon-pop","hanoi","snek-souls","custom-tetris","hextris","maze-muncher","sokoban","air-hockey","lights-out","whack-a-mole","minesweeper","memory-match","breakout"];
const inventory=JSON.parse(readFileSync("public/arcade/import-manifest.json","utf8"));
for(const slug of retiredDirs){
 const route="/arcade/hosted/"+slug+"/index.html";
 assert.ok(!existsSync("public"+route),"Copied game implementation still present: "+route);
 assert.ok(!html.includes('href="'+route+'"'),"Retired copied game still linked on main shelf: "+route);
 assert.ok(!catalog.includes('href="'+route+'"'),"Retired copied game still linked in catalog: "+route);
}
for(const entry of inventory.imports.filter(e=>e.status==="removed")){
 for(const file of entry.files||[])assert.ok(!existsSync("public"+file),"Retired import file still present: "+file);
}
console.log("Retired copied game implementations and public links verified absent.");
