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
