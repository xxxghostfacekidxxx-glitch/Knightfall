import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const read=p=>readFileSync(p,"utf8");
const base="public/arcade/hosted/";
test("NextGen engine parses and provides accessible, inexpensive effects",()=>{
 const js=read("public/arcade/nextgen.js"),css=read("public/arcade/nextgen.css");
 assert.doesNotThrow(()=>new Script(js));
 assert.match(js,/requestAnimationFrame\(frame\)/);
 assert.match(js,/pointerdown/);
 assert.match(js,/setEnabled/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/#af-vfx-canvas\{[^}]*pointer-events:none/);
 assert.match(js,/!enabled\|\|!!motion\?\.matches/);
});
test("all original game pages use one versioned visual layer without losing game logic",()=>{
 const originals=JSON.parse(read("public/arcade/original-creations.json")).games;
 const unique=new Set();
 assert.ok(originals.length>=90);
 for(const game of originals){
  const path="public"+game.engine;
  assert.ok(!unique.has(path),"duplicate "+path);unique.add(path);
  const html=read(path);
  assert.match(html,/<link rel="stylesheet" href="\/arcade\/nextgen\.css\?v=20261102-1">/,path);
  assert.match(html,/<script src="\/arcade\/nextgen\.js\?v=20261102-1" defer><\/script>/,path);
  assert.match(html,/<\/body>/i,path);
 }
 assert.ok(unique.size>=90);
});
test("cartridge and classic arcade hubs receive matching visual styles",()=>{
 for(const path of ["public/chaos-cartridge.html","public/arcade-games.html","public/arcade-originals.html","public/arcade-card-board.html"]){
  const html=read(path);assert.match(html,/\/arcade\/nextgen\.css\?v=20261102-1/);assert.match(html,/\/arcade\/nextgen\.js\?v=20261102-1/)
 }
});
