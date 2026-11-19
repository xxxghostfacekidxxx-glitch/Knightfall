(()=>{
"use strict";
const API="https://api.ash-fall.com/api/god/theme";
const $=id=>document.getElementById(id);
const status=$("theme-crew-status");
const workspace=$("theme-crew-workspace");
const denied=$("theme-crew-denied");
let current=null,presets={},selected="cathedral",busy=false,initialized=false,canPublish=false;
const announce=text=>{status.textContent=String(text)};
const textNode=(tag,text,cls)=>{const e=document.createElement(tag);if(cls)e.className=cls;e.textContent=String(text);return e};
async function req(path,method="GET",payload){
 const opts={method,credentials:"include",cache:"no-store",headers:{accept:"application/json"}};
 if(method!=="GET"){opts.headers["content-type"]="application/json";opts.body=JSON.stringify(payload)}
 const res=await fetch(API+path,opts);const d=await res.json().catch(()=>({}));
 if(!res.ok)throw Error(d.error||"Theme Crew request failed ("+res.status+").");
 return d;
}
const lock=value=>{busy=value;for(const id of ["theme-crew-preview","theme-crew-publish","theme-crew-revert-preview","theme-crew-rollback","theme-crew-refresh"])$(id).disabled=busy||((id==="theme-crew-publish"||id==="theme-crew-rollback")&&!canPublish)};
function choose(preset){
 if(!Object.hasOwn(presets,preset))return;
 selected=preset;
 for(const b of document.querySelectorAll(".theme-crew-choice")){
  b.setAttribute("aria-pressed",String(b.dataset.preset===selected));
 }
 const p=presets[preset];
 announce("Selected "+p.name+". Preview is local. "+(canPublish?"Confirm your authorized sitewide change before publishing.":"Your theme proposal can be reviewed by GOD for publication."));
}
function drawPresets(){
 const place=$("theme-crew-presets");place.replaceChildren();
 for(const [key,preset] of Object.entries(presets)){
  const b=document.createElement("button");b.type="button";b.className="theme-crew-choice";b.dataset.preset=key;
  b.style.setProperty("--kf-choice-accent",preset.accent);
  b.setAttribute("aria-pressed",String(selected===key));
  b.dataset.current=String(current?.preset===key);
  const chip=document.createElement("span");chip.className="theme-crew-chip";chip.setAttribute("aria-hidden","true");
  b.append(chip,textNode("strong",preset.name),textNode("small",preset.tag),textNode("small",preset.mood));
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
 if(!rows?.length){list.append(textNode("li","No theme changes have been published yet."));return;}
 for(const h of rows){
  const time=h.at?new Date(h.at):null;
  const stamp=time&&Number.isFinite(time.getTime())?time.toLocaleString():"Unknown";
  list.append(textNode("li",stamp+" · "+String(h.from||"?")+" → "+String(h.to||"?")+" (v"+h.revision+")"));
 }
}
async function load(){
 const data=await req("/status");
 current=data.current;presets=data.presets;
 canPublish=data.permissions?.can_publish===true;
 for(const id of ["theme-crew-publish","theme-crew-rollback"])$(id).hidden=!canPublish;
 lock(false);
 if(!initialized||!Object.hasOwn(presets,selected))selected=current.preset;
 initialized=true;
 $("theme-crew-current").textContent="LIVE: "+presets[current.preset]?.name+" · Revision "+current.revision+
   (current.updated_at?" · "+new Date(current.updated_at).toLocaleString():" · Default release");
 drawPresets();drawBots(data.bots||[],data.workflow);drawHistory(data.history||[]);
 workspace.hidden=false;denied.hidden=true;
 announce((canPublish?"Authorized audited theme publishing available.":"Staff design and preview controls ready. Final publishing remains GOD-only.")+" Live site: "+presets[current.preset]?.name+".");
}
async function boot(){
 try{await load()}catch(e){workspace.hidden=true;denied.hidden=false;announce("Theme Crew unavailable: "+e.message)}
}
async function publish(undo=false){
 if(busy||!current||!canPublish){if(!canPublish)announce("Only GOD or the accepted admin partner can publish or roll back a sitewide theme.");return;}
 const desired=undo?current.previous:selected;
 if(!Object.hasOwn(presets,desired)){announce("Select a reviewed preset.");return}
 if(desired===current.preset){announce("That theme is already live.");return}
 const verb=undo?"ROLL BACK":"PUBLISH";
 if(!confirm(verb+" "+presets[desired].name+" across Knightfall? Every member will see the selected look. This action is logged and reversible."))return;
 lock(true);
 let published=false;
 try{
  const result=await req(undo?"/rollback":"/activate","POST",undo?{expectedRevision:current.revision}:{preset:desired,expectedRevision:current.revision});
  current=result.current;
  published=true;
  try{await load()}catch(error){announce("Theme published as "+presets[current.preset].name+", but dashboard refresh failed: "+error.message+". Reload to verify.");}
  // Local preview must not hide the new live state.
  window.KnightfallThemeCrew?.preview?.(null);
  await window.KnightfallThemeCrew?.refresh?.();
  announce("Published "+presets[current.preset].name+" sitewide. Revision "+current.revision+". Existing tabs refresh automatically.");
 }catch(e){announce(published?"Theme change was accepted, but confirmation was interrupted: "+e.message+". Check the live status before trying again.":"Theme change was not confirmed: "+e.message+". Refresh live status before retrying.");}
 finally{lock(false)}
}
$("theme-crew-preview").addEventListener("click",()=>{
 if(!window.KnightfallThemeCrew?.preview?.(selected)){announce("Preview runtime not ready.");return}
 announce("Local preview active: "+presets[selected].name+". Other members still see the published theme.");
 const url="/?kf_theme_preview="+encodeURIComponent(selected);
 window.open(url,"_blank","noopener,noreferrer");
});
$("theme-crew-revert-preview").addEventListener("click",()=>{
 window.KnightfallThemeCrew?.preview?.(null);
 announce("Local preview cleared; the published theme is restored on your device.");
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