import {chromium} from "playwright";
import assert from "node:assert/strict";
const base=process.env.ARCADE_TEST_BASE||"http://127.0.0.1:8765";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const failures=[];
async function scenario(name,viewport,fn){
 const page=await browser.newPage({viewport});const errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 try{await fn(page);assert.deepEqual(errors,[],name+" browser errors");console.log("PASS",name)}
 catch(e){failures.push(name+": "+e.message);console.error("FAIL",name,e)}
 finally{await page.close()}
}
await scenario("Roads of Cinder desktop four-player flow",{width:1280,height:850},async page=>{
 await page.goto(base+"/arcade/hosted/roads-of-cinder/index.html",{waitUntil:"domcontentloaded"});
 await page.waitForSelector("#board .tile",{timeout:10000});
 assert.ok(await page.locator("#board .tile").count()>=60);
 await page.selectOption("#player-count","4");await page.fill('#player-names input:first-child',"Rook");await page.click("#new-game");
 assert.equal(await page.locator("#players .player").count(),4);
 assert.match(await page.locator("#players .player:first-child strong").innerText(),/Rook/);
 for(let i=0;i<4;i++){await page.locator("#choice-list button").first().click();await page.locator("#choice-list button").first().click()}
 assert.equal(await page.locator("#spin").isDisabled(),false);
 await page.click("#spin");await page.waitForTimeout(1100);
 assert.ok((await page.locator("#spin-result").innerText()).match(/^\d+$/));
 await page.reload({waitUntil:"domcontentloaded"});
 assert.equal(await page.locator("#players .player").count(),4);
 assert.match(await page.locator("#players .player:first-child strong").innerText(),/Rook/);
});
await scenario("Roads of Cinder mobile controls before board",{width:390,height:844},async page=>{
 await page.goto(base+"/arcade/hosted/roads-of-cinder/index.html",{waitUntil:"domcontentloaded"});
 await page.waitForSelector("#board .tile");
 const order=await page.evaluate(()=>{
  const a=document.querySelector(".board-panel").getBoundingClientRect();
  const b=document.querySelector(".side").getBoundingClientRect();return{boardY:a.top,controlsY:b.top,overflow:document.documentElement.scrollWidth>innerWidth+2}});
 assert.ok(order.controlsY<order.boardY,"mobile turn controls should be above the board");
 assert.equal(order.overflow,false,"no horizontal scrolling");
});
await scenario("Not Dead Yet desktop start, shooting and reload",{width:1280,height:850},async page=>{
 await page.goto(base+"/not-dead-yet.html",{waitUntil:"domcontentloaded"});
 await page.waitForSelector("#start",{timeout:10000});
 await page.selectOption("#mode","campaign");await page.click("#start");
 await page.waitForTimeout(180);
 assert.ok(await page.locator("#campaign-stage").isVisible(),"campaign objectives visible");
 assert.ok((await page.locator("#ammo").innerText()).includes("/"));
 await page.locator("#game").click({position:{x:500,y:260},force:true});
 await page.keyboard.press("r");
 await page.waitForTimeout(60);
 assert.ok((await page.locator("#ammo").innerText()).includes("RELOADING"),"reload feedback");
 await page.click("#pause");assert.match(await page.locator("#pause").innerText(),/Resume/);
});
await scenario("Not Dead Yet mobile combat controls",{width:390,height:844},async page=>{
 await page.goto(base+"/not-dead-yet.html",{waitUntil:"domcontentloaded"});
 await page.waitForSelector("#start",{timeout:10000});
 await page.selectOption("#mode","campaign");await page.click("#start");
 assert.ok(await page.locator("#touch-reload").isVisible(),"reload control visible");
 await page.locator("#touch-fire").dispatchEvent("pointerdown",{pointerId:1,button:0,pointerType:"touch",clientX:120,clientY:400});
 await page.waitForTimeout(150);
 assert.ok((await page.locator("#ammo").innerText()).includes("/"));
});

