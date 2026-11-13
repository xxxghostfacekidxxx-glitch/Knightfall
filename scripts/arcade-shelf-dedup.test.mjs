import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {renderPage} from './build-arcade-catalog.mjs';
const catalog=JSON.parse(readFileSync('public/arcade/catalog.json','utf8'));
test('only Chaos Cartridge is generated from the single source catalog',()=>{
 assert.equal(readFileSync('public/chaos-cartridge.html','utf8'),renderPage(false),'Canonical catalog is stale; run node scripts/build-arcade-catalog.mjs');
 assert.ok(!existsSync('public/arcade-30-games.html'),'Legacy catalog must not be served as a second page');
 const routes=catalog.games.map(g=>g.route),ids=catalog.games.map(g=>g.id);
 assert.equal(new Set(routes).size,routes.length,'duplicate launch targets');
 assert.equal(new Set(ids).size,ids.length,'duplicate game identities');
 assert.ok(routes.length>100,'incomplete catalog');
 for(const g of catalog.games){assert.ok(['games','mini','experiments','external','unavailable'].includes(g.collection));assert.ok(['touch','desktop'].includes(g.device));assert.ok(g.description&&g.genre&&g.title);if(g.route.startsWith('https:'))assert.equal(g.collection,'external');else assert.ok(existsSync('public'+g.route.split(/[?#]/)[0]),g.route);}
});
test('real imports replace misleading shared-cabinet substitutes',()=>{
 assert.ok(!catalog.games.some(g=>g.route.includes('arcade-cabinet.html?')||g.route.includes('ashfall-mini-games.html?')));
 for(const route of ['/arcade/hosted/a-dark-room/index.html','/arcade/hosted/browserquest-solo/index.html','/arcade/hosted/evolution-of-trust/index.html'])assert.ok(catalog.games.some(g=>g.route===route));
 for(const slug of ['dino-run','balloon-pop','hanoi','snek-souls','custom-tetris','hextris','maze-muncher','sokoban','air-hockey','lights-out','whack-a-mole','minesweeper','memory-match','breakout'])assert.ok(!existsSync('public/arcade/hosted/'+slug+'/index.html'),'retired implementation restored: '+slug);
});
