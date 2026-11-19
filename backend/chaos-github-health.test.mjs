import test from "node:test";
import assert from "node:assert/strict";
import {getKnightfallGithubHealth} from "./chaos-github-health.mjs";
import {dispatchChaosTool,describeChaosTools} from "./chaos-tool-dispatch.mjs";
import {inferWithChaosTools} from "./chaos-model-tools.mjs";
const response=()=>({ok:true,json:async()=>({workflow_runs:[
 {id:110,name:"Miss Chaos Tests",head_branch:"main",status:"completed",conclusion:"success",head_sha:"a".repeat(40),created_at:"2026-11-19T07:00:00Z"},
 {id:111,name:"Knightfall Ownership Audit",head_branch:"main",status:"completed",conclusion:"failure",head_sha:"b".repeat(40),created_at:"2026-11-19T07:05:00Z"},
 {id:112,name:"Other branch",head_branch:"dev",status:"completed",conclusion:"failure"},
 {id:113,name:"Suspicious",head_branch:"main",status:"completed",conclusion:"failure",html_url:"https://evil.example/"}
]})});
test("Fixed GitHub health endpoint uses public read-only GET and grounded repo URLs",async()=>{
 let checked;
 const health=await getKnightfallGithubHealth({fetcher:async(url,opts)=>{checked=new URL(url);assert.equal(opts.method,"GET");return response();}});
 assert.equal(checked.hostname,"api.github.com");
 assert.equal(checked.pathname,"/repos/xxxghostfacekidxxx-glitch/Knightfall/actions/runs");
 assert.equal(checked.searchParams.get("branch"),"main");
 assert.equal(health.checked_count,3);
 assert.equal(health.failed_count,2);
 assert.equal(health.workflows[1].url,"https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/runs/111");
 assert.equal(health.owner_approval_required,true);
 assert.equal(health.no_code_modified,true);
 assert.match(health.repair_proposals[0].recommended_action,/Do not weaken/);
});
test("Public GitHub failures do not fabricate workflow results",async()=>{
 await assert.rejects(getKnightfallGithubHealth({fetcher:async()=>({ok:false,status:403})}),/rate-limited/);
 await assert.rejects(getKnightfallGithubHealth({fetcher:async()=>({ok:true,json:async()=>({})})}),/invalid workflow/);
});
test("Only verified GOD role can retrieve owner diagnostics",async()=>{
 const handlers={"god.github_health":async()=>getKnightfallGithubHealth({fetcher:async()=>response()})};
 assert.ok(!describeChaosTools({id:3,role:"member"}).includes("god.github_health"));
 assert.ok(describeChaosTools({id:1,role:"god"}).includes("god.github_health"));
 await assert.rejects(dispatchChaosTool({name:"god.github_health",input:{},principal:{id:3,role:"member"},handlers}),/Not authorized/);
 const result=await dispatchChaosTool({name:"god.github_health",input:{},principal:{id:1,role:"god"},handlers});
 assert.equal(result.checked_count,3);
});
test("Owner explicit GitHub status request bypasses planner with trusted data",async()=>{
 let count=0,last;
 const ai={run:async(_,opts)=>{count++;last=opts;return{response:"Here are checks."};}};
 const handlers={"god.github_health":async()=>({source:"mock",workflows:[{name:"Miss Chaos Tests",conclusion:"success"}]})};
 await inferWithChaosTools({ai,model:"fast",messages:[{role:"system",content:"BASE"},
  {role:"user",content:"Check Knightfall GitHub workflow status"}],principal:{id:1,role:"god"},handlers});
 assert.equal(count,1);
 assert.match(last.messages[0].content,/Miss Chaos Tests/);
});
