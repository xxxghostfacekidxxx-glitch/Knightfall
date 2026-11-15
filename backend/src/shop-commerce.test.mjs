import test from "node:test";
import assert from "node:assert/strict";
import { validateShopBusiness, validateShopVariant, handleShopCommerce } from "./shop-commerce.js";

const validProfile={
 support_email:"seller@example.com",contact_url:"https://seller.example.com/contact",
 shipping_policy:"Ships in 5–8 business days",returns_policy:"Contact us within 30 days",
 processing_min_days:2,processing_max_days:7
};
const goodVariant={
 product_id:"a".repeat(32),label:"XL / Black",sku:"SHIRT-XL-BLACK",
 supplier_sku:"secret-vendor-321",price_cents:2900,supplier_cost_cents:1300,
 stock_status:"available",is_active:true
};
test("seller profile trims and validates policies and process ranges",()=>{
 const result=validateShopBusiness(validProfile);
 assert.equal(result.error,undefined);
 assert.equal(result.profile.support_email,"seller@example.com");
 assert.equal(result.profile.processing_max_days,7);
 for(const wrong of [
  {...validProfile,support_email:"invalid"},
  {...validProfile,contact_url:"javascript:alert(1)"},
  {...validProfile,contact_url:"http://seller.example.com"},
  {...validProfile,processing_min_days:30,processing_max_days:2},
  {...validProfile,shipping_policy:"x".repeat(3001)},
  {...validProfile,processing_min_days:-1}
 ]) assert.ok(validateShopBusiness(wrong).error);
});
test("seller SKU and supplier cost have strict validation",()=>{
 const v=validateShopVariant({...goodVariant,sku:"shirt-xl-black"});
 assert.equal(v.variant.sku,"SHIRT-XL-BLACK");
 assert.equal(v.variant.supplier_cost_cents,1300);
 for(const wrong of [
  {...goodVariant,sku:"bad sku"},
  {...goodVariant,sku:"a"},
  {...goodVariant,product_id:"bad"},
  {...goodVariant,supplier_cost_cents:-1},
  {...goodVariant,supplier_cost_cents:1.5},
  {...goodVariant,stock_status:"sold_out"},
  {...goodVariant,is_active:"true"},
 ]) assert.ok(validateShopVariant(wrong).error);
});
const deps={
 json:(value,status)=>({status,body:value}),
 randomToken:()=>"b".repeat(32),
 rateLimit:async()=>true,
 audit:async()=>{}
};
function fakeDB(resolver) {
 const calls=[];
 const DB={prepare:(sql)=>{
   const call={sql,args:[]};calls.push(call);
   const bound={bind:(...args)=>{call.args=args;return bound;},first:async()=>resolver(call,"first"),
       all:async()=>resolver(call,"all"),run:async()=>resolver(call,"run")};
   return bound;
 }};
 return {DB,calls};
}
const request=(path,method="GET",body)=>new Request("https://api.ash-fall.com"+path,{method,headers:body?{"content-type":"application/json"}:{},body:body?JSON.stringify(body):undefined});
const url=req=>new URL(req.url);
test("public business view only exposes approved profile fields",async()=>{
 const {DB,calls}=fakeDB((call,type)=>{
   if(call.sql.includes("FROM shops"))return {id:"c".repeat(32)};
   if(call.sql.includes("FROM shop_business_profiles"))return {...validProfile};
   throw Error("Unexpected query");
 });
 const req=request("/api/shops/example/business");
 const result=await handleShopCommerce(req,{DB},"https://ash-fall.com",url(req),null,deps);
 assert.equal(result.status,200);
 assert.equal(result.body.business.support_email,"seller@example.com");
 assert.ok(calls.every(x=>!x.sql.includes("supplier_sku")));
});
test("public variants reject missing product and never select supplier costs",async()=>{
 const {DB,calls}=fakeDB(call=>{
  if(call.sql.includes("FROM shops"))return {id:"c".repeat(32)};
  if(call.sql.includes("FROM shop_products"))return {id:goodVariant.product_id};
  if(call.sql.includes("FROM shop_product_variants"))return {results:[{id:"b".repeat(32),label:"XL",price_cents:2900,sku:"SHIRT-XL",stock_status:"available"}]};
 });
 const bad=request("/api/shops/example/variants");
 const badResult=await handleShopCommerce(bad,{DB},"https://ash-fall.com",url(bad),null,deps);
 assert.equal(badResult.status,400);
 const good=request("/api/shops/example/variants?product_id="+goodVariant.product_id);
 const result=await handleShopCommerce(good,{DB},"https://ash-fall.com",url(good),null,deps);
 assert.equal(result.status,200);
 assert.equal(result.body.variants.length,1);
 const variantQuery=calls.find(c=>c.sql.includes("FROM shop_product_variants"));
 assert.ok(variantQuery);
 assert.ok(!variantQuery.sql.includes("supplier_cost_cents"));
 assert.ok(!variantQuery.sql.includes("supplier_sku"));
});
test("seller owner scope protects private reads and rejects missing shops",async()=>{
 const {DB,calls}=fakeDB(call=>{
   if(call.sql.includes("FROM shops WHERE owner_id"))return null;
   throw Error("Unexpected");
 });
 const req=request("/api/my-shop/business");
 const result=await handleShopCommerce(req,{DB},"https://ash-fall.com",url(req),{id:321},deps);
 assert.equal(result.status,404);
 assert.equal(calls[0].args[0],321);
});
test("checkout is always disabled in read-only order endpoint",async()=>{
 const {DB}=fakeDB(call=>{
   if(call.sql.includes("FROM shops WHERE owner_id"))return {id:"c".repeat(32)};
   if(call.sql.includes("FROM shop_orders"))return {results:[]};
   throw Error("Unexpected");
 });
 const req=request("/api/my-shop/orders");
 const result=await handleShopCommerce(req,{DB},"https://ash-fall.com",url(req),{id:1},deps);
 assert.equal(result.status,200);
 assert.deepEqual(result.body.orders,[]);
 assert.equal(result.body.checkout_enabled,false);
});
test("missing production migration returns explicit safe 503",async()=>{
 const {DB}=fakeDB(call=>{
  if(call.sql.includes("FROM shops WHERE owner_id"))return {id:"c".repeat(32)};
  throw Error("D1_ERROR: no such table: shop_business_profiles");
 });
 const req=request("/api/my-shop/business");
 const result=await handleShopCommerce(req,{DB},"https://ash-fall.com",url(req),{id:1},deps);
 assert.equal(result.status,503);
});
