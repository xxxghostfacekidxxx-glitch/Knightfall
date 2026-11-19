import {draftPattern} from "../public/chaos-forge-core.mjs";
import {estimateFabric} from "./chaos-fabric-estimate.mjs";
/** Produce only measured prototype drafting summaries, not invented sizes or hidden construction. */
const TYPES=new Set(["tote","pouch","apron","skirt","box"]);
const num=x=>typeof x==="number"&&Number.isFinite(x)?x:typeof x==="string"&&x.trim()!==""&&Number.isFinite(Number(x))?Number(x):null;
const clean=n=>Number(n.toFixed(3));
export function makeChaosPatternDraft(input={}){
 const template=String(input.template||"").toLowerCase();
 if(!TYPES.has(template))return {available:false,needs:["template"],valid_templates:[...TYPES],note:"Select a supported prototype, not a custom photo reconstruction."};
 const needed=["width_in","height_in","depth_in"].filter(key=>num(input[key])===null);
 if(needed.length)return {available:false,template,needs:needed,note:"Ask for real finished measurements in inches. Do not infer them from a photograph."};
 const width=num(input.width_in),height=num(input.height_in),depth=num(input.depth_in);
 const seam=num(input.seam_in)??0.5;
 const draft=draftPattern(template,{width,height,depth,seam});
 const url=new URL("https://ash-fall.com/chaos-forge.html");
 for(const [k,v]of Object.entries({template,width:clean(width),height:clean(height),depth:clean(depth),seam:clean(seam)}))url.searchParams.set(k,String(v));
 const pieces=draft.pieces.map(p=>{
  const xs=p.points.map(([x])=>x),ys=p.points.map(([,y])=>y);
  return {name:p.name,count:p.count,bounding_width_in:clean(Math.max(...xs)-Math.min(...xs)),
    bounding_height_in:clean(Math.max(...ys)-Math.min(...ys)),notes:p.notes};
 });
 const fabric_estimate=input.fabric_width_in===undefined?null:estimateFabric({
   fabric_width_in:num(input.fabric_width_in),
   pieces:pieces.map(p=>({name:p.name,count:p.count,
     width_in:p.bounding_width_in,height_in:p.bounding_height_in})),
   reserve_percent:input.reserve_percent===undefined?0:num(input.reserve_percent),
   cost_per_yard:input.cost_per_yard===undefined?null:num(input.cost_per_yard)
 });
 return {available:true,source:"Chaos Forge local measured template engine",template,units:"inches",
   measurements:draft.measurements,seam_assumed:input.seam_in===undefined,
   cut_pieces:pieces,assembly:draft.assembly,caution:draft.caution,...(fabric_estimate?{fabric_estimate}:{}),
   design_url:url.toString(),
   next:"Open design_url to view, edit, and export the vector blueprint and 3D preview. Verify real-world dimensions and make a prototype before cutting valuable material."};
}
