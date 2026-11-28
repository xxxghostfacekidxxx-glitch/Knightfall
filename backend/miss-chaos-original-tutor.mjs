// Original, local extractive tutor; no network, external model or unreviewed sources.
import {curriculum as groups} from "../training/miss-chaos-context-corpus.mjs";
const divisions=["Language","Mathematics","Engineering","Neural","Verification","Creative"];
const stop=new Set("a an the what is are does do how why can could would should please tell me about explain define of in for to and or with from by on it its this that help".split(" "));
function terms(s){return (String(s).toLowerCase().match(/[a-z0-9]+/g)||[]).map(w=>w.length>5&&w.endsWith("ies")?w.slice(0,-3)+"y":w.length>4&&w.endsWith("s")&&!w.endsWith("ss")?w.slice(0,-1):w).filter(w=>!stop.has(w));}
const documents=groups.flatMap((g,d)=>g.map((text,i)=>({id:"curriculum-"+(d+1)+"-"+(i+1),division:divisions[d],text,words:terms(text)})));
const frequency=new Map();for(const doc of documents)for(const term of new Set(doc.words))frequency.set(term,(frequency.get(term)||0)+1);
const avg=documents.reduce((s,d)=>s+d.words.length,0)/documents.length;
const idf=t=>Math.log(1+(documents.length-(frequency.get(t)||0)+.5)/((frequency.get(t)||0)+.5));
export function originalTutor(question){
 if(typeof question!=="string"||!question.trim()||question.length>300)throw Error("Provide a question up to 300 characters");
 const q=[...new Set(terms(question))].slice(0,24);if(!q.length)return {answer:null,evidence:[],status:"insufficient-evidence",externalInference:false};
 const ranked=documents.map(doc=>{let score=0,matched=0;for(const term of q){const tf=doc.words.filter(w=>w===term).length;if(!tf)continue;matched++;score+=idf(term)*tf*2.2/(tf+1.2*(.25+.75*doc.words.length/avg));}return {doc,score,matched};}).filter(x=>x.matched===q.length&&x.score>=2).sort((a,b)=>b.score-a.score||a.doc.id.localeCompare(b.doc.id));
 if(!ranked.length)return {answer:null,evidence:[],status:"insufficient-evidence",externalInference:false};
 const first=ranked[0];const evidence=ranked.filter(x=>x.score>=first.score*.65).slice(0,3).map(x=>({id:x.doc.id,division:x.doc.division,text:x.doc.text}));
 return {answer:evidence[0].text,evidence,status:"curriculum-match",externalInference:false,method:"local lexical retrieval, not neural generation"};
}
