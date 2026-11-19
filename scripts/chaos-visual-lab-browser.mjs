import assert from "node:assert/strict";
import {chromium} from "playwright";
import {readFile} from "node:fs/promises";
const BASE=process.env.VISUAL_LAB_TEST_BASE||"http://127.0.0.1:8765";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900},acceptDownloads:true});
  const errors=[],commonsCalls=[],thumbCalls=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.route("https://api.openverse.org/v1/images/**",route=>{
   commonsCalls.push(route.request().url());
   return route.fulfill({status:200,contentType:"application/json",
    headers:{"access-control-allow-origin":"*"},
    body:JSON.stringify({result_count:1,results:[{
     id:"test",title:"Witchy Bat",creator:"Public Artist",license:"cc0",
     foreign_landing_url:"https://commons.wikimedia.org/wiki/File:Bat",
     license_url:"https://creativecommons.org/publicdomain/zero/1.0/",
     thumbnail:"https://static.example.org/visual-lab-bat.png",
     source:"wikimedia",attribution:"Witchy Bat by Public Artist, CC0",mature:false
    }]})});
  });
  await page.route("https://static.example.org/visual-lab-bat.png",route=>{
   thumbCalls.push(route.request().url());
   return route.fulfill({status:200,contentType:"image/png",
    body:Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9bUjwAAAAASUVORK5CYII=","base64")});
  });
  const loaded=await page.goto(BASE+"/chaos-visual-lab.html",{waitUntil:"domcontentloaded",timeout:30000});
  assert.equal(loaded.status(),200);
  const dataURL=await page.evaluate(()=>{
   const canvas=document.createElement("canvas");canvas.width=32;canvas.height=32;
   const ctx=canvas.getContext("2d");ctx.fillStyle="#222222";ctx.fillRect(0,0,32,32);
   ctx.fillStyle="#ff55a8";ctx.fillRect(3,4,16,24);
   ctx.fillStyle="#ffffff";ctx.fillRect(12,12,8,8);
   return canvas.toDataURL("image/png");
  });
  const png=Buffer.from(dataURL.split(",")[1],"base64");
  assert.equal(commonsCalls.length,0);
  await page.locator("#visual-file").setInputFiles({name:"tattoo-reference.png",mimeType:"image/png",buffer:png});
  await page.waitForFunction(()=>document.querySelector("#visual-status")?.textContent.includes("Artwork processed locally"),{timeout:16000});
  assert.equal(await page.locator("#visual-png").isEnabled(),true);
  assert.ok((await page.locator(".cvl-swatch").count())>=2);
  assert.match(await page.locator("#visual-dimensions").innerText(),/Pica|browser/);
  const pngDownloaded=page.waitForEvent("download");
  await page.click("#visual-png");
  assert.match((await pngDownloaded).suggestedFilename(),/\.png$/);
  // Compare processed artwork with an asymmetrical original reference and verify transfer orientation.
  await page.selectOption("#visual-engine","browser");
  await page.waitForFunction(()=>document.querySelector("#visual-dimensions")?.textContent.includes("browser-native"));
  const sampled=()=>page.evaluate(()=>{
   const canvas=document.querySelector("#visual-preview"),ctx=canvas.getContext("2d");
   return ctx.getImageData(45,60,1,1).data[0];
  });
  const sourceLeft=await sampled();
  await page.check("#visual-mirror");
  await page.waitForFunction(()=>document.querySelector("#visual-dimensions")?.textContent.includes("mirrored"));
  const mirroredLeft=await sampled();
  assert.ok(sourceLeft>mirroredLeft+60,"mirror must visibly move artwork horizontally");
  await page.click("#visual-compare");
  assert.equal(await page.locator("#visual-compare").getAttribute("aria-pressed"),"true");
  assert.ok((await sampled())>mirroredLeft+60,"compare must show unmodified reference");
  await page.click("#visual-compare");
  assert.equal(await page.locator("#visual-compare").getAttribute("aria-pressed"),"false");
  await page.uncheck("#visual-mirror");
  await page.waitForFunction(()=>!document.querySelector("#visual-dimensions")?.textContent.includes("mirrored"));
  await page.selectOption("#visual-effect","ink");
  await page.waitForFunction(()=>document.querySelector("#visual-dimensions")?.textContent.includes("Blackwork threshold"),{timeout:14000});
  await page.click("#visual-trace");
  await page.waitForFunction(()=>document.querySelector("#visual-svg")?.disabled===false,{timeout:14000});
  assert.equal(await page.locator("#visual-svg-preview").isVisible(),true);
  const svgDownloaded=page.waitForEvent("download");
  await page.click("#visual-svg");
  assert.match((await svgDownloaded).suggestedFilename(),/\.svg$/);
  // Exact millimeter sizing, mirrored stencil and printer calibration exports.
  await page.click("#visual-preset-stencil");
  await page.waitForFunction(()=>document.querySelector("#visual-dimensions")?.textContent.includes("Extracted edges"),{timeout:15000});
  assert.equal(await page.locator("#visual-mirror").isChecked(),true);
  assert.equal(await page.locator("#visual-threshold").inputValue(),"100");
  await page.selectOption("#visual-paper","a4");
  await page.fill("#visual-print-width","195");
  assert.equal(await page.locator("#visual-print-sheet").isDisabled(),true,"oversize artwork must fail before export");
  await page.fill("#visual-print-width","100");
  assert.equal(await page.locator("#visual-print-sheet").isEnabled(),true);
  const sheetDownloaded=page.waitForEvent("download");
  await page.click("#visual-print-sheet");
  const sheet=await sheetDownloaded;
  assert.match(sheet.suggestedFilename(),/stencil-100mm-a4\.svg$/);
  const sheetText=await readFile(await sheet.path(),"utf8");
  assert.match(sheetText,/width="210mm" height="297mm"/);
  assert.match(sheetText,/50 mm calibration/);
  assert.match(sheetText,/href="data:image\/png;base64,/);
  await page.click("#visual-adjust-reset");
  await page.waitForFunction(()=>document.querySelector("#visual-dimensions")?.textContent.includes("Original colors"),{timeout:15000});
  assert.equal(await page.locator("#visual-mirror").isChecked(),false);
  await page.fill("#visual-qr-url","https://ash-fall.com/profile.html");
  await page.fill("#visual-qr-label","MY TATTOO PORTAL");
  await page.click("#visual-qr-generate");
  assert.equal(await page.locator("#visual-qr-png").isEnabled(),true);
  assert.equal(await page.locator("#visual-qr-svg").isEnabled(),true);
  const qrDownloaded=page.waitForEvent("download");
  await page.click("#visual-qr-png");
  assert.match((await qrDownloaded).suggestedFilename(),/qr-card\.png$/);
  assert.equal(commonsCalls.length,0,"local image tracing and QR must not call Openverse");
  await page.fill("#visual-commons-query","gothic bat");
  await page.selectOption("#visual-commons-license","cc0,pdm");
  await page.click("#visual-commons-search");
  await page.locator(".cvl-result").waitFor({timeout:11000});
  assert.equal(commonsCalls.length,1);
  assert.equal(thumbCalls.length,0,"no third-party image previews before explicit click");
  assert.match(await page.locator("#visual-commons-results").innerText(),/Witchy Bat/);
  const thumbnailResponse=page.waitForResponse(response=>response.url().includes("static.example.org/visual-lab-bat.png"));
  await page.click(".cvl-preview-button");
  await page.waitForFunction(()=>document.querySelector(".cvl-result-image")?.getAttribute("src")?.includes("static.example.org"));
  await thumbnailResponse;
  assert.equal(thumbCalls.length,1);
  const overflowing=await page.evaluate(()=>document.querySelector(".cvl-main").scrollWidth>window.innerWidth+6);
  assert.equal(overflowing,false,"Visual Lab panels should not overflow viewport at "+width);
  assert.deepEqual(errors.filter(x=>/ReferenceError|TypeError|SyntaxError/.test(x)),[],"page errors at "+width+": "+errors.join("\n"));
  await page.close();
 }
}finally{await browser.close();}
console.log("Chaos Visual Lab: Pica, raster effects, ImageTracer, real QR export and opt-in Commons discovery passed on mobile and desktop.");
