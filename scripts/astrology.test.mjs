import test from "node:test";
import assert from "node:assert/strict";
import {calculateAstrology,calculateTransits} from "../backend/src/astrology.js";
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
