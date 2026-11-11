import assert from "node:assert/strict";
import {chromium} from "playwright";

// This checks a simulated authenticated UI session. It never signs in as,
// views, or changes a real member's private data.
const base=(process.env.ASTROLOGY_BROWSER_BASE||"http://127.0.0.1:8765").replace(/\/$/,"");
const ownChart={
 zodiac:"tropical",house_system:"Equal houses (Ascendant-based)",
 ascendant_sign:"Cancer",ascendant_degree:12,
 bodies:{
  Sun:{sign:"Aries",degree:10},Moon:{sign:"Libra",degree:10.2},
  Mercury:{sign:"Taurus",degree:5},Venus:{sign:"Gemini",degree:12},
  Mars:{sign:"Leo",degree:18},Jupiter:{sign:"Sagittarius",degree:10},
  Saturn:{sign:"Capricorn",degree:10}
 },
 house_placements:{Sun:10,Moon:4,Mercury:11,Venus:12,Mars:2,Jupiter:6,Saturn:7}
};
const sharedChart={
 zodiac:"tropical",house_system:"Whole sign",
 ascendant_sign:"Gemini",ascendant_degree:7,
 bodies:{
  Sun:{sign:"Libra",degree:10},Moon:{sign:"Pisces",degree:5},
  Mercury:{sign:"Scorpio",degree:4},Venus:{sign:"Aries",degree:10},
  Mars:{sign:"Libra",degree:10},Jupiter:{sign:"Leo",degree:8},
  Saturn:{sign:"Capricorn",degree:10}
 },
 house_placements:{Sun:5,Moon:10,Mercury:6,Venus:11,Mars:5,Jupiter:3,Saturn:8}
};
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const failures=[];
async function scenario(label,viewport){
 const ctx=await browser.newContext({viewport,acceptDownloads:true});
 const page=await ctx.newPage(),errors=[],counts={owner:0,shared:0};
 page.on("pageerror",error=>errors.push(error.message));
 await page.addInitScript(()=>{
  sessionStorage.setItem("knightfall:cosmic-compare-user","profile_friend");
 });
 await page.route("https://api.ash-fall.com/**",async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname,method=req.method();
  const headers={
   "content-type":"application/json",
   "access-control-allow-origin":req.headers().origin||base,
   "access-control-allow-credentials":"true",
   "access-control-allow-headers":"content-type",
   "access-control-allow-methods":"GET,POST,PUT,OPTIONS,DELETE"
  };
  const respond=(status,body)=>route.fulfill({status,headers,body:JSON.stringify(body)});
  if(method==="OPTIONS")return route.fulfill({status:204,headers});
  if(path==="/api/auth/me")return respond(200,{user:{id:1,username:"profile_tester",role:"member"}});
  if(path==="/health")return respond(200,{ok:true,database:true});
  if(path==="/api/chaos/conversations")return respond(200,{conversations:[]});
  if(path==="/api/chaos/memories")return respond(200,{memories:[]});
  if(path==="/api/profile/birth-chart"){counts.owner++;return respond(200,{chart:ownChart,visible:false});}
  if(path==="/api/users/profile_friend"){counts.shared++;return respond(200,{user:{username:"profile_friend"},birth_chart:sharedChart});}
  if(path==="/api/users/hidden_friend"){counts.shared++;return respond(200,{user:{username:"hidden_friend"},birth_chart:null});}
  if(path==="/api/site-settings")return respond(200,{settings:{}});
  return respond(200,{});
 });
 try{
  const opened=await page.goto(base+"/miss-chaos.html",{waitUntil:"domcontentloaded"});
  assert.equal(opened.status(),200);
  await page.waitForFunction(()=>document.querySelector("#astro-compare-username")?.value==="profile_friend",{timeout:20000});
  assert.equal(counts.owner,0,"Prefilling should not load private owner charts");
  assert.equal(counts.shared,0,"Prefilling must not query another member");
  assert.match(await page.locator("#astro-chart-status").textContent(),/Ready to compare/);
  await page.locator("#astro-compare").click();
  await page.waitForSelector(".cosmic-compare-disclaimer",{timeout:15000});
  assert.equal(counts.owner,1);
  assert.equal(counts.shared,1);
  assert.match(await page.locator(".cosmic-wheel svg").getAttribute("aria-label"),/Two shared natal charts/);
  assert.match(await page.locator(".cosmic-legend-transit").textContent(),/profile_friend/);
  const draft=await page.locator("#message-input").inputValue();
  assert.match(draft,/traditional symbolic astrological compatibility/);
  assert.match(draft,/My Big Three/);
  assert.match(draft,/Their Big Three/);
  assert.match(draft,/First chart/);
  assert.doesNotMatch(draft,/latitude|longitude|birth timestamp/);
  assert.equal(await page.evaluate(()=>sessionStorage.getItem("knightfall:cosmic-compare-user")),null);
  await page.locator("#astro-natal-back").click();
  assert.equal(await page.locator(".cosmic-compare-disclaimer").count(),0,"Natal reset should remove comparison");
  // A member whose chart is hidden must not appear in the comparison UI.
  await page.locator("#astro-compare-username").fill("hidden_friend");
  await page.locator("#astro-compare").click();
  await page.waitForFunction(()=>document.querySelector("#astro-chart-status")?.textContent.includes("no birth chart available"),{timeout:10000});
  assert.equal(counts.shared,2);
  assert.equal(await page.locator(".cosmic-compare-disclaimer").count(),0,"Hidden member data must not be rendered");
  assert.deepEqual(errors,[],"Uncaught browser errors");
  console.log("PASS",label,"profile initiated handoff, private owner chart, published comparison and hidden-chart denial");
 }catch(error){failures.push(label+": "+error.message);console.error("FAIL",label,error)}
 finally{await ctx.close()}
}
try{
 await scenario("Android 390px",{width:390,height:844});
 await scenario("Desktop 1280px",{width:1280,height:900});
}finally{await browser.close()}
if(failures.length){console.error(failures.join("\n"));process.exitCode=1}
