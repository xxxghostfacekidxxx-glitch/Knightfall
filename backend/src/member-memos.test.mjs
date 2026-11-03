import test from 'node:test';
import assert from 'node:assert/strict';
import {handleMemberMemos} from './member-memos.js';
const owner={id:37,username:'memento'};
function env(stub,records=[]){
 return {DB:{prepare(sql){return {bind(...args){
  records.push({sql,args});
  const value=()=>stub(sql,args);
  return {first:async()=>value(),all:async()=>value(),run:async()=>value()};
 }}}}};
}
function request(method,body){
 return {method,json:async()=>{if(body===undefined)throw Error('bad JSON');return body}};
}
async function invoke(path,method,body,db,getUser=async()=>owner,rateLimit=async()=>true){
 const json=(value,status=200)=>({status,data:value});
 return handleMemberMemos(request(method,body),db,{pathname:path},{getUser,json,rateLimit,origin:'https://ash-fall.com'});
}
test('memo routes cannot read or mutate records without a signed-in user',async()=>{
 const calls=[],database=env(()=>{throw Error('DB must not be reached')},calls);
 for(const [path,method] of [['/api/memos','GET'],['/api/memos','POST'],['/api/memos/5','PATCH'],['/api/memos/5','DELETE']]){
  const res=await invoke(path,method,{title:'x',body:'y'},database,async()=>null);
  assert.equal(res.status,401);
 }
 assert.equal(calls.length,0);
});
test('list and single memo queries always scope to the account owner',async()=>{
 const calls=[],database=env((sql)=>{
  if(sql.includes('ORDER BY'))return {results:[{id:6,title:'Only mine'}]};
  return {id:6,title:'Only mine'};
 },calls);
 const list=await invoke('/api/memos','GET',null,database);
 assert.equal(list.status,200);assert.equal(list.data.memos.length,1);
 const single=await invoke('/api/memos/6','GET',null,database);
 assert.equal(single.data.memo.id,6);
 assert.ok(calls.every(c=>/user_id=\?/.test(c.sql)));
 assert.ok(calls.every(c=>c.args.includes(owner.id)));
});
test('creation enforces title/text limits, quota and owner insert',async()=>{
 const calls=[],database=env((sql)=>{
  if(sql.includes('COUNT'))return {count:1};
  return {id:4,title:'Idea',body:'Do it'};
 },calls);
 const bad=await invoke('/api/memos','POST',{title:'x'.repeat(101),body:'ok'},database);
 assert.equal(bad.status,400);
 const other=await invoke('/api/memos','POST',{title:'Idea',body:'Do it'},database);
 assert.equal(other.status,201);assert.equal(other.data.memo.id,4);
 const insert=calls.find(x=>x.sql.includes('INSERT INTO member_memos'));
 assert.equal(insert.args[0],owner.id);
 assert.ok(!calls.some(c=>c.sql.includes('INSERT INTO messages')),'Saving a note must never send it');
 const quota=env(sql=>sql.includes('COUNT')?{count:100}:null);
 assert.equal((await invoke('/api/memos','POST',{title:'over',body:'quota'},quota)).status,409);
});
test('updating and deleting a memo never bypass owner filters',async()=>{
 const calls=[],database=env((sql)=>sql.startsWith('UPDATE')?{id:8,title:'Edited',body:'hi'}:{meta:{changes:1}},calls);
 const edited=await invoke('/api/memos/8','PATCH',{title:'Edited',body:'hi'},database);
 assert.equal(edited.data.memo.id,8);
 const removed=await invoke('/api/memos/8','DELETE',null,database);
 assert.equal(removed.data.ok,true);
 for(const item of calls) {
  assert.match(item.sql,/WHERE id=\? AND user_id=\?/);
  assert.equal(item.args.at(-1),owner.id);
 }
});
test('route rejects invalid methods, missing data and throttled writes',async()=>{
 const database=env(()=>({meta:{changes:0}}));
 assert.equal(await handleMemberMemos(request('GET'),database,{pathname:'/api/not-memos'},{getUser:async()=>owner,json:()=>{},rateLimit:async()=>true}),null);
 assert.equal((await invoke('/api/memos/3','POST',{title:'x',body:'b'},database)).status,405);
 assert.equal((await invoke('/api/memos','POST',{title:'x',body:'b'},database,async()=>owner,async()=>false)).status,429);
 assert.equal((await invoke('/api/memos','POST',{title:4,body:'bad'},database)).status,400);
 assert.equal((await invoke('/api/memos/3','DELETE',undefined,database)).status,404);
});
