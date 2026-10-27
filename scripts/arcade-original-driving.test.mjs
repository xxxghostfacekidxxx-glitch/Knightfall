import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const root="public/arcade/hosted/";
const js=readFileSync(root+"ashfall-original-driving.js","utf8");
test("driving engine parses",()=>assert.doesNotThrow(()=>new Script(js)));
for(const id of ["car-race","two-cars","crossy-road"]){
 test(id+" has new game and account score bridge",()=>{
  const page=readFileSync(root+id+"/index.html","utf8");
  assert.ok(page.includes("ashfall-original-driving.js"));
  assert.ok(page.includes('data-game-id="cabinet-'+id+'"'));
  assert.ok(page.includes('id="score"'));
 });
}
test("all three road mechanics exist",()=>{
 for(const id of ["car-race","two-cars","crossy-road"])assert.ok(js.includes(id));
 assert.ok(js.includes("steps>=30"));
 assert.ok(js.includes("localStorage.setItem"));
});
