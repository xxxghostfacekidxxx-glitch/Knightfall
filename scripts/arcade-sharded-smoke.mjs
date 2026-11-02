import { chromium } from "playwright";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const catalog = JSON.parse(await readFile("public/arcade/catalog.json", "utf8"));
const games = catalog.games.filter(game => typeof game.route === "string" && game.route.startsWith("/arcade/hosted/"));
const shardCount = Number(process.env.ARCADE_SHARD_COUNT ?? 10);
const shardIndex = Number(process.env.ARCADE_SHARD_INDEX ?? 0);
if (!Number.isInteger(shardCount) || shardCount < 1 || !Number.isInteger(shardIndex) || shardIndex < 0 || shardIndex >= shardCount) throw Error("Invalid shard configuration");
const unique = [...new Map(games.map(game => [game.route, game])).values()].sort((a,b)=>a.route.localeCompare(b.route));
const assigned = unique.filter((_,index)=>index % shardCount === shardIndex);
const base = (process.env.ARCADE_TEST_BASE || "http://127.0.0.1:8765").replace(/\/$/,"");
const profile = process.env.ARCADE_TEST_PROFILE || "phone";
const profiles = {phone:[390,844],smallPhone:[320,640],largePhone:[430,932],tablet:[820,1180],desktop:[1366,768]};
if (!profiles[profile]) throw Error("Unknown device profile: " + profile);
const [width,height] = profiles[profile];
const evidenceDir = path.resolve(process.env.ARCADE_EVIDENCE_DIR || "/tmp/arcade-browser-evidence", "shard-"+shardIndex, process.env.ARCADE_TEST_TARGET || "local");
await mkdir(evidenceDir,{recursive:true});
const browser = await chromium.launch({headless:true});
const results=[];
try {
 for (const [position,game] of assigned.entries()) {
  const page=await browser.newPage({viewport:{width,height},isMobile:profile!=="desktop",hasTouch:profile!=="desktop"});
  const errors=[]; const network=[];
  let action="navigate";
  try {
   page.on("pageerror",error=>errors.push(String(error.stack||error)));
   page.on("requestfailed",request=>{ const url=request.url(); const optionalLocalAuth=base.startsWith("http://127.0.0.1:") && /^https:\/\/api\.ash-fall\.com\/api\/auth\/me(?:[?#]|$)/.test(url); if(!optionalLocalAuth) network.push({url,error:request.failure()?.errorText||"unknown"}); });
   page.on("response",response=>{if(response.url().startsWith(base)&&response.status()>=400)network.push({url:response.url(),status:response.status()});});
   const response=await page.goto(base+game.route,{waitUntil:"domcontentloaded",timeout:12000});
   if (!response?.ok()) throw Error("HTTP "+(response?.status()??"no response"));
   action="inspect page";
   const title=await page.title();
   if (!title.trim()) throw Error("Missing title");
   const body=await page.locator("body").textContent({timeout:5000});
   const visualContent=await page.locator("canvas, svg, img, video, iframe").count();
   if (!(body||"").trim() && visualContent===0) throw Error("Empty body and no visual content");
   action="start game";
   const control=page.locator('#start-overlay button:not([disabled]), #playButton, #btn-start, #start').first();
   const generic=page.getByRole("button",{name:/^(start|start game|start run|start \/ restart|play|play game|new game|begin|launch|restart|run it back)$/i}).first();
   const button=await control.isVisible().catch(()=>false)?control:generic;
   if (await button.isVisible().catch(()=>false) && await button.isEnabled().catch(()=>false)) {
    if(profile==="desktop") await button.click({timeout:4000}); else await button.tap({timeout:4000});
    await page.waitForTimeout(150);
   }
   if(errors.length||network.length)throw Error("Browser errors or failed assets");
   results.push({game:game.name||game.id||game.route,route:game.route,profile,action,status:"passed"});
  } catch(error) {
   const filename=String(position).padStart(3,"0");
   const screenshot=filename+".png";
   await page.screenshot({path:path.join(evidenceDir,screenshot),fullPage:true,timeout:5000}).catch(()=>{});
   results.push({game:game.name||game.id||game.route,route:game.route,profile,action,status:"failed",error:String(error?.stack||error),browserErrors:errors,networkErrors:network,screenshot});
  } finally {await page.close().catch(()=>{});}
 }
} finally {await browser.close();}
const report={shardIndex,shardCount,profile,target:process.env.ARCADE_TEST_TARGET||"local",totalCatalog:unique.length,assigned:assigned.length,assignedRoutes:assigned.map(x=>x.route),passed:results.filter(x=>x.status==="passed").length,failed:results.filter(x=>x.status==="failed").length,results};
await writeFile(path.join(evidenceDir,"report.json"),JSON.stringify(report,null,2));
console.log(JSON.stringify({shardIndex,shardCount,profile,totalCatalog:unique.length,assigned:assigned.length,passed:report.passed,failed:report.failed}));
if(report.failed)process.exitCode=1;
