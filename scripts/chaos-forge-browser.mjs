import assert from "node:assert/strict";
import {chromium} from "playwright";

const BASE=process.env.FORGE_TEST_BASE||"http://127.0.0.1:8765";
const browser=await chromium.launch({headless:true,args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-webgl"]});
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900},acceptDownloads:true});
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.route("https://api.ash-fall.com/api/chaos/resources**",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({source:"Poly Haven",attribution:"Powered by Poly Haven",results:[{title:"Leather fabric",description:"CC0 material",url:"https://polyhaven.com/a/leather_01",license:"CC0"}]})}));
  await page.route("https://api.ash-fall.com/api/chaos/forge/analyze",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({analysis:"VISIBLE DETAILS: two panels. MEASUREMENTS NEEDED: true finished width.",stored:false})}));
  const response=await page.goto(BASE+"/chaos-forge.html",{waitUntil:"domcontentloaded",timeout:25000});
  assert.equal(response.status(),200);
  await page.waitForSelector("#forge-pattern-preview svg",{timeout:15000});
  assert.ok((await page.locator("#forge-cut-list").innerText()).includes("Cut list"));
  assert.equal(await page.locator("#forge-template").inputValue(),"tote");
  await page.selectOption("#forge-template","box");
  await page.click("#forge-build");
  assert.match(await page.locator("#forge-pattern-status").innerText(),/Draft generated/);
  const fileDownload=page.waitForEvent("download");
  await page.click("#forge-export-svg");
  const download=await fileDownload;
  assert.match(download.suggestedFilename(),/chaos-forge-box-pattern\.svg/);
  await page.fill("#forge-query","leather");
  await page.click("#forge-resource-form button[type=submit]");
  await page.locator(".forge-resource-result a").waitFor();
  assert.match(await page.locator("#forge-resource-status").innerText(),/Poly Haven/);
  // Upload a real small PNG, opt into AI inspection and confirm controlled result.
  const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9bUjwAAAAASUVORK5CYII=","base64");
  await page.locator("#forge-image").setInputFiles({name:"cloth.png",mimeType:"image/png",buffer:png});
  await page.waitForFunction(()=>document.querySelector("#forge-photo-caption")?.textContent.includes("cloth.png"),{timeout:6000});
  await page.click("#forge-analyze");
  await page.locator("#forge-analysis:not([hidden])").waitFor({timeout:8000});
  assert.match(await page.locator("#forge-analysis").innerText(),/VISIBLE DETAILS/);
  // 3D canvas is always present; a device without WebGL must show an explicit fallback.
  const exists=await page.locator("#forge-3d").count();
  assert.equal(exists,1);
  const three=await page.evaluate(()=>Boolean(window.THREE));
  assert.ok(three,"Knightfall's bundled Three.js should load without a CDN");
  assert.ok(!errors.some(e=>/SyntaxError|ReferenceError|TypeError/.test(e)),errors.join("\n"));
  await page.close();
 }
}finally{await browser.close();}
console.log("Chaos Forge rendered, drafted, downloaded, researched and opt-in analyzed on Android-size and desktop viewports.");
