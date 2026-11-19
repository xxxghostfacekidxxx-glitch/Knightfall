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

test("measurement conversions support sewing, carpentry, volume and temperatures",async()=>{
  const convert=async(value,from,to)=>(await dispatchChaosTool({name:"utility.convert",input:{value,from,to}})).result;
  assert.equal(await convert(1,"ft","cm"),30.48);
  assert.equal(await convert(2,"yd","in"),72);
  assert.equal(await convert(1,"ft2","in2"),144);
  assert.equal(await convert(32,"f","c"),0);
  assert.equal(await convert(0,"c","f"),32);
  assert.equal(await convert(1,"gal","l"),3.785411784);
});
test("conversion rejects incompatible dimensions, invalid values and impossible temperatures",async()=>{
  const convert=(value,from,to)=>dispatchChaosTool({name:"utility.convert",input:{value,from,to}});
  await assert.rejects(convert(1,"ft","kg"),/different measurement types/);
  await assert.rejects(convert(-2,"ft","cm"),/nonnegative/);
  await assert.rejects(convert(-300,"c","f"),/absolute zero/);
  await assert.rejects(convert(Infinity,"m","ft"),/finite/);
  await assert.rejects(convert(5,"prototype","kg"),/Unsupported/);
});
