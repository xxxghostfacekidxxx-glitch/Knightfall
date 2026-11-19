import test from "node:test";
import assert from "node:assert/strict";
import {draftPattern,patternSvg,area} from "../public/chaos-forge-core.mjs";
const dims={width:18,height:21,depth:4,seam:.5};
test("all five practical maker templates produce dimensional cut plans",()=>{
 for(const type of ["tote","pouch","apron","skirt","box"]){
  const draft=draftPattern(type,dims);
  assert.ok(draft.pieces.length>0);
  assert.ok(draft.pieces.every(p=>p.count>0&&p.points.length>=4));
  assert.ok(draft.assembly.length>=3);
  const svg=patternSvg(draft);
  assert.match(svg,/width="[\d.]+in"/);
  assert.match(svg,/test rectangle/);
  assert.match(svg,/<svg /);
  assert.ok(!svg.includes("NaN"));
 }
});
test("skirt pattern has front panels and elastic allowance",()=>{
 const p=draftPattern("skirt",dims);
 assert.equal(p.pieces[0].count,2);
 assert.match(p.pieces[1].name,/Elastic/);
});
test("photo trace normalizes outline from known width and aspect ratio",()=>{
 const t=draftPattern("trace",dims,{aspect:1.5,points:[[.1,.1],[.9,.1],[.9,.9],[.1,.9]]});
 assert.equal(t.pieces[0].points.length,4);
 assert.ok(Math.abs(area(t.pieces[0].points))>0.5);
 assert.match(t.caution,/cannot reconstruct/);
});
test("bad measurements and malformed traces are refused",()=>{
 assert.throws(()=>draftPattern("tote",{...dims,width:0}),/Width/);
 assert.throws(()=>draftPattern("shirt",dims),/Unknown/);
 assert.throws(()=>draftPattern("trace",dims,{aspect:1,points:[[0,0],[.5,0]]}),/at least/);
 assert.throws(()=>draftPattern("trace",dims,{aspect:1,points:[[0,0],[1,0],[5,1]]}),/within/);
});
