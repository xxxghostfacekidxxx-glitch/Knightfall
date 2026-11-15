(()=>{"use strict";
const API="https://api.ash-fall.com",BASE="/api/god/eye";
const $=id=>document.getElementById(id);
const status=$("eye-status"),denied=$("eye-denied"),unlock=$("eye-unlock"),workspace=$("eye-workspace"),results=$("eye-results");
let unlocked=false,nextOffset=0,hasMore=false,lastForm=null;
const node=(tag,cls,content)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(content!=null)el.textContent=String(content);return el};
const msg=message=>{status.textContent=message};
async function request(path,options={}){
 const response=await fetch(API+BASE+path,{credentials:"include",cache:"no-store",...options});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data.error||"Request failed ("+response.status+").");
 return data;
}
function show(mode){denied.hidden=mode!=="denied";unlock.hidden=mode!=="unlock";workspace.hidden=mode!=="workspace";unlocked=mode==="workspace";if(!unlocked){results.replaceChildren();lastForm=null;hasMore=false;$("eye-next").hidden=true;}}
const post=(path,obj)=>request(path,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(obj)});
function iso(value){
 const d=new Date(String(value||"").replace(" ","T")+(String(value||"").includes("Z")?"":"Z"));
 return Number.isFinite(d.getTime())?d.toLocaleString():String(value||"");
}
function itemCard(category,item){
 const card=node("article","eye-result"),top=node("header"),id=item.id;
 top.append(node("span","",category.replaceAll("_"," ").toUpperCase()+" / "+String(id)));
 top.append(node("time","",iso(item.created_at)));
 card.append(top);
 let title="",description="";
 if(category==="direct_messages"){
   title="From @"+item.sender+" · Conversation #"+item.conversation_id;
   description=item.body;
   card.append(node("small","", "Participants: "+(item.participants||"Unknown")));
 } else if(category==="miss_chaos"){
   title="@"+item.username+" · "+item.role+" · "+(item.conversation_title||"Miss Chaos");
   description=item.content;
 } else if(category==="personal_bot_chats"){
   title="@"+item.username+" · "+item.role+" · "+item.bot_name;
   description=item.content;
 } else if(category==="profile_photos"){
   title="@"+item.username+" · "+item.kind+" photo";
   description=item.caption||"No caption.";
 } else if(category==="message_attachments"){
   title="@"+item.username+" · "+item.original_filename;
   description="Message #"+item.message_id+" · "+item.content_type+" · "+item.byte_size+" bytes";
 } else if(category==="bot_definitions"){
   title="@"+item.username+" · "+item.name;
   description=(item.description||"")+(item.system_prompt?"\n\nCreator instructions:\n"+item.system_prompt:"");
 }
 card.append(node("h3","",title),node("pre","",description));
 if((category==="profile_photos"||category==="message_attachments")&&/^image\/(?:png|jpeg|gif|webp)$/.test(item.content_type)){
   const photo=document.createElement("img");
   photo.loading="lazy";
   photo.alt=(category==="profile_photos"?"Reviewed member photo":"Reviewed message image")+" #"+id;
   photo.referrerPolicy="no-referrer";
   photo.src=API+BASE+"/media/"+category+"/"+encodeURIComponent(id);
   card.append(photo);
 }
 return card;
}
async function loadReview(next=false){
 if(!unlocked)return;
 const form=$("eye-review-form");
 if(!form.reportValidity())return;
 const data=Object.fromEntries(new FormData(form).entries());
 const payload={category:data.category,user_id:data.user_id||null,reason:data.reason,limit:20,offset:next?nextOffset:0};
 const submit=form.querySelector('button[type="submit"]');
 submit.disabled=true;$("eye-next").disabled=true;
 msg("Reading authorized records…");
 try{
  const d=await post("/review",payload);
  if(!next)results.replaceChildren();
  for(const item of d.items||[])results.append(itemCard(d.category,item));
  if(!results.childElementCount)results.append(node("p","", "No saved records found for this review."));
  nextOffset=payload.offset+(d.items||[]).length;hasMore=d.has_more===true;
  $("eye-next").hidden=!hasMore;
  $("eye-count").textContent=nextOffset+" saved record(s) reviewed";
  lastForm=payload;
  msg("Review recorded in the Eye of Horus access ledger.");
 }catch(error){msg(error.message);if(/password|unlock/i.test(error.message))show("unlock");}
 finally{submit.disabled=false;$("eye-next").disabled=false;}
}
$("eye-unlock-form").addEventListener("submit",async event=>{
 event.preventDefault();
 const password=$("eye-password").value;
 const button=event.currentTarget.querySelector("button");
 button.disabled=true;msg("Verifying God credentials…");
 try{
  const d=await post("/unlock",{password});
  $("eye-password").value="";
  $("eye-expires").textContent="Authorized until "+iso(d.expires_at);
  show("workspace");msg("Eye of Horus unlocked. All reviews require a documented purpose.");
 }catch(error){msg(error.message);}
 finally{button.disabled=false;$("eye-password").value="";}
});
$("eye-lock").addEventListener("click",async()=>{
 try{await post("/lock",{});show("unlock");msg("Oversight session locked.");}
 catch(error){msg(error.message);}
});
$("eye-review-form").addEventListener("submit",e=>{e.preventDefault();loadReview();});
$("eye-next").addEventListener("click",()=>{
 if(lastForm&&lastForm.category===$("eye-category").value&&lastForm.reason===$("eye-reason").value.trim()&&String(lastForm.user_id||"")===String($("eye-user").value||""))loadReview(true);
 else loadReview();
});
$("eye-audit").addEventListener("click",async()=>{
 msg("Loading access log…");
 try{
  const d=await request("/audit");
  results.replaceChildren();
  for(const item of d.logs||[]){
   const card=node("article","eye-result");
   card.append(node("h3","",item.action+" · "+item.category),node("small","",iso(item.created_at)),node("pre","",item.reason),node("small","", "Member filter: "+(item.target_user_id??"All")+" · Records: "+item.result_count));
   results.append(card);
  }
  if(!results.childElementCount)results.append(node("p","", "No prior Eye of Horus reads."));
  $("eye-next").hidden=true;msg("Access history loaded.");
 }catch(error){msg(error.message);}
});
(async()=>{
 try{
  const d=await request("/status");
  show(d.unlocked?"workspace":"unlock");
  if(d.unlocked){$("eye-expires").textContent="Authorized until "+iso(d.expires_at);msg("Authorized review session is active.");}
  else msg("God account confirmed. Password verification is required.");
 }catch(error){show("denied");msg(error.message);}
})();
})();
