import test from "node:test";
import assert from "node:assert/strict";
import {inspectChaosCode} from "./chaos-code-inspect.mjs";
import {findChaosGithubRepos} from "./chaos-github-repos.mjs";
import {inferWithChaosTools} from "./chaos-model-tools.mjs";
import {describeChaosTools} from "./chaos-tool-dispatch.mjs";

test("Acorn catches syntax errors without executing submitted JS",()=>{
 const bad=inspectChaosCode({code:"const a = ;"});
 assert.equal(bad.syntax_valid,false);assert.equal(bad.errors[0].line,1);
 const good=inspectChaosCode({code:"export const value = 42;"});
 assert.equal(good.syntax_valid,true);assert.ok(good.parsed_nodes>1);
 const risks=inspectChaosCode({code:"eval('hi'); document.write('x'); el.innerHTML = userInput;"});
 assert.equal(risks.syntax_valid,true);
 for(const rule of ["eval","document-write","inner-html"])assert.ok(risks.findings.some(f=>f.rule===rule));
});
test("JSON is validated without echoing input values",()=>{
 const v=inspectChaosCode({language:"json",code:'{"secret":"needle","items":[1,2]}'});
 assert.equal(v.syntax_valid,true);assert.equal(v.root_entries,2);
 assert.ok(!JSON.stringify(v).includes("needle"));
 assert.equal(inspectChaosCode({language:"json",code:"{"}).syntax_valid,false);
});
test("Code inspection fails closed on unsupported types and oversized bodies",()=>{
 assert.throws(()=>inspectChaosCode({language:"python",code:"print(1)"}),/JavaScript and JSON/);
 assert.throws(()=>inspectChaosCode({code:"a".repeat(11000)}),/10,000 bytes/);
});
test("GitHub repository search is fixed-host and returns only public licensed links",async()=>{
 let url;
 const data=await findChaosGithubRepos({query:"pixel animation"},{fetcher:async (u,o)=>{
  url=new URL(u);assert.equal(o.method,"GET");
  return {ok:true,json:async()=>({items:[
   {full_name:"sample/pixel-editor",description:"Pixel tools",private:false,archived:false,
    license:{spdx_id:"MIT"},stargazers_count:80,updated_at:"2026-10-01T00:00:00Z",language:"JavaScript"},
   {full_name:"bad//path",license:{spdx_id:"MIT"}},
   {full_name:"owner/unlicensed",license:null}
  ]})};
 }});
 assert.equal(url.hostname,"api.github.com");assert.equal(url.pathname,"/search/repositories");
 assert.equal(data.results.length,1);assert.equal(data.results[0].url,"https://github.com/sample/pixel-editor");
 assert.equal(data.results[0].license,"MIT");
});
test("GitHub search protects private details and unavailable providers",async()=>{
 await assert.rejects(findChaosGithubRepos({query:"test@example.com"},{fetcher:()=>{throw Error("unexpected fetch");}}),/public/);
 await assert.rejects(findChaosGithubRepos({query:"animations"},{fetcher:async()=>({ok:false,status:403})}),/rate-limited/);
});
test("Public tool catalog includes new bounded coding capabilities",()=>{
 const available=describeChaosTools(null);
 assert.ok(available.includes("dev.code_inspect"));
 assert.ok(available.includes("research.github_repos"));
});
test("Explicit repository request bypasses optional model planning",async()=>{
 let calls=0;let last;
 const ai={run:async(_m,o)=>{calls++;last=o;return {response:"Here are repositories."};}};
 const handlers={"research.github_repos":async()=>({results:[{url:"https://github.com/example/tool",license:"MIT"}]})};
 await inferWithChaosTools({ai,model:"fast",messages:[{role:"system",content:"base"},
  {role:"user",content:"Find open source GitHub repositories for pixel tools"}],handlers});
 assert.equal(calls,1);
 assert.match(last.messages[0].content,/github\.com\/example\/tool/);
});
