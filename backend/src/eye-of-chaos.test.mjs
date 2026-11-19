import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {CHAOS_AGENTS,CHAOS_QA_FLEET,CHAOS_SOURCES,handleEyeOfChaos,runEyeChaosScheduledResearch,runSourceResearch} from "./eye-of-chaos.js";
if(!globalThis.crypto)globalThis.crypto=webcrypto;

function fixture(role="god",ready=true,delegated=false){
 const missions=new Map(),drafts=new Map(),events=[],queries=[],paused={value:0};
 const db={prepare(sql){
  const q={sql,args:[],bind(...v){this.args=v;return this},
   async first(){
    queries.push({sql,args:this.args});
    if(sql.includes("sqlite_master"))return ready?{ready:3}:null;
    if(sql.includes("FROM ai_handoff_partner"))return delegated?{user_id:11,invited_by:1,status:"accepted"}:null;
    if(sql.includes("SELECT paused FROM eye_chaos_controls"))return {paused:paused.value};
    if(sql.includes("FROM eye_chaos_missions WHERE id="))return missions.get(this.args[0])||null;
    if(sql.includes("FROM eye_chaos_drafts WHERE id="))return drafts.get(this.args[0])||null;
    if(sql.includes("FROM eye_chaos_drafts WHERE mission_id=")){
     return [...drafts.values()].find(x=>x.mission_id===this.args[0]&&x.source_url===this.args[1])||null;
    }
    return null;
   },
   async all(){
    queries.push({sql,args:this.args});
    if(sql.includes("FROM god_bot_profiles"))return {results:[{bot_key:"beelzebub-music",display_name:"Beelzebub",user_id:101}]};
    if(sql.includes("FROM eye_chaos_missions"))return {results:[...missions.values()]};
    if(sql.includes("FROM eye_chaos_drafts"))return {results:[...drafts.values()]};
    if(sql.includes("FROM eye_chaos_events"))return {results:events};
    return {results:[]};
   },
   async run(){
    queries.push({sql,args:this.args});
    const a=this.args;
    if(sql.startsWith("INSERT INTO eye_chaos_missions")){
     missions.set(a[0],{id:a[0],created_by:a[1],agent_key:a[2],division:a[3],kind:a[4],instructions:a[5],
      source_key:a[6],destination:a[7],cadence:a[8],status:a[9],next_run_at:a[10],created_at:a[11],updated_at:a[12],last_run_at:null});
    }else if(sql.startsWith("INSERT INTO eye_chaos_drafts")){
     drafts.set(a[0],{id:a[0],mission_id:a[1],author_key:a[2],title:a[3],body:a[4],
      source_url:a[5],destination:a[6],version:1,status:"pending",approved_by:null,approved_at:null,approved_version:null,created_at:a[7]});
    }else if(sql.startsWith("INSERT INTO eye_chaos_events")){
     events.push({object_type:a[1],object_id:a[2],action:a[3]});
    }else if(sql.startsWith("UPDATE eye_chaos_drafts SET title=")){
     const d=drafts.get(a[5]);if(!d||d.version!==a[6])return {meta:{changes:0}};
     Object.assign(d,{title:a[0],body:a[1],source_url:a[2],destination:a[3],version:d.version+1,status:"pending",approved_by:null,approved_at:null,approved_version:null});
    }else if(sql.startsWith("UPDATE eye_chaos_drafts SET status='approved'")){
     const d=drafts.get(a[3]);if(!d||d.version!==a[4]||!["pending","rejected"].includes(d.status))return {meta:{changes:0}};
     Object.assign(d,{status:"approved",approved_by:a[0],approved_at:a[1],approved_version:d.version});
    }else if(sql.startsWith("UPDATE eye_chaos_drafts SET status='rejected'")){
     const d=drafts.get(a[1]);if(!d||d.version!==a[2]||!["pending","approved"].includes(d.status))return {meta:{changes:0}};
     Object.assign(d,{status:"rejected",approved_by:null,approved_at:null,approved_version:null});
    }else if(sql.startsWith("UPDATE eye_chaos_missions SET status=?")){
     const d=missions.get(a[2]);if(!d||d.status!==a[3])return {meta:{changes:0}};
     d.status=a[0];
    }else if(sql.startsWith("UPDATE eye_chaos_missions SET status='in_progress'")){
     const d=missions.get(a[1]);if(!d||!["queued","ready","failed"].includes(d.status))return {meta:{changes:0}};
     d.status="in_progress";
    }else if(sql.startsWith("UPDATE eye_chaos_missions SET status='failed'")){
     missions.get(a[1]).status="failed";
    }else if(sql.startsWith("UPDATE eye_chaos_missions SET status=?,last_run_at=")){
     const d=missions.get(a[4]);Object.assign(d,{status:a[0],last_run_at:a[1],next_run_at:a[2]});
    }
    if(sql.startsWith("UPDATE eye_chaos_controls SET paused="))paused.value=a[0];
    return {meta:{changes:1}};
   }};
  return q;
 }};
 const env={DB:db};
 const deps={requireUser:async()=>role==="guest"?null:{id:11,role,status:"active"},rateLimit:async()=>true,
  json:(data,status=200,origin,headers={})=>new Response(JSON.stringify(data),{status,headers}),origin:"https://ash-fall.com"};
 function call(path,method="GET",payload=null,from="https://ash-fall.com"){
  const options={method,headers:{origin:from,...(method!=="GET"?{"content-type":"application/json"}:{})}};
  if(method!=="GET")options.body=JSON.stringify(payload||{});
  const request=new Request("https://api.ash-fall.com"+path,options);
  return handleEyeOfChaos(request,env,new URL(request.url),deps);
 }
 return {call,missions,drafts,queries,events,env,deps,paused};
}
const base="/api/god/chaos";
test("the approved roster is exactly 20, Pop Morgue is #18, and the real QA matrix has ten workers",()=>{
 assert.equal(CHAOS_AGENTS.length,20);
 assert.equal(new Set(CHAOS_AGENTS.map(a=>a.name)).size,20);
 assert.equal(CHAOS_AGENTS[17].name,"Pop Morgue");
 assert.equal(CHAOS_AGENTS[19].name,"Nihil Nova");
 assert.equal(CHAOS_QA_FLEET.length,10);
 assert.ok(CHAOS_QA_FLEET.some(a=>a.name==="Ash Sentinel"));
 assert.ok(CHAOS_QA_FLEET.every(a=>a.kind==="github-action"));
});
test("Admins and GOD may see command data; lower roles cannot",async()=>{
 for(const role of ["guest","member","moderator"]){
  const f=fixture(role);
  const response=await f.call(base+"/status");
  assert.equal(response.status,role==="guest"?401:403);
  assert.equal(f.queries.length,0);
 }
 const f=fixture();
 const response=await f.call(base+"/status"),data=await response.json();
 assert.equal(response.status,200);
 assert.equal(data.agents.length,20);
 assert.equal(data.arcade.length,10);
 assert.equal(data.forums[0].name,"Beelzebub");
 assert.equal(data.publication_locked,true);
 assert.equal(data.schema_ready,true);
 assert.equal(data.permissions.can_approve,true);
 assert.equal(data.permissions.can_control,true);
 const admin=fixture("admin");
 const adminResponse=await admin.call(base+"/status"),adminData=await adminResponse.json();
 assert.equal(adminResponse.status,200);
 assert.equal(adminData.permissions.can_view,true);
 assert.equal(adminData.permissions.can_manage_missions,true);
 assert.equal(adminData.permissions.can_approve,false);
 assert.equal(adminData.permissions.can_control,false);
 assert.match(response.headers.get("cache-control"),/no-store/);
});
test("migration absent never authorizes mission writes or misreports activation",async()=>{
 const f=fixture("god",false);
 const status=await f.call(base+"/status");
 assert.equal((await status.json()).schema_ready,false);
 const mission=await f.call(base+"/missions","POST",{agent_key:"chaos-01",division:"agents",kind:"research",instructions:"Look for news"});
 assert.equal(mission.status,503);
 assert.equal(f.missions.size,0);
});
test("mission schedule needs GOD, an approved source and known agent identity",async()=>{
 const f=fixture();
 const data={division:"agents",agent_key:"chaos-01",kind:"research",instructions:"Find new music headlines for review",cadence:"daily",source_key:"music"};
 assert.equal((await f.call(base+"/missions","POST",data,"https://evil.example")).status,403);
 assert.equal((await f.call(base+"/missions","POST",{...data,agent_key:"not-registered"})).status,400);
 assert.equal((await f.call(base+"/missions","POST",{...data,source_key:"http://localhost"})).status,400);
 assert.equal((await f.call(base+"/missions","POST",{...data,kind:"qa"})).status,400);
 const response=await f.call(base+"/missions","POST",data),v=await response.json();
 assert.equal(response.status,201);assert.equal(f.missions.get(v.id).status,"queued");
 assert.ok(Date.parse(f.missions.get(v.id).next_run_at)>Date.now());
 assert.equal((await f.call(base+"/missions/"+v.id+"/pause","POST")).status,200);
 assert.equal(f.missions.get(v.id).status,"paused");
 assert.equal((await f.call(base+"/missions/"+v.id+"/resume","POST")).status,200);
 assert.equal(f.missions.get(v.id).status,"queued");
});
test("GOD approval applies only to exact draft versions; edits invalidate approvals, and no publication endpoint exists",async()=>{
 const f=fixture(),draft={division:"agents",author_key:"chaos-18",title:"Cult classic roundup",body:"An original draft with a verified public link.",source_url:"https://www.billboard.com/feed/",destination:"Madhouse / Entertainment"};
 const start=await f.call(base+"/drafts","POST",draft),id=(await start.json()).id;
 assert.equal(start.status,201);
 assert.equal((await f.call(base+"/drafts/"+id+"/approve","POST")).status,200);
 assert.equal(f.drafts.get(id).approved_version,1);
 assert.equal(f.drafts.get(id).approved_by,11);
 assert.equal((await f.call(base+"/drafts/"+id+"/approve","POST")).status,409);
 const edit=await f.call(base+"/drafts/"+id,"PATCH",{...draft,body:"Revised source-backed draft."});
 assert.equal(edit.status,200);
 assert.equal(f.drafts.get(id).status,"pending");
 assert.equal(f.drafts.get(id).approved_by,null);
 assert.equal(f.drafts.get(id).version,2);
 assert.equal((await f.call(base+"/drafts/"+id+"/approve","POST")).status,200);
 assert.equal(f.drafts.get(id).approved_version,2);
 assert.equal((await f.call(base+"/drafts/"+id+"/reject","POST")).status,200);
 assert.equal(f.drafts.get(id).approved_at,null);
 assert.equal((await f.call(base+"/drafts/"+id+"/publish","POST")).status,404);
 assert.equal(f.events.filter(x=>x.action==="approve").length,2);
});
test("scheduled research never invokes publication; only registered sources are allowed",async()=>{
 const f=fixture();assert.deepEqual(Object.keys(CHAOS_SOURCES),["knightfall","music","scifi","horror","entertainment","science","strange","space","technology"]);
 const result=await runEyeChaosScheduledResearch(f.env);
 assert.deepEqual(result,{executed:0});
});

