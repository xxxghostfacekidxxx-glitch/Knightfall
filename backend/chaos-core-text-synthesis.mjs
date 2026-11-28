const ops=[
["trim",s=>s.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,""),"s.replace(/^[ \\t\\r\\n]+|[ \\t\\r\\n]+$/g, \"\")","s.strip(\" \\t\\r\\n\")"],
["lower",s=>s.toLowerCase(),"s.toLowerCase()","s.lower()"],
["upper",s=>s.toUpperCase(),"s.toUpperCase()","s.upper()"],
["collapse whitespace",s=>s.replace(/[ \t\r\n]+/g," "),"s.replace(/[ \\t\\r\\n]+/g, \" \")","re.sub(r\"[ \\t\\r\\n]+\", \" \", s)"],
["hyphenate",s=>s.replace(/ /g,"-"),"s.replace(/ /g, \"-\")","s.replace(\" \", \"-\")"],
["underscore",s=>s.replace(/ /g,"_"),"s.replace(/ /g, \"_\")","s.replace(\" \", \"_\")"],
["remove whitespace",s=>s.replace(/[ \t\r\n]/g,""),"s.replace(/[ \\t\\r\\n]/g, \"\")","re.sub(r\"[ \\t\\r\\n]\", \"\", s)"],
["remove punctuation",s=>s.replace(/[^A-Za-z0-9 \t\r\n]/g,""),"s.replace(/[^A-Za-z0-9 \\t\\r\\n]/g, \"\")","re.sub(r\"[^A-Za-z0-9 \\t\\r\\n]\", \"\", s)"],
["digits",s=>s.replace(/[^0-9]/g,""),"s.replace(/[^0-9]/g, \"\")","re.sub(r\"[^0-9]\", \"\", s)"],
["letters",s=>s.replace(/[^A-Za-z]/g,""),"s.replace(/[^A-Za-z]/g, \"\")","re.sub(r\"[^A-Za-z]\", \"\", s)"],
["reverse",s=>Array.from(s).reverse().join(""),"Array.from(s).reverse().join(\"\")","s[::-1]"],
["first word",s=>s.trim().split(/[ \t\r\n]+/)[0]||"","s.trim().split(/[ \\t\\r\\n]+/)[0] || \"\"","(s.split() or [\"\"])[0]"],
["last word",s=>s.trim().split(/[ \t\r\n]+/).at(-1)||"","s.trim().split(/[ \\t\\r\\n]+/).at(-1) || \"\"","(s.split() or [\"\"])[-1]"],
["sort characters",s=>Array.from(s).sort().join(""),"Array.from(s).sort().join(\"\")","\"\".join(sorted(s))"],
["unique characters",s=>Array.from(new Set(s)).join(""),"Array.from(new Set(s)).join(\"\")","\"\".join(dict.fromkeys(s))"]
];
function checkText(s){if(typeof s!=="string"||s.length>256||/[^\x20-\x7e\t\r\n]/.test(s))throw Error("Text must be at most 256 ASCII printable or whitespace characters");return s;}

function normalizeRows(rows,min){if(!Array.isArray(rows)||rows.length<min||rows.length>12)throw Error("Provide "+min+" to 12 text examples");const seen=new Map();for(const r of rows){if(!r||typeof r!=="object")throw Error("Invalid example");const input=checkText(r.input),output=checkText(r.output);if(seen.has(input)&&seen.get(input)!==output)throw Error("Conflicting examples");seen.set(input,output);}if(seen.size<min)throw Error("Need distinct examples");return [...seen].map(([input,output])=>({input,output}));}

function grammar(depth){const result=[[]];let level=[[]];for(let n=1;n<=depth;n++){const next=[];for(const seq of level)for(let i=0;i<ops.length;i++){if(seq.at(-1)===i)continue;next.push([...seq,i]);}result.push(...next);level=next;}return result;}

function run(seq,input){let s=checkText(input);for(const i of seq)s=ops[i][1](s);return s;}

function emit(seq,language){if(language==="javascript")return 'export function transform(s) {\n  if (typeof s !== "string" || s.length > 256 || /[^\\x20-\\x7e\\t\\r\\n]/.test(s)) throw new Error("Invalid ASCII input");\n'+seq.map(i=>"  s = "+ops[i][2]+";\n").join("")+"  return s;\n}\n";if(language==="python")return 'import re\n\ndef transform(s):\n    if not isinstance(s, str) or len(s) > 256 or re.search(r"[^\\x20-\\x7e\\t\\r\\n]", s):\n        raise ValueError("Invalid ASCII input")\n'+seq.map(i=>"    s = "+ops[i][3]+"\n").join("")+"    return s\n";throw Error("Unsupported language");}

function probeTexts(){return [""," \t\r\n"," A a  B ","z9! Z-2","Hello, WORLD!","a_a-a","one\t two\nthree","12 21","  Mixed--CASE  ","aabBA","x","x y","foo_bar.baz","1,2,3"," \r\nB\t a \t"];}

