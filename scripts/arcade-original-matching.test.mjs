import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const root="public/arcade/hosted/";
const js=readFileSync(root+"ashfall-original-matching.js","utf8");
test("original matching engine parses",()=>assert.doesNotThrow(()=>new Script(js)));
for(const id of ["bubble-pop","candy-crush"]){
 test(id+" loads original engine and score bridge",()=>{
  const page=readFileSync(root+id+"/index.html","utf8");
  assert.ok(page.includes("ashfall-original-matching.js"));
  assert.ok(page.includes('data-game-id="cabinet-'+id+'"'));
  assert.ok(page.includes('id="score"'));
 });
}
test("matching engine has group flood fill and adjacent-only swaps",()=>{
 assert.ok(js.includes("queue=[[cy,cx]]"));
 assert.ok(js.includes("findMatches()"));
 assert.ok(js.includes("collapse(matches)"));
 assert.ok(js.includes("Math.abs(a.x-cx)+Math.abs(a.y-cy)!==1"));
});
