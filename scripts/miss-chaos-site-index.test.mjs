import test from "node:test";
import assert from "node:assert/strict";
import {PUBLIC_PAGES,searchPublicPages} from "../backend/chaos-public-tools.mjs";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Miss Chaos site index parses and contains nonduplicate working destinations",()=>{
 assert.ok(PUBLIC_PAGES.length>=15);
 const paths=PUBLIC_PAGES.map(x=>x.url);
 assert.equal(new Set(paths).size,paths.length);
 for(const page of PUBLIC_PAGES){
  assert.match(page.url,/^\/[a-z0-9-]+\.html$/);
  assert.ok(page.title&&page.terms);
 }
 const find=term=>searchPublicPages({query:term}).map(x=>x.url);
 assert.ok(find("creator foundry").includes("/devil-tools.html"));
 assert.ok(find("miss chaos crucible").includes("/chaos-crucible.html"));
 assert.ok(find("game arcade").includes("/chaos-cartridge.html"));
 assert.ok(find("memo notes").includes("/memo-pad.html"));
 assert.ok(!paths.includes("/creator-foundry.html"));
});
test("site index must remain source-parseable for the deployed Worker",()=>{
 const raw=read("backend/chaos-public-tools.mjs");
 assert.match(raw,/export const PUBLIC_PAGES/);
 assert.doesNotMatch(raw,/\}\s*\n\s*\{title:/,"site catalog objects require commas to avoid Worker syntax failures");
});
