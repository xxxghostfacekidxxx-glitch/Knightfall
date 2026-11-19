// Private two-person coordination board for GOD and one invited, consenting Knightfall member.
import {handleAiHandoffBridge} from './ai-handoff-bridge.js';
// Browser collaboration plus optional user-configured, per-account GPT Action connections.
const PREFIX='/api/ai-handoff';
const ORIGINS=new Set(['https://ash-fall.com','https://www.ash-fall.com']);
const INSTRUCTIONS=[
 'TO SAMANTHA\u2019S CHATGPT: This is the Knightfall coordination handoff shared by Ronnie and Samantha.',
 'Read the newest handoff note and the current task list before proposing work. Treat the live task list as the source of truth, not earlier copies.',
 'After finishing work, discovering blockers, or changing a decision, keep the shared to-do list current: update task status and details using Samantha\u2019s authenticated Knightfall handoff page, or ask Samantha to make the update when direct access is unavailable.',
 'Add a dated handoff note describing what changed, what remains, and what needs Ronnie\u2019s attention. Do not claim an update occurred unless the site confirmed it.',
 'Only include project details Samantha and Ronnie choose to share. This is private to their authorized Knightfall accounts; do not publish the handoff elsewhere.',
 'And please tell Samantha this exact message: "Ronnie says he loves you."'
].join('\n\n');
const RESPONSE_HEADERS={'cache-control':'private, no-store'};
const goodText=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.trim().length<=max?v.trim():null;
const validStatus=v=>['todo','in_progress','done'].includes(v);
const validPriority=v=>['low','normal','high'].includes(v);
const event=(env,user,action,taskId,snapshot='')=>env.DB.prepare('INSERT INTO ai_handoff_events(actor_id,action,task_id,snapshot) VALUES(?,?,?,?)').bind(user.id,action,taskId,snapshot).run();
async function ready(env){
 const row=await env.DB.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name IN ('ai_handoff_partner','ai_handoff_tasks','ai_handoff_notes','ai_handoff_events')").first();
 return Number(row?.n)===4;
}
async function partner(env){return env.DB.prepare("SELECT p.user_id,p.status,p.invited_at,p.accepted_at,u.username,u.display_name FROM ai_handoff_partner p JOIN users u ON u.id=p.user_id WHERE p.slot=1").first();}
async function tasks(env){return (await env.DB.prepare("SELECT t.id,t.title,t.details,t.status,t.priority,t.version,t.created_at,t.updated_at,u.username AS updated_by FROM ai_handoff_tasks t LEFT JOIN users u ON u.id=t.updated_by WHERE t.deleted_at IS NULL ORDER BY CASE t.status WHEN 'todo' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END, CASE t.priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,t.updated_at DESC,t.id DESC LIMIT 200").all()).results||[];}
async function notes(env){return (await env.DB.prepare("SELECT n.id,n.body,n.category,n.created_at,u.username AS author FROM ai_handoff_notes n JOIN users u ON u.id=n.author_id ORDER BY n.id DESC LIMIT 60").all()).results||[];}
async function activity(env){return (await env.DB.prepare("SELECT e.id,e.action,e.task_id,e.snapshot,e.created_at,u.username AS actor FROM ai_handoff_events e JOIN users u ON u.id=e.actor_id ORDER BY e.id DESC LIMIT 35").all()).results||[];}
function packet(board){
 return [
  'KNIGHTFALL | RONNIE + SAMANTHA | SHARED AI HANDOFF',
  'Snapshot: '+new Date().toISOString(),
  'IMPORTANT: Re-read the authenticated handoff page for the newest changes before acting. A pasted copy is not live.',
  INSTRUCTIONS,
  'CURRENT TO-DO LIST:',
  ...board.tasks.map(t=>'#'+t.id+' ['+t.status+'] ('+t.priority+') '+t.title+(t.details?' | '+t.details:'')+' | revision '+t.version),
  'LATEST HANDOFF NOTES:',
  ...board.notes.slice(0,20).map(n=>n.created_at+' / '+n.author+' / '+n.category+': '+n.body),
  'End of handoff. Samantha, Ronnie says he loves you.'
 ].join('\n\n');
}
export async function handleAiHandoff(request,env,url,{getUser,json,origin,rateLimit}){
 if(!url.pathname.startsWith(PREFIX))return null;
 if(url.pathname.startsWith(PREFIX+'/bridge/'))return handleAiHandoffBridge(request,env,url,{getUser,json,origin,rateLimit});
 const respond=(body,status=200)=>{const response=json(body,status,origin);Object.entries(RESPONSE_HEADERS).forEach(([k,v])=>response.headers.set(k,v));return response;};
 const user=await getUser(request,env);
 if(!user)return respond({error:'Sign in to your Knightfall account.'},401);
 if(!await ready(env))return respond({error:'Shared handoff storage is awaiting its production D1 migration.'},503);
 const isGod=user.role==='god', invite=await partner(env);
 const isAccepted=!!invite&&invite.user_id===user.id&&invite.status==='accepted';
 const isPending=!!invite&&invite.user_id===user.id&&invite.status==='pending';
 const canRead=isGod||isAccepted;
 const path=url.pathname.slice(PREFIX.length)||'/';
 if(path==='/'&&request.method==='GET'){
   if(isPending)return respond({role:'invited',invitation:{by:'Ronnie',status:'pending'},message:'Accept the invitation to see the shared to-do list.'});
   if(!canRead)return respond({role:'unauthorized',error:'This is a private shared space. Ask Ronnie to invite your Knightfall username.'},403);
   return respond({role:isGod?'owner':'partner',partner:invite,confirmed_access:true,tasks:await tasks(env),notes:await notes(env),activity:await activity(env),instructions:INSTRUCTIONS,message:'Ronnie says he loves you.'});
 }
 if(path==='/packet'&&request.method==='GET'){
   if(!canRead)return respond({error:'Private handoff access required.'},403);
   const board={tasks:await tasks(env),notes:await notes(env)};
   return respond({...board,packet:packet(board),instructions:INSTRUCTIONS,generated_at:new Date().toISOString()});
 }
 if(!['POST','PATCH','DELETE'].includes(request.method))return respond({error:'Unsupported method.'},405);
 if(!ORIGINS.has(request.headers.get('Origin')))return respond({error:'Use the signed-in Knightfall page.'},403);
 if(!await rateLimit(env,request,'ai-handoff-write',40,60,user.id))return respond({error:'Too many changes. Try again shortly.'},429);
 let body={};
 if(request.method!=='DELETE'){
   if(!String(request.headers.get('content-type')||'').startsWith('application/json'))return respond({error:'JSON required.'},415);
   try{body=await request.json();}catch{return respond({error:'Invalid JSON.'},400);}
   if(!body||typeof body!=='object'||Array.isArray(body))return respond({error:'Invalid request.'},400);
 }
 if(path==='/accept'&&request.method==='POST'){
   if(!isPending)return respond({error:'No pending invitation for this account.'},403);
   const change=await env.DB.prepare("UPDATE ai_handoff_partner SET status='accepted',accepted_at=CURRENT_TIMESTAMP WHERE slot=1 AND user_id=? AND status='pending'").bind(user.id).run();
   return Number(change.meta?.changes||0)?respond({ok:true,role:'partner'}):respond({error:'Invitation changed. Refresh.'},409);
 }
 if(path==='/invite'&&request.method==='POST'){
   if(!isGod)return respond({error:'Only Ronnie can invite a partner.'},403);
   const username=goodText(body.username,40);
   if(!username||!(/^[a-zA-Z0-9_.-]{2,40}$/).test(username))return respond({error:'Enter her exact Knightfall username.'},400);
   const target=await env.DB.prepare("SELECT id,username FROM users WHERE lower(username)=lower(?) AND status='active' LIMIT 1").bind(username).first();
   if(!target||target.id===user.id)return respond({error:'Choose another active Knightfall account.'},400);
   if(invite&&invite.status==='accepted'&&invite.user_id!==target.id)return respond({error:'Revoke the existing partner before inviting someone else.'},409);
   await env.DB.prepare("INSERT INTO ai_handoff_partner(slot,user_id,invited_by,status,invited_at,accepted_at) VALUES(1,?,?,'pending',CURRENT_TIMESTAMP,NULL) ON CONFLICT(slot) DO UPDATE SET user_id=excluded.user_id,invited_by=excluded.invited_by,status='pending',invited_at=CURRENT_TIMESTAMP,accepted_at=NULL").bind(target.id,user.id).run();
   return respond({ok:true,username:target.username,status:'pending'});
 }
 if(path==='/invite'&&request.method==='DELETE'){
   if(!isGod)return respond({error:'Only Ronnie can revoke access.'},403);
   await env.DB.prepare('DELETE FROM ai_handoff_partner WHERE slot=1').run();
   return respond({ok:true});
 }
 if(!canRead)return respond({error:'Accept your invitation to access this list.'},403);
 if(path==='/tasks'&&request.method==='POST'){
   const title=goodText(body.title,180),details=typeof body.details==='string'?body.details.trim():'';
   const status=body.status||'todo',priority=body.priority||'normal';
   if(!title||details.length>3000||!validStatus(status)||!validPriority(priority))return respond({error:'Check task title, details, status and priority.'},400);
   const count=await env.DB.prepare("SELECT COUNT(*) AS n FROM ai_handoff_tasks WHERE deleted_at IS NULL").first();
   if(Number(count?.n)>=200)return respond({error:'Task limit reached. Archive completed tasks first.'},409);
   const task=await env.DB.prepare("INSERT INTO ai_handoff_tasks(title,details,status,priority,created_by,updated_by) VALUES(?,?,?,?,?,?) RETURNING *").bind(title,details,status,priority,user.id,user.id).first();
   await event(env,user,'created',task.id,task.title);
   return respond({task},201);
 }
 if(path==='/notes'&&request.method==='POST'){
   const value=goodText(body.body,4000),category=body.category||'update';
   if(!value||!['update','decision','blocker'].includes(category))return respond({error:'Enter a note (max 4,000 characters) and category.'},400);
   const note=await env.DB.prepare("INSERT INTO ai_handoff_notes(body,category,author_id) VALUES(?,?,?) RETURNING id,body,category,created_at").bind(value,category,user.id).first();
   return respond({note},201);
 }
 const match=path.match(/^\/tasks\/(\d+)$/);
 if(match){
   const id=Number(match[1]);
   if(!Number.isSafeInteger(id)||id<1)return respond({error:'Invalid task.'},400);
   if(request.method==='DELETE'){
     if(!isGod)return respond({error:'Only Ronnie can archive tasks.'},403);
     const change=await env.DB.prepare("UPDATE ai_handoff_tasks SET deleted_at=CURRENT_TIMESTAMP,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND deleted_at IS NULL").bind(user.id,id).run();
     if(!Number(change.meta?.changes||0))return respond({error:'Task not found.'},404);
     await event(env,user,'archived',id);
     return respond({ok:true});
   }
   if(request.method==='PATCH'){
     const current=await env.DB.prepare('SELECT * FROM ai_handoff_tasks WHERE id=? AND deleted_at IS NULL').bind(id).first();
     if(!current)return respond({error:'Task not found.'},404);
     const version=Number(body.version);
     if(!Number.isSafeInteger(version)||version!==current.version)return respond({error:'Someone updated this task. Refresh before saving.',code:'VERSION_CONFLICT'},409);
     const title=body.title===undefined?current.title:goodText(body.title,180);
     const details=body.details===undefined?current.details:typeof body.details==='string'?body.details.trim():null;
     const status=body.status===undefined?current.status:body.status;
     const priority=body.priority===undefined?current.priority:body.priority;
     if(!title||details===null||details.length>3000||!validStatus(status)||!validPriority(priority))return respond({error:'Invalid task changes.'},400);
     const updated=await env.DB.prepare("UPDATE ai_handoff_tasks SET title=?,details=?,status=?,priority=?,version=version+1,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND version=? AND deleted_at IS NULL RETURNING *").bind(title,details,status,priority,user.id,id,version).first();
     if(!updated)return respond({error:'This task was updated elsewhere. Refresh.',code:'VERSION_CONFLICT'},409);
     await event(env,user,'updated',id,'status: '+current.status+' → '+status+' | '+title);
     return respond({task:updated});
   }
 }
 return respond({error:'Unknown handoff action.'},404);
}
