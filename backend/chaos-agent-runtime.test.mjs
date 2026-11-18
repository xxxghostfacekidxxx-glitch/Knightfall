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
    const reply=await inferWithChaosTools({ai,model:"fast",messages:[{role:"system",content:"system"},{role:"user",content:"find my notes about arcade"}],principal:{id:4,role:"member"},handlers,stream});
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
  assert.ok(calls[1].messages[0].content.includes("My arcade fixes"));
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
  }}}}});
  const mk=env=>createChaosAgentHandlers({env,arcadePicks:()=>({}),moonBrief:()=>({}),shadowBrief:()=>({}),readGodAuditSummary:async()=>({})});
  const owner=await runChaosModelCalls([{name:"user.handoff",arguments:{}}],{id:12,role:"member"},mk(makeEnv(12)));
  assert.equal(owner[0].result.tasks[0].title,"Fix arcade");
  const unauthorized=await runChaosModelCalls([{name:"user.handoff",arguments:{}}],{id:9,role:"member"},mk(makeEnv(12)));
  assert.equal(unauthorized[0].result.available,false);
  assert.equal(unauthorized[0].result.tasks,undefined);
});
