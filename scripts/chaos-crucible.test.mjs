import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {CRUCIBLE_KINDS,CRUCIBLE_FIELD_LIMITS,buildCrucibleBrief} from "../public/chaos-crucible-core.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const sample=(kind,extra={})=>({
 kind,title:"The original creation",goal:"Build a complete and testable idea",
 known:"Confirmed reference notes",
 first:"Actual dimensions or observed conditions",
 second:"Audience and output requirements",
 constraints:"No paid tools and no fabricated outcomes",...extra
});
test("Crucible supports six distinct creator disciplines with real verification gates",()=>{
 assert.deepEqual(Object.keys(CRUCIBLE_KINDS),["character","tattoo","code","craft","story","game"]);
 for(const kind of Object.keys(CRUCIBLE_KINDS)){
  const result=buildCrucibleBrief(sample(kind));
  assert.equal(result.ok,true,kind);
  assert.equal(result.missing.length,0,kind);
  assert.equal(result.checklist.length,5,kind);
  assert.ok(result.markdown.includes(CRUCIBLE_KINDS[kind].first),kind);
  assert.ok(result.markdown.includes(CRUCIBLE_KINDS[kind].second),kind);
  assert.ok(result.markdown.includes("not yet executed"),kind);
  assert.ok(result.markdown.includes(CRUCIBLE_KINDS[kind].destination),kind);
  assert.ok(result.aiPrompt.length<=4000,kind);
  assert.match(result.aiPrompt,/Do not post or modify anything/);
 }
});
test("Uncertain information is explicitly requested rather than made up",()=>{
 const result=buildCrucibleBrief({kind:"craft",title:"Fabric demon",goal:"Sew a plush mascot"});
 assert.equal(result.ok,true);
 assert.equal(result.missing.length,4);
 assert.ok(result.markdown.includes("Not provided; ask before assuming"));
 assert.ok(result.markdown.includes("Clarify Measurements, material and construction type"));
 assert.ok(result.markdown.includes("All measurements, implementations and results require independent verification."));
});
test("Do not silently trim user fields or exceed backend memo/composer budget",()=>{
 assert.equal(buildCrucibleBrief({kind:"x",title:"X",goal:"X"}).ok,false);
 assert.equal(buildCrucibleBrief({kind:"craft",title:"",goal:"Y"}).ok,false);
 for(const [name,max] of Object.entries(CRUCIBLE_FIELD_LIMITS)){
  assert.equal(buildCrucibleBrief(sample("code",{[name]:"x".repeat(max+1)})).ok,false,name);
 }
 const maxed={kind:"tattoo"};
 for(const [key,max] of Object.entries(CRUCIBLE_FIELD_LIMITS))maxed[key]="x".repeat(max);
 const full=buildCrucibleBrief(maxed);
 assert.equal(full.ok,true);
 assert.ok(full.aiPrompt.length<=4000);
 assert.ok(full.markdown.length<=4000);
 assert.equal(full.markdown.includes("x".repeat(CRUCIBLE_FIELD_LIMITS.known)),true);
});
test("App uses text-only preview, local drafts, explicit memo save and no automatic AI sends",()=>{
 const html=read("public/chaos-crucible.html");
 const js=read("public/chaos-crucible.mjs");
 const popup=read("public/miss-chaos-presence.js");
 const kit=read("public/miss-chaos-field-kit.mjs");
 assert.match(html,/id="crucible-form"/);
 assert.match(html,/id="crucible-ask"/);
 assert.match(html,/id="crucible-download"/);
 assert.match(html,/id="crucible-save"/);
 assert.match(html,/chaos-crucible\.mjs\?v=20\d{6}-/);
 assert.match(js,/preview\.textContent=result\.markdown/);
 assert.doesNotMatch(js,/\.innerHTML\s*=/);
 assert.match(js,/valuesByKind=new Map/);
 assert.match(js,/checkedByKind=new Map/);
 assert.match(js,/method:"POST",credentials:"include"/);
 assert.match(js,/\/api\/memos/);
 assert.match(js,/new CustomEvent\("kf:miss-chaos:compose"/);
 assert.match(js,/if\(detail\.handled\)/);
 assert.match(popup,/window\.addEventListener\("kf:miss-chaos:compose"/);
 assert.match(popup,/if\(busy\).*detail\.error/);
 assert.match(popup,/detail\.handled=true/);
 assert.match(kit,/crucible\.href="\/chaos-crucible\.html"/);
 assert.doesNotMatch(js,/\/api\/chaos\/chat/);
});
