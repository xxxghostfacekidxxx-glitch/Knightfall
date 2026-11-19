import assert from "node:assert/strict";
import {chromium} from "playwright";
const BASE=process.env.CHAOS_IMAGE_TEST_BASE||"http://127.0.0.1:8765";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const bufferFromDataUrl=data=>Buffer.from(data.split(",")[1],"base64");
async function syntheticPhoto(page){
 const data=await page.evaluate(()=>{
  const c=document.createElement("canvas");c.width=256;c.height=256;const ctx=c.getContext("2d");
  ctx.fillStyle="#fff";ctx.fillRect(0,0,256,256);
  ctx.fillStyle="#ff2288";ctx.fillRect(20,20,170,210);
  ctx.fillStyle="#1a1028";ctx.fillRect(80,80,90,80);
  return c.toDataURL("image/png");
 });
 return bufferFromDataUrl(data);
}
async function mockApi(page,kind="owner"){
 const calls=[],isOwner=kind==="owner";
 await page.route("https://api.ash-fall.com/**",route=>{
  const request=route.request(),url=new URL(request.url()),path=url.pathname,method=request.method();
  const respond=(data,status=200,type="application/json")=>route.fulfill({
   status,contentType:type,headers:{"access-control-allow-origin":BASE,"access-control-allow-credentials":"true"},
   body:type==="application/json"?JSON.stringify(data):data
  });
  if(path==="/api/auth/me")return respond({user:{id:isOwner?93:24,username:isOwner?"osiris-tester":"regular-member",role:isOwner?"god":"member"}});
  if(path==="/api/chaos/modes")return respond({modes:isOwner?[
   {id:"standard",label:"Miss Chaos",full_chat:"/miss-chaos.html"},
   {id:"owner",label:"Osiris · Private Chaos",full_chat:"/miss-chaos.html?companion=owner"}
  ]:[{id:"standard",label:"Miss Chaos",full_chat:"/miss-chaos.html"}],
    permissions:{can_admin:isOwner,can_eye_of_chaos:isOwner}});
  if(path==="/api/chaos/companion")return respond({role:isOwner?"owner":"member",accepted:isOwner});
  if(path==="/api/chaos/conversations"&&method==="GET")return respond({conversations:[]});
  if(path==="/api/chaos/conversations"&&method==="POST")return respond({conversation:{id:"test-chat-123",title:"Test"}});
  if(path==="/api/chaos/conversations/test-chat-123/messages")return respond({messages:[]});
  if(path==="/api/chaos/memories")return respond({memories:[]});
  if(path==="/api/chaos/chat"&&method==="POST"){
   const body=JSON.parse(request.postData()||"{}");calls.push(body);
   if(request.headers().accept?.includes("text/event-stream")){
    return respond('event: delta\ndata: {"text":"I can see a pink shape in the image."}\n\nevent: done\ndata: {"ok":true}\n\n',
     200,"text/event-stream");
   }
   return respond({reply:"I can see a pink shape in the image.",mood:"default"});
  }
  if(path==="/health")return respond({ok:true});
  if(path==="/api/devil-tools/assets"||path==="/api/devil-tools/asset-submissions")return respond({assets:[]});
  return respond({});
 });
 return calls;
}
async function verifyPopup(width,kind){
 const page=await browser.newPage({viewport:{width,height:850},acceptDownloads:true});
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 const calls=await mockApi(page,kind);
 try{
  const loaded=await page.goto(BASE+"/index.html",{waitUntil:"domcontentloaded",timeout:30000});
  assert.equal(loaded.status(),200);
  await page.waitForSelector("#miss-chaos-presence",{timeout:12000});
  if(await page.locator("#mc-restore").isVisible())await page.click("#mc-restore");
  await page.locator("#miss-chaos-launcher").click();
  await page.waitForSelector('#miss-chaos-window:not([hidden])',{timeout:10000});
  await page.waitForSelector("#mc-form .mc-attach-button",{timeout:10000});
  const dimensions=await page.locator("#miss-chaos-window").boundingBox();
  assert.ok(dimensions&&dimensions.width>=300&&dimensions.height>=260,"popup must be usable at "+width+"px");
  assert.ok(dimensions.x>=-1&&dimensions.x+dimensions.width<=width+1,"popup must stay horizontally on screen");
  assert.ok(dimensions.y>=-1&&dimensions.y+dimensions.height<=850+1,"popup must stay vertically on screen");
  const avatar=await page.locator("#miss-chaos-window .mc-head>img").boundingBox();
  assert.ok(Math.abs(avatar.width-avatar.height)<1.5,"portrait cannot become stretched");
  if(kind!=="owner"){
   assert.equal(await page.locator("#mc-private-switch").isHidden(),true);
  }else{
   await page.locator("#mc-private-switch:not([hidden])").waitFor({timeout:10000});
   await page.click("#mc-private-switch");
   await page.waitForFunction(()=>document.querySelector("#miss-chaos-presence")?.dataset.assistantMode==="owner");
   assert.match(await page.locator("#mc-private-switch").innerText(),/Standard/);
   assert.equal(await page.locator("#mc-companion-mode").inputValue(),"owner");
   const png=await syntheticPhoto(page);
   await page.locator("#mc-form .mc-attach-input").setInputFiles({name:"pink-drawing.png",mimeType:"image/png",buffer:png});
   await page.locator(".mc-attachment-preview:not([hidden])").waitFor();
   await page.fill("#mc-input","What would this look like as a tattoo?");
   await page.click("#mc-send");
   await page.waitForFunction(()=>document.querySelector("#mc-messages")?.textContent.includes("I can see a pink shape"),{timeout:15000});
   assert.equal(calls.length,1);
   assert.equal(calls[0].companion,"owner");
   assert.match(calls[0].image,/^data:image\/jpeg;base64,/);
   assert.match(calls[0].message,/tattoo/);
   assert.equal(await page.locator(".mc-attachment-preview").isHidden(),true);
  }
  assert.deepEqual(errors.filter(x=>/TypeError|ReferenceError|SyntaxError/.test(x)),[],errors.join("\n"));
 }finally{await page.close();}
}
async function verifyFullChat(){
 const page=await browser.newPage({viewport:{width:390,height:850},acceptDownloads:true});
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 const calls=await mockApi(page,"member");
 try{
  const loaded=await page.goto(BASE+"/miss-chaos.html",{waitUntil:"domcontentloaded",timeout:30000});
  assert.equal(loaded.status(),200);
  await page.locator("#chat-form .mc-attach-input").waitFor({timeout:15000});
  const png=await syntheticPhoto(page);
  await page.locator("#chat-form .mc-attach-input").setInputFiles({name:"design.png",mimeType:"image/png",buffer:png});
  await page.locator(".mc-attachment-preview:not([hidden])").waitFor();
  // Image-only sending is supported: the prompt defaults to a visual description.
  await page.click("#send-button");
  await page.waitForFunction(()=>document.querySelector("#chat-messages")?.textContent.includes("I can see a pink shape"),{timeout:15000});
  assert.equal(calls.length,1);
  assert.match(calls[0].message,/Describe this image/);
  assert.match(calls[0].image,/^data:image\/jpeg;base64,/);
  assert.equal(await page.locator(".mc-attachment-preview").isHidden(),true);
  assert.deepEqual(errors.filter(x=>/TypeError|ReferenceError|SyntaxError/.test(x)),[],errors.join("\n"));
 }finally{await page.close();}
}
async function verifyImageLibrary(){
 const page=await browser.newPage({viewport:{width:390,height:850}});
 const calls=await mockApi(page,"owner");
 try{
  const loaded=await page.goto(BASE+"/devil-tools.html#site-image-library",{waitUntil:"domcontentloaded",timeout:30000});
  assert.equal(loaded.status(),200);
  await page.locator("#kf-art-photo-input").waitFor({state:"attached",timeout:15000});
  assert.equal(await page.locator("#kf-art-photo-input").getAttribute("accept"),"image/*");
  const png=await syntheticPhoto(page);
  await page.locator("#kf-art-photo-input").setInputFiles({name:"from-photos.png",mimeType:"image/png",buffer:png});
  await page.locator("#kf-art-staged .kf-art-item").waitFor({timeout:15000});
  assert.match(await page.locator("#kf-art-staged").innerText(),/from-photos/);
  assert.equal(calls.length,0,"local image preparation does not send a chat image");
 }finally{await page.close();}
}
try{
 await verifyPopup(390,"owner");
 await verifyPopup(1280,"owner");
 await verifyPopup(390,"member");
 await verifyFullChat();
 await verifyImageLibrary();
 console.log("Miss Chaos photo chat, private mode and Image Library verified in mobile/desktop Chromium.");
}finally{await browser.close();}
