import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.GAME_BASE_URL||'http://127.0.0.1:18741';
const failures=[];
const server=process.env.GAME_BASE_URL?null:spawn('python3',['-m','http.server','18741','--directory','public'],{stdio:'ignore'});
let browser;await mkdir('advanced-game-evidence',{recursive:true});
try{
 for(let i=0;i<40;i++){try{if((await fetch(base+'/arcade-30-games.html')).ok)break}catch{}await new Promise(r=>setTimeout(r,250))}
 browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const slug of ['browserquest-solo','interstellar-armada','openfront-solo']){
  const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')console.log(slug,'console:',m.text().slice(0,400))});
  try{
   const response=await page.goto(`${base}/arcade/hosted/${slug}/index.html${slug==='interstellar-armada'?'#local':''}`,{waitUntil:'domcontentloaded',timeout:60000});
   if(!response.ok())throw Error(`HTTP ${response.status()}`);
   if(slug==='browserquest-solo'){
    await page.locator('#nameinput').fill('Knightfall');
    await page.locator('#createcharacter .play:not(.disabled)').click({timeout:60000});
    await page.waitForFunction(()=>document.body.classList.contains('started'),null,{timeout:60000});
    await page.locator('body').click({position:{x:640,y:400}});
    await page.locator('#foreground').click({position:{x:450,y:230}});
    if(!await page.locator('canvas').count())throw Error('World canvas missing');
   }else if(slug==='interstellar-armada'){
    await page.getByText('Single player',{exact:true}).waitFor({state:'visible',timeout:60000});
    for(let i=0;i<3;i++){const dialog=page.locator('#dialog_screenContainer');if(await dialog.isVisible()){console.log('Armada dialog:',await page.locator('#dialog_message').innerText());await page.locator('#dialog_leftButton').click();await page.waitForTimeout(250)}else break;}
    await page.getByText('Single player',{exact:true}).click({timeout:30000});
    await page.getByText('Campaign',{exact:true}).click({timeout:30000});
    await page.locator('[id$="_missionListContainer"] .listContainer > *').first().click({timeout:30000});
    await page.locator('[id$="_launchButton"]:visible').click();
    await page.locator('[id$="_battleCanvas"]').waitFor({state:'visible',timeout:60000});
   }else{
    await page.locator('username-input input').fill('Knightfall');
    await page.locator('#single-player').click({timeout:60000});
    const modal=page.locator('single-player-modal');
    await modal.locator('o-button[title="Start Game"], o-button[title="Start game"], o-button[title="Start"]').click({timeout:15000});
    await page.locator('canvas').first().waitFor({state:'visible',timeout:60000});
   }
   await page.waitForTimeout(2500);
   if(errors.length)throw Error(errors.join(' | '));
   console.log(`${slug}: gameplay launch passed`);
  }catch(error){await writeFile(`advanced-game-evidence/${slug}.html`,await page.content());console.error(slug,error.message);failures.push(`${slug}: ${error.message}`)}
  finally{await page.screenshot({path:`advanced-game-evidence/${slug}.png`});await page.close()}
 }
 if(failures.length)throw Error(failures.join('\n'));
}finally{await browser?.close();server?.kill()}
