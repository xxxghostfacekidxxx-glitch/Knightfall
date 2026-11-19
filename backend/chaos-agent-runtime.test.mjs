import test from "node:test";
import assert from "node:assert/strict";
import {createChaosAgentHandlers} from "./chaos-agent-handlers.mjs";
import {inferWithChaosTools,runChaosModelCalls} from "./chaos-model-tools.mjs";
import {describeChaosTools} from "./chaos-tool-dispatch.mjs";

const rows=[
 {memory:"I love arcade games",category:"preference",updated_at:"2026-11-01"},
 {memory:"Someone else's secret",category:"personal",updated_at:"2026-10-01"}
];
const memoRows=[{id:21,title:"My arcade fixes",body:"Repair the black screens",updated_at:"2026-11-01"}];
function setup(){
  const sqlLog=[];
  const env={DB:{prepare(sql){return{bind(id){sqlLog.push({sql,id});return this},async all(){return{results:sql.includes("chaos_memories")?rows:memoRows}}}}}};
  return {sqlLog,handlers:createChaosAgentHandlers({
    env,arcadePicks:args=>({kind:"arcade",args}),
    moonBrief:()=>({kind:"moon",phase:"new"}),
    shadowBrief:topic=>({kind:"shadow",topic}),
    readGodAuditSummary:async({principal})=>({role:principal.role,total:3})
  })};
}
test("registered real tools are discoverable to signed-in users only",()=>{
  assert.ok(describeChaosTools({id:42,role:"member"}).includes("user.notes"));
  assert.ok(!describeChaosTools(null).includes("user.notes"));
  assert.ok(describeChaosTools({id:42,role:"god"}).includes("god.audit_summary"));
});
test("AI can use own memory and memo titles through session-scoped D1",async()=>{
  const {handlers,sqlLog}=setup();
  const principal={id:42,role:"member"};
  const results=await runChaosModelCalls([
    {name:"user.memories",arguments:{query:"arcade"}},
    {name:"user.notes",arguments:{query:"arcade"}}
  ],principal,handlers);
  assert.equal(results[0].result.results.length,1);
  assert.equal(results[1].result.results[0].title,"My arcade fixes");
  assert.equal(results[1].result.results[0].preview,"Repair the black screens");
  assert.deepEqual(sqlLog.map(x=>x.id),[42,42]);
  assert.ok(sqlLog.every(x=>/user_id=\?/.test(x.sql)));
});
test("non-GOD user cannot get GOD diagnostics",async()=>{
  const {handlers}=setup();
  await assert.rejects(runChaosModelCalls([{name:"god.audit_summary",arguments:{}}],{id:42,role:"member"},handlers),/authorized/);
  const res=await runChaosModelCalls([{name:"god.audit_summary",arguments:{}}],{id:1,role:"god"},handlers);
  assert.equal(res[0].result.total,3);
});
test("arcade, moon and shadow work tools return real wired results",async()=>{
  const {handlers}=setup();
  const r=await runChaosModelCalls([
    {name:"site.games",arguments:{query:"puzzle",device:"touch",length:"mini"}},
    {name:"radar.moon",arguments:{}},
    {name:"radar.shadow",arguments:{topic:"boundaries"}}
  ],{id:2,role:"member"},handlers);
  assert.equal(r[0].result.args.device,"touch");
  assert.equal(r[1].result.kind,"moon");
  assert.equal(r[2].result.topic,"boundaries");
});
test("streaming and regular replies both receive verified tool data",async()=>{
  for(const stream of [false,true]){
    const {handlers}=setup();const calls=[];
    const ai={run:async(model,options)=>{
      calls.push({model,options});
      if(options.tools)return{tool_calls:[{name:"user.notes",arguments:{query:"arcade"}}]};
      return stream?{getReader:()=>({})}:{response:"Here are your notes."};
    }};
    const reply=await inferWithChaosTools({ai,model:"fast",messages:[{role:"system",content:"system"},{role:"user",content:"locate arcade notes context"}],principal:{id:4,role:"member"},handlers,stream});
    assert.equal(calls.length,2);
    assert.ok(calls[1].options.messages[0].content.includes("My arcade fixes"));
    assert.equal(Boolean(calls[1].options.stream),stream);
    assert.ok(reply);
  }
});
test("tool failures do not become made-up success claims",async()=>{
  const ai={run:async(model,options)=>options.tools?{tool_calls:[{name:"god.audit_summary",arguments:{}}]}:{response:"fallback"}};
  const out=await inferWithChaosTools({ai,model:"fast",messages:[{role:"system",content:"x"},{role:"user",content:"audit site"}],principal:{id:3,role:"member"},handlers:setup().handlers});
  assert.equal(out.response,"fallback");
});

