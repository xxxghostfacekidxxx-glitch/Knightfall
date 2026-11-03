import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.MEMO_TEST_BASE||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const failures=[];
async function run(name,width,height){
 const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[],sent=[],notes=[],letters=[],chats=[];
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
  if(path==='/api/memo-mail'&&method==='POST'){
   const payload=JSON.parse(req.postData()||'{}'),note=notes.find(n=>n.id===Number(payload.memo_id));
   const row={id:letters.length+1,subject:note.title,body:note.body,other_username:payload.username,created_at:new Date().toISOString(),read_at:null};
   letters.unshift(row);sent.push(payload);return respond(201,{id:row.id,recipient:payload.username,ok:true});
  }
  if(path==='/api/memo-mail'&&method==='GET'){
   const box=new URL(req.url()).searchParams.get('box')||'inbox';
   return respond(200,{box,mail:box==='sent'?letters:[],unread:0});
  }
  if(path.match(/^\/api\/memo-mail\/\d+\/read$/)&&method==='POST')return respond(200,{ok:true,read_at:new Date().toISOString()});
  if(path==='/api/messages/conversations'&&method==='GET')return respond(200,{conversations:[{id:87,kind:'direct',other_username:'chaos_friend',last_body:chats.at(-1)?.body||'',unread_count:0}]});
  if(path==='/api/messages/conversations'&&method==='POST')return respond(201,{id:87});
  if(path==='/api/messages/conversations/87'&&method==='GET')return respond(200,{messages:chats.map((c,i)=>({id:i+1,sender_id:7,body:c.body}))});
  if(path==='/api/messages/conversations/87'&&method==='POST'){chats.push(JSON.parse(req.postData()||'{}'));return respond(201,{ok:true,id:106})}
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
  await page.waitForFunction(()=>document.querySelector('#memo-pad-app .memo-status')?.textContent.includes('Memo delivered to'));
  assert.equal(sent.length,1);assert.equal(sent[0].memo_id,notes[0].id);
  assert.equal(letters[0].subject,'Big idea');
  await page.locator('#memo-pad-app [data-tab="inbox"]').click();
  await page.locator('#memo-pad-app .memo-mail-item').first().waitFor();
  assert.match(await page.locator('#memo-pad-app .memo-mail-detail').innerText(),/Big idea/);
  await page.locator('#memo-pad-app [data-tab="chat"]').click();
  await page.locator('#memo-pad-app .memo-chat-contact').first().waitFor();
  await page.locator('#memo-pad-app .memo-chat-contact').first().click();
  await page.locator('#memo-pad-app .memo-chat-text').fill('This is a live chat, not a memo.');
  await page.locator('#memo-pad-app .memo-chat-form button[type="submit"]').click();
  await page.waitForFunction(()=>document.querySelector('#memo-pad-app .memo-chat-messages')?.textContent.includes('This is a live chat'));
  assert.equal(chats.length,1);
  assert.equal(letters.length,1,'Sending a chat message must not create another memo');
  assert.equal(notes.length,1,'Send must preserve original private memo');
  await page.locator('#mc-memo-toggle').waitFor();
  await page.locator('#mc-memo-toggle').click();
  await page.locator('#mc-memo-host .memo-title').waitFor();
  await page.waitForFunction(()=>document.querySelector('#mc-memo-host .memo-status')?.textContent.includes('Memos synced'));
  assert.equal(await page.locator('#mc-memo-host .memo-title').inputValue(),'Big idea');
  assert.equal(await page.locator('#mc-memo-host [data-tab="chat"]').count(),1);
  assert.equal(await page.locator('#mc-memo-host [data-tab="inbox"]').count(),1);
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
