import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const ids=["driftfin","embercub","gloamlet","grubruckle","mossbit","mournwing","thornspit","zipfang"];
test("recovered original monster SVGs remain available",async()=>{
 for(const id of ids){
  const svg=await readFile(new URL("../public/assets/monster-sprites/"+id+".svg",import.meta.url),"utf8");
  assert.ok(svg.includes("<svg"),id+" missing SVG root");
  assert.ok(svg.includes("</svg>"),id+" missing closing tag");
  assert.ok(!svg.includes("<script"),id+" contains unexpected script");
 }
});
test("monster renderer selects recovered portraits without replacing other species",async()=>{
 const js=await readFile(new URL("../public/monster-mmo.js",import.meta.url),"utf8");
 assert.ok(js.includes('function monsterPortrait(id,size="small")'));
 for(const id of ids)assert.ok(js.includes('"'+id+'"'),"Missing recovered monster: "+id);
 assert.ok(js.includes('img.src="/assets/monster-sprites/"+id+".svg"'));
 assert.ok(js.includes("const look=infernalLooks[id]||infernalLooks.gloamlet"));
});
