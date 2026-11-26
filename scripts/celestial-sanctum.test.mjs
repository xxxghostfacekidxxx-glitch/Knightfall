import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseDay,reduceNumber,lifePath,arcana,drawCards,skySnapshot,skyAspects,studies,planets,deck,parseUtcMinute,transitAspects,personalYear,nameNumbers,seasonEvents,wheelPoint,celestialEvents,runeLetters,drawRune,geometryPattern,deities,findDeities,zodiacCorrespondences,zodiacFor,houseTopics,planetaryMetals,alchemyStages,tarotMotif} from "../public/celestial-core.mjs";
test("valid dates, master numbers and reproducible digit-sum convention",()=>{
 assert.equal(parseDay("2000-02-29").toISOString(),"2000-02-29T12:00:00.000Z");
 for(const v of ["2026-02-29","2024-04-31","2024-13-01","2024-2-01","1899-01-01",""])assert.throws(()=>parseDay(v));
 assert.deepEqual(lifePath("2000-01-08"),{sum:11,number:11});
 assert.equal(reduceNumber(29),11);assert.equal(reduceNumber(38),11);assert.equal(reduceNumber(44),8);
});
test("complete major arcana and nonrepeating draws",()=>{
 assert.equal(arcana.length,22);assert.equal(new Set(arcana.map(c=>c[1])).size,22);
 assert.deepEqual(drawCards(3,()=>0).map(c=>c[1]),["The Fool","The Magician","The High Priestess"]);
 assert.throws(()=>drawCards(2));assert.equal(drawCards(5,()=>0,'full').length,5);assert.throws(()=>drawCards(1,()=>1));
});
test("sky positions normalize angles, estimate retrograde across zero and detect aspects",()=>{
 const date=parseDay("2026-11-26"),engine={Body:Object.fromEntries(planets.map(n=>[n,n])),GeoVector:(body,time)=>({body,time}),Ecliptic:({body,time})=>({elon:body==="Mercury"?(-(+time-date)/86400000):planets.indexOf(body)*30})};
 const bodies=skySnapshot(engine,date);assert.equal(bodies.length,10);
 assert.equal(bodies[2].retrograde,true);assert.equal(bodies[2].longitude,0);
 assert.equal(bodies[3].sign,"Cancer");
 assert.ok(skyAspects([{name:"A",longitude:359},{name:"B",longitude:1}]).some(a=>a.type==="Conjunction"&&a.orb===2));
 assert.throws(()=>skySnapshot({...engine,Ecliptic:()=>({elon:NaN})},date));
});
test("page has working local anchors, tool assets and offline entries",()=>{
 const html=readFileSync("public/celestial-sanctum.html","utf8"),js=readFileSync("public/celestial-sanctum.mjs","utf8"),sw=readFileSync("public/sw.js","utf8");
 for(const [,id] of js.matchAll(/\$\("([^"]+)"\)/g))assert.ok(html.includes('id="'+id+'"'),id);
 for(const [,id] of html.matchAll(/href="#([^"]+)"/g))assert.ok(html.includes('id="'+id+'"'),id);
 for(const p of ["celestial-sanctum.css","celestial-sanctum.mjs","celestial-core.mjs"])assert.ok(sw.includes('"/'+p+'"'));
 assert.equal(studies.length,33);assert.doesNotMatch(js,/localStorage|sessionStorage|fetch\(/);assert.doesNotMatch(js,/\.innerHTML/);
});

test("78 distinct tarot cards and four complete minor suits",()=>{
 assert.equal(deck.length,78);assert.equal(new Set(deck.map(c=>c[1])).size,78);
 for(const suit of ["Wands","Cups","Swords","Pentacles"])assert.equal(deck.filter(c=>c[4]===suit).length,14);
 assert.equal(new Set(drawCards(5,()=>0.99,"minor")).size,5);
 assert.throws(()=>drawCards(1,Math.random,"unknown"));
});
test("UTC inputs reject rollover and compare cross-chart angles",()=>{
 assert.equal(parseUtcMinute("2000-02-29T23:59").toISOString(),"2000-02-29T23:59:00.000Z");
 for(const value of ["2026-02-29T12:00","2024-02-29T24:00","2024-02-29T12:60","2024-02-29T12:00Z"])assert.throws(()=>parseUtcMinute(value));
 assert.deepEqual(transitAspects([{name:"Moon",longitude:359}],[{name:"Sun",longitude:1}]),[{transit:"Sun",natal:"Moon",type:"Conjunction",orb:2}]);
 assert.equal(transitAspects([{name:"A",longitude:0}],[{name:"B",longitude:3}]).length,0);
});
test("year cycles and Latin-letter numerology are deterministic",()=>{
 assert.equal(personalYear("2000-01-08",2026),1);
 assert.deepEqual(nameNumbers("Éva"),{expression:1,soul:6,personality:4});
 assert.deepEqual(nameNumbers("Y"),{expression:7,soul:null,personality:7});
 assert.throws(()=>nameNumbers("123"));assert.throws(()=>personalYear("2000-01-08",2101));
});
test("season events and zodiac wheel coordinates",()=>{
 const engine={Seasons:()=>Object.fromEntries(["mar_equinox","jun_solstice","sep_equinox","dec_solstice"].map((k,i)=>[k,{date:new Date(Date.UTC(2026,2+i*3,20))}]))};
 assert.equal(seasonEvents(engine,2026).length,4);assert.throws(()=>seasonEvents(engine,2026.1));
 assert.ok(Math.abs(wheelPoint(0,100).x-100)<1e-6);
 assert.ok(Math.abs(wheelPoint(90,100).y-100)<1e-6);
});

test("archive and rune inventories and geometry",()=>{
 assert.equal(new Set(studies.map(s=>s[1])).size,33);assert.equal(runeLetters.length,24);assert.equal(new Set(runeLetters.map(r=>r[0])).size,24);
 assert.equal(drawRune(()=>0)[1],"Fehu");assert.equal(drawRune(()=>0.999)[1],"Othala");assert.throws(()=>drawRune(()=>1));
 assert.equal(geometryPattern("rosette").circles.length,7);const p=geometryPattern("hexagram").paths[0];assert.deepEqual(p[0],p.at(-1));assert.equal(new Set(p.slice(0,-1).map(v=>v.join(","))).size,6);assert.throws(()=>geometryPattern("bad"));
});
test("calendar filters, year boundaries and iteration guards",()=>{
 const dates=[new Date("2026-01-03T00:00:00Z"),new Date("2027-01-01T00:00:00Z")],mock={SearchMoonQuarter:()=>({quarter:2,time:{date:dates[0]}}),NextMoonQuarter:()=>({quarter:3,time:{date:dates[1]}})};
 assert.deepEqual(celestialEvents(mock,2026,"moon"),[{kind:"Moon",name:"Full moon",date:dates[0].toISOString()}]);
 assert.throws(()=>celestialEvents({...mock,NextMoonQuarter:mock.SearchMoonQuarter},2026,"moon"));assert.throws(()=>celestialEvents(mock,2026,"bad"));assert.throws(()=>celestialEvents(mock,2101,"moon"));
});

test("pantheon relationships resolve and filters preserve inventory",()=>{
 assert.equal(deities.length,16);assert.equal(new Set(deities.map(d=>d[0])).size,16);
 for(const d of deities)for(const related of d[6])assert.ok(deities.some(x=>x[0]===related),related);
 assert.ok(findDeities("Osiris").some(d=>d[0]==="osiris"));assert.ok(findDeities("","Creation").every(d=>d[2]==="Creation"));assert.equal(findDeities("no such deity").length,0);
});
test("classical zodiac, houses and alchemy reference inventory",()=>{
 assert.equal(zodiacCorrespondences.length,12);assert.equal(zodiacFor("Scorpio")[3],"Mars");
 for(const e of ["Fire","Earth","Air","Water"])assert.equal(zodiacCorrespondences.filter(x=>x[1]===e).length,3);
 for(const m of ["Cardinal","Fixed","Mutable"])assert.equal(zodiacCorrespondences.filter(x=>x[2]===m).length,4);
 assert.equal(houseTopics.length,12);assert.equal(planetaryMetals.length,7);assert.equal(alchemyStages.length,4);
});
test("all 78 cards resolve to valid original artwork and cached assets",()=>{
 const sw=readFileSync("public/sw.js","utf8");
 for(const card of deck){const m=tarotMotif(card),file=m.kind==="major"?"major-"+m.index+".svg":"suit-"+m.suit+".svg";const path="public/assets/knightfall/celestial/"+file;assert.ok(readFileSync(path,"utf8").includes("<svg"));assert.ok(sw.includes('"/'+path.slice(7)+'"'));}
 for(const d of deities){const path="public/assets/knightfall/celestial/deity-"+d[0]+".svg";assert.ok(readFileSync(path,"utf8").includes("<svg"));assert.ok(sw.includes('"/'+path.slice(7)+'"'));}
 assert.throws(()=>tarotMotif(["","invalid"]));
});
