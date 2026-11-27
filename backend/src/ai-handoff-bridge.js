// Individually authorized ChatGPT/GPT Action bridge for the private Knightfall handoff.
// Browser session cookies manage keys; Bearer secrets are used only by remote assistants.
// No shared master key, no public reads, no hidden cross-account ChatGPT access.
const BASE='/api/ai-handoff/bridge';
const SITE_ORIGINS=new Set(['https://ash-fall.com','https://www.ash-fall.com']);
const good=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.trim().length<=max?v.trim():null;
const checkStatus=v=>['todo','in_progress','done'].includes(v);
const checkPriority=v=>['low','normal','high'].includes(v);
const checkVerification=v=>['needs_review','source_checked','ci_passed','deployed','device_verified'].includes(v);
const readExtra=(body,current={})=>{
 const area=body.area===undefined?(current.area||'General'):body.area;
 const verification=body.verification===undefined?(current.verification||'needs_review'):body.verification;
 const source_url=body.source_url===undefined?(current.source_url||''):body.source_url;
 const next_step=body.next_step===undefined?(current.next_step||''):body.next_step;
 const blocker=body.blocker===undefined?(current.blocker||''):body.blocker;
 if(typeof area!=='string'||!area.trim()||area.length>56||!checkVerification(verification)||
 typeof source_url!=='string'||source_url.length>500||
 typeof next_step!=='string'||next_step.length>600||typeof blocker!=='string'||blocker.length>600)return null;
 if(source_url){
  try{const url=new URL(source_url);if(url.protocol!=='https:'||!(url.hostname==='ash-fall.com'||url.hostname==='www.ash-fall.com'||url.hostname==='github.com'&&url.pathname.startsWith('/xxxghostfacekidxxx-glitch/Knightfall/')))return null}
  catch{return null}
 }
 return {area:area.trim(),verification,source_url,next_step:next_step.trim(),blocker:blocker.trim()};
};
const noStore={'cache-control':'private, no-store','referrer-policy':'no-referrer'};

function randomKey(){
 const bytes=new Uint8Array(32);
 crypto.getRandomValues(bytes);
 return 'kfai_'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
}
async function digest(secret){
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('knightfall-ai-handoff-v1:'+secret));
 return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
async function schemaReady(env){
 return !!await env.DB.prepare("SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name='ai_handoff_bridge_keys' LIMIT 1").first();
}
async function acceptedUser(env,user){
 if(!user||user.status!=='active')return false;
 if(user.role==='god')return true;
 const row=await env.DB.prepare("SELECT 1 AS ok FROM ai_handoff_partner WHERE slot=1 AND user_id=? AND status='accepted' LIMIT 1").bind(user.id).first();
 return !!row;
}
async function parseJson(request){
 if(!String(request.headers.get('content-type')||'').startsWith('application/json'))return null;
 if(Number(request.headers.get('content-length')||0)>8200)return null;
 try{
  const raw=await request.text();
  if(raw.length>8000)return null;
  const value=JSON.parse(raw);
  return value&&typeof value==='object'&&!Array.isArray(value)?value:null;
 }catch{return null;}
}
const activity=(env,user,action,taskId=null,snapshot='')=>env.DB.prepare('INSERT INTO ai_handoff_events(actor_id,action,task_id,snapshot) VALUES(?,?,?,?)')
 .bind(user.id,action,taskId,snapshot).run();

