import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const base='http://127.0.0.1:18744';
const server=spawn('python3',['-m','http.server','18744','--directory','public'],{stdio:'ignore'});
let browser;
try {
  for(let n=0;n<40;n++){try{if((await fetch(base+'/index.html')).ok)break}catch{}await new Promise(r=>setTimeout(r,250))}
  browser=await chromium.launch({headless:true});
  for(const status of [200,401,403,500,503]){
    const page=await browser.newPage({viewport:{width:390,height:844}});
    await page.route('https://api.ash-fall.com/api/auth/me',route=>route.fulfill({status,contentType:status===200?'text/html':'application/json',body:status===200?'<html>bad gateway</html>':'{}'}));
    await page.goto(base+'/index.html',{waitUntil:'domcontentloaded'});
    if(!(await page.locator('#kf-primary-nav').count())) await page.addScriptTag({url:base+'/nav.js'});
    await page.locator('#kf-primary-nav').waitFor({state:'attached',timeout:10000});
    await page.waitForTimeout(400);
    const toggle=page.locator('.kf-nav-toggle');
    if(await toggle.count() && await toggle.isVisible()) { await toggle.click(); await page.waitForTimeout(100); }
    const result=await page.evaluate(()=>({header:!!document.querySelector('.kf-header'),account:!!document.querySelector('.kf-profile-group'),members:!!document.querySelector('a[href="/members.html"]'),privilegedVisible:[...document.querySelectorAll('.kf-admin-link,.kf-admin-quick-link,.kf-mod-link')].some(e=>!e.hidden)}));
    if(!result.header||!result.account||!result.members||result.privilegedVisible)throw Error('Missing navigation for auth status '+status+': '+JSON.stringify(result));
    await page.close();
  }
  console.log('Navigation auth failure smoke checks passed');
} finally { await browser?.close(); server.kill(); }
