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

test('a new run cancels a pending cloud resume before the save loads', async () => {
  const begin=source.indexOf('async function resume(){');
  const end=source.indexOf('function newPuzzle()',begin);
  assert.ok(begin>=0&&end>begin);
  assert.match(source,/function start\(\)\{resumeRequest\+\+;loopGeneration\+\+;/);
  let release;
  const ready=new Promise(resolve=>{release=resolve});
  let loads=0,localReads=0;
  const context={
    window:{AshFallArcade:{ready,loadProgress:async()=>{loads++;return null}}},
    localStorage:{getItem:()=>{localReads++;return null}},
    status:()=>{}
  };
  runInNewContext(`let resumeRequest=0,loopGeneration=0; ${source.slice(begin,end)}
    globalThis.harness={resume,replaceRun:()=>{resumeRequest++;loopGeneration++;}};`,context);
  const pending=context.harness.resume();
  context.harness.replaceRun();
  release();
  await pending;
  assert.equal(loads,0);
  assert.equal(localReads,0);
});
test('a late cloud response cannot replace a newer run', async () => {
  const begin=source.indexOf('async function resume(){');
  const end=source.indexOf('function newPuzzle()',begin);
  let release;
  const pendingCloud=new Promise(resolve=>{release=resolve});
  let reads=0,events=0;
  const context={
    window:{AshFallArcade:{ready:Promise.resolve(),loadProgress:()=>pendingCloud}},
    localStorage:{getItem:()=>{reads++;return null}},
    document:{dispatchEvent:()=>{events++}},
    status:()=>{}
  };
  runInNewContext(`let resumeRequest=0,loopGeneration=0; ${source.slice(begin,end)}
    globalThis.harness={resume,replaceRun:()=>{resumeRequest++;loopGeneration++;}};`,context);
  const pending=context.harness.resume();
  await Promise.resolve();
  context.harness.replaceRun();
  release({schema:1,game:'particle-clicker',state:{particles:50,rate:0,scientists:0}});
  await pending;
  assert.equal(reads,0);
  assert.equal(events,0);
});

test('offline device resume normalizes legacy prices before restoring', () => {
  const resumeStart=source.indexOf('async function resume(){');
  const resumeEnd=source.indexOf('function newPuzzle()',resumeStart);
  assert.ok(resumeStart>=0&&resumeEnd>resumeStart);
  const resumeSource=source.slice(resumeStart,resumeEnd);
  assert.match(resumeSource,/localStorage\.getItem\("af-mini-"\+id\)/);
  assert.match(resumeSource,/if\(s&&validSavedState\(s\.state\)\)\{state=normalizeSavedState\(s\.state\)/);
});
test('late cloud save hint cannot overwrite a running game or changed resume selection', () => {
  assert.match(source,/s\.schema===1&&s\.game===id&&validSavedState\(s\.state\)&&!running&&resumeRequest===0\)status\("Cloud save available/);
});
