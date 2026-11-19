import test from "node:test";
import assert from "node:assert/strict";
import {estimateFabric} from "./chaos-fabric-estimate.mjs";
test("shelf layout estimates simple measured fabric pieces without inventing allowances",()=>{
 const r=estimateFabric({fabric_width_in:44,pieces:[
  {name:"front",width_in:20,height_in:36,count:1},
  {name:"back",width_in:20,height_in:36,count:1}
 ]});
 assert.equal(r.layout_length_in,36);
 assert.equal(r.piece_count,2);
 assert.equal(r.cut_area_sq_in,1440);
 assert.equal(r.estimated_yards,1);
 assert.equal(r.rows.length,1);
 assert.equal(r.theoretical_min_length_in,Number((1440/44).toFixed(3)));
});
test("separate rows preserve orientation and reserve affects buying length",()=>{
 const r=estimateFabric({fabric_width_in:20,reserve_percent:25,cost_per_yard:12,pieces:[
  {name:"panel",width_in:15,height_in:30,count:2}
 ]});
 assert.equal(r.rows.length,2);
 assert.equal(r.layout_length_in,60);
 assert.equal(r.estimated_order_length_in,75);
 assert.equal(r.estimated_material_cost,25);
});
test("reject missing sizes, invalid counts, impossible fabric widths, and huge work",()=>{
 for(const input of [
  {},{fabric_width_in:40,pieces:[]},
  {fabric_width_in:40,pieces:[{name:"oversized",width_in:50,height_in:12,count:1}]},
  {fabric_width_in:40,pieces:[{width_in:5,height_in:10,count:1.5}]},
  {fabric_width_in:40,pieces:[{width_in:-1,height_in:10,count:1}]},
  {fabric_width_in:40,pieces:[{width_in:1,height_in:1,count:121}]},
  {fabric_width_in:40,reserve_percent:101,pieces:[{width_in:1,height_in:1,count:1}]}
 ])assert.throws(()=>estimateFabric(input));
});
test("all numerical outputs are finite with mixed narrow/long pieces",()=>{
 const r=estimateFabric({fabric_width_in:36,pieces:[
  {name:"strap",width_in:2,height_in:35,count:12},
  {name:"body",width_in:16,height_in:18,count:2}
 ]});
 for(const k of ["layout_length_in","estimated_order_length_in","estimated_yards","cut_area_sq_in"])
  assert.ok(Number.isFinite(r[k]));
 assert.ok(r.layout_length_in>=r.theoretical_min_length_in);
});
