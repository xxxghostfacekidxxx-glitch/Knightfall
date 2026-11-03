import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {handleMascotAdventures} from './mascot-adventures.js';

const read=path=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const url=path=>new URL('https://api.ash-fall.com'+path);
const json=(data,status=200)=>({data,status});
const rateLimit=async()=>true;
const user={id:17,username:'sanctuary-member'};
const invoke=(env,id,body)=>handleMascotAdventures(
  {method:'PUT',json:async()=>body},env,url('/api/mascot-pets/'+id+'/room'),
  user,{json,rateLimit,origin:'https://ash-fall.com',petLevel:()=>2,speciesCatalog:[]}
);
test('interactive rooms reject out of bounds positions and invalid poses before DB reads',async()=>{
  const db={DB:{prepare(){throw Error('Invalid payload should not query D1')}}};
  for(const item of [
   {x:-1,y:65,pose:'idle'},{x:93,y:65,pose:'idle'},
   {x:50,y:24,pose:'idle'},{x:50,y:86,pose:'idle'},
   {x:50.5,y:65,pose:'idle'},{x:50,y:65,pose:'inject'},
   {x:'50',y:65,pose:'idle'}
  ]){
   const result=await invoke(db,5,item);
   assert.equal(result.status,400,JSON.stringify(item));
  }
});
test('interactive room changes are denied when a pet is owned by another member',async()=>{
  const calls=[];
  const env={DB:{prepare(sql){calls.push(sql);return{bind(...args){
   assert.deepEqual(args,[9,user.id]);
   return{first:async()=>null};
  }}}}};
  const result=await invoke(env,9,{x:52,y:60,pose:'bounce'});
  assert.equal(result.status,404);
  assert.equal(calls.length,1);
  assert.match(calls[0],/user_id=\?/);
});
test('valid room updates always bind authenticated owner and safe integer coordinates',async()=>{
  const seen=[];
  const env={DB:{prepare(sql){return{bind(...args){
   seen.push({sql,args});
   return{first:async()=>({id:9}),run:async()=>({meta:{changes:1}})};
  }}}}};
  const result=await invoke(env,9,{x:64,y:71,pose:'mischief'});
  assert.equal(result.status,200);
  assert.deepEqual(result.data.room,{x:64,y:71,pose:'mischief'});
  assert.match(seen[1].sql,/INSERT INTO mascot_room_layouts/);
  assert.deepEqual(seen[1].args.slice(0,5),[9,user.id,64,71,'mischief']);
});
test('room UI provides keyboard and pointer controls, real server saves, and separate care endpoint',()=>{
 const js=read('public/mascot-room.js');
 const html=read('public/mascot-room.html');
 assert.match(js,/setPointerCapture/);
 assert.match(js,/ArrowLeft/);
 assert.match(js,/\/room'/);
 assert.match(js,/\/habitat'/);
 assert.match(js,/\/care'/);
 assert.match(js,/credentials:'include'/);
 assert.doesNotMatch(js,/localStorage\.setItem/);
 assert.match(html,/id="room-stage"/);
 assert.match(html,/id="room-save"/);
});

test('public visits use privacy-aware profile endpoint and disable all room editing',()=>{
 const client=read('public/mascot-room.js'),profile=read('public/profile-mascots.js');
 assert.match(client,/\/api\/mascot-pets\/profile\//);
 assert.match(client,/if\(visitor\|\|!selected\|\|busy/);
 assert.match(client,/document\.querySelector\('\.room-controls'\)/);
 assert.match(client,/avatar\.tabIndex=-1/);
 assert.match(profile,/mascot-room\.html\?user=/);
 assert.match(profile,/pet\.id/);
});
test('room scene preserves the pet and account-owned cosmetic overlay layering',()=>{
 const html=read('public/mascot-room.html'),js=read('public/mascot-room.js'),css=read('public/mascot-room.css');
 assert.match(html,/id="room-outfit"/);
 assert.match(js,/renderOutfit\(\)/);
 assert.match(js,/selected\?\.equipment/);
 assert.match(js,/accessories/);
 assert.match(css,/room-outfit/);
 assert.match(css,/\[hidden\]\{display:none!important\}/);
});

test('public pet room tours show owner-placed furniture without exposing controls',()=>{
 const client=read('public/mascot-room.js');
 const server=read('backend/src/mascot-pets.js');
 assert.match(client,/renderVisitorFurniture\(\)/);
 assert.match(client,/selected\?\.furniture/);
 assert.match(client,/if\(!visitor\)/);
 assert.match(client,/room-visitor-furniture/);
 assert.match(server,/mascot_room_furniture_placements WHERE user_id=\?/);
 assert.match(server,/furniture:\(furniture\.results\|\|\[\]\)/);
});