await scenario("Not Dead Yet complete campaign, no boss softlock, persistent resume",{width:1280,height:850},async page=>{
 await page.route("**/not-dead-yet.html",async route=>{
  const response=await route.fetch(),html=await response.text();
  const anchor="updateResumeButton();draw();";
  assert.ok(html.includes(anchor),"debug probe insertion point exists");
  const probe=`window.__zombieProbe={
    state:()=>({stage:campaignStage,gate:stageGate,kills,stageKillStart,finished:ended,bossCount:zombies.filter(z=>z.type==='boss'&&!z.dead).length,hp:player.hp,ammo:{...ammo},reserve:{...reserveAmmo}}),
    gate:()=>{kills=stageKillStart+5;player.x=stageGate-38;player.y=ground-player.h;player.vy=0;update(.016);},
    lose:()=>{player.hp=0;finish(false);},
    bossBehind:()=>{const z=zombies.find(z=>z.type==='boss');if(z)z.x=player.x-1300;update(.016);},
    bossKill:()=>{const z=zombies.find(z=>z.type==='boss');if(!z)throw Error('boss missing');z.x=player.x+140;z.hp=1;bullets.push({x:z.x+20,y:z.y+20,vx:0,vy:0,life:1,damage:2,weapon:'pistol'});update(.016);}
  };`;
  await route.fulfill({response,body:html.replace(anchor,probe+anchor)});
 });
 await page.goto(base+"/not-dead-yet.html",{waitUntil:"domcontentloaded"});
 await page.selectOption("#mode","campaign");await page.click("#start");
 assert.equal((await page.evaluate(()=>window.__zombieProbe.state())).stage,0);
 await page.evaluate(()=>window.__zombieProbe.gate());
 assert.equal((await page.evaluate(()=>window.__zombieProbe.state())).stage,1);
 const stored=await page.evaluate(()=>localStorage.getItem("af-zombie-campaign-checkpoint:v1"));
 assert.ok(stored,"extraction checkpoint should persist after gate");
 await page.reload({waitUntil:"domcontentloaded"});
 assert.equal(await page.locator("#resume-checkpoint").isDisabled(),false,"resume button enabled after reload");
 await page.click("#resume-checkpoint");
 assert.equal((await page.evaluate(()=>window.__zombieProbe.state())).stage,1);
 await page.evaluate(()=>window.__zombieProbe.gate());
 assert.equal((await page.evaluate(()=>window.__zombieProbe.state())).stage,2);
 await page.evaluate(()=>window.__zombieProbe.gate());
 let state=await page.evaluate(()=>window.__zombieProbe.state());
 assert.equal(state.stage,3);assert.equal(state.bossCount,1,"final boss spawned");
 await page.evaluate(()=>window.__zombieProbe.bossBehind());
 state=await page.evaluate(()=>window.__zombieProbe.state());
 assert.equal(state.bossCount,1,"mandatory boss must survive distance culling");
 await page.evaluate(()=>window.__zombieProbe.bossKill());
 state=await page.evaluate(()=>window.__zombieProbe.state());
 assert.equal(state.bossCount,0,"boss can be shot and defeated");
 await page.evaluate(()=>window.__zombieProbe.gate());
 state=await page.evaluate(()=>window.__zombieProbe.state());
 assert.equal(state.finished,true,"final exit grants victory");
 assert.equal(await page.evaluate(()=>localStorage.getItem("af-zombie-campaign-checkpoint:v1")),null,"completed run clears checkpoint");
});


await scenario("Not Dead Yet simultaneous movement, shoot and manual touch aim",{width:390,height:844},async page=>{
 await page.route("**/not-dead-yet.html",async route=>{
  const response=await route.fetch(),html=await response.text(),mark="updateResumeButton();draw();";
  assert.ok(html.includes(mark));
  await route.fulfill({response,body:html.replace(mark,"window.__touchProbe=()=>({left:held.left,right:held.right,down:pointer.down,autoAim:pointer.autoAim});"+mark)});
 });
 await page.goto(base+"/not-dead-yet.html",{waitUntil:"domcontentloaded"});
 await page.click("#start");
 const state=()=>page.evaluate(()=>window.__touchProbe());
 const event=(selector,type,id)=>page.locator(selector).evaluate((el,a)=>el.dispatchEvent(new PointerEvent(a.type,{bubbles:true,pointerId:a.id,pointerType:"touch",clientX:180,clientY:340})),{type,id});
 await event('[data-hold="left"]',"pointerdown",101);
 assert.equal((await state()).left,true);
 await event("#touch-jump","pointerdown",102);
 await event("#touch-jump","pointerup",102);
 assert.equal((await state()).left,true,"releasing jump must not cancel held movement");
 await event("#touch-fire","pointerdown",103);
 let t=await state();assert.equal(t.down,true);assert.equal(t.autoAim,true);
 await event('[data-hold="left"]',"pointerup",101);
 t=await state();assert.equal(t.left,false);assert.equal(t.down,true,"releasing movement must not stop held fire");
 await event("#touch-fire","pointerup",103);
 assert.equal((await state()).down,false);
 await event("#game","pointerdown",104);
 assert.equal((await state()).autoAim,false,"tapping playfield must retain manual aim");
 await event("#game","pointercancel",104);
 assert.equal((await state()).down,false,"pointer cancel must stop firing");
});


