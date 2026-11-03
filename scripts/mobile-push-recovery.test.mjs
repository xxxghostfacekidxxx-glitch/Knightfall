import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html=readFileSync(new URL("../public/notifications.html",import.meta.url),"utf8");
const backend=readFileSync(new URL("../backend/src/index.js",import.meta.url),"utf8");
const sw=readFileSync(new URL("../public/sw.js",import.meta.url),"utf8");
const inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(Boolean).pop();
new vm.Script(inline,{filename:"notifications.html"});

function harness({existing=false,registered=false}={}){
  const calls=[];
  const key=new Uint8Array(65);key[0]=4;key.fill(7,1);
  const vapid=Buffer.from(key).toString("base64url");
  const sub={endpoint:"https://fcm.googleapis.com/fcm/send/device-test",options:{applicationServerKey:key.buffer},
    toJSON(){return {endpoint:this.endpoint,keys:{p256dh:"a".repeat(87),auth:"b".repeat(22)}};},
    async unsubscribe(){calls.push("unsubscribe");subscription=null;return true;}};
  let subscription=existing?sub:null;
  let serverRegistered=registered;
  const registration={
    active:{},
    pushManager:{
      async getSubscription(){calls.push("getSubscription");return subscription;},
      async subscribe(options){calls.push("subscribe");assert.equal(options.userVisibleOnly,true);subscription=sub;return sub;}
    }
  };
  const nodes=new Map([
    ["#push-device-details",{textContent:""}],
    ["#pref-messages",{checked:true}],["#pref-community",{checked:true}],["#pref-account",{checked:true}],
    ["#quiet-start",{value:""}],["#quiet-end",{value:""}]
  ]);
  const pushToggle={dataset:{},disabled:false,textContent:""};
  const mock={
    Notification:{permission:"default",async requestPermission(){calls.push("permission");this.permission="granted";return "granted";}},
    window:{PushManager:function(){},Notification:function(){}},
    isSecureContext:true,
    navigator:{serviceWorker:{
      async getRegistration(){calls.push("getRegistration");return registration;},
      async register(){throw Error("Should not have to register active SW");},
      ready:Promise.resolve(registration)
    }},
    document:{querySelector(s){return nodes.get(s)||null;}},
    pushToggle,
    setPushStatus(message){calls.push("status:"+message);},
    getPrefs(){return {push_messages:true,push_community:true,push_account:true,quiet_start:null,quiet_end:null};},
    async api(route,options={}){
      calls.push("api:"+route);
      if(route==="/api/push/vapid-public-key")return {public_key:vapid};
      if(route==="/api/notification-preferences")return {push_available:true,preferences:{}};
      if(route==="/api/push/subscriptions"&&options.method==="POST"){serverRegistered=true;return {ok:true};}
      if(route==="/api/push/subscriptions"&&options.method==="DELETE"){serverRegistered=false;return {ok:true};}
      if(route==="/api/push/subscriptions")return {subscriptions:serverRegistered?[{endpoint:sub.endpoint}]:[]};
      throw Error("Unexpected API "+route);
    },
    atob,Uint8Array,console
  };
  const start=inline.indexOf("function supportsPush()");
  const end=inline.indexOf("pushToggle.addEventListener",start);
  assert.ok(start>=0&&end>start,"Push enable and recovery functions exist");
  vm.createContext(mock);
  vm.runInContext(inline.slice(start,end)+"\nthis.functions={enableThisDevice,syncThisDevice};",mock);
  return {calls,mock,sub,functions:mock.functions,get registered(){return serverRegistered;}};
}

test("Android permission is requested before any async registration or API request",async()=>{
  const h=harness();
  await h.functions.enableThisDevice();
  assert.equal(h.calls[0],"permission","Permission prompt must preserve the original mobile tap");
  assert.ok(h.calls.indexOf("permission")<h.calls.indexOf("api:/api/push/vapid-public-key"));
  assert.ok(h.calls.includes("subscribe"));
  assert.ok(h.calls.includes("api:/api/push/subscriptions"));
  assert.equal(h.registered,true);
  assert.equal(h.mock.pushToggle.dataset.mode,"disable");
});

test("existing Android subscription that was lost from the database is repaired automatically",async()=>{
  const h=harness({existing:true,registered:false});
  h.mock.Notification.permission="granted";
  await h.functions.syncThisDevice();
  assert.equal(h.registered,true,"Lost D1 subscription must be repaired");
  assert.equal(h.calls.filter(x=>x==="api:/api/push/subscriptions").length,2);
  assert.ok(!h.calls.includes("permission"),"Should not prompt when permission is already granted");
  assert.ok(!h.calls.includes("unsubscribe"),"Should not revoke an otherwise valid browser subscription");
  assert.equal(h.mock.pushToggle.dataset.mode,"disable");
});

test("phone tests cannot accidentally succeed by sending to a desktop device",()=>{
  assert.match(html,/JSON\.stringify\(\{endpoint:sub\.endpoint\}\)/);
  assert.match(backend,/WHERE user_id=\? AND endpoint=\?/);
  assert.match(backend,/deliverPushToUser\(env,user\.id,[\s\S]*?,endpoint\)/);
  assert.match(backend,/return json\(\{subscriptions:rows\.results\|\|\[\]\}/);
});

test("service worker confirms receipt and avoids unsupported SVG notification images",()=>{
  assert.match(sw,/KF_PUSH_RECEIVED/);
  assert.match(sw,/await self\.registration\.showNotification/);
  const from=sw.slice(sw.indexOf('self.addEventListener("push"'),sw.indexOf('self.addEventListener("notificationclick"'));
  assert.doesNotMatch(from,/icon:\s*"[^"]+\.svg"/);
  assert.doesNotMatch(from,/badge:\s*"[^"]+\.svg"/);
});

test("multi-device queue sends concurrently and retries only the failed phone",()=>{
  assert.match(backend,/Promise\.all\(\(results\|\|\[\]\)\.map\(async sub=>/);
  assert.match(backend,/delivery\.transient_endpoints\.push\(outcome\.endpoint\)/);
  assert.match(backend,/if\(!endpoint&&result\.accepted>0&&result\.transient_endpoints\?\.length\)/);
  assert.match(backend,/notification:job\.notification,endpoint:failedEndpoint/);
  assert.match(backend,/const \{transient_endpoints:_internalRetryTargets,\.\.\.publicDelivery\}/);
});

test("only signed-in accounts can inspect and repair their push registration",()=>{
  const start=backend.indexOf('if(url.pathname==="/api/push/subscriptions"&&request.method==="GET")');
  const end=backend.indexOf('if(url.pathname==="/api/push/subscriptions"&&request.method==="POST")',start);
  assert.ok(start>=0&&end>start);
  const getRoute=backend.slice(start,end);
  assert.match(getRoute,/const user=await requireUser\(request,env\)/);
  assert.match(getRoute,/if\(!user\)return json\(\{error:"Authentication required\."\},401,origin\)/);
  assert.match(getRoute,/WHERE user_id=\?/);
});
