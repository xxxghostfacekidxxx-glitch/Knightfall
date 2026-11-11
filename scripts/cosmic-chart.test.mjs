import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext,Script} from "node:vm";

const file=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const load=path=>{
  const window={};
  runInNewContext(file(path),{window,Intl,Date,Math,console});
  return window;
};
const sample={
  zodiac:"tropical",
  house_system:"Whole sign",
  ascendant_sign:"Cancer",
  ascendant_degree:12,
  bodies:{
    Sun:{sign:"Aries",degree:10,retrograde:false},
    Moon:{sign:"Libra",degree:10,retrograde:false},
    Mercury:{sign:"Aries",degree:12,retrograde:false},
    Venus:{sign:"Leo",degree:10,retrograde:false},
    Mars:{sign:"Taurus",degree:2,retrograde:false},
    Jupiter:{sign:"Sagittarius",degree:10,retrograde:false},
    Saturn:{sign:"Capricorn",degree:10,retrograde:false}
  },
  house_placements:{Sun:10,Moon:4,Mercury:10,Venus:2,Mars:11,Jupiter:6,Saturn:7}
};

test("current-season and historical DST offsets resolve using birth-place zone",()=>{
  const clock=load("public/cosmic-timezone.js").KnightfallBirthTime;
  assert.equal(clock.resolve("2026-06-15T12:00","America/Chicago").chosen.utc,"2026-06-15T17:00:00.000Z");
  assert.equal(clock.resolve("2026-01-15T12:00","America/Chicago").chosen.utc,"2026-01-15T18:00:00.000Z");
  assert.equal(clock.resolve("2026-06-15T12:00","Asia/Kolkata").chosen.utc,"2026-06-15T06:30:00.000Z");
  assert.throws(()=>clock.resolve("2026-06-15T12:00","Not/AZone"),/Unknown time zone/);
});
test("DST skipped times are rejected and repeated times must have an explicit occurrence",()=>{
  const clock=load("public/cosmic-timezone.js").KnightfallBirthTime;
  assert.throws(()=>clock.resolve("2026-03-08T02:30","America/Chicago"),/does not exist/);
  const first=clock.resolve("2026-11-01T01:30","America/Chicago","earlier");
  const second=clock.resolve("2026-11-01T01:30","America/Chicago","later");
  assert.equal(first.ambiguous,true);
  assert.equal(second.ambiguous,true);
  assert.equal(first.chosen.utc,"2026-11-01T06:30:00.000Z");
  assert.equal(second.chosen.utc,"2026-11-01T07:30:00.000Z");
});
test("derived profile charts produce valid aspects and interpretable non-deterministic drafts",()=>{
  const cosmic=load("public/cosmic-chart.js").KnightfallCosmic;
  const aspects=cosmic.aspects(sample);
  assert.ok(aspects.some(a=>a.a==="Sun"&&a.b==="Moon"&&a.type==="Opposition"));
  assert.ok(aspects.some(a=>a.a==="Sun"&&a.b==="Mercury"&&a.type==="Conjunction"));
  const prompt=cosmic.prompt(sample);
  assert.match(prompt,/Rising: Cancer/);
  assert.match(prompt,/in house 10/);
  assert.match(prompt,/not a scientific prediction/);
  assert.ok(prompt.length<=3900);
  assert.ok(!prompt.includes("birth date")&&!prompt.includes("latitude"));
});
test("saved derived natal placements support personalized current transit aspects without birth timestamps",()=>{
  const cosmic=load("public/cosmic-chart.js").KnightfallCosmic;
  const transits={bodies:{Mars:{sign:"Libra",degree_in_sign:10},Venus:{sign:"Aries",degree_in_sign:10}}};
  const events=cosmic.transitAspects(transits,sample);
  assert.ok(events.some(a=>a.transit==="Mars"&&a.natal==="Sun"&&a.type==="Opposition"));
  assert.ok(events.some(a=>a.transit==="Venus"&&a.natal==="Sun"&&a.type==="Conjunction"));
  assert.ok(events.every(a=>a.orb<=2));
});
test("synastry only compares supplied derived charts and reports grounded aspect orbs",()=>{
  const cosmic=load("public/cosmic-chart.js").KnightfallCosmic;
  const partner={bodies:{Sun:{sign:"Libra",degree:10},Moon:{sign:"Leo",degree:10}}};
  const links=cosmic.synastry(sample,partner);
  assert.ok(links.some(a=>a.first==="Sun"&&a.second==="Sun"&&a.type==="Opposition"));
  assert.ok(links.every(a=>a.orb<=4));
  assert.ok(links.length>0);
});
test("Cosmic UI is wired to public and private profile surfaces with no automatic send",()=>{
  const profile=file("public/profile.html"),editor=file("public/profile-edit.html"),chaos=file("public/miss-chaos.html");
  const profileJs=file("public/profile.js"),chaosJs=file("public/miss-chaos.js");
  for(const html of [profile,editor,chaos]){
    assert.match(html,/cosmic-chart\.js/);
    assert.match(html,/cosmic-chart\.css/);
  }
  for(const html of [editor,chaos])assert.match(html,/cosmic-timezone\.js/);
  assert.match(profileJs,/KnightfallCosmic\.render/);
  assert.match(editor,/showBirthChart\(result\.chart\)/);
  assert.match(chaosJs,/\/api\/profile\/birth-chart/);
  assert.match(chaosJs,/astro-city-search/);
  assert.match(chaosJs,/Review the interpretation draft before sending/);
  assert.match(editor,/id="birth-chart-time-unknown"/);
  assert.match(chaos,/id="astro-time-unknown"/);
  assert.match(editor,/time_unknown:true/);
  assert.match(chaosJs,/time_precision="unknown"/);
  for(const js of ["public/cosmic-chart.js","public/cosmic-timezone.js","public/profile.js","public/miss-chaos.js"])
    assert.doesNotThrow(()=>new Script(file(js),{filename:js}));
});