test("planner outage falls back to regular replies rather than breaking chat",async()=>{
  const ai={run:async (_model,opts)=>{if(opts.tools)throw Error("provider temporarily unreachable");return {response:"still here"};}};
  const out=await inferWithChaosTools({ai,model:"fast",messages:[{role:"user",content:"where is the arcade"}],principal:{id:2},handlers:setup().handlers});
  assert.equal(out.response,"still here");
});
test("explicit memo recall works even if the AI tool planner ignores tool calls",async()=>{
  const calls=[];
  const ai={run:async(_model,opts)=>{calls.push(opts);return opts.tools?{response:"ignored tools"}:{response:"I found your note"};}};
  const result=await inferWithChaosTools({ai,model:"fast",messages:[{role:"system",content:"base"},{role:"user",content:"find my notes about arcade"}],principal:{id:6,role:"member"},handlers:setup().handlers});
  assert.equal(result.response,"I found your note");
  assert.equal(calls.length,1,"direct note recall should not use an extra planning model");
  assert.ok(calls[0].messages[0].content.includes("My arcade fixes"));
});

import {wikipediaLookup,currentClock} from "./chaos-research.mjs";

test("public research only uses an encoded fixed Wikipedia endpoint",async()=>{
  let requested="";
  const fetcher=async (url,options)=>{
    requested=url;
    assert.equal(options.method,"GET");
    return {ok:true,json:async()=>({pages:[{title:"Mars",key:"Mars",excerpt:"<span>Mars</span> is a planet"}]})};
  };
  const r=await wikipediaLookup({query:"planet Mars"},{fetcher});
  assert.equal(new URL(requested).hostname,"en.wikipedia.org");
  assert.equal(new URL(requested).searchParams.get("q"),"planet Mars");
  assert.equal(r.results[0].url,"https://en.wikipedia.org/wiki/Mars");
  assert.match(r.results[0].excerpt,/Mars is a planet/);
  await assert.rejects(wikipediaLookup({query:"private@example.com"},{fetcher}),/public topic/);
});
test("current clock validates timezones",()=>{
  assert.equal(currentClock({timezone:"America/Chicago"}).timezone,"America/Chicago");
  assert.match(currentClock().now_utc,/Z$/);
  assert.throws(()=>currentClock({timezone:"Not/A_Zone"}));
});
test("shared handoff reader enforces the existing invitation and limits output",async()=>{
  const makeEnv=(userId)=>({DB:{prepare(sql){return{
    bind(){return this},
    async first(){
      if(sql.includes("sqlite_master"))return{n:4};
      if(sql.includes("FROM ai_handoff_partner p"))return{user_id:userId,status:"accepted",username:"authorized"};
      return null;
    },
    async all(){
      if(sql.includes("FROM ai_handoff_tasks"))return{results:[{id:11,title:"Fix arcade",details:"Check games",status:"todo",priority:"high"}]};
      if(sql.includes("FROM ai_handoff_notes"))return{results:[{category:"update",body:"Progress",created_at:"2026-11-18"}]};
      return{results:[]};
    }
  }}}});
  const mk=env=>createChaosAgentHandlers({env,arcadePicks:()=>({}),moonBrief:()=>({}),shadowBrief:()=>({}),readGodAuditSummary:async()=>({})});
  const owner=await runChaosModelCalls([{name:"user.handoff",arguments:{}}],{id:12,role:"member"},mk(makeEnv(12)));
  assert.equal(owner[0].result.tasks[0].title,"Fix arcade");
  const unauthorized=await runChaosModelCalls([{name:"user.handoff",arguments:{}}],{id:9,role:"member"},mk(makeEnv(12)));
  assert.equal(unauthorized[0].result.available,false);
  assert.equal(unauthorized[0].result.tasks,undefined);
});

test("flat and OpenAI-style serialized tool calls both execute with trusted account scope",async()=>{
  const {handlers,sqlLog}=setup();
  const principal={id:89,role:"member"};
  const calls=[
    {name:"user.notes",arguments:JSON.stringify({query:"arcade"})},
    {type:"function",function:{name:"user.memories",arguments:JSON.stringify({query:"arcade"})}}
  ];
  const got=await runChaosModelCalls(calls,principal,handlers);
  assert.equal(got[0].result.results[0].title,"My arcade fixes");
  assert.equal(got[1].result.results.length,1);
  assert.deepEqual(sqlLog.map(x=>x.id),[89,89]);
});
test("malformed provider tool payloads cannot execute a private query",async()=>{
  const {handlers,sqlLog}=setup();
  for(const raw of ["{}", "[]", "null", "garbage"]){
    if(raw==="{}")continue;
    await assert.rejects(runChaosModelCalls([{type:"function",function:{name:"user.notes",arguments:raw}}],{id:31},handlers));
  }
  assert.equal(sqlLog.length,0);
});

