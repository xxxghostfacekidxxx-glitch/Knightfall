import test from "node:test";
import assert from "node:assert/strict";
import {shouldDeliverStoredNotification as allowed} from "./notification-delivery-policy.js";
function env(row){
 const calls=[];
 return {calls,DB:{prepare(sql){
   calls.push({sql,bindings:null});
   return {bind(...bindings){calls.at(-1).bindings=bindings;return this;},
     first:async()=>row};
 }}};
}
test("unread stored alert is eligible for a push",async()=>{
 const fake=env({id:81});
 assert.deepEqual(await allowed(fake,7,{id:81}),{send:true,reason:"unread"});
 assert.deepEqual(fake.calls[0].bindings,[81,7]);
 assert.match(fake.calls[0].sql,/id=\? AND user_id=\? AND read_at IS NULL/);
});
test("already-viewed, cleared or deleted alerts never reappear from a queued retry",async()=>{
 const fake=env(null);
 assert.deepEqual(await allowed(fake,7,{id:81}),{send:false,reason:"already-handled"});
 assert.equal(fake.calls.length,1);
});
test("unpersisted events fail closed, rather than showing an untrackable push",async()=>{
 const fake=env({id:1});
 for(const input of [{},null,{id:0},{id:-1},{id:"81"},{id:2.5}]){
   assert.equal((await allowed(fake,7,input)).send,false);
 }
 assert.equal(fake.calls.length,0);
});
test("explicit device test still works without an inbox notification",async()=>{
 const fake=env(null);
 assert.deepEqual(await allowed(fake,7,{kind:"account"},"signed-device-receipt"),{send:true,reason:"device-test"});
 assert.equal(fake.calls.length,0);
});
test("recipient is always checked, and storage errors are not mistaken for delivery approval",async()=>{
 const fake=env({id:81});
 assert.equal((await allowed(fake,0,{id:81})).send,false);
 const broken={DB:{prepare:()=>({bind:()=>({first:async()=>{throw Error("DB down")}})})}};
 await assert.rejects(allowed(broken,7,{id:81}),/DB down/);
});
