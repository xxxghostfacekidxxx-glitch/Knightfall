import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const html=readFileSync("public/index.html","utf8");
const css=readFileSync("public/home-start.css","utf8");
test("Knightfall homepage has direct signup and a safe free first step",()=>{
  assert.match(html,/<title>Knightfall/);
  assert.match(html,/data-home-sign-in href="\/auth\.html\?mode=register&amp;next=%2Fchaos-cartridge\.html"/);
  assert.match(html,/id="start-here"/);
  assert.match(html,/href="\/chaos-cartridge\.html"/);
  assert.match(html,/href="\/community\.html"/);
  assert.match(html,/href="\/mascot-pets\.html"/);
  assert.match(html,/Browse free games/);
  assert.doesNotMatch(html,/free premium|guaranteed earnings|buy now|checkout now/i);
});
test("all first-step destinations exist in Pages and are usable on mobile",()=>{
  for(const file of ["chaos-cartridge.html","community.html","mascot-pets.html","auth.html","home-start.css"])
    assert.ok(existsSync("public/"+file),file);
  assert.match(css,/@media\(max-width:740px\)/);
  assert.match(css,/focus-visible/);
});
