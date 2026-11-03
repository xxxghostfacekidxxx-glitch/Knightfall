import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {passportOverview,publicPassportBadges,handleMascotPassport} from './mascot-passport.js';

function mock(){
 const calls=[];
 const definitions=[
  {badge_id:'first_friend',title:'First Little Monster',description:'Adopt one',metric:'pets',target:1,reward_cinders:100},
  {badge_id:'misfit_trio',title:'Misfit Trio',description:'Collect three',metric:'pets',target:3,reward_cinders:200}
 ];
 return {calls,env:{DB:{prepare(sql){return{bind(...args){calls.push({sql,args});return{
  first:async()=>sql.includes('COUNT(*)')?{count:sql.includes('FROM mascot_pets')?2:0}:definitions[0],
  all:async()=>({results:sql.includes('FROM mascot_passport_badges ORDER BY')?definitions:[]}),
  run:async()=>({meta:{changes:1}})
 }}},all:async()=>({results:definitions})}}}}};
}
test('Passport progress comes from authenticated D1 data and matches thresholds',async()=>{
 const {env,calls}=mock();
 const report=await passportOverview(env,9);
 assert.equal(report.badges.length,2);
 assert.equal(report.badges[0].progress,2);
 assert.equal(report.badges[0].unlocked,true);
 assert.equal(report.badges[1].unlocked,false);
 assert.ok(calls.every(c=>c.args[0]===9));
});
test('Claim route binds the acting user and never reads a client-supplied reward',async()=>{
 const {env,calls}=mock();
 const context={json:(payload,status=200)=>({payload,status}),rateLimit:async()=>true,origin:'https://ash-fall.com'};
 const path=new URL('https://api.ash-fall.com/api/mascot-pets/passport/first_friend/claim');
 const result=await handleMascotPassport({method:'POST'},env,path,{id:9},context);
 assert.equal(result.status,201);
 assert.equal(result.payload.reward_cinders,100);
 const write=calls.find(x=>x.sql.includes('INSERT INTO mascot_passport_claims'));
 assert.deepEqual(write.args,[9,'first_friend']);
});
test('Profile badges come from the current owner and never return other members',async()=>{
 const {env,calls}=mock();
 const badges=await publicPassportBadges(env,7);
 assert.deepEqual(badges,[]);
 assert.equal(calls.at(-1).args[0],7);
});
test('Frontend only calls authenticated endpoints and does not fabricate reward states',()=>{
 const js=readFileSync(new URL('../../public/mascot-passport.js',import.meta.url),'utf8');
 assert.match(js,/credentials:'include'/);
 assert.match(js,/mascot-pets\/passport/);
 assert.doesNotMatch(js,/localStorage\.setItem|window\.wallet_balance=/);
});
