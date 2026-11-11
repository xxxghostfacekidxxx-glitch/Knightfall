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

test('legacy Cinder Collider saves rebuild missing upgrade prices', () => {
  const begin = source.indexOf('function normalizeSavedState(saved){');
  const end = source.indexOf('async function resume()', begin);
  assert.ok(begin >= 0 && end > begin, 'normalization must exist before resume');
  const normalize = source.slice(begin, end);
  const legacy = {particles:500, rate:0, scientists:2, upgrades:1, clicks:100};
  const result = runInNewContext(`const id = "particle-clicker"; ${normalize}; normalizeSavedState(saved);`, {saved:legacy});
  assert.equal(result.particles, 500, 'progress must be preserved');
  assert.equal(result.upgrades, 1);
  assert.equal(result.scientists, 2);
  assert.equal(result.ratePrice, Math.ceil(50 * 1.65));
  assert.equal(result.autoPrice, Math.ceil(120 * 1.8 ** 2));
});
test('new purchase prices survive save normalization without being reset', () => {
  const begin = source.indexOf('function normalizeSavedState(saved){');
  const end = source.indexOf('async function resume()', begin);
  const normalize = source.slice(begin, end);
  const result = runInNewContext(`const id = "particle-clicker"; ${normalize}; normalizeSavedState(saved);`, {saved:{particles:500, rate:0, scientists:1, upgrades:2, ratePrice:138, autoPrice:216}});
  assert.equal(result.ratePrice, 138);
  assert.equal(result.autoPrice, 216);
});
