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
  await page.goto(base+"/",{waitUntil:"domcontentloaded"});
  await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#0d1018;color:white"><main style="padding:10px;max-width:960px;margin:auto"><div id="chart" class="cosmic-preview"></div></main></body></html>');
  await page.addStyleTag({url:base+"/cosmic-chart.css"});
  await page.addScriptTag({url:base+"/cosmic-insights.js"});
  await page.addScriptTag({url:base+"/cosmic-chart.js"});
  await page.evaluate(data=>window.KnightfallCosmic.render(document.querySelector("#chart"),data),chart);
  assert.equal(await page.locator(".cosmic-wheel svg").count(),1,label+": missing chart");
  assert.equal(await page.locator(".cosmic-atlas").count(),1,label+": missing atlas");
  assert.equal(await page.locator(".cosmic-focus-select").count(),1,label+": missing planet dropdown");
  assert.equal(await page.locator(".cosmic-atlas-stat").count()>0,true,label+": empty insights");
  const metrics=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,height:document.querySelector(".cosmic-wheel svg").getBoundingClientRect().height}));
  assert.ok(metrics.width<=metrics.viewport+2,label+": horizontal overflow "+JSON.stringify(metrics));
  assert.ok(metrics.height>180,label+": diagram too small "+JSON.stringify(metrics));
  await page.locator(".cosmic-focus-select").selectOption("Sun");
  assert.ok(await page.locator('[data-planet="Moon"]').first().evaluate(el=>getComputedStyle(el).opacity<.5),label+": planet focus didn't dim others");
  assert.ok(await page.locator('[data-planet="Sun"]').first().evaluate(el=>getComputedStyle(el).opacity>.9),label+": selected planet not highlighted");
  await page.locator(".cosmic-reset-focus").click();
  assert.equal(await page.locator(".cosmic-focus-select").inputValue(),"",label+": reset failed");
  await page.evaluate(data=>window.KnightfallCosmic.render(document.querySelector("#chart"),{bodies:data.bodies},{kind:"transit"}),chart);
  assert.match(await page.locator(".cosmic-wheel svg").getAttribute("aria-label"),/transit sky/i);
  assert.equal(await page.locator(".cosmic-focus-select").count(),1);
  console.log(label+": natal, focus/reset and transit layout PASS");
  await page.close();
 }
 assert.equal(errors,0,"Unexpected browser page errors");
}finally{await browser.close()}
