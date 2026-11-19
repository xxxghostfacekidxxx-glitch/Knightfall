import test from "node:test";
import assert from "node:assert/strict";
import {FIELD_KIT_PROMPTS,promptsForMode,mergePromptDraft,memoForReply} from "../public/miss-chaos-field-kit.mjs";

test("members get free practical tools without owner or partner commands",()=>{
 const standard=promptsForMode("standard");
 assert.ok(standard.length>=6);
 assert.ok(standard.some(p=>p.id==="craft"));
 assert.ok(standard.some(p=>p.id==="code"));
 assert.ok(!standard.some(p=>p.privateOnly));
 assert.deepEqual(promptsForMode("guest").map(p=>p.id),standard.map(p=>p.id));
 for(const mode of ["owner","partner"]){
  const actions=promptsForMode(mode);
  assert.ok(actions.some(p=>p.id==="mission"));
  assert.ok(actions.some(p=>p.id==="handoff"));
  assert.equal(actions.length,FIELD_KIT_PROMPTS.length);
 }
 assert.ok(FIELD_KIT_PROMPTS.every(p=>p.text.length<4000));
});

test("quick prompts never erase an existing draft or send it on selection",()=>{
 assert.equal(mergePromptDraft("my draft","Please help"),"my draft\n\nPlease help");
 assert.equal(mergePromptDraft("","Please help"),"Please help");
 assert.equal(mergePromptDraft("KEEP", "X".repeat(3999)),null);
 assert.equal(mergePromptDraft("KEEP","next",14),"KEEP\n\nnext");
});

test("reply-to-Memo preserves full content, privacy and backend limits",()=>{
 const now=new Date("2026-11-19T12:00:00.000Z");
 assert.deepEqual(memoForReply("  Helpful response  ",now),{
  title:"Miss Chaos · 2026-11-19",body:"Helpful response"
 });
 assert.equal(memoForReply("   ",now),null);
 assert.equal(memoForReply("x".repeat(4001),now),null);
 assert.equal(memoForReply("x".repeat(4000),now).body.length,4000);
});
