import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const root="public/arcade/hosted/";
const engine=readFileSync(root+"ashfall-original-sports.js","utf8");
test("sports engine parses",()=>assert.doesNotThrow(()=>new Script(engine)));
for(const [id,title,sprite] of [["basketball","Inferno Hoops","inferno-ball.svg"],["bowling","Crypt Bowling","crypt-pin.svg"],["penalty-shootout","Cinder Shootout","shootout.svg"]]){
 test(title+" loads first-party engine and score bridge",()=>{
  const page=readFileSync(root+id+"/index.html","utf8");
  assert.ok(page.includes("<title>"+title+" | Chaos Cartridge</title>"));
  assert.ok(page.includes("./sprites/"+sprite));
  assert.ok(page.includes('src="/arcade/hosted/ashfall-original-sports.js"'));
  assert.ok(page.includes('data-game-id="cabinet-'+id+'"'));
  assert.ok(page.includes('id="score"'));
 });
}
test("three different sports scoring mechanics and a bounded round",()=>{
 assert.match(engine,/id==="basketball"/);
 assert.match(engine,/id==="bowling"/);
 assert.match(engine,/id==="penalty-shootout"/);
 assert.match(engine,/shots>=20/);
 assert.match(engine,/elapsed>=75/);
 assert.match(engine,/localStorage\.setItem/);
});
