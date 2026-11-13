import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync("public/admin.html","utf8");
test("Creature MMO is linked from admin dashboard",()=>{
 assert.ok(html.includes('id="creature-mmo-tools"'));
 assert.ok(html.includes('Available to every authenticated admin and God account'));
 assert.ok(html.includes('href="/monster-mmo.html"'));
 assert.ok(html.includes('id="mmo-refresh"'));
});
