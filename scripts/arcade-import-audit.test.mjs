import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync("scripts/arcade-import-audit.mjs","utf8");
const manifest=JSON.parse(readFileSync("public/arcade/catalog.json","utf8"));
test("import audit reads canonical catalog",()=>{
 assert.ok(source.includes("arcade/catalog.json"));
 assert.ok(!source.includes("matchAll"));
 assert.ok(source.includes("game.collection"));
});
test("catalog IDs are unique",()=>{
 const ids=manifest.games.map(game=>game.id);
 assert.ok(ids.length>0);
 assert.equal(new Set(ids).size,ids.length);
});
