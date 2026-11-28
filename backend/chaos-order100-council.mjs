import {parseProgram,emitProgram,synthesize,emptyPrior} from "./order100-code-synthesis.mjs";
import {codingKnowledge} from "./src/order100-coding-practice.mjs";
import {localModelReply} from "./miss-chaos-local-model.mjs";
// Shared original curriculum and evidence-based specialist assessment. No model API or privileged actions.
import {curriculum} from "../training/miss-chaos-context-corpus.mjs";
import {RESEARCH_FLEET,assignments,RESEARCH_SLOT_MS,RESEARCH_BATCH_SIZE} from "./src/chaos-knowledge-fleet.mjs";
import {originalTutor} from "./miss-chaos-original-tutor.mjs";
import {traceExpression,decodeData} from "../public/order66-code-lab.mjs";
import {order66Format} from "./chaos-order66-format.mjs";
const topics=["Language","Mathematics","Engineering","Neural","Verification","Creative"];
const keyPattern=/^mc-(?:0[1-9]|[1-9][0-9]|100)$/;
const roster=RESEARCH_FLEET.map((a,i)=>({...a,index:i,mission:assignments(Math.floor(i/RESEARCH_BATCH_SIZE)*RESEARCH_SLOT_MS)[i%RESEARCH_BATCH_SIZE].query}));
const words=s=>new Set((String(s||"").toLowerCase().match(/[a-z0-9]{3,}/g)||[]).filter(w=>!["the","and","for","with","from","this","that","what","how","should","would","could","use"].includes(w)));
const overlap=(a,b)=>[...a].filter(x=>b.has(x)).length;
const lessons=curriculum.flatMap((group,d)=>group.map((text,i)=>({id:"curriculum-"+(d+1)+"-"+(i+1),topic:topics[d],text,teacher:roster[(d*20+i)%roster.length].key})));
export function peerCurriculum(key){
 const index=roster.findIndex(a=>a.key===key);if(index<0)throw Error("Unknown specialist");
 // Six assigned cross-topic references, plus all lessons accessible via shared tutor.
 const received=curriculum.map((group,d)=>{let pos=(index*7+d*3)%group.length;let row=lessons[d*20+pos];if(row.teacher===key)row=lessons[d*20+(pos+1)%group.length];return row;});
 return {agent:key,mission:roster[index].mission,teaches:lessons.filter(x=>x.teacher===key),receives:received,sharedLessonCount:lessons.length,kind:"authored-curriculum-routing",externalInference:false};
}
const permitted=new Set(["MIT","Apache-2.0","BSD-2-Clause","BSD-3-Clause","ISC","0BSD","MPL-2.0","CC0-1.0","Unlicense"]);
export function assessTool(tool,goal){
 if(!tool||typeof goal!=="string"||goal.length>300||!goal.trim())throw Error("A tool and research goal are required");
 const title=String(tool.title||"").slice(0,200),source=String(tool.source||""),id=String(tool.tool_id||""),license=String(tool.declared_license||"unknown").slice(0,100),version=String(tool.version_hint||"").slice(0,100);
 const safePath=title.split("/").every(x=>x!=="."&&x!=="..");
 const identity=safePath&&(source==="github"&&/^[-\w.]+\/[-\w.]+$/.test(title)&&id==="github:"+title||source==="gitlab"&&/^[-\w.]+(?:\/[-\w.]+)+$/.test(title)&&/^gitlab:[1-9][0-9]*$/.test(id)||source==="npm"&&/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/.test(title)&&id==="npm:"+title);
 const sourceUrl=identity?(source==="github"?"https://github.com/":source==="gitlab"?"https://gitlab.com/":"https://www.npmjs.com/package/")+title:null;
 const evidence={identity:!!identity,licenseDeclared:permitted.has(license),versionReported:!!version&&version!=="unknown",relevance:overlap(words(goal),words(title+" "+tool.query)),reviewed:tool.review_status==="approved"};
 const ranked=roster.map(a=>({key:a.key,name:a.name,mission:a.mission,score:overlap(words(a.mission),words(goal+" "+title+" "+tool.query)),division:a.division})).sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key));
 const verdict=!identity||tool.review_status==="rejected"?"reject-reference":!evidence.licenseDeclared||!evidence.versionReported?"needs-evidence":evidence.relevance===0?"insufficient-relevance":evidence.reviewed?"candidate-for-isolated-evaluation":"candidate-for-owner-review";
 // One assessment per discipline: rule outputs are not independent corroborating sources.
 const perspectives=[["provenance",evidence.identity,"Canonical identity only; publisher metadata is not independent verification."],["license",evidence.licenseDeclared,"Declared license only; inspect the exact license file and dependencies."],["version",evidence.versionReported,"Reported version is not an immutable source pin."],["relevance",evidence.relevance>0,"Lexical relevance, not compatibility or correctness."],["review",evidence.reviewed,"Human review of the reference, not authorization to run it."],["validation",false,"No isolated build or test has been recorded."]];
 const used=new Set();const reviews=perspectives.map(([criterion,passed,note],i)=>{const a=ranked.find(x=>!used.has(x.key)&&x.division===ranked[i]?.division)||ranked.find(x=>!used.has(x.key));used.add(a.key);return {agent:a.key,criterion,passed,note};});
 return {tool:id,title,sourceUrl,license,version,verdict,evidence,reviews,relevantSpecialists:ranked.filter(x=>x.score>0).slice(0,8),method:"local deterministic assessment; no automatic approval, installation or execution",externalInference:false};
}
export async function councilResearch(env,goal){
 if(typeof goal!=="string"||!goal.trim()||goal.length>300)throw Error("Research goal up to 300 characters required");
 const rows=(await env.DB.prepare("SELECT tool_id,source,title,declared_license,version_hint,query,review_status FROM chaos_knowledge_tools WHERE review_status<>'rejected' ORDER BY retrieved_at DESC LIMIT 200").all()).results||[];
 const matches=rows.map(x=>assessTool(x,goal)).filter(x=>x.evidence.relevance>0&&x.sourceUrl).sort((a,b)=>Number(b.evidence.reviewed)-Number(a.evidence.reviewed)||b.evidence.relevance-a.evidence.relevance||a.tool.localeCompare(b.tool)).slice(0,5);
 return {goal,assessed:rows.length,results:matches,roster:roster.length,externalInference:false,notice:"Shared catalog metadata; assessments are advisory and not evidence of code execution."};
}
export async function independentAnswer(env,question){
 if(typeof question!=="string"||!question.trim()||question.length>3000)throw Error("Question up to 3000 characters required");
 const text=question.trim(),reply=(answer,method,extra={})=>({answer,method,externalInference:false,...extra});
 const fence=String.fromCharCode(96).repeat(3);
 if(/^coding status$/i.test(text)){const knowledge=await codingKnowledge(env);return reply("Verified coding learners: "+knowledge.verifiedLearners+"/100. Distinct teachers: "+knowledge.distinctTeachers+". Learned program samples: "+knowledge.prior.samples+".","order100-coding-knowledge",{evidence:knowledge});}
 const code=text.match(/^code\s*:\s*(.{1,180})$/i);
 if(code){try{const p=parseProgram(code[1]);return reply(fence+"javascript\n"+emitProgram(p)+fence+"\nGenerated by the independent typed program compiler. No generated source was executed or deployed.","independent-code-compiler",{program:p});}catch(error){return reply(error.message,"independent-code-compiler");}}
 const synthesis=text.match(/^synthesize\s*:\s*([\s\S]+)$/i);
 if(synthesis){try{const input=JSON.parse(synthesis[1]);const k=await codingKnowledge(env).catch(()=>({prior:emptyPrior(),verifiedLearners:0,distinctTeachers:0}));const r=synthesize(input.examples,{maxSteps:input.maxSteps??3,budget:Math.min(512,input.budget??512),prior:k.prior});const details="Checked "+r.checked+" of "+r.total+" candidates; "+r.matchingPrograms+" matched. Learned samples: "+k.prior.samples+". "+r.note;const counter=r.counterexample?"\nAmbiguity probe: "+JSON.stringify(r.counterexample):"";return reply((r.source?fence+"javascript\n"+r.source+fence+"\n":"No matching candidate in this search budget.\n")+details+counter,"independent-program-synthesis",{evidence:r,verifiedLearners:k.verifiedLearners});}catch(error){return reply("Synthesis input invalid: "+String(error.message).slice(0,180),"independent-program-synthesis");}}
 const generate=text.match(/^generate local\s*:\s*([\s\S]{1,200})$/i);
 if(generate){const r=localModelReply(generate[1],66,"miss-chaos-context-003");return reply("Experimental original neural output (not a verified answer): "+(r.text||"[end of sequence]"),"miss-chaos-context-003",{architecture:r.architecture,experimental:true});}
 const calc=text.match(/^(?:calculate|solve|compile|what is)\s+([0-9][0-9a-z.()+*/%^,\s-]*)\??$/i);
 if(calc&&calc[1].length<=200){try{const r=traceExpression(calc[1]);return reply(String(r.result),"original-arithmetic-compiler",{evidence:r.ops});}catch{return reply("The local compiler could not validate that expression.","original-arithmetic-compiler");}}
 const format=text.match(/^(?:classify format|identify format)\s*:\s*([\s\S]{1,1000})$/i);if(format){const r=order66Format(format[1]);return reply(JSON.stringify(r,null,2),"original-trained-format-classifier");}
 const decode=text.match(/^decode\s+(json|hex|base64)\s*:\s*([\s\S]+)$/i);if(decode){try{return reply(decodeData(decode[1].toLowerCase(),decode[2]),"original-data-decoder");}catch{return reply("The input is not valid for the requested decoder.","original-data-decoder");}}
 const research=text.match(/^(?:research|compare tools|find tools)\s*:\s*(.{1,300})$/i);if(research){const r=await councilResearch(env,research[1]);return reply(r.results.length?r.results.map(x=>x.title+" — "+x.verdict+" ("+x.sourceUrl+")").join("\n")+"\nThese are metadata assessments, not verified installations.":"No matching catalog evidence yet.","shared-research-assessment",{evidence:r});}
 if(text.length<=300){const own=originalTutor(text);if(own.answer)return reply(own.answer,"original-curriculum",{evidence:own.evidence});
 const term=text.toLowerCase().replace(/^(?:what is|what are|define|explain)\s+(?:an?\s+|the\s+)?/,"").replace(/[?!.]+$/,"").trim();
 if(/^[a-z][a-z0-9 -]{2,89}$/.test(term)){const rows=(await env.DB.prepare("SELECT entity_id,title,description FROM chaos_knowledge_candidates WHERE review_status='approved' AND license='CC0-1.0' AND lower(title)=? ORDER BY entity_id LIMIT 2").bind(term).all()).results||[];if(rows.length===1&&/^Q[1-9][0-9]{0,14}$/.test(rows[0].entity_id)&&rows[0].description)return reply(String(rows[0].description).slice(0,300),"reviewed-shared-archive",{evidence:[{url:"https://www.wikidata.org/wiki/"+rows[0].entity_id,title:rows[0].title}]});}}
 return reply("I don't have enough verified local knowledge to answer that yet. Independent mode did not contact an external model.","insufficient-evidence");
}