function synthesizeText(req){if(!req||typeof req!=="object"||Array.isArray(req))throw Error("Object required");const language=req.language??"javascript",depth=req.maxDepth??3;if(!["javascript","python"].includes(language)||!Number.isSafeInteger(depth)||depth<1||depth>3)throw Error("Use JavaScript/Python and depth 1–3");const examples=normalizeRows(req.examples,3),validation=req.validation===undefined?[]:normalizeRows(req.validation,1),used=new Set(examples.map(r=>r.input));if(validation.some(r=>used.has(r.input)))throw Error("Validation inputs must be disjoint");const space=grammar(depth);let checked=0,matches=[],fitCount=0;for(const seq of space){checked++;if(!examples.every(r=>run(seq,r.input)===r.output))continue;fitCount++;if(validation.every(r=>run(seq,r.input)===r.output))matches.push(seq);}const chosen=matches[0],shortest=chosen?matches.filter(p=>p.length===chosen.length):[],unused=probeTexts().filter(s=>!used.has(s)&&!validation.some(r=>r.input===s));let counterexample=null;if(chosen)outer:for(const s of unused){const expected=run(chosen,s);for(const other of matches.slice(1)){const actual=run(other,s);if(actual!==expected){counterexample={input:s,first:{operations:chosen.map(i=>ops[i][0]),output:expected},alternative:{operations:other.map(i=>ops[i][0]),output:actual}};break outer;}}}const status=!chosen?"no-match":matches.length===1?"unique-in-grammar":counterexample?"ambiguous":"probe-agreement";return {status,language,operations:chosen?.map(i=>ops[i][0])??null,source:chosen?emit(chosen,language):null,checked,trainingMatches:fitCount,validationMatches:matches.length,shortestMatches:shortest.length,trainingCases:examples.length,validationCases:validation.length,validationPassed:chosen?validation.length:0,probeCount:unused.length,counterexample,externalInference:false,notice:"Finite ASCII text grammar; interpreter checks examples, not proof of equivalence. Probe agreement does not establish uniqueness. Emitted source is not executed in this request."};}

function lesson(i){if(!Number.isSafeInteger(i)||i<0||i>=100)throw Error("Invalid learner");const kind=i%12;const oracles=[s=>s.toLowerCase().trim(),s=>s.toUpperCase().trim(),s=>s.trim().replace(/[ \t\r\n]+/g," "),s=>s.toLowerCase().replace(/ /g,"-"),s=>s.toUpperCase().replace(/ /g,"_"),s=>s.split("").filter(c=>/[0-9]/.test(c)).join(""),s=>s.split("").filter(c=>/[a-zA-Z]/.test(c)).join("").toLowerCase(),s=>s.split("").reverse().join(""),s=>s.split(/[ \t\r\n]/).filter(Boolean).join(""),s=>s.trim().split(/[ \t\r\n]+/)[0]||"",s=>s.trim().split(/[ \t\r\n]+/).at(-1)||"",s=>s.split("").filter((c,j,a)=>a.indexOf(c)===j).join("")];const train=["  Ab"+i+"  CD!\t","x "+i+"  y","Z-9_"+i," \n"+i+" bBA \r\n",""];const test=["\tFoo"+i+"  BAR "," "+i+"a.a!a ","A1\nB2\tC3"," \t\r\n","B"+i+"  z  Z"];return {agent:"mc-"+String(i+1).padStart(2,"0"),family:kind,examples:train.map(input=>({input,output:oracles[kind](input)})),validation:test.map(input=>({input,output:oracles[kind](input)}))};}

function benchmark(round=0){if(!Number.isSafeInteger(round)||round<0)throw Error("Invalid round");const receipts=[];for(let i=0;i<100;i++){const teacher=(i+1+round%99)%100,l=lesson(teacher),language=i%2?"python":"javascript",r=synthesizeText({...l,language,maxDepth:2});receipts.push({learner:lesson(i).agent,teacher:l.agent,family:l.family,operations:r.operations,language,status:r.status,passed:r.validationPassed,tests:r.validationCases,verified:!!r.source&&r.validationPassed===r.validationCases});}return {round,learners:100,verified:receipts.filter(r=>r.verified).length,cases:receipts.reduce((n,r)=>n+r.tests,0),passed:receipts.reduce((n,r)=>n+r.passed,0),ambiguous:receipts.filter(r=>r.status==="ambiguous").length,probeAgreement:receipts.filter(r=>r.status==="probe-agreement").length,receipts,method:"simulated peer exercises; no live agent or neural weight update",externalInference:false};}
function selectTextPipeline(req){
 const r=synthesizeText(req);
 if(!r.validationCases)throw Error("Independent validation examples required");
 if(req.operations===undefined){if(r.status!=="unique-in-grammar")throw Error("Select an explicit pipeline or provide distinguishing examples");return {...r,selection:"unique-in-grammar"};}
 if(!Array.isArray(req.operations)||req.operations.length>(req.maxDepth??3)||req.operations.some(x=>typeof x!=="string"))throw Error("Invalid operation selection");
 const seq=req.operations.map(x=>ops.findIndex(o=>o[0]===x));
 if(seq.some((x,i)=>x<0||i>0&&seq[i-1]===x))throw Error("Unknown or repeated operation");
 const rows=[...normalizeRows(req.examples,3),...normalizeRows(req.validation,1)];
 if(!rows.every(e=>run(seq,e.input)===e.output))throw Error("Selected pipeline fails supplied examples");
 return {...r,operations:req.operations.slice(),source:emit(seq,r.language),validationPassed:r.validationCases,selection:"explicit-verified-pipeline",counterexample:null,notice:r.notice+" Explicit selection does not establish general correctness."};
}
export {synthesizeText,selectTextPipeline,lesson,benchmark};