test("GOD QA dashboard reflects verified GitHub workflows and their actual worker verdicts",async()=>{
 const f=fixture();
 const previous=globalThis.fetch;
 let calls=0;
 globalThis.fetch=async(url)=>{
  calls++;
  assert.match(url,/api\.github\.com\/repos\/xxxghostfacekidxxx-glitch\/Knightfall\/actions\//);
  if(url.includes("/workflows/"))return Response.json({workflow_runs:[{
   id:777,head_sha:"1234567890abcdef",status:"completed",conclusion:"failure",
   html_url:"https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/777",
   created_at:"2026-11-15T12:00:00Z"
  }]});
  return Response.json({jobs:[
   {name:"Ash Sentinel · sharded arcade audit",status:"completed",conclusion:"success",html_url:"https://github.com/example/a"},
   {name:"Pixel Medic · sharded arcade audit",status:"completed",conclusion:"failure",html_url:"https://github.com/example/b"},
   {name:"Other workflow job",status:"completed",conclusion:"success"}
  ]});
 };
 try{
  const res=await f.call(base+"/qa"),data=await res.json();
  assert.equal(res.status,200);
  assert.equal(data.verified,true);
  assert.equal(data.run.conclusion,"failure");
  assert.deepEqual(data.jobs.map(x=>x.name),["Ash Sentinel · sharded arcade audit","Pixel Medic · sharded arcade audit"]);
  assert.equal(data.jobs[1].conclusion,"failure");
  assert.equal(calls,2);
  assert.equal(f.queries.filter(q=>/\b(?:FROM|INTO|UPDATE|DELETE FROM)\s+eye_chaos_drafts\b/i.test(q.sql)).length,0,"QA should not write or access member drafts");
 }finally{globalThis.fetch=previous}
 // QA is available to admins; GOD-only approval authority is tested separately.
});

test("Other admins can prepare drafts but GOD-only actions never query or mutate privileged records",async()=>{
 const admin=fixture("admin");
 const mission=await admin.call(base+"/missions","POST",{division:"arcade",agent_key:"qa-01",kind:"qa",instructions:"Check arcade launch and fullscreen controls",cadence:"manual"});
 assert.equal(mission.status,201);
 const draft=await admin.call(base+"/drafts","POST",{division:"agents",author_key:"chaos-18",title:"Game QA recap",body:"Proposed fixes awaiting GOD review.",destination:"Madhouse / Gaming"});
 assert.equal(draft.status,201);
 const id=(await draft.json()).id;
 const before=admin.queries.length;
 assert.equal((await admin.call(base+"/control","POST",{paused:true})).status,403);
 assert.equal((await admin.call(base+"/drafts/"+id+"/approve","POST")).status,403);
 assert.equal((await admin.call(base+"/drafts/"+id+"/reject","POST")).status,403);
 const deniedQueries=admin.queries.slice(before);
 assert.ok(deniedQueries.length>=3,"each denied mutation checks the live partner invitation first");
 assert.ok(deniedQueries.every(q=>q.sql.includes("FROM ai_handoff_partner")),
  "denied GOD commands may verify the partner grant, but must never read or mutate command records");
 assert.equal(admin.drafts.get(id).status,"pending");
});
test("AI generation creates an editable pending draft, never a published bot post",async()=>{
 const f=fixture();
 const mission=await f.call(base+"/missions","POST",{
  division:"agents",agent_key:"chaos-18",kind:"draft",instructions:"Write an original intro to obscure cult cinema",cadence:"manual",destination:"Madhouse / Entertainment"});
 const missionId=(await mission.json()).id;
 const calls=[];
 f.env.AI={run:async(model,opts)=>{
  calls.push({model,opts});return {response:JSON.stringify({title:"Forgotten horror treasures",body:"Three original film discussion questions for curious cinephiles."})};
 }};
 const generated=await f.call(base+"/missions/"+missionId+"/draft","POST"),data=await generated.json();
 assert.equal(generated.status,201);
 assert.equal(data.published,false);
 assert.equal(data.status,"pending");
 assert.equal(f.drafts.get(data.created_draft).status,"pending");
 assert.equal(f.drafts.get(data.created_draft).author_key,"chaos-18");
 assert.equal(f.drafts.get(data.created_draft).approved_by,null);
 assert.equal(calls.length,1);
 assert.match(calls[0].opts.messages[0].content,/Pop Morgue/);
 assert.match(calls[0].model,/llama-3.1-8b-instruct-fast/);
 assert.ok(f.events.some(x=>x.action==="ai_generated_pending_review"));
 const denied=fixture("member");denied.env.AI=f.env.AI;
 assert.equal((await denied.call(base+"/missions/"+missionId+"/draft","POST")).status,403);
});
test("AI mission drafting fails closed on invalid output, lack of AI, and rate limits",async()=>{
 const f=fixture(),create=await f.call(base+"/missions","POST",{
  division:"agents",agent_key:"chaos-01",kind:"draft",instructions:"Write a new original post",cadence:"manual"});
 const id=(await create.json()).id;
 assert.equal((await f.call(base+"/missions/"+id+"/draft","POST")).status,503);
 f.env.AI={run:async()=>({response:"not json"})};
 assert.equal((await f.call(base+"/missions/"+id+"/draft","POST")).status,502);
 assert.equal(f.drafts.size,0);
 f.deps.rateLimit=async()=>false;
 assert.equal((await f.call(base+"/missions/"+id+"/draft","POST")).status,429);
 assert.equal(f.drafts.size,0);
});

test("Knightfall research reads only public non-deleted non-adult thread metadata",async()=>{
 const queries=[];
 const env={DB:{prepare(sql){
  queries.push(sql);
  return {async first(){return {id:71,title:"Favorite indie horror games",category_slug:"gaming"}}};
 }}};
 const lead=await runSourceResearch(env,{source_key:"knightfall"});
 assert.match(lead.title,/indie horror/);
 assert.equal(lead.source_url,"https://ash-fall.com/thread.html?id=71");
 assert.match(lead.body,/unverified discovery lead/);
 assert.equal(queries.length,1);
 assert.match(queries[0],/t\.deleted_at IS NULL/);
 assert.match(queries[0],/c\.slug NOT IN \('adults-only'\)/);
 assert.doesNotMatch(queries[0],/\bmessages\b|\bjournals\b|\bprivate\b/);
 assert.doesNotMatch(lead.body,/member_email|private chat/);
});

test("GOD master pause is durable and blocks AI execution, manual research and scheduled work",async()=>{
 const f=fixture();
 const mission=await f.call(base+"/missions","POST",{
  division:"agents",agent_key:"chaos-01",kind:"research",source_key:"knightfall",
  instructions:"Find public community discussion starters"});
 const id=(await mission.json()).id;
 const locked=await f.call(base+"/control","POST",{paused:true});
 assert.equal(locked.status,200);
 assert.equal(f.paused.value,1);
 assert.equal((await f.call(base+"/control")).status,200);
 assert.equal((await f.call(base+"/missions/"+id+"/run","POST")).status,423);
 f.env.AI={run:async()=>{throw Error("Model should not be called when GOD paused")}};
 assert.equal((await f.call(base+"/missions/"+id+"/draft","POST")).status,423);
 assert.deepEqual(await runEyeChaosScheduledResearch(f.env),{executed:0,reason:"god_paused"});
 assert.equal((await f.call(base+"/control","POST",{paused:"false"})).status,400);
 assert.equal((await f.call(base+"/control","POST",{paused:false})).status,200);
 assert.equal(f.paused.value,0);
 assert.deepEqual(f.events.filter(x=>x.object_type==="system").map(x=>x.action),["master_pause","master_resume"]);
 const unauthorized=fixture("moderator");
 assert.equal((await unauthorized.call(base+"/control","POST",{paused:true})).status,403);
});


test("accepted admin partner may approve and reject reviewed drafts, but cannot touch GOD master lock",async()=>{
 const f=fixture("admin",true,true);
 const status=await f.call(base+"/status");
 const data=await status.json();
 assert.equal(data.permissions.can_approve,true);
 assert.equal(data.permissions.can_control,false);
 assert.equal(data.permissions.can_view_god_tools,false);
 const draft={division:"agents",author_key:"chaos-18",title:"Review this original draft",body:"A source-linked original example.",source_url:"https://www.billboard.com/feed/",destination:"Madhouse"};
 const created=await f.call(base+"/drafts","POST",draft);
 assert.equal(created.status,201);
 const id=(await created.json()).id;
 assert.equal((await f.call(base+"/drafts/"+id+"/approve","POST")).status,200);
 assert.equal(f.drafts.get(id).approved_by,11);
 assert.equal((await f.call(base+"/drafts/"+id+"/reject","POST")).status,200);
 const lock=await f.call(base+"/control","POST",{paused:true});
 assert.equal(lock.status,403);
 assert.equal(f.paused.value,0);
 const independent=fixture("admin",true,false);
 assert.equal((await independent.call(base+"/status").then(r=>r.json())).permissions.can_approve,false);
 const rejected=await independent.call(base+"/drafts/12345678-1234-1234-1234-123456789abc/approve","POST");
 assert.equal(rejected.status,403);
 assert.equal(independent.queries.some(q=>q.sql.includes("UPDATE eye_chaos_drafts")),false);
});
