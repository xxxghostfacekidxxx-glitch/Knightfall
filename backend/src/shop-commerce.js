// Seller commerce foundations for Knightfall. No payments or fulfillment are initiated here.
const SHOP_ID = /^[a-f0-9]{32}$/;
const SKU = /^[A-Z0-9][A-Z0-9._-]{1,63}$/;
const STATES = new Set(["unknown","available","unavailable","preorder"]);
const PROFILE_FIELDS=["support_email","contact_url","shipping_policy","returns_policy","processing_min_days","processing_max_days"];
const pick=(row,keys)=>Object.fromEntries(keys.map(k=>[k,row[k]]));
export function validateShopBusiness(body) {
 if(!body||typeof body!=="object"||Array.isArray(body))return {error:"Provide a valid business profile object."};
 const profile={};
 for(const key of ["support_email","contact_url","shipping_policy","returns_policy"]) {
  const value=body[key]??"";
  if(typeof value!=="string")return {error:key+" must be text."};
  profile[key]=value.trim();
 }
 if(profile.support_email.length>254||profile.support_email&& !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.support_email))
  return {error:"Enter a valid seller support email address."};
 if(profile.contact_url) {try{const u=new URL(profile.contact_url);if(u.protocol!=="https:"||u.username||u.password)throw Error();}catch{return {error:"Contact website must be a valid HTTPS address."};}}
 if(profile.contact_url.length>500)return {error:"Contact website link is too long."};
 if(profile.shipping_policy.length>3000||profile.returns_policy.length>3000)return {error:"Shipping and returns policies must each be at most 3,000 characters."};
 for(const key of ["processing_min_days","processing_max_days"]) {
  const value=body[key]??(key==="processing_min_days"?1:14);
  if(!Number.isInteger(value)||value<0||value>365)return {error:key+" must be between 0 and 365 days."};
  profile[key]=value;
 }
 if(profile.processing_min_days>profile.processing_max_days)return {error:"Minimum processing days cannot exceed the maximum."};
 return {profile};
}
export function validateShopVariant(body) {
 if(!body||typeof body!=="object"||Array.isArray(body))return {error:"Provide a valid product variant object."};
 const raw={};
 for(const key of ["product_id","label","sku","supplier_sku","stock_status"]) {
  if(body[key]!==undefined && typeof body[key]!=="string")return {error:key+" must be text."};
  raw[key]=String(body[key]??"").trim();
 }
 if(!SHOP_ID.test(raw.product_id))return {error:"Choose a valid product."};
 if(!raw.label||raw.label.length>100)return {error:"Variant name must be 1–100 characters."};
 raw.sku=raw.sku.toUpperCase();
 if(!SKU.test(raw.sku))return {error:"SKU must be 2–64 characters containing letters, numbers, dots, hyphens or underscores."};
 if(raw.supplier_sku.length>128)return {error:"Private supplier SKU is too long."};
 raw.stock_status=raw.stock_status||"unknown";
 if(!STATES.has(raw.stock_status))return {error:"Choose a valid stock status."};
 for(const key of ["price_cents","supplier_cost_cents"]) {
  if(!Number.isSafeInteger(body[key])||body[key]<0||body[key]>100000000)return {error:key+" must be a valid amount in cents."};
  raw[key]=body[key];
 }
 if(typeof body.is_active!=="boolean")return {error:"Variant availability must be true or false."};
 raw.is_active=body.is_active?1:0;
 return {variant:raw};
}
export async function handleShopCommerce(request,env,origin,url,user,{json,randomToken,rateLimit,audit}) {
 const path=url.pathname;
 const publicBusiness=path.match(/^\/api\/shops\/([a-z0-9-]{1,80})\/business$/);
 const publicVariants=path.match(/^\/api\/shops\/([a-z0-9-]{1,80})\/variants$/);
 const variantItem=path.match(/^\/api\/my-shop\/variants\/([a-f0-9]{32})$/);
 const method=request.method;
 try {
  if(publicBusiness||publicVariants) {
   if(method!=="GET")return json({error:"Method not allowed."},405,origin);
   const shop=await env.DB.prepare("SELECT s.id FROM shops s JOIN users u ON u.id=s.owner_id WHERE s.slug=? AND s.is_public=1 AND u.status='active'").bind((publicBusiness||publicVariants)[1]).first();
   if(!shop)return json({error:"Storefront not found."},404,origin);
   if(publicBusiness) {
    const profile=await env.DB.prepare("SELECT support_email,contact_url,shipping_policy,returns_policy,processing_min_days,processing_max_days FROM shop_business_profiles WHERE shop_id=?").bind(shop.id).first();
    return json({business:profile||null},200,origin);
   }
   const productId=url.searchParams.get("product_id");
   if(!SHOP_ID.test(productId||""))return json({error:"Specify a valid product ID."},400,origin);
   const product=await env.DB.prepare("SELECT id FROM shop_products WHERE id=? AND shop_id=? AND is_active=1 AND deleted_at IS NULL").bind(productId,shop.id).first();
   if(!product)return json({error:"Product unavailable."},404,origin);
   const rows=await env.DB.prepare("SELECT id,product_id,label,sku,price_cents,stock_status FROM shop_product_variants WHERE shop_id=? AND product_id=? AND is_active=1 AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 40").bind(shop.id,productId).all();
   return json({variants:rows.results||[]},200,origin);
  }
  if(!user)return json({error:"Sign in to manage your shop."},401,origin);
  const shop=await env.DB.prepare("SELECT id FROM shops WHERE owner_id=?").bind(user.id).first();
  if(!shop)return json({error:"Create a shop before managing commerce details."},404,origin);
  if(path==="/api/my-shop/business") {
   if(method==="GET"){
    const profile=await env.DB.prepare("SELECT "+PROFILE_FIELDS.join(",")+" FROM shop_business_profiles WHERE shop_id=?").bind(shop.id).first();
    return json({business:profile||null},200,origin);
   }
   if(method!=="PUT")return json({error:"Method not allowed."},405,origin);
   if(!await rateLimit(env,request,"shop-business-save",15,600))return json({error:"Too many changes. Try again later."},429,origin);
   let body;try{body=await request.json()}catch{return json({error:"Invalid JSON."},400,origin)}
   const parsed=validateShopBusiness(body);
   if(parsed.error)return json({error:parsed.error},400,origin);
   const p=parsed.profile;
   await env.DB.prepare("INSERT INTO shop_business_profiles (shop_id,support_email,contact_url,shipping_policy,returns_policy,processing_min_days,processing_max_days,updated_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(shop_id) DO UPDATE SET support_email=excluded.support_email,contact_url=excluded.contact_url,shipping_policy=excluded.shipping_policy,returns_policy=excluded.returns_policy,processing_min_days=excluded.processing_min_days,processing_max_days=excluded.processing_max_days,updated_at=excluded.updated_at")
    .bind(shop.id,...PROFILE_FIELDS.map(k=>p[k]),new Date().toISOString()).run();
   await audit(env,user,"shop.business.update","shop",null,{shop_id:shop.id});
   return json({ok:true,business:p},200,origin);
  }
  if(path==="/api/my-shop/orders") {
   if(method!=="GET")return json({error:"Method not allowed."},405,origin);
   // Read-only until the server-side payment and fulfillment pipeline is audited.
   const rows=await env.DB.prepare("SELECT id,state,currency,subtotal_cents,shipping_cents,tax_cents,total_cents,created_at,updated_at FROM shop_orders WHERE shop_id=? ORDER BY created_at DESC LIMIT 50").bind(shop.id).all();
   return json({orders:rows.results||[],checkout_enabled:false},200,origin);
  }
  if(path==="/api/my-shop/variants"&&method==="GET") {
   const productId=url.searchParams.get("product_id");
   if(!SHOP_ID.test(productId||""))return json({error:"Specify a valid product ID."},400,origin);
   const product=await env.DB.prepare("SELECT id FROM shop_products WHERE id=? AND shop_id=? AND deleted_at IS NULL").bind(productId,shop.id).first();
   if(!product)return json({error:"Product not found."},404,origin);
   const rows=await env.DB.prepare("SELECT id,product_id,label,sku,supplier_sku,price_cents,supplier_cost_cents,stock_status,is_active,created_at,updated_at FROM shop_product_variants WHERE shop_id=? AND product_id=? AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 40").bind(shop.id,productId).all();
   return json({variants:(rows.results||[]).map(v=>({...v,is_active:Number(v.is_active)===1}))},200,origin);
  }
  if(path==="/api/my-shop/variants"&&method==="POST") {
   if(!await rateLimit(env,request,"shop-variant-create",30,600))return json({error:"Too many variant changes. Try again later."},429,origin);
   let body;try{body=await request.json()}catch{return json({error:"Invalid JSON."},400,origin)}
   const checked=validateShopVariant(body);
   if(checked.error)return json({error:checked.error},400,origin);
   const v=checked.variant;
   const product=await env.DB.prepare("SELECT id FROM shop_products WHERE id=? AND shop_id=? AND deleted_at IS NULL").bind(v.product_id,shop.id).first();
   if(!product)return json({error:"Product not found."},404,origin);
   const count=await env.DB.prepare("SELECT COUNT(*) AS count FROM shop_product_variants WHERE shop_id=? AND product_id=? AND deleted_at IS NULL").bind(shop.id,v.product_id).first();
   if(Number(count?.count||0)>=40)return json({error:"Each product supports up to 40 variants."},409,origin);
   const id=randomToken(16),now=new Date().toISOString();
   try {
    await env.DB.prepare("INSERT INTO shop_product_variants(id,shop_id,product_id,label,sku,supplier_sku,price_cents,supplier_cost_cents,stock_status,is_active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
    .bind(id,shop.id,v.product_id,v.label,v.sku,v.supplier_sku,v.price_cents,v.supplier_cost_cents,v.stock_status,v.is_active,now,now).run();
   }catch(e){if(String(e).includes("UNIQUE"))return json({error:"SKU already exists in this shop."},409,origin);throw e}
   await audit(env,user,"shop.variant.create","shop_variant",null,{shop_id:shop.id,product_id:v.product_id,sku:v.sku});
   return json({ok:true,variant:{id,...v,is_active:!!v.is_active}},201,origin);
  }
  if(variantItem&&(method==="PATCH"||method==="DELETE")) {
   const variant=await env.DB.prepare("SELECT id,product_id,label,sku,supplier_sku,price_cents,supplier_cost_cents,stock_status,is_active FROM shop_product_variants WHERE id=? AND shop_id=? AND deleted_at IS NULL").bind(variantItem[1],shop.id).first();
   if(!variant)return json({error:"Variant not found."},404,origin);
   if(method==="DELETE"){
    await env.DB.prepare("UPDATE shop_product_variants SET deleted_at=?,updated_at=? WHERE id=? AND shop_id=? AND deleted_at IS NULL").bind(new Date().toISOString(),new Date().toISOString(),variant.id,shop.id).run();
    await audit(env,user,"shop.variant.delete","shop_variant",null,{shop_id:shop.id,variant_id:variant.id});
    return json({ok:true,soft_deleted:true},200,origin);
   }
   let body;try{body=await request.json()}catch{return json({error:"Invalid JSON."},400,origin)}
   // Product ownership never changes on edits.
   const checked=validateShopVariant({...variant,...body,product_id:variant.product_id,is_active:body.is_active===undefined?!!variant.is_active:body.is_active});
   if(checked.error)return json({error:checked.error},400,origin);
   const v=checked.variant;
   try{
    await env.DB.prepare("UPDATE shop_product_variants SET label=?,sku=?,supplier_sku=?,price_cents=?,supplier_cost_cents=?,stock_status=?,is_active=?,updated_at=? WHERE id=? AND shop_id=?")
     .bind(v.label,v.sku,v.supplier_sku,v.price_cents,v.supplier_cost_cents,v.stock_status,v.is_active,new Date().toISOString(),variant.id,shop.id).run();
   }catch(e){if(String(e).includes("UNIQUE"))return json({error:"SKU already exists in this shop."},409,origin);throw e}
   await audit(env,user,"shop.variant.update","shop_variant",null,{shop_id:shop.id,variant_id:variant.id});
   return json({ok:true},200,origin);
  }
  return json({error:"Shop commerce endpoint not found."},404,origin);
 }catch(e){
  if(/no such table: shop_(business_profiles|product_variants|orders)/i.test(String(e)))return json({error:"Shop commerce upgrade is awaiting its database migration."},503,origin);
  throw e;
 }
}
