import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=name=>readFileSync(root+name,'utf8');
const pages={
  'radius-raid':'#wrap','terravia':'#app','interstellar-armada':'body',
  'single-html-space-shooter':'body','browserquest-solo':'body',
  'openfront-solo':'body','cinder-life':'main','cinder-slots':'main'
};
const source=read('public/arcade/hosted/arcade-playback-assist.js');

test('opt-in hosted arcade pages include shared fullscreen and recovery affordances',()=>{
  for(const [id,target] of Object.entries(pages)){
    const html=read('public/arcade/hosted/'+id+'/index.html');
    const needle='data-target="'+target+'"';
    assert.ok(html.includes(needle),id+' missing its explicit game surface');
    assert.equal((html.match(/arcade-playback-assist\.js/g)||[]).length,1,id+' must only load one assist');
    assert.match(html,/<\/body>/i);
  }
});

test('fullscreen bridge uses a user gesture and restores browser layout on exit',()=>{
  assert.match(source,/button\.addEventListener\('click',async/);
  assert.match(source,/request\.call\(document\.documentElement\)/);
  assert.match(source,/document\.addEventListener\('fullscreenchange',sync\)/);
  assert.match(source,/event\.key==='Escape' && theater/);
  assert.match(source,/requestFullscreen/);
  assert.match(source,/aria-pressed/);
  assert.match(source,/prefers-reduced-motion/);
});

test('fatal load failures offer a retry and arcade return without touching saves',()=>{
  assert.match(source,/window\.addEventListener\('unhandledrejection'/);
  assert.match(source,/webglcontextlost/);
  assert.match(source,/location\.reload\(\)/);
  assert.match(source,/chaos-cartridge\.html/);
  assert.doesNotMatch(source,/localStorage\.clear|indexedDB\.deleteDatabase|sessionStorage\.clear/);
});

test('Neon Surge preserves its built-in fullscreen control and provides a missing-module recovery path',()=>{
  const html=read('public/arcade/hosted/neon-surge/index.html');
  assert.match(html,/id="fsBtn"/);
  assert.match(html,/data-fullscreen="existing"/);
  assert.match(html,/data-ready="__NS"/);
  assert.ok(html.indexOf('arcade-playback-assist.js')<html.indexOf('<script type="module">'));
  assert.match(source,/el\.type==='module'/);
  assert.match(source,/game-boot-timeout/);
});

test('additional full-game pages expose fallback fullscreen without modifying game engines',()=>{
  const extra=[
    ['public/monster-mmo.html','main'],
    ['public/arcade/hosted/mutation-merge/index.html','main'],
    ['public/arcade/hosted/fable-gta/index.html','body'],
    ['public/arcade/hosted/sanctuary-original/sanctuary.html','body'],
    ['public/arcade/hosted/sanctuary-end/sanctuary.html','body']
  ];
  for(const [file,target] of extra){
    const html=read(file);
    assert.ok(html.includes('arcade-playback-assist.js'),file+' lacks fallback loader');
    assert.ok(html.includes('data-target="'+target+'"'),file+' lacks target');
    assert.equal((html.match(/arcade-playback-assist\.js/g)||[]).length,1,file+' duplicate fallback');
  }
});
