import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.DEV_TOOLS_TEST_BASE || "http://127.0.0.1:8765";
const report = {
  schemaVersion:1,tool:"knightfall-developer-arsenal",
  semgrep:{findings:2,severity:{ERROR:1,WARNING:1,INFO:0,UNKNOWN:0},scannerErrors:0},
  biome:{hasOutput:true,reportedErrors:3,reportedWarnings:4},
  untrusted:"DO_NOT_INCLUDE"
};
const browser=await chromium.launch({headless:true});
try{
  for(const authorized of [false,true]){
    const page=await browser.newPage({viewport:{width:390,height:844}});
    let submissions=0;
    try{
      await page.goto(base+"/offline.html",{waitUntil:"domcontentloaded"});
      await page.setContent('<div id="profile"><div id="private-chaos-lab"><div class="lab-chat"><form id="lab-chat-form"><textarea id="lab-chat-input"></textarea></form></div></div></div>');
      await page.route("https://api.ash-fall.com/api/god/developer-audit",async route=>{
        const origin=new URL(base).origin;
        await route.fulfill({status:authorized?200:403,contentType:"application/json",
          headers:{"access-control-allow-origin":origin,"access-control-allow-credentials":"true"},
          body:JSON.stringify(authorized?{result:report}:{error:"God role required."})});
      });
      await page.addScriptTag({path:"public/admin-command-center.js"});
      await page.locator("#lab-chat-form").evaluate(el=>el.addEventListener("submit",event=>{event.preventDefault();window.__submits=(window.__submits||0)+1}));
      const button=page.getByRole("button",{name:"Load latest verified report (God)"});
      await button.click();
      await page.waitForFunction(()=>document.querySelector(".command-center-audit-import [role=status]")?.textContent?.includes(
        document.querySelector("#lab-chat-input")?.value ? "Review and send" : "God-account access required"));
      const input=await page.locator("#lab-chat-input").inputValue();
      if(authorized){
        assert.match(input,/semgrep.*findings.*2/);
        assert.doesNotMatch(input,/DO_NOT_INCLUDE/);
      }else{
        assert.equal(input,"");
      }
      submissions=await page.evaluate(()=>window.__submits||0);
      assert.equal(submissions,0,"Report retrieval must not automatically submit a message");
      console.log("PASS God audit import browser fixture:",authorized?"authorized":"denied");
    }finally{await page.close();}
  }
}finally{await browser.close();}
