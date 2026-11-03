import {chromium} from "playwright";
import assert from "node:assert/strict";
const base=process.env.BOT_TEST_BASE||"http://127.0.0.1:8765";
const official={id:"0000000000000000000000000000b001",name:"Night Shift",description:"Friendly community guide.",tagline:"Your guide to the Madhouse",category:"Community",symbol:"🌙",is_nsfw:false,owner_username:"Knightfall",system_bot:true,starters:["What can I do around Knightfall?","How do I post in the forum?","Write me a profile intro."]};
const community={id:"11111111111111111111111111111111",name:"Userbot Example",description:"A fictional community bot fixture.",is_nsfw:false,owner_username:"tester",system_bot:false};
const results=[],browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
async function run(viewport){
 const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[];
 const name=viewport.width<600?"Android 390px":"Desktop 1365px";
 page.on("pageerror",e=>errors.push(e.message));
 await page.route("https://api.ash-fall.com/**",async route=>{
  const request=route.request(),url=new URL(request.url()),path=url.pathname,query=url.searchParams.get("q")?.toLowerCase()||"";
  const headers={"content-type":"application/json","access-control-allow-origin":base,"access-control-allow-credentials":"true","access-control-allow-methods":"GET,POST,OPTIONS","access-control-allow-headers":"content-type"};
  const respond=(code,data)=>route.fulfill({status:code,headers,body:JSON.stringify(data)});
  if(request.method()==="OPTIONS")return route.fulfill({status:204,headers});
  if(path==="/api/public-bots"){
   const all=[official,community],bots=all.filter(b=>!query||[b.name,b.category,b.description].filter(Boolean).join(" ").toLowerCase().includes(query));
   return respond(200,{bots});
  }
  if(path==="/api/public-bots/"+official.id)return respond(200,{bot:official});
  if(path==="/api/public-bots/"+community.id)return respond(200,{bot:community});
  if(path==="/api/public-bots/"+official.id+"/chat"&&request.method()==="POST"){
   const posted=JSON.parse(request.postData()||"{}");
   assert.equal(typeof posted.message,"string");
   assert.ok(posted.message.length>0);
   return respond(200,{reply:"A sample model response for the browser transport test.",bot:{id:official.id,name:official.name}});
  }
  if(path==="/api/auth/me")return respond(200,{user:null});
  return respond(200,{});
 });
 try{
  const home=await page.goto(base+"/bots.html",{waitUntil:"domcontentloaded"});
  assert.equal(home.status(),200);
  await page.waitForFunction(()=>document.querySelectorAll("#public-bots .public-bot-card").length===2);
  assert.match(await page.locator("#bot-total").innerText(),/2 public bots/);
  assert.match(await page.locator("#bot-total").innerText(),/1 Knightfall originals/);
  const card=page.locator("#public-bots .public-bot-card").first();
  assert.match(await card.innerText(),/Night Shift/);
  assert.match(await card.innerText(),/KNIGHTFALL ORIGINAL/);
  await page.getByRole("button",{name:"Community-built",exact:true}).click();
  await page.waitForFunction(()=>document.querySelectorAll("#public-bots .public-bot-card").length===1);
  assert.match(await page.locator("#public-bots .public-bot-card").innerText(),/Userbot Example/);
  await page.getByRole("button",{name:"All",exact:true}).click();
  await page.locator("#bot-query").fill("Night Shift");
  await page.locator('#bot-search button[type="submit"]').click();
  await page.waitForFunction(()=>document.querySelectorAll("#public-bots .public-bot-card").length===1);
  assert.match(await page.locator("#public-bots .public-bot-card").innerText(),/Night Shift/);
  await page.locator("#bot-reset-search").click();
  await page.waitForFunction(()=>document.querySelectorAll("#public-bots .public-bot-card").length===2);
  await page.locator('#public-bots a[href*="'+official.id+'"]').click();
  await page.waitForURL("**/bot.html?id="+official.id);
  await page.waitForFunction(()=>document.querySelectorAll("#bot-starter-prompts button").length===3);
  assert.equal(await page.locator("#bot-name").innerText(),"Night Shift");
  assert.match(await page.locator("#bot-owner").innerText(),/KNIGHTFALL ORIGINAL/);
  await page.locator("#bot-starter-prompts button").first().click();
  assert.equal(await page.locator('#public-chat-form input').inputValue(),official.starters[0]);
  await page.locator('#public-chat-form button[type="submit"]').click();
  await page.waitForFunction(()=>document.querySelectorAll(".public-message").length===2);
  assert.match(await page.locator("#public-chat-log").innerText(),/sample model response/);
  const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert.ok(width.scroll<=width.viewport+2,"Unexpected horizontal overflow: "+JSON.stringify(width));
  assert.deepEqual(errors,[],"No uncaught JavaScript errors");
  console.log("PASS official bot browsing and chat transport on "+name);
 }catch(e){results.push(name+": "+e.message);console.error("FAIL",name,e)}
 finally{await context.close()}
}
try{await run({width:1365,height:900});await run({width:390,height:844})}
finally{await browser.close()}
if(results.length){console.error(results.join("\n"));process.exitCode=1}
