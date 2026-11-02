import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const directory='public/assets/devil-tools/neon-nuisances/';
const manifest=JSON.parse(readFileSync(directory+'manifest.json','utf8'));
const names=[['bloop','Gillrot','axolotl'],['nib','Nocturnib','bat']];
const modes=['idle','blink','bounce','mischief'];
test('Both remastered characters keep stable original gallery IDs',()=>{
 assert.ok(manifest.version>=7);
 for(const [id,name,type] of names){
  const item=manifest.characters.find(x=>x.id===id);
  assert.ok(item,id+' exists');assert.equal(item.name,name);assert.equal(item.type,type);
  assert.match(item.personality,/Mischief:/);
  assert.equal(item.svg,'/assets/devil-tools/neon-nuisances/'+id+'.svg');
  for(const mode of modes)assert.equal(item.variants[mode],'/assets/devil-tools/neon-nuisances/'+id+'-'+mode+'.svg');
 }
});
test('Every pose is detailed, standalone, accessible SVG with reduced motion support',()=>{
 const graphics=[];
 for(const [id,name] of names)for(const mode of ['base',...modes]){
  const svg=readFileSync(directory+id+(mode==='base'?'':'-'+mode)+'.svg','utf8');
  assert.match(svg,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 128 128"/);
  assert.match(svg,/<title id="title">/);assert.ok(svg.includes(name));
  assert.match(svg,/<desc id="desc">/);assert.match(svg,/id="mascot"/);
  assert.match(svg,/id="lids"/);assert.match(svg,/id="wink"/);
  assert.ok((svg.match(/<path\b/g)||[]).length>20,'distinct, rich mascot shapes');
  assert.doesNotMatch(svg,/<script|onload=|href="https?:|<foreignObject/i);
  if(mode==='base')assert.doesNotMatch(svg,/<style>/);
  else {assert.match(svg,/@media \(prefers-reduced-motion:no-preference\)/);assert.match(svg,/@keyframes/)}
  graphics.push(svg);
 }
 assert.equal(new Set(graphics).size,10);
 assert.match(graphics[0],/id="left-gills"/);assert.match(graphics[0],/id="right-gills"/);assert.match(graphics[0],/id="tail"/);
 assert.match(graphics[5],/id="wing-left"/);assert.match(graphics[5],/id="wing-right"/);
 assert.doesNotMatch(graphics[5],/id="left-gills"/);
});
test('Devil Tools gallery previews latest version of Gillrot and Nocturnib',()=>{
 const gallery=readFileSync('public/devil-tools.html','utf8');
 assert.match(gallery,/\['bloop','nib'\]\.includes\(item\.id\)/);
 assert.match(gallery,/item\.variants\.idle/);
 assert.match(gallery,/encodeURIComponent\(data\.version\|\|1\)/);
});
