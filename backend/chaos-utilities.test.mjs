import test from "node:test";
import assert from "node:assert/strict";
import {dispatchChaosTool,describeChaosTools} from "./chaos-tool-dispatch.mjs";
test("calculator respects precedence",async()=>{
  const r=await dispatchChaosTool({name:"utility.calculate",input:{expression:"2+3*4"}});
  assert.equal(r.result,14);
});
test("calculator rejects code",async()=>{
  await assert.rejects(dispatchChaosTool({name:"utility.calculate",input:{expression:"globalThis.alert(1)"}}));
});
test("word count returns metrics",async()=>{
  const r=await dispatchChaosTool({name:"utility.word_count",input:{text:"one two three"}});
  assert.equal(r.words,3);
});
test("public utilities are discoverable",()=>{
  const names=describeChaosTools(null);
  assert.ok(names.includes("utility.calculate")&&names.includes("utility.word_count"));
});

test("calculator bounds nesting and malformed expressions",async()=>{
  await assert.rejects(dispatchChaosTool({name:"utility.calculate",input:{expression:"(".repeat(21)+"1"+")".repeat(21)}}));
  await assert.rejects(dispatchChaosTool({name:"utility.calculate",input:{expression:"2++"}}));
});
