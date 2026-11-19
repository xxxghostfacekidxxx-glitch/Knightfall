import test from "node:assert/strict";
import {chromium} from "playwright";
const BASE=process.env.CHAOS_TEST_BASE||"http://127.0.0.1:8765";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const requests=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.route("https://api.ash-fall.com/**",route=>{
    const u=new URL(route.request().url()),p=u.pathname;
    if(p==="/api/chaos/forge/analyze"){
      requests.push(JSON.parse(route.request().postData()));
      return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({analysis:"TEMPLATE: tote\nVISIBLE DETAILS: two fabric panels, a pair of handles.\nMEASUREMENTS NEEDED: width and gusset depth.",suggested_template:"tote"})});
    }
    if(p==="/api/auth/me")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({user:{id:7,role:"member",username:"maker"}})});
    if(p==="/health")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({ok:true})});
    if(p==="/api/chaos/conversations")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({conversations:[]})});
    if(p==="/api/chaos/memories")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({memories:[]})});
    return route.fulfill({status:200,contentType:"application/json",body:"{}"});
  });
  const response=await page.goto(BASE+"/miss-chaos.html",{waitUntil:"domcontentloaded",timeout:30000});
  test.equal(response.status(),200);
  await page.waitForSelector("#chaos-reference-photo");
  const image=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9bUjwAAAAASUVORK5CYII=","base64");
  await page.locator("#chaos-reference-input").setInputFiles({name:"sewing.png",mimeType:"image/png",buffer:image});
  await page.waitForFunction(()=>document.querySelector("#chaos-reference-status")?.textContent.includes("Photo analyzed"),{timeout:15000});
  const text=await page.locator("#message-input").inputValue();
  test.match(text,/VISIBLE DETAILS/);
  test.match(text,/Verify missing measurements/);
  test.ok(text.length<=4000);
  test.equal(requests.length,1);
  test.match(requests[0].image,/^data:image\/jpeg;base64,/);
  test.equal(requests[0].kind,"craft");
  test.equal(await page.locator(".message.user").count(),0,"not automatically sent to chat");
  await page.locator("#chaos-reference-input").setInputFiles({name:"invalid.txt",mimeType:"text/plain",buffer:Buffer.from("NOT AN IMAGE")});
  await page.waitForFunction(()=>document.querySelector("#chaos-reference-status")?.textContent.includes("Choose a JPEG"),{timeout:5000});
  test.equal(requests.length,1,"unaccepted file must not invoke vision");
  test.ok(!errors.some(e=>/SyntaxError|ReferenceError|TypeError/.test(e)),errors.join("\n"));
  await page.close();
 }
}finally{await browser.close();}
console.log("Miss Chaos opt-in photo inspection and review-before-send pass at phone and desktop widths.");
