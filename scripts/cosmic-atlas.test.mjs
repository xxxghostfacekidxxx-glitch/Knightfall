import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext,Script} from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const sample={
 zodiac:"tropical",house_system:"Whole sign",ascendant_sign:"Cancer",ascendant_degree:12,
 bodies:{
  Sun:{sign:"Aries",degree:10},Moon:{sign:"Libra",degree:10},
  Mercury:{sign:"Aries",degree:12,retrograde:true},Venus:{sign:"Aries",degree:13},
  Mars:{sign:"Taurus",degree:2},Jupiter:{sign:"Sagittarius",degree:10},
  Saturn:{sign:"Capricorn",degree:10},Uranus:{sign:"Taurus",degree:15},
  Neptune:{sign:"Pisces",degree:25},Pluto:{sign:"Capricorn",degree:10}
 },
 house_placements:{Sun:10,Moon:4,Mercury:10,Venus:10,Mars:11,Jupiter:6,Saturn:7}
};
function makeDOM(){
 class Element{
  constructor(tag){this.tagName=tag;this.children=[];this.parentNode=null;this.attributes={};this.style={};this.textContent="";this.value="";this.listeners={};}
  append(...items){for(const node of items){this.children.push(node);if(node&&typeof node==="object")node.parentNode=this;}}
  prepend(...items){this.children.unshift(...items);for(const node of items)if(node&&typeof node==="object")node.parentNode=this;}
  replaceChildren(...items){this.children=[];this.append(...items);}
  setAttribute(key,val){this.attributes[key]=String(val);}
  getAttribute(key){return this.attributes[key]??null;}
  addEventListener(type,fn){this.listeners[type]=fn;}
  focus(){}
  closest(selector){for(let n=this;n;n=n.parentNode)if(selector.startsWith(".")&&String(n.className||"").split(" ").includes(selector.slice(1)))return n;return null;}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  querySelectorAll(selector){
   const found=[],attr=/^\[([a-z-]+)\]$/.exec(selector);
   const recurse=node=>{if(!node||typeof node!=="object")return;
    if(attr&&Object.hasOwn(node.attributes,attr[1]))found.push(node);
    else if(selector==="svg"&&node.tagName==="svg")found.push(node);
    for(const child of node.children||[])recurse(child);
   };recurse(this);return found;
  }
 }
 const document={createElement:tag=>new Element(tag),createElementNS:(_,tag)=>new Element(tag)};
 function Option(label,value){const x=new Element("option");x.textContent=label;x.value=value;return x;}
 return {document,Option,Element};
}
function mount(){
 const {document,Option,Element}=makeDOM(),window={};
 const context={window,document,Option,Math,Number,Object,Array,Date,console};
 runInNewContext(read("public/cosmic-lexicon.js"),context);
 runInNewContext(read("public/cosmic-insights.js"),context);
 runInNewContext(read("public/cosmic-chart.js"),context);
 return {window,document,Element};
}
test("Chart Atlas derives chart ruler, Moon phase and retrogrades from actual saved placements",()=>{
 const {window}=mount(),result=window.KnightfallCosmicInsights.summarize(sample);
 assert.equal(result.ruler.traditional,"Moon");
 assert.equal(result.ruler.modern,null);
 assert.equal(result.phase.name,"Full Moon");
 assert.equal(result.phase.elongation,180);
 assert.equal(result.clusters.find(p=>p.sign==="Aries").names.length,3);
 assert.ok(result.retrogrades.includes("Mercury"));
 assert.equal(Object.values(result.elements).reduce((a,b)=>a+b,0),7);
 assert.equal(Object.values(result.modalities).reduce((a,b)=>a+b,0),7);
});
test("traditional and modern rulers are distinguished and missing ascendant is not invented",()=>{
 const {window}=mount();
 const scorpio={...sample,ascendant_sign:"Scorpio"};
 const result=window.KnightfallCosmicInsights.summarize(scorpio);
 assert.equal(result.ruler.traditional,"Mars");
 assert.equal(result.ruler.modern,"Pluto");
 const missing={bodies:{Sun:{sign:"Gemini",degree:5},Moon:{sign:"Virgo",degree:10}}};
 assert.equal(window.KnightfallCosmicInsights.summarize(missing).ruler,null);
 const noMoon={bodies:{Sun:{sign:"Gemini",degree:5}}};
 assert.equal(window.KnightfallCosmicInsights.summarize(noMoon).phase,null);
});
test("Atlas renders a keyboard-accessible planet selector and highlights connected SVG aspects",()=>{
 const {window,document}=mount(),target=document.createElement("main");
 window.KnightfallCosmic.render(target,sample);
 const svg=target.querySelector("svg"),selector=target.querySelector(".does-not-exist")||
  target.querySelectorAll("svg").length&&find(target,node=>node.tagName==="select");
 assert.ok(svg);
 assert.ok(selector);
 assert.equal(selector.attributes["aria-label"],"Choose a natal placement to explore");
 selector.value="Sun";selector.listeners.change();
 const placements=svg.querySelectorAll("[data-planet]");
 assert.ok(placements.some(p=>p.attributes["data-planet"]==="Moon"&&p.style.opacity===".22"));
 assert.ok(placements.some(p=>p.attributes["data-planet"]==="Sun"&&p.style.opacity==="1"));
 const lines=svg.querySelectorAll("[data-aspect-a]");
 assert.ok(lines.some(l=>l.attributes["data-aspect-a"]==="Sun"&&l.style.opacity==="1"));
 assert.ok(lines.some(l=>l.attributes["data-aspect-a"]!=="Sun"&&l.attributes["data-aspect-b"]!=="Sun"&&l.style.opacity===".07"));
});
function find(node,predicate){if(predicate(node))return node;for(const c of node.children||[]){const hit=find(c,predicate);if(hit)return hit;}return null;}
test("Chart prompts include genuinely derived phases, rulers and clusters, not private birth details",()=>{
 const {window}=mount();
 const p=window.KnightfallCosmic.prompt(sample);
 assert.match(p,/Traditional chart ruler: Moon/);
 assert.match(p,/Approximate Moon phase: Full Moon/);
 assert.match(p,/Planet clusters: 3 in Aries/);
 assert.ok(p.length<=3900);
 assert.doesNotMatch(p,/latitude|longitude|1990-01-01/);
});
test("unknown birth time never fabricates rising, houses or certainty",()=>{
 const {window,document}=mount(),target=document.createElement("main");
 const chart={time_precision:"unknown",bodies:{Sun:{sign:"Gemini",degree:11},Moon:{sign:"Virgo",degree:7}}};
 window.KnightfallCosmic.render(target,chart);
 const note=find(target,node=>String(node.className||"").includes("cosmic-uncertain"));
 assert.ok(note);
 assert.match(note.textContent,/Birth time unknown/);
 assert.equal(window.KnightfallCosmicInsights.summarize(chart).ruler,null);
 const draft=window.KnightfallCosmic.prompt(chart);
 assert.match(draft,/provisional noon-UTC chart/);
 assert.match(draft,/Do not infer Ascendant/);
});
test("dual-ring overlay keeps natal ASC and houses, adds transit symbols and computed connections",()=>{
 const {window,document}=mount(),target=document.createElement("main");
 const transits={bodies:{Mars:{sign:"Libra",degree_in_sign:10},Venus:{sign:"Aries",degree_in_sign:10},Jupiter:{sign:"Leo",degree_in_sign:17}}};
 window.KnightfallCosmic.render(target,sample,{kind:"overlay",transitChart:transits});
 const svg=target.querySelector("svg");
 assert.ok(svg);
 assert.match(svg.attributes["aria-label"],/Natal and transit/);
 assert.ok(svg.querySelectorAll("[data-planet]").length>0);
 assert.ok(svg.querySelectorAll("[data-transit-planet]").length>=3);
 const inter=svg.querySelectorAll("[data-overlay-aspect]");
 assert.ok(inter.length>=1);
 assert.ok(inter.some(x=>x.attributes["data-overlay-aspect"]==="Opposition"||x.attributes["data-overlay-aspect"]==="Conjunction"));
 const legend=find(target,node=>String(node.className||"")==="cosmic-overlay-legend");
 assert.ok(legend);
 const aspectDetails=find(target,node=>String(node.className||"")==="cosmic-overlay-aspects");
 assert.ok(aspectDetails);
});
test("transit-only view never displays fabricated natal houses or rising labels",()=>{
 const {window,document}=mount(),target=document.createElement("main");
 window.KnightfallCosmic.render(target,{bodies:{Mars:{sign:"Aries",degree:2},Venus:{sign:"Libra",degree:2}}},{kind:"transit"});
 const svg=target.querySelector("svg");
 assert.match(svg.attributes["aria-label"],/transit sky/);
 assert.equal(svg.querySelectorAll("[data-transit-planet]").length,0);
 assert.ok(!find(target,node=>String(node.textContent||"").startsWith("Rising ·")));
});
test("planet explorer renders nuanced sign and house interpretations with question prompts",()=>{
 const {window,document}=mount(),target=document.createElement("main");
 window.KnightfallCosmic.render(target,sample);
 const selector=find(target,node=>node.tagName==="select");
 assert.ok(selector);
 selector.value="Sun";selector.listeners.change();
 const reading=find(target,node=>String(node.className)==="cosmic-interpretation-reading");
 const question=find(target,node=>String(node.className)==="cosmic-reflection-question");
 const house=find(target,node=>String(node.className)==="cosmic-house-guide");
 assert.ok(reading);
 assert.match(reading.textContent,/traditional tropical astrology/);
 assert.ok(question);
 assert.ok(house);
 assert.equal(house.children.filter(n=>String(n.className)==="cosmic-house-entry").length,12);
});
test("All three pages load the Chart Atlas before the chart renderer",()=>{
 for(const path of ["public/profile.html","public/profile-edit.html","public/miss-chaos.html"]){
  const source=read(path);
  assert.ok(source.indexOf("cosmic-insights.js")>=0);
  assert.ok(source.indexOf("cosmic-insights.js")<source.indexOf("cosmic-chart.js"));
 }
 for(const path of ["public/cosmic-insights.js","public/cosmic-chart.js"])assert.doesNotThrow(()=>new Script(read(path)));
});
