import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const sw=readFileSync(new URL("../public/sw.js",import.meta.url),"utf8");
const messages=readFileSync(new URL("../public/messages.html",import.meta.url),"utf8");
const bubbles=readFileSync(new URL("../public/chat-bubbles.js",import.meta.url),"utf8");
const navigation=readFileSync(new URL("../public/nav.js",import.meta.url),"utf8");
for(const source of [sw,bubbles,navigation])new vm.Script(source);
const inline=[...messages.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(Boolean).pop();
new vm.Script(inline);

function harness({noTextAction=false,sendOk=true,windows=[]}={}){
  const listeners={},shown=[],fetchCalls=[],opened=[];
  const context={self:{
    location:{origin:"https://ash-fall.com"},
    addEventListener(name,handler){listeners[name]=handler;},
    registration:{async showNotification(title,options){
      shown.push({title,options});
      if(noTextAction&&options.actions?.[0]?.type==="text")throw Error("unsupported");
    }},
    clients:{async matchAll(){return windows;},async openWindow(url){opened.push(url);return {url};}}
  },URL,caches:{},console,fetch:async(url,options)=>{
    fetchCalls.push({url,options});return {ok:sendOk,status:sendOk?201:403};
  }};
  vm.runInNewContext(sw,context);
  async function push(url="/messages.html?conversation=42"){
    let pending;listeners.push({data:{json(){return {title:"New message",body:"Message received",url};}},waitUntil(p){pending=p;}});
    await pending;
  }
  async function click({url="/messages.html?conversation=42",action="",reply}={}){
    let pending;listeners.notificationclick({action,reply,notification:{data:{url},close(){}},waitUntil(p){pending=p;}});
    await pending;
  }
  return {push,click,shown,opened,fetchCalls};
}

test("message push offers an Android text reply and preserves conversation ID",async()=>{
  const h=harness();await h.push();
  assert.equal(h.shown.length,1);
  assert.equal(h.shown[0].options.data.conversationId,42);
  assert.equal(h.shown[0].options.actions[0].type,"text");
});
test("unsupported Android inline action downgrades to a Reply button",async()=>{
  const h=harness({noTextAction:true});await h.push();
  assert.equal(h.shown.length,2);
  assert.equal(h.shown[1].options.actions[0].action,"reply");
  assert.equal(h.shown[1].options.actions[0].type,undefined);
});
test("tap reuses an existing inbox and opens the correct conversation",async()=>{
  let navigated="",focused=false;
  const chat={url:"https://ash-fall.com/messages.html?conversation=1",
    async navigate(url){navigated=url;return {focus:async()=>{focused=true;}};},
    async focus(){focused=true;}};
  const h=harness({windows:[chat]});await h.click();
  assert.equal(navigated,"https://ash-fall.com/messages.html?conversation=42");
  assert.equal(focused,true);assert.equal(h.opened.length,0);
});
test("inline reply uses the existing authenticated message endpoint",async()=>{
  const h=harness();await h.click({action:"reply",reply:"Hello from the alert"});
  assert.equal(h.fetchCalls.length,1);
  assert.equal(h.fetchCalls[0].url,"https://api.ash-fall.com/api/messages/conversations/42");
  assert.equal(h.fetchCalls[0].options.credentials,"include");
  assert.equal(JSON.parse(h.fetchCalls[0].options.body).body,"Hello from the alert");
  assert.equal(h.opened.length,0);
});
test("failed reply is not reported as sent, button reply opens composer",async()=>{
  const h=harness({sendOk:false});await h.click({action:"reply",reply:"Unsent"});
  assert.equal(h.shown[0].title,"Reply not sent");
  assert.equal(h.opened[0],"https://ash-fall.com/messages.html?conversation=42&reply=1");
  const j=harness();await j.click({action:"reply"});
  assert.equal(j.fetchCalls.length,0);
  assert.equal(j.opened[0],"https://ash-fall.com/messages.html?conversation=42&reply=1");
});
test("other notification types have no reply action",async()=>{
  const h=harness();await h.push("/notifications.html");
  assert.equal(h.shown[0].options.actions,undefined);
});
test("chat bubbles use canonical inbox routes and escape untrusted messages through textContent",()=>{
  assert.match(messages,/KF_OPEN_CONVERSATION/);
  assert.match(messages,/function followNotificationConversation/);
  assert.match(bubbles,/\/api\/messages\/conversations/);
  assert.match(bubbles,/textContent=/);
  assert.match(navigation,/dataset\.userId=String\(user\.id\)/);
});
