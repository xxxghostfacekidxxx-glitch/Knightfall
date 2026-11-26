import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {handleStripeBilling,handleVerifiedBillingEvent} from "./stripe-billing.js";
const user={id:17,email:"member@example.test",role:"member"};
function mock(){
 const state={customers:new Map(),memberships:new Map(),cursors:new Map(),writes:[],calls:[]};
 const DB={prepare(sql){
  return {bind(...params){return {
   sql,params,
   async first(){
    if(sql.startsWith("SELECT customer_id FROM stripe_member_customers"))return state.customers.has(params[0])?{customer_id:state.customers.get(params[0])}:null;
    if(sql.startsWith("SELECT user_id FROM stripe_member_customers")){for(const [id,customer] of state.customers)if(customer===params[0])return {user_id:id};return null}
    if(sql.startsWith("SELECT status,expires_at FROM member_premium_memberships"))return state.memberships.get(params[0])||null;
    throw Error("Unexpected query: "+sql);
   },
   async run(){
    state.writes.push({sql,params});
    if(sql.includes("INSERT OR IGNORE INTO stripe_member_customers"))state.customers.set(params[0],params[1]);
    if(sql.includes("INSERT INTO member_premium_memberships"))state.memberships.set(params[0],{status:params[1],expires_at:params[2]});
    return {success:true}
   }
  }}}
 },
 async batch(items){
  for(const item of items){
   state.writes.push({sql:item.sql,params:item.params});
   if(item.sql.startsWith("UPDATE stripe_member_customers SET last_subscription_event_created")){
    const [created,priority,id,userId]=item.params;
    const old=state.cursors.get(userId)||{created:0,priority:0};
    if(created>old.created||(created===old.created&&priority>old.priority))state.cursors.set(userId,{created,priority,id});
   }else if(item.sql.startsWith("INSERT INTO member_premium_memberships")){
    const [status,expires,userId,created,priority,id]=item.params;
    const cursor=state.cursors.get(userId);
    if(cursor?.created===created&&cursor?.priority===priority&&cursor?.id===id)state.memberships.set(userId,{status,expires_at:expires});
   }else throw Error("Unexpected batched query: "+item.sql);
  }
  return items.map(()=>({success:true}));
 }
 }};
 return {state,env:{DB}};
}
const path=p=>new URL("https://api.ash-fall.com/api/stripe/billing/"+p);
const req=(p,method="GET",origin="https://ash-fall.com")=>new Request(path(p),{method,headers:{"origin":origin}});
async function body(r){return {status:r.status,...await r.json()}}
test("not signed in and disabled billing never starts payment",async()=>{
 const {env,state}=mock();
 assert.equal((await body(await handleStripeBilling(req("status"),env,path("status"),null))).status,401);
 const disabled=await body(await handleStripeBilling(req("checkout","POST"),env,path("checkout"),user));
 assert.equal(disabled.status,503);
 assert.equal(state.writes.length,0);
});
test("billing requires explicit launch flag, webhook secret and valid Stripe Price ID",async()=>{
 const {env}=mock();
 env.STRIPE_BILLING_ENABLED="true";env.STRIPE_SECRET_KEY="sk_test_safe";
 env.STRIPE_PREMIUM_PRICE_ID="price_test123";
 let r=await body(await handleStripeBilling(req("status"),env,path("status"),user));
 assert.equal(r.configured,false);
 env.STRIPE_WEBHOOK_SECRET="whsec_safe";
 r=await body(await handleStripeBilling(req("status"),env,path("status"),user));
 assert.equal(r.configured,true);
 env.STRIPE_PREMIUM_PRICE_ID="price_id;malicious";
 r=await body(await handleStripeBilling(req("status"),env,path("status"),user));
 assert.equal(r.configured,false);
});
test("unrelated Stripe subscription can never grant Knightfall premium",async()=>{
 const {env,state}=mock();
 env.STRIPE_PREMIUM_PRICE_ID="price_correct";
 state.customers.set(user.id,"cus_abc123");
 const event=(price,status="active",created=1900000000,period=2000000000)=>({id:"evt_example"+created+status,type:"customer.subscription.updated",created,data:{object:{object:"subscription",customer:"cus_abc123",status,current_period_end:period,items:{data:[{price:{id:price},current_period_end:period}]}}}});
 assert.equal(await handleVerifiedBillingEvent(event("price_wrong"),env),true);
 assert.equal(state.memberships.size,0);
 assert.equal(await handleVerifiedBillingEvent(event("price_correct"),env),true);
 assert.equal(state.memberships.get(user.id).status,"active");
 assert.equal(await handleVerifiedBillingEvent(event("price_correct","canceled",1900000001),env),true);
 assert.equal(state.memberships.get(user.id).status,"inactive");
 // A delayed, older active event must never resurrect canceled Premium.
 assert.equal(await handleVerifiedBillingEvent(event("price_correct","active",1900000000),env),true);
 assert.equal(state.memberships.get(user.id).status,"inactive");
 // Malformed future active events must not grant forever.
 assert.equal(await handleVerifiedBillingEvent(event("price_correct","active",1900000002,null),env),true);
 assert.equal(state.memberships.get(user.id).status,"inactive");
});
test("only server-owned authenticated customer can get billing link",async()=>{
 const {env,state}=mock();
 env.STRIPE_BILLING_ENABLED="true";env.STRIPE_SECRET_KEY="sk_test_safe";env.STRIPE_WEBHOOK_SECRET="whsec_safe";env.STRIPE_PREMIUM_PRICE_ID="price_abc123";
 const refused=await body(await handleStripeBilling(req("portal","POST","https://evil.example"),env,path("portal"),user));
 assert.equal(refused.status,403);
 const missing=await body(await handleStripeBilling(req("portal","POST"),env,path("portal"),user));
 assert.equal(missing.status,409);
 assert.equal(state.writes.length,0);
});
test("verified webhook path routes exclusively through signed member-shop gateway",()=>{
 const shop=readFileSync(new URL("./member-shop-checkout.js",import.meta.url),"utf8");
 const app=readFileSync(new URL("./index.js",import.meta.url),"utf8");
 assert.match(shop,/verifyStripeSignature\(raw/);
 assert.match(shop,/handleVerifiedBillingEvent\(event,env\)/);
 assert.match(app,/handleStripeBilling\(request,env,url,user\)/);
});

test("independent portal flag allows cancellation without enabling new purchases",async()=>{
 const {env,state}=mock();
 env.STRIPE_BILLING_PORTAL_ENABLED="true";env.STRIPE_SECRET_KEY="sk_test_safe";
 state.customers.set(user.id,"cus_abc123");
 const status=await body(await handleStripeBilling(req("status"),env,path("status"),user));
 assert.equal(status.configured,false);assert.equal(status.portal_configured,true);
 const previous=globalThis.fetch;let calls=0;
 globalThis.fetch=async(target,options)=>{
  calls++;assert.match(target,/billing_portal\/sessions$/);
  assert.equal(new URLSearchParams(options.body).get("customer"),"cus_abc123");
  return {ok:true,json:async()=>({url:"https://billing.stripe.com/p/session/test"})};
 };
 try{
  assert.equal((await body(await handleStripeBilling(req("checkout","POST"),env,path("checkout"),user))).status,503);
  assert.equal(calls,0);
  assert.equal((await body(await handleStripeBilling(req("portal","POST"),env,path("portal"),user))).status,200);
  assert.equal(calls,1);
  delete env.STRIPE_BILLING_PORTAL_ENABLED;
  assert.equal((await body(await handleStripeBilling(req("portal","POST"),env,path("portal"),user))).status,503);
  assert.equal(calls,1);
 }finally{globalThis.fetch=previous}
});
test("billing rejects cross-product and deceptive redirect URLs",async()=>{
 const {env,state}=mock();
 env.STRIPE_BILLING_ENABLED="true";env.STRIPE_SECRET_KEY="sk_test_safe";
 env.STRIPE_WEBHOOK_SECRET="whsec_safe";env.STRIPE_PREMIUM_PRICE_ID="price_abc123";
 state.customers.set(user.id,"cus_abc123");
 const previous=globalThis.fetch;let targetUrl="";
 globalThis.fetch=async()=>({ok:true,json:async()=>({url:targetUrl})});
 try{
  for(const bad of ["https://checkout.stripe.com/billing.stripe.com","https://billing.stripe.com.evil.example/","https://billing.stripe.com:444/","https://evil.example/?next=https://billing.stripe.com/"]){
   targetUrl=bad;
   assert.equal((await body(await handleStripeBilling(req("portal","POST"),env,path("portal"),user))).status,502);
  }
  targetUrl="https://billing.stripe.com/checkout.stripe.com";
  assert.equal((await body(await handleStripeBilling(req("checkout","POST"),env,path("checkout"),user))).status,502);
  targetUrl="https://checkout.stripe.com/c/session";
  assert.equal((await body(await handleStripeBilling(req("checkout","POST"),env,path("checkout"),user))).status,200);
 }finally{globalThis.fetch=previous}
});
