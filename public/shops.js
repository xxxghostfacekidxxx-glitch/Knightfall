(() => {
"use strict";
const API="https://api.ash-fall.com";
const root=document.querySelector("#public-shops");
const count=document.querySelector("#shop-total");
const results=document.querySelector("#shop-results");
const search=document.querySelector("#shop-search");
const type=document.querySelector("#shop-type");
if(!root)return;
const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
let allShops=[];
function render(){
  const term=(search?.value||"").trim().toLowerCase();
  const kind=type?.value||"";
  const shops=allShops.filter(shop=>(!kind||shop.template===kind)&&(!term||[shop.name,shop.description,shop.niche,shop.owner_username].some(value=>String(value||"").toLowerCase().includes(term))));
  if(results)results.textContent=shops.length+" of "+allShops.length+" published shops shown";
  root.innerHTML=shops.length?shops.map(shop=>'<article class="listing-card"><div class="listing-symbol" aria-hidden="true">◇</div><span class="listing-kicker">'+esc(shop.template||"independent shop").replace(/-/g," ").toUpperCase()+'</span><h2>'+esc(shop.name)+'</h2><p class="listing-description">'+esc(shop.description||shop.niche||"Independent creator storefront.")+'</p><p class="listing-owner">By <strong>'+esc(shop.owner_username)+'</strong></p><a class="primary-button" href="/store.html?slug='+encodeURIComponent(shop.slug)+'">Visit storefront</a></article>').join(""):'<div class="empty-state"><strong>No matching shops.</strong>Try another search or category.</div>';
}
async function load(){
  root.innerHTML='<p class="empty-state">Loading published shops…</p>';
  try{
    const response=await fetch(API+"/api/shops",{cache:"no-store"});
    if(!response.ok)throw Error("Shop directory temporarily unavailable.");
    const data=await response.json();
    allShops=Array.isArray(data.shops)?data.shops:[];
    if(count)count.textContent=allShops.length+" public "+(allShops.length===1?"shop":"shops");
    render();
  }catch(error){
    if(count)count.textContent="Directory unavailable";
    if(results)results.textContent="";
    root.innerHTML='<div class="empty-state"><strong>Could not load shops.</strong><p>'+esc(error.message)+'</p><button class="quiet-button" id="shop-retry" type="button">Try again</button></div>';
    document.querySelector("#shop-retry")?.addEventListener("click",load);
  }
}
search?.addEventListener("input",render);
type?.addEventListener("change",render);
load();
})();
