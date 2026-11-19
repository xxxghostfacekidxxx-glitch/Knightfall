(()=>{
"use strict";
const API="https://api.ash-fall.com/api/god/chaos";
const $=id=>document.getElementById(id);
const state={fleet:null,sources:[],missions:[],drafts:[],events:[],ready:false,paused:false,canGod:false,canApprove:false,section:"overview"};
const root=$("chaos-workspace"),notice=$("chaos-status");
const node=(tag,cls,text)=>{
 const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);
 return el;
};
const message=s=>{notice.textContent=String(s)};
async function api(path,method="GET",payload){
 const options={method,credentials:"include",cache:"no-store",headers:{accept:"application/json"}};
 if(method!=="GET"){options.headers["content-type"]="application/json";options.body=JSON.stringify(payload||{});}
 const response=await fetch(API+path,options),result=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(result.error||"Request failed ("+response.status+").");
 return result;
}
function openSection(name){
 const section=document.querySelector('.chaos-panel[data-panel="'+name+'"]');
 if(!section)return;
 for(const el of document.querySelectorAll(".chaos-panel"))el.hidden=el!==section;
 for(const b of document.querySelectorAll(".chaos-tabs button")){if(b.dataset.section===name)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");}
 state.section=name;
 if(name==="missions")loadMissions();
 if(name==="approvals")loadDrafts();
 if(name==="history")loadEvents();
 if(name==="qa")loadQA();
}
const names={
 agents:()=>state.fleet?.agents||[],
 arcade:()=>state.fleet?.arcade||[],
 forums:()=>state.fleet?.forums||[]
};
function fillSelect(select,items){
 const previous=select.value;select.replaceChildren();
 for(const item of items)select.append(new Option(item.name,item.key));
 if(items.some(i=>i.key===previous))select.value=previous;
}
function renderCards(target,items,label){
 target.replaceChildren();
 if(!items.length){target.append(node("p","chaos-empty","No workers in this division."));return}
 items.forEach((a,i)=>{
  const card=node("article","chaos-agent");
  card.append(node("small","",label+" "+String(i+1).padStart(2,"0")));
  card.append(node("h3","",a.name));
  card.append(node("p","",a.specialty||a.kind||a.status||""));
  target.append(card);
 });
}
function refreshAssignee(){fillSelect($("chaos-assignee"),names[$("chaos-division").value]?.()||[]);}
function refreshDraftAssignee(){fillSelect($("chaos-draft-agent"),names[$("chaos-draft-division").value]?.()||[]);}
function refreshSource(){
 const target=$("chaos-source");target.replaceChildren(new Option("No automated source",""));
 for(const source of state.sources)target.append(new Option(source.label+" · "+source.category,source.key));
}
function refreshMaster(){
 const status=$("chaos-master-state"),button=$("chaos-master-toggle");
 if(!state.canGod){button.disabled=true;return;}
  if(!state.ready){status.textContent="Execution controls require database migrations 0142 and 0143.";button.disabled=true;return}
 status.textContent=state.paused?"ALL AGENT EXECUTION PAUSED · GOD LOCK ACTIVE":"Mission research and manual AI drafting may run on explicit assignments.";
 button.textContent=state.paused?"Resume agent execution":"Pause all agent execution";
 button.disabled=false;
}
function lockForms(){
 if(state.ready)return;
 for(const form of [$("chaos-mission-form"),$("chaos-draft-form")]){
  for(const control of form.querySelectorAll("input,select,textarea,button"))control.disabled=true;
 }
 for(const group of [$("chaos-mission-list"),$("chaos-draft-list")]){
  group.replaceChildren(node("p","chaos-empty","Storage migration 0142 is pending. Staff can view the fleet, but mission and draft controls stay locked."));
 }
}
function metaLine(values){
 const line=node("div","chaos-metadata");
 values.filter(Boolean).forEach(value=>line.append(node("span","",value)));
 return line;
}
function action(label,cb,style="chaos-quiet"){
 const b=node("button",style,label);b.type="button";
 b.addEventListener("click",async()=>{
  b.disabled=true;try{await cb();}catch(error){message(error.message)}finally{b.disabled=false}
 });return b;
}
const fmtTime=value=>{const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleString():"Unknown"};
const busy=async(task,done)=>{
 message(task);
 try{await done();message("Command completed. No content has been published.");}
 catch(e){message("Command failed: "+e.message)}
};
async function loadMissions(){
 if(!state.ready)return;
 try{state.missions=(await api("/missions")).missions||[];renderMissions()}
 catch(e){message("Mission list unavailable: "+e.message)}
}
function renderMissions(){
 const panel=$("chaos-mission-list");panel.replaceChildren();
 if(!state.missions.length){panel.append(node("p","chaos-empty","No missions assigned yet."));return}
 for(const m of state.missions){
  const card=node("article","chaos-mission"),head=node("div","chaos-item-heading"),left=node("div");
  left.append(node("h4","",m.agent_key+" / "+m.kind));
  left.append(metaLine([m.division,m.cadence,m.source_key?("Source: "+m.source_key):"",m.next_run_at?("Next: "+fmtTime(m.next_run_at)):""]));
  const badge=node("span","chaos-state",m.status);badge.dataset.state=m.status;head.append(left,badge);
  card.append(head,node("p","",m.instructions));
  const buttons=node("div","chaos-actions");
  if(m.status!=="cancelled"&&!state.paused&&m.kind==="research"&&m.source_key){
   buttons.append(action("Research now",()=>busy("Fetching approved research source…",async()=>{
    const result=await api("/missions/"+m.id+"/run","POST");if(result.created_draft){await loadMissions();await loadDrafts();}
   })));
  }
  if(m.status!=="cancelled"&&!state.paused&&m.division!=="arcade"){
   buttons.append(action("AI draft",()=>busy("Generating a pending AI draft for GOD review…",async()=>{
    const result=await api("/missions/"+m.id+"/draft","POST");
    if(result.created_draft){await loadDrafts();openSection("approvals")}
   })));
  }
  if(["queued","ready","failed"].includes(m.status))buttons.append(action("Pause",()=>busy("Pausing mission…",async()=>{await api("/missions/"+m.id+"/pause","POST");await loadMissions()})));
  if(m.status==="paused")buttons.append(action("Resume",()=>busy("Resuming mission…",async()=>{await api("/missions/"+m.id+"/resume","POST");await loadMissions()})));
  if(["queued","ready","paused","failed"].includes(m.status))buttons.append(action("Cancel",async()=>{
   if(!confirm("Cancel this mission?"))return;
   await busy("Cancelling mission…",async()=>{await api("/missions/"+m.id+"/cancel","POST");await loadMissions()});
  },"chaos-danger"));
  card.append(buttons);panel.append(card);
 }
}
async function loadDrafts(){
 if(!state.ready)return;
 try{state.drafts=(await api("/drafts")).drafts||[];$("chaos-pending-count").textContent=String(state.drafts.filter(x=>x.status==="pending").length);renderDrafts()}
 catch(e){message("Drafts unavailable: "+e.message)}
}
function resetDraftEditor(){
 $("chaos-draft-form").reset();$("chaos-edit-id").value="";
 $("chaos-draft-form-heading").textContent="Prepare a draft for review";
 $("chaos-draft-save").textContent="Save pending draft";
 $("chaos-draft-cancel").hidden=true;
 refreshDraftAssignee();$("chaos-draft-division").disabled=false;$("chaos-draft-agent").disabled=false;
}
function editDraft(d){
 $("chaos-edit-id").value=d.id;
 const isForum=(state.fleet?.forums||[]).some(x=>x.key===d.author_key);
 $("chaos-draft-division").value=isForum?"forums":"agents";refreshDraftAssignee();
 $("chaos-draft-agent").value=d.author_key;
 $("chaos-draft-division").disabled=true;$("chaos-draft-agent").disabled=true;
 $("chaos-draft-title").value=d.title;$("chaos-draft-body").value=d.body;
 $("chaos-draft-source").value=d.source_url||"";$("chaos-draft-destination").value=d.destination||"";
 $("chaos-draft-form-heading").textContent="Editing draft v"+d.version+" · approval will reset";
 $("chaos-draft-save").textContent="Save revised draft";$("chaos-draft-cancel").hidden=false;
 openSection("approvals");$("chaos-draft-form").scrollIntoView({behavior:"smooth",block:"start"});
}
function renderDrafts(){
 const panel=$("chaos-draft-list");panel.replaceChildren();
 if(!state.drafts.length){panel.append(node("p","chaos-empty","No bot drafts yet. Research results and prepared posts will appear here."));return}
 for(const d of state.drafts){
  const card=node("article","chaos-draft"),head=node("div","chaos-item-heading"),left=node("div");
  left.append(node("h4","",d.title));left.append(metaLine([d.author_key,"Version "+d.version,d.destination||"No destination",fmtTime(d.created_at)]));
  const badge=node("span","chaos-state",d.status);badge.dataset.state=d.status;head.append(left,badge);card.append(head);
  card.append(node("pre","",d.body));
  if(d.source_url&&/^https:\/\//.test(d.source_url)){const p=node("p");const a=node("a","","Original source");a.href=d.source_url;a.rel="noopener noreferrer";a.target="_blank";p.append(a);card.append(p)}
  const controls=node("div","chaos-actions");
  if(d.status!=="published"&&(d.status!=="approved"||state.canApprove))controls.append(action("Edit draft",()=>editDraft(d)));
  if(state.canApprove&&["pending","rejected"].includes(d.status))
   controls.append(action(state.canGod?"Osiris approve":"Isis approve",()=>busy("Recording version-specific approval…",async()=>{
    await api("/drafts/"+d.id+"/approve","POST");await loadDrafts();
   })));
  if(state.canApprove&&["pending","approved"].includes(d.status))
   controls.append(action("Reject",()=>busy("Rejecting draft…",async()=>{await api("/drafts/"+d.id+"/reject","POST");await loadDrafts()}),"chaos-danger"));
  if(d.status==="approved")card.append(node("p","chaos-note","Version-specific authorized approval recorded. Still unpublished: destination publishing is locked."));
  card.append(controls);panel.append(card);
 }
}
async function loadQA(){
 const status=$("chaos-qa-state"),results=$("chaos-qa-results");results.replaceChildren();
 status.textContent="Checking actual GitHub Actions evidence…";
 try{
  const data=await api("/qa");
  if(!data.verified){status.textContent=data.message||"Current QA state unverified.";return}
  const run=data.run;
  status.textContent="Run #"+run.id+" · "+run.status+
   (run.conclusion?(" · "+run.conclusion.toUpperCase()):" · still running");
  const card=node("article","chaos-mission"),head=node("h4","","GitHub workflow revision "+String(run.sha||"").slice(0,8));
  card.append(head,metaLine(["Started "+fmtTime(run.created_at),"Run "+run.id]));
  if(typeof run.url==="string"&&run.url.startsWith("https://github.com/")){
   const link=node("a","","Open verified run and artifacts");
   link.href=run.url;link.target="_blank";link.rel="noopener noreferrer";card.append(link);
  }
  results.append(card);
  if(!data.jobs_verified){results.append(node("p","chaos-empty","Individual worker jobs not yet verified."));return}
  for(const job of data.jobs){
   const item=node("article","chaos-mission"),row=node("div","chaos-item-heading");
   row.append(node("h4","",job.name));
   const badge=node("span","chaos-state",job.conclusion||job.status||"unknown");
   badge.dataset.state=job.conclusion||job.status||"unknown";row.append(badge);item.append(row);
   if(job.url?.startsWith("https://github.com/")){
    const a=node("a","","View worker job");a.href=job.url;a.rel="noopener noreferrer";a.target="_blank";item.append(a);
   }
   results.append(item);
  }
  if(!data.jobs.length)results.append(node("p","chaos-empty","No individual worker results returned for this run."));
 }catch(error){status.textContent="GitHub QA status unavailable: "+error.message}
}
async function loadEvents(){
 if(!state.ready)return;
 try{
  state.events=(await api("/events")).events||[];
  const root=$("chaos-history-list");root.replaceChildren();
  if(!state.events.length)root.append(node("p","chaos-empty","No operations recorded."));
  for(const e of state.events){
   const card=node("article","chaos-mission");
   card.append(node("strong","",e.action+" / "+e.object_type),metaLine(["Staff #"+e.actor_id,e.object_id,fmtTime(e.occurred_at)]));
   root.append(card);
  }
 }catch(e){message("Mission history unavailable: "+e.message)}
}
document.querySelectorAll(".chaos-tabs button").forEach(b=>b.addEventListener("click",()=>openSection(b.dataset.section)));
document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>openSection(b.dataset.open)));
$("chaos-division").addEventListener("change",refreshAssignee);
$("chaos-draft-division").addEventListener("change",refreshDraftAssignee);
$("chaos-mission-refresh").addEventListener("click",loadMissions);
$("chaos-draft-refresh").addEventListener("click",loadDrafts);
$("chaos-history-refresh").addEventListener("click",loadEvents);
$("chaos-qa-refresh").addEventListener("click",loadQA);
$("chaos-master-toggle").addEventListener("click",async()=>{
 if(!state.ready||!state.canGod)return;
 const target=!state.paused;
 if(target&&!confirm("Osiris master pause: stop all manual research, scheduled research and AI draft execution?"))return;
 await busy(target?"Pausing every Eye of Chaos worker…":"Resuming GOD-approved mission execution…",async()=>{
  const outcome=await api("/control","POST",{paused:target});
  state.paused=outcome.paused;refreshMaster();await loadMissions();
 });
});
$("chaos-draft-cancel").addEventListener("click",resetDraftEditor);
$("chaos-mission-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!state.ready)return;
 const b=$("chaos-mission-create");b.disabled=true;
 await busy("Creating staff mission…",async()=>{
  await api("/missions","POST",{
   division:$("chaos-division").value,agent_key:$("chaos-assignee").value,
   kind:$("chaos-kind").value,cadence:$("chaos-cadence").value,
   source_key:$("chaos-source").value,destination:$("chaos-destination").value,
   instructions:$("chaos-instructions").value
  });
  $("chaos-instructions").value="";await loadMissions();
 });b.disabled=false;
});
$("chaos-draft-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!state.ready)return;
 const b=$("chaos-draft-save");b.disabled=true;
 await busy("Saving pending content…",async()=>{
  const id=$("chaos-edit-id").value;
  const body={
   author_key:$("chaos-draft-agent").value,division:$("chaos-draft-division").value,
   title:$("chaos-draft-title").value,body:$("chaos-draft-body").value,
   source_url:$("chaos-draft-source").value,destination:$("chaos-draft-destination").value
  };
  await api(id?"/drafts/"+id:"/drafts",id?"PATCH":"POST",body);
  resetDraftEditor();await loadDrafts();
 });b.disabled=false;
});
(async()=>{
 try{
  const data=await api("/status");
  state.fleet=data;state.ready=data.schema_ready===true;state.paused=data.execution_paused===true;
   state.canGod=data.permissions?.can_control===true;
    state.canApprove=data.permissions?.can_approve===true;
   document.querySelectorAll("[data-chaos-god-only]").forEach(el=>{el.hidden=!state.canGod;});
    document.querySelectorAll("[data-chaos-approval-access]").forEach(el=>{el.hidden=!state.canApprove;});
  $("chaos-agent-count").textContent=String(data.agents.length);
  $("chaos-qa-count").textContent=String(data.arcade.length);
  $("chaos-forum-count").textContent=data.forums_loaded?String(data.forums.length):"—";
  renderCards($("chaos-registry"),data.agents,"Chaos");
  renderCards($("chaos-qa-registry"),data.arcade,"QA");
  renderCards($("chaos-forum-registry"),data.forums,"Forum");
  $("chaos-qa-link").href=data.qa_workflow;
  root.hidden=false;refreshAssignee();refreshDraftAssignee();refreshMaster();
  try{state.sources=(await api("/sources")).sources||[];refreshSource()}catch{}
  if(!state.ready){lockForms();message("Staff authorized. Fleet registry online; controls require D1 migrations 0142 and 0143.");return}
  message(state.paused?"Staff authorized. Osiris execution lock is active.":(state.canGod?"Osiris controls online. Publishing is locked.":(state.canApprove?"Isis approvals available. Osiris master controls remain locked.":"Admin command deck online. Royal draft approval and master controls are restricted.")));
  await Promise.allSettled([loadMissions(),loadDrafts(),loadEvents()]);
 }catch(error){
  $("chaos-denied").hidden=false;message(error.message);
 }
})();
})();