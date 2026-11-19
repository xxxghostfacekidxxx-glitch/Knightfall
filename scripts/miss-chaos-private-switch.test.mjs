import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const floating=read("public/miss-chaos-presence.js");
const css=read("public/miss-chaos-presence.css");
const nav=read("public/nav.js");
const chat=read("public/miss-chaos.js");
const backend=read("backend/src/index.js");
const companion=read("backend/src/chaos-companion.mjs");
const ownerPage=read("public/miss-chaos.html");
const partnerPage=read("public/samantha-chaos.html");

test("floating assistant script and switcher are syntactically valid, accessible and available sitewide",()=>{
 assert.doesNotThrow(()=>new Script(floating));
 assert.match(floating,/id="mc-companion-mode"/);
 assert.match(floating,/aria-label="Miss Chaos assistant workspace"/);
 assert.match(floating,/id="mc-companion-label"[^>]*hidden/);
 assert.match(floating,/modeSelect\.addEventListener\("change"/);
 assert.match(floating,/modeLabel\.hidden=availableModes\.length<2/);
 assert.match(css,/\.mc-companion-control select/);
 assert.match(nav,/miss-chaos-presence\.js\?v=20261119-private-switch1/);
 assert.match(floating,/miss-chaos-presence\.css\?v=20261119-private-switch1/);
});

test("session-owned mode discovery controls the private choices and always fails closed",()=>{
 assert.match(floating,/request\("\/api\/auth\/me"\)/);
 assert.match(floating,/request\("\/api\/chaos\/modes"\)/);
 assert.match(floating,/availableModes=\[\{id:"standard"/);
 assert.match(floating,/\.filter\(m=>\["owner","partner"\]\.includes\(m\.id\)/);
 assert.match(companion,/companionModeList\(scope\)/);
 assert.match(companion,/scope\?\.accepted&&scope\.role==="owner"/);
 assert.match(companion,/scope\?\.accepted&&scope\.role==="partner"/);
 assert.match(companion,/cache-control","private, no-store"/);
 assert.match(backend,/companionMode==="owner"&&\(access\.role!=="owner"\|\|user\.role!=="god"\)/);
 assert.match(backend,/companionMode==="partner"&&access\.role!=="partner"/);
});

test("switching does not mix account or mode conversation pointers and respects busy chat",()=>{
 assert.match(floating,/missChaosPresenceConversation:/);
 assert.match(floating,/mode==="standard"\?"":":"\+mode/);
 assert.match(floating,/missChaosPresenceDraft:/);
 assert.match(floating,/if\(busy\|\|!availableModes\.some/);
 assert.match(floating,/modeSelect\.disabled=true;input\.value=""/);
 assert.match(floating,/key\(userId,assistantMode\)/);
 assert.match(floating,/sessionStorage\.setItem\(modeStorage\(userId\),assistantMode\)/);
 assert.match(floating,/selected!==assistantMode\|\|id!==conversationId/);
 assert.match(floating,/companion:assistantMode==="standard"\?undefined:assistantMode/);
 assert.match(floating,/ensureAccount\(true\)/);
});

test("full private chat requests use backend-authorized roles and account-bound pages",()=>{
 assert.match(chat,/const ownerCompanion = !partnerCompanion/);
 assert.match(chat,/request\("\/api\/chaos\/companion"\)/);
 assert.match(chat,/if\(scope\.role!=="owner"\)/);
 assert.match(chat,/companion:companionVariant/);
 assert.match(ownerPage,/miss-chaos\.js\?v=20261119-private-switch1/);
 assert.match(partnerPage,/miss-chaos\.js\?v=20261119-private-switch1/);
 assert.match(partnerPage,/data-chaos-companion="partner"/);
 assert.doesNotMatch(companion,/role:\s*body\./);
});
