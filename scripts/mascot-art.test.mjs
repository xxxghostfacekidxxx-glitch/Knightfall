import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const rootDir = 'public/assets/devil-tools/neon-nuisances';
const characters = [
  { id: 'minion-mouse', name: 'Minion Mouse' },
  { id: 'mini-villain', name: 'Mini Villain' },
  { id: 'mini-eddie', name: 'The Eddie' },
];
const modes = ['idle', 'blink', 'bounce', 'mischief'];
const manifest = JSON.parse(read(rootDir + '/manifest.json'));

function verifySVG(xml, filename) {
  assert.match(xml, /^<svg\b[^>]+>/, filename + ' is an SVG');
  assert.match(xml.trimEnd(), /<\/svg>$/, filename + ' closes cleanly');
  for (const tag of ['svg', 'g', 'defs', 'linearGradient', 'radialGradient', 'filter', 'title', 'desc', 'style']) {
    const start = (xml.match(new RegExp('<' + tag + '(?=[\\s>])', 'g')) || []).length;
    const end = (xml.match(new RegExp('</' + tag + '>', 'g')) || []).length;
    assert.equal(start, end, filename + ' balanced <' + tag + '> tags');
  }
  assert.doesNotMatch(xml, /<script\b|<foreignObject\b|<image\b/i, filename + ' avoids unsafe embedded content');
  if(xml.includes('class="creature"')){
    assert.match(xml, /<title id="[a-z0-9-]+-title">/, filename + ' has accessible storybook title');
    assert.match(xml, /<desc id="[a-z0-9-]+-desc">/, filename + ' has storybook description');
  }else{
    for (const group of ['character', 'fx', 'eyes', 'lids', 'wink']) assert.ok(xml.includes('id="' + group + '"'), filename + ' has legacy ' + group);
  }
}

test('three upgraded mascots have unique names, lore and correct animated file paths', () => {
  const ids = manifest.characters.map(c => c.id);
  assert.equal(new Set(ids).size, ids.length, 'no duplicate mascot identifiers');
  for (const { id, name } of characters) {
    const mascot = manifest.characters.find(c => c.id === id);
    assert.ok(mascot, id + ' in manifest');
    assert.equal(mascot.name, name);
    assert.ok(mascot.description.length > 60);
    assert.ok(mascot.personality.length > 40);
    assert.ok(mascot.tagline.length > 10);
    assert.ok(mascot.role.length > 10);
    assert.ok(mascot.styleVersion >= 9, 'newer deluxe art versions are compatible');
    assert.equal(mascot.svg, '/assets/devil-tools/neon-nuisances/' + id + '.svg');
    assert.deepEqual(Object.keys(mascot.variants).sort(), modes.slice().sort());
    for (const mode of modes) {
      assert.equal(mascot.variants[mode], '/assets/devil-tools/neon-nuisances/' + id + '-' + mode + '.svg');
    }
  }
});

for (const { id, name } of characters) {
  test(name + ' keeps its storybook master and functional legacy animated variants', () => {
    const base = read(rootDir + '/' + id + '.svg');
    verifySVG(base, id + '.svg');
    assert.ok(base.includes('<title id="' + id + '-title">'), 'master has storybook name');
    assert.match(base, /Knightfall Storybook Edition/);
    for (const mode of modes) {
      const file = id + '-' + mode + '.svg';
      const xml = read(rootDir + '/' + file);
      verifySVG(xml, file);
      if(mode === 'idle') assert.equal(xml, base, file + ' retains the canonical illustrated idle pose');
      else {
        assert.ok(xml.includes('prefers-reduced-motion: no-preference'), file + ' respects reduced motion');
        assert.ok(xml.includes('@keyframes'), file + ' has animation frames');
      }
    }
  });
}

test('site crew has featured trio, preserves other mascots and does not block controls', () => {
  const js = read('public/gravewave-takeover.js');
  const css = read('public/gravewave-takeover.css');
  const nav = read('public/nav.js');
  for (const { id } of characters) {
    assert.ok(js.includes("'" + id + "'"), 'crew includes ' + id);
  }
  assert.ok(js.includes('crewGroups'));
  assert.ok(js.includes('[1,3,12,13,14,16]'), 'home crew displays Gillrot and Nocturnib ahead of trio');
  assert.ok(js.includes("'.svg?v=20261102-mascot6'"), 'new artwork is cache-busted');
  assert.ok(nav.includes('20261102-mascot6'), 'shared nav loads revised assets');
  assert.ok(css.includes('nth-child(n+5){display:none}'), 'mobile crew remains compact');
  assert.ok(css.includes('body:has(canvas)'), 'active games remain unobstructed');
  assert.ok(css.includes('body:has(:fullscreen)'), 'fullscreen views remain unobstructed');
});

test('Devil Tools has working per-character previews and a lore section', () => {
  const html = read('public/devil-tools.html');
  assert.ok(html.includes('item.variants?.[mode]'));
  assert.ok(html.includes('item.personality'));
  assert.ok(html.includes('item.tagline'));
  for (const { id } of characters) {
    assert.ok(html.includes("'" + id + "'"), 'spotlight includes ' + id);
  }
});

test('Madhouse Memory uses the current The Eddie art without changing the legacy ID', () => {
  assert.equal(read('public/arcade/hosted/crypt-pairs/sprites/mini-eddie.svg'), read(rootDir + '/mini-eddie.svg'));
  assert.ok(read('public/arcade/hosted/crypt-pairs/index.html').includes("'The Eddie'"));
});

test('Gillrot and Nocturnib upgraded artwork remains visible and all animated variants exist', () => {
  const gallery = read('public/devil-tools.html');
  const site = read('public/gravewave-takeover.js');
  for (const { id, name } of [{ id: 'bloop', name: 'Gillrot' }, { id: 'nib', name: 'Nocturnib' }]) {
    const mascot = manifest.characters.find(c => c.id === id);
    assert.ok(mascot, name + ' in catalog');
    assert.equal(mascot.name, name);
    assert.ok(mascot.styleVersion >= 7, name + ' upgraded style is preserved');
    const master = read(rootDir + '/' + id + '.svg');
    assert.ok(master.includes(name + ' | Ash-Fall Neon Nuisances'), name + ' keeps upgraded master');
    for (const mode of modes) {
      assert.equal(mascot.variants[mode], '/assets/devil-tools/neon-nuisances/' + id + '-' + mode + '.svg');
      const svg = read(rootDir + '/' + id + '-' + mode + '.svg');
      assert.ok(svg.includes(name + ' · ' + mode + ' | Ash-Fall Neon Nuisances'), name + ' ' + mode + ' is upgraded');
      assert.ok(svg.includes('prefers-reduced-motion'), name + ' ' + mode + ' supports reduced motion');
    }
    assert.ok(gallery.includes("'" + id + "'"), name + ' is spotlighted in Devil Tools');
    assert.ok(site.includes("'" + id + "'"), name + ' is part of the sitewide mascot array');
  }
  assert.ok(site.includes('home?[1,3,14]'), 'both appear in homepage ambient art');
});
