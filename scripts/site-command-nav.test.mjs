import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {staffCapabilities} from "../backend/src/staff-capabilities.js";
const read = file => readFileSync(new URL("../" + file, import.meta.url), "utf8");

test("Authenticated navigation exposes the private handoff to owner and invited account", () => {
 const nav=read("public/nav.js");
 assert.match(nav, /class="kf-nav-primary kf-handoff-link" href="\/ai-handoff\.html" hidden/);
 assert.match(nav, /class="kf-account-handoff-link" href="\/ai-handoff\.html" hidden/);
 assert.match(nav,/const sharedHandoff = accessAllowed\(user,"can_handoff"\)/);
 assert.match(nav,/user\.staff_access\?\.\[key\]===true/);
 assert.equal(staffCapabilities({role:"member",status:"active",username:"knightfallsamantha"}).can_handoff,false);
 assert.equal(staffCapabilities({role:"member",status:"active",handoff_invited:1}).can_handoff,true);
 assert.equal(staffCapabilities({role:"god",status:"active"}).can_handoff,true);
 assert.equal(staffCapabilities({role:"god",status:"suspended"}).can_handoff,false);
 assert.match(nav, /querySelector\("\.kf-handoff-link"\)\.hidden = !sharedHandoff/);
 assert.match(read("public/account.html"), /href="\/ai-handoff\.html"/);
 assert.match(read("public/ai-handoff.html"), /gate-accept/);
});

test("Eye of Chaos remains visible in Staff and owner/admin dashboard", () => {
 const nav=read("public/nav.js");
 assert.match(nav, /class="kf-nav-primary kf-eye-chaos-link" href="\/eye-of-chaos\.html" hidden/);
 assert.match(nav, /class="kf-staff-eye-chaos-link" href="\/eye-of-chaos\.html" hidden/);
 assert.match(nav, /querySelector\("\.kf-eye-chaos-link"\)\.hidden = !accessAllowed\(user,"can_eye_of_chaos"\)/);
 assert.equal(staffCapabilities({role:"admin",status:"active"}).can_eye_of_chaos,true);
 assert.equal(staffCapabilities({role:"member",status:"active"}).can_eye_of_chaos,false);
 assert.match(read("public/admin.html"), /aria-label="Quick command center links"/);
 assert.match(read("public/admin.html"), /<a class="admin-shortcut" href="\/eye-of-chaos\.html"/);
 assert.match(read("public/account.html"), /rights\.can_eye_of_chaos===true.*eye-of-chaos\.html/);
});

test("Mobile private pages avoid stale PWA assets", () => {
 const headers=read("public/_headers");
 const sw=read("public/sw.js");
 assert.match(headers, /\/ai-handoff\.html\n  Cache-Control: private, no-store/);
 assert.match(headers, /\/eye-of-chaos\.html\n  Cache-Control: private, no-store/);
 assert.match(sw, /url\.pathname\.startsWith\("\/ai-handoff"\)/);
 assert.match(sw, /url\.pathname\.startsWith\("\/eye-of-chaos"\)/);
});
