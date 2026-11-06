import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(fileURLToPath(new URL('..', import.meta.url)));
const read=path=>readFileSync(resolve(root,path),'utf8');
const all=JSON.parse(read('public/assets/devil-tools/art-gallery.json'));
const mascots=JSON.parse(read('public/assets/devil-tools/neon-nuisances/manifest.json'));
const validSrc=/^\/(?:assets|icons|branding|admin-offline)\/[a-z0-9/_-]+\.svg$/;

test('Devil Tools indexes all original non-mascot vector groups without broken paths',()=>{
 assert.ok(all.assets.length>=69,'original asset library should include icons, branding and sprites');
 assert.equal(all.count,all.assets.length);
 assert.equal(new Set(all.assets.map(x=>x.src)).size,all.assets.length);
 for(const item of all.assets){
  assert.match(item.src,validSrc,item.title);
  const file='public'+item.src;
  assert.ok(existsSync(resolve(root,file)),item.title+' exists at '+file);
  const source=read(file);
  assert.match(source,/<svg\b/);
  assert.match(source,/\bviewBox=/);
  assert.match(source,/<\/svg>\s*$/);
  assert.ok(item.title&&item.category);
 }
 for(const category of ['Choice Icons','App Icons','Branding','Admin Icon','Arcade Art','Gravewave Effects','Monster Sprites','Miss Chaos']){
  assert.ok(all.assets.some(x=>x.category===category),'gallery category '+category+' is represented');
 }
});

test('Every registered mascot has valid artwork and its supported local animation files',()=>{
 assert.ok(mascots.characters.length>=31,'expanded mascot roster must not lose characters');
 assert.equal(new Set(mascots.characters.map(x=>x.id)).size,mascots.characters.length);
 // These six additions currently ship one idle pose; all other characters retain four.
 const idleOnly=new Set(['lydibug','sootsnoot','rumblefluff','glittergob','craggle','prismare']);
 for(const item of mascots.characters){
  assert.deepEqual(Object.keys(item.variants||{}).sort(),idleOnly.has(item.id)?['idle']:['blink','bounce','idle','mischief'],item.id);
  for(const path of [item.svg,...Object.values(item.variants)]){
   assert.match(path,/^\/assets\/devil-tools\/neon-nuisances\/[a-z0-9-]+\.svg$/);
   const file='public'+path;assert.ok(existsSync(resolve(root,file)),file);
  }
 }
});

test('Madhouse Memory cached sprites match their canonical mascot originals',()=>{
 for(const item of mascots.characters){
  const duplicate='public/arcade/hosted/crypt-pairs/sprites/'+item.id+'.svg';
  if(existsSync(resolve(root,duplicate))){
   assert.equal(read(duplicate),read('public'+item.svg),'stale copy: '+item.id);
  }
 }
});

test('Devil Tools client supports all gallery source families, filters and SVG downloads',()=>{
 const html=read('public/devil-tools.html');
 const js=read('public/devil-tools-vector-gallery.js');
 assert.match(html,/id="dt-vector-library"/);
 assert.match(html,/data-dt-category/);
 assert.match(html,/data-dt-search/);
 assert.match(js,/assets\|icons\|branding\|admin-offline/);
 assert.match(js,/link\.download/);
 assert.match(js,/search\.addEventListener\('input',render\)/);
 assert.match(js,/filter\.addEventListener\('change',render\)/);
});
