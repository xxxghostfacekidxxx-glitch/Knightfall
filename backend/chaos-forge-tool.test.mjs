import test from "node:test";
import assert from "node:assert/strict";
import {makeChaosPatternDraft} from "./chaos-forge-tool.mjs";
test("Measured templates produce a real cut list and editable Forge link",()=>{
 for(const template of ["tote","pouch","apron","skirt","box"]){
  const draft=makeChaosPatternDraft({template,width_in:16,height_in:18,depth_in:4,seam_in:.5});
  assert.equal(draft.available,true);
  assert.equal(draft.template,template);
  assert.ok(draft.cut_pieces.length>0);
  assert.ok(draft.cut_pieces.every(p=>p.bounding_width_in>0&&p.bounding_height_in>0));
  assert.equal(new URL(draft.design_url).hostname,"ash-fall.com");
  assert.equal(new URL(draft.design_url).searchParams.get("width"),"16");
  assert.match(draft.caution,/Drafting aid/);
 }
});
test("Missing size refuses to fabricate dimensions",()=>{
 const p=makeChaosPatternDraft({template:"tote",width_in:16});
 assert.deepEqual(p.needs,["height_in","depth_in"]);
 assert.equal(p.available,false);
});
test("Unsafe sizes, unsupported templates and oversized designs are refused",()=>{
 assert.throws(()=>makeChaosPatternDraft({template:"box",width_in:-5,height_in:5,depth_in:2}),/Width/);
 assert.equal(makeChaosPatternDraft({template:"tshirt"}).available,false);
 assert.throws(()=>makeChaosPatternDraft({template:"box",width_in:100000,height_in:5,depth_in:2}),/Width/);
});
test("Optional fabric-width input computes an approximate material budget, not hidden dimensions",()=>{
 const draft=makeChaosPatternDraft({template:"tote",width_in:16,height_in:18,depth_in:4,
   seam_in:0.5,fabric_width_in:44,reserve_percent:10,cost_per_yard:12});
 assert.equal(draft.available,true);
 assert.equal(draft.fabric_estimate.fabric_width_in,44);
 assert.equal(draft.fabric_estimate.piece_count,draft.cut_pieces.reduce((n,p)=>n+p.count,0));
 assert.ok(draft.fabric_estimate.estimated_material_cost>0);
 assert.match(draft.fabric_estimate.limitations,/Approximate/);
 const plain=makeChaosPatternDraft({template:"tote",width_in:16,height_in:18,depth_in:4});
 assert.equal(plain.fabric_estimate,undefined);
});
test("Default seam is explicit, never assumed silently",()=>{
 const p=makeChaosPatternDraft({template:"tote",width_in:16,height_in:18,depth_in:4});
 assert.equal(p.seam_assumed,true);
 assert.equal(p.measurements.seam,0.5);
});
