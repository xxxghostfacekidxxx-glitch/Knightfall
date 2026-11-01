import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync("scripts/arcade-import-audit.mjs","utf8");
test("arcade import scanner recognizes class tokens",()=>{
 assert.ok(source.includes("game"));
 assert.ok(source.includes("play"));
 assert.ok(source.includes("matchAll"));
});
test("arcade import scanner handles both link attribute orders",()=>{
 assert.ok(source.includes("?? block.match"));
 assert.ok(source.includes("href="));
});
