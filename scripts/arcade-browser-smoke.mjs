import { chromium } from "playwright";
import { readdir } from "node:fs/promises";
import path from "node:path";

const base = process.env.ARCADE_TEST_BASE || "http://127.0.0.1:8765";
const hostedRoot = path.resolve("public/arcade/hosted");

async function listHostedHtml(dir = hostedRoot) {
  const routes = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) routes.push(...await listHostedHtml(full));
    else if (entry.isFile() && entry.name.endsWith(".html")) {
      routes.push("/" + path.relative("public", full).split(path.sep).join("/"));
    }
  }
  return routes;
}
const games = [
  { name: "Marshland Marksman", path: "/arcade/hosted/marshland-marksman/index.html", start: "#start", pause: false },
  { name: "Cinder Crossing", path: "/arcade/hosted/cinder-crossing/index.html", start: "#start", pause: true },
  { name: "Afterburn Breakout", path: "/arcade/hosted/afterburn-breakout/index.html", start: "#start", pause: true },
  { name: "Colossus Clash", path: "/arcade/hosted/colossus-clash/index.html", start: "#start", pause: false },
  { name: "Dino Run: Ash-Fall Edition", path: "/arcade/hosted/dino-run/index.html", start: "#btn-start", pause: false },
  { name: "Balloon Pop: Ash-Fall Edition", path: "/arcade/hosted/balloon-pop/index.html", start: "#btn-start", pause: false },
  { name: "Tower of Hanoi: Ash-Fall Edition", path: "/arcade/hosted/hanoi/index.html", start: "#btn-start", pause: false, canvas: false, board: "#board" },
];

