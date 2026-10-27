import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const root="public/arcade/hosted/";
const js=readFileSync(root+"ashfall-original-action.js","utf8");
test("action engine parses",()=>assert.doesNotThrow(()=>new Script(js)));
for(const id of ["doodle-jump","survivor","alien-battle"]){
 test(id+" loads original engine and account bridge",()=>{
  const html=readFileSync(root+id+"/index.html","utf8");
  assert.ok(html.includes("ashfall-original-action.js"));
  assert.ok(html.includes('data-game-id="cabinet-'+id+'"'));
  assert.ok(html.includes('id="score"'));
 });
}
test("distinct action mechanics are implemented",()=>{
 assert.ok(js.includes('id==="doodle-jump"'));
 assert.ok(js.includes('id==="survivor"'));
 assert.ok(js.includes("s.platforms"));
 assert.ok(js.includes("s.enemies"));
 assert.ok(js.includes("localStorage.setItem"));
});
