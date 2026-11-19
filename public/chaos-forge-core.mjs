/** Chaos Forge: original, local-first pattern math. All dimensions are inches.
 * Prototype cut plans only; no hidden measurements inferred from photos.
 */
const allowed=new Set(["tote","pouch","apron","skirt","box","trace"]);
const num=(value,min,max,name)=>{const n=Number(value);if(!Number.isFinite(n)||n<min||n>max)throw Error(name+" must be "+min+"–"+max+" inches.");return Math.round(n*1000)/1000;};
const rect=(w,h)=>[[0,0],[w,0],[w,h],[0,h]];
const poly=(pts)=>pts.map(([x,y])=>[+x.toFixed(4),+y.toFixed(4)]);
const piece=(name,count,points,notes)=>({name,count,points:poly(points),notes});
export function area(points){let a=0;for(let i=0;i<points.length;i++){const p=points[i],q=points[(i+1)%points.length];a+=p[0]*q[1]-q[0]*p[1]}return a/2;}
export function draftPattern(type,measurements,trace=null){
 if(!allowed.has(type))throw Error("Unknown pattern template.");
 const w=num(measurements.width,2,80,"Width"),h=num(measurements.height,2,80,"Height"),
 d=num(measurements.depth,.25,40,"Depth"),s=num(measurements.seam,.125,1.5,"Seam allowance");
 let pieces=[],assembly=[],caution="Drafting aid only. Test a paper or inexpensive-fabric mockup and verify all dimensions.";
 if(type==="tote"){
  pieces=[
   piece("Front & back",2,rect(w+2*s,h+2*s),"Top fold/hem, bottom and side seam allowance included"),
   piece("Side gusset",2,rect(d+2*s,h+2*s),"Match side panels to front/back"),
   piece("Bottom",1,rect(w+2*s,d+2*s),"Cut one reinforced base"),
   piece("Handle strap",2,rect(2.75+2*s,23+2*s),"Fold lengthwise, stitch and attach to body")
  ];
  assembly=["Cut panels along solid outlines; transfer markings before sewing.","Prepare straps and hem or bind the top opening.","Attach side gussets to front/back, right sides together.","Sew base panel to body, finish seam allowances, turn right-side out.","Secure handles through multiple reinforcement stitches."];
 }else if(type==="pouch"){
  pieces=[piece("Front & back",2,rect(w+2*s,h+2*s),"Outer fabric; lining requires matching duplicates"),
   piece("Side gusset",2,rect(d+2*s,h+2*s),"Optional depth on both sides"),
   piece("Bottom",1,rect(w+2*s,d+2*s),"Use when adding gusset depth")];
  assembly=["Cut outside panels; cut duplicate lining panels if lining the pouch.","Attach zipper or closure to upper edges before joining body.","Sew sides and base gussets, then trim bulky corners.","Turn, press, and finish lining/closure."];
 }else if(type==="apron"){
  const top=w*.55+2*s,bottom=w+2*s,body=h+2*s;
  pieces=[piece("Apron body",1,[[0,body],[bottom,body],[(bottom+top)/2,0],[(bottom-top)/2,0]],"Neck/body transition is a simplified trapezoid; confirm bib shape"),
   piece("Neck strap",1,rect(2.75+2*s,27+2*s),"Adjust to wearer; tie or add closure"),
   piece("Waist tie",2,rect(2.75+2*s,24+2*s),"Tie at waist; extend to fit")];
  assembly=["Pin a paper mockup against the wearer and adjust the bib/waist curve.","Cut apron body and strap pieces; finish raw edges.","Fold and stitch straps, leave turning openings as needed.","Hem apron sides and bottom, finish upper edge.","Attach neck and waist ties with reinforced stitching."];
 }else if(type==="skirt"){
  const top=w*.8+2*s,bottom=w*1.2+2*s,length=h+2*s+1.5;
  pieces=[piece("Gathered skirt panel",2,[[0,length],[bottom,length],[(bottom+top)/2,0],[(bottom-top)/2,0]],"Two panels; waist circumference input, generous gathers; verify hip ease"),
   piece("Elastic waistband casing",1,rect(w+3+2*s,3.5+2*s),"Test elastic circumference and actual body/hip clearance")];
  assembly=["Verify that combined panel widths clear the hip circumference before cutting.","Cut two panels; seam them at the sides and finish raw edges.","Join and fold waistband casing, leaving an elastic insertion gap.","Gather or distribute skirt top around casing; stitch evenly.","Insert appropriate elastic, test fit, close casing and hem."];
  caution+=" Skirt uses a rough gathered block, not a fitted professional grading system.";
 }else if(type==="box"){
  const W=w,D=d,H=h;
  const outline=[[0,H],[H,H],[H,H+D],[0,H+D],[0,H],[H,H],[H,0],[H+W,0],[H+W,H],[H+W+H,H],[H+W+H,H+D],[H+W,H+D],[H+W,H+D+H],[H,H+D+H],[H,H+D],[H,H]];
  // Outer perimeter of the box net, without tabs: top/bottom flaps, sidewalls and bottom.
  pieces=[piece("Open box fold net",1,[[H,0],[H+W,0],[H+W,H],[H+W+H,H],[H+W+H,H+D],[H+W,H+D],[H+W,H+D+H],[H,H+D+H],[H,H+D],[0,H+D],[0,H],[H,H]],"Cut outer outline; score four base fold lines. Tape or glue joins; no adhesive tabs are generated")];
  assembly=["Cut the outside perimeter from sturdy paper or cardboard.","Score the four lines around the central "+W+" × "+D+" inch base.","Fold sides up to "+H+" inches; secure adjoining corners with tape or glue.","Check physical fit before cutting thick material."];
  caution+=" Box template is an open-top folded net without built-in glue tabs.";
 }else{
  if(!trace||!Array.isArray(trace.points)||trace.points.length<3||trace.points.length>100)throw Error("Trace at least three points around the visible outline.");
  const aspect=Number(trace.aspect);
  if(!Number.isFinite(aspect)||aspect<.1||aspect>10)throw Error("Invalid reference image proportions.");
  const pts=trace.points.map(p=>{
   if(!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isFinite(n)||n<0||n>1))throw Error("Trace points must be within the reference image.");
   return [p[0]*w,p[1]*w*aspect];
  });
  if(Math.abs(area(pts))<.02)throw Error("Outline area is too small.");
  pieces=[piece("Traced outline",1,pts,"Single-view silhouette scaled to reference WIDTH; seam allowance NOT added. Trace does not reveal hidden faces")];
  assembly=["Confirm the source image was taken straight-on, without strong perspective.","Measure the real-world width of this outline and confirm the scale.","Cut a paper test from the exported outline; adjust hand-traced points.","For sewing, add appropriate seam/hem allowances yourself; for crafts choose material thickness."];
  caution+=" Photo tracing only approximates the silhouette of a flat face. It cannot reconstruct a hidden 3D object.";
 }
 return {type,units:"in",measurements:{width:w,height:h,depth:d,seam:s},pieces,assembly,caution};
}
const esc=text=>String(text).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const f=n=>Number(n.toFixed(4));
const bounds=points=>({minX:Math.min(...points.map(p=>p[0])),minY:Math.min(...points.map(p=>p[1])),maxX:Math.max(...points.map(p=>p[0])),maxY:Math.max(...points.map(p=>p[1]))});
export function patternSvg(draft){
 const pad=.85,gap=1.8,baseline=1.9;
 let x=pad,totalHeight=0;
 const shapes=[];
 for(const part of draft.pieces){
  const b=bounds(part.points),W=b.maxX-b.minX,H=b.maxY-b.minY;
  if(W<.1||H<.1)throw Error("Pattern has a degenerate piece.");
  const points=part.points.map(([px,py])=>[f(px-b.minX+x),f(py-b.minY+baseline)]);
  const d=points.map(([a,b],i)=>(i?"L":"M")+a+" "+b).join(" ")+" Z";
  shapes.push('<path d="'+d+'" fill="none" stroke="#ff3b9d" stroke-width=".028" vector-effect="non-scaling-stroke" />');
  shapes.push('<text x="'+f(x+.12)+'" y="'+f(baseline+Math.min(.45,H*.25))+'" font-size=".25" fill="#16121b">'+esc(part.name)+" × "+part.count+"</text>");
  shapes.push('<text x="'+f(x+.12)+'" y="'+f(baseline+Math.min(.83,H*.4))+'" font-size=".18" fill="#333">'+f(W)+' × '+f(H)+' in</text>');
  x+=W+gap;totalHeight=Math.max(totalHeight,H);
 }
 const width=f(Math.max(8,x-gap+pad)),height=f(totalHeight+baseline+1.1);
 const grid='<defs><pattern id="kf-grid" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M1 0 H0 V1" fill="none" stroke="#9cb4af" stroke-opacity=".35" stroke-width=".012"/></pattern></defs>';
 const label='<text x=".85" y=".52" font-size=".38" font-weight="bold" fill="#28202a">CHAOS FORGE • '+esc(draft.type.toUpperCase())+'</text><text x=".85" y=".91" font-size=".20" fill="#555">Units: inches • Printed at 100% actual size • Prototype only</text>';
 const calibration='<rect x=".85" y="'+f(height-.9)+'" width="1" height=".5" fill="none" stroke="#222" stroke-width=".023"/><text x="2.03" y="'+f(height-.55)+'" font-size=".22" fill="#222">1 in × 0.5 in test rectangle; verify print scale</text>';
 return '<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'in" height="'+height+'in" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Draft pattern, inches">'+grid+
 '<rect width="100%" height="100%" fill="white"/><rect width="100%" height="100%" fill="url(#kf-grid)"/>'+label+shapes.join("")+calibration+'</svg>';
}
