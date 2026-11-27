/* One homepage renderer for approved, original Knightfall art themes.
 * The scene inventory is presentation-only and grants zero publishing rights.
 * No raw HTML injection or third-party image URLs. */
(()=>{
"use strict";
const root=document.getElementById("kf-theme-art-showcase");
if(!root)return;
const title=document.getElementById("kf-theme-art-heading");
const intro=document.getElementById("kf-theme-art-description");
const gallery=document.getElementById("kf-theme-art-showcase-grid");
const links=document.getElementById("kf-theme-art-showcase-links");
if(!title||!intro||!gallery)return;
const source="/assets/knightfall/theme-collections/theme-recipes.json";
let catalog=null,loading=null,rendered=null;
const fileOK=name=>typeof name==="string"&&/^[a-z0-9-]+\.png$/.test(name);
const valid=kit=>kit&&/^[a-z][a-z0-9_]{2,39}$/.test(kit.preset)&&
 /^[a-z][a-z0-9-]{2,45}$/.test(kit.collection)&&
 typeof kit.heading==="string"&&kit.heading.length<=100&&
 typeof kit.description==="string"&&kit.description.length<=240&&
 Array.isArray(kit.showcase)&&kit.showcase.length>=1&&kit.showcase.length<=8&&
 kit.showcase.every(fileOK)&&!kit.legacyStandalone;
const asset=(kit,name)=>"/assets/knightfall/theme-collections/"+kit.collection+"/"+name;
const label=file=>file.replace(/\.png$/,"").replace(/^(dark-lord-ascendant|dark-lord|korriban|mustafar)-/,"")
 .split("-").map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(" ");
async function load(){
 if(catalog)return catalog;
 if(loading)return loading;
 loading=(async()=>{
  try{
   const response=await fetch(source,{credentials:"same-origin",cache:"default"});
   if(!response.ok)throw Error("Cannot load the reviewed art inventory");
   const payload=await response.json();
   if(payload.version!==1||!Array.isArray(payload.themes))throw Error("Unrecognized art kit catalog");
   catalog=payload.themes.filter(valid);
   if(new Set(catalog.map(x=>x.preset)).size!==catalog.length)throw Error("Duplicate art preset");
  }catch(error){
   console.warn("Knightfall art gallery unavailable:",String(error));
   catalog=[]; // Core navigation and historical homepage remain usable.
  }finally{loading=null}
  return catalog;
 })();
 return loading;
}
function draw(kit){
 root.hidden=false;root.dataset.collection=kit.collection;
 title.textContent=kit.heading;intro.textContent=kit.description;
 const fragment=document.createDocumentFragment();
 for(const [index,file] of kit.showcase.entries()){
  const item=document.createElement("article");item.className="kf-theme-art-card";
  const picture=document.createElement("img");
  picture.src=asset(kit,file);picture.alt=kit.name+" original concept scene: "+label(file);
  picture.loading="lazy";picture.decoding="async";
  picture.width=1672;picture.height=941;
  const heading=document.createElement("strong");heading.textContent=label(file);
  const description=document.createElement("p");
  description.textContent=index===0?"Main original environment illustration for this realm.":"Saved first-party environment or concept art.";
  item.append(picture,heading,description);fragment.append(item);
 }
 gallery.replaceChildren(fragment);
 if(links){
  const a=document.createElement("a");a.href="/devil-tools.html#theme-art-collection";
  a.textContent="Explore original art in Creator's Foundry";
  a.dataset.kfAccess="can_create";a.hidden=true;window.KnightfallAccess?.apply(a);
  const b=document.createElement("a");b.href="/celestial-sanctum.html";
  b.textContent="Visit the Celestial Sanctum";
  links.replaceChildren(a,b);
 }
 rendered=kit.preset;
}
async function sync(){
 const preset=document.body?.dataset.kfTheme;
 if(!preset||document.body?.dataset.kfArtTheme!=="true"){
  if(!root.hidden||rendered!==null){root.hidden=true;rendered=null;gallery.replaceChildren();}return;
 }
 const recipes=await load();
 if(document.body?.dataset.kfTheme!==preset||document.body?.dataset.kfArtTheme!=="true")return;
 const chosen=recipes.find(kit=>kit.preset===preset);
 if(!chosen){root.hidden=true;return}
 if(rendered!==preset)draw(chosen);
}
document.addEventListener("kf:theme-change",()=>{void sync()});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{void sync()},{once:true});
else void sync();
})();