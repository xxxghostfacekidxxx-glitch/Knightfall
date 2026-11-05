import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.ARCADE_TEST_BASE||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const failures=[];
async function scenario(name,viewport,exercise){
 const page=await browser.newPage({viewport,deviceScaleFactor:1}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{await exercise(page);assert.deepEqual(errors,[],name+' uncaught JavaScript errors');console.log('PASS',name)}
 catch(error){failures.push(name+': '+error.message);console.error('FAIL',name,error)}
 finally{await page.close()}
}
try{
 await scenario('Rooftop Riot desktop: real running, jumping, dash, pause, restart',{width:1360,height:880},async page=>{
  const res=await page.goto(base+'/arcade/hosted/rooftop-riot/index.html',{waitUntil:'domcontentloaded'});
  assert.equal(res.status(),200);
  await page.click('#start');
  await page.waitForFunction(()=>window.RooftopRiotStatus?.().state==='running');
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(550);
  await page.keyboard.press('Space');await page.keyboard.press('ShiftLeft');
  await page.waitForTimeout(250);await page.keyboard.up('ArrowRight');
  const s=await page.evaluate(()=>window.RooftopRiotStatus());
  assert.ok(s.distance>0,'Running should advance measurable distance');
  assert.ok(await page.locator('#game').evaluate(canvas=>{const c=canvas.getContext('2d');const p=c.getImageData(100,100,1,1).data;return p[3]>0;}),'Canvas should draw');
  await page.click('#pause');assert.equal(await page.locator('#pause-overlay').isVisible(),true);
  const saved=await page.evaluate(()=>window.RooftopRiotStatus().time);
  await page.waitForTimeout(150);
  const paused=await page.evaluate(()=>window.RooftopRiotStatus().time);
  assert.equal(paused,saved,'Paused time should not advance');
  await page.click('#resume');await page.click('#restart');
  assert.equal(await page.evaluate(()=>window.RooftopRiotStatus().state),'running');
 });
 await scenario('Rooftop Riot mobile: no horizontal overflow, functional controls',{width:390,height:844},async page=>{
  await page.goto(base+'/arcade/hosted/rooftop-riot/index.html',{waitUntil:'domcontentloaded'});
  const sizes=await page.evaluate(()=>({body:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
  assert.ok(sizes.body<=sizes.viewport+2,'Rooftop horizontal page overflow: '+JSON.stringify(sizes));
  await page.click('#start');await page.click('#jump');await page.click('#dash');
  assert.equal(await page.evaluate(()=>window.RooftopRiotStatus().state),'running');
  assert.ok(await page.locator('#right').isVisible());
 });
 await scenario('Not Dead Yet desktop: melee, threat level, pause and restart',{width:1360,height:920},async page=>{
  const res=await page.goto(base+'/not-dead-yet.html',{waitUntil:'domcontentloaded'});assert.equal(res.status(),200);
  await page.selectOption('#mode','campaign');await page.selectOption('#difficulty','nightmare');
  await page.click('#start');assert.equal(await page.locator('#difficulty').isDisabled(),true);
  assert.equal(await page.locator('#overlay').evaluate(el=>getComputedStyle(el).display),'none');
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(85);
  const value=await page.locator('#melee-bar').evaluate(el=>parseFloat(el.style.width));
  assert.ok(value>=0&&value<100,'Melee attack must enter cooldown: '+value);
  await page.click('#pause');assert.match(await page.locator('#pause').innerText(),/Resume/);
  await page.click('#pause');
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  assert.match(await page.locator('#pause').innerText(),/Resume/,'Switching apps should automatically pause');
  await page.click('#pause');await page.click('#restart');
  assert.equal(await page.locator('#difficulty').isDisabled(),true);
  assert.match(await page.locator('#combat-objective').innerText(),/NIGHTMARE/i);
 });
 await scenario('Not Dead Yet mobile: ergonomic melee, fullscreen and untouched saves',{width:390,height:844},async page=>{
  await page.goto(base+'/not-dead-yet.html',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#touch-melee').isVisible(),true);
  assert.equal(await page.locator('.zombie-service-panel').count(),4);
  await page.click('#start');await page.click('#touch-melee');
  assert.ok(await page.locator('#game').isVisible());
  const p=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
  assert.ok(p.width<=p.viewport+2,'Zombie horizontal page overflow: '+JSON.stringify(p));
 });
}finally{await browser.close()}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1}
