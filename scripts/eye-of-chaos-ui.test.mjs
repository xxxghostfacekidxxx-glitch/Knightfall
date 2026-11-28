import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const html=read("../public/eye-of-chaos.html");
const js=read("../public/eye-of-chaos.js");
const css=read("../public/eye-of-chaos.css");
const admin=read("../public/admin.html");
const old=read("../public/god-bot-control.html");
const backend=read("../backend/src/index.js");
const api=read("../backend/src/eye-of-chaos.js");

test("Admin and GOD command deck exposes all ten workspaces with navigation",()=>{
 const panels=[...html.matchAll(/class="chaos-panel" data-panel="([^"]+)"/g)].map(a=>a[1]);
 const tabs=[...html.matchAll(/data-section="([^"]+)"/g)].map(a=>a[1]);
 assert.deepEqual(panels,["overview","fleet","missions","approvals","qa","identity-qa","forums","quota","knowledge","history"]);
 assert.deepEqual(tabs,panels);
 assert.match(html,/id="knowledge-run" type="button" data-chaos-god-only hidden/);
 assert.match(html,/id="knowledge-export" type="button" data-chaos-god-only hidden/);
 assert.match(js,/if\(!state\.canGod\)return;/);
 assert.match(admin,/class="admin-shortcut" href="\/eye-of-chaos\.html"/);
 assert.equal((admin.match(/class="admin-shortcut" href="\/eye-of-chaos\.html"/g)||[]).length,1,"Eye of Chaos needs one dashboard shortcut");
 assert.match(js,/data-chaos-god-only/);
 assert.match(html,/name="robots" content="noindex,nofollow,noarchive"/);
 assert.match(html,/id="chaos-workspace" hidden/);
 assert.match(js,/api\("\/status"\)/);
});
test("real QA and forum tools are integrated, not replaced",()=>{
 assert.match(html,/arcade-test-fleet\.yml/);
 assert.match(html,/href="\/god-bot-control\.html"/);
 assert.match(html,/href="\/admin\.html"/);
 assert.match(api,/Ash Sentinel/);
 assert.match(api,/Cabinet Auditor/);
 assert.match(api,/SELECT p\.bot_key,p\.display_name/);
});
test("GOD's approve, reject and edit controls never claim to publish",()=>{
 assert.match(js,/\/approve/);
 assert.match(js,/\/reject/);
 assert.match(js,/\/drafts/);
 assert.match(js,/Osiris approve/);
 assert.match(js,/Isis approve/);
});
test("every bot posting path requires explicitly authorized staff action",()=>{
 assert.match(api,/approved_version=version/);
 assert.match(api,/approved_by=NULL,approved_at=NULL,approved_version=NULL/);
 assert.match(api,/Publishing remains disabled/);
 assert.doesNotMatch(api,/\/publish"/);
 assert.doesNotMatch(backend,/await publishScheduledBotNews\(env\)/);
 assert.match(backend,/Automatic posting is disabled\. Every forum post needs explicit approval by GOD or the accepted admin partner/);
 assert.match(old,/frequency" disabled/);
 assert.match(old,/Publish this exact message publicly as the selected curator bot/);
});
test("mobile-safe Gothic palette and no untrusted HTML insertion",()=>{
 assert.match(css,/@media\(max-width:520px\)/);
 assert.match(css,/var\(--af-bg/);
 assert.match(css,/focus-visible/);
 assert.doesNotMatch(css,/#ff50d2|#e62eaf|#c6ff45/i);
 assert.doesNotMatch(js,/\.innerHTML\s*=/);
 assert.match(js,/textContent=/);
});
test("GOD can generate original drafts but no agent UI has a publish button",()=>{
 assert.match(js,/AI draft/);
 assert.match(js,/\/missions\/"\+m\.id\+"\/draft/);
 assert.match(js,/openSection\("approvals"\)/);
 assert.match(html,/id="chaos-qa-refresh"/);
 assert.match(js,/api\("\/qa"\)/);
 assert.match(js,/GitHub QA status unavailable/);
 assert.doesNotMatch(html,/<button[^>]*>Publish<\/button>/i);
});
test("new features stay locked when storage migration is absent",()=>{
 assert.match(js,/state\.ready=data\.schema_ready===true/);
 assert.match(js,/lockForms\(\)/);
 assert.match(api,/if\(!ready\)return respond/);
 assert.match(html,/Nothing auto-publishes/);
 assert.ok(html.includes('href="/theme-crew.html" class="chaos-quiet"'));
 assert.match(js,/state\.canApprove=data\.permissions\?\.can_approve===true/);
});

test("Quota Guardian provides GOD-only official Cloudflare analytics access without exposing tokens",()=>{
 assert.match(html,/data-panel="quota" hidden data-chaos-god-only/);
 assert.match(html,/Cloudflare account overview/);
 assert.match(html,/Workers &amp; Pages/);
 assert.match(html,/Analytics &amp; Logs/);
 assert.match(html,/Storage &amp; databases/);
 assert.match(js,/loadQuotaGuardian/);
 assert.match(js,/provider_usage_note/);
 assert.doesNotMatch(html,/api[_-]?token/i);
});
