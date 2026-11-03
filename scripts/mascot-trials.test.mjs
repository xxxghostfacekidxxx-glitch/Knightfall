import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SPECIES_TRIALS,TRIAL_TYPES,challengeFor,memoryDeck,runeSequence,RUNES,seededRng,shuffle} from '../public/mascot-trials-engine.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('all 22 original mascot species have distinct themed trial identities',()=>{
 const manifest=JSON.parse(read('public/assets/devil-tools/neon-nuisances/manifest.json'));
 const expected=new Set(manifest.characters.map(x=>x.id));
 const actual=new Set(Object.keys(SPECIES_TRIALS));
 assert.deepEqual(actual,expected);
 assert.equal(actual.size,22);
 for(const id of actual){
  const c=challengeFor(id,1);
  assert.equal(c.species,id);
  assert.ok(c.title.length>10);
  assert.ok(TRIAL_TYPES.includes(c.mode));
  assert.ok(c.time_limit>=30&&c.time_limit<=65);
 }
 for(const mode of TRIAL_TYPES)assert.ok(Object.values(SPECIES_TRIALS).some(x=>x[0]===mode));
});
test('level scaling never exceeds supported cards, sequences and challenge windows',()=>{
 for(const species of Object.keys(SPECIES_TRIALS)){
  for(const level of [0,1,3,5,19,999]){
   const challenge=challengeFor(species,level);
   assert.ok(challenge.level>=1&&challenge.level<=20);
   assert.ok(challenge.target>=3&&challenge.target<=20);
   if(challenge.mode==='memory')assert.ok(challenge.target<=8);
   if(challenge.mode==='runes')assert.ok(challenge.target<=9);
  }
 }
});
test('haunted memory deck has identical pairs and seeded shuffle is reproducible',()=>{
 const a=memoryDeck(7,seededRng(1907)),b=memoryDeck(7,seededRng(1907));
 assert.deepEqual(a,b);
 assert.equal(a.length,14);
 const counts=new Map();
 for(const item of a)counts.set(item.symbol,(counts.get(item.symbol)||0)+1);
 assert.ok([...counts.values()].every(n=>n===2));
 assert.deepEqual(shuffle([1,2,3],()=>.999),[1,2,3]);
});
test('rune replay sequences stay within the four available symbols',()=>{
 const a=runeSequence(6,seededRng(17)),b=runeSequence(6,seededRng(17));
 assert.deepEqual(a,b);
 assert.equal(a.length,6);
 for(const i of a)assert.ok(Number.isInteger(i)&&i>=0&&i<RUNES.length);
});
test('browser runs four distinct games but awards XP only through authenticated regular Play care',()=>{
 const script=read('public/mascot-trials.js'),html=read('public/mascot-trials.html');
 for(const word of ['memoryTrial','runeTrial','arcadeTrial','requestAnimationFrame','pointerdown','ArrowLeft','ArrowRight'])
  assert.ok(script.includes(word),word);
 assert.match(script,/\/care'/);
 assert.match(script,/JSON\.stringify\(\{action:'play'\}\)/);
 assert.match(script,/credentials:'include'/);
 assert.match(script,/status===429/);
 assert.match(html,/id="trial-companion"/);
 assert.match(html,/type="module" src="\/mascot-trials\.js/);
 assert.doesNotMatch(script,/localStorage\.setItem|UPDATE user_wallets|wallet_ledger|mascot_passport_claims/);
});
