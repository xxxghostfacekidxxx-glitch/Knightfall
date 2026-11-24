import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../backend/src/index.js",import.meta.url),"utf8");
const section=(a,b)=>{const start=source.indexOf(a),end=source.indexOf(b,start+1);assert.ok(start>=0&&end>start);return source.slice(start,end)};
test("pending attachment deletion requires uploader and current conversation membership",()=>{
 const route=section("const attachmentDeleteMatch","const attachmentDownloadMatch");
 assert.match(route,/JOIN conversation_members cm ON cm.conversation_id=a.conversation_id AND cm.user_id=a.uploader_id/);
 assert.match(route,/a.uploader_id=\? AND a.message_id IS NULL/);
 assert.match(route,/\.bind\(id,user.id\)/);
 assert.match(route,/DELETE FROM message_attachments WHERE id=\? AND uploader_id=\? AND message_id IS NULL/);
});
test("attachment download denies nonmembers, other users' pending files and deleted messages",()=>{
 const route=section("const attachmentDownloadMatch","const attachmentListMatch");
 assert.match(route,/conversation_id=\? AND user_id=\?/);
 assert.match(route,/!member\|\|\(!attachment.message_id&&Number\(attachment.uploader_id\)!==Number\(user.id\)\)/);
 assert.match(route,/attachment.message_id&&\(attachment.deleted_at\|\|Number\(attachment.message_id\)<=Number\(member.joined_after_message_id\)\)/);
 assert.match(route,/private, no-store/);
});
