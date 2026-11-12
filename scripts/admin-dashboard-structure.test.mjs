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

test("coverage panel separates verified job verdict from artifact availability",()=>{
 for(const id of ["arcade-coverage-job","arcade-coverage-state","arcade-coverage-details"])assert.ok(html.includes('id="'+id+'"'),"missing "+id);
 assert.match(html,/Consolidate ten-bot arcade coverage/);
});
test("tool search supports keyboard operation",()=>{
 assert.match(html,/adminSearch\.addEventListener\("keydown"/);
 assert.match(html,/event\.key==="Enter"/);
 assert.match(html,/event\.key==="Escape"/);
});

test("coverage status clears when the consolidation job cannot be read",()=>{
 assert.match(html,/Coverage consolidation job unavailable/);
});
test("tool search keeps the filter while users choose a result",()=>{
 assert.match(html,/adminSearch\.addEventListener\("input", filterAdminTools\)/);
 assert.match(html,/tab\.hidden = !matches\.includes\(tab\)/);
 assert.match(html,/selectAdminTab\(first\.dataset\.tab, true\)/);
});

test("arcade failure viewer uses report data and handles missing publication",()=>{
 assert.ok(html.includes('id="arcade-failure-list"'));
 assert.match(html,/async function loadPublishedArcadeFailures\(/);
 assert.match(html,/sourceRunId/);
 assert.match(html,/Detailed report not published yet/);
 assert.match(css,/\.arcade-failure-item/);
});

test("published arcade reports must match the current run",()=>{
 assert.match(html,/!data\.sourceRunId\|\|String\(data\.sourceRunId\)!==String\(run\.id\)/);
 assert.match(html,/Number\.isNaN\(Date\.parse\(data\.generatedAt\)\)/);
 assert.match(html,/typeof data\.passed!=="boolean"/);
});

test("arcade failure cards expose diagnostic evidence",()=>{
 assert.match(html,/failure\.screenshot/);
 assert.match(html,/failure\.browserErrorCount/);
 assert.match(html,/failure\.networkErrorCount/);
});

test("arcade failure cards show evidence counts",()=>{assert.match(html,/failure\.browserErrorCount/);assert.match(html,/failure\.networkErrorCount/);});

test("Creation Tools shortcuts open their named tools, not an arcade cabinet",()=>{
 assert.match(html,/<a class="admin-shortcut" href="\/open-source-arsenal\.html">[\s\S]*?<strong>Open Source Arsenal<\/strong>/);
 assert.match(html,/<a class="admin-shortcut" href="\/devil-tools\.html">[\s\S]*?<strong>Creator Foundry<\/strong>/);
 assert.doesNotMatch(html,/href="\/abyssal-arsenal\.html">[\s\S]{0,100}<strong>Open Source Arsenal<\/strong>/);
});
