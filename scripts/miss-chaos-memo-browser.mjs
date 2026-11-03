import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.MEMO_TEST_BASE||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const failures=[];
async function run(name,width,height){
 const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[],sent=[],notes=[];
 page.on('pageerror',err=>errors.push(err.message));
 await page.route('https://api.ash-fall.com/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname,method=req.method();
  const origin=req.headers().origin||base,headers={'access-control-allow-origin':origin,'access-control-allow-credentials':'true','access-control-allow-methods':'GET,POST,PATCH,DELETE,OPTIONS','access-control-allow-headers':'content-type','content-type':'application/json'};
  const respond=async(status,data)=>route.fulfill({status,headers,body:JSON.stringify(data)});
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  if(path==='/api/auth/me')return respond(200,{user:{id:7,username:'memo_tester'}});
  if(path==='/api/memos'&&method==='GET')return respond(200,{memos:notes});
  if(path==='/api/memos'&&method==='POST'){
   const payload=JSON.parse(req.postData()||'{}'),memo={id:notes.length+1,...payload,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
   notes.unshift(memo);return respond(201,{memo});
  }
  const match=path.match(/^\/api\/memos\/(\d+)$/);
  if(match&&method==='PATCH'){
   const payload=JSON.parse(req.postData()||'{}'),memo=notes.find(n=>n.id===Number(match[1]));
   if(!memo)return respond(404,{error:'Memo missing'});
   Object.assign(memo,payload,{updated_at:new Date().toISOString()});
   return respond(200,{memo});
  }
  if(match&&method==='DELETE'){
   const i=notes.findIndex(n=>n.id===Number(match[1]));if(i<0)return respond(404,{error:'Missing'});
   notes.splice(i,1);return respond(200,{ok:true});
  }
  if(path==='/api/discover')return respond(200,{users:[{id:9,username:'chaos_friend',display_name:'Chaos Friend'}]});
  if(path==='/api/messages/conversations'&&method==='POST')return respond(201,{id:87});
  if(path==='/api/messages/conversations/87'&&method==='POST'){sent.push(JSON.parse(req.postData()||'{}'));return respond(201,{ok:true,id:106})}
  return respond(200,{});
 });
 try{
  const res=await page.goto(base+'/memo-pad.html',{waitUntil:'domcontentloaded'});assert.equal(res.status(),200);
  await page.locator('#memo-pad-app .memo-title').waitFor();
  await page.locator('#memo-pad-app .memo-title').fill('Big idea');
  await page.locator('#memo-pad-app .memo-body').fill('The sky is on fire. Check the rooftop entrance.');
  await page.locator('#memo-pad-app .memo-button').filter({hasText:'Save memo'}).click();
  await page.waitForFunction(()=>document.querySelector('#memo-pad-app .memo-status')?.textContent.includes('Saved privately'));
  assert.equal(notes.length,1);
  await page.locator('#memo-pad-app .memo-member-search').fill('chaos');
  await page.locator('#memo-pad-app .memo-member-result').waitFor();
  await page.locator('#memo-pad-app .memo-member-result').first().click();
  await page.locator('#memo-pad-app .memo-send-foot button').click();
  await page.waitForFunction(()=>document.querySelector('#memo-pad-app .memo-status')?.textContent.includes('Memo sent to'));
  assert.equal(sent.length,1);assert.match(sent[0].body,/📝 Big idea/);
  assert.equal(notes.length,1,'Send must preserve original private memo');
  await page.locator('#mc-memo-toggle').waitFor();
  await page.locator('#mc-memo-toggle').click();
  await page.locator('#mc-memo-host .memo-title').waitFor();
  assert.equal(await page.locator('#mc-memo-host .memo-title').inputValue(),'Big idea');
  await page.locator('#mc-memo-close').click();
  await page.locator('#mc-move').click();
  assert.ok(['bl','br','tl','tr'].includes(await page.locator('#miss-chaos-presence').getAttribute('data-dock')));
  await page.locator('#mc-minimize').click();
  assert.equal(await page.locator('#miss-chaos-presence').getAttribute('data-minimized'),'true');
  await page.locator('#mc-restore').click();
  assert.equal(await page.locator('#miss-chaos-presence').getAttribute('data-minimized'),'false');
  const sizes=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:window.innerWidth}));
  assert.ok(sizes.page<=sizes.viewport+2,'Horizontal overflow: '+JSON.stringify(sizes));
  assert.deepEqual(errors,[],name+' browser errors');
  console.log('PASS',name);
 }catch(err){failures.push(name+': '+err.message);console.error('FAIL',name,err)}
 finally{await context.close()}
}
try{await run('Memo Pad desktop 1280',1280,900);await run('Memo Pad Android 390',390,844)}
finally{await browser.close()}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1}
