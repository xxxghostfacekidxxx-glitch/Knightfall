import test from "node:test";
import assert from "node:assert/strict";
import {loadPersonalBotChatHistory} from "./personal-bot-chat-history.mjs";

test("personal bot chat history is queried by both bot and owner and returned oldest first",async()=>{
 let sql="",bindings=[];
 const db={prepare(statement){sql=statement;return {bind(...values){bindings=values;return {async all(){return {results:[
  {role:"assistant",content:"second"},{role:"user",content:"first"}
 ]}}}}}}};
 const history=await loadPersonalBotChatHistory(db,"bot-secret",42,8);
 assert.match(sql,/bot_id=\? AND user_id=\?/);
 assert.match(sql,/deleted_at IS NULL/);
 assert.deepEqual(bindings,["bot-secret",42,8]);
 assert.deepEqual(history,[{role:"user",content:"first"},{role:"assistant",content:"second"}]);
});

test("personal bot chat history has a hard limit and caps stored content",async()=>{
 let bindings=[];
 const db={prepare(){return {bind(...values){bindings=values;return {async all(){return {results:[{role:"user",content:"x".repeat(3000)}]}}}}}}};
 const history=await loadPersonalBotChatHistory(db,"bot-secret",42,999);
 assert.equal(bindings[2],20);
 assert.equal(history[0].content.length,2500);
});
