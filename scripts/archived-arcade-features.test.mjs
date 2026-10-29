import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const read=path=>readFile(new URL("../public/"+path,import.meta.url),"utf8");

test("archived card-room games remain available in the modern page",async()=>{
 const html=await read("arcade-card-room.html");
 for(const game of ["Blackjack","Five-Card Draw","War"]){
  assert.ok(html.includes(game),"Card Room lost "+game);
 }
 assert.ok(html.includes("/arcade-save.js"),"Card Room lost arcade save bridge");
});
test("recovered downhill Slush Rush is distinct from Ashslide Rush",async()=>{
 const original=await read("arcade/hosted/slush-rush-original/index.html");
 const modern=await read("arcade/hosted/slush-rush/index.html");
 assert.ok(original.includes("cabinet-slush-rush-original"));
 assert.ok(modern.includes("cabinet-slush-rush"));
 assert.ok(modern.includes("/arcade/hosted/slush-rush-original/index.html"));
 assert.ok(original.includes("data-score-selector=\"#distance\""));
});
test("arcade originals retain their own standalone game pages",async()=>{
 for(const path of ["wagonbound.html","last-drop-lemonade.html"]){
  const html=await read(path);
  assert.ok(html.includes("<title>"),path+" missing title");
  assert.ok(html.includes("</html>"),path+" incomplete document");
 }
});
