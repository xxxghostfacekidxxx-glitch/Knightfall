import {CRUCIBLE_KINDS,CRUCIBLE_FIELD_LIMITS,buildCrucibleBrief} from "./chaos-crucible-core.mjs?v=20261119-crucible1";

const root=document.getElementById("chaos-crucible");
if(root){
 const doc=root.ownerDocument;
 const $=selector=>root.querySelector(selector);
 const form=$("#crucible-form");
 const typeHost=$("#crucible-types");
 const steps=$("#crucible-steps");
 const preview=$("#crucible-preview");
 const notice=$("#crucible-status");
 const missingBox=$("#crucible-missing");
 const actionIds=["crucible-ask","crucible-copy","crucible-download","crucible-save"];
 const fields=Object.keys(CRUCIBLE_FIELD_LIMITS);
 const valuesByKind=new Map();
 const checkedByKind=new Map();
 let selectedKind=Object.hasOwn(CRUCIBLE_KINDS,location.hash.slice(1))?location.hash.slice(1):"character";
 let currentBrief=null;
 let saving=false;

 const status=(message,failed=false)=>{
   notice.textContent=String(message||"");
   notice.dataset.error=failed?"true":"false";
 };
 function readFields(){
   const data={kind:selectedKind};
   for(const key of fields)data[key]=String(form.elements.namedItem(key)?.value||"");
   return data;
 }
 function storeDraft(){valuesByKind.set(selectedKind,readFields());}
 function restoreDraft(kind){
   const saved=valuesByKind.get(kind)||{};
   for(const key of fields)form.elements.namedItem(key).value=saved[key]||"";
 }
 function renderTypes(){
   typeHost.replaceChildren();
   for(const [key,track] of Object.entries(CRUCIBLE_KINDS)){
     const button=doc.createElement("button");
     button.type="button";button.className="crucible-type";button.dataset.kind=key;
     button.setAttribute("aria-pressed",String(selectedKind===key));
     const icon=doc.createElement("span");icon.className="crucible-type-icon";icon.textContent=track.icon;
     icon.setAttribute("aria-hidden","true");
     const copy=doc.createElement("span");
     const name=doc.createElement("strong");name.textContent=track.name;
     const hint=doc.createElement("small");hint.textContent=track.tagline;
     copy.append(name,hint);button.append(icon,copy);
     button.addEventListener("click",()=>{
       if(selectedKind===key)return;
       storeDraft();selectedKind=key;restoreDraft(key);
       for(const item of typeHost.querySelectorAll("button[data-kind]"))
         item.setAttribute("aria-pressed",String(item.dataset.kind===key));
       renderTrack();recompute();
     });
     typeHost.append(button);
   }
 }
 function renderTrack(){
   const track=CRUCIBLE_KINDS[selectedKind];
   $("#crucible-track-description").textContent=track.tagline;
   $("#crucible-first-label").textContent=track.first;
   $("#crucible-second-label").textContent=track.second;
   $("#crucible-first").placeholder=track.firstHint;
   $("#crucible-second").placeholder=track.secondHint;
   steps.replaceChildren();
   const done=checkedByKind.get(selectedKind)||new Set();
   for(const [index,item] of track.steps.entries()){
     const li=doc.createElement("li");
     const label=doc.createElement("label");
     const box=doc.createElement("input");box.type="checkbox";box.checked=done.has(index);
     box.setAttribute("aria-label","Mark step "+(index+1)+" done: "+item);
     box.addEventListener("change",()=>{
       const next=checkedByKind.get(selectedKind)||new Set();
       if(box.checked)next.add(index);else next.delete(index);
       checkedByKind.set(selectedKind,next);
     });
     const span=doc.createElement("span");span.textContent=String(index+1)+". "+item;
     label.append(box,span);li.append(label);steps.append(li);
   }
 }
 function recompute(){
   const data=readFields();
   storeDraft();
   const count=fields.filter(key=>data[key].trim()).length;
   $("#crucible-progress-label").textContent=count+" / "+fields.length+" fields supplied";
   $("#crucible-progress-fill").style.width=(100*count/fields.length)+"%";
   const result=buildCrucibleBrief(data);
   currentBrief=result.ok?result:null;
   if(!result.ok){
     preview.textContent="Add a project name and a specific objective to generate your brief.";
     missingBox.replaceChildren();
     const p=doc.createElement("p");p.textContent=result.errors.join(" ");
     missingBox.append(p);
   }else{
     preview.textContent=result.markdown;
     missingBox.replaceChildren();
     const p=doc.createElement("p");
     p.textContent=result.missing.length
       ?"Needs confirmation: "+result.missing.join(" · ")+". Miss Chaos will ask, not invent."
       :"All input fields supplied. Validate the facts before producing a final artifact.";
     if(!result.missing.length)p.className="ready";
     missingBox.append(p);
   }
   for(const id of actionIds)$("#"+id).disabled=!currentBrief||(id==="crucible-save"&&saving);
   return result;
 }
 form.addEventListener("input",()=>{recompute();status("");});
 form.addEventListener("submit",event=>event.preventDefault());
 $("#crucible-clear").addEventListener("click",()=>{
   if(!fields.some(key=>String(form.elements.namedItem(key).value||"").trim()))return;
   if(!confirm("Clear this discipline's unsaved brief? Other discipline drafts stay in this browser tab."))return;
   form.reset();checkedByKind.delete(selectedKind);renderTrack();recompute();
   status("The current brief was cleared. Nothing was deleted from saved Knightfall memos.");
 });
 $("#crucible-copy").addEventListener("click",async()=>{
   if(!currentBrief)return;
   try{
     if(!navigator.clipboard?.writeText)throw Error("Clipboard is not available");
     await navigator.clipboard.writeText(currentBrief.markdown);
     status("Full Markdown brief copied. Nothing was sent to Miss Chaos.");
   }catch{status("Copy is unavailable in this browser. Select the Markdown preview to copy it manually.",true);}
 });
 $("#crucible-download").addEventListener("click",()=>{
   if(!currentBrief)return;
   const blob=new Blob([currentBrief.markdown+"\n"],{type:"text/markdown;charset=utf-8"});
   const url=URL.createObjectURL(blob);
   const link=doc.createElement("a");link.href=url;
   link.download=(currentBrief.title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,48)||"miss-chaos-brief")+".md";
   doc.body.append(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
   status("Downloaded the full editable Markdown brief to your device.");
 });
 $("#crucible-ask").addEventListener("click",async()=>{
   if(!currentBrief)return;
   const detail={text:currentBrief.aiPrompt,handled:false,error:null};
   window.dispatchEvent(new CustomEvent("kf:miss-chaos:compose",{detail}));
   if(detail.handled){status("Your brief is in Miss Chaos's chat draft. Review it, then press Send when ready.");return;}
   if(detail.error){status(detail.error,true);return;}
   try{
     if(!navigator.clipboard?.writeText)throw Error("Clipboard unavailable");
     await navigator.clipboard.writeText(currentBrief.aiPrompt);
     status("Miss Chaos's floating chat was unavailable. The prompt was copied; open her full chat and paste it.");
   }catch{status("Floating chat is unavailable. Please copy the preview and open Miss Chaos's full chat.",true);}
 });
 $("#crucible-save").addEventListener("click",async()=>{
   if(!currentBrief||saving)return;
   if(currentBrief.markdown.length>4000){status("Memo limit is 4,000 characters. Shorten the brief before saving; no text was discarded.",true);return;}
   saving=true;recompute();$("#crucible-save").disabled=true;status("Saving your brief privately…");
   try{
     const res=await fetch("https://api.ash-fall.com/api/memos",{
       method:"POST",credentials:"include",cache:"no-store",
       headers:{"content-type":"application/json"},
       body:JSON.stringify({title:currentBrief.title.slice(0,100),body:currentBrief.markdown})
     });
     const data=await res.json().catch(()=>({}));
     if(!res.ok)throw Error(data.error||("Save failed (HTTP "+res.status+")."));
     if(!data.memo?.id)throw Error("Knightfall did not confirm a saved memo.");
     status("Saved privately to your Memo Pad. The Crucible draft remains open and editable.");
     doc.dispatchEvent(new CustomEvent("kf:memos-updated",{detail:{source:"chaos-crucible"}}));
   }catch(e){
     const message=/sign.?in|auth|401/i.test(String(e.message))?
       "Please sign in to Knightfall before saving this private memo. Your brief is still in this tab.":String(e.message||"Unable to save.");
     status(message,true);
   }finally{saving=false;recompute();}
 });
 renderTypes();renderTrack();restoreDraft(selectedKind);recompute();
}
