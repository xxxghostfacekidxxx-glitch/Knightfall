import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {handleStripeBilling,handleVerifiedBillingEvent} from "./stripe-billing.js";
const user={id:17,email:"member@example.test",role:"member"};
function mock(){
 const state={customers:new Map(),memberships:new Map(),writes:[],calls:[]};
 const DB={prepare(sql){
  return {bind(...params){return {
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
 const event=(price,status="active")=>({type:"customer.subscription.updated",data:{object:{object:"subscription",customer:"cus_abc123",status,current_period_end:1893456000,items:{data:[{price:{id:price}}]}}}});
 assert.equal(await handleVerifiedBillingEvent(event("price_wrong"),env),true);
 assert.equal(state.memberships.size,0);
 assert.equal(await handleVerifiedBillingEvent(event("price_correct"),env),true);
 assert.equal(state.memberships.get(user.id).status,"active");
 assert.equal(await handleVerifiedBillingEvent(event("price_correct","canceled"),env),true);
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
 const shop=readFileSync("src/member-shop-checkout.js","utf8");
 const app=readFileSync("src/index.js","utf8");
 assert.match(shop,/verifyStripeSignature\(raw/);
 assert.match(shop,/handleVerifiedBillingEvent\(event,env\)/);
 assert.match(app,/handleStripeBilling\(request,env,url,user\)/);
});
