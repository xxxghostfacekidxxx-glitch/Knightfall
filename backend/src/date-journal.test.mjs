import test from "node:test";
import assert from "node:assert/strict";
import {handleDateJournal} from "./date-journal.js";

const journal = {
  name: "Shadow Journal",
  table: "shadow_journal",
  metadata: ["prompt_key"],
  bucket: "shadow-journal-write",
  updateMetadata: true,
  readMetadata(data) { return [data.prompt_key ?? null]; }
};
const version = "11111111-1111-4111-8111-111111111111";
const day = "2026-11-13";
const json = (body, status=200) => new Response(JSON.stringify(body), {
  status, headers: {"content-type":"application/json"}
});

function harness({user={id:17,role:"member"}, rateAllowed=true}={}) {
  const statements = [];
  const env = {DB: {prepare(sql) {
    return {bind(...args) {
      statements.push({sql,args});
      // Simulates a database where this principal owns no rows. Queries
      // MUST constrain ownership themselves, as shown by SQL assertions below.
      return {
        async all() {return {results:[]};},
        async first() {return null;},
        async run() {return {meta:{changes:0}};}
      };
    }};
  }}};
  async function request(path, method="GET", payload) {
    const init = {method};
    if (payload !== undefined) {
      init.headers = {"content-type":"application/json"};
      init.body = JSON.stringify(payload);
    }
    const req = new Request("https://api.ash-fall.com"+path, init);
    const response = await handleDateJournal(req, env, new URL(req.url), {
      getUser:async()=>user, json, rateLimit:async()=>rateAllowed,
      origin:"https://ash-fall.com"
    }, journal);
    return {status:response.status, body:await response.json()};
  }
  return {request,statements};
}

test("unauthenticated journal users cannot query the database",async()=>{
  const h=harness({user:null});
  assert.equal((await h.request("/api/shadow-journal")).status,401);
  assert.equal((await h.request("/api/shadow-journal/"+day)).status,401);
  assert.equal(h.statements.length,0);
});

test("list and detail reads bind the verified account, not request parameters",async()=>{
  const h=harness({user:{id:17,role:"god"}});
  assert.equal((await h.request("/api/shadow-journal?user_id=29")).status,200);
  assert.equal((await h.request("/api/shadow-journal/"+day+"?user_id=29")).body.entry,null);
  const [list, detail]=h.statements;
  assert.match(list.sql,/WHERE user_id = \? AND entry_date < \?/);
  assert.deepEqual(list.args,[17,"2101-01-01"]);
  assert.match(detail.sql,/WHERE user_id = \? AND entry_date = \?/);
  assert.deepEqual(detail.args,[17,day]);
});

test("new journal entries ignore client-supplied owner identifiers",async()=>{
  const h=harness();
  const r=await h.request("/api/shadow-journal/"+day,"PUT",{
    user_id:29, title:"Private note", body:"Only the owner may write",prompt_key:null,version:null
  });
  // Stub DB returns no row; verify the actual insert still binds principal 17.
  assert.equal(r.status,409);
  const insert=h.statements.at(-1);
  assert.match(insert.sql,/INSERT INTO shadow_journal \(user_id,/);
  assert.equal(insert.args[0],17);
  assert.equal(insert.args.includes(29),false);
});

test("updates and deletes require both owner and matching version",async()=>{
  const h=harness();
  const r=await h.request("/api/shadow-journal/"+day,"PUT",{
    user_id:29,title:"Private note",body:"New draft",prompt_key:null,version
  });
  assert.equal(r.status,409);
  const update=h.statements.at(-1);
  assert.match(update.sql,/WHERE user_id = \? AND entry_date = \? AND version = \?/);
  assert.deepEqual(update.args.slice(-3),[17,day,version]);
  assert.equal(update.args.includes(29),false);

  const del=await h.request("/api/shadow-journal/"+day,"DELETE",{version,user_id:29});
  assert.equal(del.status,409);
  const remove=h.statements.at(-1);
  assert.match(remove.sql,/DELETE FROM shadow_journal WHERE user_id = \? AND entry_date = \? AND version = \?/);
  assert.deepEqual(remove.args,[17,day,version]);
});

test("malformed dates and optimistic versions fail before D1 operations",async()=>{
  const h=harness();
  assert.equal((await h.request("/api/shadow-journal/2026-02-30")).status,400);
  assert.equal((await h.request("/api/shadow-journal/"+day,"PUT",{title:"a",body:"b",version:"invalid"})).status,400);
  assert.equal(h.statements.length,0);
});

test("throttled journal writes never query D1",async()=>{
  const h=harness({rateAllowed:false});
  const r=await h.request("/api/shadow-journal/"+day,"PUT",{title:"a",body:"b",version:null});
  assert.equal(r.status,429);
  assert.equal(h.statements.length,0);
});
