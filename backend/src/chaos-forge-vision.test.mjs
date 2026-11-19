import test from "node:test";
import assert from "node:assert/strict";
import {handleChaosForgeVision} from "./chaos-forge-vision.js";
const json=(body,status=200)=>Response.json(body,{status});
const req=(image)=>new Request("https://api.ash-fall.com/api/chaos/forge/analyze",{method:"POST",headers:{"origin":"https://ash-fall.com","content-type":"application/json"},body:JSON.stringify({kind:"clothing",image,notes:"black denim jacket"})});
const helpers=(user,rateLimit=async()=>true)=>({requireUser:async()=>user,rateLimit,json,origin:"https://ash-fall.com"});
test("private image never persists and authorized calls invoke fixed vision model",async()=>{
 const calls=[];
 const env={AI:{run:async(...args)=>{calls.push(args);return{answer:"TEMPLATE: trace\nVISIBLE DETAILS: seams and a zipper. MEASUREMENTS NEEDED: chest."};}}};
 const result=await handleChaosForgeVision(req("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9bUjwAAAAASUVORK5CYII="),env,helpers({id:7}));
 assert.equal(result.status,200);
 const body=await result.json();
 assert.match(body.analysis,/seams/);
 assert.equal(body.stored,false);
 assert.equal(body.suggested_template,"trace");
 assert.match(calls[0][0],/moondream3.1/);
 assert.equal(calls[0][1].task,"query");
 assert.equal(calls[0][1].image,"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9bUjwAAAAASUVORK5CYII=");
 assert.match(calls[0][1].question,/black denim jacket/);
});
test("no session, wrong origin and invalid image fail before inference",async()=>{
 const env={AI:{run:()=>{throw Error("should not run")}}};
 assert.equal((await handleChaosForgeVision(req("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9bUjwAAAAASUVORK5CYII="),env,helpers(null))).status,401);
 const bad=new Request("https://api.ash-fall.com/api/chaos/forge/analyze",{method:"POST",headers:{origin:"https://evil.example"},body:"{}"});
 assert.equal((await handleChaosForgeVision(bad,env,helpers({id:7}))).status,403);
 assert.equal((await handleChaosForgeVision(req("https://evil.com/x.png"),env,helpers({id:7}))).status,400);
 assert.equal((await handleChaosForgeVision(req("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9bUjwAAAAASUVORK5CYII="),env,helpers({id:7},async()=>false))).status,429);
});

test("image sniffing rejects spoofed files before spending AI inference",async()=>{
 let calls=0;
 const env={AI:{run:async()=>{calls++;return {answer:"wrong"};}}};
 const fake="data:image/png;base64,"+btoa("This is not a PNG at all, just some arbitrary text");
 const result=await handleChaosForgeVision(req(fake),env,helpers({id:5}));
 assert.equal(result.status,400);
 assert.equal(calls,0);
});
test("unknown-length oversized uploads are stopped at the streamed byte limit",async()=>{
 let calls=0;
 const env={AI:{run:async()=>{calls++;return {answer:"wrong"};}}};
 const reqLarge=new Request("https://api.ash-fall.com/api/chaos/forge/analyze",{
   method:"POST",headers:{origin:"https://ash-fall.com"},
   body:new ReadableStream({start(controller){
      controller.enqueue(new Uint8Array(600000));
      controller.enqueue(new Uint8Array(600000));
      controller.close();
   }}),duplex:"half"
 });
 const result=await handleChaosForgeVision(reqLarge,env,helpers({id:5}));
 assert.equal(result.status,413);
 assert.equal(calls,0);
});
