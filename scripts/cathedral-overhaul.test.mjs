import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const read=(p)=>readFileSync(new URL('../public/'+p,import.meta.url),'utf8');
const chrome=read('knightfall-cathedral-v2.css');
const theme=read('theme.css');
const nav=read('nav.js');
const sw=read('sw.js');

test('Cathedral Ascendant ships real original illustration assets and readable markup',()=>{
 for(const asset of ['obsidian-cathedral.svg','ceremonial-divider.svg']){
  const p='assets/knightfall/'+asset;
  assert.ok(existsSync(new URL('../public/'+p,import.meta.url)),p+' must exist');
  const svg=read(p);
  assert.match(svg,/<svg\s+[^>]*viewBox="/,p+' needs a scalable viewBox');
  assert.match(svg,/<title[^>]*>/,p+' needs an accessible title');
  assert.ok(svg.length>1200,p+' must contain meaningful original art');
  assert.ok(chrome.includes('/assets/knightfall/'+asset),p+' is used by real screens');
  assert.ok(sw.includes('/assets/knightfall/'+asset),p+' must be installed in the app shell');
 }
});
test('final cathedral stylesheet mounts on every themed page and refreshes the installed app',()=>{
 assert.match(nav,/knightfall-cathedral-v2\.css\?v=20261116-cathedral2/);
 assert.match(theme,/@import url\("\/knightfall-cathedral-v2\.css\?v=20261116-cathedral2"\)/);
 assert.match(sw,/knightfall-shell-v55/);
 assert.match(sw,/"\/knightfall-cathedral-v2\.css"/);
 assert.ok(nav.indexOf('["knightfall-cathedral-v2"')>nav.indexOf('["knightfall-artwork"'),
  'Cathedral art must win over legacy artwork without changing the original theme');
});
test('gothic presentation is accessible and does not touch game canvases or selected profile themes',()=>{
 assert.match(chrome,/:not\(\.kf-gameplay-page\)/);
 assert.match(chrome,/:not\(\.chaos-glitch-arcade\)/);
 assert.match(chrome,/:not\(\.profile-custom-theme\)/);
 assert.match(chrome,/:not\(:has\(#profile\[data-theme\]\)\)/);
 assert.match(chrome,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(chrome,/@media\(forced-colors:active\)/);
 assert.match(chrome,/:focus-visible/);
 assert.doesNotMatch(chrome,/canvas\s*\{|\.game-renderer\s*\{/i,'Must not recolor game rendering');
 assert.doesNotMatch(chrome,/\[hidden\]\s*\{\s*display\s*:/i,'Must not reveal hidden staff content');
});
test('core public sections and restricted consoles have dedicated frame and panel styling',()=>{
 for(const name of ['home','madhouse','arcade','foundry','messages','moon','market','members','god','pets','diary']){
  assert.ok(chrome.includes('body[data-kf-realm="'+name+'"]'),name+' needs its own colors or art');
 }
 for(const selector of ['.kf-start-here','.home-activity','.community-directory .category',
  '.cartridge-cabinet','.foundry-card','.messages-layout','.sanctuary-command-deck','.eye-panel']){
  assert.ok(chrome.includes(selector),selector+' must be styled through shared art layer');
 }
 assert.ok(chrome.includes('winged-skull-crest.svg'),'Approved original crest must be retained');
 assert.ok(chrome.includes('obsidian-cathedral.svg'),'Cathedral illustration must appear in the homepage');
});
test('style source keeps balanced declarations and no unsupported remote assets',()=>{
 const stripped=chrome.replace(/\/\*[\s\S]*?\*\//g,'').replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,'');
 let depth=0;
 for(const char of stripped){
  if(char==='{')depth++;
  if(char==='}')depth--;
  assert.ok(depth>=0,'Unexpected closing CSS brace');
 }
 assert.equal(depth,0,'Unbalanced Gothic CSS rules');
 assert.doesNotMatch(chrome,/@import\s+url\(https?:/i);
 assert.doesNotMatch(chrome,/url\(["']?https?:/i);
});
