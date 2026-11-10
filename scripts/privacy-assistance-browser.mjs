// Browser-only end-to-end smoke for public privacy support and admin triage.
// Never uses a real account, posts real user data, or touches production.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.PRIVACY_TEST_BASE || 'http://127.0.0.1:8765';
const browser = await chromium.launch({ headless:true, args:['--no-sandbox'] });
const saved=[];
try {
 for(const viewport of [{width:390,height:844},{width:1280,height:900}]){
  const context=await browser.newContext({viewport});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const tickets=[{request_id:'a'.repeat(32),email:'test@example.com',username_hint:'test_member',status:'pending',created_at:'2026-11-10T18:00:00.000Z',operator_note:''}];
  await page.route('https://api.ash-fall.com/**',async route=>{
    const req=route.request(),url=new URL(req.url()),path=url.pathname,method=req.method(),origin=req.headers().origin||base;
    const headers={'access-control-allow-origin':origin,'access-control-allow-credentials':'true','access-control-allow-methods':'GET,POST,PATCH,DELETE,OPTIONS','access-control-allow-headers':'content-type','content-type':'application/json'};
    const respond=(status,data)=>route.fulfill({status,headers,body:JSON.stringify(data)});
    if(method==='OPTIONS')return route.fulfill({status:204,headers});
    if(path==='/api/privacy/deletion-assistance'&&method==='POST'){
      const payload=req.postDataJSON();saved.push(payload);
      return respond(202,{ok:true,request_id:'b'.repeat(32),message:'Your assistance request was recorded for staff review. Staff must verify account ownership before any deletion.'});
    }
    if(path==='/api/auth/me'&&method==='GET')return respond(200,{user:{id:1,role:'admin',username:'qa_admin'}});
    if(path==='/api/admin/privacy-assistance'&&method==='GET')return respond(200,{tickets,next_cursor:null});
    if(path==='/api/admin/privacy-assistance/'+tickets[0].request_id&&method==='PATCH'){
      Object.assign(tickets[0],req.postDataJSON());
      return respond(200,{ok:true,status:tickets[0].status});
    }
    if(path==='/api/site-settings')return respond(200,{settings:{maintenance_mode:'false'}});
    if(path==='/api/notifications/unread')return respond(200,{unread_count:0});
    return respond(200,{});
  });
  const publicPage=await page.goto(base+'/account-deletion.html',{waitUntil:'load'});
  assert.equal(publicPage?.status(),200);
  await page.locator('#privacy-help-email').fill('test@example.com');
  await page.locator('#privacy-help-username').fill('test_member');
  await page.locator('#privacy-help-ack').check();
  await page.locator('#privacy-help-submit').click();
  await page.waitForFunction(()=>document.querySelector('#privacy-help-status')?.textContent.includes('staff review'));
  assert.equal(saved.at(-1).email,'test@example.com');
  assert.equal(saved.at(-1).acknowledged,true);
  assert.ok(!('password' in saved.at(-1)),'public assistance must not collect a password');
  const width=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,content:document.documentElement.scrollWidth}));
  assert.ok(width.content<=width.viewport+2,'Privacy form overflows '+JSON.stringify(viewport)+': '+JSON.stringify(width));
  const adminPage=await page.goto(base+'/admin-privacy-assistance.html',{waitUntil:'load'});
  assert.equal(adminPage?.status(),200);
  await page.getByText('test@example.com').waitFor();
  await page.locator('.privacy-ticket textarea').fill('Follow-up required');
  await page.locator('.privacy-ticket select').selectOption('awaiting_verification');
  await page.getByRole('button',{name:'Save review status'}).click();
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('Review state saved'));
  assert.equal(tickets[0].status,'awaiting_verification');
  assert.equal(tickets[0].operator_note,'Follow-up required');
  assert.deepEqual(errors,[],'Browser errors: '+JSON.stringify(errors));
  await context.close();
  console.log('PASS privacy support and admin review '+viewport.width+'px');
 }
} finally { await browser.close(); }
