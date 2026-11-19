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
function field(name,value){const container=elem('span','task-meta',name+': '+value);return container}
function renderTasks(){
 const list=$('task-list');list.replaceChildren();
 const open=state.tasks.filter(t=>t.status!=='done').length;
 $('task-count').textContent='('+open+' open / '+state.tasks.length+' total)';
 if(!state.tasks.length){list.append(elem('p','empty','Nothing on the list yet. That is either impressive or extremely suspicious.'));return}
 for(const task of state.tasks){
  const box=elem('article','task '+(task.status==='done'?'done':''));
  const text=elem('div');
  text.append(elem('h3','',task.title),elem('div','priority '+task.priority,task.priority+' priority'));
  if(task.details)text.append(elem('p','task-details',task.details));
  const foot=elem('div','task-footer');
  foot.append(field('Updated',task.updated_at||task.created_at),field('Revision',task.version));
  text.append(foot);
  const controls=elem('div','task-controls');
  const select=elem('select');
  select.setAttribute('aria-label','Status for '+task.title);
  [['todo','To do'],['in_progress','In progress'],['done','Done']].forEach(([v,label])=>{const option=elem('option','',label);option.value=v;select.append(option)});
  select.value=task.status;
  select.addEventListener('change',async()=>{
   select.disabled=true;
   try{await api('/tasks/'+task.id,'PATCH',{status:select.value,version:task.version});await load(true);status('Task status updated for both collaborators.')}
   catch(e){status(e.message);await load(true)}
   finally{select.disabled=false}
  });
  controls.append(select);
  controls.append(button('Edit',()=>editTask(task)));
  if(state.role==='owner')controls.append(button('Archive',()=>archiveTask(task),'handoff-button danger'));
  box.append(text,controls);list.append(box);
 }
}
async function editTask(task){
 // Browser prompts keep edits short without layering an oversized modal over mobile screens.
 const title=prompt('Task title',task.title);if(title===null)return;
 const details=prompt('Task details',task.details||'');if(details===null)return;
 const priority=prompt('Priority: high / normal / low',task.priority);if(priority===null)return;
 try{await api('/tasks/'+task.id,'PATCH',{title,details,priority:priority.trim().toLowerCase(),version:task.version});status('Task updated.');await load(true)}
 catch(e){status(e.message);await load(true)}
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
 if(document.activeElement?.closest?.('#task-list'))return;
 load(true);
},20000);
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
 try{await api('/tasks','POST',{title,details,priority});$('task-form').reset();status('New task added to the shared list.');await load(true)}catch(e){status(e.message)}
});
$('note-form').addEventListener('submit',async event=>{
 event.preventDefault();const body=$('note-body').value.trim(),category=$('note-type').value;
 try{await api('/notes','POST',{body,category});$('note-form').reset();status('Handoff note saved for both accounts.');await load(true)}catch(e){status(e.message)}
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.role&&state.role!=='invited')load(true)});
load();
})();
