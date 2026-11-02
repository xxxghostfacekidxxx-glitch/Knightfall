import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MASCOT_SPECIES,petLevel,petVitals,serializePet,handleMascotPets} from './mascot-pets.js';

const owner={id:17,username:'test-user',role:'member'};
const now=Date.parse('2026-11-02T20:00:00.000Z');
const sample={id:5,user_id:17,species:'bloop',nickname:'Gilly',adopted_at:'2026-11-01T20:00:00.000Z',fed_at:null,played_at:null,rested_at:null,experience:140,featured:1};
const url=s=>new URL('https://api.ash-fall.com'+s);
const request=(method,payload)=>({method,json:async()=>payload});
const json=(data,status=200)=>({status,data});
const rateLimit=async()=>true;
const stub=(handle)=>({DB:{prepare(sql){return{bind(...values){return{first:()=>handle(sql,values,'first'),all:()=>handle(sql,values,'all'),run:()=>handle(sql,values,'run')}}}}}});
const invoke=(path,method,body,env,getUser=async()=>owner)=>handleMascotPets(request(method,body),env,url(path),{getUser,json,rateLimit,origin:'https://ash-fall.com'});

test('all mascot IDs are unique, safe, first-party and match the real art catalog',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../../public/assets/devil-tools/neon-nuisances/manifest.json',import.meta.url),'utf8'));
 assert.equal(MASCOT_SPECIES.length,22);
 assert.deepEqual(new Set(MASCOT_SPECIES.map(x=>x.id)),new Set(manifest.characters.map(x=>x.id)));
 for(const pet of MASCOT_SPECIES)assert.match(pet.svg,/^\/assets\/devil-tools\/neon-nuisances\/[a-z0-9-]+\.svg$/);
});

test('vitals decay with time but never reach zero; XP progresses consistently',()=>{
 const today=petVitals(sample,now);
 assert.ok(today.hunger<90&&today.joy<90);
 const after=petVitals(sample,now+365*86400000);
 for(const meter of Object.values(after))assert.equal(meter,15);
 assert.equal(petLevel(0),1);
 assert.ok(petLevel(140)>1);
 const publicPet=serializePet(sample,now,true);
 assert.equal(publicPet.nickname,'Gilly');
 assert.equal(publicPet.featured,true);
 assert.ok(!('vitals' in publicPet)&&!('experience' in publicPet));
});

test('catalog is freely discoverable but private collection requires authentication',async()=>{
 const db=stub(()=>{throw Error('Catalog/auth must not query database')});
 const catalog=await invoke('/api/mascot-pets/catalog','GET',null,db,async()=>null);
 assert.equal(catalog.status,200);
 assert.equal(catalog.data.species.length,22);
 assert.equal(catalog.data.max_owned,22);
 assert.equal(catalog.data.accessories.length,12);
 const guest=await invoke('/api/mascot-pets/me','GET',null,db,async()=>null);
 assert.equal(guest.status,401);
});

test('adoption rejects invalid species and uses authenticated owner, capacity and unique checks',async()=>{
 const calls=[],db=stub((sql,values)=>{calls.push({sql,values});return sample});
 const invalid=await invoke('/api/mascot-pets/adopt','POST',{species:'../hijack'},db);
 assert.equal(invalid.status,400);
 assert.equal(calls.length,0);
 const adopted=await invoke('/api/mascot-pets/adopt','POST',{species:'bloop',nickname:'Gilly'},db);
 assert.equal(adopted.status,201);
 assert.equal(adopted.data.pet.id,5);
 assert.ok(calls[0].sql.includes('COUNT(*)')&&calls[0].sql.includes('MAX(experience)'));
 assert.equal(calls[0].values[0],owner.id);
 assert.ok(calls[1].sql.includes('INSERT INTO mascot_acquisitions'));
 assert.equal(calls[1].values[0],owner.id);
 assert.equal(calls[1].values[3],0,'first rescue uses zero Cinders');
 assert.equal(adopted.data.paid_cinders,0);
});

test('other user pet cannot be cared for or renamed',async()=>{
 const calls=[],db=stub((sql,values)=>{calls.push({sql,values});return null});
 const blocked=await invoke('/api/mascot-pets/5/care','POST',{action:'play'},db);
 assert.equal(blocked.status,404);
 assert.deepEqual(calls[0].values,[5,owner.id]);
});

test('cooldowns award experience only in a conditional atomic update',async()=>{
 const calls=[],db=stub((sql,values)=>{calls.push({sql,values});return calls.length===1?sample:{...sample,experience:158,played_at:new Date().toISOString()}});
 const result=await invoke('/api/mascot-pets/5/care','POST',{action:'play'},db);
 assert.equal(result.status,200);
 assert.ok(calls[1].sql.includes('UPDATE mascot_pets SET played_at=?'));
 assert.ok(calls[1].sql.includes('played_at<=?'));
 assert.equal(calls[1].values[1],18);
 assert.equal(calls[1].values[3],owner.id);
});

test('the main Worker route is integrated and generated art is not browser-local ownership',()=>{
 const worker=readFileSync(new URL('./index.js',import.meta.url),'utf8');
 assert.match(worker,/handleMascotPets\(request,env,url/);
 const client=readFileSync(new URL('../../public/mascot-pets.js',import.meta.url),'utf8');
 assert.match(client,/credentials:'include'/);
 assert.doesNotMatch(client,/localStorage\.setItem\(/);
});
