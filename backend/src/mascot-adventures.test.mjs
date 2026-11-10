import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MASCOT_SPECIES,petLevel} from './mascot-pets.js';
import {HABITAT_THEMES,HABITAT_DECORATIONS,QUEST_TITLES,questFor,todayUTC,careQuestProgress} from './mascot-adventures.js';

test('every mascot has an original, deterministic story quest',()=>{
 const ids=MASCOT_SPECIES.map(x=>x.id);
 assert.ok(ids.length>=32,'The Crush and Skunk Riot additions must remain in the species roster');
 assert.ok(ids.includes('crush')&&ids.includes('skunk-riot'));
 assert.equal(new Set(ids).size,ids.length);
 assert.deepEqual(new Set(Object.keys(QUEST_TITLES)),new Set(ids));
 for(const id of ids){
  const q=questFor(id,'2026-11-02');
  assert.ok(q.title.length>=3&&q.title.length<=90);
  assert.ok(['feed','play','rest'].includes(q.action));
  assert.deepEqual(q,questFor(id,'2026-11-02'));
 }
 const next=questFor(ids[0],'2026-11-03');
 assert.notEqual(next.action,questFor(ids[0],'2026-11-02').action);
});
test('four vector habitat scenes and three decorative overlays exist and remain free',()=>{
 assert.equal(HABITAT_THEMES.length,4);
 assert.equal(HABITAT_DECORATIONS.length,4);
 for(const x of [...HABITAT_THEMES,...HABITAT_DECORATIONS]){
  if(!x.art)continue;
  assert.match(x.art,/^\/assets\/devil-tools\/neon-nuisances\/habitats\/[a-z-]+\.svg$/);
  const file=new URL('../../public'+x.art,import.meta.url);
  assert.match(readFileSync(file,'utf8'),/<svg/);
 }
 assert.ok(HABITAT_THEMES.every(x=>x.unlock_level<=5));
 assert.ok(petLevel(0)<HABITAT_THEMES.at(-1).unlock_level);
 assert.equal(todayUTC(new Date('2026-11-02T12:05:00.000Z')),'2026-11-02');
});
test('care progress only uses validated care actions and owner-bound quest row',async()=>{
 const calls=[];
 const env={DB:{prepare(sql){return{bind(...args){return{run:async()=>{calls.push({sql,args});return {meta:{changes:1}}}}}}}}};
 await careQuestProgress(env,42,19,'play');
 await careQuestProgress(env,42,19,'spoof');
 assert.equal(calls.length,1);
 assert.match(calls[0].sql,/UPDATE mascot_quest_runs SET progress=1/);
 assert.deepEqual(calls[0].args.slice(0,2),[42,19]);
 assert.equal(calls[0].args[3],'play');
});
test('main API integrates real rescue missions and browser does not store fake awards',()=>{
 const router=readFileSync(new URL('./mascot-pets.js',import.meta.url),'utf8');
 const client=readFileSync(new URL('../../public/mascot-adventures.js',import.meta.url),'utf8');
 assert.match(router,/handleMascotAdventures\(request,env,url,user/);
 assert.match(router,/careQuestProgress\(env,user\.id,id,kind\)/);
 assert.match(client,/credentials:'include'/);
 assert.doesNotMatch(client,/localStorage\.setItem|sessionStorage\.setItem/);
 assert.match(client,/quests\/start/);
 assert.match(client,/eggs\/craft/);
 assert.match(client,/\/hatch/);
});
