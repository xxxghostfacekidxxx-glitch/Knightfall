import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {hasBlockedGroupPair} from "./message-group-policy.mjs";
const worker=readFileSync(new URL("./src/index.js",import.meta.url),"utf8");

test("group block check covers every participant pair in either direction",async()=>{
 let sql="",bindings=[];
 const db={prepare(query){sql=query;return {bind(...values){bindings=values;return {async first(){return {blocked:1}}}}}}};
 assert.equal(await hasBlockedGroupPair(db,[7,11,19,11]),true);
 assert.match(sql,/blocker_id IN \(\?,\?,\?\) AND blocked_id IN \(\?,\?,\?\)/);
 assert.deepEqual(bindings,[7,11,19,7,11,19]);
});

test("groups with fewer than two valid participants require no block lookup",async()=>{
 let queried=false;
 const db={prepare(){queried=true;throw Error("unexpected query")}};
 assert.equal(await hasBlockedGroupPair(db,[5,0,"invalid",5]),false);
 assert.equal(queried,false);
});

test("both group creation and member additions enforce pairwise blocks",()=>{
 const create=worker.slice(worker.indexOf('if(url.pathname==="/api/messages/groups"'),worker.indexOf('if(url.pathname==="/api/messages/conversations"&&request.method==="POST")'));
 const members=worker.slice(worker.indexOf("const groupMembersMatch"),worker.indexOf('if(url.pathname==="/api/messages/groups"'));
 assert.match(create,/hasBlockedGroupPair\(env\.DB,\[user\.id,\.\.\.ids\]\)/);
 assert.match(members,/SELECT user_id FROM conversation_members WHERE conversation_id=\?/);
 assert.match(members,/hasBlockedGroupPair\(env\.DB,memberIds\)/);
});
