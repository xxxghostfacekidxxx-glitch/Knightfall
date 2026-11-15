(() => {
"use strict";
const API="https://api.ash-fall.com";
const q=sel=>document.querySelector(sel);
const money=value=>(Number(value)/100).toLocaleString("en-US",{style:"currency",currency:"USD"});
let shop=null,products=[],variants=[],selectedProduct="",editingVariant=null,initialized=false;
async function api(path,options={}) {
 const response=await fetch(API+path,{credentials:"include",cache:"no-store",...options,headers:{...(options.body?{"content-type":"application/json"}:{}),...(options.headers||{})}});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(data.error||"Request failed ("+response.status+").");
 return data;
}
function status(selector,message,error=false){
 const element=q(selector);
 if(!element)return;
 element.textContent=message;
 element.classList.toggle("import-error",error);
}
function formValues(form,keys){return Object.fromEntries(keys.map(key=>[key,form.elements[key]?.value||""]));}
async function loadBusiness(){
 try{
  const result=await api("/api/my-shop/business");
  const business=result.business||{};
  const f=q("#shop-business-form");
  for(const key of ["support_email","contact_url","shipping_policy","returns_policy"]){f.elements[key].value=business[key]||"";}
  f.elements.processing_min_days.value=business.processing_min_days??1;
  f.elements.processing_max_days.value=business.processing_max_days??14;
  status("#business-status",business.updated_at?"Business information loaded.":"Add your customer support and shipping details before taking orders.");
 }catch(e){status("#business-status",e.message,true);}
}
q("#shop-business-form")?.addEventListener("submit",async e=>{
 e.preventDefault();const f=e.currentTarget;const button=f.querySelector('button[type="submit"]');
 const body={...formValues(f,["support_email","contact_url","shipping_policy","returns_policy"]),processing_min_days:Number(f.elements.processing_min_days.value),processing_max_days:Number(f.elements.processing_max_days.value)};
 button.disabled=true;try{await api("/api/my-shop/business",{method:"PUT",body:JSON.stringify(body)});status("#business-status","Saved. Public storefront visitors can now read your support and policy details.");}
 catch(err){status("#business-status",err.message,true);}finally{button.disabled=false;}
});
function dollarsToCents(value) {
 const s=String(value).trim();
 if(!/^\d{1,7}(?:\.\d{1,2})?$/.test(s))throw Error("Enter a dollar amount with no more than two decimals.");
 const cents=Math.round(Number(s)*100);
 if(!Number.isSafeInteger(cents)||cents>100000000)throw Error("Amount exceeds the allowed range.");
 return cents;
}
function renderVariants(){
 const root=q("#variant-list");
 if(!root)return;
 root.replaceChildren();
 if(!selectedProduct){root.textContent="Add a product to start creating variations.";return;}
 if(!variants.length){root.textContent="No variants yet. Add your first size, color or option above.";return;}
 for(const v of variants){
  const card=document.createElement("article");card.className="variant-card";
  const title=document.createElement("strong");title.textContent=v.label+" · "+v.sku;
  const detail=document.createElement("p");detail.textContent="Retail "+money(v.price_cents)+" · supplier cost "+money(v.supplier_cost_cents)+" · "+v.stock_status+(v.is_active?"":" · hidden");
  const actions=document.createElement("div");actions.className="variant-actions";
  for(const [label,action] of [["Edit","edit"],["Remove","delete"]]){
   const button=document.createElement("button");button.type="button";button.className="quiet-button";button.textContent=label;button.dataset.variantId=v.id;button.dataset.variantAction=action;actions.append(button);
  }
  card.append(title,detail,actions);root.append(card);
 }
}
async function refreshVariants(){
 if(!selectedProduct){variants=[];renderVariants();return;}
 try{const result=await api("/api/my-shop/variants?product_id="+encodeURIComponent(selectedProduct));variants=result.variants||[];renderVariants();status("#variant-status",variants.length+" product options loaded.");}
 catch(e){variants=[];renderVariants();status("#variant-status",e.message,true);}
}
function resetVariantForm(){
 editingVariant=null;const form=q("#variant-form");form.reset();
 form.elements.stock_status.value="unknown";form.elements.is_active.checked=true;
 form.querySelector('button[type="submit"]').textContent="Add product option";
 q("#variant-cancel").hidden=true;
}
function updateProducts(items){
 products=items||[];
 const select=q("#variant-product");
 const previous=selectedProduct;
 select.replaceChildren();
 const placeholder=document.createElement("option");placeholder.value="";placeholder.textContent=products.length?"Choose a product":"Add a product first";
 select.append(placeholder);
 for(const product of products){const option=document.createElement("option");option.value=product.id;option.textContent=product.name;select.append(option);}
 selectedProduct=products.some(p=>p.id===previous)?previous:"";
 select.value=selectedProduct;
 if(!initialized){initialized=true;loadBusiness();loadOrders();}
 if(!selectedProduct){variants=[];resetVariantForm();renderVariants();}
 else refreshVariants();
}
q("#variant-product")?.addEventListener("change",e=>{
 selectedProduct=e.target.value;resetVariantForm();refreshVariants();
});
q("#variant-cancel")?.addEventListener("click",resetVariantForm);
q("#variant-form")?.addEventListener("submit",async e=>{
 e.preventDefault();if(!selectedProduct){status("#variant-status","Choose a product before saving an option.",true);return;}
 const f=e.currentTarget,button=f.querySelector('button[type="submit"]');
 let payload;
 try{
  payload={
   product_id:selectedProduct,label:f.elements.label.value.trim(),sku:f.elements.sku.value.trim().toUpperCase(),
   supplier_sku:f.elements.supplier_sku.value.trim(),price_cents:dollarsToCents(f.elements.price.value),
   supplier_cost_cents:dollarsToCents(f.elements.cost.value),stock_status:f.elements.stock_status.value,
   is_active:f.elements.is_active.checked
  };
 }catch(err){status("#variant-status",err.message,true);return;}
 button.disabled=true;
 const wasEditing=!!editingVariant;
 try{
  const path=wasEditing?"/api/my-shop/variants/"+editingVariant:"/api/my-shop/variants";
  await api(path,{method:wasEditing?"PATCH":"POST",body:JSON.stringify(payload)});
  resetVariantForm();await refreshVariants();
  status("#variant-status",wasEditing?"Product option updated.":"Product option added.");
 }catch(err){status("#variant-status",err.message,true);}finally{button.disabled=false;}
});
q("#variant-list")?.addEventListener("click",async e=>{
 const button=e.target.closest("button[data-variant-action]");if(!button)return;
 const item=variants.find(v=>v.id===button.dataset.variantId);if(!item)return;
 if(button.dataset.variantAction==="edit"){
  const f=q("#variant-form");editingVariant=item.id;
  for(const key of ["label","sku","supplier_sku","stock_status"])f.elements[key].value=item[key]||"";
  f.elements.price.value=(item.price_cents/100).toFixed(2);
  f.elements.cost.value=(item.supplier_cost_cents/100).toFixed(2);
  f.elements.is_active.checked=item.is_active;
  f.querySelector('button[type="submit"]').textContent="Save option changes";q("#variant-cancel").hidden=false;
  f.scrollIntoView({behavior:"smooth",block:"center"});return;
 }
 if(!confirm("Remove variant '"+item.label+"' from this product?"))return;
 button.disabled=true;
 try{await api("/api/my-shop/variants/"+item.id,{method:"DELETE"});await refreshVariants();status("#variant-status","Variant removed from the catalog.");}
 catch(err){status("#variant-status",err.message,true);}finally{button.disabled=false;}
});
async function loadOrders(){
 try{
  const result=await api("/api/my-shop/orders");
  const root=q("#seller-order-list");root.replaceChildren();
  if(!result.orders?.length){root.textContent="No recorded customer orders. Live checkout remains disabled.";return;}
  for(const order of result.orders){
   const p=document.createElement("p");p.className="variant-card";
   p.textContent="Order "+order.id.slice(0,8)+" · "+order.state+" · "+money(order.total_cents)+" · "+order.created_at;
   root.append(p);
  }
 }catch(err){status("#order-status",err.message,true);}
}
document.addEventListener("knightfall:shop-refreshed",event=>{
 shop=event.detail?.shop||null;
 if(shop)updateProducts(event.detail?.products||[]);
});
})();
