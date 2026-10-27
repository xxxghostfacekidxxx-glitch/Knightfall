import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const root="public/arcade/hosted/";
const js=readFileSync(root+"ashfall-original-trio.js","utf8");
test("new original arcade engine parses",()=>assert.doesNotThrow(()=>new Script(js)));
for(const [id,title,art] of [["whack-a-bug","Crypt Exterminator","exterminator.svg"],["stack-tower","Cinder Spire","spire.svg"],["balance-stack","Ash Equilibrium","balance-sigil.svg"]]){
 test(title+" has its own hosted page, emblem, scoring and engine",()=>{
  const html=readFileSync(root+id+"/index.html","utf8");
  assert.ok(html.includes("<title>"+title+" | Chaos Cartridge</title>"));
  assert.ok(html.includes("./sprites/"+art));
  assert.ok(html.includes('src="/arcade/hosted/ashfall-original-trio.js"'));
  assert.ok(html.includes('data-game-id="cabinet-'+id+'"'));
  assert.ok(html.includes('id="restart"'));
  assert.ok(html.includes('id="score"'));
 });
}
test("engine implements distinct mechanics and preserves best score",()=>{
 assert.ok(js.includes('id==="whack-a-bug"'));
 assert.ok(js.includes('id==="stack-tower"'));
 assert.ok(js.includes('game.tilt'));
 assert.ok(js.includes("localStorage.setItem"));
 assert.match(js, /requestAnimationFrame\(\s*(?:loop|(?:\w+)\s*=>\s*loop\(\s*\w+\s*,\s*seq\s*\))\s*\)/);
});
