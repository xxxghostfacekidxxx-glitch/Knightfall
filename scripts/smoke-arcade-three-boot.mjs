// Reproduce the three reported black-screen launches in a real browser, on phone and desktop.
// Verify visible board pixels, input, and the absence of covering recovery popups.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const port = 18789;
const base = (process.env.GAME_BASE_URL || 'http://127.0.0.1:' + port).replace(/\/$/, '');
const server = process.env.GAME_BASE_URL ? null :
  spawn('python3', ['-m', 'http.server', String(port), '--directory', 'public'], {stdio:'ignore'});
const output = 'priority-arcade-evidence/three-boot';
await mkdir(output, {recursive:true});
const failures = [];
let browser;

async function painted(page, selector) {
  return page.locator(selector).evaluate(canvas => {
    const style = getComputedStyle(canvas), rect = canvas.getBoundingClientRect();
    if (rect.width < 80 || rect.height < 80 || style.visibility === 'hidden' || style.display === 'none')
      return false;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    const {data} = ctx.getImageData(0,0,canvas.width,canvas.height);
    let first = null;
    for (let y = 1; y <= 20; y++) for (let x = 1; x <= 24; x++) {
      const cx = Math.min(canvas.width-1,Math.floor(canvas.width*x/25));
      const cy = Math.min(canvas.height-1,Math.floor(canvas.height*y/21));
      const index=(cy*canvas.width+cx)*4;
      if (data[index+3] < 16) continue;
      const p=[data[index],data[index+1],data[index+2]];
      if (!first) first=p;
      else if (p.some((v,i)=>Math.abs(v-first[i])>20))return true;
    }
    return false;
  });
}

try {
  let reachable=false;
  for(let i=0;i<50;i++) {
    try {reachable=(await fetch(base+'/arcade/hosted/ash-sudoku/index.html')).ok;if(reachable)break;} catch {}
    await new Promise(resolve=>setTimeout(resolve,200));
  }
  if (!reachable) throw Error('Static server unavailable');
  browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  for(const device of [{name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true},
                       {name:'desktop',viewport:{width:1366,height:768},isMobile:false,hasTouch:false}]) {
    for(const game of ['ash-veil','cinder-gauntlet','ash-sudoku']) {
      const context=await browser.newContext(device);
      const page=await context.newPage();
      const errors=[],assetErrors=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('response',r=>{
        if(r.url().startsWith(base+'/') && r.status()>=400)assetErrors.push(r.status()+' '+r.url());
      });
      try {
        const response=await page.goto(base+'/arcade/hosted/'+game+'/index.html',{waitUntil:'domcontentloaded',timeout:15000});
        if(!response?.ok())throw Error('Game document HTTP '+response?.status());
        await page.waitForTimeout(500);
        if(game==='ash-sudoku') {
          await page.waitForFunction(()=>document.querySelectorAll('#board .cell').length===81);
          if(await page.locator('#digits button').count()!==9)throw Error('Sudoku number pad incomplete');
          const square=page.locator('#board .cell:not(.given)').first();
          await square.click();
          await page.locator('#digits button').first().click();
          if(!await page.locator('#board .cell:not(.given)').first().textContent())throw Error('Sudoku input failed');
        } else if(game==='ash-veil') {
          if(!await painted(page,'#board'))throw Error('Ash Veil board remained blank');
          await page.locator('#right').click();
          if((await page.locator('#moves').textContent())?.trim()!=='1')throw Error('Ash Veil directional input failed');
        } else {
          if(!await painted(page,'#game'))throw Error('Cinder Gauntlet startup frame remained blank');
          if(!/Floor 1/.test(await page.locator('#message').textContent()))throw Error('Dungeon did not auto-start');
          await page.locator('#pause').click();
          if((await page.locator('#message').textContent())?.trim()!=='Paused')throw Error('Cinder Gauntlet pause failed');
        }
        const surface=game==='cinder-gauntlet'?'#game':'#board';
        await page.locator(surface).scrollIntoViewIfNeeded();
        const uncovered=await page.locator(surface).evaluate(root=>{
          const rect=root.getBoundingClientRect();
          const x=Math.max(0,Math.min(innerWidth-1,rect.left+rect.width/2));
          const y=Math.max(0,Math.min(innerHeight-1,(Math.max(rect.top,0)+Math.min(rect.bottom,innerHeight))/2));
          const above=document.elementFromPoint(x,y);
          return !!above && (above===root||root.contains(above));
        });
        if(!uncovered)throw Error('Another element is covering the game surface');
        if(await page.locator('#kf-arcade-boot-guard,#sudoku-recovery,#kf-arcade-recovery,#kf-arcade-boot-help').count())
          throw Error('Unwanted black-screen recovery popup present on a healthy game');
        if(errors.length||assetErrors.length)throw Error(JSON.stringify({errors,assetErrors}));
        console.log('PASS '+device.name+' '+game+' rendered and playable');
      } catch(e) {
        const id=device.name+'-'+game;
        failures.push({id,message:String(e.message||e),errors,assetErrors});
        await page.screenshot({path:output+'/'+id+'.png',timeout:5000}).catch(()=>{});
        console.error('FAIL '+id+' '+String(e.message||e));
      } finally {await context.close();}
    }
  }
} finally {
  await browser?.close();
  server?.kill();
}
await writeFile(output+'/report.json',JSON.stringify({failures,checked:6},null,2));
if(failures.length)process.exitCode=1;
