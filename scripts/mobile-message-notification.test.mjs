import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";

const html=readFileSync(new URL("../public/messages.html",import.meta.url),"utf8");
const begin=html.indexOf("function updateNotificationButton(){");
const end=html.indexOf("function drawConversations(){",begin);
assert.ok(begin>0&&end>begin,"Inbox push UI and unread alert handlers must exist");
const code=html.slice(begin,end);

function context({subscription=null,visible="hidden"}={}){
  const notices=[],buttons=new Map([["#enable-notifications",{textContent:"",disabled:false,attrs:{},setAttribute(k,v){this.attrs[k]=v;}}]]);
  let constructorCalls=0;
  const Notification=function(){constructorCalls++;throw Error("Illegal constructor: Android does not support page-level Notification()");};
  Notification.permission="granted";
  const globals={
    window:{Notification,PushManager:function(){}},Notification,
    navigator:{serviceWorker:{ready:Promise.resolve({pushManager:{getSubscription:async()=>subscription},showNotification:async(...args)=>notices.push(args)})}},
    document:{visibilityState:visible},
    conversations:[{id:42,unread_count:1,other_display_name:"Example",other_username:"example"}],
    currentId:null,
    knownUnreadByConversation:new Map([[42,0]]),unreadBaselineReady:true,
    conversationName:conv=>conv.other_display_name,
    $:selector=>buttons.get(selector),
    console
  };
  vm.createContext(globals);vm.runInContext(code,globals);
  return {globals,notices,buttons,get constructorCalls(){return constructorCalls;}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test("Android inbox unread notification uses service worker, not illegal page constructor",async()=>{
  const c=context();
  c.globals.maybeNotifyUnread();
  await flush();
  assert.equal(c.constructorCalls,0);
  assert.equal(c.notices.length,1);
  assert.match(c.notices[0][0],/New message/);
  assert.equal(c.notices[0][1].data.url,"/messages.html?conversation=42");
});
test("existing cloud push subscription prevents duplicate foreground alerts",async()=>{
  const c=context({subscription:{endpoint:"https://fcm.googleapis.com/fcm/send/x"}});
  c.globals.maybeNotifyUnread();await flush();
  assert.equal(c.notices.length,0);
});
test("granted permission alone must not label mobile push as enabled",()=>{
  const c=context();
  c.globals.updateNotificationButton();
  const button=c.buttons.get("#enable-notifications");
  assert.equal(button.disabled,false);
  assert.equal(button.textContent,"Phone push settings");
  assert.equal(button.attrs["aria-pressed"],"false");
  assert.match(html,/id="phone-push-help"/);
});
