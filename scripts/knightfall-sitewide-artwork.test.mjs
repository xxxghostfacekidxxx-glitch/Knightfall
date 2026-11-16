import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const read = name => readFileSync(new URL('../public/' + name, import.meta.url),'utf8');
const nav=read('nav.js');
const art=read('knightfall-artwork.css');
const theme=read('theme.css');
const sw=read('sw.js');
const headings=[
 ['community.html','class="hero"','madhouse'],
 ['chaos-cartridge.html','class="cartridge-hero"','arcade'],
 ['devil-tools.html','class="hero"','foundry'],
 ['messages.html','class="messages-hero"','messages'],
 ['moonology.html','class="moon-intro"','moon'],
 ['shops.html','class="directory-hero"','market'],
 ['members.html','class="members-hero"','members'],
 ['eye-of-chaos.html','class="chaos-hero"','god'],
 ['mascot-room.html','class="room-intro"','pets'],
 ['die-ary.html','class="diary-hero"','diary']
];

test('Gothic realm illustration files are valid vector resources',()=>{
 for (const [, ,realm] of headings){
  const filename='assets/knightfall/realm-'+realm+'.svg';
  assert.ok(existsSync(new URL('../public/'+filename,import.meta.url)),filename);
  assert.match(read(filename),/<svg\b/);
  assert.match(art,new RegExp('realm-'+realm+'\\.svg'));
  assert.ok(sw.includes('/'+filename),'PWA shell missing '+filename);
 }
 assert.match(read('assets/knightfall/eclipse-cathedral.svg'),/<svg\b/);
});
test('shared nav discovers the actual public page headers',()=>{
 for (const [page,markup,realm] of headings){
  const html=read(page);
  assert.ok(html.includes(markup),page+' missing expected heading');
  assert.match(html,/\/nav\.js/);
  assert.ok(nav.includes(realm+':'),'Missing '+realm+' selector map');
 }
 assert.match(nav,/mountRealmArtwork/);
 assert.match(nav,/arcade\\\/hosted/);
 assert.match(nav,/document\.body\.dataset\.kfRealm/);
});
test('artwork is mounted last, kept in cache, and does not skin private profile themes or gameplay',()=>{
 assert.match(nav,/knightfall-artwork\.css/);
 assert.match(theme,/knightfall-artwork\.css/);
 assert.match(sw,/knightfall-shell-v48/);
 assert.match(sw,/knightfall-artwork\.css/);
 assert.match(art,/profile-custom-theme/);
 assert.match(art,/chaos-glitch-arcade/);
 assert.match(art,/prefers-reduced-motion/);
 assert.match(art,/max-width:700px/);
});
test('homepage artwork includes three primary paths and ecosystem cards',()=>{
 const html=read('index.html');
 for(const link of ['/chaos-cartridge.html','/community.html','/mascot-pets.html'])assert.ok(html.includes(link));
 for(const realm of ['arcade','madhouse','pets','members','foundry','moon'])assert.ok(art.includes('/assets/knightfall/realm-'+realm+'.svg'));
 assert.match(art,/\.home-page \.kf-start-card::after/);
 assert.match(art,/\.home-page \.ecosystem-section \.directory-group::before/);
});


test('secondary public sections use the correct realm instead of generic fallback',()=>{
 const sections=[
  ['mascot-pets.html','sanctuary-header','pets'],
  ['personal-bots.html','bots-hero','foundry'],
  ['bots.html','directory-hero','foundry'],
  ['notifications.html','notifications-hero','messages'],
  ['ruinwire.html','rw-install-hero','messages'],
  ['social.html','social-hero','messages'],
  ['eye-of-horus.html','eye-hero','god'],
  ['shop-builder.html','builder-hero','market']
 ];
 for(const [page,heading,realm] of sections){
  const html=read(page);
  assert.ok(html.includes('class="'+heading+'"'),page+' has a visible masthead');
  assert.ok(html.includes('/nav.js'),page+' loads the shared theme runtime');
  assert.ok(nav.includes('.'+heading),page+' is covered by a realm selector');
  assert.ok(art.includes('body[data-kf-realm="'+realm+'"]'),realm+' has illustration assets');
 }
 assert.ok(nav.includes('main.querySelector("canvas, [data-game-canvas]")'));
 assert.ok(art.includes(':not(.kf-gameplay-page)'));
});
