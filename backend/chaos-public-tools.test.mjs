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
