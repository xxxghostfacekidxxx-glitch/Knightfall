// Real Chromium interaction smoke: desktop, Android-sized, live editing, save and exports.
import { chromium } from "playwright";
import assert from "node:assert/strict";
const base=process.env.AVATAR_TEST_BASE||"http://127.0.0.1:8765";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const errors=[];
async function scenario(label,viewport){
 const context=await browser.newContext({viewport,acceptDownloads:true,reducedMotion:"reduce"});
 const page=await context.newPage();
 const pageErrors=[],writes=[];
 let slots=[1,2].map(slot_no=>({slot_no,unlocked:true,empty:true,name:"",avatar:null,is_active:false}));
 const headers={"content-type":"application/json","access-control-allow-origin":new URL(base).origin,
  "access-control-allow-credentials":"true","access-control-allow-methods":"GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "access-control-allow-headers":"content-type"};
 page.on("pageerror",error=>pageErrors.push(error.message));
 page.on("dialog",dialog=>dialog.accept());
 await page.route("https://api.ash-fall.com/**",async route=>{
  const request=route.request(),url=new URL(request.url()),path=url.pathname,method=request.method();
  const reply=(status,body)=>route.fulfill({status,headers,body:JSON.stringify(body)});
  if(method==="OPTIONS")return route.fulfill({status:204,headers});
  if(path==="/api/auth/me")return reply(200,{user:{id:71,username:"misfit_tester",role:"member"}});
  if(path==="/api/mascot-pets/me")return reply(200,{pets:[]});
  if(path==="/api/avatars/me")return reply(200,{slots,wallet_balance:2000,extra_slots:0,max_extra_slots:20,products:[]});
  if(path==="/api/avatars/save"&&method==="PUT"){
   const input=JSON.parse(request.postData()||"{}");writes.push(input);
   if(input.active)slots=slots.map(slot=>({...slot,is_active:false}));
   slots=slots.map(slot=>slot.slot_no===input.slot_no?{...slot,empty:false,avatar:input.avatar,name:input.name,is_active:input.active}:slot);
   return reply(200,{ok:true,slots,message:"Saved"});
  }
  if(path==="/api/avatars/active"&&method==="PATCH"){
   const input=JSON.parse(request.postData()||"{}");
   slots=slots.map(slot=>({...slot,is_active:input.slot_no===slot.slot_no}));
   return reply(200,{ok:true,slots,message:"Profile updated"});
  }
  if(path.startsWith("/api/avatars/")&&method==="DELETE"){
   const n=Number(path.split("/").pop());
   slots=slots.map(slot=>slot.slot_no===n?{...slot,empty:true,name:"",avatar:null,is_active:false}:slot);
   return reply(200,{ok:true,slots});
  }
  return reply(200,{});
 });
 try{
  const response=await page.goto(base+"/avatar-studio.html",{waitUntil:"domcontentloaded"});
  assert.equal(response?.status(),200);
  await page.waitForFunction(()=>document.getElementById("slot-note")?.textContent?.includes("Slot 1 of 2"));
  assert.equal(await page.locator("#category-tabs .category-tab").count(),4);
  assert.equal(await page.locator("#preset-list .preset-chip").count(),9);
  assert.ok((await page.locator("#avatar-preview svg").count())===1);
  await page.getByRole("tab",{name:/Expression/}).click();
  const tattoo=page.locator("fieldset.control-group").filter({has:page.locator("legend",{hasText:"Face tattoo"})});
  await tattoo.getByRole("button",{name:"Face tattoo: Neon sigil"}).click();
  assert.equal(await tattoo.getByRole("button",{name:"Face tattoo: Neon sigil"}).getAttribute("aria-pressed"),"true");
  await tattoo.getByRole("button",{name:"Lock Face tattoo during remix"}).click();
  await page.getByRole("button",{name:/Remix unlocked/}).click();
  assert.equal(await tattoo.getByRole("button",{name:"Face tattoo: Neon sigil"}).getAttribute("aria-pressed"),"true","Tattoo lock must survive remix");
  assert.match(await page.locator("#unsaved-indicator").innerText(),/Unsaved/);
  await page.getByRole("button",{name:"Undo last change"}).click();
  assert.equal(await tattoo.getByRole("button",{name:"Face tattoo: Neon sigil"}).getAttribute("aria-pressed"),"true");
  await page.getByRole("button",{name:"Redo last change"}).click();
  await page.getByRole("tab",{name:/Face & hair/}).click();
  await page.getByRole("button",{name:"Skin tone: Frost"}).click();
  await page.locator("#avatar-name").fill("Neon Phantom");
  await page.locator("#save-avatar").click();
  await page.waitForFunction(()=>document.getElementById("studio-status")?.textContent==="Saved");
  assert.equal(writes.length,1);assert.equal(writes[0].name,"Neon Phantom");
  assert.equal(writes[0].avatar.skin,"frost");assert.equal(writes[0].avatar.tattoo,"neon_sigil");
  await page.locator("#set-active").click();
  await page.waitForFunction(()=>document.getElementById("studio-status")?.textContent==="Saved");
  assert.equal(writes.length,2);assert.equal(writes[1].active,true);
  assert.equal(slots[0].is_active,true);
  const comparison=page.locator("#preview-compare");
  await comparison.dispatchEvent("pointerdown",{pointerId:1,pointerType:"mouse"});
  assert.equal(await page.locator("#avatar-preview").getAttribute("aria-label"),"Last saved Misfit appearance");
  await comparison.dispatchEvent("pointerup",{pointerId:1,pointerType:"mouse"});
  assert.equal(await page.locator("#avatar-preview").getAttribute("aria-label"),"Live Misfit character preview");
  const svgDownload=page.waitForEvent("download");
  await page.locator("#download-svg").click();
  assert.match((await svgDownload).suggestedFilename(),/neon-phantom-knightfall-avatar\.svg$/);
  const pngDownload=page.waitForEvent("download");
  await page.locator("#download-avatar").click();
  assert.match((await pngDownload).suggestedFilename(),/neon-phantom-knightfall-avatar\.png$/);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=2,"Horizontal page overflow: "+overflow+"px");
  if(viewport.width<600){
   await page.locator(".studio-actions").scrollIntoViewIfNeeded();
   const dock=await page.locator(".studio-actions").evaluate(node=>getComputedStyle(node).position);
   assert.equal(dock,"sticky","Mobile save dock must stick");
  }
  assert.deepEqual(pageErrors,[],"Unexpected browser runtime error");
  console.log("PASS avatar studio "+label+": appearance controls, locks, history, save, profile, exports and layout");
 }catch(error){
  errors.push(label+": "+error.stack);
  try{await page.screenshot({path:"/tmp/avatar-studio-"+label+".png",fullPage:true})}catch{}
 }finally{await context.close();}
}
await scenario("desktop",{width:1280,height:900});
await scenario("android",{width:390,height:844});
await browser.close();
if(errors.length){console.error(errors.join("\n\n"));process.exitCode=1;}
