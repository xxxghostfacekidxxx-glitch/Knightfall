/* Knightfall Deck Locker: shared across all catalogued playing-card games.
   Free and locally earned skins are cosmetic only. Premium skins are catalogue
   previews until an authenticated payment/entitlement system is activated. */
(()=>{
 "use strict";
 if(window.AshFallDeckSkins)return;
 const SKINS=Object.freeze([
  {id:"ash-classic",name:"Ash Classic",kind:"free",tag:"ORIGINAL",description:"The clean Knightfall card face."},
  {id:"neon-riot",name:"Neon Riot",kind:"free",tag:"FREE",description:"Shock pink, electric lime and club lights."},
  {id:"bone-white",name:"Bone White",kind:"free",tag:"FREE",description:"Ivory stock with ink-black typography."},
  {id:"grave-velvet",name:"Grave Velvet",kind:"unlock",deals:3,tag:"3 DEALS",description:"Deep velvet purple and silver trim."},
  {id:"glitch-circuit",name:"Glitch Circuit",kind:"unlock",deals:10,tag:"10 DEALS",description:"Chromatic static and pixel-cut edges."},
  {id:"ghost-orchid",name:"Ghost Orchid",kind:"unlock",deals:25,tag:"25 DEALS",description:"An eerie spectral bloom."},
  {id:"infernal-foil",name:"Infernal Foil",kind:"unlock",deals:50,tag:"50 DEALS",description:"Fire-forged golden foil."},
  {id:"void-royalty",name:"Void Royalty",kind:"premium",price_cents:199,tag:"COMING SOON",description:"Royal violet enamel and obsidian."},
  {id:"crimson-rite",name:"Crimson Rite",kind:"premium",price_cents:199,tag:"COMING SOON",description:"Deep crimson wax seal finish."},
  {id:"holo-wraith",name:"Holo Wraith",kind:"premium",price_cents:299,tag:"COMING SOON",description:"Prismatic hologram shimmer."},
  {id:"toxic-pop",name:"Toxic Pop",kind:"premium",price_cents:299,tag:"COMING SOON",description:"Acid-green comic-book lacquer."},
  {id:"eclipse-noir",name:"Eclipse Noir",kind:"premium",price_cents:399,tag:"COMING SOON",description:"Black-on-black luxury embossed backs."}
 ]);
 const skinMap=new Map(SKINS.map(s=>[s.id,s]));
 const STORAGE_KEY="ashfall:deck-locker:selected:v1";
 const PROGRESS_KEY="ashfall:deck-locker:deals:v1";
 const read=(key)=>{try{return window.localStorage.getItem(key)}catch{return null}};
 const write=(key,value)=>{try{window.localStorage.setItem(key,value);return true}catch{return false}};
 const root=document.documentElement;
 let localDeals=Math.min(100000,Math.max(0,Number.parseInt(read(PROGRESS_KEY)||"0",10)||0));
 let deals=localDeals;
 const account={ready:false,userId:null,revision:0,owned:new Set(),imported:false,status:"Checking account sync…"};
 const API="https://api.ash-fall.com/api/arcade/deck-locker";
 const allowed=skin=>skin?.kind==="free"||(skin?.kind==="unlock"&&deals>=skin.deals)
  ||(skin?.kind==="premium"&&account.ready&&account.owned.has(skin.id));
 let chosen=read(STORAGE_KEY)||"ash-classic";
 if(!allowed(skinMap.get(chosen)))chosen="ash-classic";
 const updateDocument=()=>{root.dataset.kfDeckSkin=chosen;root.style.colorScheme="dark"};
 updateDocument();
 let locker=null,renderCardList=null,mutations=Promise.resolve(),syncing=null;
 const request=async(method="GET",body=null)=>{
  const response=await window.fetch(API,{
   method,credentials:"include",cache:"no-store",
   headers:body?{"content-type":"application/json"}:undefined,
   body:body?JSON.stringify(body):undefined
  });
  const data=await response.json().catch(()=>({error:"Account sync did not return JSON."}));
  if(!response.ok){
   const error=new Error(data.error||"Deck Locker sync unavailable.");
   error.status=response.status;error.data=data;throw error;
  }
  return data;
 };
 function applyAccount(data){
  if(!data||!data.profile||!Number.isSafeInteger(Number(data.user_id)))throw Error("Invalid Deck Locker account response.");
  account.ready=true;account.userId=Number(data.user_id);
  account.revision=Math.max(0,Math.floor(Number(data.profile.revision)||0));
  account.imported=!!data.profile.local_imported;
  account.owned=new Set((Array.isArray(data.owned_skin_ids)?data.owned_skin_ids:[])
   .filter(id=>skinMap.get(id)?.kind==="premium"));
  deals=Math.min(100000,Math.max(0,Math.floor(Number(data.profile.earned_deals)||0)));
  const selected=data.profile.equipped_skin;
  chosen=allowed(skinMap.get(selected))?selected:"ash-classic";
  write(STORAGE_KEY,chosen);updateDocument();
  account.status="✓ Synced to your Knightfall account";
  if(renderCardList)renderCardList();
 }
 async function syncNow(){
  if(typeof window.fetch!=="function")return false;
  if(syncing)return syncing;
  account.status="Checking Knightfall account…";
  if(renderCardList)renderCardList();
  syncing=(async()=>{
   try{applyAccount(await request());return true}
   catch(error){
    if(error.status===401){
     account.ready=false;account.userId=null;account.owned.clear();
     deals=localDeals;
     const local=read(STORAGE_KEY)||"ash-classic";
     chosen=allowed(skinMap.get(local))?local:"ash-classic";updateDocument();
     account.status="Guest · sign in to sync skins across devices";
    }else{
     // Never trust a cached premium selection while the API is unavailable.
     if(!account.ready) {
      deals=localDeals;
      if(!allowed(skinMap.get(chosen)))chosen="ash-classic";
      updateDocument();
     }
     account.status="Offline · local styles still work. Account sync unavailable.";
    }
    if(renderCardList)renderCardList();
    return false;
   }finally{syncing=null}
  })();
  return syncing;
 }
 function enqueue(operation){
  mutations=mutations.then(operation,operation).catch(error=>{
   account.status="Sync paused: "+String(error?.message||error).slice(0,100);
   if(error?.status===401){account.ready=false;account.owned.clear();deals=localDeals;
    if(!allowed(skinMap.get(chosen)))chosen="ash-classic";updateDocument();}
   if(renderCardList)renderCardList();
  });
  return mutations;
 }
 function chooseSkin(id){
  const skin=skinMap.get(id);
  if(!allowed(skin))return false;
  chosen=id;write(STORAGE_KEY,id);updateDocument();
  if(renderCardList)renderCardList();
  window.dispatchEvent(new CustomEvent("ashfall:deck-skin-change",{detail:{id}}));
  if(account.ready){
   enqueue(async()=>{
    let data;
    try{data=await request("PUT",{skin_id:id,revision:account.revision})}
    catch(error){
     if(error.status===409){
      await syncNow();
      if(account.ready&&allowed(skinMap.get(id)))
       data=await request("PUT",{skin_id:id,revision:account.revision});
     }else throw error;
    }
    if(data)applyAccount(data);
   });
  }
  return true;
 }
 function recordDeal(gameKey){
  if(typeof gameKey!=="string"||!/^[a-z0-9-]{3,64}$/.test(gameKey))return deals;
  localDeals=Math.min(100000,localDeals+1);
  write(PROGRESS_KEY,String(localDeals));
  if(!account.ready)deals=localDeals;
  if(renderCardList)renderCardList();
  if(account.ready){
   const eventId=typeof crypto!=="undefined"&&crypto.randomUUID?crypto.randomUUID():
    "deck-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);
   enqueue(async()=>{applyAccount(await request("POST",{action:"deal",game_key:gameKey,event_id:eventId}))});
  }
  return deals;
 }
 function importLegacy(){
  if(!account.ready||account.imported||localDeals<=deals)return false;
  enqueue(async()=>{applyAccount(await request("POST",{action:"import",legacy_deals:Math.min(50,localDeals)}))});
  return true;
 }
 function make(tag,className,text){
  const el=document.createElement(tag);
  if(className)el.className=className;
  if(text!==undefined)el.textContent=text;
  return el;
 }
 function render(){
  if(!locker)return;
  locker.replaceChildren();
  const heading=make("div","kf-deck-intro");
  const intro=make("div");
  intro.append(make("strong",null,"CHOOSE YOUR CARD FINISH"),make("p",null,"One wardrobe across every card table. Cosmetic only; game rules stay unchanged."));
  const prog=make("div","kf-deck-progress",deals+" recorded deals"+(account.ready?" · account":" · device"));
  heading.append(intro,prog);
  locker.append(heading);
  const syncStatus=make("div","kf-deck-sync-status");
  const message=make("span","kf-deck-status-text",account.status);
  syncStatus.append(message);
  if(account.ready&&!account.imported&&localDeals>deals){
   const importer=make("button","kf-deck-import","Import up to 50 legacy device deals");
   importer.type="button";
   importer.title="One-time import of existing device-only cosmetic progress. This is not proof of a completed game.";
   importer.addEventListener("click",importLegacy);
   syncStatus.append(importer);
  }
  const refresh=make("button","kf-deck-refresh","↻ Sync");
  refresh.type="button";refresh.addEventListener("click",syncNow);
  syncStatus.append(refresh);
  locker.append(syncStatus);
  const grid=make("div","kf-deck-grid");
  for(const skin of SKINS){
   const available=allowed(skin),premium=skin.kind==="premium";
   const item=make("article","kf-deck-item"+(skin.id===chosen?" is-selected":"")+(available?"":" is-locked"));
   const preview=make("div","kf-deck-preview kf-deck-preview--"+skin.id);
   preview.setAttribute("aria-hidden","true");
   preview.append(make("span","kf-deck-preview-star","✦"),make("span","kf-deck-preview-mark","ASH / FALL"));
   const info=make("div","kf-deck-item-copy");
   info.append(make("strong",null,skin.name),make("small",null,skin.description));
   const meta=make("span","kf-deck-kind",skin.kind==="free"?"FREE":premium?"PREMIUM":available?"UNLOCKED":"LOCKED");
   const button=make("button","kf-deck-choice",skin.id===chosen?"✓ Equipped":available?"Equip":premium?"Not available yet":`Unlock at ${skin.deals} deals`);
   button.type="button";
   button.disabled=!available||skin.id===chosen;
   button.setAttribute("aria-label",(skin.id===chosen?"Equipped ":available?"Equip ":"Locked ")+skin.name);
   if(available&&skin.id!==chosen)button.addEventListener("click",()=>chooseSkin(skin.id));
   const footer=make("div","kf-deck-item-footer");
   footer.append(meta,button);
   if(premium){
    const link=make("a","kf-deck-premium-link",`Shop preview $ ${(skin.price_cents/100).toFixed(2)}`);
    link.href="/cinder-shop.html#deck-skin-"+skin.id;
    footer.append(link);
   }else if(skin.kind==="unlock"&&!available){
    footer.append(make("span","kf-deck-progress-mini",deals+" / "+skin.deals+" deals"));
   }
   item.append(preview,info,footer);
   grid.append(item);
  }
  locker.append(grid);
  const note=make("p","kf-deck-disclaimer",account.ready
   ?"Skins and cosmetic play progress are saved to your account. Local game activity is rate-limited, not independently game-verified. Premium ownership requires server-issued entitlements; checkout is not live."
   :"Guest progress stays on this device. Sign in to save earned styles across devices; premium checkout remains disabled.");
  locker.append(note);
 }
 function init(){
  const slot=document.querySelector("main")||document.body;
  if(!slot||document.getElementById("kf-deck-wardrobe"))return;
  const shell=make("details","kf-deck-wardrobe");
  shell.id="kf-deck-wardrobe";
  const summary=make("summary","kf-deck-toggle");
  const mark=make("span","kf-deck-toggle-mark","♠");
  const label=make("span","kf-deck-toggle-label");
  label.append(make("strong",null,"Deck Locker"),make("small",null,"Customize cards across the arcade"));
  const current=make("span","kf-deck-current",skinMap.get(chosen).name);
  summary.append(mark,label,current);
  locker=make("div","kf-deck-panel");
  shell.append(summary,locker);
  slot.insertBefore(shell,slot.firstChild);
  renderCardList=()=>{current.textContent=skinMap.get(chosen).name;render()};
  shell.addEventListener("toggle",()=>{if(shell.open)renderCardList()});
  renderCardList();
  if(location.hash==="#kf-deck-wardrobe")shell.open=true;
  // Never block arcade gameplay on account availability or an offline connection.
  void syncNow();
 }
 const onStorage=e=>{
  if(e.key===PROGRESS_KEY){const value=Number.parseInt(e.newValue||"0",10)||0;
   localDeals=Math.min(100000,Math.max(0,value));if(!account.ready)deals=localDeals;}
  if(e.key===STORAGE_KEY){const next=e.newValue||"ash-classic";chosen=allowed(skinMap.get(next))?next:"ash-classic";updateDocument();
   if(account.ready)void syncNow();}
  if(renderCardList)renderCardList();
 };
 window.addEventListener("storage",onStorage);
 window.AshFallDeckSkins=Object.freeze({
  skins:SKINS,recordDeal,chooseSkin,refresh:syncNow,importLegacy,
  get current(){return chosen},
  get localDeals(){return deals},
  get deviceDeals(){return localDeals},
  get accountSynced(){return account.ready},
  get accountId(){return account.userId},
  get ownedPremium(){return [...account.owned]},
  isAvailable:id=>allowed(skinMap.get(id))
 });
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();