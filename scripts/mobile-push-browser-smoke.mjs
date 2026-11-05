import assert from "node:assert/strict";
import { chromium } from "playwright";

// Deterministic Android browser harness. No real users, subscriptions or pushes.
const base=process.env.PWA_TEST_BASE||"http://127.0.0.1:8765";
const browser=await chromium.launch({headless:true});
const key=Buffer.from(Uint8Array.from({length:65},(_,i)=>i===0?4:7)).toString("base64url");
const endpoint="https://fcm.googleapis.com/fcm/send/test-device-only";

async function scenario({existing=false,registered=false,stage="display-requested"}={}){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:"Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36"});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",error=>errors.push(String(error)));
  let onServer=registered,testEndpoint=null,workerStage="pending";
  const testId="a".repeat(40);
  await page.addInitScript(({existing,endpoint,key})=>{
    window.__pushCalls=[];
    const subscription={endpoint,options:{applicationServerKey:Uint8Array.from(atob(key.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-key.length%4)%4)),x=>x.charCodeAt(0)).buffer},
      toJSON:()=>({endpoint,keys:{p256dh:"a".repeat(87),auth:"b".repeat(22)}}),
      unsubscribe:async()=>{window.__pushCalls.push("unsubscribe");window.__pushSubscription=null;return true}};
    window.__pushSubscription=existing?subscription:null;
    const reg={active:{},waiting:null,pushManager:{
      getSubscription:async()=>window.__pushSubscription,
      subscribe:async()=>{window.__pushCalls.push("subscribe");window.__pushSubscription=subscription;return subscription;}
    }};
    let receiptListener;
    Object.defineProperty(navigator,"serviceWorker",{configurable:true,value:{
      getRegistration:async()=>reg,
      ready:Promise.resolve(reg),
      register:async()=>reg,
      addEventListener:(event,fn)=>{if(event==="message")receiptListener=fn;}
    }});
    window.__emitPushReceipt=stage=>receiptListener?.({data:{type:"KF_PUSH_RECEIVED",tag:"ashfall-account-test",stage}});
    Object.defineProperty(window,"PushManager",{configurable:true,value:function PushManager(){}});
    Object.defineProperty(window,"Notification",{configurable:true,value:{
      permission:existing?"granted":"default",
      requestPermission(){window.__pushCalls.push("permission");this.permission="granted";return Promise.resolve("granted");}
    }});
  },{existing,endpoint,key});
  await page.route("**/nav.js*",route=>route.fulfill({status:200,contentType:"application/javascript",body:"/* isolated Android push test */"}));
  await page.route("https://api.ash-fall.com/**",async route=>{
    const request=route.request(),url=new URL(request.url());
    const path=url.pathname,method=request.method();
    let data={},status=200;
    if(path==="/api/notifications")data={notifications:[],unread_count:0};
    else if(path==="/api/notification-preferences")data=method==="GET"?{push_available:true,preferences:{push_messages:true,push_community:true,push_account:true,quiet_start:null,quiet_end:null}}:{ok:true};
    else if(path==="/api/push/vapid-public-key")data={public_key:key};
    else if(path==="/api/push/subscriptions"){
      if(method==="GET")data={subscriptions:onServer?[{endpoint}]:[]};
      else if(method==="POST"){onServer=true;data={ok:true};}
      else if(method==="DELETE"){onServer=false;data={ok:true};}
    }else if(path==="/api/push/test"){
      const body=request.postDataJSON();
      testEndpoint=body.endpoint;
      if(testEndpoint!==endpoint){status=409;data={error:"Wrong device"};}
      else data={ok:true,delivery:{attempted:1,accepted:1,failed:0},test_id:testId};
    }else if(path==="/api/push/test-status"){
      data={state:workerStage};
    }else if(path==="/api/push/receipt"){
      workerStage=request.postDataJSON().stage;
      data={ok:true};
    }else{status=404;data={error:"Mock API path not found: "+path};}
    await route.fulfill({status,contentType:"application/json",headers:{"access-control-allow-origin":new URL(base).origin,"access-control-allow-credentials":"true"},body:JSON.stringify(data)});
  });
  const response=await page.goto(base+"/notifications.html",{waitUntil:"load"});
  assert.equal(response?.status(),200);
  if(!existing){
    await page.getByRole("button",{name:"Enable push notifications"}).waitFor();
    await page.getByRole("button",{name:"Enable push notifications"}).click();
    await page.getByRole("button",{name:"Turn off push notifications"}).waitFor();
    const calls=await page.evaluate(()=>window.__pushCalls);
    assert.equal(calls[0],"permission","Android permission must be requested synchronously with the tap");
    assert.ok(calls.includes("subscribe"));
  }else{
    await page.getByRole("button",{name:"Turn off push notifications"}).waitFor();
    const calls=await page.evaluate(()=>window.__pushCalls);
    assert.equal(calls.length,0,"Reconnected existing push subscription without prompting again");
  }
  assert.equal(onServer,true,"Phone must be registered on the server");
  assert.match(await page.locator("#push-device-details").innerText(),/server registration connected/);
  await page.getByRole("button",{name:"Test this device"}).click();
  assert.equal(testEndpoint,endpoint,"Phone test must not target the PC subscription");
  await page.evaluate(async ({testId,stage})=>{
    window.__emitPushReceipt(stage);
    await fetch("https://api.ash-fall.com/api/push/receipt",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({test_id:testId,stage})
    });
  },{testId,stage});
  await page.waitForFunction(expected=>document.querySelector("#push-status")?.textContent.includes(expected),stage==="display-failed"?"could not show a notification":"service worker received the push",{timeout:5000});
  await page.waitForFunction(()=>!document.querySelector("#test-push").disabled);
  if(stage==="display-failed")assert.match(await page.locator("#push-status").innerText(),/could not show a notification/);
  await page.getByRole("button",{name:"Test this device"}).waitFor({state:"visible"});
  const width=await page.evaluate(()=>({screen:document.documentElement.clientWidth,content:document.documentElement.scrollWidth}));
  assert.ok(width.content<=width.screen+2,"Mobile push settings overflow the phone viewport: "+JSON.stringify(width));
  assert.deepEqual(errors,[],"JavaScript exceptions in mobile notification page");
  await context.close();
}
try{
  await scenario({existing:false,registered:false});
  await scenario({existing:true,registered:false});
  await scenario({existing:true,registered:true,stage:"display-failed"});
  console.log("Android push browser smoke passed: tap permission, device registration, silent recovery, targeted test and worker receipt.");
}finally{await browser.close();}
