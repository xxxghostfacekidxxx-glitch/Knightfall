import test from "node:test";
import assert from "node:assert/strict";
import {calculateAstrology,calculateTransits,calculateAngles} from "../backend/src/astrology.js";
test("stable tropical Sun signs at equinoxes and solstices",()=>{
 for(const [date,sign] of [["2026-03-21T12:00:00Z","Aries"],["2026-06-22T12:00:00Z","Cancer"],["2026-09-23T12:00:00Z","Libra"],["2026-12-22T12:00:00Z","Capricorn"]]){
  const chart=calculateAstrology(date);
  assert.equal(chart.bodies.Sun.sign,sign);
  assert.ok(chart.bodies.Sun.longitude>=0&&chart.bodies.Sun.longitude<360);
 }
});
test("all computed longitudes and aspect orbs remain in bounds",()=>{
 for(const date of ["1990-01-01T00:00:00Z","2026-10-26T12:00:00Z","2099-06-01T12:00:00Z"]){
  const chart=calculateAstrology(date);
  assert.equal(Object.keys(chart.bodies).length,9);
  for(const value of Object.values(chart.bodies)){
   assert.ok(value.longitude>=0&&value.longitude<360);
   assert.ok(value.degree_in_sign>=0&&value.degree_in_sign<30);
  }
  for(const a of chart.aspects)assert.ok(a.orb>=0&&a.orb<=4);
 }
});
test("invalid dates and out-of-range years are rejected",()=>{
 for(const value of ["invalid","1800-01-01T00:00:00Z","2200-01-01T00:00:00Z"])assert.throws(()=>calculateAstrology(value));
});

test("transit comparisons include actual calculated positions and bounded aspects",()=>{
 const data=calculateTransits("1994-05-01T12:00:00Z","2026-10-26T12:00:00Z");
 assert.equal(Object.keys(data.transit_bodies).length,9);
 for(const aspect of data.transit_aspects)assert.ok(aspect.orb>=0&&aspect.orb<=2);
 assert.ok(data.transit_aspects.length>0);
});

test("location-based ascendant and equal houses remain consistent",()=>{
 const utc="2000-01-01T12:00:00Z";
 const angles=calculateAngles(utc,40,-74);
 assert.equal(angles.houses.length,12);
 assert.ok(angles.ascendant>=0&&angles.ascendant<360);
 for(let i=0;i<12;i++)assert.ok(Math.abs(angles.houses[i]-((angles.ascendant+i*30)%360))<0.002);
 const chart=calculateAstrology(utc,{latitude:40,longitude:-74});
 assert.equal(Object.keys(chart.house_placements).length,9);
 for(const house of Object.values(chart.house_placements))assert.ok(house>=1&&house<=12);
 assert.notEqual(calculateAngles(utc,40,-74).ascendant,calculateAngles(utc,40,74).ascendant);
});
test("invalid chart coordinates fail rather than invent houses",()=>{
 for(const lat of [-90,90,NaN])assert.throws(()=>calculateAstrology("2000-01-01T12:00:00Z",{latitude:lat,longitude:0}));
});
