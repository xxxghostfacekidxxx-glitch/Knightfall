import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const source=readFileSync(new URL("../public/personal-bots.js",import.meta.url),"utf8");
test("builder parses and never restores shared legacy drafts",()=>{
 new vm.Script(source);
 assert.doesNotMatch(source,/ashfall:personal-bot-draft:v1/);
 assert.match(source,/draftKey="ashfall:personal-bot-draft:v2:"\+owner;restoreDraft\(\)/);
 assert.match(source,/Number\.isSafeInteger\(owner\)/);
});
test("draft saving and restoring require authenticated storage key",()=>{
 assert.match(source,/function saveDraft\(\)\{if\(!draftKey\)return/);
 assert.match(source,/function restoreDraft\(\)\{if\(!draftKey\)return/);
 assert.match(source,/if\(draftKey\)sessionStorage\.removeItem\(draftKey\)/);
});