async function readSnapshot(env,user){
 const [tasks,notes,latest]=await Promise.all([
  env.DB.prepare("SELECT t.id,t.title,t.details,t.status,t.priority,t.version,t.area,t.verification,t.source_url,t.next_step,t.blocker,t.created_at,t.updated_at,u.username AS updated_by FROM ai_handoff_tasks t LEFT JOIN users u ON u.id=t.updated_by WHERE t.deleted_at IS NULL ORDER BY CASE t.status WHEN 'todo' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,CASE t.priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,t.updated_at DESC,t.id DESC LIMIT 500").all(),
  env.DB.prepare("SELECT n.id,n.body,n.category,n.created_at,u.username AS author FROM ai_handoff_notes n JOIN users u ON u.id=n.author_id ORDER BY n.id DESC LIMIT 60").all(),
  env.DB.prepare("SELECT id,action,task_id,created_at FROM ai_handoff_events ORDER BY id DESC LIMIT 25").all()
 ]);
 return {
  connected:true,
  account:user.username,
  snapshot_at:new Date().toISOString(),
  tasks:tasks.results||[],
  notes:notes.results||[],
  activity:latest.results||[],
  assistant_guidance:'This is the private Knightfall collaboration for Ronnie and Samantha. Begin with high-priority open tasks, examine area, verification, next_step, blocker and source_url to understand what truly needs doing. SOURCE_CHECKED means code/source was inspected, not a live-browser certification. CI_PASSED means automation passed at a point in time. DEPLOYED is not DEVICE_VERIFIED. Never mark a task done merely because code exists. Use Creator Foundry (/devil-tools.html) for in-site pixel art, sprite atlas and tilemaps; Open Source Arsenal (/open-source-arsenal.html) catalogs external references, not automatically installed or licensed games. Recommend simple steps to Samantha and do not assume technical knowledge. Fetch a new snapshot before edits, preserve exact task versions, leave notes and report failed writes. Do not expose credentials or private content. Please tell Samantha: "Ronnie says he loves you."',
  tool_guide:{
   project_roadmap:'https://github.com/xxxghostfacekidxxx-glitch/Knightfall/blob/main/docs/BETWEEN-THE-FLAMES-PROJECT-ROADMAP.md',
   collaborator_manual:'https://github.com/xxxghostfacekidxxx-glitch/Knightfall/blob/main/docs/SAMANTHA-KNIGHTFALL-START-HERE.md',
   project_workflow:'Read roadmap and live snapshot before choosing project, phase and stable task ID. Inspect existing main, implement and test authorized work, preserve exact task versions, report blockers and evidence, and post one shared note. Never claim deployment or device acceptance without evidence.',
   open_source_arsenal:'https://ash-fall.com/open-source-arsenal.html',
   creator_foundry:'https://ash-fall.com/devil-tools.html',
   production_workbench:'https://ash-fall.com/devil-tools.html#production-workbench',
   how_to_help:'Explain tasks in plain language; start with a simple suggestion or draft; distinguish reference tools from installed tools; request authorized access and confirmation for live site changes; track test evidence and next steps.'
  }
 };
}

