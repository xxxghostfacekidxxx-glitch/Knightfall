import test from "node:test";
import assert from "node:assert/strict";
import {buildChaosPalette,lookupChaosDictionary} from "./chaos-extra-tools.mjs";
import {dispatchChaosTool,describeChaosTools} from "./chaos-tool-dispatch.mjs";
import {inferWithChaosTools,runChaosModelCalls} from "./chaos-model-tools.mjs";

test("free palette is deterministic with 5 opaque accessible swatches",async()=>{
 for(const mode of ["analogous","complementary","triadic","monochrome"]){
  const one=await dispatchChaosTool({name:"design.palette_build",input:{seed:"#b25b68",mode}});
  const two=buildChaosPalette({seed:"#b25b68",mode});
  assert.deepEqual(one,two);
  assert.equal(one.colors.length,5);
  assert.ok(one.colors.every(x=>/^#[A-F0-9]{6}$/.test(x.hex)&&x.heading_text_contrast>=4.5));
  assert.match(one.css_tokens,/--chaos-color-1:/);
 }
 assert.deepEqual(buildChaosPalette({seed:"#abc"}).seed,"#AABBCC");
 assert.ok(describeChaosTools().includes("design.palette_build"));
 await assert.rejects(dispatchChaosTool({name:"design.palette_build",input:{seed:"url(javascript:alert())"}}),/opaque/);
 assert.throws(()=>buildChaosPalette({seed:"#fff",mode:"rainbow"}),/Choose/);
});

test("dictionary fixed host, sanitized bounded definitions and attribution",async()=>{
 let requested;
 const sample=[{word:"chaos",phonetic:"/ˈkeɪ.ɒs/",meanings:[{partOfSpeech:"noun",
  definitions:[{definition:"Complete disorder and confusion.",example:"Chaos ensued."}],synonyms:["disorder","confusion"]}]}];
 const data=await lookupChaosDictionary({word:"Chaos"},{fetcher:async (url,options)=>{
  requested={url,options};return Response.json(sample);
 }});
 assert.equal(requested.url,"https://api.dictionaryapi.dev/api/v2/entries/en/chaos");
 assert.equal(requested.options.redirect,"error");
 assert.equal(data.available,true);
 assert.equal(data.entries[0].definitions[0].meaning,"Complete disorder and confusion.");
 assert.match(data.source_url,/wiktionary.org\/wiki\/chaos/);
 assert.match(data.attribution,/CC BY-SA/);
 assert.ok(describeChaosTools().includes("research.dictionary"));
 const missing=await lookupChaosDictionary({word:"xyz"},{fetcher:async()=>new Response("",{status:404})});
 assert.equal(missing.available,false);
 await assert.rejects(lookupChaosDictionary({word:"xyz"},{fetcher:async()=>new Response("",{status:429})}),/rate-limited/);
 for(const word of ["https://evil.com","a@b","multi words","","a".repeat(70)])
  await assert.rejects(lookupChaosDictionary({word}),/one English word/);
});

test("models can directly route obvious define and palette requests without extra planner",async()=>{
 const called=[];
 const ai={run:async(_model,payload)=>{called.push(payload);return {response:"Here are verified results."};}};
 const handlers={"research.dictionary":async()=>({source:"mocked dictionary",entries:[{definition:"A test"}]}),
  "design.palette_build":async()=>({source:"mocked local color harmony",colors:["#000000"]})};
 for(const prompt of ["Define chaos","Make a complementary color palette from #f00"]){
  await inferWithChaosTools({ai,model:"mock",messages:[{role:"user",content:prompt}],principal:null,handlers});
 }
 assert.equal(called.length,2);
 assert.match(JSON.stringify(called[0].messages),/mocked dictionary/);
 assert.match(JSON.stringify(called[1].messages),/mocked local color harmony/);
 const [memberResult]=await runChaosModelCalls([{name:"design.palette_build",arguments:{seed:"#f00"}}],null,handlers);
 assert.equal(memberResult.name,"design.palette_build");
});
