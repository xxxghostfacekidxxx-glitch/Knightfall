import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const source = readFileSync(fileURLToPath(new URL('../public/arcade/hosted/ashfall-mini-games.js', import.meta.url)), 'utf8');
const start = source.indexOf('function validSavedState(saved){');
const end = source.indexOf('async function resume()', start);
assert.ok(start >= 0 && end > start, 'saved-state validator must be a synchronous function');
const validator = source.slice(start, end).trim();

function check(gameId, value) {
  return runInNewContext(`const id = ${JSON.stringify(gameId)}; ${validator}; validSavedState(saved);`, { saved: value });
}

test('invalid or missing saved games are rejected synchronously', () => {
  for (const id of ['particle-clicker', 'cube-composer', 'skifree']) {
    assert.equal(check(id, null), false);
    assert.equal(check(id, []), false);
    assert.equal(check(id, {}), false);
  }
});
test('valid particle, puzzle and slope snapshots pass', () => {
  assert.equal(check('particle-clicker', { particles: 1, rate: 0, scientists: 1 }), true);
  assert.equal(check('cube-composer', { grid: Array.from({length:5}, () => [0,0,0,0,0]) }), true);
  assert.equal(check('skifree', {x:480,y:120,obstacles:[],tokens:[],lives:3}), true);
});
test('invalid nested or non-finite fields fail', () => {
  assert.equal(check('particle-clicker', {particles:'1',rate:0,scientists:1}), false);
  assert.equal(check('cube-composer', {grid:[[1,2,3]]}), false);
  assert.equal(check('skifree', {x:NaN,y:120,obstacles:[],tokens:[],lives:3}), false);
});
