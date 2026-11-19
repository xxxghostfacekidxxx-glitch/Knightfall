import {GUIDE_AREAS,GUIDE_DEMOS,guideViewer,guideAreaCount,guideDemoInput} from "./miss-chaos-guide-core.mjs?v=20261119-guide1";

const root=document.querySelector(".mc-guide-shell");
if(root){
 const $=selector=>root.querySelector(selector);
 const doc=root.ownerDocument;
 const cards=$("#mc-guide-cards"),cardStatus=$("#mc-guide-card-status");
 const authStatus=$("#mc-guide-auth-status");
 const tool=$("#mc-guide-tool"),toolInput=$("#mc-guide-tool-input");
 const toolRun=$("#mc-guide-tool-run"),toolResult=$("#mc-guide-tool-result");
 const toolStatus=$("#mc-guide-tool-status");
 let view={verified:false,role:"visitor",mode:null,permissions:{},capabilities:[]};
 let loading=false;
 const setStatus=(node,message,error=false)=>{
   node.textContent=String(message||"");
   node.dataset.error=error?"true":"false";
 };
 const create=(tag,cls,text)=>{
   const node=doc.createElement(tag);
   if(cls)node.className=cls;
   if(text!==undefined)node.textContent=String(text);
   return node;
 };
 function addLink(parent,label,href){
   const link=create("a","mc-guide-link",label);
   link.href=href;parent.append(link);return link;
 }
 async function copyStarter(prompt,button){
   button.disabled=true;
   try{
     if(!navigator.clipboard?.writeText)throw Error("Clipboard unavailable");
     await navigator.clipboard.writeText(prompt);
     setStatus(cardStatus,"Starter prompt copied. Open Miss Chaos and paste it whenever you're ready.");
   }catch{setStatus(cardStatus,"Copy isn't available here. You can still use the examples to write your own request.",true);}
   finally{button.disabled=false;}
 }
 function renderCards(){
   cards.replaceChildren();
   const q=$("#mc-guide-filter").value.trim().toLowerCase();
   const matches=GUIDE_AREAS.filter(area=>
     (area.title+" "+area.detail+" "+area.prompt+" "+area.capabilities.join(" ")).toLowerCase().includes(q));
   for(const area of matches){
     const article=create("article","mc-guide-card");
     const header=create("div","mc-guide-card-head");
     header.append(create("span","mc-guide-card-icon",area.icon),create("h3","",area.title));
     const description=create("p","mc-guide-card-desc",area.detail);
     const facts=create("div","mc-guide-card-facts");
     if(view.verified){
       const count=guideAreaCount(area,view.capabilities);
       facts.textContent=count+" / "+area.capabilities.length+" related tools listed for your signed-in session";
       facts.classList.toggle("empty",count===0);
     }else facts.textContent="Sign in to check your available tool list";
     const sample=create("div","mc-guide-card-prompt");
     sample.append(create("span","mc-guide-card-prompt-label","EXAMPLE REQUEST"),
       create("p","",area.prompt));
     const actions=create("div","mc-guide-card-actions");
     const copy=create("button","mc-guide-copy","Copy this request");
     copy.type="button";
     copy.addEventListener("click",()=>void copyStarter(area.prompt,copy));
     actions.append(copy);
     addLink(actions,area.routeLabel,area.route);
     article.append(header,description,facts,sample,actions);
     cards.append(article);
   }
   if(!matches.length){
     cards.append(create("p","mc-guide-empty","No matching capability. Try art, tattoo, coding, patterns, moon or games."));
   }
   if(q)setStatus(cardStatus,matches.length+" of "+GUIDE_AREAS.length+" areas match your search");
   else setStatus(cardStatus,"");
 }
 function renderPrivate(){
   const panel=$("#mc-guide-private");
   panel.hidden=true;
   if(!view.verified||!view.mode)return;
   const owner=view.role==="osiris";
   const partner=view.role==="partner";
   if(!owner&&!partner)return;
   const permissions=view.permissions||{};
   panel.hidden=false;
   $("#mc-guide-private-title").textContent=owner?"Osiris · Owner's Private Miss Chaos":view.mode.label;
   $("#mc-guide-private-summary").textContent=owner
     ?"Your owner workspace brings together private project planning, GOD diagnostics, staff source inspection, mission and draft supervision, and account-level command panels. All write or publish actions remain independently gated."
     :"Your private collaborator workspace keeps your own chats and saved memories account-bound. Accepted partnership permits shared task coordination and explicitly requested consultations with authorized owner bots. Staff tools depend on separately verified administrator access.";
   const links=$("#mc-guide-private-links");
   links.replaceChildren();
   // These links are only rendered after the backend authorizes this exact mode.
   addLink(links,"Open "+(owner?"Osiris":"private collaborator")+" chat",view.mode.full_chat);
   addLink(links,"Between the Flames · Shared tasks","/ai-handoff.html");
   if(permissions.can_eye_of_chaos===true)
     addLink(links,"Eye of Chaos · Mission control","/eye-of-chaos.html");
   if(permissions.can_admin===true)
     addLink(links,"Staff dashboard","/admin.html");
   if(permissions.can_theme_publish===true)
     addLink(links,"Theme Crew · Reviewed release and rollback","/theme-crew.html");
   if(owner&&permissions.can_eye_of_horus===true)
     addLink(links,"Eye of Horus · GOD oversight","/eye-of-horus.html");
   if(owner&&permissions.can_master_control===true)
     addLink(links,"Owner master execution controls","/eye-of-chaos.html#chaos-master-controls");
   if(partner)addLink(links,"Authorized bot consultations","/samantha-chaos.html");
   $("#mc-guide-private-limit").textContent=owner
     ?"Master execution locks and GOD-only audit/oversight are exclusive to the verified owner. Reviewing a proposed patch is not publishing or deploying it."
     :"Partner access does not transfer GOD authority, other members' memories, private credentials, or external Cloudflare/GitHub permissions. Approvals and Theme Crew publishing appear only when your separate admin privileges are verified.";
 }
 function updateDemo(reset=true){
   const demo=GUIDE_DEMOS[tool.value];
   if(!demo)return;
   $("#mc-guide-tool-label").textContent=demo.label;
   toolInput.placeholder=demo.placeholder;
   toolInput.maxLength=demo.id==="calc"?100:3000;
   $("#mc-guide-tool-description").textContent=demo.description;
   if(reset)toolResult.textContent="Only actual server responses appear here. No made-up test results.";
   toolRun.disabled=!view.verified||!view.capabilities.includes(demo.capability)||loading;
   if(reset)setStatus(toolStatus,view.verified
     ?toolRun.disabled?"This particular utility is not listed for this account.":"Ready. Press Try to run this read-only utility."
     :"Sign in to check which utilities are available.");
 }
 $("#mc-guide-filter").addEventListener("input",renderCards);
 tool.addEventListener("change",updateDemo);
 $("#mc-guide-tool-form").addEventListener("submit",async event=>{
   event.preventDefault();
   const demo=GUIDE_DEMOS[tool.value];
   if(!demo||!view.verified||!view.capabilities.includes(demo.capability)||loading)return;
   let body;
   try{body=guideDemoInput(demo.id,toolInput.value);}
   catch(error){setStatus(toolStatus,String(error.message),true);return;}
   loading=true;toolRun.disabled=true;
   setStatus(toolStatus,"Requesting a real, bounded read-only result…");
   toolResult.textContent="No result yet.";
   try{
     const response=await fetch("https://api.ash-fall.com/api/chaos/tools/execute",{
       method:"POST",credentials:"include",cache:"no-store",
       headers:{"content-type":"application/json"},body:JSON.stringify(body)
     });
     const result=await response.json().catch(()=>({}));
     if(!response.ok)throw Error(result.error||"Utility is temporarily unavailable.");
     if(result.name!==demo.capability||result.result===undefined)
       throw Error("Worker returned an unexpected utility response.");
     toolResult.textContent=JSON.stringify(result.result,null,2).slice(0,3500);
     setStatus(toolStatus,"Verified response received from Knightfall's read-only utility endpoint.");
   }catch(error){
     toolResult.textContent="No verified result. Nothing has been invented.";
     setStatus(toolStatus,String(error.message||"Utility failed."),true);
   }finally{loading=false;updateDemo(false);}
 });
 async function request(path){
   const res=await fetch("https://api.ash-fall.com"+path,{method:"GET",credentials:"include",cache:"no-store"});
   if(!res.ok)throw Error("Server capability check unavailable ("+res.status+").");
   return await res.json();
 }
 async function loadGuideAccess(){
   // No user identity inferred from URL, display name, cached flags or an access label.
   try{
     const [modes,tools]=await Promise.all([request("/api/chaos/modes"),request("/api/chaos/tools")]);
     view=guideViewer(modes,tools);
     if(!view.verified)throw Error("Knightfall has not confirmed this account's capability list.");
     setStatus(authStatus,"✓ Signed-in account checked. The tool names below are offered to this session; individual requests can still be rate-limited or unavailable.");
     const scope=$("#mc-guide-member-tools");
     scope.hidden=false;scope.replaceChildren();
     scope.append(create("h3","","Account-scoped capability index"));
     const summary=create("p","",view.capabilities.length+" tool identifiers currently listed. Private account tools access only your own data through the verified session.");
     const tags=create("div","mc-guide-tool-tags");
     for(const name of view.capabilities){
       const span=create("code","",name);tags.append(span);
     }
     scope.append(summary,tags);
   }catch(error){
     view={verified:false,role:"visitor",mode:null,permissions:{},capabilities:[]};
     $("#mc-guide-member-tools").hidden=true;
     setStatus(authStatus,
       "Account-specific tools could not be verified. Sign in to Knightfall or try again if its API is unavailable. Public feature descriptions remain visible.",true);
   }
   renderCards();renderPrivate();updateDemo();
 }
 renderCards();updateDemo();
 void loadGuideAccess();
}
