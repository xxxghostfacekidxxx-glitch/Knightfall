(()=>{'use strict';
const API='https://api.ash-fall.com/api/ai-handoff';
const $=id=>document.getElementById(id);
const state={role:null,partner:null,tasks:[],notes:[],activity:[],instructions:''};
const status=text=>{$('handoff-status').textContent=String(text)};
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
 try{
  const data=await api();
  if(data.role==='invited'){gate("You've been invited","Ronnie has invited you to share his Knightfall to-do list and AI handoff notes. Accept to join.",'accept');status('Invitation awaiting your acceptance.');return}
  Object.assign(state,data);
  render();if(!quiet)status('Connected. Your shared list is up to date.');
 }catch(e){
  const sign=e.code===401;
  gate(sign?'Sign in required':'Private access',e.message,sign?'signin':'denied');
  status(sign?'Sign in to access the handoff.':e.message);
 }
}
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
