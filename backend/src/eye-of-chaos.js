import {canAccessEyeOfHorus} from "./staff-capabilities.js";

// Fixed identities for the GOD command board. These are profiles, not member accounts.
const specialists=[
 ["Hexx Havoc","Occult & paranormal"],["Grim Static","Dark internet culture"],
 ["Riot Vex","Community conversations"],["Velvet Venom","Goth fashion & culture"],
 ["Glitch Reaper","Technology & AI"],["Moxie Mayhem","Memes & humor"],
 ["Nyx Nuisance","Alternative nightlife"],["Rotten Halo","Religion & mythology"],
 ["Dolly Dread","Horror & creepy stories"],["Vandal Vox","Underground music"],
 ["Pestilence Pete","Bizarre science"],["Crypt Kidd","Internet mysteries"],
 ["Oblivion Jack","History & forgotten stories"],["Razor Rapture","Relationships & social commentary"],
 ["Morgue Monroe","True crime & mysteries"],["Killjoy.exe","Gaming & indie releases"],
 ["Scarlet Scrawl","Tattoos & underground art"],["Pop Morgue","Movies, comics & entertainment"],
 ["Spite Sprite","Debates & cultural commentary"],["Nihil Nova","Philosophy & existentialism"]
];
export const CHAOS_AGENTS=Object.freeze(specialists.map(([name,specialty],i)=>Object.freeze({
 key:"chaos-"+String(i+1).padStart(2,"0"),name,specialty,division:"agents",status:"inactive",kind:"planned"
})));
const qaNames=["Ash Sentinel","Cinder Scout","Rook Runner","Maze Warden","Tower Keeper","Rally Hound","Kaiju Watch","Pixel Medic","Savekeeper","Cabinet Auditor"];
export const CHAOS_QA_FLEET=Object.freeze(qaNames.map((name,i)=>Object.freeze({
 key:"qa-"+String(i+1).padStart(2,"0"),name,division:"arcade",kind:"github-action",
 workflow:"arcade-test-fleet.yml",status:"external"
})));
const forumFallback=Object.freeze([
 {key:"order-66-6",name:"Order 66.6",division:"forums",kind:"existing-service",status:"unverified"},
 {key:"beelzebub-music",name:"Beelzebub",division:"forums",kind:"existing-service",status:"unverified"}
]);
export const CHAOS_SOURCES=Object.freeze({
 music:{label:"Billboard music feed",url:"https://www.billboard.com/feed/",category:"Music"},
 scifi:{label:"Star Wars News Net",url:"https://www.starwarsnewsnet.com/feed",category:"Entertainment"},
 horror:{label:"Bloody Disgusting horror news",url:"https://bloody-disgusting.com/feed/",category:"Horror"},
 entertainment:{label:"Variety entertainment news",url:"https://variety.com/feed/",category:"Entertainment"},
 science:{label:"ScienceDaily latest discoveries",url:"https://www.sciencedaily.com/rss/all.xml",category:"Science"},
 strange:{label:"ScienceDaily strange & offbeat",url:"https://www.sciencedaily.com/rss/strange_offbeat.xml",category:"Strange science"},
 space:{label:"NASA news releases",url:"https://www.nasa.gov/news-release/feed/",category:"Space"},
 technology:{label:"Ars Technica AI news",url:"https://arstechnica.com/ai/feed/",category:"Technology"}
});
const API="/api/god/chaos";
const noStore={"cache-control":"private, no-store","x-robots-tag":"noindex,nofollow"};
const validText=(s,n,min=1)=>typeof s==="string"&&s.trim().length>=min&&s.trim().length<=n;
const safeUrl=s=>!s||((typeof s==="string")&&s.length<=600&&/^https:\/\/[a-z0-9.-]+(?:\/|$)/i.test(s)&&!s.includes("@"));
const uuid=()=>crypto.randomUUID();
const timestamp=()=>new Date().toISOString();
const cycleNext=(cadence,now=Date.now())=>cadence==="daily"?new Date(now+86400000).toISOString():cadence==="weekly"?new Date(now+7*86400000).toISOString():null;
const formatName=name=>String(name||"").trim();
const list=async(env,sql,...bind)=>(await env.DB.prepare(sql).bind(...bind).all()).results||[];
async function schemaReady(env){
 try{
  const row=await env.DB.prepare("SELECT 1 AS ready FROM sqlite_master WHERE type='table' AND name='eye_chaos_missions'").first();
  return row?.ready===1;
 }catch{return false}
}
const event=(env,actor,kind,id,action)=>env.DB.prepare("INSERT INTO eye_chaos_events(actor_id,object_type,object_id,action) VALUES(?,?,?,?)").bind(actor,kind,id,action).run();

