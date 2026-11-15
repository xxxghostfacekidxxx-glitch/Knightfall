/* Knightfall subscription Billing foundation.
 * Requires Stripe Worker secrets and an explicit enable flag.
 * The browser NEVER supplies a Price ID, Customer ID or Stripe key.
 * Invoicing is provided by Stripe's hosted invoice Dashboard/portal.
 */
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"private, no-store"}});
const API="https://api.stripe.com/v1/";
const BILLING_ROOT="/api/stripe/billing/";
function apiReady(env){return env.STRIPE_BILLING_ENABLED==="true"&&!!env.STRIPE_SECRET_KEY&&!!env.STRIPE_WEBHOOK_SECRET&&/^price_[A-Za-z0-9]+$/.test(env.STRIPE_PREMIUM_PRICE_ID||"");}
async function stripe(env,path,params){
 const response=await fetch(API+path,{method:"POST",headers:{"Authorization":"Bearer "+env.STRIPE_SECRET_KEY,"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams(params)});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw Error("Stripe "+path+" failed ("+response.status+")");
 return data;
}
const validRedirect=x=>typeof x==="string"&&/^https:\/\/billing\.stripe\.com\/|^https:\/\/checkout\.stripe\.com\//.test(x);
async function customerFor(env,user,{create=false}={}){
 const row=await env.DB.prepare("SELECT customer_id FROM stripe_member_customers WHERE user_id=?").bind(user.id).first();
 if(row?.customer_id)return row.customer_id;
 if(!create)return null;
 // Only one linked customer per user. Any duplicate Stripe Customer is harmless
 // and is not sufficient to grant entitlements.
 const customer=await stripe(env,"customers",{"email":String(user.email||""),"metadata[knightfall_user_id]":String(user.id)});
 if(!/^cus_[a-zA-Z0-9]+$/.test(customer.id||""))throw Error("Invalid Stripe customer");
 await env.DB.prepare("INSERT OR IGNORE INTO stripe_member_customers(user_id,customer_id) VALUES(?,?)").bind(user.id,customer.id).run();
 const linked=await env.DB.prepare("SELECT customer_id FROM stripe_member_customers WHERE user_id=?").bind(user.id).first();
 return linked?.customer_id||null;
}
export async function handleStripeBilling(request,env,url,user){
 if(!url.pathname.startsWith(BILLING_ROOT))return null;
 if(!["GET","POST"].includes(request.method))return reply({error:"Method not allowed"},405);
 if(!user)return reply({error:"Sign in to manage your billing."},401);
 if(url.pathname===BILLING_ROOT+"status"&&request.method==="GET"){
  const membership=await env.DB.prepare("SELECT status,expires_at FROM member_premium_memberships WHERE user_id=?").bind(user.id).first();
  return reply({configured:apiReady(env),premium:membership?.status==="active"&&(!membership.expires_at||Date.parse(membership.expires_at)>Date.now()),membership_status:membership?.status||"inactive"});
 }
 if(![BILLING_ROOT+"checkout",BILLING_ROOT+"portal"].includes(url.pathname)||request.method!=="POST")return reply({error:"Not found"},404);
 if(!apiReady(env))return reply({error:"Membership checkout has not launched yet."},503);
 const origin=request.headers.get("Origin");
 if(origin&&origin!=="https://ash-fall.com"&&origin!=="https://www.ash-fall.com")return reply({error:"Invalid origin"},403);
 try{
  const customer=await customerFor(env,user,{create:url.pathname===BILLING_ROOT+"checkout"});
  if(!customer)return reply({error:"No Stripe billing profile yet; start with membership checkout."},409);
  if(url.pathname===BILLING_ROOT+"portal"){
   const result=await stripe(env,"billing_portal/sessions",{customer,return_url:"https://ash-fall.com/billing.html"});
   if(!validRedirect(result.url)||!result.url.includes("billing.stripe.com"))throw Error("Invalid portal URL");
   return reply({url:result.url});
  }
  const member=await env.DB.prepare("SELECT status,expires_at FROM member_premium_memberships WHERE user_id=?").bind(user.id).first();
  if(member?.status==="active"&&(!member.expires_at||Date.parse(member.expires_at)>Date.now()))return reply({error:"Membership already active. Use Manage Billing."},409);
  const result=await stripe(env,"checkout/sessions",{
   mode:"subscription",customer,
   "line_items[0][price]":env.STRIPE_PREMIUM_PRICE_ID,"line_items[0][quantity]":"1",
   "client_reference_id":String(user.id),
   "metadata[knightfall_user_id]":String(user.id),
   success_url:"https://ash-fall.com/billing.html?checkout=success",
   cancel_url:"https://ash-fall.com/billing.html?checkout=cancelled"
  });
  if(!validRedirect(result.url)||!result.url.includes("checkout.stripe.com"))throw Error("Invalid checkout URL");
  return reply({url:result.url});
 }catch(error){console.error("stripe_billing",String(error?.message||error));return reply({error:"Billing is temporarily unavailable."},502)}
}
// Invoke this ONLY after the existing gateway verifies the Stripe signature.
// Store membership state solely from trusted subscription events and bound Customer ID.
export async function handleVerifiedBillingEvent(event,env){
 if(!["customer.subscription.created","customer.subscription.updated","customer.subscription.deleted"].includes(event?.type))return false;
 const subscription=event.data?.object;
 if(subscription?.object!=="subscription"||typeof subscription.customer!=="string"||!/^cus_[a-zA-Z0-9]+$/.test(subscription.customer))return true;
 // A customer can buy many unrelated products. Only the configured Premium
 // recurring price may affect Knightfall membership privileges.
 const premiumPrice=env.STRIPE_PREMIUM_PRICE_ID;
 if(!/^price_[A-Za-z0-9]+$/.test(premiumPrice||""))return true;
 const matches=Array.isArray(subscription.items?.data)&&subscription.items.data.some(line=>line.price?.id===premiumPrice);
 if(!matches)return true;
 const user=await env.DB.prepare("SELECT user_id FROM stripe_member_customers WHERE customer_id=?").bind(subscription.customer).first();
 if(!user)return true;
 const approved=subscription.status==="active"||subscription.status==="trialing";
 const end=Number(subscription.current_period_end);
 const expires=Number.isFinite(end)&&end>0?new Date(end*1000).toISOString():null;
 await env.DB.prepare("INSERT INTO member_premium_memberships(user_id,status,expires_at,updated_at) VALUES(?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET status=excluded.status,expires_at=excluded.expires_at,updated_at=CURRENT_TIMESTAMP")
  .bind(user.user_id,approved?"active":"inactive",approved?expires:null).run();
 return true;
}
