import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {handleBotSlotShop} from './member-shop-checkout.js';
import {PET_ACCESSORIES} from './mascot-collectibles.js';
import {PREMIUM_DECK_PRODUCTS,PREMIUM_DECK_SKUS} from './deck-skin-products.js';

const owner={id:101,username:'tester'};
const url=path=>new URL('https://api.ash-fall.com'+path);
const respondRequest=(path,payload)=>new Request(url(path),{method:'POST',
 headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
function setup(){
 const orders=new Map(),batched=[];
 const db={prepare(sql){
  return {bind(...params){
   return {async run(){
    if(sql.startsWith('INSERT INTO member_shop_orders'))orders.set(params[0],{
     id:params[0],user_id:params[1],sku:params[2],amount_cents:params[3],
     currency:params[4],status:'pending'});
    return {meta:{changes:1}};
   },async first(){if(sql.includes('FROM member_shop_orders WHERE id'))return orders.get(params[0])||null;if(sql.includes('FROM member_shop_orders WHERE provider_payment_id'))return [...orders.values()].find(o=>o.provider_payment_id===params[0])||null;return null},
   async all(){return {results:[]}},sql,params};
  }};
 },async batch(statements){
  batched.push(statements.map(x=>({sql:x.sql,params:x.params})));
  const update=statements.find(x=>x.sql.includes("UPDATE member_shop_orders SET status='fulfilled'"));
  if(update){orders.get(update.params[2]).status='fulfilled';orders.get(update.params[2]).provider_payment_id=update.params[0]}
  const refund=statements.find(x=>x.sql.includes("UPDATE member_shop_orders SET status='refunded'"));
  if(refund)orders.get(refund.params[1]).status='refunded';
  return statements.map(()=>({success:true}));
 }};
 return {orders,batched,env:{DB:db,STRIPE_SECRET_KEY:'test-only',STRIPE_WEBHOOK_SECRET:'test-webhook-secret',MEMBER_SHOP_CHECKOUT_ENABLED:'true'}};
}
test('Premium catalog has known USD prices; unconfigured checkout is disabled',async()=>{
 assert.equal(PET_ACCESSORIES.glitch_horns.price_cents,299);
 assert.equal(PET_ACCESSORIES.glitch_horns.premium,true);
 const r=await handleBotSlotShop(respondRequest('/api/member-shop/checkout',{sku:'glitch_horns'}),
  {DB:{}},url('/api/member-shop/checkout'),owner);
 assert.equal(r.status,503);
});
test('Stripe keys alone cannot enable member checkout before launch approval',async()=>{
 const {env,orders}=setup();
 delete env.MEMBER_SHOP_CHECKOUT_ENABLED;
 const res=await handleBotSlotShop(respondRequest('/api/member-shop/checkout',{sku:'glitch_horns'}),
  env,url('/api/member-shop/checkout'),owner);
 assert.equal(res.status,503);
 assert.equal(orders.size,0,'the disabled shop must not create a pending order');
});
test('Premium item checkout never trusts client price and has no pre-payment inventory grant',async()=>{
 const {env,orders,batched}=setup();const previous=globalThis.fetch;
 globalThis.fetch=async(target,options)=>{
  assert.match(target,/stripe.com/);
  const params=new URLSearchParams(options.body);
  assert.equal(params.get('line_items[0][price_data][unit_amount]'),'299');
  assert.equal(params.get('line_items[0][price_data][product_data][name]'),'Neon Nuisances · Glitch Horns');
  return {ok:true,json:async()=>({url:'https://checkout.stripe.com/c/test-session'})};
 };
 try{
  const res=await handleBotSlotShop(respondRequest('/api/member-shop/checkout',{sku:'glitch_horns',price_cents:1}),
   env,url('/api/member-shop/checkout'),owner);
  assert.equal(res.status,200);
  const body=await res.json();
  assert.match(body.checkout_url,/checkout.stripe.com/);
  assert.equal(orders.get(body.order_id).amount_cents,299);
  assert.equal(batched.length,0);
 }finally{globalThis.fetch=previous}
});
test('Unsigned checkout webhook never fulfills; verified payment grants wardrobe exactly once',async()=>{
 const {env,orders,batched}=setup(),id='order-verified-example';
 orders.set(id,{id,user_id:owner.id,sku:'glitch_horns',amount_cents:299,currency:'USD',status:'pending'});
 const payload=JSON.stringify({
  type:'checkout.session.completed',data:{object:{
   id:'cs_test_1',client_reference_id:id,metadata:{order_id:id},payment_status:'paid',
   mode:'payment',amount_total:299,currency:'usd',payment_intent:'pi_test_1'
  }}
 });
 const makeRequest=signature=>new Request(url('/api/member-shop/stripe-webhook'),{
  method:'POST',headers:{'stripe-signature':signature},body:payload});
 let res=await handleBotSlotShop(makeRequest('t=0,v1=forged'),env,url('/api/member-shop/stripe-webhook'),null);
 assert.equal(res.status,400);assert.equal(batched.length,0);
 const now=Math.floor(Date.now()/1000);
 const digest=createHmac('sha256',env.STRIPE_WEBHOOK_SECRET).update(now+'.'+payload).digest('hex');
 res=await handleBotSlotShop(makeRequest('t='+now+',v1='+digest),env,url('/api/member-shop/stripe-webhook'),null);
 assert.equal(res.status,200);assert.equal(batched.length,1);
 assert.ok(batched[0].some(x=>x.sql.includes('INSERT OR IGNORE INTO mascot_wardrobe')));
 res=await handleBotSlotShop(makeRequest('t='+now+',v1='+digest),env,url('/api/member-shop/stripe-webhook'),null);
 assert.equal(res.status,200);assert.equal(batched.length,1,'retry must not re-fulfill an order');
});

test('Twelve new deck SKUs have fixed one-time prices from $1.00 to $1.99',()=>{
 const list=Object.values(PREMIUM_DECK_PRODUCTS);
 assert.equal(list.length,12);
 assert.equal(new Set(list.map(p=>p.sku)).size,12);
 for(const p of list){
  assert.equal(PREMIUM_DECK_SKUS[p.sku],p);
  assert.ok(p.price_cents>=100&&p.price_cents<=199,p.name+" violates $2 price cap");
 }
});
test('New deck checkout uses server-set price and cannot grant ownership before payment',async()=>{
 const {env,orders,batched}=setup();const previous=globalThis.fetch;
 const product=PREMIUM_DECK_PRODUCTS['blood-moon'];
 globalThis.fetch=async(target,options)=>{
  const params=new URLSearchParams(options.body);
  assert.equal(params.get('line_items[0][price_data][unit_amount]'),'199');
  assert.equal(params.get('line_items[0][price_data][product_data][name]'),'Knightfall Deck · Blood Moon');
  return {ok:true,json:async()=>({url:'https://checkout.stripe.com/c/test-deck'})};
 };
 try{
  const res=await handleBotSlotShop(respondRequest('/api/member-shop/checkout',{sku:product.sku,price_cents:1}),
   env,url('/api/member-shop/checkout'),owner);
  assert.equal(res.status,200);
  const body=await res.json();
  assert.equal(orders.get(body.order_id).amount_cents,199);
  assert.equal(batched.length,0,'a checkout session is never proof of purchase');
 }finally{globalThis.fetch=previous}
});
test('Signed paid deck webhook issues one server-side entitlement, idempotently',async()=>{
 const {env,orders,batched}=setup(),id='deck-verified-example';
 const sku=PREMIUM_DECK_PRODUCTS['obsidian-cathedral'].sku;
 orders.set(id,{id,user_id:owner.id,sku,amount_cents:100,currency:'USD',status:'pending'});
 const payload=JSON.stringify({type:'checkout.session.completed',data:{object:{
  id:'cs_deck_test',client_reference_id:id,metadata:{order_id:id},payment_status:'paid',
  mode:'payment',amount_total:100,currency:'usd',payment_intent:'pi_deck_test'
 }}});
 const stamp=Math.floor(Date.now()/1000);
 const signature='t='+stamp+',v1='+createHmac('sha256',env.STRIPE_WEBHOOK_SECRET).update(stamp+'.'+payload).digest('hex');
 const req=()=>new Request(url('/api/member-shop/stripe-webhook'),{method:'POST',headers:{'stripe-signature':signature},body:payload});
 const result=await handleBotSlotShop(req(),env,url('/api/member-shop/stripe-webhook'),null);
 assert.equal(result.status,200);
 assert.equal(batched.length,1);
 const writes=batched[0].filter(s=>s.sql.includes('arcade_deck_paid_entitlements'));
 assert.equal(writes.length,1);
 assert.equal(writes[0].params[0],'obsidian-cathedral');
 assert.equal(writes[0].params[2],id);
 await handleBotSlotShop(req(),env,url('/api/member-shop/stripe-webhook'),null);
 assert.equal(batched.length,1,'duplicate webhook must not grant twice');
});

test('Signed full refund revokes collector finish, without affecting unrelated items',async()=>{
 const {env,orders,batched}=setup(),id='deck-refund-scenario';
 const sku=PREMIUM_DECK_PRODUCTS['starfall'].sku;
 orders.set(id,{id,user_id:owner.id,sku,amount_cents:149,currency:'USD',status:'fulfilled',provider_payment_id:'pi_paid_refund'});
 const refund=JSON.stringify({type:'charge.refunded',data:{object:{id:'ch_refund',payment_intent:'pi_paid_refund',amount:149,amount_refunded:149}}});
 const stamp=Math.floor(Date.now()/1000);
 const signed=text=>new Request(url('/api/member-shop/stripe-webhook'),{method:'POST',headers:{'stripe-signature':'t='+stamp+',v1='+createHmac('sha256',env.STRIPE_WEBHOOK_SECRET).update(stamp+'.'+text).digest('hex')},body:text});
 let res=await handleBotSlotShop(signed(refund),env,url('/api/member-shop/stripe-webhook'),null);
 assert.equal(res.status,200);
 assert.equal(orders.get(id).status,'refunded');
 assert.equal(batched.length,1);
 assert.ok(batched[0].some(w=>w.sql.includes('UPDATE arcade_deck_paid_entitlements SET state=\'revoked\'')));
 assert.ok(batched[0].some(w=>w.sql.includes("UPDATE arcade_deck_profiles SET equipped_skin='ash-classic'")));
 res=await handleBotSlotShop(signed(refund),env,url('/api/member-shop/stripe-webhook'),null);
 assert.equal(res.status,200);
 assert.equal(batched.length,1,'refund replay must be idempotent');
});

test('Delayed payment fulfills only after signed paid event, including rotated signatures',async()=>{
 const {env,orders,batched}=setup(),id='delayed-payment';
 orders.set(id,{id,user_id:owner.id,sku:'glitch_horns',amount_cents:299,currency:'USD',status:'pending'});
 const signed=(type,payment_status,valid=true)=>{
  const payload=JSON.stringify({type,data:{object:{id:'cs_delayed',client_reference_id:id,
   metadata:{order_id:id},payment_status,mode:'payment',amount_total:299,currency:'usd',payment_intent:'pi_delayed'}}});
  const stamp=Math.floor(Date.now()/1000);
  const digest=createHmac('sha256',env.STRIPE_WEBHOOK_SECRET).update(stamp+'.'+payload).digest('hex');
  return new Request(url('/api/member-shop/stripe-webhook'),{method:'POST',headers:{
   'stripe-signature':'t='+stamp+',v1='+(valid?digest:'1'.repeat(64))+',v1='+'0'.repeat(64)},body:payload});
 };
 const handle=r=>handleBotSlotShop(r,env,url('/api/member-shop/stripe-webhook'),null);
 assert.equal((await handle(signed('checkout.session.completed','unpaid'))).status,200);
 assert.equal((await handle(signed('checkout.session.async_payment_failed','unpaid'))).status,200);
 assert.equal((await handle(signed('checkout.session.async_payment_succeeded','paid',false))).status,400);
 assert.equal(batched.length,0);
 assert.equal((await handle(signed('checkout.session.async_payment_succeeded','paid'))).status,200);
 assert.equal(orders.get(id).status,'fulfilled');
 assert.equal(batched.length,1);
 assert.equal((await handle(signed('checkout.session.async_payment_succeeded','paid'))).status,200);
 assert.equal(batched.length,1);
});
