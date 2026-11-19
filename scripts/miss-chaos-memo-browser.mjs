import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.MEMO_TEST_BASE||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const failures=[];
async function run(name,width,height){
 const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[],sent=[],notes=[],letters=[],chats=[],journals=[],tasks=[],handoff=[],aiRequests=[];
 page.on('pageerror',err=>errors.push(err.message));
 await page.route('https://api.ash-fall.com/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname,method=req.method();
  const origin=req.headers().origin||base,headers={'access-control-allow-origin':origin,'access-control-allow-credentials':'true','access-control-allow-methods':'GET,POST,PATCH,DELETE,OPTIONS','access-control-allow-headers':'content-type','content-type':'application/json'};
  const respond=async(status,data)=>route.fulfill({status,headers,body:JSON.stringify(data)});
  if(method==='OPTIONS')return route.fulfill({status:204,headers});
  if(path==='/api/auth/me')return respond(200,{user:{id:7,username:'memo_tester',role:'god'}});
  if(path==='/api/chaos/modes')return respond(200,{modes:[{id:'owner',label:'Osiris · Private Miss Chaos',full_chat:'/miss-chaos.html?companion=owner'}],permissions:{can_admin:true}});
  if(path==='/api/chaos/conversations'&&method==='POST')return respond(201,{conversation:{id:'testchat1'}});
  if(path==='/api/chaos/chat'&&method==='POST'){
   aiRequests.push(JSON.parse(req.postData()||'{}'));
   return respond(200,{reply:'Check the root cause, reproduce the issue, inspect the active code, and verify the actual fix.'});
  }
  if(path==='/api/die-ary/entries'&&method==='POST'){journals.push(JSON.parse(req.postData()||'{}'));return respond(201,{entry:{id:journals.length}});}
  if(path==='/api/ai-handoff/tasks'&&method==='POST'){tasks.push(JSON.parse(req.postData()||'{}'));return respond(201,{task:{id:tasks.length}});}
  if(path==='/api/ai-handoff/notes'&&method==='POST'){handoff.push(JSON.parse(req.postData()||'{}'));return respond(201,{note:{id:handoff.length}});}
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
  await page.locator('#memo-pad-app [data-publish-destination="journal"]').click();
  await page.waitForFunction(()=>document.querySelector('#memo-pad-app .memo-status')?.textContent.includes('private Die-ary'));
  assert.equal(journals.length,1);assert.equal(journals[0].title,'Big idea');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#memo-pad-app [data-publish-destination="task"]').click();
  await page.waitForFunction(()=>document.querySelector('#memo-pad-app .memo-status')?.textContent.includes('shared task list'));
  assert.equal(tasks.length,1);assert.equal(tasks[0].priority,'normal');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#memo-pad-app [data-publish-destination="flames"]').click();
  await page.waitForFunction(()=>document.querySelector('#memo-pad-app .memo-status')?.textContent.includes('Between the Flames'));
  assert.equal(handoff.length,1);assert.equal(handoff[0].category,'update');
  assert.equal(notes.length,1,'Publishing must preserve the original private memo');
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
  // The floating controls must be visible by default on mobile AND desktop.
  await page.locator('#miss-chaos-presence[data-dock-ready="true"]').waitFor();
  assert.equal(await page.locator('#miss-chaos-presence').getAttribute('data-minimized'),'false');
  if(await page.locator('#miss-chaos-presence').getAttribute('data-minimized')==='true'){
    await page.locator('#mc-restore').click();
    await page.waitForFunction(()=>document.querySelector('#miss-chaos-presence')?.dataset.minimized==='false');
  }
  assert.equal(await page.locator('#mc-restore').isHidden(),true,'Restore tab must hide after expanding the toolbar');
  await page.locator('#mc-private-switch').waitFor({state:'visible'});
  await page.locator('#mc-private-switch').click();
  await page.waitForFunction(()=>document.querySelector('#miss-chaos-presence')?.dataset.assistantMode==='owner');
  await page.locator('#mc-private-switch').click();
  await page.waitForFunction(()=>document.querySelector('#miss-chaos-presence')?.dataset.assistantMode==='standard');
  await page.locator('#mc-close').click();
  await page.locator('#miss-chaos-launcher').click();
  await page.locator('#mc-quick-memo').click();
  assert.equal(await page.locator('#mc-memo-panel').isVisible(),true,'Chat header must open the floating Memo Pad');
  await page.locator('#mc-memo-close').click();
  await page.locator('#mc-memo-toggle').waitFor();
  await page.locator('#mc-memo-toggle').click();
  await page.locator('#mc-memo-host .memo-title').waitFor();
  await page.waitForFunction(()=>document.querySelector('#mc-memo-host .memo-status')?.textContent.includes('Memos synced'));
  assert.equal(await page.locator('#mc-memo-host .memo-title').inputValue(),'Big idea');
  assert.equal(await page.locator('#mc-memo-host [data-tab="chat"]').count(),1);
  assert.equal(await page.locator('#mc-memo-host [data-tab="inbox"]').count(),1);
  await page.locator('#mc-memo-close').click();
  await page.locator('#miss-chaos-launcher').click();
  await page.locator('#mc-field-kit .mc-field-kit-chip').first().waitFor();
  assert.equal(await page.locator('#mc-field-kit .mc-field-kit-chip').filter({hasText:'𓂀 Mission'}).count(),0,
    'Standard users must not see owner mission prompts');
  await page.locator('#mc-input').fill('Preserve my original draft');
  await page.locator('#mc-field-kit .mc-field-kit-chip').filter({hasText:'⌘ Debug'}).click();
  assert.match(await page.locator('#mc-input').inputValue(),/^Preserve my original draft\\n\\nHelp me debug/);
  assert.equal(aiRequests.length,0,'Quick tools only prepare drafts; they must never auto-send');
  await page.locator('#mc-send').click();
  await page.locator('#mc-reply-actions,.mc-reply-actions').first().waitFor();
  assert.equal(aiRequests.length,1);
  assert.match(await page.locator('.mc-bubble.assistant').last().innerText(),/Check the root cause/);
  await page.locator('.mc-reply-actions button').filter({hasText:'Save memo'}).last().click();
  await page.waitForFunction(()=>document.querySelector('#mc-field-kit-status')?.textContent.includes('Saved privately to Memo Pad'));
  assert.equal(notes.length,2,'Saving a reply must create a private memo');
  assert.match(notes[0].title,/Miss Chaos/);
  assert.match(notes[0].body,/Check the root cause/);
  await page.locator('.mc-reply-actions button').filter({hasText:'Open pad'}).last().click();
  assert.equal(await page.locator('#mc-memo-panel').isVisible(),true);
  await page.locator('#mc-memo-close').click();
  await page.locator('#mc-move').click();
  assert.ok(['bl','br','tl','tr'].includes(await page.locator('#miss-chaos-presence').getAttribute('data-dock')));
  await page.locator('#mc-minimize').click();
  assert.equal(await page.locator('#miss-chaos-presence').getAttribute('data-minimized'),'true');
  await page.locator('#mc-restore').click();
  assert.equal(await page.locator('#miss-chaos-presence').getAttribute('data-minimized'),'false');
  const sizes=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:window.innerWidth}));
  assert.ok(sizes.page<=sizes.viewport+2,'Horizontal overflow: '+JSON.stringify(sizes));
  // Crucible: real mobile + desktop workbench, state isolation and no auto-send.
  const creatorPage=await page.goto(base+'/chaos-crucible.html',{waitUntil:'domcontentloaded'});
  assert.equal(creatorPage.status(),200);
  await page.locator('#crucible-name').fill('My original little imp');
  await page.locator('#crucible-goal').fill('Make a readable character mascot for the arcade');
  await page.waitForFunction(()=>document.querySelector('#crucible-preview')?.textContent.includes('My original little imp'));
  await page.locator('.crucible-type[data-kind="craft"]').click();
  await page.locator('#crucible-name').fill('Pattern prototype');
  await page.locator('#crucible-goal').fill('Produce a measured craft cut list');
  await page.locator('.crucible-type[data-kind="character"]').click();
  assert.equal(await page.locator('#crucible-name').inputValue(),'My original little imp',
    'Switching disciplines must not destroy an unfinished creator draft');
  const briefText=await page.locator('#crucible-preview').textContent();
  assert.match(briefText,/Proposed workflow \(not yet executed\)/);
  await page.locator('#crucible-save').click();
  await page.waitForFunction(()=>document.querySelector('#crucible-status')?.textContent.includes('Saved privately'));
  assert.equal(notes.length,3,'Crucible save must create exactly one authenticated private memo');
  assert.match(notes[0].body,/My original little imp/);
  const kitDownload=page.waitForEvent('download');
  await page.locator('#crucible-export-kit').click();
  const kitFile=await kitDownload;
  assert.match(kitFile.suggestedFilename(),/\.crucible\.json$/);
  const beforeHandoff=aiRequests.length;
  await page.locator('#miss-chaos-presence[data-dock-ready="true"]').waitFor();
  await page.locator('#crucible-ask').click();
  await page.waitForFunction(()=>document.querySelector('#miss-chaos-window')&&!document.querySelector('#miss-chaos-window').hidden);
  assert.match(await page.locator('#mc-input').inputValue(),/Help me advance this Crucible project/);
  assert.equal(aiRequests.length,beforeHandoff,'Crucible must never auto-send the draft to the AI');
  const imported={
    schema:'knightfall.miss-chaos.crucible.v1',
    project:{kind:'tattoo',title:'Imported stencil',goal:'Create an original measured blackwork piece',
      known:'Reference is user-owned',first:'Shoulder, 4 inches wide',second:'Blackwork with negative space',
      constraints:'No unlicensed reference artwork'}
  };
  await page.locator('#crucible-import-file').setInputFiles({
    name:'sample.crucible.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(imported))
  });
  await page.waitForFunction(()=>document.querySelector('#crucible-name')?.value==='Imported stencil');
  assert.equal(await page.locator('.crucible-type[data-kind="tattoo"]').getAttribute('aria-pressed'),'true');
  assert.match(await page.locator('#crucible-preview').textContent(),/Shoulder, 4 inches wide/);
  // Explicit device shelf should retain milestones and evidence across a reload.
  assert.equal(await page.locator('#crucible-proof-notes').inputValue(),'',
    'Legacy kit imports must not invent evidence');
  await page.locator('#crucible-proof-notes').fill('Stencil reviewed; long-term readability still unverified');
  await page.locator('#crucible-steps input[type="checkbox"]').first().check();
  await page.locator('#crucible-shelf-save').click();
  await page.waitForFunction(()=>document.querySelector('#crucible-shelf-status')?.textContent.includes('Saved as a new device-only copy'));
  assert.match(await page.locator('#crucible-shelf-list').innerText(),/Imported stencil/);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#crucible-shelf-list').getByRole('button',{name:/Resume Imported stencil/}).click();
  assert.equal(await page.locator('#crucible-name').inputValue(),'Imported stencil');
  assert.match(await page.locator('#crucible-proof-notes').inputValue(),/Stencil reviewed/);
  assert.equal(await page.locator('#crucible-steps input[type="checkbox"]').first().isChecked(),true);
  assert.match(await page.locator('#crucible-milestone-readout').textContent(),/1\/5/);
  const creatorSize=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert.ok(creatorSize.page<=creatorSize.viewport+2,'Crucible horizontal overflow: '+JSON.stringify(creatorSize));
  assert.deepEqual(errors,[],name+' browser errors');
  console.log('PASS',name);
 }catch(err){failures.push(name+': '+err.message);console.error('FAIL',name,err)}
 finally{await context.close()}
}
try{await run('Memo Pad desktop 1280',1280,900);await run('Memo Pad Android 390',390,844)}
finally{await browser.close()}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1}
