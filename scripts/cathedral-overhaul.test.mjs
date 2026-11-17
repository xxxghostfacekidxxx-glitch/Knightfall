import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const read=(p)=>readFileSync(new URL('../public/'+p,import.meta.url),'utf8');
const chrome=read('knightfall-unified-theme.css');
const theme=read('theme.css');
const nav=read('nav.js');
const sw=read('sw.js');

test('stained glass has one owner and realm artwork remains in the cascade',()=>{
 const requiem=read('knightfall-requiem.css');
 const shared=read('knightfall-unified-theme.css');
 assert.ok(!chrome.includes('height:52px;width:min(640px,88%)'),'Old tiny cathedral divider must stay deleted');
 assert.ok(!shared.includes(':where(.home-intro,.cartridge-hero)::after'),'Legacy crest cannot occupy the glass pseudo element');
 assert.ok(!requiem.includes('REQUIEM STAINED-GLASS CASCADE REPAIR'),'No layered emergency repair');
 assert.ok(requiem.includes('sanctum-stained-glass.svg'));
 assert.ok(requiem.includes('var(--kf-start-art'));
 assert.ok(requiem.includes('rose-window.svg'));
});
test('Sanctum luminous stained glass is visible, accessible and installed offline',()=>{
 const art=read('assets/knightfall/sanctum-stained-glass.svg');
 const visual=read('knightfall-requiem.css');
 assert.match(art,/<svg[^>]*viewBox=/);
 assert.match(art,/<title/);
 assert.match(art,/lancet windows/);
 assert.match(visual,/sanctum-stained-glass\.svg/);
 assert.match(sw,/sanctum-stained-glass\.svg/);
});
test('Cathedral Ascendant ships real original illustration assets and readable markup',()=>{
 for(const asset of ['obsidian-cathedral.svg','ceremonial-divider.svg','rose-window.svg','vaulted-cathedral.svg']){
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
 assert.match(nav,/theme\.css\?v=20261116-cascade4/);
 assert.ok(theme.includes('"/knightfall-unified-theme.css?v=20261116-cascade4"'),'Cathedral architecture must ship through canonical CSS');
 assert.match(sw,/knightfall-shell-v70/);
 assert.ok(sw.includes('"/knightfall-unified-theme.css"'),'Canonical shared chrome must be cached');
 assert.ok(chrome.indexOf("CATHEDRAL ARCHITECTURE")>chrome.indexOf("ORIGINAL ARTWORK") && theme.indexOf("knightfall-requiem.css")>theme.indexOf("theme-crew.css"),"Architecture follows original artwork, and Requiem follows reversible presets");
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
 assert.doesNotMatch(chrome,/\[hidden\]\s*\{\s*display\s*:(?!none\b)/i,'Must never override hidden staff controls with a visible display value');
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
test('three illustrated public gateways are real local assets and remain available offline',()=>{
 for(const part of ['arcade','madhouse','pets']){
  const file='assets/knightfall/gateway-'+part+'.svg';
  assert.ok(existsSync(new URL('../public/'+file,import.meta.url)),file+' exists');
  assert.match(read(file),/<svg\s+[^>]*viewBox=/,file+' is scalable');
  assert.ok(chrome.includes('/assets/knightfall/gateway-'+part+'.svg'),'Site uses '+part+' illustration');
  assert.ok(sw.includes('/assets/knightfall/gateway-'+part+'.svg'),'PWA caches '+part+' illustration');
 }
 assert.ok(read('index.html').includes('class="kf-start-grid"'),'Visible home entry card grid exists');
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

test('authenticated Foundry hides functional public previews without touching staff access',()=>{
 const markup=read('devil-tools.html');
 assert.ok(markup.includes('id="foundry-public-preview"'));
 assert.ok(markup.includes('id="workshop" class="hidden"'));
 for(const path of ['/chaos-cartridge.html','/community.html','/mascot-pets.html'])assert.ok(markup.includes('href="'+path+'"'));
 assert.ok(chrome.includes('body:has(#workshop:not(.hidden)) #foundry-public-preview{display:none!important}'));
});

test('Ascendant II exposes real functional portal routes and architectural art',()=>{
 const home=read('index.html');
 assert.match(home,/class="kf-realm-atlas"/);
 for(const href of ['/messages.html','/devil-tools.html','/moonology.html','/shops.html'])assert.ok(home.includes('href="'+href+'"'),'real destination missing: '+href);
 for(const key of ['.kf-atlas-grid','.kf-atlas-card','.kf-atlas-copy a','kf-rose-art','kf-vault-art'])assert.ok(chrome.includes(key),'visual treatment missing '+key);
 assert.match(chrome,/@media\(max-width:650px\)/);
 assert.match(chrome,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(chrome,/\.kf-atlas-card\s*\{[^}]*pointer-events:none/s,'portal cards must remain clickable');
});

test('formerly skipped staff and member interfaces have real style targets',()=>{
 for(const selector of ['.chaos-card','.chaos-panel','.admin-panel','.directory-toolbar','.shop-filters','.builder-panel','.compose-dialog','.moon-current','.diary-card','.sanctuary-directory','.foundry-input']){
  assert.ok(chrome.includes(selector),selector+' is still present and styled');
 }
 assert.ok(chrome.includes('ASCENDANT III'));
 assert.ok(chrome.includes(':not(.profile-custom-theme)'));
 assert.doesNotMatch(chrome,/\.chat-bubble\s*\{[^}]*background/i,'message bubbles are not overpainted');
});


test('offline fallback screens preserve Gothic cathedral art without network-dependent runtimes',()=>{
 for(const file of ['offline.html','personal-bots-offline.html']){
  const page=read(file);
  assert.match(page,/data-kf-theme="cathedral"/);
  assert.match(page,/data-kf-realm="(?:general|foundry)"/);
  assert.match(page,/assets\/knightfall\/rose-window\.svg/);
  assert.match(page,/assets\/knightfall\/vaulted-cathedral\.svg/);
  assert.doesNotMatch(page,/theme-crew-runtime\.js/);
 }
});
