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
 const Option=(label,value)=>{const x=new Element("option");x.textContent=label;x.value=value;return x;};
 return {document,Option,Element};
}
function mount(){
 const {document,Option,Element}=makeDOM(),window={};
 const context={window,document,Option,Math,Number,Object,Array,Date,console};
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
test("All three pages load the Chart Atlas before the chart renderer",()=>{
 for(const path of ["public/profile.html","public/profile-edit.html","public/miss-chaos.html"]){
  const source=read(path);
  assert.ok(source.indexOf("cosmic-insights.js")>=0);
  assert.ok(source.indexOf("cosmic-insights.js")<source.indexOf("cosmic-chart.js"));
 }
 for(const path of ["public/cosmic-insights.js","public/cosmic-chart.js"])assert.doesNotThrow(()=>new Script(read(path)));
});
