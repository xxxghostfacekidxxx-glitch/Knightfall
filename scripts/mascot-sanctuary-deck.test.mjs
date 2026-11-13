import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const page=src('public/mascot-pets.html');
const room=src('public/mascot-room.html');
const deck=src('public/mascot-sanctuary-deck.js');
const pets=src('public/mascot-pets.js');
const css=src('public/mascot-pets.css');
const roomJs=src('public/mascot-room.js');
const roomCss=src('public/mascot-room.css');
const server=src('backend/src/mascot-pets.js');

test('Sanctuary command deck is loaded and every control has a unique matching ID',()=>{
 for(const id of ['sanctuary-overview','sanctuary-care-type','sanctuary-care-all',
  'pet-collection-search','pet-collection-filter','pet-collection-sort',
  'pet-species-search','pet-species-filter','pet-species-sort',
  'pet-shop-filter','pet-shop-count','pet-adoption-count']){
  assert.equal((page.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'missing or duplicated '+id);
 }
 assert.match(page,/mascot-sanctuary-deck\.js\?v=20261103-sanctuary-deck1/);
 assert.match(page,/mascot-pets\.css\?v=20261103-sanctuary-deck1/);
 assert.ok(page.indexOf('id="my-pets-section"')<page.indexOf('id="sanctuary-expeditions"'),'Pets should be above quest board');
 assert.match(pets,/new CustomEvent\('sanctuary-rendered'/);
 assert.match(deck,/addEventListener\('sanctuary-rendered'/);
});
test('Care-all is a server-authoritative update with per-pet cooldown, account scope and no wallet grant',()=>{
 assert.match(deck,/\/api\/mascot-pets\/care-all/);
 assert.match(deck,/credentials:'include'/);
 assert.match(server,/if\(path==='\/api\/mascot-pets\/care-all'&&request\.method==='POST'\)/);
 assert.match(server,/WHERE user_id=\? AND \('/);
 assert.match(server,/RETURNING id/);
 assert.match(server,/experience=MIN\(experience\+\?,500000\)/);
 assert.doesNotMatch(deck,/localStorage|sessionStorage/);
 assert.doesNotMatch(server,/wallet_balance\s*[+\-]=/);
});
test('Owned, adoption and wardrobe filters are usable and remain hidden on mobile',()=>{
 assert.match(deck,/pet-collection-search/);
 assert.match(deck,/pet-species-search/);
 assert.match(deck,/pet-shop-filter/);
 assert.match(css,/\.pet-grid \.pet-card\[hidden\]\{display:none!important\}/);
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/\.pet-owned-grid\{grid-template-columns:minmax\(0,1fr\)\}/);
 assert.match(css,/\.pet-customize summary:focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
});
test('Companion room displays care feedback and never exposes private stats publicly',()=>{
 assert.match(room,/id="room-companion-summary"/);
 assert.match(room,/mascot-room\.js\?v=20261103-room-care1/);
 assert.match(roomJs,/function syncCareButtons\(\)/);
 assert.match(roomJs,/button\.disabled=visitor\|\|busy\|\|!selected\|\|delay>0/);
 assert.match(roomJs,/if\(!visitor\)\{/);
 assert.match(roomCss,/\.room-need-tag\[data-state="low"\]/);
});

test('public profile shows personalities but never private needs or wallet details',()=>{
 const profile=src('public/profile.html'),client=src('public/profile-mascots.js'),style=src('public/profile-mascots.css');
 assert.match(profile,/profile-mascots\.js\?v=20261113-lineages2/);
 assert.match(profile,/profile-mascots\.css\?v=20261113-lineages2/);
 assert.match(profile,/mascot-renderer\.js\?v=20261113-lineages2/);
 assert.ok(profile.indexOf('/mascot-renderer.js')<profile.indexOf('/profile-mascots.js'),'type renderer loads before profile companions');
 assert.match(client,/pet\.temperament/);
 assert.match(client,/pet\.lore/);
 assert.match(client,/mascot-profile-intro/);
 assert.doesNotMatch(client,/pet\.vitals|pet\.next_care|wallet_balance/);
 assert.match(style,/\.mascot-profile-pet\.featured/);
});

test('Creature Bestiary preserves ownership, filters and all affinities from trusted API',()=>{
 const lineage=src('backend/src/mascot-lineages.js'),engine=src('public/mascot-renderer.js');
 assert.match(page,/id="companion-bestiary"/);
 for(const id of ['pet-bestiary-grid','pet-bestiary-search','pet-bestiary-type','pet-bestiary-status'])assert.match(page,new RegExp('id="'+id+'"'));
 assert.match(pets,/function renderBestiary\(\)/);
 assert.match(pets,/new Map\(pets\.map\(p=>\[p\.species,p\]\)\)/);
 assert.match(pets,/pet\.growth/);
 assert.match(server,/growth:growthFor\(/);
 assert.match(server,/affinity:affinityFor\(id\)\.id/);
 assert.match(lineage,/neon:\{id:'neon'/);
 assert.match(engine,/window\.KnightfallPetRenderer/);
 assert.ok(page.indexOf('/mascot-renderer.js')<page.indexOf('/mascot-pets.js'));
});
