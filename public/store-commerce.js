(() => {
"use strict";
const API="https://api.ash-fall.com",q=s=>document.querySelector(s),slug=new URLSearchParams(location.search).get("slug");
const root=q("#store-business-details");if(!slug||!root)return;
const money=n=>(Number(n)/100).toLocaleString("en-US",{style:"currency",currency:"USD"});
async function load(path){
 const r=await fetch(API+path,{cache:"no-store"}),data=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(data.error||"Request failed.");return data;
}
function makePolicy(title,value){
 const card=document.createElement("article");card.className="store-policy-card";
 const h=document.createElement("h3");h.textContent=title;
 const p=document.createElement("p");p.textContent=value||"Not provided by this seller.";
 card.append(h,p);return card;
}
(async()=>{
 try{
  const {business:b}=await load("/api/shops/"+encodeURIComponent(slug)+"/business");
  root.replaceChildren();
  if(!b){root.append(makePolicy("Seller details","No published support or shipping policies yet."));return;}
  const contact=makePolicy("Customer support","");
  const p=contact.querySelector("p");p.remove();
  if(b.support_email){const a=document.createElement("a");a.href="mailto:"+b.support_email;a.textContent=b.support_email;contact.append(a);}
  if(b.contact_url){const a=document.createElement("a");a.href=b.contact_url;a.rel="noopener noreferrer";a.target="_blank";a.textContent="Seller contact website";contact.append(a);}
  if(!b.support_email&&!b.contact_url){const t=document.createElement("p");t.textContent="Contact information not published.";contact.append(t);}
  root.append(contact,makePolicy("Shipping policy",b.shipping_policy),makePolicy("Returns and refunds",b.returns_policy));
  const note=document.createElement("p");note.className="fulfillment-caution";
  note.textContent="Seller-reported processing time: "+b.processing_min_days+"–"+b.processing_max_days+" days before carrier delivery. Contact the seller for estimates.";
  root.append(note);
 }catch(e){root.textContent="Business details unavailable: "+e.message;}
})();
document.addEventListener("click",async e=>{
 const button=e.target.closest("button[data-public-options]");if(!button)return;
 const container=button.closest(".listing-card")?.querySelector("[data-public-variant-list]");
 if(!container)return;
 if(button.getAttribute("aria-expanded")==="true"){button.setAttribute("aria-expanded","false");container.hidden=true;return;}
 button.disabled=true;container.hidden=false;container.textContent="Loading options…";
 try{
  const {variants}=await load("/api/shops/"+encodeURIComponent(slug)+"/variants?product_id="+encodeURIComponent(button.dataset.publicOptions));
  container.replaceChildren();
  if(!variants?.length){container.textContent="This product has no additional options listed.";return;}
  const list=document.createElement("ul");list.className="public-variant-list";
  for(const v of variants){
   const li=document.createElement("li");
   const stock=v.stock_status==="available"?"Available (seller reported)":v.stock_status==="unavailable"?"Unavailable":v.stock_status==="preorder"?"Preorder":"Stock not verified";
   li.textContent=v.label+" · "+money(v.price_cents)+" · "+stock;list.append(li);
  }
  container.append(list);
 }catch(err){container.textContent=err.message;}
 finally{button.disabled=false;button.setAttribute("aria-expanded","true");}
});
})();
