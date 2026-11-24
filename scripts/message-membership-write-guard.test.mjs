import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const source=readFileSync(new URL("../backend/src/index.js",import.meta.url),"utf8");
const sendStart=source.indexOf('if(conversationMatch&&request.method==="POST"){');
const editStart=source.indexOf('if(messageMatch&&request.method==="PATCH"){',sendStart);
const deleteStart=source.indexOf('if(messageMatch&&request.method==="DELETE"){',editStart);
const reportStart=source.indexOf('if(messageMatch&&request.method==="POST"){',deleteStart);
assert.ok(sendStart>=0&&editStart>sendStart&&deleteStart>editStart&&reportStart>deleteStart);
const send=source.slice(sendStart,editStart);
const edit=source.slice(editStart,deleteStart);
const remove=source.slice(deleteStart,reportStart);

test("message creation rechecks membership in the database write",()=>{
  assert.match(send,/INSERT INTO messages[\s\S]*?SELECT \?,\?,\?,\? WHERE EXISTS \(SELECT 1 FROM conversation_members WHERE conversation_id=\? AND user_id=\?\) RETURNING id/);
  assert.match(send,/if\(!row\)return json\(\{error:"Conversation not found\."\},404,origin\)/);
  assert.ok(send.indexOf("if(!row)")<send.indexOf("currentRecipients"),"a removed sender cannot trigger recipient fanout");
  assert.match(send,/const currentRecipients=await env\.DB\.prepare\("SELECT cm\.user_id,cm\.muted_until,u\.username FROM conversation_members[\s\S]*?cm\.joined_after_message_id<\?/);
  assert.match(send,/\.bind\(conversationId,user\.id,row\.id\)\.all\(\)/,"newly added members cannot receive an event for messages predating their join boundary");
});

test("message edits require current membership and respect join history",()=>{
  assert.match(edit,/JOIN conversation_members cm ON cm\.conversation_id=m\.conversation_id AND cm\.user_id=\?/);
  assert.match(edit,/m\.id>cm\.joined_after_message_id/);
  assert.match(edit,/UPDATE messages SET body=\?,edited_at=\? WHERE id=\? AND sender_id=\? AND deleted_at IS NULL[\s\S]*?EXISTS \(SELECT 1 FROM conversation_members cm/);
  assert.match(edit,/Number\(changed\.meta\?\.changes\|\|0\)!==1/);
});

test("message deletion rechecks ownership and current membership in its write",()=>{
  assert.match(remove,/JOIN conversation_members cm ON cm\.conversation_id=m\.conversation_id AND cm\.user_id=\?/);
  assert.match(remove,/m\.id>cm\.joined_after_message_id/);
  assert.match(remove,/UPDATE messages SET deleted_at=\? WHERE id=\? AND sender_id=\? AND deleted_at IS NULL[\s\S]*?EXISTS \(SELECT 1 FROM conversation_members cm/);
  assert.match(remove,/Number\(changed\.meta\?\.changes\|\|0\)!==1/);
});
