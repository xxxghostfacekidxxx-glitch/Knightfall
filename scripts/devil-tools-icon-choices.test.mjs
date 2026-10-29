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
