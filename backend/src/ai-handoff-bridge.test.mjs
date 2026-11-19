import test from 'node:test';
import assert from 'node:assert/strict';
import {handleAiHandoffBridge} from './ai-handoff-bridge.js';

const BASE='https://api.ash-fall.com/api/ai-handoff/bridge';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});
const owner={id:1,username:'knightfall',role:'god',status:'active'};
const sam={id:208,username:'knightfallsamantha',role:'admin',status:'active'};
const auth=(getUser=async()=>owner)=>({getUser,json,origin:'https://ash-fall.com',rateLimit:async()=>true});
function request(path,method='GET',payload,token){
 const headers={};
 if(method!=='GET'){headers.Origin='https://ash-fall.com';headers['Content-Type']='application/json'}
 if(token)headers.Authorization='Bearer '+token;
 return new Request(BASE+path,{method,headers,body:payload===undefined?undefined:JSON.stringify(payload)});
}
const secret='kfai_'+ 'a'.repeat(64);
function fakeDB({accepted=true,connection=true,versionConflict=false}={}){
 const calls=[];
 return {calls,prepare(sql){
  const statement={values:[],bind(...values){this.values=values;return this},
   async first(){
    calls.push({sql,values:this.values});
    if(sql.includes("sqlite_master"))return {ok:1};
    if(sql.includes("FROM ai_handoff_partner"))return accepted?{ok:1}:null;
    if(sql.includes("FROM ai_handoff_bridge_keys k JOIN users"))return connection?{id:3,user_id:208,username:sam.username,role:sam.role,status:'active'}:null;
    if(sql.includes("COUNT(*)"))return {n:0};
    if(sql.includes("INSERT INTO ai_handoff_bridge_keys"))return {id:4,label:'Samantha GPT',created_at:'now',expires_at:'future'};
    if(sql.includes("SELECT title,details,status,priority FROM ai_handoff_tasks"))return {title:'Test',details:'',status:'todo',priority:'normal'};
    if(sql.includes("UPDATE ai_handoff_tasks"))return versionConflict?null:{id:5,status:'done',version:2};
    if(sql.includes("INSERT INTO ai_handoff_notes"))return {id:3,body:'Done',category:'update'};
    if(sql.includes("INSERT INTO ai_handoff_tasks"))return {id:5,title:'New',version:1};
    return null;
   },
   async all(){calls.push({sql,values:this.values});return {results:[]}},
   async run(){calls.push({sql,values:this.values});return {meta:{changes:1}}}};
  return statement;
 }};
}
async function invoke(env,route,method='GET',payload,identity=async()=>owner,token){
 const rq=request(route,method,payload,token);
 return handleAiHandoffBridge(rq,env,new URL(rq.url),auth(identity));
}
test('Bearer key is mandatory for all AI assistant snapshot reads',async()=>{
 const env={DB:fakeDB()};
 const result=await invoke(env,'/snapshot');
 assert.equal(result.status,401);
 assert.doesNotMatch(await result.text(),/Ronnie says he loves you/i);
});
test('Key management requires a signed-in user with collaboration permission',async()=>{
 let result=await invoke({DB:fakeDB()},'/keys','GET',undefined,async()=>null);
 assert.equal(result.status,401);
 result=await invoke({DB:fakeDB({accepted:false})},'/keys','GET',undefined,async()=>sam);
 assert.equal(result.status,403);
});
test('Owner can mint a secret shown only once; storage sees digest, not plaintext',async()=>{
 const db=fakeDB();const response=await invoke({DB:db},'/keys','POST',{label:'Samantha GPT'});
 assert.equal(response.status,201);
 const data=await response.json();
 assert.match(data.secret,/^kfai_[a-f0-9]{64}$/);
 assert.ok(db.calls.some(x=>x.sql.includes('INSERT INTO ai_handoff_bridge_keys')));
 assert.equal(db.calls.some(x=>x.values.includes(data.secret)),false);
 assert.ok(db.calls.some(x=>x.values.some(v=>/^[a-f0-9]{64}$/.test(String(v)))),'hash persisted');
});
test('Revoked or unknown bearer keys never receive the shared workspace',async()=>{
 const response=await invoke({DB:fakeDB({connection:false})},'/snapshot','GET',undefined,async()=>null,secret);
 assert.equal(response.status,401);
 assert.equal((await response.json()).tasks,undefined);
});
test('A revoked invitation immediately denies its old GPT key',async()=>{
 const response=await invoke({DB:fakeDB({accepted:false})},'/snapshot','GET',undefined,async()=>null,secret);
 assert.equal(response.status,403);
});
test('Accepted Samantha key can read shared snapshot as Samantha',async()=>{
 const response=await invoke({DB:fakeDB()},'/snapshot','GET',undefined,async()=>null,secret);
 assert.equal(response.status,200);
 assert.equal((await response.json()).account,'knightfallsamantha');
});
test('Version conflict in AI task change fails safely instead of overwriting human edits',async()=>{
 const response=await invoke({DB:fakeDB({versionConflict:true})},'/tasks/5','PATCH',{version:1,status:'done'},async()=>null,secret);
 assert.equal(response.status,409);
 assert.equal((await response.json()).code,'VERSION_CONFLICT');
});
test('AI connection cannot modify tasks without exact revision',async()=>{
 const response=await invoke({DB:fakeDB()},'/tasks/5','PATCH',{status:'done'},async()=>null,secret);
 assert.equal(response.status,400);
});
