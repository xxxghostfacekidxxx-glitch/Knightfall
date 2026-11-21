// Exercise real WebKit layout/events, not just Chromium with an iPhone user agent.
import assert from "node:assert/strict";
import { webkit } from "playwright";

const base=process.env.PWA_TEST_BASE||"http://127.0.0.1:8765";
const iphoneUA="Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const browser=await webkit.launch({headless:true});
try {
  const context=await browser.newContext({
    viewport:{width:390,height:844},
    deviceScaleFactor:3,
    isMobile:true,
    hasTouch:true,
    userAgent:iphoneUA
  });
  const page=await context.newPage();
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  for(const path of ["/","/install.html","/auth.html"]){
    const response=await page.goto(base+path,{waitUntil:"domcontentloaded"});
    assert.equal(response?.status(),200,path+" should load in WebKit");
    await page.locator("body").waitFor({state:"visible"});
    await page.locator(".kf-nav-toggle").waitFor({state:"visible"});
    const size=await page.evaluate(()=>({
      innerWidth:window.innerWidth,
      scrollWidth:document.documentElement.scrollWidth
    }));
    assert.ok(size.scrollWidth<=size.innerWidth+2,
      path+" must not scroll horizontally on an iPhone: "+JSON.stringify(size));
    await page.locator(".kf-nav-toggle").tap();
    assert.equal(await page.locator(".kf-nav-toggle").getAttribute("aria-expanded"),"true",
      path+" mobile menu must open on touch");
    assert.equal(await page.locator("#kf-primary-nav").isVisible(),true,
      path+" mobile navigation must remain visible");
    await page.locator(".kf-nav-toggle").tap();
    assert.equal(await page.locator(".kf-nav-toggle").getAttribute("aria-expanded"),"false",
      path+" mobile menu must close on touch");
  }
  await page.goto(base+"/install.html",{waitUntil:"domcontentloaded"});
  await page.locator("#kf-install-help-button").tap();
  assert.match(await page.locator("#kf-install-guide-title").innerText(),/iPhone|iPad/i,
    "iOS users must receive Safari install instructions");
  assert.ok(!errors.some(e=>/mobileNavViewport\.addEventListener is not a function|SyntaxError/.test(e)),
    "No iOS navigation compatibility/syntax errors: "+errors.join("; "));
  await context.close();
} finally {
  await browser.close();
}
