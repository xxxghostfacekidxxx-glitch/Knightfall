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
async function loadQuotaGuardian(){
 if(!state.canGod)return;
 const status=$("chaos-quota-state"),summary=$("chaos-quota-summary"),limits=$("chaos-quota-limits"),services=$("chaos-quota-services");
 status.textContent="Reading private diagnostics…";
 try{
  const response=await fetch("https://api.ash-fall.com/api/admin/quota-guardian",{credentials:"include",cache:"no-store",headers:{accept:"application/json"}});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(data.error||"Diagnostics unavailable ("+response.status+").");
  summary.replaceChildren();limits.replaceChildren();services.replaceChildren();
  const diagnostics=data.local_diagnostics||{};
  for(const [label,value] of [["Active and expired counters",diagnostics.rate_limit_counter_rows],["Expired counters",diagnostics.expired_rate_limit_counter_rows],["Cleanup batch size",diagnostics.rate_limit_cleanup_batch_size]]){
   const card=node("article","chaos-card");card.append(node("strong","",value??"Unknown"),node("p","",label));summary.append(card);
  }
  const traffic=data.worker_traffic||{};
  if(traffic.available){
   for(const [label,value] of [["Worker requests today",traffic.requests],["Worker errors today",traffic.errors],["Worker subrequests today",traffic.subrequests]]){
    const card=node("article","chaos-card");card.append(node("strong","",Number(value||0).toLocaleString()),node("p","",label));summary.append(card);
   }
   const allowance=Number(data.free_tier_reference?.worker_requests_daily||0);
   if(allowance>0){
    const ratio=Number(traffic.requests||0)/allowance;
    const card=node("article","chaos-card");
    card.append(node("strong","",Math.round(ratio*100)+"%"),node("p","",ratio>=.9?"Critical: API Worker approaching free daily request reference":ratio>=.7?"Warning: API Worker above 70% of daily request reference":"API Worker daily request reference usage"));
    summary.append(card);
   }
  }else{
   const card=node("article","chaos-card");card.append(node("strong","","Not connected"),node("p","",traffic.reason||"Live Worker telemetry unavailable"));summary.append(card);
  }
  for(const [key,value] of Object.entries(data.free_tier_reference||{})){
   const card=node("article","chaos-agent");card.append(node("h3","",key.replaceAll("_"," ")),node("p","",Number(value).toLocaleString()+" daily allowance"));limits.append(card);
  }
  for(const [key,enabled] of Object.entries(data.configured_services||{})){
   const card=node("article","chaos-agent");card.append(node("h3","",key.replaceAll("_"," ")),node("p","",enabled?"Binding configured":"Not configured"));services.append(card);
  }
  status.textContent="D1 diagnostics updated "+new Date(data.collected_at).toLocaleString()+". "+(data.provider_usage_note||"Account usage unavailable.");
 }catch(error){status.textContent="Quota Guardian unavailable: "+error.message;}
}
async function loadKnowledge(){
 const status=$("knowledge-status"),totals=$("knowledge-totals"),candidates=$("knowledge-candidates"),runs=$("knowledge-runs");
 status.textContent="Reading archive evidence…";
 try{const d=await api("/knowledge");totals.replaceChildren();candidates.replaceChildren();runs.replaceChildren();
 const roster=$("knowledge-roster"),tools=$("knowledge-tools");roster.replaceChildren();tools.replaceChildren();for(const r of d.divisions||[]){const card=node("article","chaos-agent");card.append(node("h3","",r.name),node("p","",r.divisionName),node("p","",r.topics.join(" · ")));roster.append(card);}for(const t of d.tools||[]){const card=node("article","chaos-mission");card.append(node("h3","",t.title),node("p","",t.source+" · declared license: "+t.declared_license+" · "+t.review_status),node("p","",t.source_url));if(state.canApprove&&t.review_status==="pending"){for(const decision of ["approved","rejected"]){const b=node("button","",decision==="approved"?"Approve for evaluation":"Reject");b.type="button";b.addEventListener("click",async()=>{if(!confirm("Record tool review? This never installs or executes software."))return;b.disabled=true;try{await api("/knowledge/tools/review","POST",{tool_id:t.tool_id,decision});await loadKnowledge();}catch(e){status.textContent=e.message;b.disabled=false;}});card.append(b);}}tools.append(card);}if(!(d.tools||[]).length)tools.append(node("p","chaos-empty","No tool discoveries yet."));
 status.textContent=(d.active?"Collection enabled":"Collection paused")+" · "+d.roster+" Order of the 66 specialists · "+d.cron+" UTC · "+d.training;
 for(const key of ["pending","approved","rejected"]){const card=node("article","chaos-card");card.append(node("strong","",d.totals.find(x=>x.review_status===key)?.count??0),node("p","",key));totals.append(card);}
 for(const r of d.candidates){const card=node("article","chaos-mission");card.append(node("h3","",r.title),node("p","",r.description),node("p","",r.agent_key+" · "+r.license));const a=node("a","","Inspect source");a.href="https://www.wikidata.org/wiki/"+encodeURIComponent(r.entity_id);a.target="_blank";a.rel="noopener noreferrer";card.append(a);if(state.canApprove){for(const decision of ["approved","rejected"]){const b=node("button","",decision==="approved"?"Approve candidate":"Reject candidate");b.type="button";b.addEventListener("click",async()=>{if(!confirm(decision==="approved"?"Confirm you inspected the source and approve this metadata for training review?":"Reject this candidate?"))return;b.disabled=true;try{await api("/knowledge/review","POST",{entity_id:r.entity_id,decision});await loadKnowledge();}catch(e){status.textContent=e.message;b.disabled=false;}});card.append(b);}}candidates.append(card);}
 if(!d.candidates.length)candidates.append(node("p","chaos-empty","No pending candidates."));
 for(const r of d.latest){const card=node("article","chaos-mission");card.append(node("strong","",r.agent_key+" · "+r.status),node("p","",r.query+" · "+r.found+" new candidates · "+fmtTime(r.started_at)));runs.append(card);}
 if(!d.latest.length)runs.append(node("p","chaos-empty","No recorded runs. Scheduler execution not yet verified."));
 }catch(e){status.textContent=e.message;}
}
$("knowledge-refresh")?.addEventListener("click",loadKnowledge);
$("knowledge-export")?.addEventListener("click",async()=>{if(!state.canGod)return;try{const data=await api("/knowledge/export"),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));const a=node("a");a.href=url;a.download="miss-chaos-reviewed-cc0.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){$("knowledge-status").textContent=e.message;}});

function openSection(name){
 if(name==="knowledge")void loadKnowledge();
 if(name==="quota"&&!state.canGod)return;
 const section=document.querySelector('.chaos-panel[data-panel="'+name+'"]');
 if(!section)return;
 for(const el of document.querySelectorAll(".chaos-panel"))el.hidden=el!==section;
 for(const b of document.querySelectorAll(".chaos-tabs button")){if(b.dataset.section===name)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");}
 state.section=name;
 if(name==="missions")loadMissions();
 if(name==="approvals")loadDrafts();
 if(name==="history")loadEvents();
 if(name==="qa")loadQA();
 if(name==="identity-qa")loadIdentityQA();
 if(name==="quota"&&state.canGod)loadQuotaGuardian();
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
async function loadIdentityQA(){
 const status=$("identity-qa-state"),results=$("identity-qa-results"),workers=$("identity-qa-workers");
 status.textContent="Reading GitHub identity QA evidence…";results.replaceChildren();
 try{
  const data=await api("/identity-qa");workers.replaceChildren();
  for(const worker of data.workers||[]){const card=node("article","chaos-agent");card.append(node("h3","",worker.name),node("p","",worker.scope));workers.append(card)}
  if(!data.verified){status.textContent=data.message||"Unverified.";return}
  const run=data.run;status.textContent="Run #"+run.id+" · "+run.status+" · "+(run.conclusion||"not concluded")+" · "+String(run.sha||"").slice(0,8);
  if(!data.jobs_verified){results.append(node("p","chaos-empty","Individual jobs unavailable; no verification claimed."));return}
  for(const job of data.jobs){
   const card=node("article","chaos-mission"),label=job.conclusion==="success"?"Passed":job.conclusion==="skipped"?"Not run / skipped":job.conclusion||job.status||"unknown";
   card.append(node("h4","",job.name),node("p","",job.scope),node("strong","",label));
   if(job.url?.startsWith("https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/")){const link=node("a","","View job evidence");link.href=job.url;link.target="_blank";link.rel="noopener noreferrer";card.append(link)}
   results.append(card);
  }
 }catch(error){status.textContent="Identity QA unavailable: "+error.message}
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
$("identity-qa-refresh").addEventListener("click",loadIdentityQA);
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
$("chaos-quota-refresh")?.addEventListener("click",loadQuotaGuardian);
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