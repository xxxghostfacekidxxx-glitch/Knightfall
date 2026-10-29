import test from "node:test";
import assert from "node:assert/strict";
import {readFile,access} from "node:fs/promises";

const migration=new URL("../backend/migrations/0029_arcade_save_revisions.sql",import.meta.url);
test("arcade save revision migration retains production-safe numbering",async()=>{
 const sql=await readFile(migration,"utf8");
 assert.match(sql,/ALTER TABLE arcade_saves ADD COLUMN revision INTEGER NOT NULL DEFAULT 1/);
 await assert.rejects(access(new URL("../backend/migrations/0020_arcade_save_revisions.sql",import.meta.url)));
});
