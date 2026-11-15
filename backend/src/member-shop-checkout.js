// Stripe-backed bot slot checkout. Never trust client prices or success redirects.
import {BOT_SLOT_PRODUCTS} from "./bot-slot-shop.js";
import {PET_ACCESSORIES} from "./mascot-collectibles.js";
import {PREMIUM_DECK_SKUS} from "./deck-skin-products.js";
const respond=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");
async function verifyStripeSignature(raw,header,secret){
 const pairs=Object.fromEntries(String(header||"").split(",").map(p=>p.split("=")));
 const stamp=Number(pairs.t);
 if(!Number.isFinite(stamp)||Math.abs(Date.now()/1000-stamp)>300||!pairs.v1)return false;
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const digest=hex(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(stamp+"."+raw)));
 const a=new TextEncoder().encode(digest),b=new TextEncoder().encode(pairs.v1);
 if(a.length!==b.length)return false;
 let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;
}
async function stripeRequest(env,path,params,idempotency){
 const response=await fetch("https://api.stripe.com/v1/"+path,{method:"POST",headers:{"authorization":"Bearer "+env.STRIPE_SECRET_KEY,"content-type":"application/x-www-form-urlencoded",...(idempotency?{"idempotency-key":idempotency}:{})},body:new URLSearchParams(params)});
 const body=await response.json();if(!response.ok)throw new Error("Stripe request failed: "+(body.error?.type||response.status));return body;
}
export async function handleBotSlotShop(request,env,url,user){
 const path=url.pathname;
 if(path==="/api/member-shop/checkout"){
  if(request.method!=="POST")return respond({error:"Method not allowed"},405);
  if(!user)return respond({error:"Sign in first"},401);
  // Explicit launch gate: credentials alone never activate a public purchase flow.
  // Leave this disabled until verified end-to-end payment, fulfillment and refund testing.
  if(env.MEMBER_SHOP_CHECKOUT_ENABLED!=="true")return respond({error:"Checkout is not available yet"},503);
  if(!env.STRIPE_SECRET_KEY||!env.STRIPE_WEBHOOK_SECRET)return respond({error:"Checkout is not configured"},503);
  let data;try{data=await request.json()}catch{return respond({error:"Invalid JSON"},400)}
  const product=Object.prototype.hasOwnProperty.call(BOT_SLOT_PRODUCTS,data?.sku)?BOT_SLOT_PRODUCTS[data.sku]:(PET_ACCESSORIES[data?.sku]?.premium?PET_ACCESSORIES[data.sku]:(PREMIUM_DECK_SKUS[data?.sku]||null));
  if(!product)return respond({error:"Unknown paid shop product"},400);
  if(PREMIUM_DECK_SKUS[data.sku]){
   const existing=await env.DB.prepare("SELECT skin_id FROM arcade_deck_paid_entitlements WHERE user_id=? AND skin_id=? AND state='active'").bind(user.id,PREMIUM_DECK_SKUS[data.sku].skin_id).first();
   if(existing)return respond({error:"You already own this deck skin."},409);
  }
  const id=crypto.randomUUID(),now=new Date().toISOString();
  await env.DB.prepare("INSERT INTO member_shop_orders(id,user_id,sku,amount_cents,currency,status,provider,created_at,updated_at) VALUES(?,?,?,?,?,'pending','stripe',?,?)").bind(id,user.id,data.sku,product.price_cents,"USD",now,now).run();
  try{
   const session=await stripeRequest(env,"checkout/sessions",{"mode":"payment","success_url":(product.premium?"https://ash-fall.com/mascot-pets.html?checkout=success":"https://ash-fall.com/cinder-shop.html?checkout=success"),"cancel_url":(product.premium?"https://ash-fall.com/mascot-pets.html?checkout=cancelled":"https://ash-fall.com/cinder-shop.html?checkout=cancelled"),"client_reference_id":id,"metadata[order_id]":id,"line_items[0][price_data][currency]":"usd","line_items[0][price_data][unit_amount]":String(product.price_cents),"line_items[0][price_data][product_data][name]":product.premium?"Neon Nuisances · "+product.name:(PREMIUM_DECK_SKUS[data.sku]?"Knightfall Deck · "+product.name:(data.sku==="bot_slot_1"?"Ash-Fall +1 Bot Slot":"Ash-Fall +5 Bot Slots")),"line_items[0][quantity]":"1"},id);
   return respond({checkout_url:session.url,order_id:id});
  }catch(e){console.error("member_shop_checkout",e);return respond({error:"Checkout unavailable"},502)}
 }
 if(path==="/api/member-shop/orders"){
  if(request.method!=="GET")return respond({error:"Method not allowed"},405);
  if(!user)return respond({error:"Sign in first"},401);
  const rows=await env.DB.prepare("SELECT id,sku,amount_cents,currency,status,created_at FROM member_shop_orders WHERE user_id=? ORDER BY created_at DESC LIMIT 50").bind(user.id).all();
  return respond({orders:rows.results||[]});
 }
 if(path==="/api/member-shop/stripe-webhook"){
  if(request.method!=="POST")return respond({error:"Method not allowed"},405);
  if(!env.STRIPE_WEBHOOK_SECRET||!env.STRIPE_SECRET_KEY)return respond({error:"Not configured"},503);
  const raw=await request.text();
  if(raw.length>100000)return respond({error:"Payload too large"},413);
  if(!await verifyStripeSignature(raw,request.headers.get("stripe-signature"),env.STRIPE_WEBHOOK_SECRET))return respond({error:"Invalid signature"},400);
  let event;try{event=JSON.parse(raw)}catch{return respond({error:"Invalid event"},400)}
  // A fully refunded card charge revokes only the matching collector finish.
  // Verify the Stripe signature above before trusting any reversal event.
  if(event.type==="charge.refunded"){
   const charge=event.data?.object;
   if(typeof charge?.payment_intent!=="string"||!Number.isSafeInteger(charge.amount)||!Number.isSafeInteger(charge.amount_refunded)||charge.amount_refunded<charge.amount)return respond({received:true});
   const order=await env.DB.prepare("SELECT id,user_id,sku,amount_cents,status FROM member_shop_orders WHERE provider_payment_id=? LIMIT 1").bind(charge.payment_intent).first();
   const product=order&&PREMIUM_DECK_SKUS[order.sku];
   if(!product||order.status==="refunded")return respond({received:true});
   if(order.status!=="fulfilled"||charge.amount!==order.amount_cents)return respond({received:true});
   const now=new Date().toISOString();
   await env.DB.batch([
    env.DB.prepare("UPDATE member_shop_orders SET status='refunded',updated_at=? WHERE id=? AND status='fulfilled'").bind(now,order.id),
    env.DB.prepare("UPDATE arcade_deck_paid_entitlements SET state='revoked',revoked_at=? WHERE user_id=? AND skin_id=? AND source_order_id=? AND state='active'").bind(now,order.user_id,product.skin_id,order.id),
    env.DB.prepare("UPDATE arcade_deck_profiles SET equipped_skin='ash-classic',revision=revision+1,updated_at=? WHERE user_id=? AND equipped_skin=?").bind(now,order.user_id,product.skin_id)
   ]);
   return respond({received:true});
  }
  if(event.type!=="checkout.session.completed")return respond({received:true});
  const session=event.data?.object;
  if(session?.payment_status!=="paid"||session?.mode!=="payment")return respond({received:true});
  const id=session.client_reference_id;
  if(typeof id!=="string"||!session.id)return respond({error:"Invalid session"},400);
  const order=await env.DB.prepare("SELECT id,user_id,sku,amount_cents,currency,status FROM member_shop_orders WHERE id=?").bind(id).first();
  const product=order&&(BOT_SLOT_PRODUCTS[order.sku]||(PET_ACCESSORIES[order.sku]?.premium?PET_ACCESSORIES[order.sku]:PREMIUM_DECK_SKUS[order.sku]));
  if(!product||order.currency!=="USD"||order.amount_cents!==product.price_cents||session.amount_total!==order.amount_cents||String(session.currency).toLowerCase()!=="usd"||session.metadata?.order_id!==id)return respond({error:"Order mismatch"},400);
  if(order.status==="fulfilled")return respond({received:true});
  if(order.status!=="pending"&&order.status!=="paid")return respond({error:"Order not fulfillable"},409);
  const now=new Date().toISOString();
  const fulfillments=[
   env.DB.prepare("UPDATE member_shop_orders SET status='fulfilled',provider_payment_id=?,updated_at=? WHERE id=? AND status IN ('pending','paid')").bind(session.payment_intent||session.id,now,id),
   env.DB.prepare("INSERT OR IGNORE INTO member_shop_fulfillments(order_id,user_id,sku,fulfilled_at) SELECT id,user_id,sku,? FROM member_shop_orders WHERE id=? AND status='fulfilled'").bind(now,id),
   env.DB.prepare("INSERT INTO member_shop_entitlements(user_id,extra_bot_slots,updated_at) VALUES(?,(SELECT COALESCE(SUM(CASE sku WHEN 'bot_slot_1' THEN 1 WHEN 'bot_slot_5' THEN 5 ELSE 0 END),0) FROM member_shop_fulfillments WHERE user_id=?),?) ON CONFLICT(user_id) DO UPDATE SET extra_bot_slots=excluded.extra_bot_slots,updated_at=excluded.updated_at").bind(order.user_id,order.user_id,now),
   env.DB.prepare("INSERT OR IGNORE INTO mascot_wardrobe(user_id,sku,acquired_at) SELECT user_id,sku,? FROM member_shop_fulfillments WHERE order_id=? AND sku=?").bind(now,id,order.sku)
  ];
  if(PREMIUM_DECK_SKUS[order.sku])fulfillments.push(
   env.DB.prepare("INSERT INTO arcade_deck_paid_entitlements(user_id,skin_id,source_order_id,state,granted_at) SELECT user_id,?,id,'active',? FROM member_shop_orders WHERE id=? AND sku=? AND status='fulfilled' ON CONFLICT(user_id,skin_id) DO UPDATE SET state='active',source_order_id=excluded.source_order_id,granted_at=excluded.granted_at,revoked_at=NULL").bind(PREMIUM_DECK_SKUS[order.sku].skin_id,now,id,order.sku)
  );
  await env.DB.batch(fulfillments);
  return respond({received:true});
 }
 return null;
}
