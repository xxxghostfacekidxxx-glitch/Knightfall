import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
const base=process.env.ARCADE_TEST_BASE||"http://127.0.0.1:8765";
const dir=process.env.ARCADE_REPLAY_DIR||"/tmp/arcade-replays";
await mkdir(dir,{recursive:true});
const cases=[
 {id:"particle-clicker",route:"/arcade/hosted/particle-clicker/index.html",steps:[["tap","#start"],["tap","#clicker-generate",50],["assert-enabled","#clicker-boost"],["tap","#clicker-boost"],["assert-text","#clicker-generate","+2"]]},
 {id:"freeciv-web",route:"/arcade/hosted/arcade-cabinet.html?game=freeciv-web",steps:[["tap","#start"],["tap-canvas","#game",324,134],["assert-min","#score",10]]},
 {id:"kaiju-krush",route:"/arcade/hosted/arcade-cabinet.html?game=kaiju-krush",steps:[["tap","#start"],["tap-canvas","#game",480,450],["assert-min","#score",25]]},
 {id:"custom-tetris",route:"/arcade/hosted/custom-tetris/index.html",steps:[["tap",'[data-tetris-action="left"]'],["tap",'[data-tetris-action="pause"]'],["assert-paused"]]}
];
const profiles={phone:[390,844],smallPhone:[320,640],largePhone:[430,932],tablet:[768,1024],desktop:[1366,768]};
const profile=process.env.ARCADE_TEST_PROFILE||"phone";
if(!profiles[profile])throw Error("Unknown arcade test profile: "+profile);
const [width,height]=profiles[profile];
const browser=await chromium.launch({headless:true});let failures=0;
try {
 for(const scenario of cases){
  const page=await browser.newPage({viewport:{width,height},isMobile:profile!=="desktop",hasTouch:true});
  const errors=[],history=[],requests=[];
  page.on("requestfailed",request=>{if(request.url().startsWith(base))requests.push({url:request.url(),reason:request.failure()?.errorText})});
  page.on("pageerror",e=>errors.push(String(e)));
  try{
   await page.addInitScript(()=>{Math.random=()=>0.5});
   const response=await page.goto(base+scenario.route,{waitUntil:"domcontentloaded",timeout:12000});
   if(!response||response.status()!==200)throw Error("HTTP "+response?.status());
   for(const [action,selector,arg,extra] of scenario.steps){
    history.push({action,selector,arg,extra});
    if(action==="tap")for(let i=0;i<(arg||1);i++)await page.locator(selector).tap({timeout:2500});
    else if(action==="tap-canvas"){
     const box=await page.locator(selector).boundingBox();
     if(!box)throw Error("canvas absent");
     const canvas=await page.locator(selector).evaluate(el=>({w:el.width,h:el.height}));
     await page.locator(selector).tap({position:{x:arg/canvas.w*box.width,y:extra/canvas.h*box.height}});
    } else if(action==="assert-enabled"){
     if(!await page.locator(selector).isEnabled())throw Error(selector+" disabled");
    } else if(action==="assert-text"){
     if(!(await page.locator(selector).innerText()).includes(arg))throw Error(selector+" missing "+arg);
    } else if(action==="assert-min"){
     if(Number(await page.locator(selector).innerText())<arg)throw Error(selector+" below "+arg);
    } else if(action==="assert-paused"){
     if(!await page.evaluate(()=>window.KnightfallTetris?.getState?.().paused))throw Error("Tetris did not pause");
    }
   }
   if(errors.length)throw Error(errors.join(" | "));
   if(requests.length)throw Error("failed local requests: "+JSON.stringify(requests));
   console.log("PASS "+profile+" "+scenario.id);
  }catch(error){
   failures++;
   const details={scenario:scenario.id,route:scenario.route,steps:history,error:String(error),browserErrors:errors,failedRequests:requests,base,profile};
   await writeFile(path.join(dir,scenario.id+".json"),JSON.stringify(details,null,2));
   await page.screenshot({path:path.join(dir,scenario.id+".png"),timeout:3000}).catch(()=>{});
   console.error("FAIL "+profile+" "+scenario.id+": "+String(error));
  }finally{await page.close()}
 }
}finally{await browser.close()}
if(failures)process.exitCode=1;
