import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const root=new URL("../public/",import.meta.url);
const icons=["serrated-grin","eclipse-fangs","orbit-imp","neon-reaper","chaos-heartbeat","toxic-cassette","void-moth","broken-halo"];
test("eight original icon SVGs are accessible, square and standalone",async()=>{
 for(const id of icons){
  const svg=await readFile(new URL("icons/choices/"+id+".svg",root),"utf8");
  assert.match(svg,/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 128 128"/);
  assert.match(svg,/<title>[^<]+<\/title>/);
  assert.match(svg,/<\/svg>$/);
  assert.ok(!/<script|onload=|href="https?:/i.test(svg));
 }
});
test("Devil Tools displays all thirteen icon choices with SVG download and browser-only preview",async()=>{
 const html=await readFile(new URL("devil-tools.html",root),"utf8");
 assert.match(html,/13 App Icon Candidates/);
 for(const id of icons)assert.ok(html.includes("['"+id+"',"),id);
 assert.match(html,/localStorage\.setItem\('knightfall-app-icon-candidate'/);
 assert.match(html,/link\.download=id\+'\.svg'/);
});

// Recovered from archived feat/devil-tools-eight-icons-2026-10-29.
test("archived neon icon variants remain visible and downloadable",async()=>{
 const ids=["toxic-seraph","void-bunny","neon-reaper","chaos-cat","broken-halo","alien-static","heart-hazard","eclipse-fang"];
 const page=await readFile(new URL("devil-tools.html",root),"utf8");
 for(const id of ids){
  assert.ok(page.includes("['"+id+"',"),"Missing gallery entry: "+id);
  const svg=await readFile(new URL("icons/choices/"+id+".svg",root),"utf8");
  assert.match(svg,/<svg[^>]+viewBox="0 0 96 96"/);
  assert.match(svg,/<\\/svg>/);
  assert.match(svg,/#ff55d8/);
  assert.match(svg,/#c6ff45/);
 }
});
test("mobile message composer keeps neon styling without mascot overlay",async()=>{
 const css=await readFile(new URL("section-overhaul.css",root),"utf8");
 assert.match(css,/\\.messages-shell \\.composer textarea\\{background:#0b0d1b!important/);
 assert.match(css,/body:has\\(\\.messages-shell\\) \\.gw-character-crew\\{display:none!important\\}/);
 assert.match(css,/\\.messages-shell \\.composer-actions\\{justify-content:flex-end\\}/);
});
