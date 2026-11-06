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
 let deals=Math.min(100000,Math.max(0,Number.parseInt(read(PROGRESS_KEY)||"0",10)||0));
 const allowed=skin=>skin?.kind==="free"||(skin?.kind==="unlock"&&deals>=skin.deals);
 let chosen=read(STORAGE_KEY)||"ash-classic";
 if(!allowed(skinMap.get(chosen)))chosen="ash-classic";
 const updateDocument=()=>{root.dataset.kfDeckSkin=chosen;root.style.colorScheme="dark"};
 updateDocument();
 let locker=null,renderCardList=null;
 function chooseSkin(id){
  const skin=skinMap.get(id);
  if(!allowed(skin))return false;
  chosen=id;write(STORAGE_KEY,id);updateDocument();
  if(renderCardList)renderCardList();
  window.dispatchEvent(new CustomEvent("ashfall:deck-skin-change",{detail:{id}}));
  return true;
 }
 function recordDeal(gameKey){
  if(typeof gameKey!=="string"||!/^[a-z0-9-]{3,64}$/.test(gameKey))return deals;
  deals=Math.min(100000,deals+1);
  write(PROGRESS_KEY,String(deals));
  if(renderCardList)renderCardList();
  return deals;
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
  const prog=make("div","kf-deck-progress",deals+" hands / deals played on this device");
  heading.append(intro,prog);
  locker.append(heading);
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
  const note=make("p","kf-deck-disclaimer","Earned skins use local device progress for now, not account-verified achievements. Paid designs are previews only; checkout and ownership unlocks are not live.");
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
 }
 const onStorage=e=>{
  if(e.key===PROGRESS_KEY){const value=Number.parseInt(e.newValue||"0",10)||0;deals=Math.min(100000,Math.max(0,value))}
  if(e.key===STORAGE_KEY){const next=e.newValue||"ash-classic";chosen=allowed(skinMap.get(next))?next:"ash-classic";updateDocument()}
  if(renderCardList)renderCardList();
 };
 window.addEventListener("storage",onStorage);
 window.AshFallDeckSkins=Object.freeze({
  skins:SKINS,recordDeal,chooseSkin,
  get current(){return chosen},
  get localDeals(){return deals},
  isAvailable:id=>allowed(skinMap.get(id))
 });
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();