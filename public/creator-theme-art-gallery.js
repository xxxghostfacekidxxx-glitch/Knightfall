/* Creator Foundry: original PNG paintings + independently reusable vector ornaments.
 * Safe DOM composition only. All gallery assets stay on Knightfall's own origin.
 */
(()=>{
"use strict";
const root=document.getElementById("theme-art-collection");
const grid=document.getElementById("kf-theme-art-gallery");
const status=document.getElementById("kf-theme-art-status");
if(!root||!grid||!status)return;
const names=Object.freeze({
 "egyptian-eclipse":"Egyptian Eclipse",
 "dark-lord-ascendant":"Dark Lord Ascendant",
 "korriban":"Korriban · Red Necropolis",
 "mustafar":"Mustafar · Obsidian Forge",
 "theme-selector":"Theme Forge concepts",
 "jedi-sanctuary":"Jedi Sanctuary",
 "neon-dystopia":"Neon Dystopia",
 "the-asylum":"The Asylum",
 "arcade-anarchy":"Arcade Anarchy",
 "astral-dominion":"Astral Dominion"
});
const pngUrl="/assets/knightfall/theme-collections/manifest.json";
const svgUrl="/assets/knightfall/theme-collections/ornaments.json";
const recoveredUrl="/assets/knightfall/theme-collections/recovered-artwork-manifest.json";
const formats=new Set(["png","webp","svg"]);
const pngRoles=new Set(["hero","background","concept"]);
const svgRoles=new Set(["header","frame","divider","corner","emblem","panel","button","side-rail"]);
let items=[],collection="all",format="all",inFlight=null;
const tag=(name,cls,text)=>{
 const el=document.createElement(name);
 if(cls)el.className=cls;
 if(text!==undefined)el.textContent=String(text);
 return el;
};
const report=text=>{status.textContent=text};
const approved=item=>{
 if(!item||typeof item!=="object"||!Object.hasOwn(names,item.collection)||typeof item.path!=="string")return false;
 const match=/^\/assets\/knightfall\/theme-collections\/([a-z0-9-]+)\/(?:svg\/)?([a-z0-9-]+)\.(png|webp|svg)$/.exec(item.path);
 if(!match||match[1]!==item.collection)return false;
 const kind=match[3];
 if(kind==="png"||kind==="webp"){
  return pngRoles.has(item.role)&&typeof item.sha256==="string"&&/^[a-f0-9]{64}$/.test(item.sha256)&&
   Number.isInteger(item.bytes)&&item.bytes>0&&Number.isInteger(item.width)&&Number.isInteger(item.height);
 }
 return item.path.includes("/svg/")&&svgRoles.has(item.role)&&item.format==="svg";
};
function previewKit(){
 const chosen=["egyptian-eclipse","dark-lord-ascendant","korriban","mustafar","jedi-sanctuary","neon-dystopia","the-asylum","arcade-anarchy","astral-dominion"].includes(collection)
  ?collection:"egyptian-eclipse";
 const kit=document.getElementById("kf-theme-kit-stage");
 if(!kit)return;
 kit.dataset.collection=chosen;
 const roles={"header":"kf-theme-kit-header","frame":"kf-theme-kit-frame","emblem":"kf-theme-kit-emblem","divider":"kf-theme-kit-divider"};
 for(const [role,id] of Object.entries(roles)){
  const recovered=chosen!=="egyptian-eclipse"&&chosen!=="dark-lord-ascendant"&&chosen!=="korriban"&&chosen!=="mustafar";
  const suffix=recovered?({header:"header-ornament.svg",frame:"modular-panel-frame.svg",emblem:"modular-corner.svg",divider:"header.svg"}[role]):null;
  const asset=items.find(item=>item.collection===chosen&&item.format==="svg"&&
   (suffix?item.path.endsWith("/"+suffix):item.role===role));
  const node=document.getElementById(id);
  if(node){node.hidden=!asset;if(asset)node.src=asset.path}
 }
 const label=document.getElementById("kf-theme-kit-caption");
 if(label)label.textContent=names[chosen]+" · Original Vector Kit";
}
function render(){
 grid.replaceChildren();
 const shown=items.filter(item=>(collection==="all"||item.collection===collection)&&
  (format==="all"||item.format===format));
 for(const item of shown){
  const card=tag("article","kf-theme-art-card");
  card.dataset.collection=item.collection;
  card.dataset.format=item.format;
  const art=tag("a","kf-theme-art-preview");
  art.href=item.path;art.target="_blank";art.rel="noopener noreferrer";
  art.setAttribute("aria-label","Inspect original asset: "+item.title);
  const image=tag("img");
  image.src=item.path;image.alt=item.title;image.loading="lazy";image.decoding="async";
  if(item.width&&item.height){image.width=item.width;image.height=item.height}
  else{image.width=1200;image.height=720}
  art.append(image);
  const info=tag("div","kf-theme-art-card-body");
  const details=item.format==="svg"
   ?"Original editable SVG · "+item.role.replace("-"," ")+" · Scales without pixelation."
   :"Original "+item.width+" × "+item.height+" "+item.format.toUpperCase()+" · SHA-256 verified.";
  info.append(
   tag("span","kf-theme-art-eyebrow",names[item.collection]+" / "+item.format.toUpperCase()),
   tag("h3","",item.title),
   tag("p","",details)
  );
  const actions=tag("div","kf-theme-art-actions");
  const download=tag("a","kf-theme-art-button","Download "+item.format.toUpperCase());
  download.href=item.path;download.download=item.path.split("/").pop();
  const copy=tag("button","kf-theme-art-button kf-theme-art-copy","Copy path");
  copy.type="button";
  copy.addEventListener("click",async()=>{
   try{await navigator.clipboard.writeText(item.path);report("Copied "+item.path)}
   catch{report("Asset path: "+item.path)}
  });
  const css=tag("button","kf-theme-art-button kf-theme-art-copy","Copy CSS");
  css.type="button";css.setAttribute("aria-label","Copy CSS background URL for "+item.title);
  css.addEventListener("click",async()=>{
   const text='background-image: url("'+item.path+'");';
   try{await navigator.clipboard.writeText(text);report("Copied CSS for "+item.title)}
   catch{report("CSS: "+text)}
  });
  actions.append(download,copy,css);
  info.append(actions);card.append(art,info);grid.append(card);
 }
 if(!shown.length)grid.append(tag("p","kf-theme-art-empty","No matching artwork. Choose another collection or format."));
 const png=items.filter(i=>i.format==="png").length,svg=items.filter(i=>i.format==="svg").length;
 report(shown.length+" shown · "+png+" preserved paintings · "+svg+" custom SVG ornaments. Originals are stored in the Knightfall repository.");
 previewKit();
}
root.addEventListener("click",event=>{
 const button=event.target.closest("button[data-collection],button[data-format]");
 if(!button||!root.contains(button))return;
 if(button.hasAttribute("data-collection")){
  const val=button.dataset.collection;
  if(val!=="all"&&!Object.hasOwn(names,val))return;
  collection=val;
  for(const node of root.querySelectorAll("button[data-collection]"))
   node.setAttribute("aria-pressed",String(node.dataset.collection===val));
 }else{
  const val=button.dataset.format;
  if(val!=="all"&&!formats.has(val))return;
  format=val;
  for(const node of root.querySelectorAll("button[data-format]"))
   node.setAttribute("aria-pressed",String(node.dataset.format===val));
 }
 render();
});
async function load(){
 if(inFlight)return inFlight;
 inFlight=(async()=>{
  try{
   const [pngResponse,svgResponse,recoveredResponse]=await Promise.all([
    fetch(pngUrl,{credentials:"same-origin",cache:"no-store"}),
    fetch(svgUrl,{credentials:"same-origin",cache:"no-store"}),
    fetch(recoveredUrl,{credentials:"same-origin",cache:"no-store"})
   ]);
   if(!pngResponse.ok||!svgResponse.ok||!recoveredResponse.ok)throw Error("The artwork inventory is not fully published yet.");
   const [p,s,r]=await Promise.all([pngResponse.json(),svgResponse.json(),recoveredResponse.json()]);
   if(p.id!=="knightfall-2026-11-20-premium-theme-art"||
      s.id!=="knightfall-original-theme-ornaments"||
      !Array.isArray(p.assets)||p.assets.length<6||!Array.isArray(s.assets)||s.assets.length!==32||
      r.id!=="knightfall-recovered-theme-art-2026-11-25"||!Array.isArray(r.assets)||r.assets.length!==40)
    throw Error("The original artwork inventory was not recognized.");
   const candidate=[
    ...p.assets.map(item=>({...item,format:"png"})),
    ...s.assets.map(item=>({...item,format:"svg"})),
    ...r.assets
   ];
   if(!candidate.every(approved)||new Set(candidate.map(i=>i.path)).size!==candidate.length)
    throw Error("Artwork inventory contains an unreviewed asset path.");
   items=candidate;render();
  }catch(error){report(error.message||"Artwork could not be loaded.");}
  finally{inFlight=null}
 })();
 return inFlight;
}
document.getElementById("workshop")?.addEventListener("foundry:ready",load);
})();