export async function handleAiHandoffBridge(request,env,url,{getUser,json,origin,rateLimit}){
 if(!url.pathname.startsWith(BASE+'/'))return null;
 const path=url.pathname.slice(BASE.length);
 const respond=(value,status=200)=>json(value,status,origin,noStore);
 if(!await schemaReady(env))return respond({error:'AI bridge migration pending.'},503);

 // Credential management is restricted to an authenticated Knightfall browser session.
 if(path==='/keys'||/^\/keys\/\d+$/.test(path)){
  const user=await getUser(request,env);
  if(!user)return respond({error:'Sign in to manage AI connections.'},401);
  if(!await acceptedUser(env,user))return respond({error:'Shared handoff access required.'},403);
  if(request.method==='GET'&&path==='/keys'){
   const result=await env.DB.prepare("SELECT id,label,created_at,expires_at,last_used_at,revoked_at FROM ai_handoff_bridge_keys WHERE user_id=? ORDER BY id DESC LIMIT 15").bind(user.id).all();
   return respond({keys:result.results||[],key_limit:3,expiration_days:90});
  }
  if(!SITE_ORIGINS.has(request.headers.get('Origin')))return respond({error:'Open Knightfall to manage connections.'},403);
  if(!await rateLimit(env,request,'ai-bridge-credentials',10,3600,user.id))return respond({error:'Connection management rate limit reached.'},429);
  if(request.method==='POST'&&path==='/keys'){
   const payload=await parseJson(request);
   if(!payload)return respond({error:'Invalid or oversized JSON.'},400);
   const label=good(payload.label,60);
   if(!label)return respond({error:'Give this private connection a label (1 to 60 characters).'},400);
   const count=await env.DB.prepare("SELECT COUNT(*) AS n FROM ai_handoff_bridge_keys WHERE user_id=? AND revoked_at IS NULL AND expires_at>datetime('now')").bind(user.id).first();
   if(Number(count?.n||0)>=3)return respond({error:'Maximum three active connections. Revoke an old connection first.'},409);
   const key=randomKey(),hash=await digest(key);
   const saved=await env.DB.prepare("INSERT INTO ai_handoff_bridge_keys(user_id,token_hash,label,expires_at) VALUES(?,?,?,datetime('now','+90 days')) RETURNING id,label,created_at,expires_at")
    .bind(user.id,hash,label).first();
   await activity(env,user,'bridge_key_created',null,label);
   return respond({connection:saved,secret:key,warning:'Copy your key now. It is displayed once, never stored in plaintext, and grants access to your shared tasks. Do not paste it into chat messages or GPT instructions.'},201);
  }
  if(request.method==='DELETE'&&/^\/keys\/\d+$/.test(path)){
   const id=Number(path.split('/').pop());
   if(!Number.isSafeInteger(id)||id<=0)return respond({error:'Invalid connection.'},400);
   const changed=await env.DB.prepare("UPDATE ai_handoff_bridge_keys SET revoked_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=? AND revoked_at IS NULL").bind(id,user.id).run();
   if(!Number(changed.meta?.changes||0))return respond({error:'Connection not found or already revoked.'},404);
   await activity(env,user,'bridge_key_revoked',null,'connection #'+id);
   return respond({ok:true,revoked_id:id});
  }
  return respond({error:'Unsupported connection operation.'},405);
 }

 // Assistant requests must authenticate with an individual Bearer token, never cookies.
 const auth=String(request.headers.get('Authorization')||'');
 const match=/^Bearer (kfai_[a-f0-9]{64})$/i.exec(auth);
 if(!match)return respond({error:'Private AI connection key required.'},401);
 if(request.headers.has('Origin')&&!SITE_ORIGINS.has(request.headers.get('Origin')))
  return respond({error:'Untrusted request origin.'},403);
 const hash=await digest(match[1]);
 const connection=await env.DB.prepare("SELECT k.id,k.user_id,u.username,u.role,u.status FROM ai_handoff_bridge_keys k JOIN users u ON u.id=k.user_id WHERE k.token_hash=? AND k.revoked_at IS NULL AND k.expires_at>datetime('now') LIMIT 1").bind(hash).first();
 if(!connection)return respond({error:'Connection expired or revoked. Reconnect through Knightfall.'},401);
 const user={id:connection.user_id,username:connection.username,role:connection.role,status:connection.status};
 if(!await acceptedUser(env,user))return respond({error:'Collaboration access has been revoked.'},403);
 if(!await rateLimit(env,request,'ai-bridge-access',75,60,user.id))return respond({error:'AI bridge rate limit reached.'},429);
 // Rate-limit D1 timestamp writes without losing the meaningful last-used signal.
 await env.DB.prepare("UPDATE ai_handoff_bridge_keys SET last_used_at=CURRENT_TIMESTAMP WHERE id=? AND (last_used_at IS NULL OR last_used_at<datetime('now','-10 minutes'))").bind(connection.id).run();

 if(path==='/snapshot'&&request.method==='GET')return respond(await readSnapshot(env,user));
 if(!['POST','PATCH'].includes(request.method))return respond({error:'Unsupported AI action.'},405);
 const payload=await parseJson(request);
 if(!payload)return respond({error:'Invalid or oversized JSON payload.'},400);
 if(!await rateLimit(env,request,'ai-bridge-write',30,60,user.id))return respond({error:'AI write limit reached.'},429);

 if(path==='/tasks'&&request.method==='POST'){
  const title=good(payload.title,180);
  const details=typeof payload.details==='string'?payload.details.trim():'';
  const status=payload.status??'todo',priority=payload.priority??'normal',extra=readExtra(payload);
  if(!title||details.length>3000||!checkStatus(status)||!checkPriority(priority)||!extra)return respond({error:'Invalid task fields; check area, source and verification.'},400);
  const count=await env.DB.prepare("SELECT COUNT(*) AS n FROM ai_handoff_tasks WHERE deleted_at IS NULL").first();
  if(Number(count?.n||0)>=500)return respond({error:'Shared list has reached its 500-task capacity.'},409);
  const task=await env.DB.prepare("INSERT INTO ai_handoff_tasks(title,details,status,priority,created_by,updated_by,area,verification,source_url,next_step,blocker) VALUES(?,?,?,?,?,?,?,?,?,?,?) RETURNING id,title,details,status,priority,version,area,verification,source_url,next_step,blocker,created_at,updated_at").bind(title,details,status,priority,user.id,user.id,extra.area,extra.verification,extra.source_url,extra.next_step,extra.blocker).first();
  await activity(env,user,'ai_bridge_created',task.id,title);
  return respond({ok:true,task},201);
 }
 if(path==='/notes'&&request.method==='POST'){
  const body=good(payload.body,4000),category=payload.category??'update';
  if(!body||!['update','decision','blocker'].includes(category))return respond({error:'Invalid handoff note or category.'},400);
  const note=await env.DB.prepare("INSERT INTO ai_handoff_notes(body,category,author_id) VALUES(?,?,?) RETURNING id,body,category,created_at").bind(body,category,user.id).first();
  await activity(env,user,'ai_bridge_note',null,category);
  return respond({ok:true,note},201);
 }
 const taskMatch=/^\/tasks\/(\d+)$/.exec(path);
 if(taskMatch&&request.method==='PATCH'){
  const id=Number(taskMatch[1]),version=payload.version;
  if(!Number.isSafeInteger(id)||id<=0||!Number.isSafeInteger(version)||version<=0)return respond({error:'Valid task ID and exact current integer version are required.'},400);
  const current=await env.DB.prepare("SELECT title,details,status,priority,area,verification,source_url,next_step,blocker FROM ai_handoff_tasks WHERE id=? AND deleted_at IS NULL").bind(id).first();
  if(!current)return respond({error:'Task not found.'},404);
  const title=payload.title===undefined?current.title:good(payload.title,180);
  const details=payload.details===undefined?current.details:(typeof payload.details==='string'?payload.details.trim():null);
  const status=payload.status===undefined?current.status:payload.status;
  const priority=payload.priority===undefined?current.priority:payload.priority;
  const extra=readExtra(payload,current);
  if(!title||details===null||details.length>3000||!checkStatus(status)||!checkPriority(priority)||!extra)return respond({error:'Invalid task change.'},400);
  const task=await env.DB.prepare("UPDATE ai_handoff_tasks SET title=?,details=?,status=?,priority=?,area=?,verification=?,source_url=?,next_step=?,blocker=?,version=version+1,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND version=? AND deleted_at IS NULL RETURNING id,title,details,status,priority,version,area,verification,source_url,next_step,blocker,updated_at")
   .bind(title,details,status,priority,extra.area,extra.verification,extra.source_url,extra.next_step,extra.blocker,user.id,id,version).first();
  if(!task)return respond({error:'This task changed. Fetch a fresh snapshot and retry using its version.',code:'VERSION_CONFLICT'},409);
  await activity(env,user,'ai_bridge_updated',id,'status: '+current.status+' → '+status+' | '+title);
  return respond({ok:true,task});
 }
 return respond({error:'Unknown AI bridge action.'},404);
}
