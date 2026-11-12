import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handlePrivacyAssistance, validatePrivacyAssistance, privacyTicketExpiry, PRIVACY_HELP_PREFIX } from '../backend/src/privacy-assistance.js';
const page=readFileSync(new URL('../public/account-deletion.html',import.meta.url),'utf8');
const account=readFileSync(new URL('../public/account.html',import.meta.url),'utf8');
const backend=readFileSync(new URL('../backend/src/index.js',import.meta.url),'utf8');

function fixture({admin=false,allowed=true,rate=true}={}){
 const store=new Map(), expirations=new Map();
 const env={
  SESSIONS:{
   async put(k,v,options){store.set(k,JSON.parse(v));expirations.set(k,options)},async get(k){return store.get(k)||null},
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
 return {route,store,expirations,env,deps};
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
 assert.equal(f.expirations.get(PRIVACY_HELP_PREFIX+id).expiration,privacyTicketExpiry(f.store.get(PRIVACY_HELP_PREFIX+id).created_at));
});
test('authenticated deletion requires a password, not just a stolen browser session',()=>{
 assert.match(backend,/if\(!credential\?\.password_hash\|\|!password\|\|!\(await verifyPassword\(password,credential\.password_hash\)\)\)/);
 assert.match(account,/Current password \(required to confirm deletion\)/);
 assert.match(account,/name="password" type="password" autocomplete="current-password" maxlength="128" required/);
 assert.doesNotMatch(page,/social sign-ins can use the username confirmation/i);
});

test('privacy assistance ticket expiry stays anchored to creation, never staff edits', async () => {
 const f=fixture();
 const result=await f.route('/api/privacy/deletion-assistance','POST',good);
 const id=(await result.json()).request_id;
 const key=PRIVACY_HELP_PREFIX+id;
 f.deps.getUser=async()=>({id:1,role:'admin'});
 const createdAt=new Date(Date.now()-89*86400*1000).toISOString();
 f.store.get(key).created_at=createdAt;
 const edit=await f.route('/api/admin/privacy-assistance/'+id,'PATCH',{status:'reviewing',operator_note:'Identity verification pending'});
 assert.equal(edit.status,200);
 const originalExpiration=privacyTicketExpiry(createdAt);
 assert.equal(f.expirations.get(key).expiration,originalExpiration);
 assert.ok(originalExpiration*1000-Date.now()<2*86400*1000,'staff edit must not give a fresh 90-day retention period');
 const second=await f.route('/api/admin/privacy-assistance/'+id,'PATCH',{status:'awaiting_verification'});
 assert.equal(second.status,200);
 assert.equal(f.expirations.get(key).expiration,originalExpiration);
 assert.equal(f.store.get(key).operator_note,'Identity verification pending','status-only edits must preserve prior staff note');
});
test('expired and corrupt ticket timestamps cannot be refreshed', async () => {
 const f=fixture();
 const result=await f.route('/api/privacy/deletion-assistance','POST',good);
 const key=PRIVACY_HELP_PREFIX+(await result.json()).request_id;
 const id=key.slice(PRIVACY_HELP_PREFIX.length);
 f.deps.getUser=async()=>({id:1,role:'admin'});
 for(const createdAt of [new Date(Date.now()-91*86400*1000).toISOString(),new Date(Date.now()-90*86400*1000+30000).toISOString(),'not-a-date',new Date(Date.now()+86400*1000).toISOString()]){
  f.store.get(key).created_at=createdAt;
  const response=await f.route('/api/admin/privacy-assistance/'+id,'PATCH',{status:'reviewing'});
  assert.equal(response.status,410);
 }
 assert.equal(f.expirations.get(key).expirationTtl,90*86400,'no expired edit may refresh TTL');
});

test('staff notes survive status-only edits and require an explanation before closing', async () => {
 const f=fixture();
 const created=await f.route('/api/privacy/deletion-assistance','POST',good);
 const id=(await created.json()).request_id;
 const key=PRIVACY_HELP_PREFIX+id;
 f.deps.getUser=async()=>({id:1,role:'admin'});
 const first=await f.route('/api/admin/privacy-assistance/'+id,'PATCH',{status:'reviewing',operator_note:'Waiting for ownership evidence'});
 assert.equal(first.status,200);
 const next=await f.route('/api/admin/privacy-assistance/'+id,'PATCH',{status:'awaiting_verification'});
 assert.equal(next.status,200);
 assert.equal(f.store.get(key).operator_note,'Waiting for ownership evidence');
 const closed=await f.route('/api/admin/privacy-assistance/'+id,'PATCH',{status:'closed'});
 assert.equal(closed.status,200);
 assert.equal(f.store.get(key).operator_note,'Waiting for ownership evidence');
 const cleared=await f.route('/api/admin/privacy-assistance/'+id,'PATCH',{status:'reviewing',operator_note:''});
 assert.equal(cleared.status,200);
 assert.equal(f.store.get(key).operator_note,'','an explicitly blank note clears it');
 const denied=await f.route('/api/admin/privacy-assistance/'+id,'PATCH',{status:'closed'});
 assert.equal(denied.status,400,'closing without a note must still fail');
 assert.equal(f.store.get(key).status,'reviewing');
});

test('public assistance limits actual body bytes when Content-Length is absent',async()=>{
 const f=fixture();
 const req=new Request('https://api.ash-fall.com/api/privacy/deletion-assistance',{
  method:'POST',headers:{Origin:'https://ash-fall.com','content-type':'application/json'},
  body:JSON.stringify({...good,website:'x'.repeat(3000)})
 });
 assert.equal(req.headers.get('content-length'),null);
 const rejected=await handlePrivacyAssistance(req,f.env,new URL(req.url),f.deps);
 assert.equal(rejected.status,413);
 assert.equal(f.store.size,0);
 const valid=await f.route('/api/privacy/deletion-assistance','POST',good);
 assert.equal(valid.status,202,'ordinary small requests must still work');
});
test('malformed JSON on public assistance route fails without storing a ticket',async()=>{
 const f=fixture();
 const req=new Request('https://api.ash-fall.com/api/privacy/deletion-assistance',{
  method:'POST',headers:{Origin:'https://ash-fall.com','content-type':'application/json'},
  body:'{"email":'
 });
 const response=await handlePrivacyAssistance(req,f.env,new URL(req.url),f.deps);
 assert.equal(response.status,400);
 assert.equal(f.store.size,0);
});
