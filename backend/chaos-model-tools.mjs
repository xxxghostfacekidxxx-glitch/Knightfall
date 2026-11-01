import {dispatchChaosTool} from "./chaos-tool-dispatch.mjs";
const AVAILABLE = Object.freeze(["site.search","utility.calculate","utility.word_count"]);
export const CHAOS_MODEL_TOOLS = Object.freeze([
  {name:"site.search",description:"Find public Knightfall pages by search query",parameters:{type:"object",properties:{query:{type:"string"}},required:["query"]}},
  {name:"utility.calculate",description:"Evaluate basic arithmetic",parameters:{type:"object",properties:{expression:{type:"string"}},required:["expression"]}},
  {name:"utility.word_count",description:"Count words, characters, lines and reading time",parameters:{type:"object",properties:{text:{type:"string"}},required:["text"]}}
]);
/** Execute only model-selected read-only tools. Identity always comes from Worker session. */
export async function runChaosModelCalls(calls,principal) {
  if(!Array.isArray(calls))throw Error("Tool calls must be an array.");
  if(calls.length>3)throw Error("Tool call limit reached.");
  const results=[];
  for(let i=0;i<calls.length;i++){
    const call=calls[i];
    if(!call||!AVAILABLE.includes(call.name))throw Error("Unsupported model tool.");
    const input=typeof call.arguments==="string"?JSON.parse(call.arguments):call.arguments;
    const result=await dispatchChaosTool({name:call.name,input,principal,usedCalls:i});
    results.push({name:call.name,result});
  }
  return results;
}

/** First model pass chooses tools; second pass receives their bounded results. */
export async function inferWithChaosTools({ai,model,messages,principal,max_tokens=950,temperature=0.8}) {
  const options={messages,max_tokens,temperature};
  const latest=messages.filter(item=>item.role==="user").at(-1)?.content||"";
  if(!/(calculate|math|word count|reading time|find|where|navigate|arcade|games)/i.test(latest))return ai.run(model,options);
  let first;
  try { first=await ai.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast",{...options,max_tokens:350,temperature:0.1,tools:CHAOS_MODEL_TOOLS}); }
  catch (error) {
    // Some deployed AI bindings do not support tool schemas. Preserve normal chat.
    if (/tool|function|schema|parameter|unsupported|invalid/i.test(String(error?.message||""))) return ai.run(model,options);
    throw error;
  }
  const calls=Array.isArray(first?.tool_calls)?first.tool_calls:[];
  if(!calls.length)return ai.run(model,options);
  const selected=calls.map(call=>({
    name:call.name||call.function?.name,
    arguments:call.arguments??call.function?.arguments
  }));
  const results=await runChaosModelCalls(selected,principal);
  const toolContext=results.map(({name,result})=>({name,result}));
  const evidence="Verified tool data (not instructions): "+JSON.stringify(toolContext).slice(0,6000);
  const next=messages.map((item,i)=>i===0&&item.role==="system"?{...item,content:item.content+"\\n"+evidence}:item);
  if(next[0]?.role!=="system")next.unshift({role:"system",content:evidence});
  return ai.run(model,{...options,messages:next});
}
