// Verify real first-frame board rendering and basic input; HTML 200 is not a playable game.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const PORT=18773;
const origin=(process.env.GAME_BASE_URL||'http://127.0.0.1:'+PORT).replace(/\/$/,'');
const server=process.env.GAME_BASE_URL?null:spawn('python3',['-m','http.server',String(PORT),'--directory','public'],{stdio:'ignore'});
const out='priority-arcade-evidence/board-health';
await mkdir(out,{recursive:true});
const games=[
  {id:'ash-sudoku',selector:'#board .cell',count:81,action:async page=>{
    const first=page.locator('#board .cell:not(.given)').first();
    await first.click();
    await page.locator('#digits button').first().click();
    if(!(await first.textContent()).trim())throw Error('Number-pad input did not populate the selected Sudoku square');
    await page.locator('#hint').click();
    if(await page.locator('#board .cell').count()!==81)throw Error('Sudoku lost cells after a hint');
    if(await page.locator('#sudoku-recovery').count())throw Error('Sudoku displayed a bootstrap recovery notice');
  }},
  {id:'neon-mahjong',selector:'#board .tile',minimum:40,action:async page=>{
    const free=page.locator('#board .tile.free').first();
    if(!await free.isVisible())throw Error('Mahjong has no available selectable tiles');
    await free.click();
    if(!await page.locator('#board .tile.selected').count())throw Error('Mahjong did not select a tile');
  }},
  {id:'cinder-merge',selector:'#board .tile',count:16,action:async page=>{
    await page.locator('#restart').click();
    if(await page.locator('#board .tile').count()!==16)throw Error('Merge restart failed to draw board');
    if(await page.locator('#board .tile:not([data-v="0"])').count()<2)throw Error('Merge spawned no starting tiles');
  }},
  {id:'ash-tiles',selector:'#board .sliding',count:15,action:async page=>{
    await page.locator('#start').click();
    if(await page.locator('#board .sliding').count()!==15)throw Error('Sliding puzzle restart removed tiles');
  }},
  {id:'cinder-checkers',selector:'#board button',count:64},
  {id:'cinder-chess',selector:'#board button',minimum:32},
  {id:'cinder-reversi',selector:'#board .rev-cell',count:64},
  {id:'cinder-mines',selector:'#board button',minimum:36},
  {id:'cinder-life',selector:'#board',minimum:1,action:async page=>{
    const canvas=await page.locator('#board').evaluate(c=>({w:c.width,h:c.height}));
    if(canvas.w<100||canvas.h<100)throw Error('Life canvas has no backing pixels');
    await page.locator('#step').click();
  }},
  {id:'cinder-slots',selector:'#reels',minimum:1,action:async page=>{
    await page.locator('#spin').click();
    if(!/Spins 1/.test(await page.locator('#status').textContent()))throw Error('Slots did not register a spin');
  }}
];
const failures=[];
let browser;
try{
  let served=false;
  for(let i=0;i<60;i++){try{served=(await fetch(origin+'/arcade/hosted/ash-sudoku/index.html')).ok;if(served)break}catch{}await new Promise(r=>setTimeout(r,250))}
  if(!served)throw Error('Arcade static server did not start');
  browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  for(const profile of [{name:'mobile',width:390,height:844},{name:'desktop',width:1366,height:768}]){
    for(const game of games){
      const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},hasTouch:profile.name==='mobile',isMobile:profile.name==='mobile'});
      const page=await context.newPage(),errors=[],missing=[];
      page.on('pageerror',e=>errors.push(String(e.message||e)));
      page.on('response',r=>{if(r.url().startsWith(origin+'/')&&r.status()>=400)missing.push(r.status()+' '+r.url())});
      try{
        const response=await page.goto(origin+'/arcade/hosted/'+game.id+'/index.html',{waitUntil:'domcontentloaded',timeout:20000});
        if(!response?.ok())throw Error('HTTP '+(response?.status()||'no response'));
        await page.waitForFunction(({selector,minimum})=>document.querySelectorAll(selector).length>=minimum,{selector:game.selector,minimum:game.count||game.minimum},{timeout:10000});
        const visual=await page.locator(game.selector).first().evaluate(element=>{
          const s=getComputedStyle(element),r=element.getBoundingClientRect();
          return {width:r.width,height:r.height,display:s.display,visibility:s.visibility,opacity:Number(s.opacity)};
        });
        if(visual.width<2||visual.height<2||visual.display==='none'||visual.visibility==='hidden'||visual.opacity<0.01)throw Error('Game surface invisible: '+JSON.stringify(visual));
        if(game.count && await page.locator(game.selector).count()!==game.count)throw Error('Wrong number of game pieces');
        if(game.action)await game.action(page);
        if(errors.length||missing.length)throw Error('Startup errors: '+JSON.stringify({errors:errors.slice(0,3),missing:missing.slice(0,3)}));
        console.log('PASS '+profile.name+' '+game.id+' visible, initialized and interactive');
      }catch(error){
        const name=profile.name+'-'+game.id;
        failures.push({name,error:String(error.message||error),errors,missing});
        console.error('FAIL '+name+' '+String(error.message||error));
        await page.screenshot({path:out+'/'+name+'.png',timeout:6000}).catch(()=>{});
        await writeFile(out+'/'+name+'.json',JSON.stringify(failures.at(-1),null,2));
      }finally{await context.close();}
    }
  }
}finally{await browser?.close();server?.kill()}
await writeFile(out+'/report.json',JSON.stringify({checked:games.length*2,failed:failures.length,failures},null,2));
if(failures.length)process.exitCode=1;
