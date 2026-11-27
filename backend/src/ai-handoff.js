// Private two-person coordination board for GOD and one invited, consenting Knightfall member.
import {handleAiHandoffBridge} from './ai-handoff-bridge.js';
// Browser collaboration plus optional user-configured, per-account GPT Action connections.
const PREFIX='/api/ai-handoff';
const ORIGINS=new Set(['https://ash-fall.com','https://www.ash-fall.com']);
const INSTRUCTIONS=[
 "MENTORING CONTRACT: Read https://github.com/xxxghostfacekidxxx-glitch/Knightfall/blob/main/docs/ISIS-DEVELOPMENT-APPRENTICESHIP.md and the repository tree https://github.com/xxxghostfacekidxxx-glitch/Knightfall/blob/main/docs/KNIGHTFALL-REPOSITORY-TREE.md. Lead Samantha through real authorized tasks. Before each change explain the project/phase, owning files, UI/API/storage dependencies, impact and acceptance criteria. While implementing, teach the relevant code and tools in plain language; after tests and authorized commit, summarize what she learned, actual evidence and next step, then update the shared board with exact version and post a note. Do not require a sitewide audit, invent tools, grant privileges or expose owner-only data.",
 'START HERE: https://github.com/xxxghostfacekidxxx-glitch/Knightfall/blob/main/docs/SAMANTHA-KNIGHTFALL-START-HERE.md | PROJECT PHASES AND STABLE TASK IDS: https://github.com/xxxghostfacekidxxx-glitch/Knightfall/blob/main/docs/BETWEEN-THE-FLAMES-PROJECT-ROADMAP.md. Read both before planning; the live snapshot is authoritative. Identify the phase and permanent task ID, inspect current source, work in authorized batches, test and record evidence, update exact version and post a shared note. Do not confuse proposal, commit, CI, deployment and device acceptance.',
 'TO SAMANTHA\u2019S CHATGPT: This is the Knightfall coordination handoff shared by Ronnie and Samantha.',
 'Read the newest handoff note and the current task list before proposing work. Treat the live task list as the source of truth, not earlier copies.',
 'After finishing work, discovering blockers, or changing a decision, keep the shared to-do list current: update task status and details using Samantha\u2019s authenticated Knightfall handoff page, or ask Samantha to make the update when direct access is unavailable.',
 'Add a dated handoff note describing what changed, what remains, and what needs Ronnie\u2019s attention. Do not claim an update occurred unless the site confirmed it.',
 'Only include project details Samantha and Ronnie choose to share. This is private to their authorized Knightfall accounts; do not publish the handoff elsewhere.',
 'The project backlog now has workstreams (area), priorities, source_url, next_step, blocker and verification. The shared board may contain partially implemented items: never assume a task is unfinished or finished without verifying current source, CI, deployment and real-device behavior.',
 'Explain technical work in plain language for Samantha. Give a concrete next step, the relevant page/tool and what a successful result looks like; no assumed prior coding knowledge.',
 'CREATOR FOUNDRY: https://ash-fall.com/devil-tools.html is the authenticated art/game creation workspace. Inside it, Creator Production Lab at https://ash-fall.com/devil-tools.html#production-workbench includes native Pixel Studio (32×32 brush/frames/PNG), Atlas Packer (sprite sheets and JSON) and Tilemap Forge (tile painting/map export). There are external references such as Piskel, Pixelorama, Blender and Krita; not all are installed in Knightfall. A creator title does not confer admin, repository, or production asset publishing rights.',
 'OPEN SOURCE ARSENAL: https://ash-fall.com/open-source-arsenal.html is a curated, searchable catalog of source tools and game/framework references, NOT a claim that each tool is installed, playable, commercially licensed, or automatically imported. Check exact project license and asset attribution before integrating. When helping Samantha, explain the difference between links to an upstream project and Knightfall tools she can actually use.',
 'CHAOS FORGE: https://ash-fall.com/chaos-forge.html is for craft/clothing pattern and 3D workflow experiments; confirm actual capabilities on the page rather than assuming full reconstruction.',
 'Samantha (@knightfallsamantha) is an administrator when her authenticated Knightfall session reports role=admin. As an admin she has the Admin Dashboard, Eye of Chaos mission and draft management, Creator Foundry, moderation, and the shared Between the Flames board. Eye of Chaos draft approval is additionally delegated only while her accepted partnership and admin status are verified by the backend. GOD alone retains Eye of Horus, the Eye of Chaos master execution lock, and other owner-only operations. Do not confuse the shared-board label partner with her site-wide admin role. Repository access, Cloudflare access, production deployment, payments, role grants and security settings must be verified separately; never claim they were granted solely by this site role. Do not invent deployment success.',
 'FIELD MANUAL FOR SAMANTHA AND HER GPT: https://github.com/xxxghostfacekidxxx-glitch/Knightfall/blob/main/docs/MISS-CHAOS-OSIRIS-ISIS-FIELD-GUIDE.md. This is the complete source-backed map of people, permissions, site pages, AI tools, fleets, project priorities and supervised development policy. Read it alongside the live board; the document is not proof of deployment.',
 'MISSION: Knightfall / Ash-Fall is an alt/goth, neon-glitch cathedral-themed creative community. Build reliable forums, Chaosphere messaging, Chaos Cartridge arcade, evolving pets and avatars, personal bots, creative workshops, tools, journals, astrology, and eventually genuinely functioning creator shops. Stability, mobile usability, privacy and accessibility matter more than merely looking dramatic.',
 'MISS CHAOS CURRENT TOOL SET: authenticated personal chat and memory; own profile, notes, notifications, inbox previews, permitted bot-fleet metadata and shared handoff reading; public site help, arcade picks, calculations, time and moon tools; fixed-source research via Wikipedia, Wikidata, Poly Haven, The Met, Open Library, Crossref and public GitHub metadata; code inspection, formatting, real text diffs, JSON checks, Mermaid flowcharts; prototype craft pattern drafts, fabric estimates and measured resizing. Staff can read bounded allowlisted public main-branch source and public GitHub CI health. None of that is arbitrary code execution, repo writing, autonomous deployment or unlimited free model use.',
 'COMMAND HIERARCHY: Osiris is Ronnie, the verified GOD owner; Isis is Samantha only when her accepted partnership AND separate administrator role are verified. Admins can inspect staff source/CI and manage authorized missions. Isis can approve delegated versioned drafts and reviewed themes when backend authorization checks pass; GOD alone retains Eye of Horus, owner-only secrets, master execution pause and account ownership powers. Never infer GitHub, Cloudflare or Stripe access from Knightfall role labels.',
 'EYE OF CHAOS MAP: https://ash-fall.com/eye-of-chaos.html has Command Deck, Fleet Registry, Mission Control, Approval Queue, Game QA, Madhouse, History and linked Theme Crew. It tracks about 20 named agent identities, 10 GitHub Actions game QA workers and existing forum bots; those listings do not mean independently running AI accounts. Scheduled bounded research and versioned drafts are possible; approving a draft never silently posts it. GOD-only Eye of Horus is a separate retained-data console.',
 'SITE MAP: /community.html forums; /chaosphere.html and /messages.html chat/inbox; /chaos-cartridge.html arcade; /miss-chaos.html general assistant; /samantha-chaos.html partner assistant; /ai-handoff.html Between the Flames; /devil-tools.html Creator Foundry; /chaos-code-studio.html code inspector/diff/editor; /chaos-forge.html crafts/3D; /open-source-arsenal.html vetted reference catalog; /personal-bots.html bots; /shops.html and /shop-builder.html shop planning; /admin.html staff; /notifications.html alerts; /install.html PWA. GitHub main branch holds public/ Pages frontend and backend/ Cloudflare Worker + D1 migrations.',
 'PRIORITIES: First verify release SHAs and fix black-screen games, mobile fullscreen, alert clearing, install behavior, stale theme styles and messaging. Improve Imp Inferno 4-player demon arcade, Hex Whisk mobile merge gameplay, maker tools and pet/avatar quality. Next make Miss Chaos a supervised dev partner: source read -> bounded proposed patch -> syntax/diff review -> real CI tests -> human signoff -> verified deployment -> post-deploy and phone QA. Do not create new branches/PRs by default, bypass permission checks, self-approve or mark source commits live.',
 'EVIDENCE RULE: The last inspected Pages production alias succeeded at commit ac1a04a78087c3224732bb2edbda1d5a07fec06e, while 6000e615b5b44c86bd0fdb6f719ff3b14827c638 was still queued. This checkpoint expires as newer deployments occur; re-check Cloudflare before claiming a later commit is live. Keep source_checked, ci_passed, deployed, and device_verified distinct.',
 'And please tell Samantha this exact message: "Ronnie says he loves you."'
].join('\n\n');
const RESPONSE_HEADERS={'cache-control':'private, no-store'};
const goodText=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.trim().length<=max?v.trim():null;
const validStatus=v=>['todo','in_progress','done'].includes(v);
const validPriority=v=>['low','normal','high'].includes(v);
const validVerification=v=>['needs_review','source_checked','ci_passed','deployed','device_verified'].includes(v);
const validArea=v=>typeof v==='string'&&v.trim().length>0&&v.trim().length<=56;
const validSource=v=>{
 if(v==='')return true;
 if(typeof v!=='string'||v.length>500)return false;
 try{const u=new URL(v);return u.protocol==='https:'&&(u.hostname==='ash-fall.com'||u.hostname==='www.ash-fall.com'||u.hostname==='github.com'&&u.pathname.startsWith('/xxxghostfacekidxxx-glitch/Knightfall/'))}catch{return false}
};
const taskExtra=(data,current={})=>{
 const area=data.area===undefined?(current.area||'General'):data.area;
 const verification=data.verification===undefined?(current.verification||'needs_review'):data.verification;
 const source_url=data.source_url===undefined?(current.source_url||''):data.source_url;
 const next_step=data.next_step===undefined?(current.next_step||''):data.next_step;
 const blocker=data.blocker===undefined?(current.blocker||''):data.blocker;
 if(!validArea(area)||!validVerification(verification)||!validSource(source_url)||
  typeof next_step!=='string'||next_step.length>600||typeof blocker!=='string'||blocker.length>600)return null;
 return {area:area.trim(),verification,source_url,next_step:next_step.trim(),blocker:blocker.trim()};
};
const event=(env,user,action,taskId,snapshot='')=>env.DB.prepare('INSERT INTO ai_handoff_events(actor_id,action,task_id,snapshot) VALUES(?,?,?,?)').bind(user.id,action,taskId,snapshot).run();
async function ready(env){
 const row=await env.DB.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name IN ('ai_handoff_partner','ai_handoff_tasks','ai_handoff_notes','ai_handoff_events')").first();
 return Number(row?.n)===4;
}
async function partner(env){return env.DB.prepare("SELECT p.user_id,p.status,p.invited_at,p.accepted_at,u.username,u.display_name FROM ai_handoff_partner p JOIN users u ON u.id=p.user_id WHERE p.slot=1").first();}
async function tasks(env){return (await env.DB.prepare("SELECT t.id,t.title,t.details,t.status,t.priority,t.version,t.area,t.verification,t.source_url,t.next_step,t.blocker,t.created_at,t.updated_at,u.username AS updated_by FROM ai_handoff_tasks t LEFT JOIN users u ON u.id=t.updated_by WHERE t.deleted_at IS NULL ORDER BY CASE t.status WHEN 'todo' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END, CASE t.priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,t.updated_at DESC,t.id DESC LIMIT 500").all()).results||[];}
async function notes(env){return (await env.DB.prepare("SELECT n.id,n.body,n.category,n.created_at,u.username AS author FROM ai_handoff_notes n JOIN users u ON u.id=n.author_id ORDER BY n.id DESC LIMIT 60").all()).results||[];}
async function activity(env){return (await env.DB.prepare("SELECT e.id,e.action,e.task_id,e.snapshot,e.created_at,u.username AS actor FROM ai_handoff_events e JOIN users u ON u.id=e.actor_id ORDER BY e.id DESC LIMIT 35").all()).results||[];}
function packet(board){
 return [
  'KNIGHTFALL | RONNIE + SAMANTHA | SHARED AI HANDOFF',
  'Snapshot: '+new Date().toISOString(),
  'IMPORTANT: Re-read the authenticated handoff page for the newest changes before acting. A pasted copy is not live.',
  INSTRUCTIONS,
  'SOURCE REGISTERS: https://github.com/xxxghostfacekidxxx-glitch/Knightfall/blob/main/docs/MASTER-TASK-LIST-2026-11-11.md | https://github.com/xxxghostfacekidxxx-glitch/Knightfall/blob/main/docs/ASH-FALL-RECOVERED-BACKLOG.md | https://github.com/xxxghostfacekidxxx-glitch/Knightfall/blob/main/docs/BUSINESS-LAUNCH-READINESS-2026-11-15.md',
  'CURRENT TO-DO LIST:',
  ...board.tasks.map(t=>'#'+t.id+' ['+t.status+'] ('+t.priority+') [Area: '+(t.area||'General')+'] '+t.title+
  ' | Verification: '+(t.verification||'needs_review')+
  (t.next_step?' | NEXT: '+t.next_step:'')+(t.blocker?' | BLOCKER: '+t.blocker:'')+
  (t.details?' | Details: '+t.details:'')+(t.source_url?' | Source: '+t.source_url:'')+' | revision '+t.version),
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
   return respond({role:isGod?'owner':'partner',partner:invite,confirmed_access:true,tasks:await tasks(env),notes:await notes(env),activity:await activity(env),instructions:INSTRUCTIONS,guide_links:{apprenticeship:'https://github.com/xxxghostfacekidxxx-glitch/Knightfall/blob/main/docs/ISIS-DEVELOPMENT-APPRENTICESHIP.md',repository_tree:'https://github.com/xxxghostfacekidxxx-glitch/Knightfall/blob/main/docs/KNIGHTFALL-REPOSITORY-TREE.md',project_roadmap:'https://github.com/xxxghostfacekidxxx-glitch/Knightfall/blob/main/docs/BETWEEN-THE-FLAMES-PROJECT-ROADMAP.md',collaborator_manual:'https://github.com/xxxghostfacekidxxx-glitch/Knightfall/blob/main/docs/SAMANTHA-KNIGHTFALL-START-HERE.md',field_manual:'https://github.com/xxxghostfacekidxxx-glitch/Knightfall/blob/main/docs/MISS-CHAOS-OSIRIS-ISIS-FIELD-GUIDE.md',foundry:'https://ash-fall.com/devil-tools.html',production_lab:'https://ash-fall.com/devil-tools.html#production-workbench',arsenal:'https://ash-fall.com/open-source-arsenal.html',chaos_forge:'https://ash-fall.com/chaos-forge.html'},message:'Ronnie says he loves you.'});
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
   const status=body.status||'todo',priority=body.priority||'normal',extra=taskExtra(body);
   if(!title||details.length>3000||!validStatus(status)||!validPriority(priority)||!extra)return respond({error:'Check task title, details, status, priority, area, verification and source.'},400);
   const count=await env.DB.prepare("SELECT COUNT(*) AS n FROM ai_handoff_tasks WHERE deleted_at IS NULL").first();
   if(Number(count?.n)>=500)return respond({error:'Task limit reached (500). Archive completed tasks first.'},409);
   const task=await env.DB.prepare("INSERT INTO ai_handoff_tasks(title,details,status,priority,created_by,updated_by,area,verification,source_url,next_step,blocker) VALUES(?,?,?,?,?,?,?,?,?,?,?) RETURNING *").bind(title,details,status,priority,user.id,user.id,extra.area,extra.verification,extra.source_url,extra.next_step,extra.blocker).first();
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
     const extra=taskExtra(body,current);
     if(!title||details===null||details.length>3000||!validStatus(status)||!validPriority(priority)||!extra)return respond({error:'Invalid task changes.'},400);
     const updated=await env.DB.prepare("UPDATE ai_handoff_tasks SET title=?,details=?,status=?,priority=?,area=?,verification=?,source_url=?,next_step=?,blocker=?,version=version+1,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND version=? AND deleted_at IS NULL RETURNING *").bind(title,details,status,priority,extra.area,extra.verification,extra.source_url,extra.next_step,extra.blocker,user.id,id,version).first();
     if(!updated)return respond({error:'This task was updated elsewhere. Refresh.',code:'VERSION_CONFLICT'},409);
     await event(env,user,'updated',id,'status: '+current.status+' → '+status+' | '+title);
     return respond({task:updated});
   }
 }
 return respond({error:'Unknown handoff action.'},404);
}
