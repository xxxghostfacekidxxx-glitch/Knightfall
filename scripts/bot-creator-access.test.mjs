import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { botAccessPolicy } from "../backend/src/bot-creator-access.js";
const normal=botAccessPolicy({role:"member"});assert.deepEqual([normal.limit,normal.unlimited,normal.advanced_builder],[2,false,false]);
assert.equal(botAccessPolicy({role:"member"},3).limit,5);
const creator=botAccessPolicy({role:"member"},0,{title:"Bot Creator",unlimited_slots:1,advanced_builder:1});
assert.deepEqual([creator.limit,creator.unlimited,creator.advanced_builder,creator.title],[null,true,true,"Bot Creator"]);
assert.deepEqual([botAccessPolicy({role:"admin"}).limit,botAccessPolicy({role:"admin"}).advanced_builder],[10,true]);
assert.equal(botAccessPolicy({role:"god"}).title,"God");
assert.equal(botAccessPolicy({role:"moderator"}).limit,5);
assert.equal(botAccessPolicy({role:"member"},0,{title:"Custom"}).advanced_builder,false);
console.log("Bot creator access policy verified.");

// Regression guards: privileges are stored by account ID, never inferred from a display title.
const migration=readFileSync(new URL("../backend/migrations/0112_bot_creator_privileges.sql",import.meta.url),"utf8");
const backend=readFileSync(new URL("../backend/src/index.js",import.meta.url),"utf8");
const studio=readFileSync(new URL("../public/personal-bots.html",import.meta.url),"utf8");
const client=readFileSync(new URL("../public/bot-creator-pro.js",import.meta.url),"utf8");
assert.match(migration,/REFERENCES users\(id\)/);
assert.match(migration,/lower\(username\)='mrsshroom14'/);
assert.match(migration,/NOT EXISTS\s*\(\s*SELECT 1 FROM member_bot_creator_privileges/);
assert.match(backend,/SELECT title,unlimited_slots,advanced_builder FROM member_bot_creator_privileges WHERE user_id=\?/);
assert.match(backend,/if\(cap!==null&&Number\(count\?\.count\|\|0\)>=cap\)/);
assert.match(studio,/id="bot-pro-studio"[^>]*hidden/);
assert.match(client,/d\.advanced_builder!==true/);
assert.match(backend,/AS public_title/);
console.log("Creator authorization, trigger, and gated dashboard wiring verified.");
