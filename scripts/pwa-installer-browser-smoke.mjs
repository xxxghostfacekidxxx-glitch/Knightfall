import assert from "node:assert/strict";
import { chromium } from "playwright";

const base=(process.env.PWA_INSTALL_BASE_URL||"http://127.0.0.1:8765").replace(/\/$/,"");
const browser=await chromium.launch({headless:true});
const androidUA="Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";
const iphoneUA="Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const inAppUA=androidUA+" Instagram 300.0.0";
const errors=[];
try{
  const android=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:androidUA});
  const phone=await android.newPage();
  phone.on("pageerror",error=>errors.push("Android: "+error.message));
  {
    const home=await phone.goto(base+"/",{waitUntil:"domcontentloaded",timeout:15000});
    assert.equal(home?.status(),200,"Home must load for the global Install shortcut");
    const nav=phone.locator(".kf-header a.kf-install-pill");
    await nav.waitFor({state:"visible",timeout:10000});
    assert.equal(await nav.getAttribute("href"),"/install.html");
    assert.ok((await nav.innerText()).includes("Install"),"Install label visible on small phones");
    await nav.click({timeout:10000});
    await phone.waitForURL("**/install.html");
    assert.equal((await phone.locator("h1").innerText()).trim(),"Install Knightfall");
    const install=phone.locator("#kf-pwa-install");
    assert.equal(await install.isEnabled(),true,"PWA install control must stay usable without a native prompt");
    assert.equal(await phone.locator("#kf-install-guide").isVisible(),false,"Instructions collapsed initially");
    await install.click();
    await phone.locator("#kf-install-guide").waitFor({state:"visible"});
    assert.match(await phone.locator("#kf-install-guide-title").innerText(),/Android/);
    assert.match(await phone.locator("#kf-install-guide-steps").innerText(),/Install app|Add to Home screen/i);
    assert.equal(await phone.locator("#kf-install-help-button").getAttribute("aria-expanded"),"true");
    assert.ok((await phone.locator("#kf-install-copy-link").isVisible()),"A way to copy the install page link is available");
    await phone.locator("#kf-install-help-button").click();
    assert.equal(await phone.locator("#kf-install-guide").isVisible(),false,"Manual help can be closed");
  }
  {
    // Chromium fires beforeinstallprompt only when installability conditions are met.
    // Simulate the browser offering the real event to verify click/prompt/userChoice wiring.
    const accepted=await phone.evaluate(()=>{
      window.__nativeInstallPrompts=0;
      const event=new Event("beforeinstallprompt",{cancelable:true});
      event.prompt=async()=>{window.__nativeInstallPrompts++;};
      event.userChoice=Promise.resolve({outcome:"accepted"});
      const allowed=window.dispatchEvent(event);
      return !allowed&&event.defaultPrevented;
    });
    assert.equal(accepted,true,"Install code must capture and prevent default on the browser prompt");
    const install=phone.locator("#kf-pwa-install");
    assert.equal(await install.innerText(),"Install Knightfall");
    await install.click();
    assert.equal(await phone.evaluate(()=>window.__nativeInstallPrompts),1);
    assert.match(await phone.locator("#kf-install-status").innerText(),/Installation accepted/);
    assert.equal(await install.isDisabled(),true,"Accepted installation must stop offering Install");
    await phone.evaluate(()=>window.dispatchEvent(new Event("appinstalled")));
    assert.equal(await phone.locator(".kf-header .kf-install-pill").isVisible(),false,"Installed app hides global install shortcut");
    assert.equal(await phone.evaluate(()=>localStorage.getItem("kf:main-pwa-installed")),"1","Installed app remembered");
    await phone.goto(base+"/");
    assert.equal(await phone.locator(".kf-header .kf-install-pill").isVisible(),false,"Global shortcut stays hidden across navigation");
    await phone.goto(base+"/install.html");
    assert.equal(await phone.locator("#kf-pwa-install").isDisabled(),true,"Install page does not prompt twice");
    assert.match(await install.innerText(),/installed/i);
  }
  await android.close();
  console.log("PASS Android: header link, install fallback, real prompt activation and installed state");

  const ios=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:iphoneUA});
  const safari=await ios.newPage();
  safari.on("pageerror",error=>errors.push("iPhone: "+error.message));
  await safari.goto(base+"/install.html",{waitUntil:"domcontentloaded",timeout:15000});
  await safari.locator("#kf-pwa-install").click();
  assert.match(await safari.locator("#kf-install-guide-title").innerText(),/iPhone or iPad/);
  assert.match(await safari.locator("#kf-install-guide-steps").innerText(),/Share/);
  assert.match(await safari.locator("#kf-install-guide-steps").innerText(),/Add to Home Screen/);
  await ios.close();
  console.log("PASS iPhone: Safari Share > Add to Home Screen guidance");

  const embedded=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:inAppUA});
  const app=await embedded.newPage();
  app.on("pageerror",error=>errors.push("In-app: "+error.message));
  await app.goto(base+"/install.html",{waitUntil:"domcontentloaded",timeout:15000});
  await app.locator("#kf-pwa-install").click();
  assert.match(await app.locator("#kf-install-guide-title").innerText(),/regular browser/);
  assert.match(await app.locator("#kf-install-guide-steps").innerText(),/Open in browser/);
  await embedded.close();
  console.log("PASS in-app Android browser: open externally or copy installer link guidance");

  const checks=await browser.newPage();
  const manifest=await checks.request.get(base+"/manifest.webmanifest");
  assert.equal(manifest.status(),200);
  const data=await manifest.json();
  assert.equal(data.display,"standalone");
  for(const icon of data.icons){
    const asset=await checks.request.get(base+icon.src);
    assert.equal(asset.status(),200,"Missing PWA app icon "+icon.src);
  }
  const resource=await checks.request.get(base+"/install.js");
  assert.equal(resource.status(),200);
  const release=await checks.request.get(base+"/android-release.json");
  assert.equal(release.status(),200);
  const apk=await release.json();
  if(apk.status!=="released")assert.equal(apk.signedReleaseVerified,false,"No unverified APK should appear");
  await checks.close();
  assert.deepEqual(errors,[],"Uncaught installer script exceptions");
  console.log("PASS installability resources: manifest, icons, install script, and safe Android release gate");
}finally{
  await browser.close();
}
