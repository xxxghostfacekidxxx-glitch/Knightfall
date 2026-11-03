(()=>{"use strict";
const API="https://api.ash-fall.com";
const $=selector=>document.querySelector(selector);
const root=$("#public-bots"),total=$("#bot-total"),form=$("#bot-search"),input=$("#bot-query");
const categories=$("#bot-categories"),summary=$("#bot-feature-count");
const categoryOptions=["All","Community","Art & Design","Writing","Music","Coding","Gaming","Learning","Research","DIY & Tech","Business & Ideas","Everyday","Community-built"];
let allBots=[],activeCategory="All",request=0;
function make(tag,className,text){
 const element=document.createElement(tag);if(className)element.className=className;
 if(text!==undefined)element.textContent=String(text);
 return element;
}
function filtered(){
 return allBots.filter(bot=>activeCategory==="All"||
  (activeCategory==="Community-built"?!bot.system_bot:bot.category===activeCategory));
}
function categoryMenu(){
 if(!categories)return;
 categories.replaceChildren();
 for(const name of categoryOptions){
  const button=make("button","bot-category-filter",name);
  button.type="button";button.setAttribute("aria-pressed",String(activeCategory===name));
  button.addEventListener("click",()=>{
   activeCategory=name;categoryMenu();render();
  });
  categories.append(button);
 }
}
function render(){
 if(!root)return;
 const bots=filtered(),official=bots.filter(x=>x.system_bot),community=bots.length-official.length;
 total.textContent=bots.length+" public "+(bots.length===1?"bot":"bots")+" · "+official.length+" Knightfall originals · "+community+" community creations";
 if(summary)summary.textContent=allBots.filter(x=>x.system_bot).length+" original starter bots";
 root.replaceChildren();
 if(!bots.length){
  const empty=make("div","empty-state"),title=make("strong","","Nothing matched your search."),hint=make("p","","Try a different category or search. You can also explore all starter bots.");
  const reset=make("button","quiet-button","Show all public bots");reset.type="button";
  reset.addEventListener("click",()=>{activeCategory="All";input.value="";categoryMenu();load()});
  empty.append(title,hint,reset);root.append(empty);return;
 }
 for(const bot of bots){
  if(!/^[a-f0-9]{32}$/.test(String(bot.id||"")))continue;
  const card=make("article","listing-card public-bot-card"+(bot.system_bot?" is-official":""));
  const top=make("div","public-bot-card-top"),symbol=make("span","listing-symbol",bot.symbol||"✳"),tags=make("div","public-bot-card-tags");
  symbol.setAttribute("aria-hidden","true");
  tags.append(make("span","listing-kicker",bot.system_bot?"KNIGHTFALL ORIGINAL":"COMMUNITY CREATED"));
  tags.append(make("span",bot.is_nsfw?"nsfw-listing-badge":"sfw-listing-badge",bot.is_nsfw?"18+ · NSFW":"GENERAL · SFW"));
  top.append(symbol,tags);
  card.append(top);
  if(bot.category)card.append(make("span","public-bot-specialty",bot.category));
  card.append(make("h2","",bot.name||"Unnamed bot"));
  if(bot.tagline)card.append(make("p","public-bot-tagline",bot.tagline));
  card.append(make("p","listing-description",bot.description||"A public AI bot."));
  if(Array.isArray(bot.starters)&&bot.starters.length){
   const example=make("p","public-bot-card-example",bot.starters[0]);
   example.setAttribute("aria-label","Example conversation starter");
   card.append(example);
  }
  const bottom=make("div","public-bot-card-bottom");
  bottom.append(make("span","listing-owner",bot.system_bot?"Created by Knightfall":"Created by @"+(bot.owner_username||"member")));
  const link=make("a","primary-button","Start chatting ↗");link.href="/bot.html?id="+encodeURIComponent(bot.id);
  bottom.append(link);card.append(bottom);root.append(card);
 }
}
async function load(){
 const version=++request;
 root.replaceChildren(make("p","empty-state","Loading public bots…"));
 try{
  const q=input.value.trim(),uri=API+"/api/public-bots"+(q?"?q="+encodeURIComponent(q):"");
  const response=await fetch(uri,{cache:"no-store",credentials:"omit"});
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!Array.isArray(data.bots))throw Error(data.error||"The directory could not be loaded.");
  if(version!==request)return;
  allBots=data.bots;render();
 }catch(error){
  if(version!==request)return;
  total.textContent="Public directory unavailable";
  root.replaceChildren();
  const container=make("div","empty-state");
  container.append(make("strong","","Could not reach the public bot directory."),make("p","",error.message||"Connection failed."));
  const retry=make("button","quiet-button","Try again");retry.type="button";retry.addEventListener("click",load);
  container.append(retry);root.append(container);
 }
}
form?.addEventListener("submit",event=>{event.preventDefault();load()});
$("#bot-refresh")?.addEventListener("click",load);
$("#bot-reset-search")?.addEventListener("click",()=>{input.value="";activeCategory="All";categoryMenu();load()});
categoryMenu();load();
})();