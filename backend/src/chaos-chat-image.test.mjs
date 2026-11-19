import test from "node:test";
import assert from "node:assert/strict";
import {validateChaosChatImage,inspectChaosChatImage} from "./chaos-chat-image.js";
import {readFileSync} from "node:fs";
const good="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9bUjwAAAAASUVORK5CYII=";
test("chat vision validates compressed image bytes, MIME and fixed size before any AI call",()=>{
 const parsed=validateChaosChatImage(good);
 assert.equal(parsed.format,"png");
 assert.ok(parsed.bytes>16);
 for(const invalid of ["",null,"file:///etc/passwd","data:image/svg+xml;base64,PHN2Zy8+",
  "data:image/jpeg;base64,"+good.split(",")[1],
  "data:image/png;base64,***","data:image/png;base64,"+"A".repeat(900010)]){
  assert.throws(()=>validateChaosChatImage(invalid));
 }
});
test("vision uses the existing Cloudflare model and never pretends to store original image",async()=>{
 let calls=0,last=null;
 const ai={async run(model,payload){
  calls++;last={model,payload};return {answer:"A pink bat graphic on dark paper."};
 }};
 const result=await inspectChaosChatImage({ai,image:good,question:"How can I adapt this into a tattoo?"});
 assert.equal(calls,1);
 assert.equal(last.model,"@cf/moondream/moondream3.1-9B-A2B");
 assert.equal(last.payload.image,good);
 assert.match(last.payload.question,/untrusted reference material/);
 assert.match(last.payload.question,/tattoo/);
 assert.equal(result.summary,"A pink bat graphic on dark paper.");
 assert.equal(result.stored,false);
 assert.match(result.notice,/not saved/);
});
test("vision rejects unavailable or empty models without inventing a description",async()=>{
 await assert.rejects(inspectChaosChatImage({ai:null,image:good}),/not available/);
 await assert.rejects(inspectChaosChatImage({ai:{run:async()=>({answer:""})},image:good}),/no usable description/);
 await assert.rejects(inspectChaosChatImage({ai:{run:async()=>{throw Error("provider down")}},image:good}),/temporarily unavailable/);
});
test("chat route only accepts explicit signed-in uploads on controlled origin and never saves raw bytes",()=>{
 const index=readFileSync(new URL("index.js",import.meta.url),"utf8");
 const route=index.slice(index.indexOf('if(url.pathname==="/api/chaos/chat"'),index.indexOf('if(url.pathname==="/api/chaos/chat"')+5800);
 assert.match(route,/980000/);
 assert.match(route,/reader\.read\(\)/);
 assert.match(route,/ALLOWED_ORIGINS\.has\(request\.headers\.get\("Origin"\)\)/);
 assert.match(route,/chaos-chat-vision",4,3600,user\.id/);
 assert.match(route,/inspectChaosChatImage/);
 assert.match(route,/raw image not saved/);
 assert.doesNotMatch(route,/\b(?:R2|KV)\.put\s*\(/);
});
