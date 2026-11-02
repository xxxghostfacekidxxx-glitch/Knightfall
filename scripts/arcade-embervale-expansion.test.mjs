import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root='public/arcade/hosted/embervale/';
const read=path=>readFileSync(root+path,'utf8');

function loadWorld(){
  // Evaluate the actual source in a sandbox with only the DOM-free tile
  // symbols. This executes both map validators, enemy registrations and
  // reveals script-order initialization errors before deployment.
  const sandbox={console:{log(){},error(message){throw new Error(message)}},
    T:new Proxy({}, {get:(_o,k)=>String(k)})};
  vm.createContext(sandbox);
  for(const path of ['js/world.js','js/entities.js','js/knightfall-expansion.js']){
    vm.runInContext(read(path),sandbox,{filename:path,timeout:1000});
  }
  return {sandbox,inspect:expression=>vm.runInContext(expression,sandbox,{timeout:1000})};
}
test('eastern overworld has six valid connected screens and a continuous bridge',()=>{
  const w=loadWorld().inspect(`({
    originalCount:Object.keys(OVERWORLD).length,
    west:OVERWORLD['4,1'].tiles.slice(4,7).map(x=>x.slice(8)),
    east:OVERWORLD['5,1'].tiles.slice(4,7).map(x=>x[0]),
    names:[...Object.values(EAST_REALMS)].map(x=>x.name),
    overworldWidth:MAPS.overworld.w,
    allValid:Object.values(OVERWORLD).every(r=>r.tiles.length===11&&r.tiles.every(t=>t.length===16))
  })`);
  assert.equal(w.originalCount,26);
  assert.equal(w.overworldWidth,7);
  assert.ok(w.allValid);
  assert.ok(Array.from(w.west).every(s=>s==='========'));
  assert.ok(Array.from(w.east).every(s=>s==='='));
  assert.equal(w.names.length,6);
});
test('Cinder Keep is six rooms with entrance, lock and persistent fireblade upgrade',()=>{
  const x=loadWorld().inspect(`({
    count:Object.keys(KEEP).length,
    entrance:getScreenDef('emberkeep',1,1),
    boss:getScreenDef('emberkeep',1,0),
    armory:KEEP['2,0'].chests[0],
    key:KEEP['0,1'].chests[0],
    door:KEEP['2,1'].tiles[0].slice(7,10),
    allValid:Object.values(KEEP).every(r=>r.tiles.length===11&&r.tiles.every(t=>t.length===16)),
    wardenHp:makeEnemy('cinderwarden',7,5).hp
  })`);
  assert.equal(x.count,6);
  assert.ok(x.allValid);
  assert.equal(x.entrance.warps[0].map,'overworld');
  assert.equal(x.boss.enemies[0][0],'cinderwarden');
  assert.equal(x.armory.item,'emberblade');
  assert.equal(x.key.item,'key');
  assert.equal(x.door,'LLL');
  assert.equal(x.wardenHp,16);
});
test('Prism Catacombs have four connected rooms, second boss, and storm bow',()=>{
  const x=loadWorld().inspect(`({
    count:Object.keys(PRISM).length,
    entrance:getScreenDef('glasscrypt',0,1),
    exitWarp:OVERWORLD['6,2'].warps[0],
    boss:PRISM['1,0'],
    bow:PRISM['1,0'].chests[0],
    key:PRISM['0,0'].chests[0],
    door:PRISM['1,1'].tiles[0].slice(7,10),
    beastHp:makeEnemy('prismbeast',7,5).hp,
    allValid:Object.values(PRISM).every(r=>r.tiles.length===11&&r.tiles.every(t=>t.length===16))
  })`);
  assert.equal(x.count,4);
  assert.ok(x.allValid);
  assert.equal(x.entrance.warps[0].sx,6);
  assert.equal(x.exitWarp.map,'glasscrypt');
  assert.equal(x.boss.enemies[0][0],'prismbeast');
  assert.equal(x.bow.item,'stormbow');
  assert.equal(x.key.item,'key');
  assert.equal(x.door,'LLL');
  assert.equal(x.beastHp,20);
});
test('main engine wires saved upgrades, both dungeons, attack variants and fullscreen/touch controls',()=>{
  const game=read('js/game.js');
  const enemy=read('js/entities.js');
  const html=read('index.html');
  assert.match(game,/MAPS\[warp\.map\]/);
  assert.match(game,/if \(MAPS\[G\.map\]\)/);
  assert.match(game,/case 'emberblade'/);
  assert.match(game,/case 'stormbow'/);
  assert.match(game,/G\.inv\.stormbow/);
  assert.match(game,/G\.inv\.emberblade \? 2 : 1/);
  assert.match(game,/G\.map === 'glasscrypt'/);
  assert.match(enemy,/case 'prismbeast'/);
  assert.ok(html.indexOf('js/knightfall-expansion.js') > html.indexOf('js/entities.js'));
  assert.ok(html.indexOf('js/knightfall-expansion.js') < html.indexOf('js/game.js'));
  assert.match(html,/id="touch-controls"/);
  assert.match(html,/id="full-screen"/);
});
