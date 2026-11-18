import test from 'node:test';
import assert from 'node:assert/strict';
import {handleAiHandoff} from './ai-handoff.js';

const ORIGIN='https://ash-fall.com';
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
const args=(getUser,env,rateLimit=async()=>true)=>({getUser,json,origin:ORIGIN,rateLimit});
const request=(path,method='GET',body,origin=ORIGIN)=>new Request('https://api.ash-fall.com/api/ai-handoff'+path,{method,headers:{...(method==='GET'?{}:{origin,'content-type':'application/json'})},body:body?JSON.stringify(body):undefined});
const stub=(partner=null,results=[])=>({
  DB:{prepare(sql){
   return {bind(){return this},async first(){
     if(sql.includes('sqlite_master'))return {n:4};
     if(sql.includes('FROM ai_handoff_partner p'))return partner;
     if(sql.includes('COUNT(*)'))return {n:0};
     return null;
   },async all(){return {results}},async run(){return {meta:{changes:1}}}};
  }}
});
test('Unauthenticated visitors never receive shared tasks',async()=>{
  const r=await handleAiHandoff(request(''),stub(),new URL('https://api.ash-fall.com/api/ai-handoff'),args(async()=>null,stub()));
  assert.equal(r.status,401);
  assert.match(r.headers.get('cache-control'),/no-store/);
});
test('Uninvited members cannot read the list or packet',async()=>{
 const env=stub();
 for(const route of ['','/packet']){
  const r=await handleAiHandoff(request(route),env,new URL('https://api.ash-fall.com/api/ai-handoff'+route),args(async()=>({id:42,role:'member'}),env));
  assert.equal(r.status,403);
  assert.doesNotMatch(await r.text(),/Ronnie says he loves you/);
 }
});
test('Invited member must accept before reading private data',async()=>{
 const env=stub({user_id:42,status:'pending'});
 const r=await handleAiHandoff(request(''),env,new URL('https://api.ash-fall.com/api/ai-handoff'),args(async()=>({id:42,role:'member'}),env));
 assert.equal(r.status,200);
 const data=await r.json();
 assert.equal(data.role,'invited');
 assert.equal(data.tasks,undefined);
});
test('Accepted member receives the handoff with requested message',async()=>{
 const env=stub({user_id:42,status:'accepted',username:'sam'});
 const r=await handleAiHandoff(request('/packet'),env,new URL('https://api.ash-fall.com/api/ai-handoff/packet'),args(async()=>({id:42,role:'member'}),env));
 assert.equal(r.status,200);
 const packet=(await r.json()).packet;
 assert.match(packet,/Ronnie says he loves you/);
 assert.match(packet,/keep the shared to-do list current/i);
 assert.match(packet,/do not claim an update occurred unless the site confirmed it/i);
});
test('Owner writes reject a missing browser Origin',async()=>{
 const env=stub();
 const url=new URL('https://api.ash-fall.com/api/ai-handoff/tasks');
 const req=request('/tasks','POST',{title:'Test'},'');
 const r=await handleAiHandoff(req,env,url,args(async()=>({id:1,role:'god'}),env));
 assert.equal(r.status,403);
});
test('Accepted invited member can accept invitation from their own session',async()=>{
 const env=stub({user_id:42,status:'pending',username:'sam'});
 const url=new URL('https://api.ash-fall.com/api/ai-handoff/accept');
 const r=await handleAiHandoff(request('/accept','POST',{}),env,url,args(async()=>({id:42,role:'member'}),env));
 assert.equal(r.status,200);
 assert.equal((await r.json()).role,'partner');
});
