import test from 'node:test';
import vm from 'node:vm';
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
 assert.match(read('assets/knightfall/gothic-chrome-frame.svg'),/<svg\b/);
 assert.ok(sw.includes('/assets/knightfall/gothic-chrome-frame.svg'),'frame SVG is cached for installed apps');
 assert.ok(art.includes('gothic-chrome-frame.svg'),'frame overlays real headers');
 assert.match(read('assets/knightfall/winged-skull-crest.svg'),/<svg\\b/);
 assert.ok(sw.includes('/assets/knightfall/winged-skull-crest.svg'),'approved skull art must be in offline shell');
 assert.ok(art.includes('winged-skull-crest.svg'),'approved skull art must be used on real pages');
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
 const source=read('knightfall-unified-theme.css');
 assert.doesNotMatch(source,/:where\(\.home-intro,\.cartridge-hero\)\s*\{[^}]*\bbackground\s*:/s,'global Gothic palette must not override home artwork');
 assert.ok(art.includes('Account entry is part of Knightfall'),'auth artwork must be integrated');
 assert.match(nav,/knightfall-artwork\.css/);
 assert.match(theme,/knightfall-artwork\.css/);
 assert.match(sw,/knightfall-shell-v52/);
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


test('canonical and hyphenated URLs execute the right realm styling',()=>{
 const start=nav.indexOf('  const mountRealmArtwork = () => {');
 const end=nav.indexOf('  if (document.readyState === "loading")',start);
 assert.ok(start>=0&&end>start,'executable realm selector is present');
 const runtime=nav.slice(start,end)+'\nmountRealmArtwork();';
 const cases=[
  ['/','home'],['/community','madhouse'],['/community-topic','madhouse'],
  ['/chaos-cartridge','arcade'],['/arcade-progress','arcade'],
  ['/devil-tools','foundry'],['/personal-bots','foundry'],['/bots','foundry'],['/creator-studio','foundry'],
  ['/messages','messages'],['/ruinwire','messages'],['/notifications','messages'],['/miss-chaos','messages'],
  ['/moonology','moon'],['/shadow-work','moon'],
  ['/shops','market'],['/shop-builder','market'],['/my-shop','market'],
  ['/members','members'],['/auth','members'],['/profile','members'],
  ['/admin','god'],['/admin.html','god'],['/admin-offline','god'],['/eye-of-horus','god'],['/god-bot-control','god'],
  ['/mascot-pets','pets'],['/mascot-pets.html','pets'],['/mascot-room','pets'],['/mascot-trials','pets'],
  ['/die-ary','diary'],['/memo-pad','diary']
 ];
 const run=(path,hasCanvas=false)=>{
  const hero={dataset:{}},classes=new Set();
  const main={dataset:{},contains:node=>node===hero,querySelector:()=>hasCanvas?{}:null};
  const body={dataset:{},classList:{add:value=>classes.add(value)}};
  const document={body,querySelector:selector=>selector==='main'?main:hero};
  vm.runInNewContext(runtime,{location:{pathname:path},document},{timeout:1000});
  return {body,hero,main,classes};
 };
 for(const [path,realm] of cases){
  const {body,hero}=run(path);
  assert.equal(body.dataset.kfRealm,realm,path+' must map to '+realm);
  if(realm!=='home')assert.equal(hero.dataset.kfArtHero,realm,path+' must mount hero');
 }
 const hosted=run('/arcade/hosted/asteroids/');
 assert.equal(hosted.body.dataset.kfRealm,undefined,'hosted games are excluded');
 const standalone=run('/city-of-cinders',true);
 assert.ok(standalone.classes.has('kf-gameplay-page'),'root-level canvas games are excluded');
 assert.equal(standalone.hero.dataset.kfArtHero,undefined,'game art stays independent');
});