await scenario("Not Dead Yet true fullscreen and F keyboard toggle",{width:1280,height:850},async page=>{
 await page.goto(base+"/not-dead-yet.html",{waitUntil:"domcontentloaded"});
 await page.selectOption("#mode","campaign");await page.click("#start");
 await page.click("#toggle-fullscreen");
 await page.waitForFunction(()=>document.querySelector("#toggle-fullscreen").getAttribute("aria-pressed")==="true");
 let dimensions=await page.evaluate(()=>{
  const stage=document.querySelector("#game-stage"),canvas=document.querySelector("#game"),r=stage.getBoundingClientRect(),c=canvas.getBoundingClientRect();
  return{native:document.fullscreenElement===stage,fallback:stage.classList.contains("immersive-fallback"),width:r.width,height:r.height,canvasWidth:c.width,canvasHeight:c.height,viewportWidth:innerWidth,viewportHeight:innerHeight}
 });
 assert.ok(dimensions.native||dimensions.fallback,"browser fullscreen or CSS immersive fallback entered");
 assert.ok(Math.abs(dimensions.width-dimensions.viewportWidth)<4,"gameplay fullscreen covers viewport width");
 assert.ok(Math.abs(dimensions.height-dimensions.viewportHeight)<4,"gameplay fullscreen covers viewport height");
 assert.ok(dimensions.canvasHeight>100,"canvas must be sized in fullscreen");
 assert.ok(Math.abs(dimensions.canvasWidth/dimensions.canvasHeight-960/540)<.02,"canvas keeps 16:9 aspect");
 await page.locator("#game").click({position:{x:Math.floor(dimensions.canvasWidth*.65),y:Math.floor(dimensions.canvasHeight*.45)},force:true});
 await page.click("#toggle-fullscreen");
 await page.waitForFunction(()=>document.querySelector("#toggle-fullscreen").getAttribute("aria-pressed")==="false");
 assert.equal(await page.evaluate(()=>document.fullscreenElement===null),true,"native fullscreen properly exited");
 await page.keyboard.press("f");
 await page.waitForFunction(()=>document.querySelector("#toggle-fullscreen").getAttribute("aria-pressed")==="true");
 await page.keyboard.press("f");
 await page.waitForFunction(()=>document.querySelector("#toggle-fullscreen").getAttribute("aria-pressed")==="false");
});
await scenario("Not Dead Yet mobile fullscreen fallback keeps controls on screen",{width:390,height:844},async page=>{
 await page.goto(base+"/not-dead-yet.html",{waitUntil:"domcontentloaded"});
 await page.selectOption("#mode","campaign");await page.click("#start");
 await page.evaluate(()=>document.querySelector("#game-stage").requestFullscreen=()=>Promise.reject(new Error("Unsupported test browser")));
 await page.click("#toggle-fullscreen");
 const state=await page.evaluate(()=>{
  const stage=document.querySelector("#game-stage"),r=stage.getBoundingClientRect(),canvas=document.querySelector("#game").getBoundingClientRect();
  const touch=document.querySelector(".touch-controls").getBoundingClientRect(),fire=document.querySelector("#touch-fire").getBoundingClientRect();
  return{fallback:stage.classList.contains("immersive-fallback"),x:r.x,y:r.y,w:r.width,h:r.height,canvasW:canvas.width,canvasH:canvas.height,fireY:fire.bottom,touchY:touch.top,viewportH:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth+3};
 });
 assert.equal(state.fallback,true);assert.ok(state.canvasW>100&&state.canvasH>0);
 assert.ok(state.fireY<=state.viewportH+3,"touch fire button must be visible within viewport");
 assert.ok(state.touchY>0,"touch controls remain below game and accessible");
 assert.ok(Math.abs(state.w-390)<3&&Math.abs(state.h-844)<3,"immersive fallback covers phone screen");
 await page.keyboard.press("Escape");
 assert.equal(await page.locator("#toggle-fullscreen").getAttribute("aria-pressed"),"false");
 await page.click("#toggle-fullscreen");
 await page.click("#toggle-fullscreen");
 assert.equal(await page.locator("#toggle-fullscreen").getAttribute("aria-pressed"),"false");
});
await scenario("Not Dead Yet short landscape fullscreen has visible touch actions",{width:844,height:390},async page=>{
 await page.goto(base+"/not-dead-yet.html",{waitUntil:"domcontentloaded"});
 await page.click("#start");
 await page.evaluate(()=>document.querySelector("#game-stage").requestFullscreen=()=>Promise.reject(new Error("CSS fallback")));
 await page.click("#toggle-fullscreen");
 const info=await page.evaluate(()=>{
  const el=document.querySelector("#touch-fire"),r=el.getBoundingClientRect();
  return{display:getComputedStyle(el.parentElement).display,visible:r.width>0&&r.bottom<=innerHeight+3,screenHeight:document.querySelector("#game").getBoundingClientRect().height}
 });
 assert.equal(info.display,"grid","landscape phones still get touch controls");
 assert.equal(info.visible,true,"touch fire button stays visible");
 assert.ok(info.screenHeight>50,"game is still playable in landscape");
});

await browser.close();
if(failures.length){console.error(failures.join("\n"));process.exitCode=1}
