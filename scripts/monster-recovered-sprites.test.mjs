import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const ids=["driftfin","embercub","gloamlet","grubruckle","mossbit","mournwing","thornspit","zipfang"];
test("recovered original monster SVGs remain available",async()=>{
 for(const id of ids){
  const svg=await readFile(new URL("../public/assets/monster-sprites/"+id+".svg",import.meta.url),"utf8");
  assert.match(svg,/<svg\\b/);
  assert.match(svg,/<\\/svg>/);
  assert.doesNotMatch(svg,/<script\\b|\\bonload\\s*=|\\bhref\\s*=\\s*["']https?:/i);
 }
});
test("monster renderer selects recovered portraits without replacing other species",async()=>{
 const js=await readFile(new URL("../public/monster-mmo.js",import.meta.url),"utf8");
 assert.match(js,/function monsterPortrait\\(id,size="small"\\)/);
 for(const id of ids)assert.ok(js.includes('"'+id+'"'),"Missing recovered monster: "+id);
 assert.match(js,/img\\.src="\\/assets\\/monster-sprites\\/"\\+id\\+"\\.svg"/);
 assert.match(js,/const look=infernalLooks\\[id\\]\\|\\|infernalLooks\\.gloamlet/);
});
