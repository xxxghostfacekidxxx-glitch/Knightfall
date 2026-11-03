import {chromium} from "playwright";
import assert from "node:assert/strict";
const base=process.env.PROFILE_TEST_BASE||"http://127.0.0.1:8765";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const failures=[];
const blankUser={
 id:71,username:"profile_tester",role:"member",display_name:"Dusk Collector",
 bio:"A small story.",avatar_url:"",cover_url:"",website_url:"",
 location:"",pronouns:"",accent_color:"#ff55d8",profile_theme:"ember",
 status_message:"",tagline:"",interests:"",favorite_games:"",favorite_music:"",
 favorite_quote:"",profile_visibility:"public",show_activity:1
};
async function scenario(name,viewport){
 const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[];
 const savedProfiles=[],savedLayouts=[],uploads=[],gallery=[];
 let user={...blankUser},layout=[{id:"favorites",visible:true},{id:"activity",visible:true},{id:"updates",visible:true},{id:"photos",visible:true}];
 page.on("pageerror",e=>errors.push(e.message));
 page.on("dialog",d=>d.accept());
 await page.route("https://api.ash-fall.com/**",async route=>{
  const r=route.request(),url=new URL(r.url()),method=r.method(),path=url.pathname;
  const headers={"content-type":"application/json","access-control-allow-origin":r.headers().origin||base,"access-control-allow-credentials":"true",
   "access-control-allow-methods":"GET,PUT,POST,OPTIONS,DELETE","access-control-allow-headers":"content-type"};
  const respond=(status,body)=>route.fulfill({status,headers,body:JSON.stringify(body)});
  if(method==="OPTIONS")return route.fulfill({status:204,headers});
  if(path==="/api/auth/me")return respond(200,{user});
  if(path==="/api/profile/layout"&&method==="GET")return respond(200,{layout});
  if(path==="/api/profile/layout"&&method==="PUT"){
   const d=JSON.parse(r.postData()||"{}");layout=d.layout;savedLayouts.push(d);return respond(200,{ok:true,layout});
  }
  if(path==="/api/profile/birth-chart")return respond(200,{chart:null,visible:false});
  if(path==="/api/profile"&&method==="PUT"){
   const values=JSON.parse(r.postData()||"{}");
   savedProfiles.push(values);user={...user,...values,show_activity:values.show_activity?1:0};return respond(200,{user});
  }
  if(path==="/api/profile/photos"&&method==="GET")return respond(200,{photos:gallery});
  if(path==="/api/profile/photos"&&method==="POST"){
   const raw=r.postDataBuffer(),str=raw?.toString("latin1")||"";
   const kind=str.includes('name="kind"\r\n\r\navatar')?"avatar":"gallery";
   uploads.push(kind);
   const id=uploads.length+800;
   const photo={id,url:"https://api.ash-fall.com/api/profile-media/"+id,kind,caption:"Uploaded photo",created_at:new Date().toISOString()};
   if(kind==="gallery")gallery.unshift(photo);
   return respond(201,{photo});
  }
  if(path.match(/^\/api\/profile\/photos\/\d+$/)&&method==="DELETE"){
   const id=Number(path.split("/").pop()),ix=gallery.findIndex(p=>p.id===id);
   if(ix<0)return respond(404,{error:"Photo missing"});
   const [photo]=gallery.splice(ix,1);
   if(user.cover_url===photo.url)user.cover_url="";
   return respond(200,{ok:true});
  }
  if(path==="/api/site-settings")return respond(200,{settings:{site_name:"Knightfall",feature_miss_chaos:"false"}});
  return respond(200,{});
 });
 try{
  const loaded=await page.goto(base+"/profile-edit.html",{waitUntil:"domcontentloaded"});
  assert.equal(loaded.status(),200);
  await page.waitForFunction(()=>document.querySelector("#studio-save-indicator")?.dataset.state==="saved");
  await page.locator('#form [name="display_name"]').fill("Neon Archivist");
  await page.locator('#form [name="profile_theme"]').selectOption("toxic");
  await page.locator('[data-layout-preset="showcase"]').click();
  assert.match(await page.locator("#studio-save-indicator").innerText(),/Unsaved/);
  assert.equal(await page.locator("#studio-preview-name").innerText(),"Neon Archivist");
  assert.equal(await page.locator("#studio-preview-card").getAttribute("data-theme"),"toxic");
  await page.locator('#form button[type="submit"]').click();
  await page.waitForFunction(()=>document.querySelector("#studio-save-indicator")?.dataset.state==="saved");
  assert.equal(savedProfiles.length,1,"Profile update request must be sent once");
  assert.equal(savedLayouts.length,1,"Main Save profile should save pending layout");
  assert.equal(user.display_name,"Neon Archivist");
  assert.match(page.url(),/\/profile-edit\.html$/,"Save must not throw user out of studio");
  await page.locator('#form [name="bio"]').fill("A draft that should not publish.");
  await page.locator("#studio-discard").click();
  assert.equal(await page.locator('#form [name="bio"]').inputValue(),"A small story.");
  assert.equal(savedProfiles.length,1,"Discard must not call backend");
  const png=await page.evaluate(()=>{
   const c=document.createElement("canvas");c.width=660;c.height=420;
   const ctx=c.getContext("2d");ctx.fillStyle="#ff55d8";ctx.fillRect(0,0,660,420);
   ctx.fillStyle="#c6ff45";ctx.fillRect(240,30,90,360);
   return c.toDataURL("image/png").split(",")[1];
  });
  await page.locator("#cover-file").setInputFiles({name:"skyline.png",mimeType:"image/png",buffer:Buffer.from(png,"base64")});
  await page.waitForFunction(()=>!!document.querySelector("#cover-file")?._compressedBlob);
  await page.locator("#studio-cover-crop").selectOption("top");
  await page.waitForFunction(()=>!!document.querySelector("#cover-file")?._compressedBlob&&document.querySelector("#status")?.textContent.includes("ready"));
  assert.ok(await page.locator("#cover-upload-preview").isVisible());
  await page.locator('#form button[type="submit"]').click();
  await page.waitForFunction(()=>document.querySelector("#studio-save-indicator")?.dataset.state==="saved");
  assert.ok(uploads.includes("gallery"),"Cover crop must upload real image pixels");
  assert.match(user.cover_url,/^https:\/\/api\.ash-fall\.com\/api\/profile-media\/\d+$/);
  assert.equal(savedProfiles.length,2);
  assert.equal(savedLayouts.length,1,"Save should not rewrite unchanged layout");
  await page.locator("#avatar-file").setInputFiles({name:"avatar.png",mimeType:"image/png",buffer:Buffer.from(png,"base64")});
  await page.waitForFunction(()=>document.querySelector("#avatar_url")?.value?.startsWith?.("data:image")||
   document.querySelector('#form [name="avatar_url"]')?.value?.startsWith("data:image/"));
  await page.locator('#form button[type="submit"]').click();
  await page.waitForFunction(()=>document.querySelector("#studio-save-indicator")?.dataset.state==="saved");
  assert.ok(uploads.includes("avatar"),"Avatar upload must be preserved");
  // Gallery management is independent of the main profile save.
  await page.locator("#studio-photo-file").setInputFiles({name:"memory.png",mimeType:"image/png",buffer:Buffer.from(png,"base64")});
  await page.locator("#studio-photo-caption").fill("The Neon Roof");
  await page.locator('#studio-photo-upload button[type="submit"]').click();
  await page.waitForFunction(()=>document.querySelector("#studio-photo-count")?.textContent.includes("2 / 60"));
  assert.equal(gallery.length,2);
  const coverChoice=gallery[0];
  await page.locator('#studio-photo-grid .studio-photo-card').first().locator('button').filter({hasText:'Use as cover'}).click();
  assert.equal(await page.locator('#form [name="cover_url"]').inputValue(),coverChoice.url);
  await page.locator('#form button[type="submit"]').click();
  await page.waitForFunction(()=>document.querySelector("#studio-save-indicator")?.dataset.state==="saved");
  assert.equal(user.cover_url,coverChoice.url);
  await page.locator('#studio-photo-grid .studio-photo-card').first().locator('button').filter({hasText:'Delete'}).click();
  await page.waitForFunction(()=>document.querySelector("#studio-photo-count")?.textContent.includes("1 / 60"));
  assert.equal(user.cover_url,"","Deleting selected gallery cover must also clear published reference");
  assert.equal(gallery.length,1);
  await page.locator('#form [name="tagline"]').fill("I remain.");
  await page.keyboard.press("Control+s");
  await page.waitForFunction(()=>document.querySelector("#studio-save-indicator")?.dataset.state==="saved");
  assert.equal(user.tagline,"I remain.");
  const widths=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert.ok(widths.page<=widths.viewport+2,"Mobile horizontal overflow "+JSON.stringify(widths));
  assert.deepEqual(errors,[],"Uncaught browser errors");
  console.log("PASS",name);
 }catch(e){failures.push(name+": "+e.message);console.error("FAIL",name,e)}
 finally{await context.close()}
}
try{await scenario("Profile Studio desktop",{width:1365,height:900});await scenario("Profile Studio Android",{width:390,height:844})}
finally{await browser.close()}
if(failures.length){console.error(failures.join("\n"));process.exitCode=1}
