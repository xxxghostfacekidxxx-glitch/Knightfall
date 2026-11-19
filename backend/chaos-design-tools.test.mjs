import test from "node:test";
import assert from "node:assert/strict";
import {checkChaosContrast,scaleChaosPattern} from "./chaos-design-tools.mjs";
import {dispatchChaosTool,describeChaosTools} from "./chaos-tool-dispatch.mjs";
import {inferWithChaosTools} from "./chaos-model-tools.mjs";

test("WCAG contrast math and short hex normalization",()=>{
 const high=checkChaosContrast({foreground:"#fff",background:"#000"});
 assert.equal(high.contrast_ratio,21);
 assert.equal(high.foreground,"#FFFFFF");
 assert.equal(high.passes.aaa_normal,true);
 assert.equal(checkChaosContrast({foreground:"#777",background:"#fff"}).passes.aa_normal,false);
 assert.equal(checkChaosContrast({foreground:"#000",background:"#fff"}).best_black_or_white_text,"#000000");
});
test("color tool rejects invalid, transparent and named colors",()=>{
 for(const value of ["red","#1234","#ff001122","#ggg",null]){
  assert.throws(()=>checkChaosContrast({foreground:value,background:"#fff"}),/hex|opaque/);
 }
});
test("pattern scaling holds known seams fixed and accepts exact reference ratio",()=>{
 const r=scaleChaosPattern({pieces:[{name:"Panel",width_in:12,height_in:16,count:2}],
  scale_percent:125,seam_in:0.5,round_to_in:0.0625});
 assert.equal(r.pieces[0].width_in,14.75);
 assert.equal(r.pieces[0].height_in,19.75);
 assert.equal(r.piece_count,2);
 assert.equal(r.seam_in,0.5);
 const direct=scaleChaosPattern({pieces:[{width_in:10,height_in:20,count:1}],
  from_measure_in:40,to_measure_in:60});
 assert.equal(direct.scale_percent,150);
 assert.equal(direct.pieces[0].width_in,15);
});
test("pattern scaling rejects absent, conflicting and impossible measurements",()=>{
 const pieces=[{width_in:10,height_in:20,count:1}];
 for(const input of [{pieces},{pieces,scale_percent:125,from_measure_in:1,to_measure_in:2},
  {pieces,scale_percent:1000},{pieces,scale_percent:125,seam_in:6},
  {pieces:[{width_in:10,height_in:20,count:1.1}],scale_percent:125},
  {pieces,scale_percent:125,round_to_in:0.3},{pieces,from_measure_in:10},
  {pieces,from_measure_in:10,to_measure_in:100}])
  assert.throws(()=>scaleChaosPattern(input));
});
test("both tools are public, callable, and do not grant elevated permissions",async()=>{
 assert.ok(describeChaosTools(null).includes("design.color_contrast"));
 assert.ok(describeChaosTools(null).includes("forge.scale_pattern"));
 const c=await dispatchChaosTool({name:"design.color_contrast",input:{foreground:"#ffffff",background:"#000000"}});
 assert.equal(c.contrast_ratio,21);
 const p=await dispatchChaosTool({name:"forge.scale_pattern",input:{pieces:[{width_in:8,height_in:10,count:1}],scale_percent:200}});
 assert.equal(p.pieces[0].width_in,16);
 await assert.rejects(dispatchChaosTool({name:"god.diagnostics",input:{},principal:{id:1,role:"member"}}),/Not authorized/);
});
test("clear contrast question executes without a separate AI planner",async()=>{
 let calls=0,options;
 const ai={run:async(_model,opts)=>{calls++;options=opts;return{response:"Checked."};}};
 const r=await inferWithChaosTools({ai,model:"fast",messages:[{role:"system",content:"base"},
  {role:"user",content:"Check contrast between #fff and #000"}]});
 assert.equal(r.response,"Checked.");
 assert.equal(calls,1);
 assert.match(options.messages[0].content,/contrast_ratio/);
 assert.match(options.messages[0].content,/21/);
});
test("clear measured scale request also bypasses AI planner",async()=>{
 let calls=0,options;
 const ai={run:async(_model,opts)=>{calls++;options=opts;return{response:"Scaled."};}};
 await inferWithChaosTools({ai,model:"fast",messages:[{role:"user",content:"Scale a panel 12 x 16 inches by 125%"}]});
 assert.equal(calls,1);
 assert.match(options.messages[0].content,/15/);
});
