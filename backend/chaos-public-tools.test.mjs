import test from "node:test";
import assert from "node:assert/strict";
import {executeChaosCapability} from "./chaos-capabilities.mjs";
import {publicChaosHandlers, searchPublicPages} from "./chaos-public-tools.mjs";

test("search only returns curated public URLs", () => {
  const results = searchPublicPages({query:"offline personal bots"});
  assert.ok(results.some(result=>result.url==="/personal-bots-offline.html"));
  assert.ok(results.every(result=>result.url.startsWith("/") && !result.url.startsWith("//")));
});
test("public capability dispatches to actual search handler", async () => {
  const result = await executeChaosCapability({name:"site.search",input:{query:"Miss Chaos"},handlers:publicChaosHandlers,usedCalls:0});
  assert.ok(result.results.some(page=>page.url==="/miss-chaos.html"));
});
test("no matches returns empty results", () => {
  assert.deepEqual(searchPublicPages({query:"zzzz-no-matches"}),[]);
});
test("missing query returns empty results", () => {
  assert.deepEqual(searchPublicPages({}),[]);
});

test("legendary family and tool workspace requests return their real pages", () => {
  assert.equal(searchPublicPages({query:"where is Boogie and Specter"})[0]?.url,"/legendary-families.html");
  assert.ok(searchPublicPages({query:"how to use creator foundry tools"}).some(page=>page.url==="/devil-tools.html"));
  assert.deepEqual(searchPublicPages({query:"where is the page please"}),[]);
});

test("Foundry help gives a grounded lesson and workspace link",async()=>{
 const answer=await publicChaosHandlers["site.help"]({input:{topic:"teach me to use Textract"}});
 assert.equal(answer.lesson?.name,"Textract");
 assert.equal(answer.lesson?.url,"/chaos-textract.html");
 assert.equal(answer.lesson?.steps.length,3);
 assert.equal((await publicChaosHandlers["site.help"]({input:{topic:"unrelated nonsense"}})).lesson,null);
});

test("guided lessons return the requested step without claiming screen access",async()=>{
 const first=(await publicChaosHandlers["site.help"]({input:{topic:"teach me Textract"}})).lesson;
 const second=(await publicChaosHandlers["site.help"]({input:{topic:"teach me Textract step 2"}})).lesson;
 assert.equal(first.currentStep,1);
 assert.equal(second.currentStep,2);
 assert.equal(second.instruction,second.steps[1]);
 assert.equal(second.nextStep,3);
 assert.match(second.guidance,/cannot see or click your screen/);
});
