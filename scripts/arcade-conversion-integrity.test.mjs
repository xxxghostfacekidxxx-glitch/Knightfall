import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const catalog=JSON.parse(readFileSync("public/arcade/original-creations.json","utf8"));
const shelf=readFileSync("public/arcade-30-games.html","utf8");
test("every cataloged original has a locally hosted entry point",()=>{
 const ids=new Set();
 for(const g of catalog.games){
  assert.ok(!ids.has(g.id),"duplicate cartridge: "+g.id);ids.add(g.id);
  assert.ok(g.engine.startsWith("/arcade/hosted/"),g.id+" must be hosted locally");
  assert.ok(existsSync("public"+g.engine),g.id+" entry point missing");
  assert.ok(shelf.includes('href="'+g.engine+'"'),g.id+" is missing from arcade shelf");
 }
});
test("rewritten engines do not embed imported remote game scripts",()=>{
 const rewritten=catalog.games.filter(g=>g.status.startsWith("original Ash-Fall engine"));
 assert.ok(rewritten.length>=20);
 for(const g of rewritten){
  const page=readFileSync("public"+g.engine,"utf8");
  assert.ok(!/<script[^>]+src=["']https?:\/\//i.test(page),g.id+" includes a remote game script");
  assert.ok(page.includes('data-game-id="cabinet-'+g.id+'"'),g.id+" score bridge missing");
 }
});
test("new lunar landing game has an independent local engine",()=>{
 assert.ok(shelf.includes("Cinder Lander"));
 const page=readFileSync("public/arcade/hosted/cinder-lander/index.html","utf8");
 assert.ok(page.includes('src="/arcade/hosted/cinder-lander/game.js"'));
});
test("all newly authored animated engines reset the leaderboard run lifecycle",()=>{
 for(const file of ["ashfall-original-trio.js","ashfall-original-sports.js","ashfall-original-driving.js","ashfall-original-action.js","ashfall-original-runner.js","ashfall-original-vector.js","ashfall-original-matching.js","cinder-lander/game.js"]){
  const source=readFileSync("public/arcade/hosted/"+file,"utf8");
  assert.ok(source.includes("ashfall:arcade-started"),file+" must notify account bridge on start");
  assert.ok(source.includes("ashfall:arcade-finished"),file+" must notify account bridge on completion");
 }
});
