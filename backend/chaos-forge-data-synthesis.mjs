// Example-guided search over a finite, typed unary pipeline grammar.
// Reports ambiguity instead of treating matching examples as a proof of intent.
import {compileData,runData,verifyData,emitDataModule} from "./chaos-forge-data.mjs";
import {emitDataSource} from "./chaos-forge-data-source.mjs";
const grammar={
 text:[["trim","text"],["lower","text"],["upper","text"],["words","texts"],["length","number"],["parseNumber","number"]],
 texts:[["uniqueTexts","texts"],["reverseTexts","texts"],["countTexts","number"],["join","text"," "],["join","text",","]],
 numbers:[["filterPositive","numbers"],["uniqueNumbers","numbers"],["sort","numbers"],["sum","number"],["mean","number"],["countNumbers","number"]],
 number:[["toText","text"]],
 record:[["recordKeys","texts"]],
 boolean:[]
};
const probes={text:[" A b A ","Hello WORLD","", "2.5","one two one"],texts:[["b","a","b"],[],["a","b"],["","x"]],numbers:[[3,-2,3,1],[],[-1,-2],[4,1,2]],number:[0,-2,3.5],boolean:[true,false],record:[{b:2,a:"x"},{}]};
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function synthesizeData(input){
 if(!input||!Object.hasOwn(grammar,input.inputType)||!Object.hasOwn(grammar,input.outputType)||!Array.isArray(input.examples)||input.examples.length<3||input.examples.length>8||!Array.isArray(input.holdout??[])||(input.holdout??[]).length>8)throw Error("Provide input/output types, 3–8 examples and optional independent holdout.");
 const examples=input.examples,holdout=input.holdout??[],all=[...examples,...holdout];
 if(all.some(e=>!e||!Array.isArray(e.values)||e.values.length!==1||!Object.hasOwn(e,"expected")))throw Error("One input and expected output per example required.");
 if(new Set(examples.map(e=>JSON.stringify(e.values))).size<3)throw Error("Three distinct examples required.");
 if(holdout.some(e=>examples.some(x=>eq(x.values,e.values))))throw Error("Holdout inputs must be distinct from training examples.");
 const maxDepth=input.maxDepth??3,budget=input.budget??256;
 if(!Number.isInteger(maxDepth)||maxDepth<1||maxDepth>4||!Number.isInteger(budget)||budget<1||budget>512)throw Error("Depth 1–4 and budget 1–512 required.");
 const fields=[{name:"value",type:input.inputType}];
 // Validate input types even for a no-match search.
 const identity=compileData({fields,steps:[],result:"value"});
 for(const e of all)runData(identity,e.values);
 let checked=0,pruned=0,queue=[{type:input.inputType,steps:[],last:"value"}],matches=[],fitCount=0;
 while(queue.length&&checked<budget){
  const node=queue.shift(),spec={fields,steps:node.steps,result:node.last};
  if(node.type===input.outputType){
   checked++;let program;
   try{program=compileData(spec);if(examples.every(e=>eq(runData(program,e.values),e.expected))){fitCount++;if(holdout.every(e=>eq(runData(program,e.values),e.expected)))matches.push({program,spec});}}catch{pruned++;}
  }
  if(node.steps.length<maxDepth)for(const [op,type,extra] of grammar[node.type]){const name="step_"+(node.steps.length+1);queue.push({type,last:name,steps:[...node.steps,{name,op,args:[{ref:node.last},...(extra===undefined?[]:[extra])]}]});}
 }
 const chosen=matches[0],alternate=matches.slice(1,24);let counterexample=null;
 if(chosen)for(const v of probes[input.inputType]){if(all.some(e=>eq(e.values,[v])))continue;let expected;try{expected=runData(chosen.program,[v]);}catch{continue;}for(const a of alternate){try{const other=runData(a.program,[v]);if(!eq(expected,other)){counterexample={values:[v],candidate:expected,alternative:other};break;}}catch{}}if(counterexample)break;}
 const exhausted=queue.length===0;
 return {checked,pruned,fitCount,matching:matches.length,exhausted,holdout:holdout.length,status:!chosen?"no-match":matches.length>1?"ambiguous":exhausted?"single-match-in-grammar":"budget-limited-match",source:chosen?emitDataSource(chosen.program):null,program:chosen?.program??null,counterexample,externalInference:false,notice:"Finite unary grammar only. Matching examples are not a proof of general correctness. Ambiguous or budget-limited candidates are not approved builds."};
}
