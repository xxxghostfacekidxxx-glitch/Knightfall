// Miss Chaos owns routing, identity context and tools; inference engines are replaceable.
export const ENGINES=Object.freeze({
 fast:"@cf/meta/llama-3.1-8b-instruct-fast",
 depth:"@cf/meta/llama-3.3-70b-instruct-fp8-fast",
 creative:"@cf/mistralai/mistral-small-3.1-24b-instruct",
 code:"@cf/qwen/qwen2.5-coder-32b-instruct"
});
export function chooseChaosEngine({message="",mode="economy",mood=""}={}){
 const text=String(message).slice(0,4000);
 if(mode!=="adaptive")return "fast";
 if(/\b(?:debug|refactor|implement|write|review|fix)\b.{0,100}\b(?:code|javascript|typescript|python|function|algorithm|sql|script|program|api)\b/i.test(text)||/\b(?:javascript|typescript|python|sql)\b.{0,60}\b(?:error|bug|code)\b/i.test(text))return "code";
 if(/\b(?:write|draft|invent|create|compose|brainstorm)\b.{0,100}\b(?:story|poem|character|scene|dialogue|song|plot|fiction|concept|design)\b/i.test(text))return "creative";
 if(mood==="astrology"||/\b(?:in depth|in-depth|thoroughly|step.by.step|compare and contrast|detailed analysis|full explanation)\b/i.test(text))return "depth";
 return "fast";
}
function retryable(error){
 const status=Number(error?.status||error?.statusCode||0);
 const msg=String(error?.message||"");
 // Never bypass quotas, policy denials, billing limits or authentication failures.
 if([400,401,402,403,429].includes(status)||/quota|rate.limit|billing|payment|credit|neuron|capacity limit|unauthori[sz]ed|forbidden|policy|safety|content filter/i.test(msg))return false;
 return [404,408,500,502,503,504].includes(status)||/model.{0,30}(?:unavailable|not found|not supported)|timeout|timed out|temporar|overload|unavailable|invalid response|empty response|stream unavailable/i.test(msg);
}
export function createChaosInference({ai,mode="economy",message="",mood=""}){
 if(!ai||typeof ai.run!=="function")throw new Error("AI binding unavailable");
 const selected=chooseChaosEngine({message,mode,mood});
 let actual=null,fallback=false,answerCalls=0,plannerCalls=0;
 // Adapter preserves existing tool dispatcher and trusted session principal.
 const adapter={async run(model,options){
  if(options?.tools){if(++plannerCalls>1)throw new Error("Planner call limit");return ai.run(model,options);}
  if(++answerCalls>1)throw new Error("Answer call limit");
  const keys=selected==="fast"?["fast"]: [selected,"fast"];
  let last;
  for(const key of keys){
   try{
    const result=await ai.run(ENGINES[key],options);
    if(options?.stream){if(!result||typeof result.getReader!=="function")throw new Error("stream unavailable");}
    else if(typeof result?.response!=="string"||!result.response.trim())throw new Error("empty response");
    actual=key;fallback=key!==selected;return result;
   }catch(error){last=error;if(key==="fast"||!retryable(error))throw error;}
  }
  throw last;
 }};
 return {ai:adapter,model:ENGINES[selected],metadata:()=>({runtime:"miss-chaos-core-v1",mode:mode==="adaptive"?"adaptive":"economy",route:selected,engine:actual,model:actual?ENGINES[actual]:null,fallback})};
}
