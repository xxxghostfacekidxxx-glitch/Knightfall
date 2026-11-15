// Evidence-driven arcade render health check: surface startup errors and truly empty game canvases.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const PORT=18761;
const origin=(process.env.GAME_BASE_URL||'http://127.0.0.1:'+PORT).replace(/\/$/,'');
const server=process.env.GAME_BASE_URL?null:spawn('python3',['-m','http.server',String(PORT),'--directory','public'],{stdio:'ignore'});
const output='priority-arcade-evidence/render-health';
await mkdir(output,{recursive:true});
const titles=[
 {id:'neon-surge',route:'/arcade/hosted/neon-surge/index.html',target:'#startBtn',ready:'window.__NS || document.querySelector("#kf-arcade-recovery")'},
 {id:'terravia',route:'/arcade/hosted/terravia/index.html',target:'#app',ready:'document.querySelector("#app")?.childElementCount>1 || document.querySelector("#scene")?.childElementCount>0 || document.querySelector("#kf-arcade-recovery")'},
 {id:'radius-raid',route:'/arcade/hosted/radius-raid/index.html',target:'#wrap',ready:'document.querySelector("#cfg")?.width>100 || document.querySelector("#kf-arcade-recovery")'},
 {id:'interstellar-armada',route:'/arcade/hosted/interstellar-armada/index.html',target:'#splashContainer',ready:'document.querySelector("#gameVersion")?.textContent?.trim() || document.querySelector("#splashProgress")?.textContent?.trim() || document.querySelector("#kf-arcade-recovery")'},
 {id:'openfront-solo',route:'/arcade/hosted/openfront-solo/index.html',target:'#single-player',ready:'customElements.get("o-button") || document.querySelector("#kf-arcade-recovery")'},
 {id:'rooftop-riot',route:'/arcade/hosted/rooftop-riot/index.html',target:'#game',ready:'window.Engine && document.querySelector("#game")?.width>500'},
 {id:'cinder-life',route:'/arcade/hosted/cinder-life/index.html',target:'#board',ready:'document.querySelector("#board")?.width>500'},
 {id:'cinder-chess',route:'/arcade/hosted/cinder-chess/index.html',target:'#board',ready:'document.querySelector("#board")?.children.length>20'},
 {id:'browserquest-solo',route:'/arcade/hosted/browserquest-solo/index.html',target:'#intro',ready:'document.querySelector("#intro")?.getBoundingClientRect().width>100'},
];
const findings=[];
let browser;
try{
 let served=false;
 for(let i=0;i<90;i++){try{served=(await fetch(origin+'/arcade/hosted/cinder-life/index.html')).ok;if(served)break}catch{}await new Promise(r=>setTimeout(r,250));}
 if(!served)throw Error('Static site not reachable');
 browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
 for(const v of titles){
   const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
   const page=await context.newPage();
   const errors=[],failed=[];
   page.on('pageerror',e=>errors.push(String(e.message||e).slice(0,280)));
   page.on('requestfailed',r=>{
     const url=r.url();
     if(url.startsWith(origin) || (v.id==='neon-surge' && /cdn\.jsdelivr\.net|unpkg\.com/.test(url)))failed.push({url,error:r.failure()?.errorText});
   });
   page.on('response',r=>{
     const url=r.url();
     if(r.status()>=400 && (url.startsWith(origin)||v.id==='neon-surge' && /cdn\.jsdelivr\.net/.test(url)))failed.push({url,status:r.status()});
   });
   let state='unknown',reason='';
   try{
     const response=await page.goto(origin+v.route,{waitUntil:'domcontentloaded',timeout:20000});
     if(!response?.ok())throw Error('HTTP '+response?.status());
     await page.locator(v.target).first().waitFor({state:'attached',timeout:10000});
     await page.waitForFunction(expr=>{try{return Boolean(Function('return '+expr)())}catch{return false}},v.ready,{timeout:20000,polling:250}).catch(()=>{});
     if(v.id==='rooftop-riot')await page.locator('#start').click({timeout:4000});
     await page.waitForTimeout(1400);
     const visual=await page.evaluate((target)=>{
       const root=document.querySelector(target),box=root?.getBoundingClientRect();
       const canvases=[...document.querySelectorAll('canvas')].filter(c=>c.id!=='af-vfx-canvas');
       const visible=canvases.filter(c=>{const b=c.getBoundingClientRect(),s=getComputedStyle(c);return b.width>=20&&b.height>=20&&s.display!=='none'&&s.visibility!=='hidden'}).map(c=>({id:c.id,width:c.width,height:c.height,rect:[Math.round(c.getBoundingClientRect().width),Math.round(c.getBoundingClientRect().height)]}));
       return {target:box&&{width:Math.round(box.width),height:Math.round(box.height)},canvases:visible,bodyText:document.body?.innerText?.trim().slice(0,130),recovery:!!document.querySelector('#kf-arcade-recovery'),boot:document.querySelector('#boot')?.textContent?.trim()||'',titleVisible:!!(document.querySelector('#startBtn')?.getBoundingClientRect().width)};
     },v.target);
     if(errors.length||failed.length){state='runtime-failure';reason=JSON.stringify({errors:errors.slice(0,3),failed:failed.slice(0,4)});}
     else if(!visual.target||visual.target.width<25||visual.target.height<20){state='blank-surface';reason='Game root has no usable dimensions';}
     else if(v.id==='neon-surge'&&!await page.evaluate(()=>!!window.__NS)){state='boot-not-ready';reason='3D engine did not initialize';}
     else if(v.id==='openfront-solo'&&!await page.evaluate(()=>!!customElements.get('o-button'))){state='boot-not-ready';reason='Main game bundle did not register controls';}
     else if(v.id==='terravia'&&!await page.evaluate(()=>document.querySelector('#scene')?.children.length>0)){state='boot-not-ready';reason='Scene container remained empty';}
     else if(v.id==='radius-raid'&&visual.canvases.length===0){state='blank-surface';reason='No visible canvas';}
     else {state='healthy';reason='Visible game root and no tracked JS/asset errors';}
     findings.push({id:v.id,route:v.route,state,reason,visual});
     console.log(state.toUpperCase()+' '+v.id+' '+reason.slice(0,320));
     if(state!=='healthy')await page.screenshot({path:output+'/'+v.id+'.png',timeout:10000}).catch(()=>{});
   }catch(e){
     state='navigation-failure';reason=String(e.stack||e);
     findings.push({id:v.id,route:v.route,state,reason,errors,failed});
     console.error('FAIL '+v.id+' '+e.message);
     await page.screenshot({path:output+'/'+v.id+'.png',timeout:10000}).catch(()=>{});
   }finally{await context.close();}
 }
}finally{if(browser)await browser.close();if(server)server.kill();}
await writeFile(output+'/report.json',JSON.stringify({created:new Date().toISOString(),findings},null,2));
const unhealthy=findings.filter(x=>x.state!=='healthy');
console.log('RENDER_HEALTH '+JSON.stringify({checked:findings.length,healthy:findings.length-unhealthy.length,unhealthy:unhealthy.map(x=>({id:x.id,state:x.state,reason:x.reason.slice(0,250)}))}));
if(unhealthy.length)process.exitCode=1;
