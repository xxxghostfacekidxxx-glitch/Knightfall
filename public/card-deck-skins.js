/* Knightfall Deck Locker: all current cosmetic skins free for every player.
   Cosmetic choice never affects gameplay or paid card expansion ownership. */
(()=>{
 "use strict";
 if(window.AshFallDeckSkins)return;
 const SKINS=Object.freeze([
  {id:"ash-classic",name:"Ash Classic",kind:"free",tag:"FREE",symbol:"✦",description:"Charcoal linen, broken halo and bone-white crest."},
  {id:"neon-riot",name:"Neon Riot",kind:"free",tag:"FREE",symbol:"⚡",description:"Street-art stickers, laser streaks and electric edgework."},
  {id:"bone-white",name:"Bone White",kind:"free",tag:"FREE",symbol:"♣",description:"Vintage ivory engraving with black filigree."},
  {id:"grave-velvet",name:"Grave Velvet",kind:"free",tag:"FREE",symbol:"♠",description:"Royal plum velvet and silver damask."},
  {id:"glitch-circuit",name:"Glitch Circuit",kind:"free",tag:"FREE",symbol:"⌁",description:"Cyberpunk circuitry with interrupted light trails."},
  {id:"ghost-orchid",name:"Ghost Orchid",kind:"free",tag:"FREE",symbol:"✿",description:"Translucent floral etching on smoky jade."},
  {id:"infernal-foil",name:"Infernal Foil",kind:"free",tag:"FREE",symbol:"♜",description:"Molten copper, ember cracks and forged metal."},
  {id:"void-royalty",name:"Void Royalty",kind:"free",tag:"FREE",symbol:"♛",description:"Midnight enamel and ornamental heraldic foil."},
  {id:"crimson-rite",name:"Crimson Rite",kind:"free",tag:"FREE",symbol:"✧",description:"Scarlet wax seal and ritual geometry."},
  {id:"holo-wraith",name:"Holo Wraith",kind:"free",tag:"FREE",symbol:"◇",description:"Iridescent spectral foil with prismatic highlights."},
  {id:"toxic-pop",name:"Toxic Pop",kind:"free",tag:"FREE",symbol:"☢",description:"Graphic-novel splashes and radioactive green."},
  {id:"eclipse-noir",name:"Eclipse Noir",kind:"free",tag:"FREE",symbol:"☾",description:"Embossed black-on-black eclipse and satin silver."},
  {id:"obsidian-cathedral",name:"Obsidian Cathedral",kind:"premium",price_cents:100,tag:"$1.00",symbol:"♜",description:"Gothic arches, etched windows and black-gold foil."},
  {id:"mourning-rose",name:"Mourning Rose",kind:"premium",price_cents:125,tag:"$1.25",symbol:"✿",description:"Pressed black roses and antique blush engraving."},
  {id:"serpent-crown",name:"Serpent Crown",kind:"premium",price_cents:149,tag:"$1.49",symbol:"♛",description:"Emerald scales wrapped around a burnished crown."},
  {id:"arcane-tarot",name:"Arcane Tarot",kind:"premium",price_cents:175,tag:"$1.75",symbol:"☽",description:"Midnight celestial engraving and intricate constellations."},
  {id:"blood-moon",name:"Blood Moon",kind:"premium",price_cents:199,tag:"$1.99",symbol:"◉",description:"Lunar eclipse lacquer with crimson halo foil."},
  {id:"rusted-relic",name:"Rusted Relic",kind:"premium",price_cents:100,tag:"$1.00",symbol:"⚙",description:"Weathered copper plates and distressed industrial geometry."},
  {id:"phantom-masquerade",name:"Phantom Masquerade",kind:"premium",price_cents:125,tag:"$1.25",symbol:"◈",description:"Ornate ivory masquerade masks on plum velvet."},
  {id:"starfall",name:"Starfall",kind:"premium",price_cents:149,tag:"$1.49",symbol:"✶",description:"Meteor streaks and deep indigo starlight."},
  {id:"witching-hour",name:"Witching Hour",kind:"premium",price_cents:175,tag:"$1.75",symbol:"⌛",description:"Moonlit clockwork, blue smoke and silver ink."},
  {id:"thornbound",name:"Thornbound",kind:"premium",price_cents:199,tag:"$1.99",symbol:"❦",description:"Entwined thorns with antique bronze edging."},
  {id:"sacred-static",name:"Sacred Static",kind:"premium",price_cents:149,tag:"$1.49",symbol:"⌁",description:"Glitched stained glass and holographic fragments."},
  {id:"cinder-emperor",name:"Cinder Emperor",kind:"premium",price_cents:199,tag:"$1.99",symbol:"♚",description:"Regal ember filigree and molten volcanic enamel."},
  {id:"ashen-baroque",name:"Ashen Baroque",kind:"cinders",cost_cinders:300,tag:"CINDERS",symbol:"❧",description:"Antique scrollwork and carved bronze."},
  {id:"iron-maiden",name:"Iron Maiden",kind:"cinders",cost_cinders:350,tag:"CINDERS",symbol:"♜",description:"Steel lattice and cathedral tracery."},
  {id:"moonlit-garden",name:"Moonlit Garden",kind:"cinders",cost_cinders:400,tag:"CINDERS",symbol:"☾",description:"Night-blooming silver petals."},
  {id:"broken-mirror",name:"Broken Mirror",kind:"cinders",cost_cinders:450,tag:"CINDERS",symbol:"◇",description:"Shattered black-glass reflections."},
  {id:"raven-script",name:"Raven Script",kind:"cinders",cost_cinders:500,tag:"CINDERS",symbol:"♠",description:"Raven feathers and hand-inked calligraphy."},
  {id:"witchglass",name:"Witchglass",kind:"cinders",cost_cinders:550,tag:"CINDERS",symbol:"✧",description:"Indigo smoke and starry witchglass."},
  {id:"copper-cemetery",name:"Copper Cemetery",kind:"cinders",cost_cinders:600,tag:"CINDERS",symbol:"✟",description:"Weathered copper gravestones and ivy."},
  {id:"velvet-venom",name:"Velvet Venom",kind:"cinders",cost_cinders:650,tag:"CINDERS",symbol:"◆",description:"Garnet velvet and serpent engraving."},
  {id:"storm-forged",name:"Storm Forged",kind:"cinders",cost_cinders:700,tag:"CINDERS",symbol:"ϟ",description:"Storm steel and white lightning."},
  {id:"frostbound",name:"Frostbound",kind:"cinders",cost_cinders:750,tag:"CINDERS",symbol:"❄",description:"Winter frost and silver inlay."},
  {id:"wildfire-tarot",name:"Wildfire Tarot",kind:"cinders",cost_cinders:800,tag:"CINDERS",symbol:"☼",description:"Burned oracle cards with molten trim."},
  {id:"nocturne-arcade",name:"Nocturne Arcade",kind:"cinders",cost_cinders:900,tag:"CINDERS",symbol:"✦",description:"Analog arcade stars on midnight velvet."},
  {id:"infernal-covenant",name:"Infernal Covenant",kind:"vip",cost_cinders:1200,tag:"VIP",symbol:"♛",description:"VIP black-gold covenant seal."},
  {id:"eclipse-sovereign",name:"Eclipse Sovereign",kind:"vip",cost_cinders:1400,tag:"VIP",symbol:"◉",description:"VIP obsidian eclipse with platinum rays."},
  {id:"deathless-rose",name:"Deathless Rose",kind:"vip",cost_cinders:1600,tag:"VIP",symbol:"❀",description:"VIP crimson roses in silver."},
  {id:"seraphs-ruin",name:"Seraph's Ruin",kind:"vip",cost_cinders:1800,tag:"VIP",symbol:"✥",description:"VIP fractured celestial wings."},
  {id:"sovereign-ashes",name:"Sovereign Ashes",kind:"vip",cost_cinders:2100,tag:"VIP",symbol:"♚",description:"VIP volcanic bronze crown."},
  {id:"eternal-flame",name:"Eternal Flame",kind:"vip",cost_cinders:2500,tag:"VIP",symbol:"♨",description:"VIP crimson-and-gold eternal flame."}
 ]);
 const skinMap=new Map(SKINS.map(s=>[s.id,s]));
 const STORAGE_KEY="ashfall:deck-locker:selected:v1";
 const PROGRESS_KEY="ashfall:deck-locker:deals:v1";
 const read=(key)=>{try{return window.localStorage.getItem(key)}catch{return null}};
 const write=(key,value)=>{try{window.localStorage.setItem(key,value);return true}catch{return false}};
 const root=document.documentElement;
 let localDeals=Math.min(100000,Math.max(0,Number.parseInt(read(PROGRESS_KEY)||"0",10)||0));
 let deals=localDeals;
 const account={ready:false,userId:null,revision:0,owned:new Set(),imported:false,status:"Checking account sync…",ownedCinders:new Set(),vipActive:false,walletBalance:0};
 const API="https://api.ash-fall.com/api/arcade/deck-locker";
 const allowed=skin=>!!skin&&(skin.kind==="free"||(account.ready&&((skin.kind==="premium"&&account.owned.has(skin.id))||((skin.kind==="cinders"||skin.kind==="vip")&&account.ownedCinders.has(skin.id)&&(skin.kind!=="vip"||account.vipActive)))));
 let chosen=read(STORAGE_KEY)||"ash-classic";
 if(!allowed(skinMap.get(chosen)))chosen="ash-classic";
 const updateDocument=()=>{root.dataset.kfDeckSkin=chosen;root.style.colorScheme="dark"};
 updateDocument();
 let locker=null,renderCardList=null,mutations=Promise.resolve(),syncing=null;
 let activeCategory="all";
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
  account.owned=new Set((Array.isArray(data.owned_skin_ids)?data.owned_skin_ids:[]).filter(id=>skinMap.get(id)?.kind==="premium"));
  account.ownedCinders=new Set((Array.isArray(data.owned_cinder_skin_ids)?data.owned_cinder_skin_ids:[]).filter(id=>["cinders","vip"].includes(skinMap.get(id)?.kind)));
  account.vipActive=data.vip_active===true;
  account.walletBalance=Math.max(0,Math.floor(Number(data.wallet_balance)||0));
  deals=Math.min(100000,Math.max(0,Math.floor(Number(data.profile.earned_deals)||0)));
  const selected=data.profile.equipped_skin;
  chosen=allowed(skinMap.get(selected))?selected:"ash-classic";
  write(STORAGE_KEY,chosen);updateDocument();
  account.status="✓ Synced to your Knightfall account";
  if(renderCardList)renderCardList();
 }
 async function syncNow(){
  if(typeof window.fetch!=="function")return false;
  // Offline previews and local test servers must never call the production
  // account API. This also prevents failed cross-origin requests from being
  // misreported as game launch failures in the arcade fleet.
  const host=window.location?.hostname;
  if(host&&host!=="ash-fall.com"&&host!=="www.ash-fall.com"){
   account.status="Local preview · 12 free skins; premium ownership sync is available on ash-fall.com";
   if(renderCardList)renderCardList();
   return false;
  }
  if(syncing)return syncing;
  account.status="Checking Knightfall account…";
  if(renderCardList)renderCardList();
  syncing=(async()=>{
   try{applyAccount(await request());return true}
   catch(error){
    if(error.status===401){
     account.ready=false;account.userId=null;account.owned.clear();account.ownedCinders.clear();account.vipActive=false;account.walletBalance=0;
     deals=localDeals;
     const local=read(STORAGE_KEY)||"ash-classic";
     chosen=allowed(skinMap.get(local))?local:"ash-classic";updateDocument();
     account.status="Guest · sign in to sync skins across devices";
    }else{
     // Offline and guest selections may use any of the twelve free finishes.
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
   if(error?.status===401){account.ready=false;account.owned.clear();account.ownedCinders.clear();account.vipActive=false;account.walletBalance=0;deals=localDeals;
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
 async function purchaseCinderSkin(id){
  const skin=skinMap.get(id);
  if(!skin||!["cinders","vip"].includes(skin.kind)||!account.ready)return false;
  if(account.ownedCinders.has(id)||(skin.kind==="vip"&&!account.vipActive))return false;
  account.status="Purchasing "+skin.name+"…";if(renderCardList)renderCardList();
  try{
   const data=await request("POST",{action:"buy_cinders",skin_id:id});
   applyAccount(data);
   account.status="✓ Purchased "+skin.name+" for "+skin.cost_cinders.toLocaleString()+" Cinders";
   if(renderCardList)renderCardList();
   return true;
  }catch(error){
   account.status="Purchase unavailable: "+String(error.message||error).slice(0,110);
   if(error.status===409||error.status===403)await syncNow();
   if(renderCardList)renderCardList();
   return false;
  }
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
  intro.append(make("strong",null,"THE DECK ATELIER · 42 ORIGINAL FINISHES"),make("p",null,"12 free forever · 12 dollar collector skins · 12 public Cinders skins · 6 VIP-only Cinders skins."));
  const prog=make("div","kf-deck-progress","12 FREE · "+(account.ready?account.walletBalance.toLocaleString()+" Cinders · "+(account.vipActive?"VIP active":"Standard member"):"Sign in for Cinders")");
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
  const filters=make("div","kf-deck-filters");
  filters.setAttribute("role","group");filters.setAttribute("aria-label","Filter deck skins");
  for(const [category,name] of [["all","All 42"],["free","Free 12"],["premium","Collector 12"],["cinders","Cinders 12"],["vip","VIP 6"]]){
   const tab=make("button","kf-deck-filter"+(activeCategory===category?" is-active":""),name);
   tab.type="button";tab.setAttribute("aria-pressed",String(activeCategory===category));
   tab.addEventListener("click",()=>{activeCategory=category;renderCardList?.()});
   filters.append(tab);
  }
  locker.append(filters);
  const grid=make("div","kf-deck-grid");
  for(const skin of SKINS){
   if(activeCategory!=="all"&&skin.kind!==activeCategory)continue;
   const available=allowed(skin);
   const item=make("article","kf-deck-item"+(skin.id===chosen?" is-selected":"")+(available?"":" is-locked"));
   const preview=make("div","kf-deck-preview kf-deck-preview--"+skin.id);
   preview.setAttribute("aria-hidden","true");
   preview.append(make("span","kf-card-mini-back",skin.symbol),make("span","kf-card-mini-face","♠"),make("span","kf-deck-preview-mark",skin.name.toUpperCase()));
   const info=make("div","kf-deck-item-copy");
   info.append(make("strong",null,skin.name),make("small",null,skin.description));
   const meta=make("span","kf-deck-kind",skin.kind==="free"?"FREE · FOREVER":`${(skin.price_cents/100).toFixed(2)} · ONE-TIME`);
   const canBuy=["cinders","vip"].includes(skin.kind)&&account.ready&&!account.ownedCinders.has(skin.id)&&(skin.kind!=="vip"||account.vipActive);
   const button=make("button","kf-deck-choice",skin.id===chosen?"✓ Equipped":available?"Equip skin":canBuy?"Buy · "+skin.cost_cinders.toLocaleString()+" Cinders":skin.kind==="vip"?"VIP required":skin.kind==="cinders"?"Sign in to buy":"Purchase required");
   button.type="button";
   button.disabled=(!available&&!canBuy)||skin.id===chosen;
   button.setAttribute("aria-label",(skin.id===chosen?"Equipped ":available?"Equip ":"Locked ")+skin.name);
   if(available&&skin.id!==chosen)button.addEventListener("click",()=>chooseSkin(skin.id));
   else if(canBuy)button.addEventListener("click",()=>{button.disabled=true;void purchaseCinderSkin(skin.id)});
   const footer=make("div","kf-deck-item-footer");
   footer.append(meta,button);
   if(skin.kind==="premium"&&!available){
    const link=make("a","kf-deck-premium-link","View $"+(skin.price_cents/100).toFixed(2)+" skin in shop");
    link.href="/cinder-shop.html#deck-skin-"+skin.id;
    footer.append(link);
   }
   item.append(preview,info,footer);
   grid.append(item);
  }
  locker.append(grid);
  const note=make("p","kf-deck-disclaimer","The original 12 skins are always free. Cinders designs must be purchased using your account wallet; VIP designs require an active VIP membership both to buy and equip. USD collector skins use separate verified ownership. Cosmetics do not affect gameplay.");
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
  skins:SKINS,recordDeal,chooseSkin,purchaseCinderSkin,refresh:syncNow,importLegacy,
  get current(){return chosen},
  get localDeals(){return deals},
  get deviceDeals(){return localDeals},
  get accountSynced(){return account.ready},
  get accountId(){return account.userId},
  get ownedPremium(){return [...account.owned]}, // Backward-compatible accessor
  get ownedCinders(){return [...account.ownedCinders]},
  get vipActive(){return account.vipActive},
  get walletBalance(){return account.walletBalance},
  isAvailable:id=>allowed(skinMap.get(id))
 });
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();