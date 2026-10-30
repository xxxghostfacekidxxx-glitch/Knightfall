import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {renderPage} from './build-arcade-catalog.mjs';
const catalog=JSON.parse(readFileSync('public/arcade/catalog.json','utf8'));
test('both arcade shelves match the single source catalog exactly',()=>{
 for(const [file,secondary] of [['chaos-cartridge.html',false],['arcade-30-games.html',true]])assert.equal(readFileSync('public/'+file,'utf8'),renderPage(secondary),file+' is stale; run node scripts/build-arcade-catalog.mjs');
 const routes=catalog.games.map(g=>g.route),ids=catalog.games.map(g=>g.id);
 assert.equal(new Set(routes).size,routes.length,'duplicate launch targets');
 assert.equal(new Set(ids).size,ids.length,'duplicate game identities');
 assert.ok(routes.length>100,'incomplete catalog');
 for(const g of catalog.games){assert.ok(['games','mini','experiments','external','unavailable'].includes(g.collection));assert.ok(['touch','desktop'].includes(g.device));assert.ok(g.description&&g.genre&&g.title);if(g.route.startsWith('https:'))assert.equal(g.collection,'external');else assert.ok(existsSync('public'+g.route.split(/[?#]/)[0]),g.route);}
});
test('real imports replace misleading shared-cabinet substitutes',()=>{
 assert.ok(!catalog.games.some(g=>g.route.includes('arcade-cabinet.html?')||g.route.includes('ashfall-mini-games.html?')));
 for(const route of ['/arcade/hosted/a-dark-room/index.html','/arcade/hosted/browserquest-solo/index.html','/arcade/hosted/evolution-of-trust/index.html'])assert.ok(catalog.games.some(g=>g.route===route));
 assert.ok(catalog.retiredListings.length>=20);
 for(const slug of ['dino-run','balloon-pop','hanoi','snek-souls','custom-tetris','hextris','maze-muncher','sokoban','air-hockey','lights-out','whack-a-mole','minesweeper','memory-match','breakout'])assert.ok(!existsSync('public/arcade/hosted/'+slug+'/index.html'),'retired implementation restored: '+slug);
});
