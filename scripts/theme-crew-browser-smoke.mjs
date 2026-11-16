import assert from "node:assert/strict";
import {mkdirSync} from "node:fs";
import {chromium} from "playwright";

// Prism Warden: actual browser rendering, not keyword matching masquerading as QA.
// Served from localhost; NEVER connects to authenticated member or GOD sessions.
const base=process.env.THEME_TEST_BASE||"http://127.0.0.1:8765";
const out="artifacts/theme-crew/visual";
mkdirSync(out,{recursive:true});
const routes=["/","/community.html","/chaos-cartridge.html","/messages.html","/devil-tools.html","/moonology.html","/shops.html","/auth.html","/theme-crew.html"];
const looks={
 cathedral:null,
 blood_moon:"#d54372",
 verdant_crypt:"#70bd83",
 iron_eclipse:"#8376df",
 royal_abyss:"#d3a65b"
};
const viewports=[{width:390,height:844,mobile:true},{width:1366,height:900,mobile:false}];
const browser=await chromium.launch({headless:true});
let pagesChecked=0,screenshots=0;
try{
 for(const vp of viewports){
  const context=await browser.newContext({viewport:{width:vp.width,height:vp.height},isMobile:vp.mobile,hasTouch:vp.mobile,deviceScaleFactor:1});
  try{
   // The default published site must still be the approved Gothic cathedral.
   for(const route of routes){
    const page=await context.newPage();
    try{
     const response=await page.goto(base+route,{waitUntil:"domcontentloaded",timeout:30000});
     assert.ok(response?.ok(),route+" must respond successfully");
     await page.waitForFunction(()=>!!window.KnightfallThemeCrew&&!!document.body.dataset.kfTheme&&!!document.querySelector('link[data-theme-crew]'),null,{timeout:16000});
     const state=await page.evaluate(()=>{
      const links=[...document.querySelectorAll('link[rel=stylesheet]')].map(n=>n.href);
      const shared=links.filter(x=>/\/(?:knightfall-unified-theme|knightfall-artwork|knightfall-cathedral-v2|theme-crew)\.css/.test(x));
      return {preset:document.body.dataset.kfTheme,realm:document.body.dataset.kfRealm,
       final:shared.at(-1)||"",crew:links.filter(x=>x.includes("/theme-crew.css")).length,
       overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
     });
     assert.equal(state.preset,"cathedral",route+" must preserve the approved live default");
     assert.ok(state.realm,route+" must have a realm classification");
     assert.match(state.final,/\/theme-crew\.css(?:\?|$)/,route+" must load last audited CSS layer");
     assert.equal(state.crew,1,route+" must not duplicate the global theme stylesheet");
     assert.ok(state.overflow<=2,route+" horizontal overflow on "+vp.width+"px viewport: "+state.overflow);
     if(["/","/community.html","/chaos-cartridge.html","/messages.html","/devil-tools.html","/moonology.html"].includes(route)){
      const key=route==="/"?"home":route.slice(1).replace(".html","");
      await page.screenshot({path:out+"/baseline-"+key+"-"+vp.width+".png",animations:"disabled"});
      screenshots++;
     }
     if(route==="/theme-crew.html"){
      const workspace=await page.locator("#theme-crew-workspace").isHidden();
      assert.equal(workspace,true,"Guest must not see GOD publisher controls");
     }
     pagesChecked++;
     console.log("PRISM PASS",route,vp.width+"px","realm",state.realm);
    }finally{await page.close()}
   }
   // Real computed styles must change when each safe approved preset is previewed.
   for(const [key,expectedGlow] of Object.entries(looks)){
    const page=await context.newPage();
    try{
     const query=key==="cathedral"?"":"?kf_theme_preview="+encodeURIComponent(key);
     const response=await page.goto(base+"/"+query,{waitUntil:"domcontentloaded",timeout:30000});
     assert.ok(response?.ok(),"Preview must load "+key);
     await page.waitForFunction(key=>document.body?.dataset.kfTheme===key&&!!window.KnightfallThemeCrew,key,{timeout:16000});
     const actual=await page.evaluate(()=>({
      theme:document.body.dataset.kfTheme,
      glow:getComputedStyle(document.body).getPropertyValue("--kf-realm-glow").trim().toLowerCase(),
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
     }));
     assert.equal(actual.theme,key);
     if(expectedGlow)assert.equal(actual.glow,expectedGlow,key+" must alter the computed browser palette");
     assert.ok(actual.overflow<=2,key+" creates horizontal overflow at "+vp.width+"px");
     await page.screenshot({path:out+"/preset-"+key+"-"+vp.width+".png",animations:"disabled"});
     screenshots++;
     // None of the global preset variables may override a custom profile.
     if(key==="iron_eclipse"){
      const guarded=await page.evaluate(()=>{
       document.body.classList.add("profile-custom-theme");
       const profile=getComputedStyle(document.body).getPropertyValue("--kf-crew-accent").trim();
       document.body.classList.remove("profile-custom-theme");
       document.body.classList.add("kf-gameplay-page");
       const gameplay=getComputedStyle(document.body).getPropertyValue("--kf-crew-accent").trim();
       document.body.classList.remove("kf-gameplay-page");
       return {profile,gameplay};
      });
      assert.equal(guarded.profile,"","Personal profile custom palette must not inherit global preset override");
      assert.equal(guarded.gameplay,"","Game pages must not inherit global preset override");
     }
     console.log("PRISM PREVIEW",key,vp.width+"px",actual.glow);
    }finally{await page.close()}
   }
  }finally{await context.close()}
 }
 console.log("Prism Warden real Chromium smoke passed",pagesChecked,"route/viewport checks and",screenshots,"visual screenshots.");
}finally{await browser.close()}
