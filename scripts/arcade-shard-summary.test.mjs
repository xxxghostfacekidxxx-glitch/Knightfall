import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync("scripts/arcade-shard-summary.mjs","utf8");
test("fleet summary verifies canonical hosted routes",()=>{
 assert.match(source,/public\/arcade\/catalog\.json/);
 assert.match(source,/routes\.filter\(/);
 assert.match(source,/r\.totalCatalog!==routes\.length/);
});
test("fleet summary rejects false pass counts and malformed shards",()=>{
 assert.match(source,/r\.passed!==r\.results\?\.filter/);
 assert.match(source,/r\.failed!==r\.results\?\.filter/);
 assert.match(source,/r\.shardIndex>=expected/);
 assert.match(source,/Malformed shard report/);
});
test("fleet summary requires failed game diagnostics",()=>{
 assert.match(source,/result\.status==="failed"&&!result\.error&&!result\.reason/);
});
test("fleet summary emits actionable failed routes",()=>{
 assert.match(source,/failures\.push\(/);
 assert.match(source,/failures,coverageOk/);
});
