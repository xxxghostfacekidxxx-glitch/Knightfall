import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {handleBotSlotShop} from './member-shop-checkout.js';
import {PET_ACCESSORIES} from './mascot-collectibles.js';

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
   },async first(){if(sql.includes('FROM member_shop_orders WHERE id'))return orders.get(params[0])||null;return null},
   async all(){return {results:[]}},sql,params};
  }};
 },async batch(statements){
  batched.push(statements.map(x=>({sql:x.sql,params:x.params})));
  const update=statements.find(x=>x.sql.includes("UPDATE member_shop_orders SET status='fulfilled'"));
  if(update)orders.get(update.params[2]).status='fulfilled';
  return statements.map(()=>({success:true}));
 }};
 return {orders,batched,env:{DB:db,STRIPE_SECRET_KEY:'test-only',STRIPE_WEBHOOK_SECRET:'test-webhook-secret'}};
}
test('Premium catalog has known USD prices; unconfigured checkout is disabled',async()=>{
 assert.equal(PET_ACCESSORIES.glitch_horns.price_cents,299);
 assert.equal(PET_ACCESSORIES.glitch_horns.premium,true);
 const r=await handleBotSlotShop(respondRequest('/api/member-shop/checkout',{sku:'glitch_horns'}),
  {DB:{}},url('/api/member-shop/checkout'),owner);
 assert.equal(r.status,503);
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