test("explicit book search bypasses optional planner and attributes grounded results",async()=>{
 const calls=[];
 const ai={run:async(_model,opts)=>{calls.push(opts);return{response:"Here are sources."};}};
 const handlers={"research.books":async({input})=>({source:"Open Library",results:[{title:"Design Book",url:"https://openlibrary.org/works/OL5W"}],query:input.query})};
 const reply=await inferWithChaosTools({ai,model:"fast",messages:[{role:"system",content:"hello"},{role:"user",content:"Find books about costume design"}],principal:{id:4,role:"member"},handlers});
 assert.equal(reply.response,"Here are sources.");
 assert.equal(calls.length,1);
 assert.match(calls[0].messages[0].content,/Open Library/);
 assert.match(calls[0].messages[0].content,/OL5W/);
});
test("explicit paper lookup survives a downed tool planner",async()=>{
 const calls=[];
 const ai={run:async(_model,opts)=>{calls.push(opts);return{response:"metadata only"};}};
 const handlers={"research.papers":async()=>({source:"Crossref",results:[{url:"https://doi.org/10.1000/test"}]})};
 await inferWithChaosTools({ai,model:"fast",messages:[{role:"system",content:"base"},{role:"user",content:"Search research papers about fabric chemistry"}],principal:{id:7},handlers});
 assert.equal(calls.length,1);
 assert.match(calls[0].messages[0].content,/Crossref/);
});
test("natural language Forge sizes produce a measured, read-only draft",async()=>{
 const calls=[];
 const ai={run:async(_model,opts)=>{calls.push(opts);return{response:"Open the link."};}};
 const handlers={"forge.pattern_draft":async({input})=>({design_url:"https://ash-fall.com/chaos-forge.html?template=tote&width="+input.width_in,template:input.template,depth_in:input.depth_in})};
 await inferWithChaosTools({ai,model:"fast",messages:[{role:"system",content:"base"},{role:"user",content:"Draft a tote bag 16 x 18 x 4 seam 0.5"}],principal:{id:7},handlers});
 assert.equal(calls.length,1);
 assert.match(calls[0].messages[0].content,/width=16/);
 assert.match(calls[0].messages[0].content,/"depth_in":4/);
});
test("missing sizes are never invented by the direct Forge route",async()=>{
 const calls=[];
 const ai={run:async(_model,opts)=>{calls.push(opts);return{response:"What dimensions?"};}};
 const handlers={"forge.pattern_draft":async({input})=>({available:false,needs:["width_in","height_in","depth_in"],template:input.template})};
 await inferWithChaosTools({ai,model:"fast",messages:[{role:"system",content:"base"},{role:"user",content:"Make an apron pattern"}],principal:{id:7},handlers});
 assert.match(calls[0].messages[0].content,/height_in/);
 assert.equal(calls.length,1);
});

test("unread alerts tool is read-only and bound to the authenticated member",async()=>{
 const seen=[];
 const env={DB:{prepare(sql){return{bind(id){
   seen.push({sql,id});
   return {
     all:async()=>({results:[{id:9,kind:"message",title:"New message",body:"Your reply arrived",
       url:"/messages.html?conversation=11",created_at:"2026-11-18"}]}),
     first:async()=>({count:1})
   };
 }}}}};
 const handlers=createChaosAgentHandlers({env,arcadePicks:()=>({}),moonBrief:()=>({}),
   shadowBrief:()=>({}),readGodAuditSummary:async()=>({})});
 await assert.rejects(runChaosModelCalls([{name:"user.notifications",arguments:{}}],null,handlers),/authorized/);
 const result=await runChaosModelCalls([{name:"user.notifications",arguments:{}}],{id:47,role:"member"},handlers);
 assert.equal(result[0].result.unread_count,1);
 assert.equal(result[0].result.alerts[0].url,"/messages.html?conversation=11");
 assert.equal(result[0].result.read_only,true);
 assert.ok(seen.every(row=>row.id===47&&/user_id=\?/.test(row.sql)&&/^SELECT\b/.test(row.sql)));
 assert.equal(seen.length,2);
});
test("Miss Chaos can retrieve unread notices when the model ignores its tools",async()=>{
 const inputs=[];
 const ai={run:async(_model,opts)=>{
   inputs.push(opts);return opts.tools?{response:"ignored"}:{response:"A message is waiting."};
 }};
 const handlers={"user.notifications":async()=>({unread_count:1,alerts:[{title:"New message"}]})};
 await inferWithChaosTools({ai,model:"fast",principal:{id:47},
   messages:[{role:"system",content:"base"},{role:"user",content:"Show my unread notifications"}],handlers});
 assert.equal(inputs.length,1,"direct alerts should avoid an extra planning model");
 assert.match(inputs[0].messages[0].content,/New message/);
});

