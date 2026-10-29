import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const read=name=>readFile(new URL("../public/"+name,import.meta.url),"utf8");
const ids=["toxic-seraph","void-bunny","neon-reaper","chaos-cat","broken-halo","alien-static","heart-hazard","eclipse-fang"];
test("eight original vector icon options are complete and available",async()=>{
 const page=await read("devil-tools.html");
 assert.match(page,/13 App Icon Candidates/);
 for(const id of ids){
  assert.ok(page.includes("['"+id+"',"),"Missing gallery entry: "+id);
  const svg=await read("icons/choices/"+id+".svg");
  assert.match(svg,/<svg[^>]+viewBox="0 0 96 96"/);
  assert.match(svg,/<\/svg>/);
  assert.match(svg,/#ff55d8/);
  assert.match(svg,/#c6ff45/);
 }
});
test("mobile message controls keep neon style and avoid mascot overlay",async()=>{
 const css=await read("section-overhaul.css");
 assert.match(css,/\.messages-shell \.composer textarea\{background:#0b0d1b!important/);
 assert.match(css,/body:has\(\.messages-shell\) \.gw-character-crew\{display:none!important\}/);
 assert.match(css,/\.messages-shell \.composer-actions\{justify-content:flex-end\}/);
});
