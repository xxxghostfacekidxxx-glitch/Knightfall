// Browser smoke: owner vs visitor profile, mobile navigation and member themes.
// Starts against the local static server used by the Knightfall Playwright CI.
import assert from "node:assert/strict";
import {chromium} from "playwright";

const base=process.env.PROFILE_TEST_BASE||"http://127.0.0.1:8765";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const failures=[];
const member={
  id:77,username:"nebula",display_name:"Nebula Maker",role:"member",
  public_title:"Digital Creator",bio:"Building strange things with good people.",
  tagline:"Make the impossible playable.",status_message:"Making art tonight",
  avatar_url:"",cover_url:"",location:"Iowa",pronouns:"they/them",
  website_url:"https://example.com",profile_theme:"spectral",accent_color:"#c59cff",
  created_at:"2026-10-15T12:00:00Z",is_online:true,
  show_activity:1,followers:12,following_count:5,friend_count:3,
  thread_count:2,post_count:7,credits:950
};
const activity={
  user:member,
  threads:[{id:3,title:"Building a miniature starship",category_name:"Art & Tattoos",created_at:"2026-11-01T13:00:00Z"}],
  posts:[{thread_id:3,thread_title:"Building a miniature starship",body:"Version two is almost ready",created_at:"2026-11-03T13:00:00Z"}],
  profile_layout:null,birth_chart:null
};
async function scenario(title,viewport,own){
  const context=await browser.newContext({viewport});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  page.on("dialog",dialog=>dialog.accept());
  await page.route("https://api.ash-fall.com/**",async route=>{
    const request=route.request(),url=new URL(request.url()),path=url.pathname;
    const headers={
      "content-type":"application/json",
      "access-control-allow-origin":new URL(base).origin,
      "access-control-allow-credentials":"true",
      "access-control-allow-methods":"GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "access-control-allow-headers":"content-type"
    };
    const answer=(status,data)=>route.fulfill({status,headers,body:JSON.stringify(data)});
    if(request.method()==="OPTIONS")return route.fulfill({status:204,headers});
    if(path==="/api/auth/me")return answer(200,{user:own?member:{id:88,username:"outsider",role:"member"}});
    if(path==="/api/users/nebula")return answer(200,activity);
    if(path==="/api/avatars/profile/nebula")return answer(200,{avatar:null});
    if(path==="/api/social/activity")return answer(200,{activities:[{id:1,body:"Trying a new drawing style",created_at:"2026-11-08T14:00:00Z",visibility:"public"}]});
    if(path==="/api/profile/photos")return answer(200,{photos:[]});
    if(path==="/api/profile/links")return answer(200,{links:[],limit:8});
    if(path==="/api/mascot-pets/profile/nebula")return answer(200,{pets:[],own_profile:own,badges:[]});
    if(path==="/api/friends")return answer(200,{friends:[],incoming:[],outgoing:[]});
    if(path==="/api/economy")return answer(200,{balance:950,daily_ready:false,online_ready:false,quest_ready:false,quest_played:false,online_next_at:null});
    if(path==="/api/media-library/albums")return answer(200,{albums:[]});
    if(path==="/api/media-library/favorites")return answer(200,{photos:[]});
    return answer(404,{error:"Not part of browser fixture"});
  });
  try{
    await page.goto(base+"/profile.html?username=nebula",{waitUntil:"domcontentloaded"});
    await page.locator("#profile-about").waitFor({timeout:12000});
    assert.equal(await page.locator("#profile-about .bio").textContent(),member.bio);
    assert.match(await page.locator("#profile-about").textContent(),/Iowa/);
    assert.equal(await page.locator(".profile-title-badge").first().textContent(),"Digital Creator");
    const nav=page.locator("#profile-quick-links");
    assert.ok(await nav.isVisible(),"Quick links visible");
    if(own){
      assert.ok(await nav.locator('a[href="/profile-edit.html"]').isVisible());
      assert.equal(await nav.locator('a[href*="mascot-room.html?user="]').count(),0);
    }else{
      assert.equal(await nav.locator('a[href="/profile-edit.html"]').count(),0);
      assert.ok(await nav.locator('a[href="/mascot-room.html?user=nebula"]').isVisible());
      assert.ok(await page.locator('#friend').isVisible());
    }
    await page.locator('.profile-activity-filters [data-view="threads"]').click();
    assert.equal(await page.locator(".profile-activity-deck").getAttribute("data-view"),"threads");
    assert.ok(await page.locator(".profile-activity-deck>section").first().isVisible());
    assert.equal(await page.locator(".profile-activity-deck>section").nth(1).isVisible(),false);
    await page.locator('.profile-activity-filters [data-view="replies"]').click();
    assert.equal(await page.locator(".profile-activity-deck>section").first().isVisible(),false);
    assert.ok(await page.locator(".profile-activity-deck>section").nth(1).isVisible());
    await page.locator('.profile-activity-filters [data-view="all"]').click();
    assert.equal(await page.locator(".profile-activity-deck [data-view='all']").getAttribute("aria-pressed"),"true");
    const theme=await page.locator("#profile").evaluate(el=>getComputedStyle(el).getPropertyValue("--pf-surface").trim());
    assert.equal(theme,"#211b37","Member-selected spectral surface preserved");
    const widths=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:innerWidth}));
    assert.ok(widths.document<=widths.viewport+2,"Horizontal overflow: "+JSON.stringify(widths));
    assert.deepEqual(errors,[],"Uncaught browser exceptions");
    console.log("PASS",title);
  }catch(error){failures.push(title+": "+error.message);console.error("FAIL",title,error);}
  finally{await context.close()}
}
try{
  for(const [name,viewport] of [["desktop",{width:1365,height:900}],["Android",{width:390,height:844}]]){
    await scenario("Profile owner "+name,viewport,true);
    await scenario("Profile visitor "+name,viewport,false);
  }
}finally{await browser.close()}
if(failures.length){console.error(failures.join("\n"));process.exitCode=1}
