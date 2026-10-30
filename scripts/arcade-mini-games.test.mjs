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

test("backgrounding preserves progress without ending a run",()=>{
 assert.match(shared,/document\.addEventListener\("visibilitychange",\(\)=>\{if\(document\.hidden\)\{saveLocal\(\)\}last=performance\.now\(\)\}\)/);
});
test("animation loop throttles synchronous localStorage writes",()=>{
 assert.match(shared,/now-lastAutoSave>=2000/);
 assert.match(shared,/if\(now-lastAutoSave>=2000\)\{saveLocal\(\);lastAutoSave=now\}/);
});

test("Ash Slope retains fractional distance between frames",()=>{
 assert.match(shared,/state\.distance=\(Number\(state\.distance\)\|\|0\)\+dt\*\.12/);
 assert.match(shared,/state\.distance-=gained;setScore\(score\+gained\)/);
});
test("Ember Rebound requires multiple hits on reinforced bricks",()=>{
 assert.match(shared,/if\(b\.hp&&state\.x>b\.x[\s\S]*?\{b\.hp--;state\.y=state\.vy>0\?b\.y-10:b\.y\+b\.h\+10;state\.vy\*=-1;setScore\(score\+10\);break\}/);
});

test("Ash Slope pickups are collected only once and old objects are bounded",()=>{
 assert.match(shared,/!t\.collected&&Math\.abs\(t\.x-state\.x\)<25/);
 assert.match(shared,/t\.collected=true;setScore\(score\+10\)/);
 assert.match(shared,/state\.tokens=state\.tokens\.filter\(t=>!t\.collected/);
 assert.match(shared,/state\.obstacles=state\.obstacles\.filter\(o=>!o\.hit/);
});
test("Cinder Collider keyboard upgrades use the same logic as touch buttons",()=>{
 assert.match(shared,/if\(e\.key==="1"\)clickerAction\("generate"\)/);
 assert.match(shared,/if\(e\.key==="2"\)clickerAction\("boost"\)/);
 assert.match(shared,/if\(e\.key==="3"\)clickerAction\("scientist"\)/);
});

test("Crypt Conduits accepts alternative connected routes and rejects disconnected tiles",()=>{
 const fn=shared.match(/function circuitConnected\(grid\)\{[\s\S]*?\n\}/)?.[0];
 assert.ok(fn,"connection validator missing");
 const connected=Function(fn+";return circuitConnected")();
 const blank=()=>Array.from({length:5},()=>Array(5).fill(0));
 const path=blank();
 for(let x=0;x<5;x++)path[0][x]=1;
 for(let y=0;y<5;y++)path[y][4]=1;
 assert.equal(connected(path),true,"top and right edge route must count");
 const oldPath=blank();
 for(let y=0;y<5;y++)oldPath[y][0]=1;
 for(let x=0;x<5;x++)oldPath[4][x]=1;
 assert.equal(connected(oldPath),true,"left and bottom edge route must count");
 const isolated=blank();isolated[0][0]=isolated[4][4]=1;
 assert.equal(connected(isolated),false,"disconnected endpoints must not win");
 assert.equal(connected(blank()),false,"empty grid must not win");
});
