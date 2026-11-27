import assert from "node:assert/strict";
import {chromium} from "playwright";
import {resolve} from "node:path";
import {stat} from "node:fs/promises";
import {staffCapabilities} from "../backend/src/staff-capabilities.js";
const origin="https://ash-fall.com",root=resolve("public");
const matrix=[["guest",null],["member",{role:"member"}],["creator",{role:"member",public_title:"Digital Creator"}],["moderator",{role:"moderator"}],["admin",{role:"admin"}],["Isis",{role:"admin",is_isis:1}],["Osiris",{role:"god"}],["revoked",{role:"admin",username:"knightfallsamantha"}],["pending",{role:"member",handoff_invited:1}],["suspended",{role:"god",status:"suspended"}]];
const browser=await chromium.launch();
try{
 for(const width of [390,1440])for(const [label,attrs] of matrix){
  const user=attrs?{id:7,username:"qa-fixture",status:"active",...attrs}:null;
  if(user)user.staff_access=staffCapabilities(user);
  const active=user?.status==="active",rights=user?.staff_access||{};
  const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:"block"});
  try{
   await context.route("**/*",async route=>{
    const url=new URL(route.request().url());
    if(url.origin===origin){const file=resolve(root,"."+(url.pathname==="/"?"/index.html":url.pathname));if(!file.startsWith(root+"/")||!(await stat(file).catch(()=>null))?.isFile())return route.fulfill({status:404});return route.fulfill({path:file})}
    if(url.origin!=="https://api.ash-fall.com")return route.abort();
    const headers={"access-control-allow-origin":origin,"access-control-allow-credentials":"true"};
    if(url.pathname==="/api/auth/me")return route.fulfill({headers,json:{user}});
    return route.fulfill({headers,json:{settings:{},unread_count:0}});
   });
   const page=await context.newPage();
   await page.goto(origin+"/",{waitUntil:"domcontentloaded"});
   if(active)await page.waitForFunction(()=>window.KnightfallAccess?.can("member")===true);
   await page.locator(".kf-nav").waitFor({state:"attached"});
   if(width<1081)await page.locator(".kf-nav-toggle").click();
   for(const [selector,key] of [[".kf-foundry-link","can_create"],[".kf-handoff-link","can_handoff"],[".kf-eye-chaos-link","can_eye_of_chaos"],[".kf-admin-quick-link","can_admin"],["[data-kf-access=can_create]","can_create"]]){
    const el=page.locator(selector).first();
    assert.equal(await el.evaluate(x=>x.hidden),!(active&&rights[key]===true),label+" "+width+" "+key);
    assert.equal(await el.isVisible(),Boolean(active&&rights[key]),label+" "+width+" computed visibility "+key);
   }
   await page.goto(origin+"/chatbots.html",{waitUntil:"domcontentloaded"});
   if(active)await page.waitForFunction(()=>window.KnightfallAccess?.can("member")===true);
   assert.equal(await page.locator("[data-kf-access=can_create]").isVisible(),Boolean(active&&rights.can_create));
   console.log("PASS simulated",label,width);
  }finally{await context.close()}
 }
}finally{await browser.close()}
