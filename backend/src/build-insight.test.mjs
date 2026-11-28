import test from "node:test";
import assert from "node:assert/strict";
import {intakeRepository,safeSourcePath,sourcePriority,artifactDigest,handleBuildInsight} from "./build-insight.mjs";
const sha=c=>c.repeat(40),id="12345678-abcd-1234-abcd-123456789abc",base="/api/god/eye/tools/build-insight";
test("source paths reject traversal, secrets, network URLs and symlinks",()=>{for(const p of ["../x","src/../x","src/.env.local","src/.git/config","src/secrets.json","https://evil.test/a","x//y"])assert.equal(safeSourcePath(p),false,p);assert.equal(safeSourcePath("src/index.js"),true);assert.equal(sourcePriority("LICENSE"),5);});
test("source intake pins revision and fetches only bounded canonical GitHub blobs",async()=>{
 const source="export const answer=42;",blob={sha:sha("c"),size:source.length,encoding:"base64",content:Buffer.from(source).toString("base64")};
 const fetcher=async(url,options)=>{assert.equal(new URL(url).hostname,"api.github.com");assert.equal(options.redirect,"error");let data;const path=new URL(url).pathname;
 if(path==="/repos/owner/project")data={private:false,full_name:"owner/project",default_branch:"main",license:{spdx_id:"MIT"}};
 else if(path.endsWith("/commits/main"))data={sha:sha("a"),commit:{tree:{sha:sha("b")}}};
 else if(path.endsWith("/git/trees/"+sha("b")))data={tree:[{path:"index.js",type:"blob",mode:"100644",sha:sha("c"),size:source.length},{path:".env",type:"blob",mode:"100644",sha:sha("d"),size:1},{path:"link.js",type:"blob",mode:"120000",sha:sha("e"),size:1}]};
 else if(path.endsWith("/git/blobs/"+sha("c")))data=blob;else throw Error("Unexpected request "+path);return Response.json(data);};
 const result=await intakeRepository({repository:"https://github.com/owner/project",goal:"Build adapter"},{fetcher});assert.equal(result.revision,sha("a"));assert.equal(result.files.length,1);assert.equal(result.files[0].text,source);assert.equal(result.inventory.length,1);assert.equal(result.execution,"not-run");assert.equal(await artifactDigest(result),await artifactDigest(result));assert.notEqual(await artifactDigest({...result,goal:"different"}),await artifactDigest(result));
});
test("private repository metadata stops intake before fetching source",async()=>{let calls=0;await assert.rejects(intakeRepository({repository:"owner/project",goal:"test"},{fetcher:async()=>{calls++;return Response.json({private:true,full_name:"owner/project"});}}),/public repository/);assert.equal(calls,1);});
test("approval binds exact immutable digest and denies stale or foreign-origin requests",async()=>{
 const artifact={project:"owner/project",goal:"test",files:[],revision:sha("a")},digest=await artifactDigest(artifact);let value=JSON.stringify({id,state:"staged",artifact,digest}),writes=0;
 const env={DB:{prepare(sql){let args;return {bind(...p){args=p;return this;},async first(){return {value};},async run(){assert.match(sql,/AND value=\?/);assert.equal(args[4],value);value=args[0];writes++;return {meta:{changes:1}};}};}}};
 const url=new URL("https://api.ash-fall.com"+base+"/"+id+"/approve"),respond=(body,status=200)=>({body,status}),request=(d,origin="https://ash-fall.com")=>new Request(url,{method:"POST",headers:{origin,"Content-Type":"application/json"},body:JSON.stringify({digest:d})});
 assert.equal((await handleBuildInsight(request("a".repeat(64)),env,url,{id:1},respond)).status,409);
 assert.equal((await handleBuildInsight(request(digest,"https://evil.test"),env,url,{id:1},respond)).status,403);
 const approved=await handleBuildInsight(request(digest),env,url,{id:1},respond);assert.equal(approved.status,200);assert.equal(approved.body.item.state,"approved-for-development");assert.equal(writes,1);
 assert.equal((await handleBuildInsight(request(digest),env,url,{id:1},respond)).status,409);assert.equal(writes,1);
});
