import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const html=readFileSync("public/admin.html","utf8");
const css=readFileSync("public/admin.css","utf8");
const values=(regex)=>[...html.matchAll(regex)].map(m=>m[1]);
test("every God Mode panel has a unique identifier",()=>{
 const ids=values(/<section class="admin-panel(?: active)?" data-panel="([^"]+)"/g);
 assert.equal(new Set(ids).size,ids.length,"duplicate admin panel IDs");
});
test("every panel has one navigation tab",()=>{
 const ids=values(/<section class="admin-panel(?: active)?" data-panel="([^"]+)"/g);
 const tabs=values(/<button[^>]*data-tab="([^"]+)"/g);
 for(const id of ids)assert.equal(tabs.filter(x=>x===id).length,1,"tab mismatch: "+id);
});
test("all navigation tabs map to existing workspaces",()=>{
 const groups=new Set(values(/data-admin-group="([^"]+)"/g));
 const tabGroups=values(/<button[^>]*data-tab="[^"]+" data-workspace="([^"]+)"/g);
 assert.ok(groups.size>=4);
 for(const group of tabGroups)assert.ok(groups.has(group),"unknown workspace "+group);
});
test("God Mode retains tester, repair and accessibility controls",()=>{
 for(const id of ["test-bot-fleet","arcade-coverage-panel","repair-center-queue","admin-tool-search"])assert.ok(html.includes('id="'+id+'"'),"missing "+id);
 assert.match(css,/\.admin-workspace/);
});

test("operator overview has live status fields and refresh control",()=>{
 for(const id of ["command-backend","command-arcade","command-repairs","refresh-command-home"])assert.ok(html.includes('id="'+id+'"'),"missing "+id);
 assert.match(html,/async function refreshCommandHome\(/);
 assert.match(css,/\.admin-command-grid/);
});
test("all admin shortcuts have unique destinations",()=>{
 const hrefs=[...html.matchAll(/<a[^>]*class="admin-shortcut"[^>]*href="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(new Set(hrefs).size,hrefs.length,"duplicate shortcut destinations");
});
