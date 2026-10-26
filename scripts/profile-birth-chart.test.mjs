import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const api=readFileSync(new URL("../backend/src/index.js",import.meta.url),"utf8");
const editor=readFileSync(new URL("../public/profile-edit.html",import.meta.url),"utf8");
const profile=readFileSync(new URL("../public/profile.js",import.meta.url),"utf8");
const migration=readFileSync(new URL("../backend/migrations/0058_profile_birth_charts.sql",import.meta.url),"utf8");
test("birth charts default to private and require owner session",()=>{
 assert.match(migration,/visible INTEGER NOT NULL DEFAULT 0/);
 assert.match(api,/if\(url\.pathname==="\/api\/profile\/birth-chart"/);
 assert.match(api,/const owner=await requireUser\(request,env\)/);
 assert.match(api,/WHERE user_id=\? AND visible=1/);
});
test("published chart does not include raw birth coordinates or timestamp",()=>{
 assert.match(api,/stored=JSON\.stringify\(\{zodiac:/);
 const start=api.indexOf("stored=JSON.stringify({zodiac:");
 const end=api.indexOf("});",start);
 const shape=api.slice(start,end);
 assert.ok(!shape.includes("latitude:"));
 assert.ok(!shape.includes("longitude:"));
 assert.ok(!shape.includes("utc:"));
});
test("profile editor supports explicit opt in and deletion",()=>{
 assert.match(editor,/id="birth-chart-visible"/);
 assert.match(editor,/id="birth-chart-remove"/);
 assert.match(editor,/chartApi\("DELETE"\)/);
 assert.match(profile,/if\(d\.birth_chart\)/);
});
