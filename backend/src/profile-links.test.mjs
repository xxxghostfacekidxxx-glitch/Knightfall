import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProfileLinks,handleProfileLinks} from './profile-links.js';
const owner={id:13,username:'archivist',role:'member'};
const visitor={id:17,username:'friend',role:'member'};
function mockDB(reply){
 const calls=[],batchCalls=[];
 const env={DB:{
  prepare(sql){return {bind(...args){const call={sql,args};calls.push(call);return {...call,first:async()=>reply(sql,args),all:async()=>reply(sql,args)};}}},
  batch:async statements=>{batchCalls.push(statements);return statements.map(()=>({success:true}))}
 }};
 return {env,calls,batchCalls};
}
const json=(data,status=200)=>({data,status});
async function invoke(path,method,env,{user=owner,body,limit=true,moderator=false}={}){
 return handleProfileLinks({method,json:async()=>body},env,new URL('https://api.ash-fall.com'+path),{
  getUser:async()=>user,json,rateLimit:async()=>limit,isModerator:()=>moderator,origin:'https://ash-fall.com'
 });
}
test('Link Hub requires account authentication to read owner links or change them',async()=>{
 const db=mockDB(()=>{throw Error('No DB reads')});
 assert.equal((await invoke('/api/profile/links','GET',db.env,{user:null})).status,401);
 assert.equal((await invoke('/api/profile/links','PUT',db.env,{user:null,body:{links:[]}})).status,401);
 assert.equal(db.calls.length,0);
});
test('HTTPS only and bounded validated titles and URLs, never script or embedded credentials',()=>{
 assert.deepEqual(normalizeProfileLinks([]),[]);
 assert.deepEqual(normalizeProfileLinks([{label:'My music',url:'https://example.com/my-music'}]),[{label:'My music',url:'https://example.com/my-music'}]);
 for(const links of [
  [{label:'Bad protocol',url:'javascript:alert(1)'}],
  [{label:'No HTTP',url:'http://example.com'}],
  [{label:'Secret',url:'https://user:pass@example.com'}],
  [{label:'',url:'https://example.com'}],
  [{label:'z'.repeat(51),url:'https://example.com'}],
  [{label:'B'.repeat(20),url:'https://'+('a'.repeat(503))+'.com'}],
  Array.from({length:9},(_,i)=>({label:'L'+i,url:'https://example.com'})),
  [{label:'Break\nline',url:'https://example.com'}]
 ])assert.equal(normalizeProfileLinks(links),null,'Bad links should be rejected');
});
test('PUT replaces only caller-owned links in one transactional batch',async()=>{
 const db=mockDB(()=>null);
 const response=await invoke('/api/profile/links','PUT',db.env,{body:{links:[{label:'Tattoo work',url:'https://example.com/art'},{label:'Albums',url:'https://example.com/music'}]}});
 assert.equal(response.status,200);assert.equal(response.data.links.length,2);
 assert.equal(db.batchCalls.length,1);
 assert.equal(db.batchCalls[0].length,3);
 assert.match(db.batchCalls[0][0].sql,/DELETE FROM member_profile_links WHERE user_id=\?/);
 assert.deepEqual(db.batchCalls[0][0].args,[owner.id]);
 for(const stmt of db.batchCalls[0].slice(1))assert.equal(stmt.args[0],owner.id);
});
test('invalid updates and throttling never delete existing links',async()=>{
 const db=mockDB(()=>null);
 assert.equal((await invoke('/api/profile/links','PUT',db.env,{body:{links:[{label:'Unsafe',url:'http://not-secure.test'}]}})).status,400);
 assert.equal((await invoke('/api/profile/links','PUT',db.env,{body:{links:[]},limit:false})).status,429);
 assert.equal(db.batchCalls.length,0);
});
test('GET owner list returns only their ordered links',async()=>{
 const db=mockDB(sql=>sql.includes('FROM member_profile_links')?{results:[{position:0,label:'Tattoo',url:'https://example.com'}]}:null);
 const r=await invoke('/api/profile/links','GET',db.env);
 assert.equal(r.status,200);assert.deepEqual(r.data.links,[{label:'Tattoo',url:'https://example.com'}]);
 assert.deepEqual(db.calls[0].args,[owner.id]);
 assert.match(db.calls[0].sql,/ORDER BY position ASC/);
});
test('public links obey private, friends-only and mutual account blocks',async()=>{
 const factory=(visibility,{accepted=false,blocked=false}={})=>mockDB(sql=>{
  if(sql.includes('FROM users'))return {id:owner.id,profile_visibility:visibility};
  if(sql.includes('FROM user_blocks'))return blocked?{id:1}:null;
  if(sql.includes('FROM friend_requests'))return accepted?{id:1}:null;
  if(sql.includes('FROM member_profile_links'))return {results:[{position:0,label:'Art',url:'https://example.com'}]};
  return null;
 });
 assert.equal((await invoke('/api/profile/links?username=archivist','GET',factory('private').env,{user:visitor})).status,404);
 assert.equal((await invoke('/api/profile/links?username=archivist','GET',factory('friends').env,{user:null})).status,401);
 assert.equal((await invoke('/api/profile/links?username=archivist','GET',factory('friends').env,{user:visitor})).status,403);
 assert.equal((await invoke('/api/profile/links?username=archivist','GET',factory('friends',{accepted:true}).env,{user:visitor})).status,200);
 assert.equal((await invoke('/api/profile/links?username=archivist','GET',factory('public',{blocked:true}).env,{user:visitor})).status,403);
 assert.equal((await invoke('/api/profile/links?username=archivist','GET',factory('private').env,{user:owner})).status,200);
 assert.equal((await invoke('/api/profile/links?username=archivist','GET',factory('private').env,{user:visitor,moderator:true})).status,200);
});
