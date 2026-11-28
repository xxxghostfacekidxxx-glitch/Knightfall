import test from "node:test";
import assert from "node:assert/strict";
import {generateVector,imageCatalog} from "../backend/chaos-forge-image.mjs";
import {neuralImage,IMAGE_MODEL} from "../backend/chaos-forge-neural-image.mjs";
test("all image motifs and palettes generate bounded deterministic SVG without markup injection",()=>{
 const c=imageCatalog();let count=0;
 for(const motif of c.motifs)for(const palette of c.palettes)for(const seed of [0,66,4294967295]){
  const input={motif,palette,width:1024,height:768,seed,title:'<script>alert("x")</script>'},a=generateVector(input);
  assert.equal(a.content,generateVector(input).content);assert.ok(Buffer.byteLength(a.content)<=32768);
  assert.match(a.content,/^<svg /);assert.match(a.content,/<\/svg>$/);assert.ok(!a.content.includes("<script>"));assert.match(a.content,/&lt;script&gt;/);
  assert.equal(a.report.externalInference,false);count++;
 }
 assert.equal(count,75);
 assert.notEqual(generateVector({motif:"mountains"}).content,generateVector({motif:"eclipse"}).content);
 assert.notEqual(generateVector({seed:1}).content,generateVector({seed:2}).content);
 for(const bad of [{motif:"<script>"},{palette:"constructor"},{seed:-1},{width:999},{title:"bad\u0000title"}])assert.throws(()=>generateVector(bad));
});
test("neural adapter requires explicit confirmation, reserves daily attempts and rejects invalid responses",async()=>{
 let attempts=0,calls=0;
 const fixture=Buffer.from([255,216,255,0,0,0,0,0,0,0,255,217]).toString("base64");
 const env={DB:{prepare(){return{bind(){return this},async first(){return attempts<3?{attempts:++attempts}:null}}}},AI:{async run(model,p){calls++;assert.equal(model,IMAGE_MODEL);assert.equal(p.steps,4);return {image:fixture};}}};
 await assert.rejects(neuralImage(env,7,{prompt:"A landscape",confirmProvider:false}),/Confirm/);
 assert.equal(calls,0);
 for(let i=1;i<=3;i++){const r=await neuralImage(env,7,{prompt:"A landscape",confirmProvider:true});assert.equal(r.externalInference,true);assert.equal(r.attemptsToday,i);}
 await assert.rejects(neuralImage(env,7,{prompt:"A landscape",confirmProvider:true}),/Daily limit/);
 assert.equal(calls,3);
 attempts=0;env.AI.run=async()=>({image:"AAAAAAAAAAAAAAAA"});
 await assert.rejects(neuralImage(env,7,{prompt:"A landscape",confirmProvider:true}),/unsupported image/);
});
