import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {legendaryPairs} from '../public/legendary-pair-scenes.mjs';

const root=new URL('../public/',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const manifest=JSON.parse(read('assets/devil-tools/neon-nuisances/manifest.json'));
const catalog=new Map(manifest.characters.map(c=>[c.id,c]));

test('legendary duo scenes use approved family members and companions',()=>{
 assert.deepEqual(legendaryPairs.map(p=>p.title),['Midnight & Mayhem','Tiny Tyrants']);
 const members=legendaryPairs.flatMap(p=>p.members);
 assert.deepEqual(members.map(m=>m.id),['minion-mouse','boogie','mini-villain','mini-eddie']);
 assert.deepEqual(members.map(m=>m.companionName),['Bubblemaw','Specter','Nox','Ruckus']);
 assert.equal(members.find(m=>m.id==='boogie').tagline,'Too legendary for ordinary.');
 for(const m of members){
  const character=catalog.get(m.id);
  assert.ok(character,'Missing manifest entry '+m.id);
  assert.equal(m.pet,character.svg,'Character asset mismatch: '+m.id);
  assert.equal(m.companion,character.companion.asset,'Companion asset mismatch: '+m.id);
  for(const url of [m.pet,m.companion]){
   assert.match(url,/^\\/assets\\/devil-tools\\/neon-nuisances\\/[a-z0-9\\/-]+\\.svg$/);
   assert.ok(existsSync(new URL('.'+url,root)),'Missing original SVG '+url);
  }
 }
});

test('duo gallery preserves accessible art and explicit scene selection',()=>{
 const html=read('legendary-families.html');
 const renderer=read('legendary-pair-scenes.mjs');
 assert.match(html,/data-preview="boogie-minion"/);
 assert.match(html,/data-preview="villain-eddie"/);
 assert.match(html,/aria-pressed/);
 assert.match(renderer,/mount.alt=/);
 assert.match(renderer,/character.alt=/);
 assert.match(renderer,/addEventListener\\("error",markError\\)/);
});
