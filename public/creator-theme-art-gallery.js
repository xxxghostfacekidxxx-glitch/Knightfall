/* Creator Foundry: reviewed original theme artwork, never a second image API. */
(()=>{
"use strict";
const panel=document.getElementById("theme-art-collection");
const grid=document.getElementById("kf-theme-art-gallery");
const status=document.getElementById("kf-theme-art-status");
if(!panel||!grid||!status)return;
const menu=panel.querySelector(".kf-theme-art-filters");
const manifestUrl="/assets/knightfall/theme-collections/manifest.json";
const collectionNames=Object.freeze({
 "egyptian-eclipse":"Egyptian Eclipse",
 "dark-lord-ascendant":"Dark Lord Ascendant",
 "theme-selector":"Theme selector concepts"
});
let entries=[],active="all",loaded=false;
const tag=(name,cls,text)=>{
 const el=document.createElement(name);
 if(cls)el.className=cls;
 if(text!==undefined)el.textContent=String(text);
 return el;
};
const statusText=s=>{status.textContent=s};
const safeEntry=item=>item&&
 typeof item.path==="string"&&
 /^\/assets\/knightfall\/theme-collections\/[a-z0-9-]+\/[a-z0-9-]+\.png$/.test(item.path)&&
 item.collection in collectionNames&&
 typeof item.sha256==="string"&&/^[0-9a-f]{64}$/.test(item.sha256);
function render(){
 grid.replaceChildren();
 for(const item of entries.filter(a=>active==="all"||a.collection===active)){
  const card=tag("article","kf-theme-art-card");
  const imageLink=tag("a","kf-theme-art-preview");
  imageLink.href=item.path;imageLink.target="_blank";imageLink.rel="noopener noreferrer";
  imageLink.setAttribute("aria-label","View full original: "+item.title);
  const image=tag("img");
  image.src=item.path;image.alt=item.title;
  image.loading="lazy";image.decoding="async";
  image.width=item.width;image.height=item.height;
  imageLink.append(image);
  const content=tag("div","kf-theme-art-card-body");
  content.append(
   tag("span","kf-theme-art-eyebrow",collectionNames[item.collection]+" · "+item.role),
   tag("h3","",item.title),
   tag("p","","Original "+item.width+" × "+item.height+" PNG preserved in Knightfall's repository.")
  );
  const actions=tag("div","kf-theme-art-actions");
  const download=tag("a","kf-theme-art-button","Download original");
  download.href=item.path;download.download=item.path.split("/").pop();
  const copy=tag("button","kf-theme-art-button kf-theme-art-copy","Copy asset path");
  copy.type="button";
  copy.addEventListener("click",async()=>{
   try{
    await navigator.clipboard.writeText(item.path);
    statusText("Copied "+item.path);
   }catch{statusText("Asset path: "+item.path)}
  });
  actions.append(download,copy);
  content.append(actions);card.append(imageLink,content);grid.append(card);
 }
 const count=grid.childElementCount;
 statusText(count+" original artwork asset"+(count===1?"":"s")+" available. No sample franchise characters or external image URLs are required.");
}
function choose(value){
 active=value;
 for(const button of menu?.querySelectorAll("button[data-collection]")||[]){
  button.setAttribute("aria-pressed",String(button.dataset.collection===value));
 }
 render();
}
menu?.addEventListener("click",event=>{
 const button=event.target.closest("button[data-collection]");
 if(button&&button.dataset.collection in collectionNames||button?.dataset.collection==="all")choose(button.dataset.collection);
});
async function load(){
 if(loaded)return;
 loaded=true;
 try{
  const response=await fetch(manifestUrl,{credentials:"same-origin",cache:"no-store"});
  if(!response.ok)throw Error("The repository artwork import is not published yet (HTTP "+response.status+").");
  const body=await response.json();
  if(body.id!=="knightfall-2026-11-20-premium-theme-art"||!Array.isArray(body.assets)||body.assets.length!==6)
   throw Error("Unexpected artwork manifest; refusing to show unreviewed files.");
  const approved=body.assets.filter(safeEntry);
  if(approved.length!==6)throw Error("Original artwork manifest failed path or checksum validation.");
  entries=approved;render();
 }catch(error){
  loaded=false;
  statusText(error.message||"Original theme artwork could not load.");
 }
}
const workshop=document.getElementById("workshop");
workshop?.addEventListener("foundry:ready",load);
})();
