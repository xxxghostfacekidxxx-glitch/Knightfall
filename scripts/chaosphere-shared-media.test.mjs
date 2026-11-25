import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const backend=readFileSync(new URL("../backend/src/index.js",import.meta.url),"utf8");
const inbox=readFileSync(new URL("../public/messages.html",import.meta.url),"utf8");
const route=backend.slice(backend.indexOf("const attachmentListMatch"),backend.indexOf("const groupMembersMatch"));
test("shared gallery requires authentication and respects history boundaries",()=>{assert.match(route,/await requireUser\(request,env\)/);assert.match(route,/if\(!member\)return json/);assert.match(route,/JOIN conversation_members cm ON cm\.conversation_id=a\.conversation_id AND cm\.user_id=\?/);assert.match(route,/a\.message_id>cm\.joined_after_message_id/);assert.match(route,/m\.deleted_at IS NULL/);assert.match(route,/a\.id<\?/);assert.match(route,/\.bind\(\.\.\.params\)/);});
test("shared media is paginated, allowlisted and excludes stale responses",()=>{assert.match(route,/\["all","images","files"\]\.includes\(kind\)/);assert.match(route,/rows\.slice\(0,24\)/);assert.match(inbox,/sharedMediaState!==state\|\|!sharedMediaDialog\.open/);assert.match(inbox,/data\.gallery!==true/);assert.match(inbox,/label\.textContent=name/);assert.match(inbox,/highlightMessageId:messageId,beforeMessageId:messageId/);});
