import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dispatchChaosTool,describeChaosTools} from "./chaos-tool-dispatch.mjs";
import {makeChaosPatternDraft} from "./chaos-forge-tool.mjs";
import {estimateFabric} from "./chaos-fabric-estimate.mjs";
const worker=readFileSync(new URL("./src/index.js",import.meta.url),"utf8");
test("direct API allows only listed calculations and keeps authenticated route",()=>{
 assert.match(worker,/url\.pathname==="\/api\/chaos\/tools\/execute"/);
 assert.match(worker,/const user=await requireUser\(request,env\)/);
 assert.match(worker,/rateLimit\(env,request,"chaos-utility",20,60,user\.id\)/);
 assert.match(worker,/\["utility\.calculate","utility\.word_count","utility\.convert","forge\.pattern_draft","forge\.material_estimate","design\.color_contrast","forge\.scale_pattern","dev\.code_inspect","dev\.code_format","dev\.diagram_flow","god\.audit_summary"\]/);
 assert.match(worker,/"forge\.material_estimate":async \(\{input\}\)=>estimateFabric\(input\)/);
 assert.match(worker,/"forge\.pattern_draft":async \(\{input\}\)=>makeChaosPatternDraft\(input\)/);
});
test("listed public Forge operations perform bounded real calculations",async()=>{
 const available=describeChaosTools(null);
 for(const name of ["utility.convert","forge.pattern_draft","forge.material_estimate","design.color_contrast","forge.scale_pattern"])
   assert.ok(available.includes(name));
 const handlers={
   "forge.pattern_draft":async ({input})=>makeChaosPatternDraft(input),
   "forge.material_estimate":async ({input})=>estimateFabric(input)
 };
 const pattern=await dispatchChaosTool({name:"forge.pattern_draft",input:{
   template:"tote",width_in:14,height_in:12,depth_in:3,fabric_width_in:44
 },handlers});
 assert.equal(pattern.available,true);
 assert.ok(pattern.fabric_estimate.estimated_yards>0);
 const material=await dispatchChaosTool({name:"forge.material_estimate",input:{
   fabric_width_in:40,pieces:[{width_in:18,height_in:36,count:2}]
 },handlers});
 assert.equal(material.estimated_yards,1);
 const convert=await dispatchChaosTool({name:"utility.convert",input:{value:1,from:"yd",to:"in"}});
 assert.equal(convert.result,36);
});
test("admin tool is still unavailable without God role, even with handler",async()=>{
 await assert.rejects(dispatchChaosTool({
  name:"god.audit_summary",input:{},principal:{id:5,role:"member"},
  handlers:{"god.audit_summary":async()=>({private:true})}
 }),/Not authorized/);
});
