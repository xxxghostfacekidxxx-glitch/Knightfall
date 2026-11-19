import test from "node:test";
import assert from "node:assert/strict";
import {listKnightfallFiles} from "./chaos-repo-index.mjs";
import {describeChaosTools,dispatchChaosTool} from "./chaos-tool-dispatch.mjs";
import {inferWithChaosTools} from "./chaos-model-tools.mjs";
const commit="d".repeat(40),api="https://api.github.com/repos/xxxghostfacekidxxx-glitch/Knightfall";
const fixtures=[
 {type:"file",path:"backend/src/chaos-companion.mjs",name:"chaos-companion.mjs",size:2000,sha:"a".repeat(40)},
 {type:"file",path:"backend/src/chaos-route.js",name:"chaos-route.js",size:500,sha:"b".repeat(40)},
 {type:"file",path:"backend/src/secrets.json",name:"secrets.json",size:100},
 {type:"file",path:"backend/src/test.png",name:"test.png",size:700},
 {type:"dir",path:"backend/src/internal",name:"internal"}
];
const fetcher=async url=>{
 if(url===api+"/git/ref/heads/main")return Response.json({ref:"refs/heads/main",object:{type:"commit",sha:commit}});
 if(url===api+"/contents/backend/src?ref="+commit)return Response.json(fixtures);
 throw Error("Unexpected URL "+url);
};
test("verified staff source listing is immutable, shallow, filtered and excludes secrets",async()=>{
 const data=await listKnightfallFiles({directory:"backend/src",query:"chaos"},{fetcher});
 assert.equal(data.branch,"main");
 assert.equal(data.commit_sha,commit);
 assert.deepEqual(data.results.map(x=>x.path),["backend/src/chaos-companion.mjs","backend/src/chaos-route.js"]);
 assert.equal(data.matched,2);
 assert.equal(data.results[0].size_bytes,2000);
 assert.match(data.source_url,/\/tree\/dddd/);
 assert.equal(data.read_only,true);
});
test("directory escapes and invalid ref fail closed",async()=>{
 for(const dir of ["../backend","backend/.env","public/../../","https://evil.com",".github/secrets"])
  await assert.rejects(listKnightfallFiles({directory:dir},{fetcher}),/allowlisted/);
 await assert.rejects(listKnightfallFiles({directory:"backend/src",query:"a".repeat(80)},{fetcher}),/short source-file/);
 await assert.rejects(listKnightfallFiles({directory:"backend/src"},{fetcher:async()=>Response.json({ref:"refs/heads/main",object:{sha:"bad",type:"commit"}})}),/unavailable/);
});
test("staff source index is only visible to server-authenticated staff",async()=>{
 assert.ok(!describeChaosTools(null).includes("staff.source_files"));
 assert.ok(!describeChaosTools({id:2,role:"member"}).includes("staff.source_files"));
 assert.ok(describeChaosTools({id:2,role:"admin"}).includes("staff.source_files"));
 assert.ok(describeChaosTools({id:2,role:"god"}).includes("staff.source_files"));
 await assert.rejects(dispatchChaosTool({name:"staff.source_files",input:{directory:"backend/src"},principal:{id:2,role:"member"}}),/Not authorized/);
});
test("Miss Chaos can directly find modules without running a remote optional planner",async()=>{
 const calls=[];
 const ai={run:async(_,options)=>{calls.push(options);return {response:"Located files."};}};
 await inferWithChaosTools({ai,model:"test",messages:[{role:"user",content:"List files in backend/src for chaos"}],
  principal:{id:42,role:"admin"},handlers:{"staff.source_files":async()=>({results:[{path:"backend/src/chaos-companion.mjs"}]})}});
 assert.equal(calls.length,1);
 assert.match(JSON.stringify(calls[0].messages),/chaos-companion.mjs/);
});
