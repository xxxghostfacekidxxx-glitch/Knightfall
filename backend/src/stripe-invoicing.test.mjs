import test from "node:test";
import assert from "node:assert/strict";
import {handleStripeInvoiceDraft} from "./stripe-invoicing.js";
const endpoint=new URL("https://api.ash-fall.com/api/stripe/invoices/draft");
const actor={id:1,role:"god"};
const request=(payload,origin="https://ash-fall.com")=>new Request(endpoint,{method:"POST",headers:{"content-type":"application/json","origin":origin},body:JSON.stringify(payload)});
const sample={email:"customer@example.test",description:"Knightfall sponsorship",amount_cents:12500,due_days:30};
async function data(r){return {status:r.status,...await r.json()}}
test("draft invoices are staff only and disabled by default",async()=>{
 const env={};
 assert.equal((await data(await handleStripeInvoiceDraft(request(sample),env,endpoint,null))).status,403);
 assert.equal((await data(await handleStripeInvoiceDraft(request(sample),env,endpoint,{id:4,role:"member"}))).status,403);
 assert.equal((await data(await handleStripeInvoiceDraft(request(sample),env,endpoint,actor))).status,503);
});
test("no arbitrary invoice amounts, recipients or cross-site submissions",async()=>{
 const env={STRIPE_INVOICING_ENABLED:"true",STRIPE_SECRET_KEY:"sk_test_sample"};
 for(const payload of [{...sample,amount_cents:1},{...sample,amount_cents:500001},{...sample,amount_cents:49.4},{...sample,email:"invalid"},{...sample,due_days:365}]){
  assert.equal((await data(await handleStripeInvoiceDraft(request(payload),env,endpoint,actor))).status,400);
 }
 assert.equal((await data(await handleStripeInvoiceDraft(request(sample,"https://evil.example"),env,endpoint,actor))).status,403);
});
test("valid invoice request creates UNSENT Stripe draft with correct amount",async()=>{
 const env={STRIPE_INVOICING_ENABLED:"true",STRIPE_SECRET_KEY:"sk_test_sample"};
 const previous=globalThis.fetch,operations=[];
 globalThis.fetch=async(url,opts)=>{
  const route=String(url).replace("https://api.stripe.com/v1/","");
  const params=Object.fromEntries(new URLSearchParams(opts.body));
  operations.push({route,params});
  const id=route==="customers"?"cus_mock123":route==="invoices"?"in_mock123":"ii_mock123";
  return {ok:true,json:async()=>({id,status:"draft"})};
 };
 try{
  const result=await data(await handleStripeInvoiceDraft(request(sample),env,endpoint,actor));
  assert.equal(result.status,201);
  assert.equal(result.sent,false);
  assert.equal(result.invoice_id,"in_mock123");
  assert.deepEqual(operations.map(x=>x.route),["customers","invoices","invoiceitems"]);
  assert.equal(operations[1].params.auto_advance,"false");
  assert.equal(operations[1].params.collection_method,"send_invoice");
  assert.equal(operations[2].params.amount,"12500");
  assert.equal(operations[2].params.invoice,"in_mock123");
  assert.ok(!operations.some(x=>x.route.includes("send")),"Draft API must not email customer");
 }finally{globalThis.fetch=previous}
});