test("private profile and inbox readers remain tied to the verified account, without read mutations",async()=>{
 const queries=[];
 const env={DB:{prepare(sql){
   const call={sql,ids:[]};queries.push(call);
   return {bind(...ids){call.ids=ids;return this;},
     async first(){return {username:"maker",display_name:"Test Maker",bio:"Creates useful things",
       profile_visibility:"friends",avatar_url:"https://evil.invalid/tracker"};},
     async all(){return {results:[
       {id:12,kind:"direct",group_name:null,other_username:"friend",last_body:"Is your project done?",
         updated_at:"2026-11-18T20:00:00Z"},
       {id:13,kind:"group",group_name:"Developers",other_username:null,last_body:"Check the game patch",
         updated_at:"2026-11-18T21:00:00Z"}]};}
   };
 }}};
 const handlers=createChaosAgentHandlers({env,arcadePicks:()=>({}),moonBrief:()=>({}),
   shadowBrief:()=>({}),readGodAuditSummary:async()=>({})});
 for(const name of ["user.profile","user.inbox"])
   await assert.rejects(runChaosModelCalls([{name,arguments:{}}],null,handlers),/authorized/);
 const result=await runChaosModelCalls([
   {name:"user.profile",arguments:{}},{name:"user.inbox",arguments:{}}
 ],{id:77,role:"member"},handlers);
 assert.equal(result[0].result.profile.username,"maker");
 assert.equal(result[0].result.profile.avatar_url,null,"external image URLs are not echoed by account lookup");
 assert.equal(result[1].result.conversations[0].title,"@friend");
 assert.equal(result[1].result.conversations[1].title,"Developers");
 assert.equal(result[1].result.conversations[0].url,"/messages.html?conversation=12");
 assert.ok(result.every(x=>x.result.read_only===true));
 assert.deepEqual(queries.map(q=>q.ids),[[77],[77,77]]);
 assert.ok(queries.every(q=>/^SELECT\b/.test(q.sql)));
 assert.match(queries[1].sql,/JOIN conversation_members cm ON cm.conversation_id=c.id AND cm.user_id=\?/);
});
test("profile and inbox requests still get verified context if the planner returns no tool calls",async()=>{
 const outputs=[];
 const ai={run:async(_model,options)=>{outputs.push(options);
   return options.tools?{response:"no tool calls"}:{response:"here is a read-only preview"};}};
 const handlers={
   "user.profile":async()=>({profile:{username:"maker"}}),
   "user.inbox":async()=>({conversations:[{title:"Developers",url:"/messages.html?conversation=13"}]})
 };
 for(const question of ["Show my profile","Show my inbox"]){
   outputs.length=0;
   await inferWithChaosTools({ai,model:"fast",principal:{id:77,role:"member"},
     messages:[{role:"system",content:"base"},{role:"user",content:question}],handlers});
   assert.equal(outputs.length,1,"direct private reads should avoid the planning model");
   assert.match(outputs[0].messages[0].content,/READ-ONLY TOOL EVIDENCE/);
 }
});

test("Miss Chaos fabric tool returns a measured, bounded layout and costs, with no account access",async()=>{
 const r=await runChaosModelCalls([{name:"forge.material_estimate",arguments:{
   fabric_width_in:44,reserve_percent:10,cost_per_yard:10,
   pieces:[{name:"front",width_in:20,height_in:36,count:1},
    {name:"back",width_in:20,height_in:36,count:1}]
 }}],null,setup().handlers);
 assert.equal(r[0].result.estimated_yards,1.1);
 assert.equal(r[0].result.estimated_material_cost,11);
 assert.equal(r[0].result.piece_count,2);
 assert.match(r[0].result.limitations,/not an optimal/);
});
test("pattern drafts understand actual fabric width and reserve with direct no-planner routing",async()=>{
 const inputs=[];
 const ai={run:async(model,options)=>{inputs.push(options);return {response:"Your measured draft."};}};
 await inferWithChaosTools({ai,model:"fast",messages:[
  {role:"system",content:"base"},
  {role:"user",content:"Draft a tote bag 16 x 18 x 4 fabric width 44 inches reserve 10%"}
 ],principal:{id:7},handlers:setup().handlers});
 assert.equal(inputs.length,1);
 assert.match(inputs[0].messages[0].content,/"fabric_width_in":44/);
 assert.match(inputs[0].messages[0].content,/"reserve_percent":10/);
});
