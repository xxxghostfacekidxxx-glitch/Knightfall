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
export function chaosWordCount({text}) {
  const value=String(text||"").slice(0,12000);
  const words=value.trim().match(/\S+/g)||[];
  return {words:words.length,characters:value.length,lines:value?value.split(/\r?\n/).length:0,estimatedReadingMinutes:Math.ceil(words.length/200)};
}
