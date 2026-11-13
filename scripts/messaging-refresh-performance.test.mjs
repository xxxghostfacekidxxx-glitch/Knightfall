import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const html=readFileSync(new URL("../public/messages.html",import.meta.url),"utf8");
const inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).filter(Boolean).at(-1);
test("inbox script remains valid JavaScript",()=>assert.doesNotThrow(()=>new Script(inline)));
test("unchanged message pages do not rebuild the entire DOM on each refresh",()=>{
 assert.match(inline,/function messageFingerprint\(messages\)/);
 assert.match(inline,/latestRenderedFingerprint===messageFingerprint\(incoming\)/);
 assert.match(inline,/updateDeliveryStatus\(\);drawConversations\(\);return/);
 assert.match(inline,/data-created-at/);
});
test("message read status can change without rerendering or resetting scroll",()=>{
 assert.match(inline,/function updateDeliveryStatus\(\)/);
 assert.match(inline,/other_last_read_message_id/);
 assert.match(inline,/other_last_read_at/);
 assert.match(inline,/label\.textContent=seen\?"Seen":"Sent"/);
});
test("backgrounded inbox does not make fallback HTTP requests",()=>{
 assert.match(inline,/if\(pollInFlight\|\|document\.hidden\)return/);
 assert.match(inline,/if\(!window\.KnightfallLive\?\.connected\)liveRefresh/);
});
test("admin archive only refreshes on demand, not every fallback polling interval",()=>{
 const poll=inline.slice(inline.indexOf("const liveRefresh=async()=>"),inline.indexOf("pollHandle=setInterval"));
 assert.doesNotMatch(poll,/await archive\(\)/);
 assert.match(inline,/function archive\(\)/);
});
test("history result stubs survive the 100-item inbox list limit",()=>{
 assert.match(inline,/fromSearch:true/);
 assert.match(inline,/c\.fromSearch===true/);
});
