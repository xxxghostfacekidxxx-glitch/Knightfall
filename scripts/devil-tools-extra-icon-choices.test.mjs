import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const read=name=>readFile(new URL("../public/"+name,import.meta.url),"utf8");
const ids=["toxic-seraph","void-bunny","spectral-reaper","chaos-cat","shattered-halo","alien-static","heart-hazard","eclipse-fang"];
test("eight additional SVGs are listed in the 21-choice icon gallery",async()=>{
 const page=await read("devil-tools.html");
 assert.match(page,/21 App Icon Candidates/);
 for(const id of ids){
  assert.ok(page.includes("['"+id+"',"),id);
  const svg=await read("icons/choices/"+id+".svg");
  assert.match(svg,/<svg[^>]+viewBox="0 0 96 96"/);
  assert.match(svg,/<\/svg>/);
 }
});
test("mobile inbox controls keep neon palette and are not obscured by mascots",async()=>{
 const css=await read("section-overhaul.css");
 assert.match(css,/\.messages-shell \.composer textarea\{background:#0b0d1b!important/);
 assert.match(css,/body:has\(\.messages-shell\) \.gw-character-crew\{display:none!important\}/);
});
