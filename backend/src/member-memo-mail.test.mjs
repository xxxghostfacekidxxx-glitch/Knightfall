import test from 'node:test';
import assert from 'node:assert/strict';
import {handleMemberMemoMail} from './member-memo-mail.js';
const member={id:5,username:'ember'};
function mockDB(resolve){
 const calls=[];const env={DB:{prepare(sql){return {bind(...params){
  calls.push({sql,params});return {first:async()=>resolve(sql,params,'first'),all:async()=>resolve(sql,params,'all'),run:async()=>resolve(sql,params,'run')};
 }}}}};return {env,calls};
}
function call(path,method,env,{body={},viewer=member,limit=true,notify}={}){
 return handleMemberMemoMail({method,json:async()=>body},env,{pathname:path,searchParams:new URLSearchParams(path.includes('?')?path.split('?')[1]:'')},{
  getUser:async()=>viewer,json:(data,status=200)=>({data,status}),rateLimit:async()=>limit,origin:'https://ash-fall.com',createNotification:notify
 });
}
test('unauthenticated requests cannot query, send, read or archive mail',async()=>{
 const {env,calls}=mockDB(()=>{throw Error('Unexpected DB access')});
 for(const [path,method] of [['/api/memo-mail','GET'],['/api/memo-mail','POST'],['/api/memo-mail/9/read','POST'],['/api/memo-mail/9','DELETE']]){
  const response=await call(path,method,env,{viewer:null});assert.equal(response.status,401);
 }
 assert.equal(calls.length,0);
});
test('received and sent folders always scope to requesting account',async()=>{
 const {env,calls}=mockDB(()=>({results:[]}));
 const inbox=await call('/api/memo-mail','GET',env);
 assert.equal(inbox.status,200);assert.equal(inbox.data.box,'inbox');
 const sent=await call('/api/memo-mail','GET',env);
 assert.equal(sent.data.box,'inbox');
 assert.match(calls[0].sql,/m.recipient_id=\?/);
 assert.equal(calls[0].params[0],member.id);
 assert.ok(!calls[0].sql.includes('m.body LIKE'));
});
test('sending a saved memo enforces ownership, target status and blocking',async()=>{
 const {env,calls}=mockDB((sql)=>{
  if(sql.includes('FROM member_memos'))return {id:7,title:'A memo',body:'Keep this between us.'};
  if(sql.includes('FROM users WHERE username='))return {id:9,username:'friend'};
  if(sql.includes('FROM user_blocks'))return null;
  if(sql.startsWith('INSERT INTO member_memo_mail'))return {id:42,created_at:'2026-11-03'};
  return null;
 });
 const notices=[];
 const ok=await call('/api/memo-mail','POST',env,{body:{memo_id:7,username:'friend'},notify:async(_env,payload)=>notices.push(payload)});
 assert.equal(ok.status,201);assert.equal(ok.data.id,42);
 const ownerSql=calls.find(c=>c.sql.includes('FROM member_memos'));assert.deepEqual(ownerSql.params,[7,member.id]);
 const guard=calls.find(c=>c.sql.includes('FROM user_blocks'));assert.deepEqual(guard.params,[member.id,9,9,member.id]);
 assert.equal(notices.length,1);assert.equal(notices[0].userId,9);
 assert.equal(notices[0].url,'/memo-pad.html?tab=inbox');
 const insert=calls.find(c=>c.sql.startsWith('INSERT INTO member_memo_mail'));
 assert.equal(insert.params[0],member.id);assert.equal(insert.params[1],9);
 assert.ok(!calls.some(c=>c.sql.includes('INSERT INTO messages')),'Do not inject memo into live chats');
});
test('reject missing, self, blocked and invalid memo deliveries without inserting anything',async()=>{
 const missing=mockDB(()=>null);
 assert.equal((await call('/api/memo-mail','POST',missing.env,{body:{memo_id:11,username:'friend'}})).status,404);
 const self=mockDB(sql=>sql.includes('FROM member_memos')?{title:'hi',body:'hey'}:sql.includes('FROM users')?{id:member.id,username:'ember'}:null);
 assert.equal((await call('/api/memo-mail','POST',self.env,{body:{memo_id:11,username:'ember'}})).status,400);
 const blocked=mockDB(sql=>sql.includes('FROM member_memos')?{title:'hi',body:'hey'}:sql.includes('FROM users')?{id:9,username:'friend'}:{blocked:1});
 assert.equal((await call('/api/memo-mail','POST',blocked.env,{body:{memo_id:11,username:'friend'}})).status,403);
 assert.ok(!blocked.calls.some(c=>c.sql.includes('INSERT INTO member_memo_mail')));
 assert.equal((await call('/api/memo-mail','POST',missing.env,{body:{memo_id:'oops',username:'friend'}})).status,400);
 assert.equal((await call('/api/memo-mail','POST',missing.env,{body:{memo_id:11,username:'friend'},limit:false})).status,429);
});
test('read status and archives cannot change someone else’s mail',async()=>{
 const calls=[];const {env}=mockDB((sql,params)=>{
  calls.push({sql,params});
  if(sql.startsWith('UPDATE')&&sql.includes('read_at'))return {id:3,read_at:'2026-11-03'};
  if(sql.startsWith('SELECT id,sender_id'))return {id:4,sender_id:member.id,recipient_id:9};
  return {meta:{changes:1}};
 });
 const seen=await call('/api/memo-mail/3/read','POST',env);
 assert.equal(seen.data.ok,true);assert.match(calls[0].sql,/recipient_id=\?/);
 const removed=await call('/api/memo-mail/4','DELETE',env);
 assert.equal(removed.data.ok,true);
 const archive=calls.find(c=>c.sql.includes('sender_archived_at'));
 assert.match(archive.sql,/sender_id=\?/);assert.equal(archive.params.at(-1),member.id);
});
