import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const page = readFileSync(fileURLToPath(new URL('../public/arcade/hosted/sanctuary-original/sanctuary.html', import.meta.url)), 'utf8');

test('Sanctuary registers its Three.js import map before preloading modules', () => {
  const maps = [...page.matchAll(/<script\s+type="importmap">([\s\S]*?)<\/script>/g)];
  assert.equal(maps.length, 1, 'exactly one import map required');
  const mapStart = maps[0].index;
  const preloadStart = page.indexOf('<link rel="modulepreload"');
  const gameModuleStart = page.indexOf('<script type="module">');
  assert.ok(mapStart < preloadStart && preloadStart < gameModuleStart,
    'import map must precede module preloads and module scripts');
  const map = JSON.parse(maps[0][1]);
  assert.equal(map.imports['three/webgpu'], './vendor/three-0.184.0/build/three.webgpu.js');
  assert.equal(map.imports['three/tsl'], './vendor/three-0.184.0/build/three.tsl.js');
  assert.equal(map.imports['three/addons/'], './vendor/three-0.184.0/examples/jsm/');
  assert.match(page, /import \* as THREE_NS from 'three\/webgpu'/);
  assert.match(page, /window\.THREE\s*=\s*Object\.assign/);
});
