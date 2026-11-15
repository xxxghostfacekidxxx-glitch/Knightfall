// Self-hosted browser acceptance for the eight opt-in fullscreen/recovery cabinets.
// Intentionally does not click Start or alter saved player progress.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
const port=18759;
const origin=process.env.GAME_BASE_URL||'http://127.0.0.1:'+port;
const server=process.env.GAME_BASE_URL?null:spawn('python3',['-m','http.server',String(port),'--directory','public'],{stdio:'ignore'});
const entries=[
  ['radius-raid','#wrap',false],['terravia','#app',true],
  ['interstellar-armada','body',false],['single-html-space-shooter','body',false],
  ['browserquest-solo','body',true],['openfront-solo','body',true],
  ['cinder-life','main',true],['cinder-slots','main',true]
];
const failures=[];
await mkdir('priority-arcade-evidence',{recursive:true});
let browser;
try {
  let ready=false;
  for(let i=0;i<60;i++){
    try { ready=(await fetch(origin+'/arcade/hosted/cinder-slots/index.html')).ok; if(ready)break; } catch {}
    await new Promise(r=>setTimeout(r,250));
  }
  if(!ready)throw Error('Local arcade server failed to start');
  browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  for(const [id,target,mobile] of entries){
    const context=await browser.newContext(mobile
      ?{viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true}
      :{viewport:{width:1280,height:800}});
    const page=await context.newPage();
    const scriptErrors=[];
    page.on('pageerror',err=>scriptErrors.push(err.message));
    try {
      const response=await page.goto(origin+'/arcade/hosted/'+id+'/index.html',{waitUntil:'domcontentloaded',timeout:30000});
      if(!response?.ok())throw Error('Page returned '+response?.status());
      const button=page.locator('#kf-arcade-view-toggle');
      await button.waitFor({state:'visible',timeout:15000});
      const configured=await page.locator('script[src*="arcade-playback-assist.js"]').getAttribute('data-target');
      if(configured!==target)throw Error('Wrong game surface: '+configured);
      await button.click({timeout:10000});
      await page.waitForFunction(()=>document.querySelector('#kf-arcade-view-toggle')?.getAttribute('aria-pressed')==='true',{timeout:10000});
      const immersive=await page.evaluate(()=>Boolean(document.fullscreenElement||document.webkitFullscreenElement||document.body.classList.contains('kf-arcade-playback-active')));
      if(!immersive)throw Error('Fullscreen or theater did not activate');
      await button.click({timeout:10000});
      await page.waitForFunction(()=>document.querySelector('#kf-arcade-view-toggle')?.getAttribute('aria-pressed')==='false',{timeout:10000});
      if(id==='cinder-slots'){
        // A missing JS file must give a visible recovery action, not a black screen.
        await page.evaluate(()=>{const script=document.createElement('script');script.src='/arcade/hosted/cinder-slots/__missing_test_asset__.js';document.head.append(script)});
        await page.locator('#kf-arcade-recovery button').first().waitFor({state:'visible',timeout:10000});
        if(await page.locator('#kf-arcade-recovery a[href="/chaos-cartridge.html"]').count()!==1)throw Error('No Back to arcade recovery link');
      }
      console.log('PASS '+id+' | fullscreen/theater and exit'+(scriptErrors.length?' | game JS diagnostics: '+scriptErrors.slice(0,2).join(' | '):''));
    }catch(err){
      failures.push(id+': '+err.message);
      console.error('FAIL '+id+': '+err.message);
      try{await page.screenshot({path:'priority-arcade-evidence/assist-'+id+'.png',timeout:10000})}catch{}
      await writeFile('priority-arcade-evidence/assist-'+id+'.txt',[err.stack,...scriptErrors].join('\n'));
    }finally{await context.close();}
  }
  // Neon Surge requires remote Three.js modules; a failed resource must never leave a silent blank screen.
  {
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    const page=await context.newPage();
    try {
      const response=await page.goto(origin+'/arcade/hosted/neon-surge/index.html',{waitUntil:'domcontentloaded',timeout:30000});
      if(!response?.ok())throw Error('Neon Surge returned '+response?.status());
      await page.locator('#fsBtn').waitFor({state:'attached',timeout:10000});
      const hasNative=await page.evaluate(()=>Boolean(document.fullscreenEnabled||document.webkitFullscreenEnabled));
      const count=await page.locator('#kf-arcade-view-toggle').count();
      if(hasNative && count!==0)throw Error('Duplicate fullscreen button in Neon Surge');
      await page.evaluate(()=>{const script=document.createElement('script');script.src='/arcade/hosted/neon-surge/__missing_test_graphics__.js';document.head.append(script)});
      await page.locator('#kf-arcade-recovery a[href="/chaos-cartridge.html"]').waitFor({state:'visible',timeout:10000});
      console.log('PASS neon-surge | existing fullscreen retained and failed graphics import is recoverable');
    }catch(err){
      failures.push('neon-surge: '+err.message);
      console.error('FAIL neon-surge: '+err.message);
      try{await page.screenshot({path:'priority-arcade-evidence/assist-neon-surge.png',timeout:10000})}catch{}
      await writeFile('priority-arcade-evidence/assist-neon-surge.txt',err.stack);
    }finally{await context.close();}
  }
} finally {
  if(browser)await browser.close();
  if(server)server.kill();
}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}
