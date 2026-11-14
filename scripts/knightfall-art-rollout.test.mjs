import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const manifest=JSON.parse(read('public/assets/knightfall/manifest.json'));
const arcade=read('public/chaos-cartridge.html');
const covers=read('public/knightfall-arcade-covers.js');
const crossing=read('public/arcade/hosted/cinder-crossing/index.html');
const marsh=read('public/arcade/hosted/marshland-marksman/index.html');
const gallery=read('public/creator-art-studio.js');
const foundry=read('public/devil-tools.html');
test('named Knightfall sprite and relic regions stay in atlas boundaries',()=>{
 assert.equal(manifest.sprites.length,16);
 assert.equal(manifest.relics.length,12);
 const ids=new Set();
 for(const item of [...manifest.sprites,...manifest.relics]){
   assert.ok(!ids.has(item.id),'Duplicate '+item.id);ids.add(item.id);
   const {x,y,width,height}=item.atlasRect;
   assert.ok(x>=0&&y>=0&&width>0&&height>0&&x+width<=1448&&y+height<=1086,item.id);
 }
});
test('new arcade cover map uses existing catalog cards and released character names',()=>{
 const ids=new Set([...arcade.matchAll(/data-game-id="([^"]+)"/g)].map(m=>m[1]));
 const characters=new Set(manifest.sprites.map(s=>s.id));
 const mappings=[...covers.matchAll(/^\s*'([^']+)':\['([^']+)','([^']+)'\]/gm)];
 assert.ok(mappings.length>=12);
 for(const [,game,character] of mappings){assert.ok(ids.has(game),game);assert.ok(characters.has(character),character)}
 assert.match(arcade,/knightfall-arcade-covers\.js/);
 assert.match(covers,/art\.manifest\.relics/);
 assert.match(covers,/relics-and-icons\.png/);
});
test('two game skins remain cosmetic with original playable fallbacks',()=>{
 const script=h=>[...h.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).filter(Boolean).at(-1);
 assert.doesNotThrow(()=>new vm.Script(script(crossing)));
 assert.doesNotThrow(()=>new vm.Script(script(marsh)));
 assert.match(crossing,/id="runner-art"/);
 assert.match(crossing,/if\(!hasPremium\)/);
 assert.match(crossing,/function collision\(\)/);
 assert.match(marsh,/id="art-mode"/);
 assert.match(marsh,/if\(artMode==='boneworld'/);
 assert.match(marsh,/score=Math\.max\(0,score\+/);
});
test('Foundry exports individual PNG relics without bypassing upload permissions',()=>{
 assert.match(foundry,/id="kf-art-relic-gallery"/);
 assert.match(gallery,/loadRelicIcons\(\)/);
 assert.match(gallery,/output\.toBlob\(/);
 assert.match(gallery,/api\/devil-tools\/assets/);
 assert.doesNotThrow(()=>new vm.Script(gallery));
 assert.doesNotThrow(()=>new vm.Script(covers.replace(/^import[^\n]*\n/m,'')));
});
