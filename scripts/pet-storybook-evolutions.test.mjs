import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const read=(name)=>readFileSync(resolve(root,name),'utf8');
const base='public/assets/devil-tools/neon-nuisances/';
const ids=['lydibug','mini-villain','mini-eddie','minion-mouse','boo-thang'];

test('earned pet evolutions use matching storybook characters with individual art',()=>{
 const signatures=new Set();
 for(const id of ids){
  const normal=read(base+id+'.svg');
  const evolved=read(base+'evolutions/'+id+'.svg');
  assert.match(evolved,new RegExp('data-evolution-form="'+id+'"'));
  assert.match(evolved,new RegExp('<title id="'+id+'-title">'));
  assert.match(evolved,new RegExp('<desc id="'+id+'-desc">'));
  assert.match(evolved,/<g class="creature"/);
  assert.match(evolved,/<g class="evolution-rear"/);
  assert.match(evolved,/<g class="evolution-details"/);
  assert.ok(evolved.length>normal.length+600,'evolution must add illustrated details: '+id);
  assert.ok(evolved.includes(normal.match(/<g class="creature"[^>]*>/)[0]),'same silhouette entry point: '+id);
  assert.doesNotMatch(evolved,/<script\b|<foreignObject\b|<image\b|data:image\/|<text\b|https?:\/\/(?!www\.w3\.org\/2000\/svg)/i);
  signatures.add(evolved.match(/<g class="evolution-details"[^>]*>([\s\S]*?)<\/g>/)?.[1]);
 }
 assert.equal(signatures.size,ids.length,'each species must have bespoke art');
});

test('Starborn unlocks and asset URLs remain server controlled',()=>{
 const server=read('backend/src/mascot-pets.js');
 assert.match(server,/const STAR_FORMS=Object.freeze/);
 for(const id of ids)assert.ok(server.includes("'"+id+"':{") || server.includes(id+':{'),'server retains '+id);
 assert.match(server,/const evolvedAsset=id=>/);
 assert.match(server,/\/evolutions\//);
});
