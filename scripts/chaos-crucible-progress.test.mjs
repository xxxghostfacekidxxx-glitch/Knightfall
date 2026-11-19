import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {CRUCIBLE_KINDS,buildCrucibleBrief,exportCrucibleKit} from "../public/chaos-crucible-core.mjs";
import {
 CRUCIBLE_WORKSPACE_SCHEMA,CRUCIBLE_PROGRESS_NOTE_LIMIT,
 validateCrucibleProgress,buildCrucibleProgress,prepareCrucibleHandoff,
 exportCrucibleWorkspace,parseCrucibleWorkspace
} from "../public/chaos-crucible-progress.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const sample=kind=>({
  kind,title:"Mini Villain's original game",goal:"Build a playable mobile-friendly creature encounter",
  known:"Touch controls and one stage verified",first:"Five-second gameplay loop",second:"Enemy evolution and save state",
  constraints:"No paid dependencies, no fake test results"
});
test("all six disciplines have live self-reported checkpoints and a meaningful next task",()=>{
 for(const kind of Object.keys(CRUCIBLE_KINDS)){
  const brief=buildCrucibleBrief(sample(kind));
  const state=buildCrucibleProgress(brief,{completed:[3,0],notes:"Sprites reviewed; touch controls untested"});
  assert.equal(state.total,5);
  assert.equal(state.completed,2);
  assert.equal(state.percent,40);
  assert.equal(state.nextStep,CRUCIBLE_KINDS[kind].steps[1]);
  assert.match(state.report,/self-reported; not independently verified/);
  assert.match(state.report,/Evidence and working notes/);
  assert.match(state.report,/\[x\]/);
  assert.match(state.report,/\[ \]/);
  assert.match(state.report,/work in progress/i);
  assert.deepEqual(state.progress.completed,[0,3]);
  const handoff=prepareCrucibleHandoff(brief,state.progress,true);
  assert.equal(handoff.ok,true,kind);
  assert.ok(handoff.prompt.includes(state.nextStep));
  assert.ok(handoff.prompt.includes("do not")||handoff.prompt.includes("Do not"));
  assert.ok(handoff.prompt.length<=4000);
 }
});
test("completed checklist never claims that independent acceptance tests actually passed",()=>{
 const brief=buildCrucibleBrief(sample("code"));
 const state=buildCrucibleProgress(brief,{completed:[0,1,2,3,4],notes:"Only local syntax checks performed"});
 assert.equal(state.percent,100);
 assert.equal(state.verified,true);
 assert.equal(state.nextStep,null);
 assert.match(state.report,/self-reported/);
 assert.match(state.report,/remain independently unverified/);
 assert.match(state.report,/Only local syntax checks performed/);
});
test("import preserves the entire v2 editable project, milestone state and notes",()=>{
 for(const kind of Object.keys(CRUCIBLE_KINDS)){
  const project=sample(kind);
  const progress={completed:[4,2],notes:"I checked this on my own device, not production."};
  const saved=exportCrucibleWorkspace(project,progress);
  assert.match(saved,/knightfall\.miss-chaos\.crucible\.v2/);
  const opened=parseCrucibleWorkspace(saved);
  assert.equal(opened.legacy,false);
  assert.deepEqual(opened.project,project);
  assert.deepEqual(opened.progress,{completed:[2,4],notes:progress.notes});
  assert.equal(buildCrucibleBrief(opened.project).ok,true);
  assert.ok(saved.length<12000);
 }
});
test("legacy v1 kits are importable with a blank and explicitly unknown checkpoint",()=>{
 const project=sample("craft");
 const opened=parseCrucibleWorkspace(exportCrucibleKit(project));
 assert.deepEqual(opened.project,project);
 assert.deepEqual(opened.progress,{completed:[],notes:""});
 assert.equal(opened.legacy,true);
});
test("reject duplicated, nonexistent, fractional or overflowing checkpoint data",()=>{
 for(const completed of [[1,1],[5],[-1],[1.5],["1"],[0,1,2,3,4,5]]){
  assert.throws(()=>validateCrucibleProgress({completed,notes:""},"game"),/milestones/);
 }
 assert.throws(()=>validateCrucibleProgress({completed:[],notes:7},"craft"),/notes/);
 assert.throws(()=>validateCrucibleProgress({completed:[],notes:"z".repeat(CRUCIBLE_PROGRESS_NOTE_LIMIT+1)},"code"),/notes/);
 assert.throws(()=>validateCrucibleProgress({}, "__proto__"),/discipline/);
 assert.throws(()=>parseCrucibleWorkspace("x".repeat(12001)),/12 KB/);
 assert.throws(()=>parseCrucibleWorkspace('{"schema":"unknown"}'),/version/);
 const bad=JSON.parse(exportCrucibleWorkspace(sample("story"),{completed:[],notes:""}));
 bad.progress.completed=[100];
 assert.throws(()=>parseCrucibleWorkspace(JSON.stringify(bad)),/milestones/);
});
test("long notes do not silently truncate or auto-send member private context",()=>{
 const brief=buildCrucibleBrief({
  kind:"tattoo",title:"x".repeat(100),goal:"x".repeat(240),
  known:"x".repeat(650),first:"x".repeat(350),
  second:"x".repeat(350),constraints:"x".repeat(450)
 });
 assert.equal(brief.ok,true);
 const result=prepareCrucibleHandoff(brief,{completed:[0],notes:"x".repeat(500)});
 assert.equal(result.ok,false);
 assert.match(result.error,/nothing was discarded/i);
 const app=read("public/chaos-crucible.mjs");
 const html=read("public/chaos-crucible.html");
 assert.match(app,/readProgress\(\)/);
 assert.match(app,/progressByKind/);
 assert.match(app,/prepareCrucibleHandoff/);
 assert.match(app,/parseCrucibleWorkspace\(await file\.text\(\)\)/);
 assert.match(app,/exportCrucibleWorkspace\(readFields\(\),readProgress\(\)\)/);
 assert.match(app,/new CustomEvent\("kf:miss-chaos:compose"/);
 assert.doesNotMatch(app,/\/api\/chaos\/chat/);
 for(const id of ["crucible-milestone-meter","crucible-milestone-fill","crucible-proof-notes","crucible-ask-next","crucible-next-step","crucible-open-tool"]){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
});
