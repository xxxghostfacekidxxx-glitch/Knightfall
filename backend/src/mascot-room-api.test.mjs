import test from 'node:test';
import assert from 'node:assert/strict';
import {handleMascotRoom,ROOM_DEFAULT} from './mascot-room-api.js';
const url=path=>new URL('https://api.ash-fall.com'+path);
function fake(owner={id:7,nickname:'Gilly'}){
 const statements=[],db={prepare(sql){return{bind(...args){statements.push({sql,args});return{
  first:async()=>sql.includes('SELECT id,nickname FROM mascot_pets')?owner:null,
  run:async()=>({meta:{changes:1}})
 }}}}};
 return {db,statements};
}
const execute=(ctx,method='GET',data,owner)=>handleMascotRoom({
 method,json:async()=>data
},{DB:ctx.db},url('/api/mascot-pets/19/room'),{id:7},
 {json:(body,status=200)=>({body,status}),rateLimit:async()=>true,origin:'https://ash-fall.com'});
test('GET uses account-bound pet lookup and stable room default',async()=>{
 const ctx=fake();const r=await execute(ctx);
 assert.equal(r.status,200);assert.deepEqual(r.body.room,ROOM_DEFAULT);
 assert.deepEqual(ctx.statements[0].args,[19,7]);
});
test('PUT requires bounded integer coordinates and known pose',async()=>{
 const ctx=fake();
 for(const payload of [
  {x:-1,y:65,pose:'idle'}, {x:50,y:120,pose:'idle'},
  {x:24.5,y:65,pose:'idle'}, {x:50,y:65,pose:'unsafe'},
  {x:'50',y:65,pose:'idle'}
 ])assert.equal((await execute(ctx,'PUT',payload)).status,400);
 assert.ok(!ctx.statements.some(x=>x.sql.includes('INSERT INTO mascot_room_layouts')));
 const ok=await execute(ctx,'PUT',{x:35,y:76,pose:'bounce'});
 assert.equal(ok.status,200);assert.equal(ok.body.room.x,35);
 assert.ok(ctx.statements.some(x=>x.sql.includes('ON CONFLICT(pet_id)')));
});
test('Cross-account ownership is denied before writes',async()=>{
 const ctx=fake(null);const r=await execute(ctx,'PUT',{x:40,y:55,pose:'idle'});
 assert.equal(r.status,404);
 assert.equal(ctx.statements.length,1);
});
test('Unknown routes remain delegated to other mascot endpoints',async()=>{
 const ctx=fake();const r=await handleMascotRoom({method:'GET'},{DB:ctx.db},url('/api/mascot-pets/me'),{id:7},
 {json:(body,status=200)=>({body,status}),rateLimit:async()=>true,origin:'https://ash-fall.com'});
 assert.equal(r,null);assert.equal(ctx.statements.length,0);
});
