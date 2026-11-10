import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handlePrivacyAssistance, validatePrivacyAssistance, PRIVACY_HELP_PREFIX } from '../backend/src/privacy-assistance.js';
const page=readFileSync(new URL('../public/account-deletion.html',import.meta.url),'utf8');
const account=readFileSync(new URL('../public/account.html',import.meta.url),'utf8');
const backend=readFileSync(new URL('../backend/src/index.js',import.meta.url),'utf8');

function fixture({admin=false,allowed=true,rate=true}={}){
 const store=new Map();
 const env={
  SESSIONS:{
   async put(k,v){store.set(k,JSON.parse(v))},async get(k){return store.get(k)||null},
   async list({prefix,limit}){return {keys:[...store.keys()].filter(x=>x.startsWith(prefix)).slice(0,limit).map(name=>({name})),list_complete:true};}
  },
  DB:{prepare(){return {all:async()=>({results:[]})}}}
 };
 const deps={
  getUser:async()=>admin?{id:1,role:'admin'}:null,isAdmin:u=>u?.role==='admin',
  rateLimit:async()=>rate,
  origin:'https://ash-fall.com',
  json:(body,status=200)=>Response.json(body,{status}),
  createNotification:async()=>{}
 };
 const route=(path,method='GET',data=null,origin='https://ash-fall.com')=>{
   const req=new Request('https://api.ash-fall.com'+path,{method,headers:{Origin:origin,...(data?{'content-type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})});
   return handlePrivacyAssistance(req,env,new URL(req.url),deps);
 };
 return {route,store,env,deps};
}
const good={email:'Person@Example.COM',username:'member_3',acknowledged:true,website:''};
test('public form requires email and explicit verification warning',()=>{
 assert.deepEqual(validatePrivacyAssistance(good).value,{email:'person@example.com',username:'member_3'});
 assert.match(validatePrivacyAssistance({...good,email:'bad'}).error,/valid contact/);
 assert.match(validatePrivacyAssistance({...good,acknowledged:false}).error,/identity verification/);
 assert.match(validatePrivacyAssistance({...good,username:'bad username'}).error,/valid username/);
 assert.match(page,/id="privacy-help-form"/);
 assert.match(page,/does not itself delete your account/);
 assert.match(backend,/handlePrivacyAssistance\(request,env,url/);
});
test('an anonymous public request stores minimal, expiring data and never deletes anything',async()=>{
 const f=fixture();
 const res=await f.route('/api/privacy/deletion-assistance','POST',good);
 assert.equal(res.status,202);
 const message=await res.json();
 assert.match(message.message,/did not delete your account/);
 assert.equal(f.store.size,1);
 const [key]=f.store.keys();
 assert.ok(key.startsWith(PRIVACY_HELP_PREFIX));
 assert.equal(f.store.get(key).email,'person@example.com');
 assert.equal(f.store.get(key).username_hint,'member_3');
 assert.equal(f.store.get(key).status,'pending');
 assert.equal(Object.hasOwn(f.store.get(key),'password'),false);
});
test('unauthorized origin and insufficient consent are rejected',async()=>{
 const f=fixture();
 assert.equal((await f.route('/api/privacy/deletion-assistance','POST',good,'https://evil.example')).status,403);
 assert.equal((await f.route('/api/privacy/deletion-assistance','POST',{...good,acknowledged:false})).status,400);
 assert.equal(f.store.size,0);
});
test('staff queue requires administrator, supports notes, and cannot mark data as deleted',async()=>{
 const f=fixture();
 const first=await f.route('/api/privacy/deletion-assistance','POST',good);
 assert.equal(first.status,202);
 const id=(await first.json()).request_id;
 assert.equal((await f.route('/api/admin/privacy-assistance')).status,403);
 f.deps.getUser=async()=>({id:1,role:'admin'});
 const list=await f.route('/api/admin/privacy-assistance');
 assert.equal(list.status,200);
 assert.equal((await list.json()).tickets.length,1);
 const fail=await f.route('/api/admin/privacy-assistance/'+id,'PATCH',{status:'completed',operator_note:'done'});
 assert.equal(fail.status,400);
 const save=await f.route('/api/admin/privacy-assistance/'+id,'PATCH',{status:'awaiting_verification',operator_note:'Requested identity evidence through approved support process.'});
 assert.equal(save.status,200);
 assert.equal(f.store.get(PRIVACY_HELP_PREFIX+id).status,'awaiting_verification');
});
test('authenticated deletion requires a password, not just a stolen browser session',()=>{
 assert.match(backend,/if\(!credential\?\.password_hash\|\|!password\|\|!\(await verifyPassword\(password,credential\.password_hash\)\)\)/);
 assert.match(account,/Current password \(required to confirm deletion\)/);
 assert.match(account,/name="password" type="password" autocomplete="current-password" maxlength="128" required/);
 assert.doesNotMatch(page,/social sign-ins can use the username confirmation/i);
});
