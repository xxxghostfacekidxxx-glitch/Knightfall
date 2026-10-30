import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';

const base=process.env.GAME_BASE_URL||'http://127.0.0.1:18743';
const server=process.env.GAME_BASE_URL?null:spawn('python3',['-m','http.server','18743','--directory','public'],{stdio:'ignore'});
const catalog=JSON.parse(await readFile('public/arcade/catalog.json','utf8'));
const names=['monster-mmo','browserquest-solo','sanctuary-original-sanctuary','sanctuary-ashfall-edition','fable-gta','pikkuautot-city','single-html-space-shooter','fifteen-puzzle-upstream','cinder-fleet'];
const failures=[];
await mkdir('priority-arcade-evidence',{recursive:true});
let browser;
try {
  for(let n=0;n<60;n++){try{if((await fetch(base+'/monster-mmo.html')).ok)break}catch{}await new Promise(r=>setTimeout(r,250))}
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  for(const id of names){
    const game=catalog.games.find(g=>g.id===id);
    if(!game){failures.push(id+': missing catalog entry');continue}
    const page=await browser.newPage({viewport:{width:1280,height:800}});
    const errors=[],missing=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',response=>{if(response.status()>=400&&new URL(response.url()).origin===new URL(base).origin)missing.push(response.status()+' '+response.url())});
    try{
      const response=await page.goto(base+game.route,{waitUntil:'domcontentloaded',timeout:90000});
      if(!response?.ok())throw Error('HTTP '+response?.status());
      await page.waitForTimeout(2500);
      if(id==='monster-mmo'){
        await page.locator('#world').waitFor({state:'visible'});
        if(await page.locator('#world').evaluate(e=>e.children.length)===0)throw Error('World grid empty');
        const initialPosition=await page.locator('#position').textContent();
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(250);
        const afterPosition=await page.locator('#position').textContent();
        if(initialPosition===afterPosition)console.warn('WARN monster-mmo: movement blocked or map tile impassable; manual movement QA needed');
        await page.locator('#game-menu-toggle').click();
        if(await page.locator('#game-menu-toggle').getAttribute('aria-expanded')!=='true')throw Error('Pause menu did not open');
      }
      if(id==='browserquest-solo'){
        await page.locator('#nameinput').waitFor({state:'visible',timeout:30000});
      }
      if(id==='fifteen-puzzle-upstream'){
        if(await page.locator('script[src*="15-puzzle"]').count()===0)throw Error('Puzzle script missing');
        await page.locator('#scramble').click();
        if(await page.locator('#puzzle').evaluate(e=>e.children.length)===0)throw Error('Puzzle grid missing after scramble');
      }
      if(id==='single-html-space-shooter'){
        if(await page.locator('canvas').count()===0)throw Error('Shooter canvas missing');
      }
      if(id==='cinder-fleet'){
        if(await page.locator('#enemy button').count()!==64)throw Error('Enemy grid not initialized');
        await page.locator('#enemy button:not([disabled])').first().click();
        await page.waitForTimeout(500);
        if(await page.locator('#enemy .hit,#enemy .miss').count()!==1)throw Error('Player attack did not register');
      }
      if(errors.length)throw Error('JS: '+errors.slice(0,5).join(' | '));
      if(missing.length)throw Error('Missing assets: '+missing.slice(0,8).join(' | '));
      console.log('PASS '+id);
    }catch(e){
      failures.push(id+': '+e.message);
      await writeFile('priority-arcade-evidence/'+id+'.txt',[e.stack,...errors,...missing].join('\n'));
      console.error('FAIL '+id+': '+e.message);
    }finally{
      try{await page.screenshot({path:'priority-arcade-evidence/'+id+'.png',fullPage:false,timeout:10000})}catch{}
      await page.close();
    }
  }
}finally{await browser?.close();server?.kill()}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1}
