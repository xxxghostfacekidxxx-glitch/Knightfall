import test from "node:test";
import assert from "node:assert/strict";
import {readKnightfallFile,validateKnightfallFileArgs} from "./chaos-repo-reader.mjs";
import {dispatchChaosTool,describeChaosTools} from "./chaos-tool-dispatch.mjs";
import {inferWithChaosTools,runChaosModelCalls} from "./chaos-model-tools.mjs";
import {readFileSync} from "node:fs";
const worker=readFileSync(new URL("./src/index.js",import.meta.url),"utf8");
const ui=readFileSync(new URL("../public/chaos-code-studio.js",import.meta.url),"utf8");
const page=readFileSync(new URL("../public/chaos-code-studio.html",import.meta.url),"utf8");
const sample=Array.from({length:130},(_,i)=>"const n"+(i+1)+" = "+(i+1)+";").join("\n");
const urlBase="https://raw.githubusercontent.com/xxxghostfacekidxxx-glitch/Knightfall/main/";
const read=(text=sample)=>new Response(text,{headers:{"Content-Type":"text/plain","Content-Length":String(new TextEncoder().encode(text).length)}});
test("source viewer only accepts bounded public Knightfall file paths and line ranges",()=>{
 assert.deepEqual(validateKnightfallFileArgs({path:"backend/src/eye-of-chaos.js",start_line:6,line_count:30}),
   {path:"backend/src/eye-of-chaos.js",start:6,count:30});
 for(const path of ["../.env","backend/.env","backend/../.github/workflows/ci.yml",
  "backend/secrets.json","public//index.js","https://evil.example/code.js","public/../../secret.json",
  "node_modules/index.js","docs/credentials.md",".github/other/job.yml","public/image.png"])
  assert.throws(()=>validateKnightfallFileArgs({path}),/public Knightfall source file/,path);
 for(const args of [{path:"public/nav.js",start_line:-2},{path:"public/nav.js",start_line:0},
   {path:"public/nav.js",line_count:81},{path:"public/nav.js",start_line:1.3}])
  assert.throws(()=>validateKnightfallFileArgs(args),/Start line/);
});
test("repo reader returns actual numbered source without ever selecting another repo or branch",async()=>{
 let requested;
 const result=await readKnightfallFile({path:"public/nav.js",start_line:5,line_count:3},{
  fetcher:async(url,opts)=>{requested={url,opts};return read();}
 });
 assert.equal(requested.url,urlBase+"public/nav.js");
 assert.equal(requested.opts.redirect,"error");
 assert.equal(result.available,true);
 assert.equal(result.start_line,5);
 assert.deepEqual(result.lines.map(x=>x.number),[5,6,7]);
 assert.equal(result.lines[0].text,"const n5 = 5;");
 assert.equal(result.total_lines,130);
 assert.equal(result.truncated,true);
 assert.match(result.source_url,/raw.githubusercontent.com/);
 assert.equal(result.branch,"main");
});
test("repo reader fails closed for unavailable files, large files and upstream failure",async()=>{
 const missing=await readKnightfallFile({path:"public/missing.js"},{
  fetcher:async()=>new Response("",{status:404})});
 assert.equal(missing.available,false);
 await assert.rejects(readKnightfallFile({path:"public/large.js"},{
  fetcher:async()=>new Response("x",{headers:{"content-length":"250000"}})}),/too large/);
 await assert.rejects(readKnightfallFile({path:"public/other.js"},{
  fetcher:async()=>{throw Error("token:PRIVATE");}}),/temporarily unreachable/);
 await assert.rejects(readKnightfallFile({path:"public/over.js"},{
  fetcher:async()=>read("x".repeat(150001))}),/150 KB limit/);
});
test("all staff tools are server-gated, and only staff sees them in model palette",async()=>{
 for(const role of ["member","moderator"]){
  assert.ok(!describeChaosTools({id:1,role}).includes("staff.repo_file"));
  await assert.rejects(dispatchChaosTool({name:"staff.repo_file",input:{path:"public/nav.js"},principal:{id:1,role}}),/Not authorized/);
  await assert.rejects(dispatchChaosTool({name:"staff.github_health",input:{},principal:{id:1,role}}),/Not authorized/);
 }
 await assert.rejects(dispatchChaosTool({name:"staff.repo_file",input:{path:"public/nav.js"}}),/Sign-in required/);
 for(const role of ["admin","god"]){
  assert.ok(describeChaosTools({id:2,role}).includes("staff.repo_file"));
  assert.ok(describeChaosTools({id:2,role}).includes("staff.github_health"));
  const [verified]=await runChaosModelCalls([{name:"staff.repo_file",arguments:{path:"public/nav.js"}}],
    {id:2,role},{ "staff.repo_file":async()=>({source:"verified",read_only:true})});
  assert.equal(verified.result.source,"verified");
 }
 await assert.rejects(runChaosModelCalls([{name:"staff.repo_file",arguments:{path:"public/nav.js"}}],
   {id:1,role:"member"}),/Tool not authorized/);
});
test("explicit staff source and CI review use one model call, never optional planner",async()=>{
 const out=[];
 const ai={run:async(_model,options)=>{out.push(options);return {response:"I reviewed the verified source."};}};
 const handlers={"staff.repo_file":async({input})=>({verified_file:input.path,source_url:urlBase+input.path}),
   "staff.github_health":async()=>({checked_count:4,failed_count:1,workflows:[{name:"tests",conclusion:"failure"}]})};
 await inferWithChaosTools({ai,model:"fast",principal:{id:2,role:"admin"},handlers,
  messages:[{role:"user",content:"Inspect public/miss-chaos.js lines 15-30"}]});
 assert.equal(out.length,1);
 assert.match(out[0].messages[0].content,/public\/miss-chaos.js/);
 out.length=0;
 await inferWithChaosTools({ai,model:"fast",principal:{id:2,role:"admin"},handlers,
  messages:[{role:"user",content:"Check Knightfall CI health"}]});
 assert.equal(out.length,1);
 assert.match(out[0].messages[0].content,/failed_count/);
});
test("direct utility and Studio provide source access without GitHub write controls",()=>{
 assert.match(worker,/"staff.repo_file","staff.github_health"/);
 assert.match(ui,/utility\("staff.repo_file"/);
 assert.match(ui,/utility\("staff.github_health"/);
 for(const id of ["studio-repo-path","studio-repo-start","studio-repo-read","studio-repo-output",
   "studio-repo-copy","studio-ci-check","studio-repo-status"])assert.ok(page.includes('id="'+id+'"'),id);
 assert.doesNotMatch(ui,/\.innerHTML\s*=/);
 assert.doesNotMatch(ui,/localStorage|sessionStorage/);
});
