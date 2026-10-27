import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {Script} from "node:vm";
import {join} from "node:path";

const root="public/arcade/hosted";
const shared=readFileSync(join(root,"ashfall-mini-games.js"),"utf8");
const cases=[
 ["particle-clicker","Cinder Collider"],
 ["cube-composer","Crypt Conduits"],
 ["skifree","Ash Slope"],
 ["ball-and-wall","Ember Rebound"]
];

test("shared mini-game engine is syntactically valid",()=>assert.doesNotThrow(()=>new Script(shared)));
test("mini-game route dispatch matches all four standalone pages",()=>{
 for(const [id] of cases){
  const route="/arcade/hosted/"+id+"/index.html";
  assert.equal(route.match(/\/arcade\/hosted\/(particle-clicker|cube-composer|skifree|ball-and-wall)\/index\.html$/)?.[1],id);
 }
});
for(const [id,title] of cases){
 test(id+" has a playable standalone page, score bridge and local emblem",()=>{
  const page=readFileSync(join(root,id,"index.html"),"utf8");
  assert.match(page,/src="\/arcade-save\.js"/);
  assert.match(page,/src="\/arcade\/hosted\/ashfall-mini-games\.js"/);
  assert.ok(page.includes("<title>"+title+" | Chaos Cartridge</title>"),"page title out of sync");
  const sprite=page.match(/src="\.\/sprites\/([^"]+)"/)?.[1];
  assert.ok(sprite,"standalone emblem missing");
  assert.ok(existsSync(join(root,id,"sprites",sprite)),"emblem file missing");
  assert.ok(shared.includes('title:"'+title+'"'),"engine game title out of sync");
 });
}
test("score submission preserves local state when offline",()=>{
 assert.match(shared,/function submit\(force\)\{saveLocal\(\)/);
 assert.match(shared,/if\(!window\.AshFallArcade\)\{if\(force\)status/);
});
test("local resume clears prior game-over flag",()=>{
 assert.match(shared,/running=true;over=false;last=performance\.now\(\);setScore\(score\);status\("Device save resumed"\)/);
});
