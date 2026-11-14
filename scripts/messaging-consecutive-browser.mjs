import {chromium} from "playwright";
import assert from "node:assert/strict";
import {stat} from "node:fs/promises";
import {resolve} from "node:path";

const BASE=process.env.KNIGHTFALL_BROWSER_BASE||"http://127.0.0.1:8765";
const deferred=()=>{
 let resolve;const promise=new Promise(done=>{resolve=done;});
 return {promise,resolve};
};
const withTimeout=(promise,label)=>Promise.race([
 promise,new Promise((_,reject)=>setTimeout(()=>reject(Error(label+" timed out")),12000))
]);
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const failures=[];
const PUBLIC_DIR=resolve("public");
async function exercise(name,viewport,mode){
 const context=await browser.newContext({viewport,serviceWorkers:"block"});
 const page=await context.newPage(),errors=[];
 page.on("pageerror",error=>errors.push(error.message));
 const firstStarted=deferred(),firstRelease=deferred(),secondStarted=deferred();
 const posts=[],messages=[];
 // Account-only chat heads are intentionally disabled on localhost. Serve
 // the same local assets through the production origin for a truthful UI test.
 await page.route("https://ash-fall.com/**",async route=>{
  const url=new URL(route.request().url());
  const requested=resolve(PUBLIC_DIR,"."+url.pathname);
  const path=(await stat(requested).catch(()=>null))?.isFile()?requested:requested+".html";
  return route.fulfill({path}).catch(()=>route.fulfill({status:404}));
 });
 await page.route("https://api.ash-fall.com/**",async route=>{
  const request=route.request(),path=new URL(request.url()).pathname,method=request.method();
  const origin=request.headers().origin||BASE;
  const headers={
   "access-control-allow-origin":origin,"access-control-allow-credentials":"true",
   "access-control-allow-headers":"content-type",
   "access-control-allow-methods":"GET,POST,OPTIONS,PATCH,DELETE",
   "content-type":"application/json"
  };
  const json=(body,status=200)=>route.fulfill({status,headers,body:JSON.stringify(body)});
  if(method==="OPTIONS")return route.fulfill({status:204,headers});
  if(path==="/api/auth/me")return json({user:{id:7,username:"tester",role:"member",display_name:"Tester"}});
  if(path==="/api/messages/conversations"&&method==="GET")
   return json({conversations:[{
    id:87,kind:"direct",other_user_id:9,other_username:"friend",other_display_name:"Chaos Friend",
    other_avatar_url:null,other_last_seen_at:new Date().toISOString(),unread_count:0,
    messaging_blocked:0,last_body:messages.at(-1)?.body||"Open conversation",
    last_message_at:new Date().toISOString()
   }]});
  if(path==="/api/messages/conversations/87/typing")
   return json(method==="GET"?{typing:[]}:{ok:true});
  if(path==="/api/messages/conversations/87"&&method==="GET")return json({messages:[...messages]});
  if(path==="/api/messages/conversations/87"&&method==="POST"){
   const content=JSON.parse(request.postData()||"{}");
   const order=posts.push(content);
   if(order===1){firstStarted.resolve();await firstRelease.promise;}
   const message={
    id:100+order,conversation_id:87,sender_id:7,username:"tester",
    display_name:"Tester",created_at:new Date().toISOString(),body:String(content.body||"")
   };
   messages.push(message);
   if(order===2)secondStarted.resolve();
   return json({id:message.id},201);
  }
  if(path==="/api/arcade/chaos-cards"||path==="/api/arcade/turn-matches")
   return json({matches:[]});
  if(path==="/api/notifications")return json({unread_count:0,notifications:[]});
  if(path==="/api/site-settings")return json({settings:{maintenance_mode:"false"}});
  return json({ok:true,matches:[],friends:[],users:[],notifications:[],unread_count:0});
 });
 try{
  if(mode==="inbox"){
   await page.goto(BASE+"/messages.html?conversation=87",{waitUntil:"domcontentloaded"});
   await page.locator("#body").waitFor({state:"visible",timeout:15000});
   const field=page.locator("#body"),button=page.locator("#composer button.primary");
   await field.fill("first without leaving");
   await button.click();
   await withTimeout(firstStarted.promise,name+" first POST");
   assert.equal(await field.inputValue(),"","composer must clear before first POST completes");
   assert.equal(await field.isEnabled(),true);
   assert.equal(await button.isEnabled(),true);
   await field.fill("second while first is pending");
   await button.click();
   assert.equal(await field.inputValue(),"","second queued send clears immediately");
   assert.equal(posts.length,1,"second POST must queue in order while first is held");
   firstRelease.resolve();
   await withTimeout(secondStarted.promise,name+" second POST");
   await page.waitForFunction(()=>document.querySelector("#messages")?.textContent.includes("second while first is pending"),null,{timeout:12000});
   assert.equal(await field.isVisible(),true);
   assert.equal(await field.isEnabled(),true);
   assert.equal(new URL(page.url()).pathname,"/messages.html");
  }else{
   await page.goto("https://ash-fall.com/privacy.html",{waitUntil:"domcontentloaded"});
   await page.locator("#kf-chat-launcher").waitFor({state:"visible",timeout:15000});
   await page.locator("#kf-chat-launcher").click();
   await page.locator("#kf-chat-list .kf-chat-recent-item").first().waitFor({timeout:10000});
   await page.locator("#kf-chat-list .kf-chat-recent-item").first().click();
   const field=page.locator("#kf-chat-input"),button=page.locator("#kf-chat-send");
   await field.waitFor({state:"visible",timeout:10000});
   await field.fill("first bubble message");
   await button.click();
   await withTimeout(firstStarted.promise,name+" first POST");
   assert.equal(await field.inputValue(),"","floating input must clear before first POST completes");
   assert.equal(await button.isEnabled(),true);
   await field.fill("second bubble message");
   await button.click();
   assert.equal(await field.inputValue(),"","second bubble send must queue");
   assert.equal(posts.length,1);
   firstRelease.resolve();
   await withTimeout(secondStarted.promise,name+" second POST");
   await page.waitForFunction(()=>document.querySelector("#kf-chat-thread")?.textContent.includes("second bubble message"),null,{timeout:12000});
   assert.equal(await page.locator("#kf-chat-panel").isVisible(),true);
   assert.equal(await field.isVisible(),true);
   assert.equal(await field.isEnabled(),true);
   assert.equal(await button.isEnabled(),true);
  }
  assert.equal(posts.length,2,name+" must submit exactly two messages");
  assert.deepEqual(posts.map(x=>x.body),
   mode==="inbox"?["first without leaving","second while first is pending"]:
    ["first bubble message","second bubble message"]);
  console.log("PASS",name,"two consecutive messages while chat stays open");
 }catch(error){
  failures.push(name+": "+error.message+"; browser errors: "+errors.join(" | "));
  console.error("FAIL",name,error);
 }finally{
  firstRelease.resolve();
  await context.close();
 }
}
try{
 await exercise("inbox Android 390",{width:390,height:844},"inbox");
 await exercise("inbox desktop 1280",{width:1280,height:900},"inbox");
 await exercise("floating bubble Android 390",{width:390,height:844},"bubble");
 await exercise("floating bubble desktop 1280",{width:1280,height:900},"bubble");
}finally{await browser.close();}
if(failures.length){console.error(failures.join("\n"));process.exitCode=1;}
