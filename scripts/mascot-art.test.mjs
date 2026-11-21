import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
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

test('legacy optional mascot crew keeps featured artwork without globally replacing the Gothic site theme', () => {
  const gallery = read('public/devil-tools.html');
  const css = read('public/knightfall-section-foundations.css')+'\n'+read('public/knightfall-gothic-chrome.css')+'\n'+read('public/knightfall-illustrated-realms.css')+'\n'+read('public/knightfall-unified-theme.css');
  const nav = read('public/nav.js');
  const theme = read('public/theme.css');
  for (const { id } of characters) {
    assert.ok(gallery.includes("'" + id + "'"), 'creator gallery retains ' + id);
  }
  assert.ok(!existsSync(resolve(root, 'public/gravewave-takeover.js')), 'retired takeover script is gone');
  assert.ok(!existsSync(resolve(root, 'public/gravewave-decor.js')), 'retired decoration injector is gone');
  assert.ok(!nav.includes('/gravewave-takeover.js'), 'approved Gothic theme must not globally inject mascot overlays');
  assert.match(nav, /const target = "\/theme\.css"/, 'canonical theme entrypoint loads');
  assert.match(theme, /knightfall-unified-theme\.css\?v=20261120-tokens2/, 'approved unified Gothic chrome loads through the entrypoint');
  assert.ok(nav.includes('mountApprovedTheme'), 'the shared theme loader is retained');
  assert.ok(nav.includes('document.head.appendChild(link)'), 'approved theme must be mounted after page-specific styles');
  assert.ok(css.includes('.gw-character-crew'), 'obsolete mascot crew overlays are suppressed');
  assert.ok(css.includes('.gw-ambient'), 'obsolete ambient art overlays are suppressed');
  assert.ok(!existsSync(resolve(root, 'public/gravewave-takeover.css')), 'retired global stylesheet stays deleted');
  assert.ok(css.includes('body:not(.profile-custom-theme)'), 'approved site chrome preserves profile customization');
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
  const site = read('public/devil-tools.html');
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
  assert.ok(!existsSync(resolve(root, 'public/gravewave-takeover.js')), 'home no longer injects legacy mascot crew');
});
