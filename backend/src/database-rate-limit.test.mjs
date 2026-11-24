import test from "node:test";
import assert from "node:assert/strict";
import { databaseRateLimit } from "./database-rate-limit.js";

test("rejects missing storage and invalid limits without allowing traffic", async () => {
  assert.equal(await databaseRateLimit(null, "login:ip", 5, 60), false);
  assert.equal(await databaseRateLimit({}, "", 5, 60), false);
  assert.equal(await databaseRateLimit({}, "x", 0, 60), false);
});
test("uses a parameterized atomic upsert and enforces the returned count", async () => {
  let sql, args;
  const db = { prepare(statement) { sql=statement; return { bind(...params) { args=params; return { async first() { return {count: 3}; } }; } }; } };
  assert.equal(await databaseRateLimit(db, "login:ip", 3, 60, 1000), true);
  assert.match(sql, /ON CONFLICT\(bucket_key\) DO UPDATE/);
  assert.deepEqual(args, ["login:ip", 61000, 1000, 3]);
  const denied = { prepare() { return { bind() { return { async first() { return {count: 4}; } }; } }; } };
  assert.equal(await databaseRateLimit(denied, "login:ip", 3, 60), false);
});
test("fails closed on database errors", async () => {
  const db = { prepare() { throw new Error("unavailable"); } };
  const original = console.error;
  console.error = () => {};
  try { assert.equal(await databaseRateLimit(db, "login:ip", 5, 60), false); }
  finally { console.error = original; }
});

test("rejects malformed buckets and unsafe expiry before storage", async()=>{
 const db={prepare(){assert.fail("invalid input reached storage")}};
 for(const key of [42," ","x".repeat(513)])assert.equal(await databaseRateLimit(db,key,5,60,1000),false);
 for(const now of [-1,NaN,Infinity,Number.MAX_SAFE_INTEGER])assert.equal(await databaseRateLimit(db,"login:ip",5,60,now),false);
});
