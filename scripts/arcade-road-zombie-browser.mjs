import {chromium} from "playwright";
import assert from "node:assert/strict";
const base=process.env.ARCADE_TEST_BASE||"http://127.0.0.1:8765";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const failures=[];
async function scenario(name,viewport,fn){
 const page=await browser.newPage({viewport});const errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 try{await fn(page);assert.deepEqual(errors,[],name+" browser errors");console.log("PASS",name)}
 catch(e){failures.push(name+": "+e.message);console.error("FAIL",name,e)}
 finally{await page.close()}
}
await scenario("Roads of Cinder desktop four-player flow",{width:1280,height:850},async page=>{
 await page.goto(base+"/arcade/hosted/roads-of-cinder/index.html",{waitUntil:"domcontentloaded"});
 await page.waitForSelector("#board .tile",{timeout:10000});
 assert.ok(await page.locator("#board .tile").count()>=60);
 await page.selectOption("#player-count","4");await page.fill('#player-names input:first-child',"Rook");await page.click("#new-game");
 assert.equal(await page.locator("#players .player").count(),4);
 assert.match(await page.locator("#players .player:first-child strong").innerText(),/Rook/);
 for(let i=0;i<4;i++){await page.locator("#choice-list button").first().click();await page.locator("#choice-list button").first().click()}
 assert.equal(await page.locator("#spin").isDisabled(),false);
 await page.click("#spin");await page.waitForTimeout(1100);
 assert.ok((await page.locator("#spin-result").innerText()).match(/^\d+$/));
 await page.reload({waitUntil:"domcontentloaded"});
 assert.equal(await page.locator("#players .player").count(),4);
 assert.match(await page.locator("#players .player:first-child strong").innerText(),/Rook/);
});
await scenario("Roads of Cinder mobile controls before board",{width:390,height:844},async page=>{
 await page.goto(base+"/arcade/hosted/roads-of-cinder/index.html",{waitUntil:"domcontentloaded"});
 await page.waitForSelector("#board .tile");
 const order=await page.evaluate(()=>{
  const a=document.querySelector(".board-panel").getBoundingClientRect();
  const b=document.querySelector(".side").getBoundingClientRect();return{boardY:a.top,controlsY:b.top,overflow:document.documentElement.scrollWidth>innerWidth+2}});
 assert.ok(order.controlsY<order.boardY,"mobile turn controls should be above the board");
 assert.equal(order.overflow,false,"no horizontal scrolling");
});
await scenario("Not Dead Yet desktop start, shooting and reload",{width:1280,height:850},async page=>{
 await page.goto(base+"/not-dead-yet.html",{waitUntil:"domcontentloaded"});
 await page.waitForSelector("#start",{timeout:10000});
 await page.selectOption("#mode","campaign");await page.click("#start");
 await page.waitForTimeout(180);
 assert.ok(await page.locator("#campaign-stage").isVisible(),"campaign objectives visible");
 assert.ok((await page.locator("#ammo").innerText()).includes("/"));
 await page.locator("#game").click({position:{x:500,y:260},force:true});
 await page.keyboard.press("r");
 await page.waitForTimeout(60);
 assert.ok((await page.locator("#ammo").innerText()).includes("RELOADING"),"reload feedback");
 await page.click("#pause");assert.match(await page.locator("#pause").innerText(),/Resume/);
});
await scenario("Not Dead Yet mobile combat controls",{width:390,height:844},async page=>{
 await page.goto(base+"/not-dead-yet.html",{waitUntil:"domcontentloaded"});
 await page.waitForSelector("#start",{timeout:10000});
 await page.selectOption("#mode","campaign");await page.click("#start");
 assert.ok(await page.locator("#touch-reload").isVisible(),"reload control visible");
 await page.locator("#touch-fire").dispatchEvent("pointerdown",{pointerId:1,button:0,pointerType:"touch",clientX:120,clientY:400});
 await page.waitForTimeout(150);
 assert.ok((await page.locator("#ammo").innerText()).includes("/"));
});
await browser.close();
if(failures.length){console.error(failures.join("\n"));process.exitCode=1}
