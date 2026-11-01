import test from "node:test";
import assert from "node:assert/strict";
import {dispatchChaosTool,describeChaosTools} from "./chaos-tool-dispatch.mjs";

test("anonymous users only see public capabilities",()=>{
  assert.deepEqual(describeChaosTools(null),["site.help","site.games","site.search"]);
});
test("signed-in users do not see God Mode capabilities",()=>{
  const names=describeChaosTools({id:"member",role:"user"});
  assert.ok(names.includes("user.memories"));
  assert.ok(!names.includes("god.diagnostics"));
});
test("God Mode visibility is explicitly gated",()=>{
  assert.ok(describeChaosTools({id:"owner",role:"god"}).includes("god.propose_change"));
});
test("public tool dispatch works without identity",async()=>{
  const result=await dispatchChaosTool({name:"site.search",input:{query:"offline bots"}});
  assert.ok(result.results.some(page=>page.url==="/personal-bots-offline.html"));
});
test("private tools without handlers fail closed",async()=>{
  await assert.rejects(dispatchChaosTool({name:"user.memories",input:{},principal:{id:"member"}}),/not configured/);
});
test("normal users cannot execute God Mode tools",async()=>{
  await assert.rejects(dispatchChaosTool({name:"god.diagnostics",input:{},principal:{id:"member",role:"user"},handlers:{"god.diagnostics":async()=>({ok:true})}}),/Not authorized/);
});
