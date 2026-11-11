import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext,Script} from "node:vm";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
function load(){
 const window={};
 runInNewContext(read("public/cosmic-lexicon.js"),{window,Math,Number,Object,Array});
 return window.KnightfallCosmicLexicon;
}
const sample={
 zodiac:"tropical",house_system:"Whole sign",ascendant_sign:"Cancer",midheaven_sign:"Aries",ascendant_degree:12,
 bodies:{
  Sun:{sign:"Aries",degree:10},Moon:{sign:"Libra",degree:11},
  Mercury:{sign:"Aries",degree:12,retrograde:true},Venus:{sign:"Taurus",degree:8},
  Mars:{sign:"Leo",degree:7},Jupiter:{sign:"Sagittarius",degree:4},
  Saturn:{sign:"Capricorn",degree:25},Uranus:{sign:"Aquarius",degree:20},
  Neptune:{sign:"Pisces",degree:18},Pluto:{sign:"Scorpio",degree:20},
  "North Node":{sign:"Libra",degree:6},"South Node":{sign:"Aries",degree:6}
 },
 house_placements:{Sun:10,Moon:4,Mercury:10,Venus:11,Mars:2,Jupiter:6,Saturn:7,Uranus:8,Neptune:9,Pluto:5,"North Node":4,"South Node":10}
};
test("12 signs and all planets carry useful, distinct symbolic descriptions",()=>{
 const lib=load();
 assert.equal(Object.keys(lib.SIGNS).length,12);
 assert.equal(Object.keys(lib.PLANETS).length,12);
 assert.equal(lib.HOUSES.length,12);
 for(const [name,body] of Object.entries(sample.bodies)){
  const reading=lib.placement(sample,name);
  assert.ok(reading, "missing "+name);
  assert.equal(reading.sign,body.sign);
  assert.ok(reading.reading.length>150,name+" interpretation too generic");
  assert.ok(reading.question.length>40,name+" reflection missing");
  assert.match(reading.tension,/not traits established by a chart/);
 }
 const sun=lib.placement(sample,"Sun"),moon=lib.placement(sample,"Moon");
 assert.notEqual(sun.reading,moon.reading);
 assert.ok(sun.reading.includes("Aries"));
 assert.equal(sun.house,10);
 assert.match(sun.houseReading,/house 10/);
});
test("retrograde explanations are conditional and not falsely attributed",()=>{
 const lib=load(),mercury=lib.placement(sample,"Mercury"),venus=lib.placement(sample,"Venus");
 assert.match(mercury.retrograde,/Calculated retrograde/);
 assert.equal(venus.retrograde,null);
 const nonsense={bodies:{Mercury:{sign:"Planet X",degree:3}}};
 assert.equal(lib.placement(nonsense,"Mercury"),null);
 assert.equal(lib.placement(sample,"MissingPlanet"),null);
});
test("house guide works for all 12 with derived occupants, signs and recorded angles",()=>{
 const lib=load(),houses=lib.houseGuide(sample);
 assert.equal(houses.length,12);
 assert.equal(houses[0].sign,"Cancer");
 assert.equal(houses[9].sign,"Aries");
 assert.ok(houses[9].occupants.includes("Sun"));
 assert.ok(houses[6].occupants.includes("Saturn"));
 assert.ok(houses.every(h=>h.question.length>20&&h.title.length>7));
 assert.equal(lib.angles(sample).length,2);
 assert.equal(lib.angles(sample)[0].sign,"Cancer");
});
test("unknown birth time never yields fabricated angles, house descriptions, or chart ruler assumptions",()=>{
 const lib=load();
 const uncertain={...sample,time_precision:"unknown"};
 assert.equal(lib.houseGuide(uncertain).length,0);
 assert.equal(lib.angles(uncertain).length,0);
 const sun=lib.placement(uncertain,"Sun");
 assert.equal(sun.house,null);
 assert.equal(sun.houseReading,null);
 const summary=lib.brief(uncertain);
 assert.match(summary,/Birth time unknown/);
 assert.match(summary,/exclude Rising, Midheaven and houses/);
 assert.doesNotMatch(summary,/Angles:/);
});
test("transit spotlight combines calculated moving/natal aspects with distinct symbolic themes",()=>{
 const lib=load();
 const moving={bodies:{
  Mars:{sign:"Libra",degree_in_sign:10},
  Venus:{sign:"Aries",degree_in_sign:10}
 }};
 const a={transit:"Mars",natal:"Sun",type:"Opposition",orb:0.18};
 const guide=lib.transitGuide(sample,moving,a);
 assert.equal(guide.title,"Transit Mars opposition natal Sun");
 assert.equal(guide.house,10);
 assert.match(guide.summary,/Mars concerns energy, action/);
 assert.match(guide.summary,/natal Sun concerns identity/);
 assert.match(guide.summary,/house 10/);
 assert.match(guide.reflection,/middle ground/);
 assert.match(guide.disclaimer,/not an event prediction/);
 const conjunct=lib.transitGuide(sample,moving,{transit:"Venus",natal:"Sun",type:"Conjunction",orb:1.1});
 assert.ok(conjunct.summary.includes("intensified"));
 assert.notEqual(guide.summary,conjunct.summary);
});
test("transit explanations protect uncertain birth time and reject nonexistent or over-orb aspects",()=>{
 const lib=load();
 const moving={bodies:{Mars:{sign:"Libra",degree_in_sign:10}}};
 const a={transit:"Mars",natal:"Sun",type:"Opposition",orb:0};
 const uncertain={...sample,time_precision:"unknown"};
 const g=lib.transitGuide(uncertain,moving,a);
 assert.equal(g.house,null);
 assert.match(g.summary,/birth time is unknown/);
 assert.doesNotMatch(g.summary,/house 10/);
 assert.equal(lib.transitGuide(sample,moving,{...a,orb:2.1}),null);
 assert.equal(lib.transitGuide(sample,moving,{...a,type:"Unicorn"}),null);
 assert.equal(lib.transitGuide(sample,moving,{...a,transit:"Missing"}),null);
 assert.match(lib.transitBrief(sample,moving,[a]),/Mars opposition natal Sun/);
 assert.match(lib.transitBrief(sample,moving,[]),/No major transit-to-natal aspects/);
});
test("the interpretive code does not network, track, or store raw birth records",()=>{
 const source=read("public/cosmic-lexicon.js");
 assert.doesNotThrow(()=>new Script(source));
 assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|document\.cookie/);
 const summary=load().brief(sample);
 assert.ok(summary.length<=1250);
 assert.doesNotMatch(summary,/latitude|longitude|UTC:|birth timestamp/);
});
test("pages load lexicon before atlas and renderer",()=>{
 for(const path of ["public/profile.html","public/profile-edit.html","public/miss-chaos.html"]){
  const html=read(path);
  const positions=["cosmic-lexicon.js","cosmic-insights.js","cosmic-chart.js"].map(x=>html.indexOf(x));
  assert.ok(positions.every(x=>x>=0),path+" missing lexicon script");
  assert.ok(positions[0]<positions[1]&&positions[1]<positions[2],path+" scripts out of order");
 }
});
