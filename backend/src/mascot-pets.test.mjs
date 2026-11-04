import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MASCOT_SPECIES,SPECIES_PERSONALITIES,petLevel,petVitals,petMood,petBond,serializePet,handleMascotPets} from './mascot-pets.js';

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
 assert.equal(MASCOT_SPECIES.length,28);
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
 const calls=[],db=stub((sql,values)=>{calls.push({sql,values});return sql.includes('FROM mascot_rescue_eggs')?null:sample});
 const invalid=await invoke('/api/mascot-pets/adopt','POST',{species:'../hijack'},db);
 assert.equal(invalid.status,400);
 assert.equal(calls.length,0);
 const adopted=await invoke('/api/mascot-pets/adopt','POST',{species:'bloop',nickname:'Gilly'},db);
 assert.equal(adopted.status,201);
 assert.equal(adopted.data.pet.id,5);
 assert.ok(calls[0].sql.includes('FROM mascot_rescue_eggs'),'check already-incubating eggs before charging');
 const count=calls.find(x=>x.sql.includes('COUNT(*)')&&x.sql.includes('MAX(experience)'));
 assert.equal(count.values[0],owner.id);
 const acquisition=calls.find(x=>x.sql.includes('INSERT INTO mascot_acquisitions'));
 assert.equal(acquisition.values[0],owner.id);
 assert.equal(acquisition.values[3],0,'first rescue uses zero Cinders');
 assert.equal(adopted.data.paid_cinders,0);
});

test('rescuing a species with an incubating earned egg cannot spend Cinders',async()=>{
 const calls=[],db=stub((sql,values)=>{calls.push(sql);return sql.includes('FROM mascot_rescue_eggs')?{id:99}:null});
 const response=await invoke('/api/mascot-pets/adopt','POST',{species:'bloop',nickname:'Egg thief'},db);
 assert.equal(response.status,409);
 assert.match(response.data.error,/incubating/);
 assert.ok(!calls.some(sql=>sql.includes('INSERT INTO mascot_acquisitions')));
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

test('every species has lore and a distinctive temperament with no lost art IDs',()=>{
 assert.equal(Object.keys(SPECIES_PERSONALITIES).length,MASCOT_SPECIES.length);
 for(const species of MASCOT_SPECIES){
  assert.ok(species.temperament&&species.favorite&&species.lore);
  assert.equal(species.temperament,SPECIES_PERSONALITIES[species.id][0]);
 }
});
test('mood, bond and level progress come from server-owned pet vitals and XP',()=>{
 const happy=serializePet({...sample,experience:140,adopted_at:new Date(now).toISOString(),fed_at:new Date(now).toISOString(),played_at:new Date(now).toISOString(),rested_at:new Date(now).toISOString()},now);
 assert.deepEqual(happy.level_progress,{earned:100,needed:120,next_level_xp:160});
 assert.equal(happy.bond.label,'Getting acquainted');
 assert.equal(happy.mood.label,'Thriving');
 assert.equal(petMood({hunger:15,joy:90,energy:95}).id,'hungry');
 assert.equal(petMood({hunger:90,joy:15,energy:95}).id,'bored');
 assert.equal(petMood({hunger:90,joy:90,energy:15}).id,'sleepy');
 assert.equal(petBond(8).id,'inseparable');
 const outsider=serializePet(sample,now,true);
 assert.ok(!('mood' in outsider)&&!('level_progress' in outsider)&&!('vitals' in outsider));
});
test('care-all rejects invalid actions and missing authentication without database writes',async()=>{
 const calls=[],db=stub((sql,values)=>{calls.push(sql);return null});
 const unauth=await invoke('/api/mascot-pets/care-all','POST',{action:'feed'},db,async()=>null);
 assert.equal(unauth.status,401);
 const invalid=await invoke('/api/mascot-pets/care-all','POST',{action:'free-coins'},db);
 assert.equal(invalid.status,400);
 assert.equal(calls.length,0);
});
test('care-all conditionally updates only one owner collection and counts affected pets',async()=>{
 const calls=[];
 const db=stub((sql,values,mode)=>{
  calls.push({sql,values,mode});
  if(sql.includes('UPDATE mascot_pets')&&sql.includes('RETURNING id'))return {results:[{id:5},{id:7}]};
  if(sql.includes('UPDATE mascot_quest_runs'))return {success:true};
  return null;
 });
 const result=await invoke('/api/mascot-pets/care-all','POST',{action:'play'},db);
 assert.equal(result.status,200);
 assert.equal(result.data.cared_for,2);
 assert.equal(result.data.xp_awarded,36);
 const update=calls.find(call=>call.sql.includes('UPDATE mascot_pets'));
 assert.match(update.sql,/played_at IS NULL OR played_at<=\?/);
 assert.match(update.sql,/WHERE user_id=\?/);
 assert.equal(update.values[1],18);
 assert.equal(update.values[2],owner.id);
 const questCalls=calls.filter(call=>call.sql.includes('UPDATE mascot_quest_runs'));
 assert.equal(questCalls.length,2);
 for(const call of questCalls)assert.equal(call.values[0],owner.id);
});
