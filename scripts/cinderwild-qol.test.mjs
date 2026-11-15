import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

const js = readFileSync('public/arcade/hosted/cinderwild/game.js', 'utf8');
const css = readFileSync('public/arcade/hosted/cinderwild/style.css', 'utf8');
const html = readFileSync('public/arcade/hosted/cinderwild/index.html', 'utf8');

function gameHarness() {
  const drawing = [];
  const ctx = {
    fillStyle: '',
    fillRect(...args) { drawing.push({color: this.fillStyle, args}); },
  };
  const rows = ['mossbit','embercub','minionmouse'].map((id, i) => ({
    dataset: {dexId: id, dexNumber: String(i + 1).padStart(3,'0')}, hidden: false,
  }));
  const nodes = {
    'field-map': {getContext: () => ctx},
    'dex-entries': {querySelectorAll: () => rows},
    'dex-count': {textContent: ''},
    'dex-search': {value: ''},
    'dex-status-filter': {value: 'all'},
  };
  const document = {getElementById: id => nodes[id] ?? null};
  const code = js.replace(/initialize\(\);\s*\}\)\(\);\s*$/, 'globalThis.__game = {drawFieldMap,filterBestiary,state,SPECIES,make,moves};})();');
  assert.notEqual(code, js, 'test harness must intercept game initialization');
  const sandbox = {document, localStorage: {getItem: () => null}};
  vm.runInNewContext(code, sandbox, {timeout: 1000});
  return {game: sandbox.__game, drawing, nodes, rows};
}

test('Cinderwild scripts parse and are linked from the arcade game', () => {
  const syntax = spawnSync(process.execPath, ['--check'], {input: js, encoding: 'utf8'});
  assert.equal(syntax.status, 0, syntax.stderr);
  assert.match(html, /src="\.\/game\.js\?v=20261115-storage"/);
  assert.match(html, /src="\.\/style\.css\?v=20261115-qol"/);
});

test('field map draws every tile, town services, Wardens, three shrines, and player', () => {
  const {game,drawing} = gameHarness();
  game.drawFieldMap();
  assert.ok(drawing.length >= 64 * 38 + 8, 'expected terrain and points of interest');
  assert.ok(drawing.some(rect => rect.color === '#f489ba'), 'uncleared Warden markers');
  assert.ok(drawing.some(rect => rect.color === '#635276'), 'sealed legendary shrines');
  assert.equal(drawing.at(-1).color, '#e14f8c', 'player marker must sit above terrain');
  assert.match(css, /#field-map\{/);
});

test('bestiary filtering does not leak names of unseen creatures', () => {
  const {game,nodes,rows} = gameHarness();
  game.state.seen.push('mossbit');
  game.state.caught.push('mossbit');
  nodes['dex-search'].value = 'embercub';
  game.filterBestiary();
  assert.ok(rows.every(row => row.hidden), 'unknown names must not reveal matching entries');
  nodes['dex-search'].value = 'moss';
  nodes['dex-status-filter'].value = 'caught';
  game.filterBestiary();
  assert.equal(rows[0].hidden, false);
  assert.equal(rows[1].hidden, true);
  assert.match(nodes['dex-count'].textContent, /1 matching/);
  nodes['dex-status-filter'].value = 'missing';
  game.filterBestiary();
  assert.ok(rows.every(row => row.hidden), 'caught creatures must not appear as missing');
  assert.match(css, /\.dex-list \[hidden\]/);
});

test('battle recovery permits selected ally potions and revives', () => {
  assert.match(js, /data-battle-heal/);
  assert.match(js, /data-battle-revive/);
  assert.match(js, /useRevive\(Number\(b\.dataset\.battleRevive\),true\)/);
  assert.match(js, /state\.party\.map\(\(c,i\)=>/);
  assert.match(css, /\.battle-healing/);
});

test('storage never discards the 201st creature and protects shrine legends from release', () => {
  assert.match(js, /state\.party\.length>=6&&state\.box\.length>=200/);
  assert.match(js, /state\.box\.length>=200/);
  assert.match(js, /data-release/);
  assert.match(js, /SHRINES\.some\(shrine=>shrine\.id===creature\.id\)/);
  assert.match(js, /Storage is empty/);
});
