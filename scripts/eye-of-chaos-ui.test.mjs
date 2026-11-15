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

test("GOD console exposes all seven unique workspaces with navigation",()=>{
 const panels=[...html.matchAll(/class="chaos-panel" data-panel="([^"]+)"/g)].map(a=>a[1]);
 const tabs=[...html.matchAll(/data-section="([^"]+)"/g)].map(a=>a[1]);
 assert.deepEqual(panels,["overview","fleet","missions","approvals","qa","forums","history"]);
 assert.deepEqual(tabs,panels);
 assert.match(admin,/href="\/eye-of-chaos\.html" data-god-only hidden/);
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
 assert.match(js,/GOD approve/);
});
test("every publishing path is still protected by an explicit GOD action",()=>{
 assert.match(api,/approved_version=version/);
 assert.match(api,/approved_by=NULL,approved_at=NULL,approved_version=NULL/);
 assert.match(api,/Publishing remains disabled/);
 assert.doesNotMatch(api,/\/publish"/);
 assert.doesNotMatch(backend,/await publishScheduledBotNews\(env\)/);
 assert.match(backend,/Automatic posting is disabled\. Every forum post needs explicit GOD approval/);
 assert.match(old,/frequency" disabled/);
 assert.match(old,/GOD approval: publish this exact bot message/);
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
 assert.match(html,/No publication without GOD approval/);
});
