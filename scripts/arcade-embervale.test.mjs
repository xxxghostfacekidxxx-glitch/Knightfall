import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const r=p=>readFileSync(p,'utf8');
const dir='public/arcade/hosted/embervale/';
test('Embervale ships complete MIT-licensed game, sprites, soundtrack and touch controls',()=>{
 const html=r(dir+'index.html');
 assert.match(html,/<canvas id="game"/);
 for(const file of ['audio','sprites','world','entities','game','knightfall-touch']){
   assert.match(html,new RegExp('js/'+file+'\\.js'));
   assert.ok(existsSync(dir+'js/'+file+'.js'));
 }
 assert.match(html,/id="touch-controls"/);
 assert.match(html,/data-code="KeyZ"/);
 assert.match(html,/data-code="KeyX"/);
 assert.match(html,/data-code="Enter"/);
 assert.match(r(dir+'js/knightfall-touch.js'),/pointerdown/);
 assert.match(r(dir+'js/game.js'),/window.matchMedia/);
 assert.match(r(dir+'LICENSE'),/MIT License/);
 assert.match(r(dir+'LICENSE'),/Nicholas Aryel Ferreira/);
 assert.match(r(dir+'SOURCE.md'),/Nicholas Aryel Ferreira/);
 const htmlUrls=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]);
 assert.ok(!htmlUrls.some(u=>/^https?:/.test(u)),'Game should have no remote runtime dependencies');
});
test('Embervale appears once in both generated catalogs and preserves source attribution',()=>{
 const c=JSON.parse(r('public/arcade/catalog.json'));
 assert.equal(c.games.filter(g=>g.id==='embervale').length,1);
 assert.equal(c.games.find(g=>g.id==='embervale').device,'touch');
 const m=JSON.parse(r('public/arcade/import-manifest.json'));
 assert.equal(m.imports.find(g=>g.gameId==='cabinet-embervale').license,'MIT');
 for(const page of ['chaos-cartridge.html'])
   assert.equal((r('public/'+page).match(/data-game-id="embervale"/g)||[]).length,1);
});
