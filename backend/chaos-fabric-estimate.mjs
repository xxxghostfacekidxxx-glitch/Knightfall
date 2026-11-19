/**
 * Deterministic shelf-layout estimate for flat, rectangular pattern pieces.
 * Sizes must be the actual CUT sizes, including user-chosen seam allowances.
 * Grain direction is preserved: no automatic 90-degree rotation.
 */
const real=(x,min,max)=>typeof x==="number"&&Number.isFinite(x)&&x>=min&&x<=max;
const round=(x)=>Number(x.toFixed(3));
export function estimateFabric({fabric_width_in,pieces,reserve_percent=0,cost_per_yard=null}={}){
 if(!real(fabric_width_in,1,240))throw Error("Provide the usable fabric width in inches (1–240).");
 if(!Array.isArray(pieces)||!pieces.length||pieces.length>24)throw Error("Provide 1–24 measured cut pieces.");
 if(!real(reserve_percent,0,100))throw Error("Reserve percentage must be between 0 and 100.");
 if(cost_per_yard!==null&&!real(cost_per_yard,0,10000))throw Error("Invalid price per yard.");
 let units=0,area=0;
 const rectangles=[];
 for(let i=0;i<pieces.length;i++){
   const p=pieces[i];
   if(!p||typeof p!=="object"||Array.isArray(p)||!real(p.width_in,0.01,240)||
     !real(p.height_in,0.01,240)||!Number.isInteger(p.count)||p.count<1||p.count>50)
      throw Error("Each cut piece needs measured width, height and integer count.");
   if(p.width_in>fabric_width_in+1e-8)throw Error("One cut piece exceeds the usable fabric width; choose wider fabric or redesign.");
   units+=p.count;if(units>120)throw Error("Cut list is limited to 120 pieces.");
   area+=p.width_in*p.height_in*p.count;
   const name=typeof p.name==="string"?p.name.trim().slice(0,60):"Piece "+(i+1);
   for(let j=0;j<p.count;j++)rectangles.push({name,width:p.width_in,height:p.height_in});
 }
 // First-fit decreasing by height: a useful conservative cutting-plan estimate,
 // never a guarantee of optimal nesting or a production-ready marker.
 rectangles.sort((a,b)=>b.height-a.height||b.width-a.width);
 const rows=[];
 for(const piece of rectangles){
  let row=rows.find(row=>piece.width<=fabric_width_in-row.used_width+1e-8);
  if(!row){row={used_width:0,height:piece.height,items:[]};rows.push(row);}
  row.used_width+=piece.width;
  row.height=Math.max(row.height,piece.height);
  row.items.push({name:piece.name,width_in:piece.width,height_in:piece.height});
 }
 const length=rows.reduce((sum,row)=>sum+row.height,0);
 const orderLength=length*(1+reserve_percent/100);
 const yards=orderLength/36;
 const result={
  source:"deterministic rectangular shelf-layout estimate",units:"inches",fabric_width_in,
  piece_count:units,cut_area_sq_in:round(area),theoretical_min_length_in:round(area/fabric_width_in),
  layout_length_in:round(length),reserve_percent,
  estimated_order_length_in:round(orderLength),estimated_yards:round(yards),
  estimated_meters:round(orderLength*0.0254),
  rows:rows.map(row=>({height_in:round(row.height),used_width_in:round(row.used_width),
   piece_names:row.items.map(item=>item.name)})),
  limitations:"Approximate no-rotation rectangular layout, not an optimal nesting or cutting pattern. Actual yardage depends on grain, nap, prints, shrinkage, folds, seam allowances, and fabric flaws. Add reserve as needed; verify before buying."
 };
 if(cost_per_yard!==null){
   result.cost_per_yard=cost_per_yard;
   result.estimated_material_cost=round(yards*cost_per_yard);
 }
 return result;
}
