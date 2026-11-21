(()=>{
"use strict";
const API="https://api.ash-fall.com/api/god/theme";
const $=id=>document.getElementById(id);
const status=$("theme-crew-status");
const workspace=$("theme-crew-workspace");
const denied=$("theme-crew-denied");
let current=null,presets={},selected="cathedral",busy=false,initialized=false,canPublish=false;
let scope="site",states={},realmMeta={},allHistory=[],realmApiReady=false;
let globalCurrent=null,globalApiReady=false,globalInitialized=false,globalDirty=false;
const GLOBAL_FIELDS=Object.freeze(["density","corners","typography","effects"]);
const GLOBAL_CHOICES=Object.freeze({
 density:["balanced","compact","relaxed"],
 corners:["soft","square","rounded"],
 typography:["standard","large","extra_large"],
 effects:["ceremonial","subtle","minimal"]
});
const readGlobal=()=>Object.fromEntries(GLOBAL_FIELDS.map(key=>[key,$("kf-global-"+key).value]));
const validGlobal=state=>state&&GLOBAL_FIELDS.every(key=>GLOBAL_CHOICES[key].includes(state[key]));
const assignGlobal=state=>{if(!validGlobal(state))return;for(const key of GLOBAL_FIELDS)$("kf-global-"+key).value=state[key]};
const announceGlobal=value=>{$("theme-crew-global-feedback").textContent=String(value)};
const paintGlobal=()=>{
 if(!globalApiReady||!globalCurrent){
  $("theme-crew-global-state").textContent="Global API upgrade not confirmed. Publication disabled.";
  return;
 }
 $("theme-crew-global-state").textContent="LIVE GLOBAL CONTROLS · Revision "+globalCurrent.revision+
  (globalCurrent.updated_at?" · "+new Date(globalCurrent.updated_at).toLocaleString():"");
};
const PREVIEW_ART=Object.freeze({
 egyptian_eclipse:"/assets/knightfall/theme-collections/egyptian-eclipse/egyptian-eclipse-temple-gateway.png",
 dark_lord_ascendant:"/assets/knightfall/theme-collections/dark-lord-ascendant/dark-lord-crimson-eclipse-hall.png",
 korriban_necropolis:"/assets/knightfall/theme-collections/korriban/korriban-red-necropolis.png",
 mustafar_forge:"/assets/knightfall/theme-collections/mustafar/mustafar-obsidian-lava-citadel.png",
 cathedral:"/assets/knightfall/black-sun-hero-illustration.webp",
 blood_moon:"/assets/knightfall/obsidian-cathedral.svg",
 verdant_crypt:"/assets/knightfall/realm-pets.svg",
 iron_eclipse:"/assets/knightfall/vaulted-cathedral.svg",
 royal_abyss:"/assets/knightfall/black-sun-temple.svg"
});
const realmName=()=>realmMeta[scope]?.name||$("theme-crew-scope").selectedOptions[0]?.textContent||scope;
const previewUrl=key=>{
 const url=new URL(realmMeta[scope]?.path||"/",location.origin);
 url.searchParams.set("kf_theme_preview",key);
 url.searchParams.set("kf_theme_scope",scope);
 return url.href;
};
const announce=text=>{status.textContent=String(text)};
const textNode=(tag,text,cls)=>{const e=document.createElement(tag);if(cls)e.className=cls;e.textContent=String(text);return e};
async function req(path,method="GET",payload){
 const opts={method,credentials:"include",cache:"no-store",headers:{accept:"application/json"}};
 if(method!=="GET"){opts.headers["content-type"]="application/json";opts.body=JSON.stringify(payload)}
 const res=await fetch(API+path,opts);const d=await res.json().catch(()=>({}));
 if(!res.ok)throw Error(d.error||"Theme Crew request failed ("+res.status+").");
 return d;
}
const lock=value=>{
 busy=value;
 for(const id of ["theme-crew-preview","theme-crew-copy-preview","theme-crew-publish","theme-crew-revert-preview","theme-crew-rollback","theme-crew-refresh"]){
  $(id).disabled=busy||((id==="theme-crew-publish"||id==="theme-crew-rollback")&&(!canPublish||(scope!=="site"&&!realmApiReady)));
 }
 $("theme-crew-scope").disabled=busy;
 for(const choice of document.querySelectorAll(".theme-crew-choice"))choice.disabled=busy;
 for(const key of GLOBAL_FIELDS)$("kf-global-"+key).disabled=busy;
 for(const id of ["theme-crew-global-preview","theme-crew-global-clear","theme-crew-global-publish","theme-crew-global-rollback"]){
  $(id).disabled=busy||((id==="theme-crew-global-publish"||id==="theme-crew-global-rollback")&&(!canPublish||!globalApiReady));
 }
 $("theme-crew-plan-form").querySelector("button").disabled=busy;
};
function choose(preset){
 if(busy||!Object.hasOwn(presets,preset))return;
 selected=preset;
 for(const b of document.querySelectorAll(".theme-crew-choice")){
  b.setAttribute("aria-pressed",String(b.dataset.preset===selected));
 }
 const p=presets[preset];
 // Selecting the live theme clears a stale preview, rather than pinning it.
 const local=window.KnightfallThemeCrew?.preview?.(preset===current?.preset?null:preset,scope)===true;
 $("theme-crew-selected").textContent=(current?.preset===preset?"LIVE THEME":"PRIVATE PREVIEW")+" · "+p.name;
 announce("Selected "+p.name+" for "+realmName()+". "+(local?"Private realm preview saved. ":"")+(canPublish?"Publish to update only this realm.":"Only authorized staff can publish."));
}
function drawPresets(){
 const place=$("theme-crew-presets");place.replaceChildren();
 for(const [key,preset] of Object.entries(presets)){
  const b=document.createElement("button");b.type="button";b.className="theme-crew-choice";b.dataset.preset=key;
  b.style.setProperty("--kf-choice-accent",preset.accent);
  b.setAttribute("aria-pressed",String(selected===key));
  b.dataset.current=String(current?.preset===key);
  const chip=document.createElement("span");chip.className="theme-crew-chip";chip.setAttribute("aria-hidden","true");
  const scene=document.createElement("span");scene.className="theme-crew-scene";scene.setAttribute("aria-hidden","true");
  if(PREVIEW_ART[key])scene.style.setProperty("--kf-choice-art",'url("'+PREVIEW_ART[key]+'")');
  b.append(scene,chip,textNode("strong",preset.name),
    textNode("small",current?.preset===key?"● LIVE NOW":"Available preset","theme-crew-live-label"),
    textNode("small",preset.tag),textNode("small",preset.mood));
  b.addEventListener("click",()=>choose(key));
  place.append(b);
 }
}
function drawBots(bots,workflow){
 const place=$("theme-crew-bots");place.replaceChildren();
 for(const bot of bots){
  const card=textNode("article","", "theme-crew-bot");
  card.append(textNode("small",bot.role),textNode("h3",bot.name),
    textNode("p",bot.capability),textNode("small","Execution: "+bot.execution));
  place.append(card);
 }
 if(typeof workflow==="string"&&workflow.startsWith("https://github.com/"))$("theme-crew-workflow").href=workflow;
}
function drawHistory(rows){
 const list=$("theme-crew-history");list.replaceChildren();
 const filtered=(rows||[]).filter(item=>(item.realm||"site")===scope);
 if(!filtered.length){list.append(textNode("li","No theme changes in this realm yet."));return;}
 for(const h of filtered){
  const time=h.at?new Date(h.at):null;
  const stamp=time&&Number.isFinite(time.getTime())?time.toLocaleString():"Unknown";
  list.append(textNode("li",stamp+" · "+String(h.from||"?")+" → "+String(h.to||"?")+" (v"+h.revision+")"));
 }
}
function displayScope(){
 current=states[scope]||states.site;
 if(!current)return;
 if(!Object.hasOwn(presets,selected))selected=current.preset;
 $("theme-crew-current").textContent="LIVE IN "+realmName().toUpperCase()+": "+(presets[current.preset]?.name||current.preset)+" · Revision "+current.revision+
  (current.inherited?" · Inheriting shared theme":"")+(current.updated_at?" · "+new Date(current.updated_at).toLocaleString():"");
 $("theme-crew-selected").textContent="SELECTED · "+(presets[selected]?.name||"Choose a look");
 drawPresets();drawHistory(allHistory);
}
async function load(){
 const data=await req("/status");
 presets=data.presets;realmMeta=data.realmMeta||{};
 realmApiReady=Boolean(data.realmMeta&&data.realms&&["madhouse","arcade","chaosphere","admin"].every(key=>data.realmMeta[key]&&data.realms[key]));
 states={site:data.current,...data.realms};allHistory=data.history||[];
 globalApiReady=Boolean(data.globalControls&&data.globalOptions&&validGlobal(data.globalControls)&&
  GLOBAL_FIELDS.every(key=>Array.isArray(data.globalOptions[key])&&
   GLOBAL_CHOICES[key].every(value=>data.globalOptions[key].includes(value))));
 globalCurrent=globalApiReady?data.globalControls:null;
 if(globalApiReady&&(!globalInitialized||!globalDirty)){assignGlobal(globalCurrent);globalInitialized=true}
 paintGlobal();
 canPublish=data.permissions?.can_publish===true;
 for(const id of ["theme-crew-publish","theme-crew-rollback","theme-crew-global-publish","theme-crew-global-rollback"])$(id).hidden=!canPublish;
 if(!initialized){selected=states[scope]?.preset||data.current.preset;initialized=true}
 if(!busy)lock(false);
 displayScope();drawBots(data.bots||[],data.workflow);
 workspace.hidden=false;denied.hidden=true;
 announce(!realmApiReady?"The API Worker has not confirmed independent realm support. Realm publishing is locked until it is deployed.":(canPublish?"Verified theme publishing available.":"Staff preview controls available.")+" Editing "+realmName()+" only.");
}
async function publishGlobal(undo=false){
 if(busy||!canPublish){announceGlobal("Only GOD and the accepted delegated admin partner can publish global controls.");return}
 if(!globalApiReady||!globalCurrent){announceGlobal("Global design API has not been deployed. Publishing remains locked.");return}
 const target=undo?globalCurrent.previous:readGlobal();
 if(!validGlobal(target)){announceGlobal("Select approved global options.");return}
 if(GLOBAL_FIELDS.every(key=>target[key]===globalCurrent[key])){
  announceGlobal(undo?"There is no earlier global setting to restore.":"Those global options are already live.");return;
 }
 if(!confirm((undo?"ROLL BACK":"PUBLISH")+" the global Knightfall interface controls? Shared chrome changes in ALL realms. Their individual themes stay unchanged."))return;
 lock(true);let published=false;
 try{
  const result=await req(undo?"/global/rollback":"/global","POST",
   undo?{expectedRevision:globalCurrent.revision}:{controls:target,expectedRevision:globalCurrent.revision});
  globalCurrent=result.current;published=true;globalDirty=false;assignGlobal(globalCurrent);
  window.KnightfallThemeCrew?.previewGlobal?.(null);
  window.KnightfallThemeCrew?.announceGlobalPublished?.(globalCurrent.revision);
  try{await load()}catch(error){announceGlobal("Global settings saved, but status refresh failed: "+error.message)}
  await window.KnightfallThemeCrew?.refresh?.();
  announceGlobal("Published global interface controls · Revision "+globalCurrent.revision+". Realm colors and artwork remain independent.");
 }catch(error){
  announceGlobal(published?"Saved globally but confirmation was interrupted. Refresh to verify.":"Global settings NOT published: "+error.message);
 }finally{lock(false)}
}
for(const key of GLOBAL_FIELDS)$("kf-global-"+key).addEventListener("change",()=>{
 globalDirty=true;announceGlobal("Unpublished shared-chrome changes. Preview them or publish after review.");
});
$("theme-crew-global-preview").addEventListener("click",()=>{
 const values=readGlobal();
 if(!validGlobal(values)||window.KnightfallThemeCrew?.previewGlobal?.(values)!==true){
  announceGlobal("Global preview unavailable. Refresh the page and check your selections.");return;
 }
 announceGlobal("Private preview applied across the shared chrome in this tab. No server settings changed.");
});
$("theme-crew-global-clear").addEventListener("click",()=>{
 window.KnightfallThemeCrew?.previewGlobal?.(null);
 if(globalCurrent)assignGlobal(globalCurrent);
 globalDirty=false;
 announceGlobal("Global preview cleared. Showing the published shared appearance.");
});
$("theme-crew-global-publish").addEventListener("click",()=>publishGlobal(false));
$("theme-crew-global-rollback").addEventListener("click",()=>publishGlobal(true));
async function boot(){
 try{await load()}catch(e){workspace.hidden=true;denied.hidden=false;announce("Theme Crew unavailable: "+e.message)}
}
async function publish(undo=false){
 if(busy||!current||!canPublish){if(!canPublish)announce("Only GOD or the accepted admin partner can publish or roll back theme changes.");return;}
 if(scope!=="site"&&!realmApiReady){announce("Realm publishing is locked until the upgraded API Worker confirms realm support.");return;}
 const desired=undo?current.previous:selected;
 if(!Object.hasOwn(presets,desired)){announce("Select a reviewed preset.");return}
 if(desired===current.preset){announce("That theme is already live.");return}
 const verb=undo?"ROLL BACK":"PUBLISH";
 if(!confirm(verb+" "+presets[desired].name+" for "+realmName()+"? Only this selected realm changes. This action is logged and reversible."))return;
 lock(true);
 let published=false;
 try{
  const result=await req(undo?"/rollback":"/activate","POST",undo?{realm:scope,expectedRevision:current.revision}:{realm:scope,preset:desired,expectedRevision:current.revision});
  current=result.current;
  states[scope]=current;
  selected=current.preset;
  published=true;
  try{await load()}catch(error){announce("Theme published as "+presets[current.preset].name+", but dashboard refresh failed: "+error.message+". Reload to verify.");}
  // Local preview must not hide the new live state.
  window.KnightfallThemeCrew?.preview?.(null,scope);
  window.KnightfallThemeCrew?.announcePublished?.(current.revision,scope);
  await window.KnightfallThemeCrew?.refresh?.();
  announce("Published "+presets[current.preset].name+" to "+realmName()+" only. Revision "+current.revision+". Other realms unchanged.");
 }catch(e){announce(published?"Theme change was accepted, but confirmation was interrupted: "+e.message+". Check the live status before trying again.":"Theme change was not confirmed: "+e.message+". Refresh live status before retrying.");}
 finally{lock(false)}
}
$("theme-crew-preview").addEventListener("click",()=>{
 if(!window.KnightfallThemeCrew?.preview?.(selected,scope)){announce("Preview runtime not ready.");return}
 announce("Opening "+realmName()+" preview for "+presets[selected].name+". This does not publish anything.");
 window.open(previewUrl(selected),"_blank","noopener,noreferrer");
});
$("theme-crew-copy-preview").addEventListener("click",async()=>{
 const url=previewUrl(selected);
 try{await navigator.clipboard.writeText(url);announce("Preview-only link copied for "+presets[selected].name+".")}
 catch{window.prompt("Copy the preview-only link:",url)}
});
$("theme-crew-scope").addEventListener("change",event=>{
 if(busy)return;
 scope=event.target.value;
 if(!["site","madhouse","arcade","chaosphere","admin"].includes(scope)){scope="site";event.target.value="site"}
 selected=states[scope]?.preset||states.site?.preset||"cathedral";
 displayScope();
 if(!busy)lock(false);
 announce(scope!=="site"&&!realmApiReady?"Realm publishing is locked until the upgraded API Worker is live.":"Now controlling "+realmName()+". Preview and publish actions target this realm exclusively.");
});
$("theme-crew-presets").addEventListener("keydown",event=>{
 const choice=event.target.closest(".theme-crew-choice");
 if(!choice)return;
 const keys=Object.keys(presets);let index=keys.indexOf(choice.dataset.preset);
 if(event.key==="ArrowRight"||event.key==="ArrowDown")index=(index+1)%keys.length;
 else if(event.key==="ArrowLeft"||event.key==="ArrowUp")index=(index+keys.length-1)%keys.length;
 else if(event.key==="Home")index=0;
 else if(event.key==="End")index=keys.length-1;
 else return;
 event.preventDefault();
 const next=document.querySelector('.theme-crew-choice[data-preset="'+keys[index]+'"]');
 next?.focus();choose(keys[index]);
});
$("theme-crew-revert-preview").addEventListener("click",()=>{
 window.KnightfallThemeCrew?.preview?.(null,scope);
 selected=current?.preset||"cathedral";
 drawPresets();
 $("theme-crew-selected").textContent="LIVE THEME · "+(presets[selected]?.name||"Black Sun Temple");
 announce("Preview cleared for "+realmName()+". That realm's published theme is restored.");
});
$("theme-crew-publish").addEventListener("click",()=>publish(false));
$("theme-crew-rollback").addEventListener("click",()=>publish(true));
$("theme-crew-refresh").addEventListener("click",()=>{lock(true);load().catch(e=>announce(e.message)).finally(()=>lock(false))});
$("theme-crew-plan-form").addEventListener("submit",async event=>{
 event.preventDefault();
 const mood=$("theme-crew-mood").value.trim();
 if(!mood){$("theme-crew-plan-result").textContent="Enter a creative direction.";return}
 try{
  const {plan,preset}=await req("/plan","POST",{mood});
  choose(plan.preset);
  $("theme-crew-plan-result").textContent="Morgue Mason recommends "+preset.name+". "+plan.reason+" Preview it before publishing.";
 }catch(e){$("theme-crew-plan-result").textContent="Planner failed: "+e.message}
});
if(["ash-fall.com","www.ash-fall.com"].includes(location.hostname.toLowerCase())){
 boot();
}else{
 workspace.hidden=true;denied.hidden=false;
 announce("Knightfall staff theme controls are available on the production website. This copy is preview-only.");
}
})();