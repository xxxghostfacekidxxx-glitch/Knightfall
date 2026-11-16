/* Real Chromium acceptance smoke for the City of Cinders building-climb overhaul. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

const url=process.env.CINDERS_URL||'http://127.0.0.1:8765/city-of-cinders.html';
const local=url.includes('127.0.0.1:8765');
const server=local?spawn('python3',['-m','http.server','8765','--bind','127.0.0.1','--directory','public'],{stdio:'ignore'}):null;
let browser;
async function ready(){
 for(let i=0;i<50;i++){
  try{const r=await fetch(url);if(r.ok)return;}catch{}
  await new Promise(resolve=>setTimeout(resolve,300));
 }
 throw new Error('Local test server never became ready');
}
const snapshot=page=>page.evaluate(()=>window.CityCindersDiagnostics?.());
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try{
 if(local)await ready();
 browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:2});
 const page=await context.newPage();
 const pageErrors=[];page.on('pageerror',err=>pageErrors.push(err.message));
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>typeof window.CityCindersDiagnostics==='function',{timeout:12000});
 const initial=await snapshot(page);
 assert.equal(initial.state,'ready','title menu must boot');
 assert.equal(initial.buildings.length,12,'12 real structures');
 assert.equal(initial.renderer,'cinematic');
 assert.equal(initial.canvasPixels[0],1920,'HD renderer should honor high-density displays');
 await page.locator('#start').click();
 await page.waitForFunction(()=>window.CityCindersDiagnostics().state==='playing');
 const start=await snapshot(page);
 await page.keyboard.down('d');await sleep(370);await page.keyboard.up('d');
 let near=await snapshot(page);
 assert.ok(near.monster.x>start.monster.x,'right input must walk the monster');
 assert.ok(near.monster.x<near.buildings[0].x,'the building must block walking');
 await page.keyboard.down('w');await sleep(550);
 let climbing=await snapshot(page);
 await page.keyboard.up('w');
 assert.equal(climbing.monster.climbing,true,'W against the building must grip its wall');
 assert.ok(climbing.monster.y<near.monster.y-35,'wall-climb must move the monster vertically');
 await page.keyboard.press('Space');await sleep(180);
 let punched=await snapshot(page);
 assert.ok(punched.buildings[0].hp<start.buildings[0].hp,'punch must lower building structure');
 assert.ok(punched.buildings[0].holes>0,'punch must visibly damage one or more facade cells');
 assert.ok(punched.score>0,'punch scores damage');
 for(let i=0;i<13 && !(await snapshot(page)).buildings[0].dead;i++){
  await sleep(230);await page.keyboard.press('Space');
 }
 await sleep(150);
 const destroyed=await snapshot(page);
 assert.equal(destroyed.buildings[0].dead,true,'sustained punches collapse a tower');
 assert.ok(destroyed.wrecked>=1,'collapsed tower increments destruction HUD');
 mkdirSync('city-of-cinders-evidence',{recursive:true});
 await page.locator('#game').screenshot({path:'city-of-cinders-evidence/climb-destruction-desktop.png'});
 await page.locator('#restart').click();
 await page.locator('#kf-city-fidelity').selectOption('performance');
 const performanceMode=await snapshot(page);
 assert.equal(performanceMode.canvasPixels[0],960,'Performance mode renders at 1x density');
 await context.close();

 const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const phone=await mobile.newPage();
 phone.on('pageerror',err=>pageErrors.push('mobile: '+err.message));
 await phone.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
 await phone.waitForFunction(()=>typeof window.CityCindersDiagnostics==='function',{timeout:12000});
 assert.equal(await phone.locator('[data-hold="up"]').isVisible(),true,'portrait phone has CLIMB button');
 assert.equal(await phone.locator('[data-tap="punch"]').isVisible(),true,'portrait phone has PUNCH button');
 await phone.locator('#start').click();
 await phone.locator('[data-hold="right"]').dispatchEvent('pointerdown',{pointerId:11,pointerType:'touch'});
 await sleep(370);
 await phone.locator('[data-hold="right"]').dispatchEvent('pointerup',{pointerId:11,pointerType:'touch'});
 const phoneNear=await snapshot(phone);
 await phone.locator('[data-hold="up"]').dispatchEvent('pointerdown',{pointerId:12,pointerType:'touch'});
 await sleep(550);
 const phoneClimb=await snapshot(phone);
 await phone.locator('[data-hold="up"]').dispatchEvent('pointerup',{pointerId:12,pointerType:'touch'});
 assert.equal(phoneClimb.monster.climbing,true,'mobile CLIMB button grips the building');
 assert.ok(phoneClimb.monster.y<phoneNear.monster.y-35,'mobile climb ascends');
 await phone.locator('[data-tap="punch"]').dispatchEvent('pointerdown',{pointerId:13,pointerType:'touch'});
 await sleep(140);
 assert.ok((await snapshot(phone)).buildings[0].hp<phoneNear.buildings[0].hp,'mobile PUNCH strikes facade');
 await phone.locator('#game').screenshot({path:'city-of-cinders-evidence/climb-destruction-mobile.png'});
 await mobile.close();
 assert.deepEqual(pageErrors.filter(e=>/CityCindersWorld|city-of-cinders|SyntaxError|ReferenceError/.test(e)),[],
  'no city-of-cinders runtime exceptions');
 console.log(JSON.stringify({ok:true,desktop:{climbPixels:Math.round(near.monster.y-climbing.monster.y),firstBuildingDestroyed:destroyed.buildings[0].dead,score:destroyed.score},mobile:{climbPixels:Math.round(phoneNear.monster.y-phoneClimb.monster.y)},pageErrors},null,2));
}catch(e){console.error('City of Cinders browser acceptance FAILED:',e);process.exitCode=1;}
finally{
 if(browser)await browser.close();
 if(server){server.kill('SIGTERM');}
}
