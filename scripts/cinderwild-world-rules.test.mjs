import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
import {terrainAt,canWalk,advanceTrainer,zoneAt,WORLD_WIDTH,WORLD_HEIGHT,WARDENS} from "../backend/src/cinderwild-world-rules.mjs";

const client=readFileSync("public/arcade/hosted/cinderwild/game.js","utf8");
const exposed=client.replace(/initialize\(\);\s*\}\)\(\);\s*$/, "globalThis.__cinderwildWorld={tile,walkable};})();");
if(exposed===client)throw Error("Could not isolate Cinderwild browser world rules");
const browser={window:{},localStorage:{getItem:()=>null}};
vm.runInNewContext(exposed,browser,{timeout:2000});

test("the multiplayer server has exactly the same terrain and collisions as the browser on all 2,432 tiles",()=>{
 assert.equal(WORLD_WIDTH,64);
 assert.equal(WORLD_HEIGHT,38);
 for(let y=0;y<WORLD_HEIGHT;y++)for(let x=0;x<WORLD_WIDTH;x++){
  assert.equal(terrainAt(x,y),browser.__cinderwildWorld.tile(x,y),"Terrain mismatch at "+x+","+y);
  assert.equal(canWalk(x,y),browser.__cinderwildWorld.walkable(x,y),"Walkability mismatch at "+x+","+y);
 }
});
test("movement accepts cardinal commands only, derived from trusted saved position",()=>{
 const start={x:8,y:18,steps:9};
 const result=advanceTrainer(start,"right",[]);
 assert.deepEqual(result,{allowed:true,position:{x:9,y:18,steps:10},zone:"Cinder Town"});
 assert.deepEqual(start,{x:8,y:18,steps:9},"authoritative position must remain untouched");
 for(const invalid of ["teleport","UP","diagonal","",null,42,{}])
  assert.equal(advanceTrainer(start,invalid,[]).error,"INVALID_DIRECTION");
});
test("walls, water, occupied NPC tiles and invalid saved positions cannot be bypassed",()=>{
 assert.equal(advanceTrainer({x:6,y:18,steps:1},"up",[]).error,"BLOCKED_TILE");
 assert.equal(advanceTrainer({x:8,y:1,steps:1},"up",[]).error,"BLOCKED_TILE");
 assert.equal(advanceTrainer({x:0,y:0,steps:1},"right",[]).error,"INVALID_SAVED_POSITION");
 assert.equal(advanceTrainer({x:64,y:18,steps:1},"left",[]).error,"INVALID_SAVED_POSITION");
 assert.equal(canWalk(38,7),false,"lake must remain impassable");
});
test("region barriers require server-owned Warden badges",()=>{
 assert.equal(advanceTrainer({x:31,y:18,steps:10},"right",[]).error,"BRAMBLE_CREST_REQUIRED");
 const storm=advanceTrainer({x:31,y:18,steps:10},"right",["bramble"]);
 assert.equal(storm.allowed,true);
 assert.equal(zoneAt(storm.position.x),"Storm Marsh");
 assert.equal(advanceTrainer({x:50,y:18,steps:10},"right",["bramble"]).error,"STORM_CREST_REQUIRED");
 assert.equal(advanceTrainer({x:50,y:18,steps:10},"right",["bramble","storm"]).allowed,true);
 assert.deepEqual(WARDENS.map(w=>w.id),["bramble","storm","eclipse"]);
});
test("server movement caps steps and rejects malformed server state",()=>{
 assert.equal(advanceTrainer({x:8,y:18,steps:10000000},"right",[]).position.steps,10000000);
 assert.equal(advanceTrainer({x:8.5,y:18},"right",[]).error,"INVALID_SAVED_POSITION");
 assert.equal(advanceTrainer(null,"right",[]).error,"INVALID_SAVED_POSITION");
});
