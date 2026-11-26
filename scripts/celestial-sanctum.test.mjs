import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseDay,reduceNumber,lifePath,arcana,drawCards,skySnapshot,skyAspects,studies,planets} from "../public/celestial-core.mjs";
test("valid dates, master numbers and reproducible digit-sum convention",()=>{
 assert.equal(parseDay("2000-02-29").toISOString(),"2000-02-29T12:00:00.000Z");
 for(const v of ["2026-02-29","2024-04-31","2024-13-01","2024-2-01","1899-01-01",""])assert.throws(()=>parseDay(v));
 assert.deepEqual(lifePath("2000-01-08"),{sum:11,number:11});
 assert.equal(reduceNumber(29),11);assert.equal(reduceNumber(38),11);assert.equal(reduceNumber(44),8);
});
test("complete major arcana and nonrepeating draws",()=>{
 assert.equal(arcana.length,22);assert.equal(new Set(arcana.map(c=>c[1])).size,22);
 assert.deepEqual(drawCards(3,()=>0).map(c=>c[1]),["The Fool","The Magician","The High Priestess"]);
 assert.throws(()=>drawCards(2));assert.throws(()=>drawCards(1,()=>1));
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
 assert.equal(studies.length,9);assert.doesNotMatch(js,/localStorage|sessionStorage|fetch\(/);assert.doesNotMatch(js,/\.innerHTML/);
});
