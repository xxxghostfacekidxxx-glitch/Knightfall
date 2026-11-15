import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, statSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const read=path=>readFileSync(resolve(root,path),'utf8');
const ids=['lydibug','mini-villain','mini-eddie','minion-mouse','boo-thang','crush','chunky-monkey'];
const base='public/assets/devil-tools/neon-nuisances/';

test('seven featured pet illustrations each have production, idle and portrait assets',()=>{
 assert.equal(ids.length,7);
 for(const id of ids){
  const names=[id+'.svg',id+'-idle.svg','portraits/'+id+'.svg'];
  const illustrations=names.map(n=>read(base+n));
  assert.equal(new Set(illustrations).size,1,id+' asset variants must use a consistent master illustration');
  const svg=illustrations[0];
  assert.ok(statSync(resolve(root,base+names[0])).size>3500,id+' must contain an actual illustrated character');
  assert.match(svg,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 512 512"/);
  assert.match(svg,new RegExp('<title id="'+id+'-title">'));
  assert.match(svg,new RegExp('<desc id="'+id+'-desc">'));
  assert.match(svg,/<g class="creature"/);
  assert.ok((svg.match(/<path /g)||[]).length>=12,id+' should contain illustrated details');
  assert.match(svg,/<feDropShadow/);
  assert.doesNotMatch(svg,/<script\b|<foreignObject\b|<image\b|data:image\/|https?:\/\/(?!www\.w3\.org\/2000\/svg)/i);
 }
});

test('new featured portraits are linked through existing canonical server paths',()=>{
 const server=read('backend/src/mascot-pets.js');
 assert.match(server,/id\+'-idle\.svg'/);
 assert.match(server,/portraits\/'\+id\+'\.svg'/);
 const evolved=server.match(/const evolvedAsset=id=>[^;]+;/)?.[0]||'';
 assert.match(evolved,/\/evolutions\//);
 const clock=read('public/mascot-care-clock.js');
 const context={window:{}};
 vm.runInNewContext(clock,context);
 const src='/assets/devil-tools/neon-nuisances/';
 for(const id of ids){
  const idle=src+id+'-idle.svg';
  for(const pose of ['bounce','blink','mischief'])assert.equal(context.window.KnightfallPetCare.poseAsset(idle,pose),idle,
   id+' should not show incompatible legacy pose graphics');
 }
 assert.equal(context.window.KnightfallPetCare.poseAsset(src+'kiki-idle.svg','bounce'),src+'kiki-bounce.svg',
  'Untouched species still use existing pose animations');
});

test('featured artwork is cache refreshed in Sanctuary, rooms, member profiles and trials',()=>{
 const checks={
  'public/mascot-pets.js':'?v=20261115-storybook1',
  'public/profile-mascots.js':'?v=20261115-storybook1',
  'public/mascot-room.js':'?v=20261115-storybook1',
  'public/mascot-trials.js':'?v=20261115-storybook1',
  'public/mascot-pets.html':'/mascot-pets.js?v=20261115-starforms1',
  'public/mascot-room.html':'/mascot-room.js?v=20261115-starforms1',
  'public/mascot-trials.html':'/mascot-trials.js?v=20261115-starforms1',
  'public/profile.html':'/profile-mascots.js?v=20261115-starforms1'
 };
 for(const [path,expected] of Object.entries(checks))assert.ok(read(path).includes(expected),path+' must load refreshed storybook pet art');
});
