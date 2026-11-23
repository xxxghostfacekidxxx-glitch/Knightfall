(()=>{'use strict';
const API='https://api.ash-fall.com/api/ai-handoff';
const $=id=>document.getElementById(id);
const state={role:null,partner:null,tasks:[],notes:[],activity:[],instructions:'',fingerprint:''};
const live={loading:false,loadedKeys:false};
const SCHEMA='https://ash-fall.com/ai-bridge-openapi.json';
const GUIDE=[
 'BETWEEN THE FLAMES · PRIVATE KNIGHTFALL AI HANDOFF',
 'You assist either Ronnie or Samantha with the shared Knightfall project. Both accounts use the same authenticated shared tasks and notes.',
 'Use the configured Knightfall GPT Action getHandoffSnapshot before planning Knightfall work or discussing task progress. Treat the newest results as the source of truth, not earlier messages.',
 'After a confirmed change, call updateHandoffTask with its exact version, createHandoffTask for new work, or postHandoffNote for a concise decision, milestone or blocker. Do not claim a task is done without verification, and do not claim a write was saved unless the API succeeded.',
 'If an action is unavailable or returns an error, say so and ask the person to update Between the Flames manually or paste the latest packet. Never pretend two separate ChatGPT chats are synced if the Action is not connected.',
 'Keep unrelated personal or sensitive information out of the shared project board. Do not reveal authentication secrets or publish private records.',
 'This shared master backlog includes workstreams, verification level, a source URL, a concrete next step and blockers for each task. A source file is not evidence of functional deployment; distinguish CI, production and physical Android acceptance.',
 'For art and games, Creator Foundry (https://ash-fall.com/devil-tools.html) is the built-in workshop. Its Creator Production Lab (#production-workbench) contains native Pixel Studio (sprite drawing and frames), Atlas Packer (spritesheet/JSON) and Tilemap Forge (tile level painting/export).',
 'Open-Source Research (https://ash-fall.com/devil-tools.html#open-source-reference) is the integrated Foundry catalog for free tools, game/source references and art workflows. Links to third-party sources are not installed features; check license and attribution before integrating.',
 'Help Samantha with simple, practical explanations: which page/tool to open, what to create or inspect, how to test it, and what to record in the shared to-do notes. Never invent code changes or completed work.',
 'For Samantha: Ronnie says he loves you.'
].join('\n\n');
const status=text=>{$('handoff-status').textContent=String(text)};
const stamp=()=>new Date().toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
const writeClipboard=async value=>{
 if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable. Select and copy the text manually.');
 await navigator.clipboard.writeText(value);
};
const elem=(tag,cls,content)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(content!==undefined)node.textContent=String(content);return node};
const button=(label,callback,cls='handoff-button ghost')=>{const b=elem('button',cls,label);b.type='button';b.addEventListener('click',callback);return b};
async function api(path='',method='GET',data){
 const options={method,credentials:'include',cache:'no-store',headers:{accept:'application/json'}};
 if(method!=='GET'&&method!=='DELETE'){options.headers['content-type']='application/json';options.body=JSON.stringify(data||{})}
 const r=await fetch(API+path,options);
 const out=await r.json().catch(()=>({}));
 if(!r.ok){const e=new Error(out.error||'Request failed ('+r.status+').');e.code=out.code||r.status;throw e}
 return out;
}
function gate(title,description,mode){
 $('handoff-app').hidden=true;$('handoff-gate').hidden=false;
 $('gate-title').textContent=title;$('gate-detail').textContent=description;
 $('gate-accept').hidden=mode!=='accept';$('gate-signin').hidden=mode==='accept';
}
function field(name,value){return elem('span','task-meta',name+': '+value)}
const filters={area:'all',status:'open',priority:'all',verification:'all',query:'',limit:24};
const verifiedLabels={needs_review:'Needs review',source_checked:'Source checked',ci_passed:'CI passed',deployed:'Deployed',device_verified:'Device verified'};
const priorities={high:0,normal:1,low:2};
// Ready is a presentation stage, not a new API status: D1 permits todo/in_progress/done only.
const isReadyToVerify=t=>t.status==='in_progress'&&/^READY FOR VERIFICATION\b/i.test(String(t.next_step||''));
const workstreamCounts=()=>state.tasks.reduce((map,t)=>{const area=t.area||'General';if(!map[area])map[area]={total:0,open:0,high:0,blocked:0};const a=map[area];a.total++;if(t.status!=='done')a.open++;if(t.priority==='high'&&t.status!=='done')a.high++;if(t.blocker&&t.status!=='done')a.blocked++;return map},{});
function syncWorkstreams(groups){
 const options=Object.keys(groups).sort((a,b)=>a.localeCompare(b));
 const signature=options.join('|');
 for(const [id,first] of [['filter-area','All workstreams'],['task-area','General']]){
  const select=$(id);if(select.dataset.signature===signature)return;
  const prev=select.value;
  select.replaceChildren();
  const initial=elem('option','',first);initial.value=id==='filter-area'?'all':'General';select.append(initial);
  for(const area of options){if(id==='task-area'&&area==='General')continue;const o=elem('option','',area);o.value=area;select.append(o)}
  select.value=[...select.options].some(x=>x.value===prev)?prev:initial.value;
  select.dataset.signature=signature;
 }
}
function metric(label,value,emphasis=''){
 const card=elem('div','task-metric '+emphasis);
 card.append(elem('strong','',value),elem('span','',label));return card;
}
function renderTaskOverview(groups){
 const total=state.tasks.length,done=state.tasks.filter(t=>t.status==='done').length;
 const underway=state.tasks.filter(t=>t.status==='in_progress'&&!isReadyToVerify(t)).length;
 const ready=state.tasks.filter(isReadyToVerify).length;
 const blocked=state.tasks.filter(t=>t.status!=='done'&&t.blocker).length;
 const urgent=state.tasks.filter(t=>t.status!=='done'&&t.priority==='high').length;
 const needsReview=state.tasks.filter(t=>t.verification==='needs_review'||!t.verification).length;
 $('task-count').textContent='('+Math.max(0,total-done)+' open / '+total+' total)';
 $('task-metrics').replaceChildren(metric('Total tasks',total),metric('High priority open',urgent,'urgent'),metric('In progress',underway),metric('Ready to verify',ready),metric('Blocked / dependent',blocked,'blocked'),metric('Completed',done),metric('Needs verification',needsReview));
 const work=$('workstream-summary');work.replaceChildren();
 const entries=Object.entries(groups).sort((a,b)=>b[1].high-a[1].high||b[1].open-a[1].open||a[0].localeCompare(b[0]));
 for(const [area,c] of entries){
  const b=button(area+' · '+c.open+' open',()=>{}, 'workstream-chip'+(filters.area===area?' selected':''));
  b.addEventListener('click',()=>{
   filters.area=filters.area===area?'all':area;
   filters.limit=24;$('filter-area').value=filters.area;renderTasks();
  });
  work.append(b);
 }
}
function sourceLink(source){
 if(!source)return null;
 try{
  const url=new URL(source);
  if(url.protocol!=='https:'||!(url.hostname==='ash-fall.com'||url.hostname==='www.ash-fall.com'||url.hostname==='github.com'&&url.pathname.startsWith('/xxxghostfacekidxxx-glitch/Knightfall/')))return null;
  const a=elem('a','task-source','View supporting source ↗');
  a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';return a;
 }catch{return null}
}
function matchesFilters(t){
 if(filters.area!=='all'&&(t.area||'General')!==filters.area)return false;
 if(filters.status==='open'&&t.status==='done')return false;
 if(filters.status==='ready'&&!isReadyToVerify(t))return false;
 if(filters.status==='in_progress'&&isReadyToVerify(t))return false;
 if(filters.status==='blocked'&&(!t.blocker||t.status==='done'))return false;
 if(['todo','done'].includes(filters.status)&&t.status!==filters.status)return false;
 if(filters.status==='in_progress'&&t.status!=='in_progress')return false;
 if(filters.priority!=='all'&&t.priority!==filters.priority)return false;
 if(filters.verification!=='all'&&(t.verification||'needs_review')!==filters.verification)return false;
 if(filters.query){
  const content=[t.title,t.details,t.area,t.next_step,t.blocker,t.source_url].join(' ').toLowerCase();
  if(!content.includes(filters.query))return false;
 }
 return true;
}
function renderTasks(){
 const groups=workstreamCounts();
 syncWorkstreams(groups);renderTaskOverview(groups);
 const list=$('task-list');list.replaceChildren();
 const readyList=$('task-ready-list');readyList.replaceChildren();
 const readySection=$('task-ready-section');
 const matching=state.tasks.filter(matchesFilters).sort((a,b)=>
  (a.status==='done'?1:0)-(b.status==='done'?1:0)||
  (priorities[a.priority]??1)-(priorities[b.priority]??1)||
  (a.status==='in_progress'?-1:0)-(b.status==='in_progress'?-1:0)||
  (a.blocker?0:1)-(b.blocker?0:1)||
  (a.area||'General').localeCompare(b.area||'General')||a.id-b.id
 );
 const readyTasks=matching.filter(isReadyToVerify);
 const regularTasks=matching.filter(t=>!isReadyToVerify(t));
 readySection.hidden=!readyTasks.length;
 $('task-ready-count').textContent=readyTasks.length+' awaiting acceptance';
 $('task-filter-count').textContent='Showing '+(Math.min(filters.limit,regularTasks.length)+readyTasks.length)+' of '+matching.length+' matching tasks · '+Object.keys(groups).length+' workstreams. Open an item to see evidence, blockers and next actions.';
 const more=$('more-tasks');more.hidden=regularTasks.length<=filters.limit;
 more.textContent='Show more tasks ('+(regularTasks.length-filters.limit)+' remaining)';
 if(!matching.length){list.append(elem('p','empty','No tasks match these filters. Clear the filters or try another workstream.'));return}
 if(!regularTasks.length)list.append(elem('p','empty','All matching tasks are awaiting verification above.'));
 for(const task of [...readyTasks,...regularTasks.slice(0,filters.limit)]){
  const box=elem('article','task '+(task.status==='done'?'done':''));
  const content=elem('div','task-content');
  const header=elem('div','task-titlebar');
  header.append(elem('h3','',task.title),elem('span','workstream-tag',task.area||'General'));
  content.append(header);
  const chips=elem('div','task-tags');
  chips.append(elem('span','priority '+task.priority,task.priority+' priority'));
  chips.append(elem('span','task-verification',verifiedLabels[task.verification]||'Needs review'));
  if(task.blocker&&task.status!=='done')chips.append(elem('span','task-blocked-tag','Blocked / dependent'));
  content.append(chips);
  if(task.details)content.append(elem('p','task-details',task.details));
  if(task.next_step){
   const step=elem('p','task-next');step.append(elem('strong','','Next: '),document.createTextNode(task.next_step));content.append(step);
  }
  if(task.blocker){
   const block=elem('p','task-blocker');block.append(elem('strong','','Dependency: '),document.createTextNode(task.blocker));content.append(block);
  }
  const src=sourceLink(task.source_url);if(src)content.append(src);
  const foot=elem('div','task-footer');
  foot.append(field('Updated',task.updated_at||task.created_at),field('Revision',task.version));
  content.append(foot);
  const controls=elem('div','task-controls');
  const select=elem('select');
  select.setAttribute('aria-label','Status for '+task.title);
  [['todo','To do'],['in_progress','In progress'],['done','Done']].forEach(([v,label])=>{const o=elem('option','',label);o.value=v;select.append(o)});
  select.value=task.status;
  select.addEventListener('change',async()=>{
   select.disabled=true;
   try{await api('/tasks/'+task.id,'PATCH',{status:select.value,version:task.version});await load(true);status('Task status updated for both collaborators.')}
   catch(e){status(e.message);await load(true)}
   finally{select.disabled=false}
  });
  controls.append(select);
  controls.append(button('Edit details',()=>editTask(task,box)));
  if(state.role==='owner')controls.append(button('Archive',()=>archiveTask(task),'handoff-button danger'));
  box.append(content,controls);(isReadyToVerify(task)?readyList:list).append(box);
 }
}
function editTask(task,box){
 const old=box.querySelector('.task-editor');if(old){old.remove();return}
 const form=elem('form','task-editor');form.setAttribute('aria-label','Edit '+task.title);
 const inputField=(name,labelText,value,max=600,kind='input')=>{
  const label=elem('label','',labelText);
  const input=elem(kind==='textarea'?'textarea':'input','');
  input.name=name;input.value=value||'';input.maxLength=max;
  if(kind==='textarea')input.rows=name==='details'?3:2;
  if(name==='title')input.required=true;
  label.append(input);form.append(label);return input;
 };
 const selectField=(name,labelText,value,options)=>{
  const label=elem('label','',labelText),sel=elem('select');sel.name=name;
  for(const [v,title] of options){const opt=elem('option','',title);opt.value=v;sel.append(opt)}
  sel.value=value;label.append(sel);form.append(label);return sel;
 };
 const titleInput=inputField('title','Task title',task.title,180);
 inputField('details','Context / details',task.details,3000,'textarea');
 inputField('area','Workstream',task.area||'General',56);
 selectField('priority','Priority',task.priority,[['high','High'],['normal','Normal'],['low','Low']]);
 selectField('verification','Evidence level',task.verification||'needs_review',Object.entries(verifiedLabels));
 inputField('next_step','Concrete next action',task.next_step,600,'textarea');
 inputField('blocker','Dependency or blocker (leave empty if none)',task.blocker,600,'textarea');
 inputField('source_url','Source URL (Knightfall/GitHub only)',task.source_url,500);
 const actions=elem('div','handoff-actions');
 const save=elem('button','handoff-button','Save changes');save.type='submit';
 actions.append(save,button('Cancel',()=>form.remove(),'handoff-button ghost'));form.append(actions);
 form.addEventListener('submit',async e=>{
  e.preventDefault();save.disabled=true;
  const data=Object.fromEntries(new FormData(form).entries());
  data.version=task.version;data.title=data.title.trim();data.area=data.area.trim();
  try{await api('/tasks/'+task.id,'PATCH',data);status('Project task and next steps updated for both collaborators.');await load(true)}
  catch(err){status('Task could not be saved: '+err.message);save.disabled=false;}
 });
 box.append(form);titleInput.focus();
}
async function archiveTask(task){
 if(!confirm('Archive "'+task.title+'"? It will disappear from the active list.'))return;
 try{await api('/tasks/'+task.id,'DELETE');status('Task archived.');await load(true)}catch(e){status(e.message)}
}
function renderNotes(){
 const list=$('note-list');list.replaceChildren();
 if(!state.notes.length){list.append(elem('p','empty','No handoff notes yet.'));return}
 for(const note of state.notes){
  const card=elem('article','note');
  const header=elem('div');header.append(elem('strong','',note.author||'Member'),elem('span','tag',note.category),elem('br'),elem('small','',note.created_at));
  card.append(header,elem('p','body',note.body));list.append(card)
 }
}
function renderActivity(){
 const list=$('activity-list');list.replaceChildren();
 if(!state.activity.length){list.append(elem('p','empty','No changes recorded yet.'));return}
 state.activity.forEach(entry=>{const article=elem('div','activity');article.append(elem('strong','',entry.actor+' '+entry.action+' task #'+entry.task_id),elem('p','',entry.snapshot),elem('small','',entry.created_at));list.append(article)})
}
function renderAccess(){
 const owner=state.role==='owner';
 $('invite-controls').hidden=!owner;
 const partner=state.partner;
 $('partner-summary').textContent=partner?(partner.display_name||partner.username)+' (@'+partner.username+') · '+(partner.status==='accepted'?'Access active':'Invitation awaiting acceptance'):'Only Ronnie can invite one partner. No one else can read the shared list.';
 $('revoke-partner').hidden=!owner||!partner;
 $('invite-form').hidden=!owner||!!(partner&&partner.status==='accepted');
}
function render(){
 $('handoff-gate').hidden=true;$('handoff-app').hidden=false;
 $('handoff-instructions').textContent=state.instructions;
 renderTasks();renderNotes();renderActivity();renderAccess();
}
async function load(quiet=false){
 if(live.loading)return;
 live.loading=true;
 try{
  const data=await api();
  if(data.role==='invited'){gate("You've been invited","Ronnie has invited you to share his Knightfall to-do list and AI handoff notes. Accept to join.",'accept');status('Invitation awaiting your acceptance.');return}
  const next=JSON.stringify([data.tasks?.map(t=>[t.id,t.version,t.status]),data.notes?.map(n=>n.id),data.activity?.map(e=>e.id)]);
  const changed=!!state.fingerprint&&next!==state.fingerprint;
  Object.assign(state,data);
  state.fingerprint=next;
  render();
  $('live-sync-status').textContent='Automatic refresh enabled · checked '+stamp()+' · every 20 seconds while this tab is open';
  if(changed&&quiet)status('The shared workspace has new updates. Both accounts now see the latest records.');
  else if(!quiet)status('Connected. Your shared list is up to date.');
  if(!live.loadedKeys){live.loadedKeys=true;loadBridgeKeys().catch(error=>status(error.message));}
 }catch(e){
  const sign=e.code===401;
  gate(sign?'Sign in required':'Private access',e.message,sign?'signin':'denied');
  $('live-sync-status').textContent='Automatic refresh unavailable until signed in.';
  status(sign?'Sign in to access the handoff.':e.message);
 }finally{live.loading=false}
}
async function loadBridgeKeys(){
 const data=await api('/bridge/keys');
 const list=$('bridge-key-list');
 list.replaceChildren();
 const keys=data.keys||[];
 if(!keys.length){list.append(elem('p','subtle','No AI connections yet. Your shared website list works already; create a key only when you can configure a private ChatGPT Action.'));return}
 for(const key of keys){
  const active=!key.revoked_at&&new Date(key.expires_at.replace(' ','T')+'Z').getTime()>Date.now();
  const card=elem('div','bridge-key-item');
  const info=elem('div');
  info.append(elem('strong','',key.label),elem('p','subtle',active?'Active · expires '+key.expires_at+' UTC'+(key.last_used_at?' · last used '+key.last_used_at+' UTC':' · never used'):'Revoked or expired · '+key.created_at+' UTC'));
  card.append(info);
  if(active)card.append(button('Revoke',async()=>{
   if(!confirm('Revoke the AI connection "'+key.label+'"? The assistant using this key will immediately lose access.'))return;
   try{await api('/bridge/keys/'+key.id,'DELETE');status('Connection revoked. That assistant can no longer access the shared list with this key.');await loadBridgeKeys()}
   catch(e){status('Could not revoke connection: '+e.message)}
  },'handoff-button danger'));
  list.append(card);
 }
}
$('bridge-key-form').addEventListener('submit',async event=>{
 event.preventDefault();
 const label=$('bridge-key-label').value.trim();
 const submit=event.currentTarget.querySelector('button[type=submit]');
 submit.disabled=true;
 try{
  const data=await api('/bridge/keys','POST',{label});
  $('bridge-secret').value=data.secret;
  $('bridge-secret-panel').hidden=false;
  $('bridge-key-form').reset();
  status('Private AI connection created for this account. Copy the key once into your private GPT Action authentication setting.');
  await loadBridgeKeys();
 }catch(e){status('Could not generate connection: '+e.message)}
 finally{submit.disabled=false}
});
$('copy-bridge-secret').addEventListener('click',async()=>{
 try{await writeClipboard($('bridge-secret').value);status('Private key copied. Paste it ONLY into your private Action authentication field.')}
 catch(e){status(e.message)}
});
$('hide-bridge-secret').addEventListener('click',()=>{
 $('bridge-secret').value='';
 $('bridge-secret-panel').hidden=true;
 status('Private key hidden from this page. It cannot be shown again; revoke and create a new one if lost.');
});
$('copy-schema-link').addEventListener('click',async()=>{
 try{await writeClipboard(SCHEMA);status('Action OpenAPI schema link copied. Import it into your private GPT Action configuration.')}
 catch(e){status(e.message)}
});
$('copy-bridge-guide').addEventListener('click',async()=>{
 try{await writeClipboard(GUIDE);status('Assistant instructions copied. Paste these into the assistant instructions, without adding your secret key.')}
 catch(e){status(e.message)}
});
window.setInterval(()=>{
 if(document.hidden||state.role!=='owner'&&state.role!=='partner'||live.loading)return;
 // Avoid interrupting active task status/edit controls while refreshing.
 if(document.activeElement?.closest?.('#task-list')||document.querySelector('.task-editor'))return;
 load(true);
},20000);
$('copy-mentor-guide').addEventListener('click',async()=>{
 try{await writeClipboard(state.instructions||GUIDE);status('Samantha GPT tool briefing copied, including Creator Foundry and Open Source Arsenal instructions.')}
 catch(e){status('Could not copy mentor guide: '+e.message)}
});
[['filter-area','area'],['filter-status','status'],['filter-priority','priority'],['filter-verification','verification']].forEach(([id,key])=>{
 $(id).addEventListener('change',()=>{filters[key]=$(id).value;filters.limit=24;renderTasks()});
});
$('filter-query').addEventListener('input',event=>{filters.query=String(event.target.value||'').trim().toLowerCase();filters.limit=24;renderTasks()});
$('more-tasks').addEventListener('click',()=>{filters.limit+=24;renderTasks()});
$('reset-task-filters').addEventListener('click',()=>{
 Object.assign(filters,{area:'all',status:'open',priority:'all',verification:'all',query:'',limit:24});
 $('filter-query').value='';$('filter-area').value='all';$('filter-status').value='open';
 $('filter-priority').value='all';$('filter-verification').value='all';renderTasks();
});
$('gate-accept').addEventListener('click',async()=>{try{await api('/accept','POST',{});await load()}catch(e){status(e.message)}});
$('copy-packet').addEventListener('click',async()=>{
 try{
  const data=await api('/packet');
  await navigator.clipboard.writeText(data.packet);
  status('Current AI handoff copied. Paste it into Samantha’s ChatGPT (or Ronnie’s) to share the latest snapshot.');
 }catch(e){status('Could not copy packet: '+e.message)}
});
$('refresh-all').addEventListener('click',()=>load());
$('invite-form').addEventListener('submit',async event=>{
 event.preventDefault();
 const username=$('invite-username').value.trim();
 try{const r=await api('/invite','POST',{username});status('Invitation created for @'+r.username+'. Have her sign in and open this page.');await load(true)}catch(e){status(e.message)}
});
$('revoke-partner').addEventListener('click',async()=>{
 if(!confirm('Revoke your partner’s access to this shared to-do list?'))return;
 try{await api('/invite','DELETE');status('Partner access revoked.');await load(true)}catch(e){status(e.message)}
});
$('task-form').addEventListener('submit',async event=>{
 event.preventDefault();const title=$('task-title').value.trim(),details=$('task-details').value.trim(),priority=$('task-priority').value;
 try{await api('/tasks','POST',{title,details,priority,area:$('task-area').value});$('task-form').reset();status('New task added to the shared list.');await load(true)}catch(e){status(e.message)}
});
$('note-form').addEventListener('submit',async event=>{
 event.preventDefault();const body=$('note-body').value.trim(),category=$('note-type').value;
 try{await api('/notes','POST',{body,category});$('note-form').reset();status('Handoff note saved for both accounts.');await load(true)}catch(e){status(e.message)}
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.role&&state.role!=='invited')load(true)});
load();
})();
