import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync("public/admin.html","utf8");
test("Creature MMO is linked from admin dashboard",()=>{
 assert.ok(html.includes('data-tab="creature-mmo"'));
 assert.ok(html.includes('data-panel="creature-mmo"'));
 assert.ok(html.includes('href="/monster-mmo.html"'));
 assert.ok(html.includes('id="mmo-refresh"'));
});
