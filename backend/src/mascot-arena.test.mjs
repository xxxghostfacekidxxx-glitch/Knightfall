import test from 'node:test';
import assert from 'node:assert/strict';
import {ARENA_DAILY_LIMIT,arenaCanEnter,arenaDay,resolveArenaBout} from './mascot-arena.js';

test('arena day is UTC-stable across browser time zones',()=>{
 assert.equal(arenaDay(new Date('2026-11-24T00:10:00-08:00')),'2026-11-24');
});

test('server arena outcomes are deterministic and rewards remain in the allowed cap',()=>{
 for(const pet of [{id:1,species:'boogie',experience:0},{id:83,species:'crush',experience:1600},{id:7,species:'butters',experience:350}]){
  const one=resolveArenaBout(pet,'2026-11-24'),two=resolveArenaBout(pet,'2026-11-24');
  assert.deepEqual(one,two);
  assert.ok(['win','draw','loss'].includes(one.outcome));
  assert.ok([10,20,35].includes(one.xp_reward));
  assert.ok(one.opponent_level>=1);
 }
});

test('arena enforces one entry per pet and three entries per account each day',()=>{
 assert.equal(ARENA_DAILY_LIMIT,3);
 assert.equal(arenaCanEnter(0,false),true);
 assert.equal(arenaCanEnter(1,true),false);
 assert.equal(arenaCanEnter(2,false),true);
 assert.equal(arenaCanEnter(3,false),false);
});
