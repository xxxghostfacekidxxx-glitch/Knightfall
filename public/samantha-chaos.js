/* Samantha's private portal uses the same account-bound Miss Chaos engine.
 * Access control is enforced by Cloudflare Worker, not by these DOM checks.
 */
(() => {
 "use strict";
 const API="https://api.ash-fall.com";
 const $=id=>document.getElementById(id);
 const gate=$("samantha-companion-gate"),gateStatus=$("samantha-companion-gate-status");
 const desk=$("samantha-companion-desk"),chat=$("samantha-private-chat");
 const status=$("samantha-board-status"),preview=$("samantha-board-preview");
 const fleetStatus=$("samantha-fleet-status"),fleetList=$("samantha-fleet-list");
 const fleetSelect=$("samantha-bot-select"),botStatus=$("samantha-bot-status"),botReply=$("samantha-bot-reply");
 const noteForm=$("samantha-note-form"),taskForm=$("samantha-task-form"),botForm=$("samantha-bot-form");
 const noteInput=$("samantha-handoff-note"),taskInput=$("samantha-task-title"),botInput=$("samantha-bot-message");
 const copyReply=$("samantha-draft-bot-reply");
 const set=(el,value)=>{el.textContent=String(value||"");};
 const add=(parent,text)=>{const p=document.createElement("p");p.textContent=text;parent.appendChild(p);};
 const secureFetch=async(path,options={})=>{
  const r=await fetch(API+path,{credentials:"include",cache:"no-store",...options});
  let body;try{body=await r.json()}catch{body={}};
  if(!r.ok)throw Error(r.status===401?"Sign in to your Knightfall account first.":String(body.error||"Request failed.").slice(0,160));
  return body;
 };
 const send=async(path,data)=>secureFetch(path,{method:"POST",
  headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
 async function refreshBoard(){
  try{
   const board=await secureFetch("/api/ai-handoff/");
   const tasks=Array.isArray(board.tasks)?board.tasks:[];
   const notes=Array.isArray(board.notes)?board.notes:[];
   set(status,tasks.filter(t=>t.status!=="done").length+" unfinished shared tasks. "+notes.length+" recent notes.");
   preview.replaceChildren();
   for(const task of tasks.filter(t=>t.status!=="done").slice(0,8))
    add(preview,"#"+task.id+" ["+task.status+"] "+String(task.title).slice(0,180));
   for(const item of notes.slice(0,2))
    add(preview,"Note: "+String(item.body).slice(0,200));
  }catch(error){set(status,error.message);preview.replaceChildren();}
 }
 let allowedBots=[];
 async function refreshFleet(){
  try{
   const info=await secureFetch("/api/chaos/fleet");
   const mine=Array.isArray(info.own_bots)?info.own_bots:[];
   const shared=Array.isArray(info.shared_owner_public_bots)?info.shared_owner_public_bots:[];
   const privateOwner=Array.isArray(info.shared_owner_private_bots)?info.shared_owner_private_bots:[];
   const services=Array.isArray(info.project_service_bots)?info.project_service_bots:[];
   allowedBots=[...shared,...privateOwner,...services.filter(b=>b.chat_available).map(b=>({id:b.key,name:b.name,shared:true,service:true})),...mine.filter(b=>b.is_public&&!b.is_nsfw)]
    .filter(b=>/^[a-f0-9]{32}$/.test(b.id)||b.service&&/^[a-z][a-z0-9-]{1,39}$/.test(b.id));
   set(fleetStatus,mine.length+" personal bots; "+(shared.length+privateOwner.length)+" owner bots and "+services.length+" curator profiles available. "+(info.adult_verified?"Adult access verified.":"Restricted bots stay locked until this account confirms 18+."));
   fleetList.replaceChildren();
   for(const b of shared.slice(0,16))add(fleetList,"Owner public: "+String(b.name).slice(0,60)+" · "+String(b.description||"").slice(0,120));
   for(const b of privateOwner.slice(0,16))add(fleetList,"Owner private, shared with partner: "+String(b.name).slice(0,60));
   for(const b of services.slice(0,8))add(fleetList,"Configured curator: "+String(b.name).slice(0,60)+(b.posting_enabled?" (posting enabled)":" (posting disabled)")+" · on-demand chat available");
   for(const b of mine.slice(0,10))add(fleetList,"My bot: "+String(b.name).slice(0,60)+(b.is_public?" (public)":" (private)"));
   const placeholder=document.createElement("option");placeholder.value="";placeholder.textContent="Choose an authorized bot";
   fleetSelect.replaceChildren(placeholder);
   for(const b of allowedBots){
    const option=document.createElement("option");option.value=b.id;option.textContent=(b.service?"Curator: ":b.shared?"Owner: ":"Mine: ")+b.name+(b.private_share?" (private partner access)":"");
    fleetSelect.appendChild(option);
   }
   if(!allowedBots.length)add(fleetList,"No usable owner bots shown. Restricted bots require your own confirmed 18+ access and remain unpublished.");
  }catch(error){set(fleetStatus,error.message);fleetList.replaceChildren();}
 }
 taskForm.addEventListener("submit",async e=>{
  e.preventDefault();
  const title=taskInput.value.trim();if(!title)return;
  const btn=taskForm.querySelector("button");btn.disabled=true;
  try{
   await send("/api/ai-handoff/tasks",{title,status:"todo",priority:"normal",area:"Bots & Collaboration",
     details:"Shared task created deliberately from Samantha's private Miss Chaos dashboard.",verification:"needs_review"});
   taskInput.value="";set(status,"Shared task saved.");await refreshBoard();
  }catch(error){set(status,error.message)}finally{btn.disabled=false}
 });
 noteForm.addEventListener("submit",async e=>{
  e.preventDefault();const body=noteInput.value.trim();if(!body)return;
  const btn=noteForm.querySelector("button");btn.disabled=true;
  try{
   await send("/api/ai-handoff/notes",{body,category:"update"});
   noteInput.value="";set(status,"Shared note posted.");await refreshBoard();
  }catch(error){set(status,error.message)}finally{btn.disabled=false}
 });
 botForm.addEventListener("submit",async e=>{
  e.preventDefault();
  const id=fleetSelect.value;
  const selected=allowedBots.find(b=>b.id===id);
  if(!selected){set(botStatus,"Choose an authorized bot first.");return;}
  const message=botInput.value.trim();
  if(!message||message.length>3000)return;
  const btn=botForm.querySelector("button");btn.disabled=true;copyReply.disabled=true;set(botStatus,"Consulting the selected bot using Knightfall’s existing free-tier AI allowance…");
  try{
   const reply=(selected.private_share||selected.service)
     ?await send("/api/chaos/fleet/partner-chat",{bot_id:id,message})
     :await send("/api/public-bots/"+id+"/chat",{message});
   set(botReply,reply.reply||"No reply returned.");
   set(botStatus,"Bot responded. Nothing has been posted to Between the Flames.");
   copyReply.disabled=!reply.reply;
  }catch(error){set(botStatus,error.message);set(botReply,"")}
  finally{btn.disabled=false}
 });
 copyReply.addEventListener("click",()=>{
  const text=botReply.textContent.trim();if(!text)return;
  noteInput.value=(noteInput.value.trim()?noteInput.value.trim()+"\n\n":"")+"Bot response (review before sharing):\n"+text.slice(0,3000);
  noteInput.focus();set(status,"Bot reply added to your draft. Press Post only when you approve.");
 });
 async function start(){
  try{
   const me=await secureFetch("/api/chaos/companion");
   if(me.role!=="partner"){set(gateStatus,"This page is reserved for the accepted Knightfall collaborator. The owner can use their own Miss Chaos and Between the Flames.");return;}
   gate.hidden=true;desk.hidden=false;chat.hidden=false;
   const adminTools=$("samantha-admin-tools"),summary=$("samantha-admin-power-summary");
   const permissions=me.permissions||{};
   const verifiedAdmin=me.staff_role==="admin"&&permissions.can_admin===true&&permissions.can_eye_of_chaos===true;
   adminTools.hidden=!verifiedAdmin;
   if(verifiedAdmin){
     set(summary,
       (permissions.can_approve_drafts?"✓ Versioned draft approvals · ":"Draft approvals restricted · ")+
       (permissions.can_theme_publish?"✓ Audited theme publishing + rollback · ":"Theme publishing restricted · ")+
       "GOD-only: Eye of Horus, root ownership and master emergency pause.");
   }
   await Promise.all([refreshBoard(),refreshFleet()]);
  }catch(error){set(gateStatus,error.message);}
 }
 start();
})();
