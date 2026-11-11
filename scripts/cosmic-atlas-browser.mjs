import assert from "node:assert/strict";
import {chromium} from "playwright";

const base=(process.env.ASTROLOGY_BROWSER_BASE||"http://127.0.0.1:8765").replace(/\/$/,"");
const browser=await chromium.launch({headless:true});
const chart={
 zodiac:"tropical",house_system:"Equal houses (Ascendant-based)",
 ascendant_sign:"Cancer",ascendant_degree:12.5,
 bodies:{
  Sun:{sign:"Aries",degree:10.1},Moon:{sign:"Libra",degree:10.3},
  Mercury:{sign:"Aries",degree:12.1,retrograde:true},Venus:{sign:"Taurus",degree:20},
  Mars:{sign:"Leo",degree:7},Jupiter:{sign:"Sagittarius",degree:8},
  Saturn:{sign:"Aquarius",degree:8},Uranus:{sign:"Taurus",degree:9},
  Neptune:{sign:"Pisces",degree:17},Pluto:{sign:"Capricorn",degree:18}
 },
 house_placements:{Sun:10,Moon:4,Mercury:10,Venus:11,Mars:2,Jupiter:6,Saturn:8}
};
let errors=0;
try{
 for(const [label,width,height] of [["android-small",320,700],["android",390,844],["desktop",1280,900]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  page.on("pageerror",error=>{console.error(label+" page error:",error.message);errors++});
  await page.goto(base+"/cosmic-chart.css",{waitUntil:"domcontentloaded"});
  await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#0d1018;color:white"><main style="padding:10px;max-width:960px;margin:auto"><div id="chart" class="cosmic-preview"></div></main></body></html>');
  await page.addStyleTag({url:base+"/cosmic-chart.css"});
  await page.addScriptTag({url:base+"/cosmic-lexicon.js"});
  await page.addScriptTag({url:base+"/cosmic-insights.js"});
  await page.addScriptTag({url:base+"/cosmic-chart.js"});
  await page.evaluate(data=>window.KnightfallCosmic.render(document.querySelector("#chart"),data),chart);
  assert.equal(await page.locator(".cosmic-wheel svg").count(),1,label+": missing chart");
  assert.equal(await page.locator(".cosmic-atlas").count(),1,label+": missing atlas");
  assert.equal(await page.locator(".cosmic-house-entry").count(),12,label+": missing 12-house explorer");
  const downloadPromise=page.waitForEvent("download",{timeout:12000});
  await page.locator(".cosmic-export-button").click();
  const downloaded=await downloadPromise;
  assert.match(downloaded.suggestedFilename(),/knightfall-cosmic-chart\.svg$/);
  assert.match(await page.locator(".cosmic-export-status").textContent(),/saved locally/);
  assert.equal(await page.locator(".cosmic-focus-select").count(),1,label+": missing planet dropdown");
  assert.equal(await page.locator(".cosmic-atlas-stat").count()>0,true,label+": empty insights");
  const metrics=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,height:document.querySelector(".cosmic-wheel svg").getBoundingClientRect().height}));
  assert.ok(metrics.width<=metrics.viewport+2,label+": horizontal overflow "+JSON.stringify(metrics));
  assert.ok(metrics.height>180,label+": diagram too small "+JSON.stringify(metrics));
  await page.locator(".cosmic-focus-select").selectOption("Sun");
  assert.match(await page.locator(".cosmic-interpretation-reading").textContent(),/traditional tropical astrology/);
  assert.equal(await page.locator(".cosmic-reflection-question").count(),1);
  assert.ok(await page.locator('[data-planet="Moon"]').first().evaluate(el=>getComputedStyle(el).opacity<.5),label+": planet focus didn't dim others");
  assert.ok(await page.locator('[data-planet="Sun"]').first().evaluate(el=>getComputedStyle(el).opacity>.9),label+": selected planet not highlighted");
  await page.locator(".cosmic-reset-focus").click();
  assert.equal(await page.locator(".cosmic-focus-select").inputValue(),"",label+": reset failed");
  await page.evaluate(data=>window.KnightfallCosmic.render(document.querySelector("#chart"),{bodies:data.bodies},{kind:"transit"}),chart);
  assert.match(await page.locator(".cosmic-wheel svg").getAttribute("aria-label"),/transit sky/i);
  assert.equal(await page.locator(".cosmic-focus-select").count(),1);
  assert.match(await page.locator(".cosmic-atlas h3").textContent(),/Transit Sky Atlas/);
  await page.locator(".cosmic-focus-select").selectOption("Sun");
  assert.match(await page.locator(".cosmic-transit-context").textContent(),/not a person.s natal character/);
  assert.equal(await page.locator(".cosmic-house-entry").count(),0,label+": sky-only chart must not show birth houses");
  await page.evaluate(data=>window.KnightfallCosmic.render(document.querySelector("#chart"),data,
    {kind:"overlay",transitChart:{bodies:{
      Mars:{sign:"Libra",degree_in_sign:10.1},
      Venus:{sign:"Aries",degree_in_sign:10.1},
      Jupiter:{sign:"Cancer",degree_in_sign:3}
    }}}),chart);
  assert.match(await page.locator(".cosmic-wheel svg").getAttribute("aria-label"),/Natal and transit/);
  assert.ok(await page.locator("[data-transit-planet]").count()>=3,label+": missing transit ring");
  assert.ok(await page.locator("[data-overlay-aspect]").count()>=1,label+": missing inter-chart aspects");
  assert.equal(await page.locator(".cosmic-overlay-legend").count(),1,label+": missing dual-ring legend");
  assert.equal(await page.locator(".cosmic-transit-select").count(),1,label+": missing transit filter");
  await page.locator(".cosmic-transit-select").selectOption("Mars");
  assert.match(await page.locator(".cosmic-transit-count").textContent(),/Mars/);
  assert.ok(await page.locator('[data-overlay-moving="Venus"]').first().evaluate(node=>Number(getComputedStyle(node).opacity)<.2),label+": unrelated transit aspect not dimmed");
  const visible=await page.locator('.cosmic-transit-connection:visible').count();
  assert.ok(visible>=1,label+": selected moving planet has no visible links");
  await page.locator(".cosmic-transit-connection:visible .cosmic-transit-detail summary").first().click();
  assert.ok(await page.locator(".cosmic-transit-reflection:visible").count()>0,label+": transit reflection missing");
  await page.locator(".cosmic-transit-select").selectOption("");
  assert.ok(await page.locator('.cosmic-transit-connection:visible').count()>=visible,label+": reset failed");

  const dualSize=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert.ok(dualSize.scroll<=dualSize.viewport+2,label+": overlay overflow "+JSON.stringify(dualSize));
  await page.evaluate(data=>{
    window.KnightfallCosmic.render(document.querySelector("#chart"),
      {time_precision:"unknown",bodies:{Sun:data.bodies.Sun,Moon:data.bodies.Moon}});
  },chart);
  assert.match(await page.locator(".cosmic-uncertain").textContent(),/Birth time unknown/);
  assert.equal(await page.locator(".cosmic-house-entry").count(),0,label+": uncertain birth time must not invent houses");
  assert.equal(await page.locator(".cosmic-three .cosmic-key").count(),2,label+": unknown time should omit Rising");
  console.log(label+": natal, planet focus, transit and unknown-time layout PASS");
  await page.close();
 }
 assert.equal(errors,0,"Unexpected browser page errors");
}finally{await browser.close()}
