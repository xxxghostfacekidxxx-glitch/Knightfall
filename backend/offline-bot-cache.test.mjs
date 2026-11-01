import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source = readFileSync(new URL("../public/sw.js",import.meta.url),"utf8");
test("offline bot page and script use service worker cache",()=>{
  assert.ok(source.includes("const offlineBotAsset ="));
  assert.ok(source.includes("!offlineBotAsset &&"));
  assert.ok(source.includes('"/personal-bots-offline.html"'));
  assert.ok(source.includes('"/personal-bots-offline.js"'));
});
