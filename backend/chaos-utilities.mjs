/** Pure, bounded utilities suitable for Cloudflare Workers and tool calling. */
export function chaosCalculate({expression}) {
  const input=String(expression||"").trim();
  if(input.length>100 || !/^[0-9+*/().%\s-]+$/.test(input)) throw Error("Use numbers and arithmetic operators only.");
  if ((input.match(/\(/g)||[]).length>20) throw Error("Expression nesting exceeds limit.");
  const tokens=input.match(/\d+(?:\.\d+)?|[()+*/%-]/g)||[];
  if(tokens.join("")!==input.replace(/\s/g,"")) throw Error("Invalid expression.");
  let pos=0;
  function atom(){
    const token=tokens[pos++];
    if(token==="("){const n=expr();if(tokens[pos++]!==")")throw Error("Missing closing parenthesis.");return n;}
    if(token==="-")return -atom();
    if(token==="+")return atom();
    if(!token||!/^[0-9]/.test(token))throw Error("Expected number.");
    return Number(token);
  }
  function product(){
    let n=atom();
    while(["*","/","%"].includes(tokens[pos])){
      const op=tokens[pos++],v=atom();
      n=op==="*"?n*v:op==="/"?n/v:n%v;
    }
    return n;
  }
  function expr(){
    let n=product();
    while(["+","-"].includes(tokens[pos])){
      const op=tokens[pos++],v=product();n=op==="+"?n+v:n-v;
    }
    return n;
  }
  const result=expr();
  if(pos!==tokens.length||!Number.isFinite(result))throw Error("Invalid or non-finite result.");
  return {expression:input,result};
}
// Deterministic conversions for common maker, sewing and repair measurements.
const CONVERSION_UNITS=Object.freeze({
  mm:["length",0.001],cm:["length",0.01],m:["length",1],km:["length",1000],
  in:["length",0.0254],ft:["length",0.3048],yd:["length",0.9144],mi:["length",1609.344],
  cm2:["area",0.0001],m2:["area",1],in2:["area",0.00064516],ft2:["area",0.09290304],yd2:["area",0.83612736],
  mg:["mass",0.000001],g:["mass",0.001],kg:["mass",1],oz:["mass",0.028349523125],lb:["mass",0.45359237],
  ml:["volume",0.001],l:["volume",1],tsp:["volume",0.00492892159375],tbsp:["volume",0.01478676478125],
  cup:["volume",0.2365882365],pt:["volume",0.473176473],qt:["volume",0.946352946],gal:["volume",3.785411784],
  c:["temperature",1],f:["temperature",1],k:["temperature",1]
});
export function chaosConvert({value,from,to}={}){
  if(typeof value!=="number"||!Number.isFinite(value)||Math.abs(value)>1e12)throw Error("Enter a finite numeric value.");
  if(typeof from!=="string"||typeof to!=="string"||!Object.hasOwn(CONVERSION_UNITS,from)||!Object.hasOwn(CONVERSION_UNITS,to))
    throw Error("Unsupported conversion units.");
  const [dimension,factor]=CONVERSION_UNITS[from], [targetDimension,targetFactor]=CONVERSION_UNITS[to];
  if(dimension!==targetDimension)throw Error("Cannot convert between different measurement types.");
  if(dimension!=="temperature"&&value<0)throw Error("Use a nonnegative size or quantity.");
  let result;
  if(dimension==="temperature"){
    const celsius=from==="c"?value:from==="f"?(value-32)*5/9:value-273.15;
    if(celsius < -273.15000000001)throw Error("Temperature below absolute zero.");
    result=to==="c"?celsius:to==="f"?celsius*9/5+32:celsius+273.15;
  }else result=value*factor/targetFactor;
  if(!Number.isFinite(result))throw Error("Conversion out of range.");
  return {value,from,to,result:Number(result.toPrecision(12)),dimension,source:"standard unit conversion factors"};
}
export function chaosWordCount({text}) {
  const value=String(text||"").slice(0,12000);
  const words=value.trim().match(/\S+/g)||[];
  return {words:words.length,characters:value.length,lines:value?value.split(/\r?\n/).length:0,estimatedReadingMinutes:Math.ceil(words.length/200)};
}
