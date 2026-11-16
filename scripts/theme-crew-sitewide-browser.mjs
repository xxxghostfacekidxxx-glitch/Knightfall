import assert from "node:assert/strict";
import {readdirSync,readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {chromium} from "playwright";

// Prism Warden: sweep every root-level HTML page with both 390px and 1366px.
// This reports skipped intentionally-unskinned pages, never quietly calls them tested.
const root=new URL("../public/",import.meta.url);
const base=process.env.THEME_TEST_BASE||"http://127.0.0.1:8765";
const out="artifacts/theme-crew/sitewide";
mkdirSync(out,{recursive:true});
const pages=readdirSync(root).filter(p=>p.endsWith(".html")).sort();
const routes=pages.map(page=>{
 const html=readFileSync(new URL(page,root),"utf8");
 const themed=/href=["']\/theme\.css(?:\?|["'])/i.test(html);
 const navigation=/(?:src=["']\/nav\.js|theme-crew-runtime\.js)/i.test(html);
 const intentional=/(?:^offline\.html$|^personal-bots-offline\.html$)/.test(page);
 return {page,themed,navigation,intentional};
});
const browser=await chromium.launch({headless:true});
const checks=[],errors=[];
try{
 for(const viewport of [{width:390,height:844,mobile:true},{width:1366,height:900,mobile:false}]){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},isMobile:viewport.mobile,hasTouch:viewport.mobile,deviceScaleFactor:1});
  try{
   for(const route of routes){
    const record={page:route.page,viewport:viewport.width,styled:route.themed,js:route.navigation,deliberate_offline:route.intentional,status:"not_run"};
    if(!route.themed){record.status="not_themed";checks.push(record);continue}
    const page=await context.newPage();
    try{
     page.setDefaultTimeout(6500);
     const response=await page.goto(base+"/"+route.page,{waitUntil:"domcontentloaded",timeout:12000});
     assert.ok(response?.ok(),"HTTP failure: "+response?.status());
     // Avoid waiting for backend auth. Static chrome should render independently.
     await page.waitForFunction(()=>{
      const links=[...document.querySelectorAll('link[rel=stylesheet]')];
      return links.some(l=>l.href.includes("/theme.css"))&&
       (document.body?.dataset.kfTheme||!document.querySelector('script[src*="theme-crew-runtime"]')&&!document.querySelector('script[src*="nav.js"]'));
     },null,{timeout:6500});
     const state=await page.evaluate(()=>{
      const body=document.body;
      const styles=[...document.querySelectorAll('link[rel=stylesheet]')].map(n=>n.href);
      const shared=styles.filter(s=>/\/(?:knightfall-unified-theme|knightfall-artwork|knightfall-cathedral-v2|theme-crew)\.css/.test(s));
      const heading=document.querySelector('main h1,main h2,h1');
      return {viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,
       theme:body.dataset.kfTheme||null,realm:body.dataset.kfRealm||null,
       sharedLast:shared.at(-1)||null,stylesheetCount:styles.length,
       header:!!document.querySelector(".kf-header"),heading:heading?.textContent.trim().slice(0,100)||null};
     });
     record.state=state;
     const issues=[];
     if(state.scroll>state.viewport+2)issues.push("horizontal_overflow");
     if(route.navigation&&!state.theme&&!route.intentional)issues.push("theme_runtime_missing");
     if(route.navigation&&state.theme&&state.theme!=="cathedral")issues.push("wrong_default_theme");
     if(route.navigation&&state.theme&&!state.realm)issues.push("realm_unclassified");
     if(route.navigation&&state.theme&&!/\/theme-crew\.css/.test(state.sharedLast||""))issues.push("incorrect_final_cascade");
     record.issues=issues;
     if(issues.length){
      const screenshot=out+"/"+route.page.replace(/[^a-z0-9.-]/gi,"_")+"-"+viewport.width+".png";
      await page.screenshot({path:screenshot,animations:"disabled"}).catch(()=>{});
      errors.push({page:route.page,width:viewport.width,issues,state});
      record.status="failed";
     }else record.status="passed";
    }catch(e){
     record.status="failed";record.error=String(e).slice(0,350);
     errors.push({page:route.page,width:viewport.width,error:record.error});
    }finally{
     checks.push(record);await page.close();
    }
   }
  }finally{await context.close()}
 }
}finally{await browser.close()}
const counts=checks.reduce((v,r)=>(v[r.status]=(v[r.status]||0)+1,v),{});
const report={generated_at:new Date().toISOString(),page_count:pages.length,tests:checks.length,counts,failures:errors,checks};
writeFileSync(out+"/report.json",JSON.stringify(report,null,2)+"\n");
console.log("PRISM WARDEN SITEWIDE MATRIX",JSON.stringify({page_count:pages.length,checks:checks.length,counts,failures:errors.slice(0,18)},null,2));
if(errors.length)process.exitCode=1;