const browser = await chromium.launch({ headless: true });
let failed = false;
try {
  for (const game of games) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", error => errors.push(error.stack || error.message));
    const response = await page.goto(base + game.path, { waitUntil: "networkidle", timeout: 30000 });
    if (!response || response.status() !== 200) {
      console.error(`FAIL ${game.name}: page returned ${response?.status() ?? "no response"}`);
      failed = true;
      await page.close();
      continue;
    }
    const canvas = page.locator("canvas").first();
    let pixels = 0;
    let boardVisible = false;
    if (game.canvas === false) {
      const board = page.locator(game.board || "svg").first();
      if (await board.count() < 1) {
        console.error(`FAIL ${game.name}: expected a visible game board`);
        failed = true;
        await page.close();
        continue;
      }
    } else if (await canvas.count() !== 1) {
      console.error(`FAIL ${game.name}: expected exactly one game canvas`);
      failed = true;
      await page.close();
      continue;
    }
    await page.locator(game.start).click();
    await page.waitForTimeout(350);
    if (game.canvas === false) {
      boardVisible = await page.locator(game.board || "svg").first().isVisible();
      if (!boardVisible) {
        console.error(`FAIL ${game.name}: game board is not visible after starting`);
        failed = true;
      }
    } else {
      pixels = await canvas.evaluate(el => {
        const c = el.getContext("2d");
        if (!c) return 0;
        const data = c.getImageData(0, 0, el.width, el.height).data;
        let count = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count++;
        return count;
      });
      if (pixels < 1000) {
        console.error(`FAIL ${game.name}: canvas appears blank after starting (${pixels} painted pixels)`);
        failed = true;
      }
    }
    if (game.pause) {
      const pause = page.locator("#pause");
      await pause.click();
      if (!(await pause.innerText()).toLowerCase().includes("resume")) {
        console.error(`FAIL ${game.name}: pause button did not enter paused state`);
        failed = true;
      }
      await pause.click();
    }
    if (errors.length) {
      console.error(`FAIL ${game.name}: browser errors: ${errors.join(" | ")}`);
      failed = true;
    }
    if (!errors.length && (game.canvas === false ? boardVisible : pixels >= 1000)) console.log(`PASS ${game.name}: mobile viewport, start interaction, ${game.canvas === false ? "visible SVG board" : "rendered canvas"}${game.pause ? ", pause/resume" : ""}`);
    await page.close();
  }

  // Exercise account score submission on a real bridged game page using a fake API.
  // No score data is written to an actual user account.
  const bridgePage = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await bridgePage.addInitScript(() => {
    window.__bridgeTestScores = [];
    window.AshFallArcade = {
      ready: Promise.resolve(),
      user: { id: "browser-smoke-test" },
      loadProgress: async () => ({ bestScore: 5 }),
      recordScore: async (gameId, score, meta) => {
        window.__bridgeTestScores.push({ gameId, score, meta });
        return { saved: true };
      }
    };
  });
  const bridgeResponse = await bridgePage.goto(base + "/arcade/hosted/hexa-havoc/index.html", { waitUntil: "domcontentloaded", timeout: 30000 });
  if (!bridgeResponse || bridgeResponse.status() !== 200) {
    console.error("FAIL account bridge: could not open the bridge test game");
    failed = true;
  } else {
    await bridgePage.waitForSelector(".af-report", { timeout: 4000 });
    const reportHref = await bridgePage.locator(".af-report").getAttribute("href");
    const reportUrl = new URL(reportHref);
    const reportBody = reportUrl.searchParams.get("body") || "";
    if (!reportUrl.searchParams.get("title")?.includes("Hexa Havoc") || !reportBody.includes("/arcade/hosted/hexa-havoc/index.html") || !reportBody.includes("Steps to reproduce:") || !reportBody.includes("Device/browser")) {
      console.error("FAIL account bridge: issue report is missing game/page/reproduction context");
      failed = true;
    } else {
      console.log("PASS account bridge: issue report includes game, page, reproduction prompts, and browser context");
    }
    await bridgePage.locator("canvas").first().click({ position: { x: 20, y: 20 } });
    await bridgePage.evaluate(() => {
      const score = document.querySelector("#score");
      if (score) score.textContent = "42";
      window.exportSaveState = () => ({ score: 42 });
      const overlay = document.createElement("div");
      overlay.className = "overlay";
      overlay.id = "bridge-test-overlay";
      overlay.style.cssText = "display:block;position:fixed;inset:0;z-index:999999;background:#000;color:#fff";
      overlay.textContent = "Game Over";
      document.body.appendChild(overlay);
    });
    await bridgePage.waitForFunction(() => window.__bridgeTestScores.length === 1, null, { timeout: 4000 });
    const bridgeRecord = await bridgePage.evaluate(() => window.__bridgeTestScores[0]);
    if (bridgeRecord.gameId !== "cabinet-hexa-havoc" || bridgeRecord.score !== 42) {
      console.error("FAIL account bridge: submitted score did not match the ended run");
      failed = true;
    } else {
      console.log("PASS account bridge: detects game over and submits the correct score to the account API");
      await bridgePage.waitForTimeout(900);
      const repeatedScores = await bridgePage.evaluate(() => window.__bridgeTestScores.length);
      if (repeatedScores !== 1) {
        console.error("FAIL account bridge: the same game-over state submitted the score " + repeatedScores + " times");
        failed = true;
      } else {
        console.log("PASS account bridge: persistent game-over state does not duplicate score submissions");
      }
    }
  }
  await bridgePage.close();

  // Verify a cloud save restores actual game state, not just leaderboard metadata.
  const restorePage = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await restorePage.addInitScript(() => {
    window.AshFallArcade = {
      ready: Promise.resolve(),
      user: { id: "browser-smoke-test" },
      loadProgress: async gameId => gameId === "cabinet-last-ember" ? ({
        bestScore: 11,
        serialized: {
          wood: 27, scrap: 6, food: 4, warm: 82, people: 2, day: 4,
          shelter: 1, alive: true, log: [{ msg: "Restored from cloud save", event: true }]
        }
      }) : null,
      saveProgress: async () => ({ revision: 2 }),
      recordScore: async () => ({ saved: true })
    };
  });
  const restoreResponse = await restorePage.goto(base + "/arcade/hosted/last-ember/index.html", { waitUntil: "domcontentloaded", timeout: 30000 });
  if (!restoreResponse || restoreResponse.status() !== 200) {
    console.error("FAIL cloud save restore: could not open Last Ember");
    failed = true;
  } else {
    try {
      await restorePage.waitForFunction(() =>
        document.querySelector("#wood")?.textContent === "27" &&
        document.querySelector("#day")?.textContent === "4" &&
        document.querySelector("#story")?.textContent.includes("Restored from cloud save"),
      null, { timeout: 5000 });
      const localCopy = await restorePage.evaluate(() => JSON.parse(localStorage.getItem("last-ember-save-v1") || "null"));
      if (!localCopy || localCopy.wood !== 27 || localCopy.day !== 4) {
        console.error("FAIL cloud save restore: restored state was not persisted locally");
        failed = true;
      } else {
        console.log("PASS cloud save restore: Last Ember restores remote resources/day/journal and updates local save");
      }
    } catch {
      console.error("FAIL cloud save restore: remote game state did not appear in the UI");
      failed = true;
    }
  }
  await restorePage.close();

  // Verify cloud restore for the city builder and turn-based board game.
  const cabinetRestoreCases = [
    {
      name: "Ashen Blocks",
      path: "/arcade/hosted/ashen-blocks/index.html",
      gameId: "cabinet-ashen-blocks",
      saved: {
        bestScore: 0,
        serialized: {
          grid: Array.from({ length: 9 }, (_, y) => Array.from({ length: 12 }, (_, x) => (y === 4 && x < 4) ? "road" : "empty")),
          tool: "road", money: 845, day: 7, pop: 0, happy: 50
        }
      },
      check: () => document.querySelector("#money")?.textContent === "$845" && document.querySelector("#day")?.textContent === "7"
    },
    {
      name: "Connect Four",
      path: "/arcade/hosted/connect-four/index.html",
      gameId: "cabinet-connect-four",
      saved: {
        serialized: {
          board: Array.from({ length: 6 }, (_, y) => Array.from({ length: 7 }, (_, x) => y === 5 && x === 3 ? 1 : y === 5 && x === 4 ? 2 : 0)),
          history: []
        }
      },
      check: () => document.querySelectorAll("#board .p1").length === 1 && document.querySelectorAll("#board .p2").length === 1
    }
  ];
  for (const testCase of cabinetRestoreCases) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    await page.addInitScript(save => {
      window.AshFallArcade = {
        ready: Promise.resolve(),
        user: { id: "browser-smoke-test" },
        loadProgress: async gameId => gameId === save.gameId ? save.data : null,
        saveProgress: async () => ({ revision: 2 }),
        recordScore: async () => ({ saved: true })
      };
    }, { gameId: testCase.gameId, data: testCase.saved });
    const response = await page.goto(base + testCase.path, { waitUntil: "domcontentloaded", timeout: 30000 });
    try {
      if (!response || response.status() !== 200) throw new Error("page did not return HTTP 200");
      await page.waitForFunction(testCase.check, null, { timeout: 5000 });
      console.log("PASS cloud save restore: " + testCase.name + " restores saved game state");
    } catch (error) {
      console.error("FAIL cloud save restore: " + testCase.name + ": " + (error?.message || String(error)));
      failed = true;
    } finally {
      await page.close();
    }
  }

  // Zero-move/zero-wave screens must not be mistaken for active runs or leaderboard scores.
  const idlePuzzle = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await idlePuzzle.addInitScript(() => {
    window.__idleScores = [];
    window.AshFallArcade = {
      ready: Promise.resolve(), user: { id: "browser-smoke-test" },
      loadProgress: async () => null,
      saveProgress: async () => ({ revision: 1 }),
      recordScore: async (...args) => { window.__idleScores.push(args); return { saved: true }; }
    };
  });
  await idlePuzzle.goto(base + "/arcade/hosted/neon-mahjong/index.html", { waitUntil: "domcontentloaded", timeout: 30000 });
  await idlePuzzle.waitForTimeout(900);
  const idleScoreCount = await idlePuzzle.evaluate(() => window.__idleScores.length);
  if (idleScoreCount !== 0) {
    console.error("FAIL account bridge: idle moves-mode puzzle submitted a score before the player moved");
    failed = true;
  } else {
    console.log("PASS account bridge: zero moves does not generate a fake score or start a run");
  }
  await idlePuzzle.close();

  // Verify cloud save restoration for word, number, tile, and mirror puzzles.
  const puzzleRestoreCases = [
    { name:"Wordlee", path:"/arcade/hosted/wordlee/index.html", gameId:"cabinet-wordlee", data:{serialized:{answer:"ASHEN",row:1,guess:"CLOUD",done:false,guesses:[{word:"GHOST",colors:["absent","absent","absent","absent","absent"]}],keyState:{G:"absent"}}}, check:()=>document.querySelector("#board .tile")?.textContent==="G"&&document.querySelector("#status")?.textContent.includes("Cloud save restored") },
    { name:"Sudoku", path:"/arcade/hosted/sudoku/index.html", gameId:"cabinet-sudoku", data:{serialized:{grid:[[5,0,0,0,0,0,0,1,2],[0,0,0,0,3,5,0,0,0],[0,0,0,0,0,0,4,0,0],[0,5,0,1,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,9,0,6,0],[0,0,1,0,0,0,0,0,0],[0,0,0,7,2,0,0,0,0],[6,2,0,0,0,0,0,0,0]],selected:{r:1,c:0},timeLeft:487}}, check:()=>document.querySelector("#board .cell")?.textContent==="5"&&document.querySelector("#timer")?.textContent==="8:07" },
    { name:"Neon Mahjong", path:"/arcade/hosted/neon-mahjong/index.html", gameId:"cabinet-neon-mahjong", data:{serialized:{tiles:Array.from({length:104},(_,i)=>({x:i%12,y:Math.floor(i/12),z:0,id:i,val:["✦","✦","●","●","◆","◆"][i%6],alive:true})),selected:null,moves:13,elapsed:72,history:[],done:0,best:0}}, check:()=>document.querySelector("#moves")?.textContent==="13"&&document.querySelector("#message")?.textContent.includes("Cloud save restored") },
    { name:"Prism Panic", path:"/arcade/hosted/prism-panic/index.html", gameId:"cabinet-prism-panic", data:{serialized:{level:2,moves:9,best:1,mirrors:[{x:2,y:3,v:"/",base:"/"},{x:2,y:5,v:"/",base:"/"},{x:5,y:5,v:"/",base:"/"},{x:5,y:2,v:"/",base:"/"}],beam:[]}}, check:()=>document.querySelector("#level")?.textContent==="2 / 5"&&document.querySelector("#moves")?.textContent==="9"&&document.querySelector("#message")?.textContent.includes("Cloud save restored") }
  ];
  for(const testCase of puzzleRestoreCases){
    const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
    await page.addInitScript(save=>{window.AshFallArcade={ready:Promise.resolve(),user:{id:"browser-smoke-test"},loadProgress:async gameId=>gameId===save.gameId?save.data:null,saveProgress:async()=>({revision:2}),recordScore:async()=>({saved:true})}}, {gameId:testCase.gameId,data:testCase.data});
    const response=await page.goto(base+testCase.path,{waitUntil:"domcontentloaded",timeout:30000});
    try{if(!response||response.status()!==200)throw new Error("page did not return HTTP 200");await page.waitForFunction(testCase.check,null,{timeout:6000});console.log("PASS cloud save restore: "+testCase.name+" restores puzzle state")}
    catch(error){console.error("FAIL cloud save restore: "+testCase.name+": "+(error?.message||String(error)));failed=true}
    finally{await page.close()}
  }

  // Verify cloud resume for Hexa Havoc, Bubble Pop, and Rift Wardens.
  const arcadeRestoreCases = [
    { name:"Hexa Havoc", path:"/arcade/hosted/hexa-havoc/index.html", gameId:"cabinet-hexa-havoc", data:{serialized:{cells:Array.from({length:8},(_,y)=>Array.from({length:8},(_,x)=>y===7&&x===0?1:-1)),piece:{col:3,row:1,colors:[0,1,2]},score:70,best:100}}, check:()=>document.querySelector("#score")?.textContent==="70"&&document.querySelector("#best")?.textContent==="100" },
    { name:"Bubble Pop", path:"/arcade/hosted/bubble-pop/index.html", gameId:"cabinet-bubble-pop", data:{serialized:{board:Array.from({length:8},()=>Array.from({length:9},()=>1)),score:25,time:37,active:true}}, check:()=>document.querySelector("#score")?.textContent==="25"&&document.querySelector("#time")?.textContent==="37"&&document.querySelector("#state")?.textContent==="Cloud save restored." },
    { name:"Rift Wardens", path:"/arcade/hosted/rift-wardens/index.html", gameId:"cabinet-rift-wardens", data:{serialized:{towers:[{x:4,y:1,type:"burst",cool:0.2}],enemies:[{x:0.5,y:3.5,idx:0,hp:44,max:65,speed:0.8,r:11,reward:11}],shots:[],cash:75,lives:8,wave:3,kills:4,selected:"burst",running:true,spawned:2,waveCount:14,high:4,spawnDelay:500}}, check:()=>document.querySelector("#wave")?.textContent==="3"&&document.querySelector("#cash")?.textContent==="75"&&document.querySelector("#lives")?.textContent==="8" }
  ];
  for(const testCase of arcadeRestoreCases){
    const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
    await page.addInitScript(save=>{window.AshFallArcade={ready:Promise.resolve(),user:{id:"browser-smoke-test"},loadProgress:async gameId=>gameId===save.gameId?save.data:null,saveProgress:async()=>({revision:2}),recordScore:async()=>({saved:true})}}, {gameId:testCase.gameId,data:testCase.data});
    const response=await page.goto(base+testCase.path,{waitUntil:"domcontentloaded",timeout:30000});
    try{if(!response||response.status()!==200)throw new Error("page did not return HTTP 200");await page.waitForFunction(testCase.check,null,{timeout:6000});console.log("PASS cloud save restore: "+testCase.name+" restores active game state")}
    catch(error){console.error("FAIL cloud save restore: "+testCase.name+": "+(error?.message||String(error)));failed=true}
    finally{await page.close()}
  }

  // Verify cloud resume for Balance Stack, Doodle Jump, and Stack Tower.
  const platformRestoreCases = [
    { name:"Balance Stack",path:"/arcade/hosted/balance-stack/index.html",gameId:"cabinet-balance-stack",data:{serialized:{tilt:0.4,wind:0, time:18,windTimer:0.4,score:60}},check:()=>document.querySelector("#time")?.textContent==="18"&&document.querySelector("#state")?.textContent==="Cloud save restored." },
    { name:"Doodle Jump",path:"/arcade/hosted/doodle-jump/index.html",gameId:"cabinet-doodle-jump",data:{serialized:{player:{x:190,y:400,vx:0,vy:-200,r:15},plats:[{x:20,y:540,w:80},{x:160,y:470,w:70}],cam:0,score:720}},check:()=>document.querySelector("#score")?.textContent==="720"&&document.querySelector("#state")?.textContent==="Cloud save restored." },
    { name:"Stack Tower",path:"/arcade/hosted/stack-tower/index.html",gameId:"cabinet-stack-tower",data:{serialized:{blocks:[{x:90,w:240,y:550},{x:110,w:200,y:500}],active:{x:35,w:200,y:450},score:7,dir:1,cam:0}},check:()=>document.querySelector("#score")?.textContent==="7"&&document.querySelector("#state")?.textContent==="Cloud save restored." }
  ];
  for(const testCase of platformRestoreCases){
    const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
    await page.addInitScript(save=>{window.AshFallArcade={ready:Promise.resolve(),user:{id:"browser-smoke-test"},loadProgress:async gameId=>gameId===save.gameId?save.data:null,saveProgress:async()=>({revision:2}),recordScore:async()=>({saved:true})}}, {gameId:testCase.gameId,data:testCase.data});
    const response=await page.goto(base+testCase.path,{waitUntil:"domcontentloaded",timeout:30000});
    try{if(!response||response.status()!==200)throw new Error("page did not return HTTP 200");await page.waitForFunction(testCase.check,null,{timeout:6000});console.log("PASS cloud save restore: "+testCase.name+" restores active game state")}
    catch(error){console.error("FAIL cloud save restore: "+testCase.name+": "+(error?.message||String(error)));failed=true}
    finally{await page.close()}
  }

  // Verify cloud resume for Hexforge Command, Neon Vector, and Cinder Circuit.
  const campaignRestoreCases = [
    {name:"Hexforge Command",path:"/arcade/hosted/hexforge-command/index.html",gameId:"cabinet-hexforge-command",data:{serialized:{tiles:Array.from({length:63},(_,i)=>({q:i%9,r:Math.floor(i/9),blocked:false,terrain:"plain"})),units:[{id:"p0-1",team:"p",q:0,r:1,hp:55,max:55,atk:18,moved:false,acted:false},{id:"p0-3",team:"p",q:0,r:3,hp:48,max:48,atk:22,moved:true,acted:false},{id:"e8-1",team:"e",q:8,r:1,hp:45,max:55,atk:14,moved:false,acted:false}],selected:{id:"p0-1"},mission:2,playerTurn:true,best:2,notice:"Cloud save restored."}},check:()=>document.querySelector("#mission")?.textContent==="2 / 3"&&document.querySelector("#friends")?.textContent==="2"&&document.querySelector("#message")?.textContent==="Cloud save restored. Your squad is ready."},
    {name:"Neon Vector",path:"/arcade/hosted/neon-vector/index.html",gameId:"cabinet-neon-vector",data:{serialized:{lane:1,speed:0.8,boost:55,distance:1234,best:900,traffic:[{lane:-1,z:0.5,type:"rival",color:"#45d9ff"}],spawnDelay:500,roadOffset:0.2}},check:()=>document.querySelector("#best")?.textContent==="900 m"&&document.querySelector("#boost")?.textContent.includes("55%")&&document.querySelector("#overlay")?.hidden===true},
    {name:"Cinder Circuit",path:"/arcade/hosted/cinder-circuit/index.html",gameId:"cabinet-cinder-circuit",data:{serialized:{angle:1.5,speed:0.8,lane:0.2,lap:1,time:47,boost:60,oldAngle:1.4,playerLaps:1,best:2000,cars:[{name:"Mauve",color:"#ff5edb",a:1.1,v:1.05,l:-0.4},{name:"Volt",color:"#45d9ff",a:2.2,v:1.12,l:0.25},{name:"Ruckus",color:"#ffb15e",a:3.1,v:1,l:0.65}]}},check:()=>document.querySelector("#lap")?.textContent==="1 / 3"&&document.querySelector("#time")?.textContent==="47s"&&document.querySelector("#overlay")?.hidden===true}
  ];
  for(const testCase of campaignRestoreCases){
    const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
    await page.addInitScript(save=>{window.AshFallArcade={ready:Promise.resolve(),user:{id:"browser-smoke-test"},loadProgress:async gameId=>gameId===save.gameId?save.data:null,saveProgress:async()=>({revision:2}),recordScore:async()=>({saved:true})}}, {gameId:testCase.gameId,data:testCase.data});
    const response=await page.goto(base+testCase.path,{waitUntil:"domcontentloaded",timeout:30000});
    try{if(!response||response.status()!==200)throw new Error("page did not return HTTP 200");await page.waitForFunction(testCase.check,null,{timeout:6000});console.log("PASS cloud save restore: "+testCase.name+" restores campaign/racing state")}
    catch(error){console.error("FAIL cloud save restore: "+testCase.name+": "+(error?.message||String(error)));failed=true}
    finally{await page.close()}
  }

  // Verify cloud resume for Rusty Sky, Blockfall, and Endless Runner.
  const runnerRestoreCases = [
    {name:"Rusty Sky",path:"/arcade/hosted/rusty-sky/index.html",gameId:"cabinet-rusty-sky",data:{serialized:{targets:[{x:300,y:210,vx:30,vy:2,size:24,phase:1,color:"#45d9ff",kind:"bird"}],score:60,best:90,ammo:4,time:18,round:2,spawnDelay:400}},check:()=>document.querySelector("#score")?.textContent==="60"&&document.querySelector("#ammo")?.textContent==="4"&&document.querySelector("#overlay")?.hidden===true},
    {name:"Blockfall",path:"/arcade/hosted/blockfall/index.html",gameId:"cabinet-blockfall",data:{serialized:{board:Array.from({length:20},()=>Array(10).fill(0)),currentPiece:{type:"T",rotation:0,x:3,y:4},nextPiece:{type:"I",rotation:0,x:3,y:-1},isPaused:false,started:true,score:240,linesCleared:4,level:1,dropInterval:800,isWin:false,elapsedSinceDrop:100}},check:()=>document.querySelector("#score-val")?.textContent==="240"&&document.querySelector("#lines-val")?.textContent==="4"&&document.querySelector("#status-banner")?.style.display==="none"},
    {name:"Endless Runner",path:"/arcade/hosted/endless-runner/index.html",gameId:"cabinet-endless-runner",data:{serialized:{player:{x:75,y:400,vy:0,w:30,h:38},obs:[{x:320,y:505,w:30,h:35}],score:123,speed:432,spawn:0.8,ground:530}},check:()=>Number(document.querySelector("#score")?.textContent)>=123&&document.querySelector("#state")?.textContent==="Cloud save restored."}
  ];
  for(const testCase of runnerRestoreCases){
    const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
    await page.addInitScript(save=>{window.AshFallArcade={ready:Promise.resolve(),user:{id:"browser-smoke-test"},loadProgress:async gameId=>gameId===save.gameId?save.data:null,saveProgress:async()=>({revision:2}),recordScore:async()=>({saved:true})}}, {gameId:testCase.gameId,data:testCase.data});
    const response=await page.goto(base+testCase.path,{waitUntil:"domcontentloaded",timeout:30000});
    try{if(!response||response.status()!==200)throw new Error("page did not return HTTP 200");await page.waitForFunction(testCase.check,null,{timeout:6000});console.log("PASS cloud save restore: "+testCase.name+" restores active game state")}
    catch(error){console.error("FAIL cloud save restore: "+testCase.name+": "+(error?.message||String(error)));failed=true}
    finally{await page.close()}
  }

  // Verify cloud resume for Candy Crush, Bubble Barrage, and Car Race.
  const matchRestoreCases = [
    {name:"Candy Crush",path:"/arcade/hosted/candy-crush/index.html",gameId:"cabinet-candy-crush",data:{serialized:{board:Array.from({length:8},()=>Array(8).fill(0)),selected:{r:2,c:3},score:250,moves:12}},check:()=>document.querySelector("#score")?.textContent==="250"&&document.querySelector("#moves")?.textContent==="12"&&document.querySelector("#state")?.textContent==="Cloud save restored."},
    {name:"Bubble Barrage",path:"/arcade/hosted/bubble-barrage/index.html",gameId:"cabinet-bubble-barrage",data:{serialized:{grid:[{row:0,col:0,color:"#ff5edb",alive:true},{row:0,col:1,color:"#ff5edb",alive:true},{row:0,col:2,color:"#ff5edb",alive:true}],score:120,shots:4,aimOn:true,shooter:"#a8ff48",best:150,pointer:{x:320,y:150}}},check:()=>document.querySelector("#score")?.textContent==="120"&&document.querySelector("#shots")?.textContent==="4"&&document.querySelector("#best")?.textContent==="150"},
    {name:"Car Race",path:"/arcade/hosted/car-race/index.html",gameId:"cabinet-car-race",data:{serialized:{lane:2,traffic:[{lane:0,y:100,h:50}],score:345,speed:772,spawn:0.4}},check:()=>Number(document.querySelector("#score")?.textContent)>=345&&document.querySelector("#state")?.textContent==="Cloud save restored."}
  ];
  for(const testCase of matchRestoreCases){
    const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
    await page.addInitScript(save=>{window.AshFallArcade={ready:Promise.resolve(),user:{id:"browser-smoke-test"},loadProgress:async gameId=>gameId===save.gameId?save.data:null,saveProgress:async()=>({revision:2}),recordScore:async()=>({saved:true})}}, {gameId:testCase.gameId,data:testCase.data});
    const response=await page.goto(base+testCase.path,{waitUntil:"domcontentloaded",timeout:30000});
    try{if(!response||response.status()!==200)throw new Error("page did not return HTTP 200");await page.waitForFunction(testCase.check,null,{timeout:6000});console.log("PASS cloud save restore: "+testCase.name+" restores match/racing state")}
    catch(error){console.error("FAIL cloud save restore: "+testCase.name+": "+(error?.message||String(error)));failed=true}
    finally{await page.close()}
  }

  // Audit every account-bridge manifest entry for a matching hosted page and bridge config.
  const manifestPage = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const manifestResponse = await manifestPage.goto(base + "/arcade/hosted/account-bridge-manifest.json", { waitUntil: "domcontentloaded", timeout: 30000 });
  if (!manifestResponse || manifestResponse.status() !== 200) {
    console.error("FAIL account bridge manifest: could not fetch manifest");
    failed = true;
  } else {
    const manifest = await manifestResponse.json();
    const bridgeEntries = Array.isArray(manifest.games) ? manifest.games : [];
    const manifestProblems = [];
    for (const game of bridgeEntries) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
      try {
        const response = await page.goto(base + game.path, { waitUntil: "domcontentloaded", timeout: 20000 });
        if (!response || response.status() !== 200) manifestProblems.push(game.gameId + ": page not reachable");
        const script = page.locator('script[src*="arcade-account-bridge.js"]').first();
        if (await script.count() !== 1) manifestProblems.push(game.gameId + ": expected exactly one account bridge script");
        else {
          const config = await script.evaluate(el => ({ gameId: el.dataset.gameId, scoreMode: el.dataset.scoreMode || "score" }));
          if (config.gameId !== game.gameId) manifestProblems.push(game.gameId + ": script game ID does not match manifest");
          if (!["score", "completion", "moves", "wave"].includes(config.scoreMode)) manifestProblems.push(game.gameId + ": unsupported score mode " + config.scoreMode);
        }
        const reports = page.locator(".af-report");
        await reports.waitFor({ state: "attached", timeout: 4000 }).catch(() => {});
        if (await reports.count() !== 1) manifestProblems.push(game.gameId + ": expected exactly one issue-report link");
      } catch (error) {
        manifestProblems.push(game.gameId + ": " + (error?.message || String(error)));
      } finally {
        await page.close();
      }
    }
    if (manifestProblems.length) {
      console.error("FAIL account bridge manifest audit: " + manifestProblems.slice(0, 15).join(" | "));
      failed = true;
    } else {
      console.log("PASS account bridge manifest: " + bridgeEntries.length + " games have matching page config and one issue-report link");
    }
  }

  await manifestPage.close();

  // Crawl every playable cabinet linked by the catalog. This catches dead routes and
  // page-start exceptions before the owner has to manually test the entire collection.
  const catalogPage = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const catalogResponse = await catalogPage.goto(base + "/arcade-30-games.html", { waitUntil: "domcontentloaded", timeout: 30000 });
  if (!catalogResponse || catalogResponse.status() !== 200) {
    console.error("FAIL catalog crawl: catalog page did not return HTTP 200");
    failed = true;
  } else {
    const catalogCardCount = await catalogPage.locator("#grid article.game").count();
    if (catalogCardCount !== 76) {
      console.error("FAIL catalog count: expected 76 playable cards, found " + catalogCardCount);
      failed = true;
    } else {
      console.log("PASS catalog count: all 76 playable game cards are present");
    }
    const catalogRoutes = await catalogPage.locator('#grid article.game a[href^="/arcade/hosted/"]').evaluateAll(links => [...new Set(links.map(link => link.getAttribute("href")))] );
    const mainResponse = await catalogPage.goto(base + "/chaos-cartridge.html", { waitUntil: "domcontentloaded", timeout: 30000 });
    let mainRoutes = [];
    if (!mainResponse || mainResponse.status() !== 200) {
      console.error("FAIL main arcade crawl: main shelf did not return HTTP 200");
      failed = true;
    } else {
      mainRoutes = await catalogPage.locator('.cartridge-shelf a[href^="/arcade/hosted/"]').evaluateAll(links => [...new Set(links.map(link => link.getAttribute("href")))] );
      const featuredCards = catalogPage.locator("#game-shelf .cartridge-shelf > .cartridge-cabinet");
      const featuredTotal = await featuredCards.count();
      const featuredVisible = await catalogPage.locator("#game-shelf .cartridge-shelf > .cartridge-cabinet:visible").count();
      const categoryFilter = catalogPage.locator("#category, select[aria-label*='categor' i]");
      if (featuredTotal < 76 || featuredVisible !== featuredTotal) {
        console.error("FAIL featured shelf: expected at least 76 games all visible on one shelf, found " + featuredVisible + "/" + featuredTotal);
        failed = true;
      } else if (await categoryFilter.count()) {
        console.error("FAIL catalog: category dropdown should not split the arcade into separate views");
        failed = true;
      } else {
        console.log("PASS featured shelf: all " + featuredVisible + " games visible together; catalog has no category dropdown");
      }
    }
    const localHostedRoutes = await listHostedHtml();
    const routes = [...new Set([...catalogRoutes, ...mainRoutes, ...localHostedRoutes])];
    console.log(`INFO arcade crawl: checking ${routes.length} locally hosted game routes`);
    const routeFailures = [];
    for (const route of routes) {
      const errors = [];
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
      page.on("pageerror", error => errors.push(error.stack || error.message));
      if (route.includes("/hextris/")) {
        await page.addInitScript(() => {
          window.__routeErrorDetails = [];
          window.addEventListener("error", event => window.__routeErrorDetails.push({
            message: event.message, filename: event.filename, lineno: event.lineno, colno: event.colno,
            stack: event.error && event.error.stack
          }));
        });
      }
      try {
        const response = await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 20000 });
        if (!response || response.status() !== 200) routeFailures.push(`${route}: HTTP ${response?.status() ?? "no response"}`);
        else if (!(await page.title()).trim()) routeFailures.push(`${route}: missing document title`);
        await page.waitForTimeout(100);
        const bridgeScriptCount = await page.locator('script[src*="arcade-account-bridge.js"]').count();
        if (bridgeScriptCount) {
          const nav = page.locator(".af-arcade-nav");
          if (!(await nav.count()) || !(await nav.isVisible())) {
            routeFailures.push(`${route}: account-bridged game is missing the Ash-Fall navigation shell`);
          } else {
            const links = await nav.locator("a").evaluateAll(nodes => nodes.map(node => node.getAttribute("href")));
            if (!links.includes("/chaos-cartridge.html") || !links.includes("/arcade-30-games.html") || !links.includes("/arcade/arcade-license-guide.html")) {
              routeFailures.push(`${route}: Ash-Fall navigation shell is missing arcade or license navigation links`);
            }
            const reportLink = nav.locator('a[href*="github.com/xxxghostfacekidxxx-glitch/Knightfall/issues/new"]');
            if (!(await reportLink.count()) || (await reportLink.first().textContent()).trim() !== "Report issue") {
              routeFailures.push(`${route}: Ash-Fall navigation is missing its direct game issue-report link`);
            }
          }
        }
        if (route.includes("/hextris/")) {
          const details = await page.evaluate(() => window.__routeErrorDetails || []);
          if (details.length) routeFailures.push(`${route}: error details ${JSON.stringify(details)}`);
        }
        if (errors.length) routeFailures.push(`${route}: ${errors.join(" | ")}`);
      } catch (error) {
        routeFailures.push(`${route}: ${error.message}`);
      } finally {
        await page.close();
      }
    }
    if (routeFailures.length) {
      console.error("FAIL arcade route crawl:\n" + routeFailures.join("\n"));
      failed = true;
    } else {
      console.log(`PASS arcade route crawl: all ${routes.length} local game pages returned HTTP 200 with titles and no uncaught browser exceptions`);
    }
  }
  await catalogPage.close();
} finally {
  await browser.close();
}
if (failed) process.exit(1);