async function forumFleet(env){
 try{
  const rows=await list(env,"SELECT p.bot_key,p.display_name,p.auto_post_enabled,a.user_id FROM god_bot_profiles p LEFT JOIN god_bot_accounts a ON a.bot_key=p.bot_key ORDER BY p.bot_key");
  if(!rows.length)return {bots:forumFallback,loaded:true};
  return {loaded:true,bots:rows.map(r=>({
   key:r.bot_key,name:r.display_name,division:"forums",kind:"existing-service",
   status:r.user_id?"provisioned":"not-provisioned",posting_enabled:false
  }))};
 }catch{return {bots:forumFallback,loaded:false}}
}
async function fleet(env){
 const forums=await forumFleet(env);
 return {agents:CHAOS_AGENTS,arcade:CHAOS_QA_FLEET,forums:forums.bots,forums_loaded:forums.loaded,
  qa_workflow:"https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/workflows/arcade-test-fleet.yml",
  forum_control:"/god-bot-control.html",publication_locked:true};
}
function agentAllowed(key,division,all){
 if(division==="agents")return CHAOS_AGENTS.some(x=>x.key===key);
 if(division==="arcade")return CHAOS_QA_FLEET.some(x=>x.key===key);
 if(division==="forums")return all.forums.some(x=>x.key===key);
 return false;
}
function xmlValue(xml,tag){
 const match=xml.match(new RegExp("<"+tag+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+tag+">","i"));
 return match?match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]*>/g,"").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").trim():"";
}
export async function runSourceResearch(env,mission){
 if(!Object.hasOwn(CHAOS_SOURCES,mission.source_key))throw Error("Choose an approved research source.");
 const source=CHAOS_SOURCES[mission.source_key];
 const response=await fetch(source.url,{
  method:"GET",redirect:"error",headers:{"accept":"application/rss+xml,application/xml,text/xml","user-agent":"KnightfallEyeOfChaos/1.0"},
  signal:AbortSignal.timeout(7500)
 });
 if(!response.ok)throw Error("Source unavailable.");
 if(Number(response.headers.get("content-length")||0)>150000)throw Error("Source response too large.");
 const xml=(await response.text()).slice(0,150000),item=xml.match(/<item\b[^>]*>([\s\S]*?)<\/item>/i)?.[1];
 if(!item)throw Error("No usable source item.");
 const title=xmlValue(item,"title").slice(0,130);
 const link=xmlValue(item,"link");
 if(!validText(title,130)||!safeUrl(link))throw Error("Source item invalid.");
 const origin=new URL(source.url).hostname;
 if(new URL(link).hostname!==origin&&!new URL(link).hostname.endsWith("."+origin))throw Error("Source link host did not match.");
 return {title:"Research lead: "+title.slice(0,105),
  body:"Unverified research lead from "+source.label+": "+title+
       "\n\nOriginal source: "+link+
       "\n\nThis is a research finding, not a fact-checked article or approved public post. Verify before rewriting or publishing.",
  source_url:link};
}
async function executeResearch(env,mission,actorId){
 if(mission.division!=="agents"||mission.kind!=="research"||!Object.hasOwn(CHAOS_SOURCES,mission.source_key))
  return {error:"Automated execution is available only for research missions with an approved source.",status:409};
 const old=await env.DB.prepare("UPDATE eye_chaos_missions SET status='in_progress',updated_at=? WHERE id=? AND status IN ('queued','ready','failed') AND (last_run_at IS NULL OR last_run_at<?)")
  .bind(timestamp(),mission.id,new Date(Date.now()-300000).toISOString()).run();
 if(Number(old.meta?.changes||0)!==1)return {error:"Mission is paused, busy, or recently executed.",status:409};
 try{
  const finding=await runSourceResearch(env,mission),id=uuid(),now=timestamp();
  // Never requeue the same story for the same mission on every cron run.
  const existing=await env.DB.prepare("SELECT id FROM eye_chaos_drafts WHERE mission_id=? AND source_url=? LIMIT 1")
   .bind(mission.id,finding.source_url).first();
  if(!existing){
   await env.DB.prepare("INSERT INTO eye_chaos_drafts(id,mission_id,author_key,title,body,source_url,destination,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)")
    .bind(id,mission.id,mission.agent_key,finding.title,finding.body,finding.source_url,mission.destination,now,now).run();
  }
  const next=cycleNext(mission.cadence);
  await env.DB.prepare("UPDATE eye_chaos_missions SET status=?,last_run_at=?,next_run_at=?,updated_at=? WHERE id=?")
   .bind(next?"queued":"ready",now,next,now,mission.id).run();
  if(actorId)await event(env,actorId,"mission",mission.id,"research_completed");
  return {ok:true,created_draft:existing?null:id,duplicate:!!existing};
 }catch(error){
  await env.DB.prepare("UPDATE eye_chaos_missions SET status='failed',updated_at=? WHERE id=?").bind(timestamp(),mission.id).run();
  return {error:String(error.message||"Research source failed.").slice(0,180),status:502};
 }
}
export async function runEyeChaosScheduledResearch(env){
 if(!await schemaReady(env))return {executed:0,reason:"migration_pending"};
 // Never publish. Due research only produces pending, source-linked review drafts.
 const jobs=await list(env,"SELECT * FROM eye_chaos_missions WHERE division='agents' AND kind='research' AND cadence IN ('daily','weekly') AND status='queued' AND next_run_at<=? ORDER BY next_run_at LIMIT 2",timestamp());
 let completed=0;
 for(const mission of jobs){
  const result=await executeResearch(env,mission,null);
  if(result.ok)completed++;
 }
 return {executed:completed};
}
export async function handleEyeOfChaos(request,env,url,{requireUser,json,origin}){
 if(url.pathname!==API&&!url.pathname.startsWith(API+"/"))return null;
 const respond=(value,status=200)=>json(value,status,origin,noStore);
 const user=await requireUser(request,env);
 if(!user)return respond({error:"Authentication required."},401);
 if(!canAccessEyeOfHorus(user))return respond({error:"GOD account required."},403);
 if(request.method!=="GET"){
  const incoming=request.headers.get("Origin");
  if(incoming!=="https://ash-fall.com"&&incoming!=="https://www.ash-fall.com")
   return respond({error:"Open this console on Knightfall."},403);
  if(!String(request.headers.get("content-type")||"").startsWith("application/json")&&request.method!=="DELETE")
   return respond({error:"JSON body required."},415);
 }
 const ready=await schemaReady(env);
 if(url.pathname===API+"/status"&&request.method==="GET"){
  const f=await fleet(env);
  return respond({...f,schema_ready:ready,publishing_enabled:false,research_scheduler:ready?"available":"pending_migration"});
 }
 if(url.pathname===API+"/sources"&&request.method==="GET")
  return respond({sources:Object.entries(CHAOS_SOURCES).map(([key,value])=>({key,...value}))});
 if(url.pathname===API+"/qa"&&request.method==="GET"){
  // Live read-only GitHub evidence; no browser token, workflow dispatch or fabricated verdicts.
  const base="https://api.github.com/repos/xxxghostfacekidxxx-glitch/Knightfall";
  const options={headers:{"accept":"application/vnd.github+json","user-agent":"KnightfallEyeOfChaos/1.0"},
   cf:{cacheTtl:120,cacheEverything:true},signal:AbortSignal.timeout(6000)};
  try{
   const response=await fetch(base+"/actions/workflows/arcade-test-fleet.yml/runs?branch=main&per_page=1",options);
   if(!response.ok)return respond({verified:false,message:"GitHub test status unavailable ("+response.status+")."});
   const run=(await response.json()).workflow_runs?.[0];
   if(!run)return respond({verified:false,message:"No Arcade Test Fleet run found."});
   const info={id:run.id,status:run.status,conclusion:run.conclusion,sha:run.head_sha,created_at:run.created_at,url:run.html_url};
   const jobsResponse=await fetch(base+"/actions/runs/"+run.id+"/jobs?per_page=50",options);
   if(!jobsResponse.ok)return respond({verified:true,run:info,jobs:[],jobs_verified:false});
   const jobs=(await jobsResponse.json()).jobs||[];
   const workerJobs=jobs.filter(j=>CHAOS_QA_FLEET.some(a=>j.name?.startsWith(a.name+" ·")))
    .map(j=>({name:j.name,status:j.status,conclusion:j.conclusion,url:j.html_url}));
   return respond({verified:true,run:info,jobs:workerJobs,jobs_verified:true});
  }catch{return respond({verified:false,message:"GitHub could not be reached. Check the workflow directly."})}
 }

 if(!ready)return respond({error:"Eye of Chaos storage migration 0142 has not been applied. Controls remain read-only.",schema_ready:false},503);
 async function body(){
  if(Number(request.headers.get("content-length")||0)>15500)throw Error("Too large");
  const raw=await request.text();if(raw.length>15000)throw Error("Too large");
  const v=JSON.parse(raw);if(!v||typeof v!=="object"||Array.isArray(v))throw Error("Invalid JSON");
  return v;
 }
 const matchMission=url.pathname.match(/^\/api\/god\/chaos\/missions\/([0-9a-f-]{36})(?:\/(run|pause|resume|cancel))?$/);
 const matchDraft=url.pathname.match(/^\/api\/god\/chaos\/drafts\/([0-9a-f-]{36})(?:\/(approve|reject))?$/);
 if(url.pathname===API+"/missions"&&request.method==="GET"){
  return respond({missions:await list(env,"SELECT * FROM eye_chaos_missions ORDER BY created_at DESC LIMIT 60")});
 }
 if(url.pathname===API+"/drafts"&&request.method==="GET"){
  return respond({drafts:await list(env,"SELECT * FROM eye_chaos_drafts ORDER BY created_at DESC LIMIT 80")});
 }
 if(url.pathname===API+"/events"&&request.method==="GET"){
  return respond({events:await list(env,"SELECT id,actor_id,object_type,object_id,action,occurred_at FROM eye_chaos_events ORDER BY id DESC LIMIT 60")});
 }
 if(url.pathname===API+"/missions"&&request.method==="POST"){
  let data;try{data=await body()}catch{return respond({error:"Invalid or oversized JSON."},400)}
  const all=await fleet(env);
  const division=String(data.division||"agents"),agent_key=String(data.agent_key||""),kind=String(data.kind||"research");
  const cadence=String(data.cadence||"manual"),source_key=String(data.source_key||""),instructions=formatName(data.instructions);
  if(!agentAllowed(agent_key,division,all)||!["research","draft","discussion","qa","cross"].includes(kind)||
      !["manual","daily","weekly"].includes(cadence)||!validText(instructions,3000,8)||
      !validText(String(data.destination||""),150,0)||!Object.hasOwn(CHAOS_SOURCES,source_key)&&source_key!=="")
   return respond({error:"Invalid mission assignment, source or instructions."},400);
  if(cadence!=="manual"&&(division!=="agents"||kind!=="research"||!source_key))
   return respond({error:"Scheduled research requires an approved feed and a Chaos research agent."},400);
  const id=uuid(),now=timestamp(),next=cycleNext(cadence);
  await env.DB.prepare("INSERT INTO eye_chaos_missions(id,created_by,agent_key,division,kind,instructions,source_key,destination,cadence,status,next_run_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)")
   .bind(id,user.id,agent_key,division,kind,instructions,source_key,String(data.destination||"").trim(),cadence,"queued",next,now,now).run();
  await event(env,user.id,"mission",id,"created");
  return respond({ok:true,id,status:"queued",next_run_at:next},201);
 }
 if(matchMission&&request.method==="POST"){
  const [ ,id,action]=matchMission;
  if(!action)return respond({error:"Unknown mission action."},404);
  const mission=await env.DB.prepare("SELECT * FROM eye_chaos_missions WHERE id=?").bind(id).first();
  if(!mission)return respond({error:"Mission not found."},404);
  if(action==="run"){
   const result=await executeResearch(env,mission,user.id);
   return respond(result,result.status||200);
  }
  const states={pause:["paused",["queued","ready","failed"]],resume:["queued",["paused"]],cancel:["cancelled",["queued","paused","ready","failed"]]};
  const [target,allowed]=states[action];
  if(!allowed.includes(mission.status))return respond({error:"Invalid mission state transition."},409);
  const result=await env.DB.prepare("UPDATE eye_chaos_missions SET status=?,updated_at=? WHERE id=? AND status=?")
   .bind(target,timestamp(),id,mission.status).run();
  if(Number(result.meta?.changes||0)!==1)return respond({error:"Mission changed; reload."},409);
  await event(env,user.id,"mission",id,action);
  return respond({ok:true,status:target});
 }
 if(url.pathname===API+"/drafts"&&request.method==="POST"){
  let data;try{data=await body()}catch{return respond({error:"Invalid or oversized JSON."},400)}
  const all=await fleet(env);
  const author_key=String(data.author_key||""),division=String(data.division||"agents");
  if(!agentAllowed(author_key,division,all)||!validText(data.title,160)||!validText(data.body,10000)||
    !safeUrl(data.source_url||"")||!validText(String(data.destination||""),150,0))
    return respond({error:"Invalid draft fields."},400);
  const mission_id=data.mission_id||null;
  if(mission_id){
   const m=await env.DB.prepare("SELECT agent_key FROM eye_chaos_missions WHERE id=?").bind(mission_id).first();
   if(!m||m.agent_key!==author_key)return respond({error:"Draft mission does not match agent."},409);
  }
  const id=uuid(),now=timestamp();
  await env.DB.prepare("INSERT INTO eye_chaos_drafts(id,mission_id,author_key,title,body,source_url,destination,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)")
   .bind(id,mission_id,author_key,data.title.trim(),data.body.trim(),String(data.source_url||""),String(data.destination||"").trim(),now,now).run();
  await event(env,user.id,"draft",id,"created");
  return respond({ok:true,id,status:"pending"},201);
 }
 if(matchDraft){
  const [ ,id,action]=matchDraft;
  const draft=await env.DB.prepare("SELECT * FROM eye_chaos_drafts WHERE id=?").bind(id).first();
  if(!draft)return respond({error:"Draft not found."},404);
  if(request.method==="PATCH"&&!action){
   let data;try{data=await body()}catch{return respond({error:"Invalid or oversized JSON."},400)}
   if(!validText(data.title,160)||!validText(data.body,10000)||!safeUrl(data.source_url||"")||
    !validText(String(data.destination||""),150,0))return respond({error:"Invalid draft text."},400);
   if(draft.status==="published")return respond({error:"Published content is immutable."},409);
   const changed=await env.DB.prepare("UPDATE eye_chaos_drafts SET title=?,body=?,source_url=?,destination=?,version=version+1,status='pending',approved_by=NULL,approved_at=NULL,approved_version=NULL,updated_at=? WHERE id=? AND version=?")
    .bind(data.title.trim(),data.body.trim(),String(data.source_url||""),String(data.destination||"").trim(),timestamp(),id,draft.version).run();
   if(Number(changed.meta?.changes||0)!==1)return respond({error:"Draft changed; reload."},409);
   await event(env,user.id,"draft",id,"edited_approval_invalidated");
   return respond({ok:true,status:"pending",version:draft.version+1});
  }
  if(request.method==="POST"&&["approve","reject"].includes(action)){
   if(draft.status==="published")return respond({error:"Already published."},409);
   const ok=await env.DB.prepare(action==="approve"?
    "UPDATE eye_chaos_drafts SET status='approved',approved_by=?,approved_at=?,approved_version=version,updated_at=? WHERE id=? AND version=? AND status IN ('pending','rejected')":
    "UPDATE eye_chaos_drafts SET status='rejected',approved_by=NULL,approved_at=NULL,approved_version=NULL,updated_at=? WHERE id=? AND version=? AND status IN ('pending','approved')")
     .bind(...(action==="approve"?[user.id,timestamp(),timestamp(),id,draft.version]:[timestamp(),id,draft.version])).run();
   if(Number(ok.meta?.changes||0)!==1)return respond({error:"Draft changed or was already reviewed."},409);
   await event(env,user.id,"draft",id,action);
   return respond({ok:true,status:action==="approve"?"approved":"rejected",version:draft.version,
     note:"Approval is recorded. Publishing remains disabled until a verified destination integration is installed."});
  }
 }
 return respond({error:"Unknown Eye of Chaos operation."},404);
}
