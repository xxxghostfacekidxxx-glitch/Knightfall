import test from 'node:test';
import assert from 'node:assert/strict';
import {FURNITURE,handleMascotFurniture} from './mascot-furniture.js';
const base='https://api.ash-fall.com',context={json:(value,status=200)=>({value,status}),rateLimit:async()=>true,origin:'https://ash-fall.com',petLevel:xp=>1+Math.floor(Math.sqrt((Number(xp)||0)/40))};
function mock(pet={id:9,experience:1500}){
 const queries=[];
 const db={prepare(sql){return{bind(...args){queries.push({sql,args});return{
  first:async()=>sql.includes('SELECT id,experience')?pet:null,
  all:async()=>({results:[]}),
  run:async()=>({meta:{changes:1}})
 }}}}};
 return {db,queries};
}
async function call(ctx,path,method='GET',body,owner=7){
 return handleMascotFurniture({method,json:async()=>body},{DB:ctx.db},new URL(base+path),{id:owner},context);
}
test('catalog has eight first-party SVG furniture pieces and immutable server-side prices',async()=>{
 assert.equal(FURNITURE.length,8);
 assert.equal(FURNITURE.filter(x=>x.cost_cinders===0).length,4);
 for(const item of FURNITURE)assert.match(item.art,/^\/assets\/devil-tools\/neon-nuisances\/furniture\/[a-z_]+\.svg$/);
 const ctx=mock();const r=await call(ctx,'/api/mascot-pets/furniture/catalog');
 assert.equal(r.status,200);assert.equal(r.value.room_limit,8);
});
test('buy binds acting owner, known SKU and price, not untrusted client price',async()=>{
 const ctx=mock();const r=await call(ctx,'/api/mascot-pets/furniture/buy','POST',{key:'glitch_console',cost_cinders:1});
 assert.equal(r.status,201);
 const insert=ctx.queries.find(x=>x.sql.includes('INSERT INTO mascot_room_furniture_purchases'));
 assert.deepEqual(insert.args,[7,'glitch_console',500]);
 assert.equal((await call(ctx,'/api/mascot-pets/furniture/buy','POST',{key:'lantern'})).status,400);
 assert.equal((await call(ctx,'/api/mascot-pets/furniture/buy','POST',{key:'unknown'})).status,400);
});
test('cannot decorate other peoples pets or move outside bounds',async()=>{
 const strangers=mock(null);
 assert.equal((await call(strangers,'/api/mascot-pets/9/furniture','PUT',{key:'lantern',x:50,y:60,flipped:false})).status,404);
 assert.ok(!strangers.queries.some(x=>x.sql.includes('INSERT INTO mascot_room_furniture_placements')));
 const ctx=mock({id:9,experience:0});
 assert.equal((await call(ctx,'/api/mascot-pets/9/furniture','PUT',{key:'neon_throne',x:50,y:60,flipped:false})).status,409);
 assert.equal((await call(ctx,'/api/mascot-pets/9/furniture','PUT',{key:'lantern',x:2,y:60,flipped:false})).status,400);
 assert.equal((await call(ctx,'/api/mascot-pets/9/furniture','PUT',{key:'lantern',x:50,y:60,flipped:true})).status,200);
 const place=ctx.queries.find(x=>x.sql.includes('INSERT INTO mascot_room_furniture_placements'));
 assert.deepEqual(place.args.slice(0,6),[7,9,'lantern',50,60,1]);
});
test('visitor reads cannot use someone else room ID and removing a placement is scoped',async()=>{
 const ctx=mock();
 await call(ctx,'/api/mascot-pets/9/furniture','DELETE',{key:'lantern'});
 const deletion=ctx.queries.find(x=>x.sql.includes('DELETE FROM mascot_room_furniture_placements'));
 assert.deepEqual(deletion.args,[7,9,'lantern']);
 const other=await call(ctx,'/api/mascot-pets/me');
 assert.equal(other,null);
});
