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
async function verifyMinesweeperView(page) {
  const previousViewport = page.viewportSize();
  const board = page.locator("#board");
  for (const viewport of [{width:390,height:844},{width:844,height:390}]) {
    await page.setViewportSize(viewport);
    await page.locator("#difficulty").selectOption("hard");
    await page.getByRole("button", {name:"Fullscreen",exact:true}).click();
    await page.getByRole("button", {name:"Exit fullscreen",exact:true}).waitFor();
    const geometry = await board.evaluate(board => {
      const main = board.closest("main");
      const scroller = board.parentElement;
      const first = board.firstElementChild.getBoundingClientRect();
      const last = board.lastElementChild.getBoundingClientRect();
      return {
        count:board.children.length,
        inside:first.width > 0 && first.top >= 0 && first.left >= 0 &&
          last.bottom <= innerHeight + 1 && last.right <= innerWidth + 1,
        fits:[main, scroller].every(el => el.scrollHeight <= el.clientHeight + 1 &&
          el.scrollWidth <= el.clientWidth + 1)
      };
    });
    if (geometry.count !== 256 || !geometry.inside || !geometry.fits) {
      throw Error("Hard minefield overflows " + JSON.stringify({viewport,geometry}));
    }
    await page.locator("#mode").click();
    await board.locator("button").last().click();
    await board.getByRole("button",{name:"Row 16, column 16: Flagged",exact:true}).waitFor();
    await page.locator("#restart").click();
    await board.locator("button").first().evaluate(button=>button.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,pointerType:"touch",pointerId:27,clientX:10,clientY:10})));
    await page.waitForTimeout(560);
    await board.getByRole("button",{name:"Row 1, column 1: Flagged",exact:true}).waitFor();
    await page.getByRole("button",{name:"Exit fullscreen",exact:true}).click();
    await page.getByRole("button",{name:"Fullscreen",exact:true}).waitFor();
  }
  await page.setViewportSize(previousViewport);
}
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
   let response,navAttempts=0;
   for(let attempt=1;attempt<=2;attempt++){
    navAttempts=attempt;
    try{
     response=await page.goto(base+game.route,{waitUntil:"domcontentloaded",timeout:attempt===1?12000:22000});
     break;
    }catch(error){
     const transient=/Timeout(?:Error|\s+\d+ms exceeded)/i.test(String(error));
     if(attempt===2||!transient||process.env.ARCADE_TEST_TARGET!=="live")throw error;
     // A single stalled live CDN navigation is not proof the game fails to boot.
     // Retry once on a clean page state; a second failure remains a real failure.
     action="retry live navigation";
     await page.goto("about:blank",{waitUntil:"commit",timeout:4000}).catch(()=>{});
     errors.length=0;network.length=0;
    }
   }
   if (!response?.ok()) throw Error("HTTP "+(response?.status()??"no response"));
   action="inspect page";
   const title=await page.title();
   if (!title.trim()) throw Error("Missing title");
   const {body,visualContent}=await page.evaluate(() => ({
    body: document.body?.textContent || "",
    visualContent: document.querySelectorAll("canvas, svg, img, video, iframe").length
   }));
   if (!(body||"").trim() && visualContent===0) throw Error("Empty body and no visual content");
   action="start game";
   const control=page.locator('#start-overlay button:not([disabled]), #playButton, #btn-start, #start').first();
   const generic=page.getByRole("button",{name:/^(start|start game|start run|start \/ restart|play|play game|new game|begin|launch|restart|run it back)$/i}).first();
   const button=await control.isVisible().catch(()=>false)?control:generic;
   if (await button.isVisible().catch(()=>false) && await button.isEnabled().catch(()=>false)) {
    if(profile==="desktop") await button.click({timeout:4000}); else await button.tap({timeout:4000});
    await page.waitForTimeout(150);
   }
   // Real puzzle-board contracts: a loaded title never substitutes for a
   // functional DOM board. The older sharded runner silently passed blank games.
   const boardContracts={
     "ash-sudoku": ["#board .cell",81],
     "neon-mahjong": ["#board .tile",40],
     "cinder-merge": ["#board .tile",16],
     "ash-tiles": ["#board .sliding",15],
     "cinder-checkers": ["#board button",64],
     "cinder-chess": ["#board button",32],
     "cinder-reversi": ["#board .rev-cell",64],
     "cinder-mines": ["#board button",36]
   };
   if(boardContracts[game.id]){
     action="verify puzzle board paint";
     const [selector,minimum]=boardContracts[game.id];
     await page.waitForFunction(({selector,minimum})=>{
       const nodes=document.querySelectorAll(selector),first=nodes[0];
       if(nodes.length<minimum||!first)return false;
       const r=first.getBoundingClientRect(),s=getComputedStyle(first);
       return r.width>2&&r.height>2&&s.visibility!=="hidden"&&s.display!=="none"&&Number(s.opacity)>0.01;
     },{selector,minimum},{timeout:9000});
     if(game.id==="ash-sudoku"&&profile!=="desktop"){
       const first=await page.locator("#board").evaluate(x=>({top:x.getBoundingClientRect().top,viewport:innerHeight}));
       if(first.top>first.viewport*.65)
         throw Error("Sudoku starts below first mobile viewport: "+JSON.stringify(first));
     }
   }
   // The kitchen previously passed fleet checks when the page loaded but
   // its playable merge grid never mounted. Require all 36 real hit targets.
   if (game.id === "hex-and-whisk") {
     action = "verify kitchen merge grid";
     await page.waitForFunction(() => {
       const board=document.getElementById("board");
       if (!board) return false;
       const tiles=[...board.querySelectorAll("button.slot")];
       if (tiles.length!==36) return false;
       const rect=board.getBoundingClientRect();
       if(rect.width<180||rect.height<180) return false;
       return tiles.every(tile=>{
         const box=tile.getBoundingClientRect(),style=getComputedStyle(tile);
         return box.width>=20&&box.height>=20&&style.display!=="none"&&style.visibility!=="hidden";
       });
     },null,{timeout:9000});
   }
   // An animated canvas can leave a perfectly plausible title/toolbar while
   // painting absolutely nothing. Imp Inferno must start and draw real pixels.
   if (game.id === "imp-inferno") {
     action = "verify active infernal table paint";
     await page.waitForFunction(() => {
       const canvas=document.getElementById("table");
       const overlay=document.getElementById("overlay");
       if (!canvas||!overlay?.hidden) return false;
       const rect=canvas.getBoundingClientRect();
       if(rect.width<180||rect.height<100||canvas.width<180||canvas.height<100) return false;
       const ctx=canvas.getContext("2d");
       if(!ctx) return false;
       try{
         const positions=[[.1,.1],[.5,.5],[.9,.9],[.3,.7],[.7,.3]];
         return positions.some(([x,y])=>ctx.getImageData(
           Math.min(canvas.width-1,Math.floor(x*canvas.width)),
           Math.min(canvas.height-1,Math.floor(y*canvas.height)),1,1).data[3]>0);
       }catch{return false;}
     },null,{timeout:9000});
   }
   if (game.id === "cinder-mines" && process.env.ARCADE_TEST_TARGET === "local") {
    action = "verify fullscreen board and corner input";
    await verifyMinesweeperView(page);
   }
   if(errors.length||network.length)throw Error("Browser errors or failed assets");
   results.push({game:game.name||game.id||game.route,route:game.route,profile,action,status:"passed"});
  } catch(error) {
   const filename=String(position).padStart(3,"0");
   const screenshot=filename+".png";
   const screenshotSaved=await page.screenshot({path:path.join(evidenceDir,screenshot),fullPage:true,timeout:5000}).then(()=>true,()=>false);
   results.push({game:game.name||game.id||game.route,route:game.route,profile,action,status:"failed",error:String(error?.stack||error),browserErrors:errors,networkErrors:network,screenshot:screenshotSaved?screenshot:null});
  } finally {await page.close().catch(()=>{});}
 }
} finally {await browser.close();}
const report={shardIndex,shardCount,profile,target:process.env.ARCADE_TEST_TARGET||"local",totalCatalog:unique.length,assigned:assigned.length,assignedRoutes:assigned.map(x=>x.route),passed:results.filter(x=>x.status==="passed").length,failed:results.filter(x=>x.status==="failed").length,results};
await writeFile(path.join(evidenceDir,"report.json"),JSON.stringify(report,null,2));
console.log(JSON.stringify({shardIndex,shardCount,profile,totalCatalog:unique.length,assigned:assigned.length,passed:report.passed,failed:report.failed}));
for (const result of results.filter(item=>item.status==="failed")) {
 console.error(JSON.stringify({route:result.route,profile:result.profile,action:result.action,error:result.error?.split("\\n")[0],browserErrors:result.browserErrors?.slice(0,3),networkErrors:result.networkErrors?.slice(0,3),screenshot:result.screenshot}));
}
if(report.failed)process.exitCode=1;
