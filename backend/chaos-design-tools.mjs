/** Deterministic, read-only design helpers: no network, code execution, or invented measurements. */
const finite=(n,min,max,label)=>{
 if(typeof n!=="number"||!Number.isFinite(n)||n<min||n>max)throw Error(label+" out of range.");
 return n;
};
const round=n=>Number(n.toFixed(4));
function hexColor(text,label){
 if(typeof text!=="string")throw Error(label+" must be a hex color.");
 const raw=text.trim().replace(/^#/,"");
 if(!/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw))throw Error(label+" must be an opaque #RGB or #RRGGBB color.");
 const hex=raw.length===3?raw.split("").map(x=>x+x).join(""):raw;
 return {hex:"#"+hex.toUpperCase(),rgb:[0,2,4].map(n=>parseInt(hex.slice(n,n+2),16))};
}
const lum=rgb=>rgb.map(value=>{const c=value/255;return c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4;})
 .reduce((n,c,i)=>n+c*[0.2126,0.7152,0.0722][i],0);
function contrast(a,b){const [hi,lo]=[lum(a),lum(b)].sort((x,y)=>y-x);return(hi+0.05)/(lo+0.05);}
export function checkChaosContrast(input={}){
 const fg=hexColor(input.foreground,"Foreground"),bg=hexColor(input.background,"Background");
 const ratio=contrast(fg.rgb,bg.rgb);
 const black=contrast([0,0,0],bg.rgb),white=contrast([255,255,255],bg.rgb);
 return {source:"WCAG 2.x sRGB contrast formula",foreground:fg.hex,background:bg.hex,
  contrast_ratio:Number(ratio.toFixed(2)),
  passes:{aa_normal:ratio>=4.5,aa_large:ratio>=3,aaa_normal:ratio>=7,aaa_large:ratio>=4.5},
  best_black_or_white_text:black>=white?"#000000":"#FFFFFF",
  best_text_contrast_ratio:Number(Math.max(black,white).toFixed(2)),
  limits:"Opaque sRGB colors only. Contrast checks alone are not a complete accessibility audit."};
}
export function scaleChaosPattern(input={}){
 if(!input||typeof input!=="object"||Array.isArray(input))throw Error("Invalid pattern input.");
 if(!Array.isArray(input.pieces)||input.pieces.length<1||input.pieces.length>20)throw Error("Supply 1 to 20 measured pieces.");
 const percent=Object.hasOwn(input,"scale_percent");
 const from=Object.hasOwn(input,"from_measure_in"),to=Object.hasOwn(input,"to_measure_in");
 if(percent===(from||to)||from!==to)throw Error("Supply scale_percent OR both original and target measurements.");
 const factor=percent?finite(input.scale_percent,25,400,"Scale percent")/100:
  finite(input.to_measure_in,0.1,1000,"Target measurement")/finite(input.from_measure_in,0.1,1000,"Original measurement");
 if(factor<0.25||factor>4)throw Error("Scale must be between 25 and 400 percent.");
 const seamKnown=Object.hasOwn(input,"seam_in");
 const seam=seamKnown?finite(input.seam_in,0,3,"Seam allowance"):0;
 const rounding=Object.hasOwn(input,"round_to_in")?input.round_to_in:0;
 if(![0,0.03125,0.0625,0.125,0.25].includes(rounding))throw Error("Unsupported rounding increment.");
 let count=0,before=0,after=0;
 const pieces=input.pieces.map((piece,index)=>{
  if(!piece||typeof piece!=="object"||Array.isArray(piece))throw Error("Invalid pattern piece.");
  const name=typeof piece.name==="string"&&piece.name.trim()?piece.name.trim().slice(0,80):"Piece "+(index+1);
  const width=finite(piece.width_in,0.1,500,"Piece width"),height=finite(piece.height_in,0.1,500,"Piece height");
  const n=finite(piece.count,1,24,"Piece count");
  if(!Number.isInteger(n))throw Error("Piece count must be an integer.");
  count+=n;if(count>120)throw Error("Too many pieces.");
  if(width<=2*seam||height<=2*seam)throw Error("Seam allowance exceeds piece dimensions.");
  const resize=old=>{const next=(old-2*seam)*factor+2*seam;return round(rounding?Math.round(next/rounding)*rounding:next);};
  const newWidth=resize(width),newHeight=resize(height);
  if(newWidth<=0||newHeight<=0||newWidth>1500||newHeight>1500)throw Error("Resized piece is out of range.");
  before+=width*height*n;after+=newWidth*newHeight*n;
  return {name,count:n,original_width_in:round(width),original_height_in:round(height),width_in:newWidth,height_in:newHeight};
 });
 return {available:true,source:"Measured Knightfall pattern resize",units:"inches",scale_percent:round(factor*100),
  seam_in:seamKnown?seam:null,round_to_in:rounding,piece_count:count,pieces,
  original_area_sq_in:round(before),resized_area_sq_in:round(after),
  seam_handling:seamKnown?"Supplied seam allowance held fixed on all sides.":"No seam supplied; all cut dimensions scaled.",
  limits:"Uniform panel scaling is not garment grading or image-based measuring. Check grain, fit and closures; make a physical prototype."};
}
