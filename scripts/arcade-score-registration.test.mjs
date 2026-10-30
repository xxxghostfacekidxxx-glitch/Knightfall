import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const backend=readFileSync('backend/src/index.js','utf8');
const allowed=new Set(JSON.parse('['+backend.match(/const arcadeGames = new Set\(\[([^\]]+)/)[1]+']'));
const caps=JSON.parse('{'+backend.match(/const arcadeScoreCaps = \{([^}]+)/)[1]+'}');
const catalog=JSON.parse(readFileSync('public/arcade/catalog.json','utf8'));
const bridge=JSON.parse(readFileSync('public/arcade/hosted/account-bridge-manifest.json','utf8'));
test('every declared catalog score identity is registered with a bounded backend score',()=>{
 const ids=new Set(bridge.games.map(g=>g.gameId));
 for(const g of catalog.games){if(!g.route.startsWith('/'))continue;const html=readFileSync('public'+g.route.split(/[?#]/)[0],'utf8');for(const m of html.matchAll(/(?:recordScore\(|recordScore\?\.\(|data-game-id=)["']([^"']+)/g))ids.add(m[1]);}
 assert.ok(ids.size>100);
 for(const id of ids){assert.ok(allowed.has(id),'unregistered score identity: '+id);assert.ok(Number.isFinite(caps[id])&&caps[id]>0,'missing score cap: '+id);}
});
