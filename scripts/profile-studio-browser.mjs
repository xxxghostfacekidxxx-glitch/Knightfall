import {chromium} from "playwright";
import assert from "node:assert/strict";
const base=process.env.PROFILE_TEST_BASE||"http://127.0.0.1:8765";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const failures=[];
const blankUser={
 id:71,username:"profile_tester",role:"member",display_name:"Dusk Collector",
 bio:"A small story.",avatar_url:"",cover_url:"",website_url:"",
 location:"",pronouns:"",accent_color:"#ff55d8",profile_theme:"ember",
 status_message:"",tagline:"",interests:"",favorite_games:"",favorite_music:"",
 favorite_quote:"",profile_visibility:"public",show_activity:1
};
async function scenario(name,viewport){
 const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[];
 const savedProfiles=[],savedLayouts=[],savedLinks=[],uploads=[],gallery=[];
 const chartWrites=[];
 let birthChart=null,birthVisible=false;
 let profileLinks=[];
 let user={...blankUser},layout=[{id:"favorites",visible:true},{id:"activity",visible:true},{id:"updates",visible:true},{id:"photos",visible:true}];
 page.on("pageerror",e=>errors.push(e.message));
 page.on("dialog",d=>d.accept());
 await page.route("https://api.ash-fall.com/**",async route=>{
  const r=route.request(),url=new URL(r.url()),method=r.method(),path=url.pathname;
  const headers={"content-type":"application/json","access-control-allow-origin":r.headers().origin||base,"access-control-allow-credentials":"true",
   "access-control-allow-methods":"GET,PUT,POST,OPTIONS,DELETE","access-control-allow-headers":"content-type"};
  const respond=(status,body)=>route.fulfill({status,headers,body:JSON.stringify(body)});
  if(method==="OPTIONS")return route.fulfill({status:204,headers});
  if(path==="/api/auth/me")return respond(200,{user});
  if(path==="/api/profile/layout"&&method==="GET")return respond(200,{layout});
  if(path==="/api/profile/layout"&&method==="PUT"){
   const d=JSON.parse(r.postData()||"{}");layout=d.layout;savedLayouts.push(d);return respond(200,{ok:true,layout});
  }
  if(path==="/api/profile/links"&&method==="GET")return respond(200,{links:profileLinks,limit:8});
  if(path==="/api/profile/links"&&method==="PUT"){
   const payload=JSON.parse(r.postData()||"{}");profileLinks=payload.links;savedLinks.push(payload);
   return respond(200,{ok:true,links:profileLinks,limit:8});
  }
  if(path==="/api/profile/birth-chart"){
   if(method==="GET")return respond(200,{chart:birthChart,visible:birthVisible});
   if(method==="DELETE"){birthChart=null;birthVisible=false;chartWrites.push({method});return respond(200,{ok:true});}
   if(method==="PUT"){
    const payload=JSON.parse(r.postData()||"{}");chartWrites.push({method,payload});
    if(Object.keys(payload).length===1&&typeof payload.visible==="boolean"){
      birthVisible=payload.visible;
      return respond(200,{chart:birthChart,visible:birthVisible});
    }
    birthVisible=payload.visible===true;
    birthChart={
      zodiac:"tropical",time_precision:payload.time_unknown===true?"unknown":"provided",
      house_system:payload.time_unknown?"Not calculated":"Equal houses (Ascendant-based)",
      ascendant_sign:payload.time_unknown?null:"Cancer",
      ascendant_degree:payload.time_unknown?null:13,
      bodies:{
       Sun:{sign:"Aries",degree:11,retrograde:false},
       Moon:{sign:"Libra",degree:13,retrograde:false},
       Mercury:{sign:"Taurus",degree:7,retrograde:true},
       Venus:{sign:"Gemini",degree:15,retrograde:false},
       Mars:{sign:"Leo",degree:17,retrograde:false},
       Jupiter:{sign:"Sagittarius",degree:23,retrograde:false},
       Saturn:{sign:"Capricorn",degree:5,retrograde:false}
      },
      house_placements:payload.time_unknown?null:{Sun:10,Moon:4,Mercury:11,Venus:12,Mars:2,Jupiter:6,Saturn:7}
    };
    return respond(200,{chart:birthChart,visible:birthVisible});
   }
  }
  if(path==="/api/profile"&&method==="PUT"){
   const values=JSON.parse(r.postData()||"{}");
   savedProfiles.push(values);user={...user,...values,show_activity:values.show_activity?1:0};return respond(200,{user});
  }
  if(path==="/api/profile/photos"&&method==="GET")return respond(200,{photos:gallery});
  if(path==="/api/profile/photos"&&method==="POST"){
   const raw=r.postDataBuffer(),str=raw?.toString("latin1")||"";
   const kind=str.includes('name="kind"\r\n\r\navatar')?"avatar":"gallery";
   uploads.push(kind);
   const id=uploads.length+800;
   const photo={id,url:"https://api.ash-fall.com/api/profile-media/"+id,kind,caption:"Uploaded photo",created_at:new Date().toISOString()};
   if(kind==="gallery")gallery.unshift(photo);
   return respond(201,{photo});
  }
  if(path.match(/^\/api\/profile\/photos\/\d+$/)&&method==="PATCH"){
   const id=Number(path.split("/").pop()),photo=gallery.find(p=>p.id===id);
   if(!photo)return respond(404,{error:"Photo missing"});
   const changes=JSON.parse(r.postData()||"{}");photo.caption=String(changes.caption||"");
   return respond(200,{photo});
  }
  if(path.match(/^\/api\/profile\/photos\/\d+$/)&&method==="DELETE"){
   const id=Number(path.split("/").pop()),ix=gallery.findIndex(p=>p.id===id);
   if(ix<0)return respond(404,{error:"Photo missing"});
   const [photo]=gallery.splice(ix,1);
   if(user.cover_url===photo.url)user.cover_url="";
   return respond(200,{ok:true});
  }
  if(path==="/api/site-settings")return respond(200,{settings:{site_name:"Knightfall",feature_miss_chaos:"false"}});
  return respond(200,{});
 });
 try{
  const loaded=await page.goto(base+"/profile-edit.html",{waitUntil:"domcontentloaded"});
  assert.equal(loaded.status(),200);
  await page.waitForFunction(()=>document.querySelector("#studio-save-indicator")?.dataset.state==="saved");
  await page.locator('#form [name="display_name"]').fill("Neon Archivist");
  await page.locator('#form [name="profile_theme"]').selectOption("toxic");
  await page.locator('[data-layout-preset="showcase"]').click();
  assert.match(await page.locator("#studio-save-indicator").innerText(),/Unsaved/);
  assert.equal(await page.locator("#studio-preview-name").innerText(),"Neon Archivist");
  assert.equal(await page.locator("#studio-preview-card").getAttribute("data-theme"),"toxic");
  await page.locator('#form button[type="submit"]').click();
  await page.waitForFunction(()=>document.querySelector("#studio-save-indicator")?.dataset.state==="saved");
  assert.equal(savedProfiles.length,1,"Profile update request must be sent once");
  assert.equal(savedLayouts.length,1,"Main Save profile should save pending layout");
  assert.equal(user.display_name,"Neon Archivist");
  assert.match(page.url(),/\/profile-edit\.html$/,"Save must not throw user out of studio");
  await page.locator('#form [name="bio"]').fill("A draft that should not publish.");
  await page.locator("#studio-discard").click();
  assert.equal(await page.locator('#form [name="bio"]').inputValue(),"A small story.");
  assert.equal(savedProfiles.length,1,"Discard must not call backend");
  const png=await page.evaluate(()=>{
   const c=document.createElement("canvas");c.width=660;c.height=420;
   const ctx=c.getContext("2d");ctx.fillStyle="#ff55d8";ctx.fillRect(0,0,660,420);
   ctx.fillStyle="#c6ff45";ctx.fillRect(240,30,90,360);
   return c.toDataURL("image/png").split(",")[1];
  });
  await page.locator("#cover-file").setInputFiles({name:"skyline.png",mimeType:"image/png",buffer:Buffer.from(png,"base64")});
  await page.waitForFunction(()=>!!document.querySelector("#cover-file")?._compressedBlob);
  await page.locator("#studio-cover-crop").selectOption("top");
  await page.waitForFunction(()=>!!document.querySelector("#cover-file")?._compressedBlob&&document.querySelector("#status")?.textContent.includes("ready"));
  assert.ok(await page.locator("#cover-upload-preview").isVisible());
  await page.locator('#form button[type="submit"]').click();
  await page.waitForFunction(()=>document.querySelector("#studio-save-indicator")?.dataset.state==="saved");
  assert.ok(uploads.includes("gallery"),"Cover crop must upload real image pixels");
  assert.match(user.cover_url,/^https:\/\/api\.ash-fall\.com\/api\/profile-media\/\d+$/);
  assert.equal(savedProfiles.length,2);
  assert.equal(savedLayouts.length,1,"Save should not rewrite unchanged layout");
  await page.locator("#avatar-file").setInputFiles({name:"avatar.png",mimeType:"image/png",buffer:Buffer.from(png,"base64")});
  await page.waitForFunction(()=>document.querySelector("#avatar_url")?.value?.startsWith?.("data:image")||
   document.querySelector('#form [name="avatar_url"]')?.value?.startsWith("data:image/"));
  await page.locator('#form button[type="submit"]').click();
  await page.waitForFunction(()=>document.querySelector("#studio-save-indicator")?.dataset.state==="saved");
  assert.ok(uploads.includes("avatar"),"Avatar upload must be preserved");
  // Gallery management is independent of the main profile save.
  await page.locator("#studio-photo-file").setInputFiles({name:"memory.png",mimeType:"image/png",buffer:Buffer.from(png,"base64")});
  await page.locator("#studio-photo-caption").fill("The Neon Roof");
  await page.locator('#studio-photo-upload button[type="submit"]').click();
  await page.waitForFunction(()=>document.querySelector("#studio-photo-count")?.textContent.includes("2 / 60"));
  assert.equal(gallery.length,2);
  // Metadata-only editing must leave the gallery photo and cover image IDs unchanged.
  await page.locator('#studio-photo-grid .studio-photo-card').first().locator('button').filter({hasText:'Caption'}).click();
  await page.locator('#studio-photo-grid .studio-photo-card').first().locator('.studio-photo-caption-input').fill('Updated skyline photograph');
  await page.locator('#studio-photo-grid .studio-photo-card').first().locator('button').filter({hasText:'Save caption'}).click();
  await page.waitForFunction(()=>document.querySelector('#studio-photo-grid .studio-photo-card .studio-photo-details')?.textContent.includes('Updated skyline photograph'));
  await page.locator('#studio-photo-grid .studio-photo-card').first().locator('.studio-photo-view-button').click();
  await page.waitForFunction(()=>document.querySelector('#studio-photo-viewer')?.open===true);
  assert.match(await page.locator('#studio-photo-viewer').innerText(),/Updated skyline photograph/);
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>document.querySelector('#studio-photo-viewer')?.open===false);
  assert.equal(gallery[0].caption,'Updated skyline photograph');
  assert.equal(gallery.length,2,'Editing captions must not add new photos');
  const coverChoice=gallery[0];
  await page.locator('#studio-photo-grid .studio-photo-card').first().locator('button').filter({hasText:'Use as cover'}).click();
  assert.equal(await page.locator('#form [name="cover_url"]').inputValue(),coverChoice.url);
  await page.locator('#form button[type="submit"]').click();
  await page.waitForFunction(()=>document.querySelector("#studio-save-indicator")?.dataset.state==="saved");
  assert.equal(user.cover_url,coverChoice.url);
  await page.locator('#studio-photo-grid .studio-photo-card').first().locator('button').filter({hasText:'Delete'}).click();
  await page.waitForFunction(()=>document.querySelector("#studio-photo-count")?.textContent.includes("1 / 60"));
  assert.equal(user.cover_url,"","Deleting selected gallery cover must also clear published reference");
  assert.equal(gallery.length,1);
  await page.locator('#form [name="tagline"]').fill("I remain.");
  await page.keyboard.press("Control+s");
  await page.waitForFunction(()=>document.querySelector("#studio-save-indicator")?.dataset.state==="saved");
  assert.equal(user.tagline,"I remain.");
  // Link Hub is saved separately but coordinated with the main Save profile action.
  const beforeLinks=savedProfiles.length;
  await page.locator('[data-studio-link-template="Art portfolio"]').click();
  await page.locator('#studio-link-rows .studio-link-url').first().fill('http://example.com/unsafe');
  await page.locator('#form button[type="submit"]').click();
  assert.equal(savedProfiles.length,beforeLinks,'Unsafe links must block the entire profile save');
  assert.match(await page.locator('#studio-link-status').innerText(),/HTTPS/);
  await page.locator('#studio-link-rows .studio-link-url').first().fill('https://example.com/art');
  await page.locator('#form button[type="submit"]').click();
  await page.waitForFunction(()=>document.querySelector('#studio-save-indicator')?.dataset.state==="saved");
  assert.equal(savedProfiles.length,beforeLinks+1);
  assert.equal(savedLinks.length,1);
  assert.equal(profileLinks[0].label,'Art portfolio');
  await page.locator('[data-studio-link-template="Music"]').click();
  await page.locator('#studio-link-rows .studio-link-url').nth(1).fill('https://example.com/songs');
  await page.locator('#studio-link-rows .studio-link-row').nth(1).locator('button[title="Move link up"]').click();
  await page.locator('#studio-save-all-layout').click();
  await page.waitForFunction(()=>document.querySelector('#studio-save-indicator')?.dataset.state==="saved");
  assert.equal(profileLinks[0].label,'Music');
  assert.equal(savedLinks.length,2);
  await page.locator('#studio-link-rows .studio-link-name').first().fill('Unpublished link');
  await page.locator('#studio-discard').click();
  assert.equal(await page.locator('#studio-link-rows .studio-link-name').first().inputValue(),'Music');
  assert.equal(savedLinks.length,2,'Discard does not publish link edits');
  // Render the actual public Link Hub using the shared component and verify links stay safe.
  await page.addScriptTag({url:base+"/profile-links-view.js?v=20261103-links2"});
  const publicLinks=await page.evaluate(async()=>{
   const target=document.createElement("div");target.id="profile-link-view-smoke";document.body.append(target);
   const ready=await window.KnightfallRenderProfileLinks("profile_tester",target);
   return {ready,count:target.querySelectorAll(".profile-link-card").length,
    cards:[...target.querySelectorAll(".profile-link-card")].map(a=>({href:a.href,rel:a.rel,target:a.target,label:a.querySelector(".profile-link-label")?.textContent})),
    rawHtmlLeak:!!target.querySelector(".profile-link-card img")};
  });
  assert.equal(publicLinks.ready,true);
  assert.equal(publicLinks.count,2);
  assert.ok(publicLinks.cards.every(x=>x.href.startsWith("https://")&&x.rel.includes("noopener")&&x.target==="_blank"));
  assert.equal(publicLinks.rawHtmlLeak,false);
  // Real signed-in page UI, mocked owner-session API: date-only private lifecycle.
  await page.locator("#birth-chart-time-unknown").check();
  await page.locator("#birth-chart-date-only").fill("1994-04-15");
  await page.locator('#birth-chart-form button[type="submit"]').click();
  await page.waitForFunction(()=>document.querySelector("#birth-chart-status")?.textContent.includes("Provisional chart saved"));
  assert.equal(birthChart.time_precision,"unknown");
  assert.equal(birthVisible,false,"Chart must remain private by default");
  assert.equal(birthChart.ascendant_sign,null);
  assert.equal(await page.locator(".cosmic-house-entry").count(),0,"Unknown time must not fabricate house readings");
  const provisional=chartWrites.at(-1).payload;
  assert.equal(provisional.time_unknown,true);
  assert.equal(provisional.utc,"1994-04-15T12:00:00.000Z");
  assert.equal("latitude" in provisional,false);
  assert.equal("longitude" in provisional,false);
  await page.locator("#birth-chart-visible").check();
  await page.waitForFunction(()=>document.querySelector("#birth-chart-status")?.textContent.includes("published")||document.querySelector("#birth-chart-status")?.textContent.includes("visible"));
  assert.equal(birthVisible,true);
  await page.locator("#birth-chart-visible").uncheck();
  await page.waitForFunction(()=>document.querySelector("#birth-chart-status")?.textContent.includes("hidden")||document.querySelector("#birth-chart-status")?.textContent.includes("private"));
  assert.equal(birthVisible,false);
  await page.locator("#birth-chart-remove").click();
  await page.waitForFunction(()=>document.querySelector("#birth-chart-status")?.textContent.includes("deleted"));
  assert.equal(birthChart,null);

  // Precise-time chart with local geographic zone suggestion and 12 houses.
  await page.locator("#birth-chart-local").fill("1994-04-15T12:15");
  await page.locator("#birth-chart-city").fill("Des Moines, Iowa, USA");
  await page.evaluate(()=>{
   const sel=document.querySelector("#birth-chart-city-results");
   const opt=new Option("Des Moines, Iowa, United States","test-city");
   opt.dataset.lat="41.5868";opt.dataset.lon="-93.625";
   sel.add(opt);sel.disabled=false;sel.value="test-city";
   sel.dispatchEvent(new Event("change",{bubbles:true}));
  });
  assert.equal(await page.locator("#birth-chart-timezone").inputValue(),"America/Chicago");
  await page.locator('#birth-chart-form button[type="submit"]').click();
  await page.waitForFunction(()=>document.querySelector("#birth-chart-status")?.textContent.includes("Chart saved."));
  assert.equal(birthChart.time_precision,"provided");
  assert.equal(await page.locator(".cosmic-house-entry").count(),12);
  assert.equal(await page.locator(".cosmic-interpretation-reading").count(),0,"Planet detail remains collapsed until selected");
  await page.locator(".cosmic-focus-select").selectOption("Sun");
  assert.match(await page.locator(".cosmic-interpretation-reading").textContent(),/traditional tropical astrology/);
  assert.equal(chartWrites.at(-1).payload.utc,"1994-04-15T17:15:00.000Z");
  assert.equal(chartWrites.at(-1).payload.latitude,41.5868);
  assert.equal(chartWrites.at(-1).payload.longitude,-93.625);
  assert.equal(birthVisible,false,"Detailed chart must not auto-publish");

  const widths=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert.ok(widths.page<=widths.viewport+2,"Mobile horizontal overflow "+JSON.stringify(widths));
  assert.deepEqual(errors,[],"Uncaught browser errors");
  console.log("PASS",name);
 }catch(e){failures.push(name+": "+e.message);console.error("FAIL",name,e)}
 finally{await context.close()}
}
try{await scenario("Profile Studio desktop",{width:1365,height:900});await scenario("Profile Studio Android",{width:390,height:844})}
finally{await browser.close()}
if(failures.length){console.error(failures.join("\n"));process.exitCode=1}
