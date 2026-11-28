import {compose} from "./chaos-core-composition.mjs";
import {synthesizeControl} from "./chaos-core-control-synthesis.mjs";
import {selectTextPipeline} from "./chaos-core-text-synthesis.mjs";
import {synthesizeScalar} from "./chaos-core-scalar-synthesis.mjs";
import {verifySourceLibrary} from "./chaos-forge-source-library.mjs";
import {verifyLogicLibrary,decompileLogicLibrary} from "./chaos-forge-logic-library.mjs";
import {verifyPython} from "./chaos-forge-python.mjs";
import {verifyControlJavaScript} from "./chaos-forge-javascript-control.mjs";
import {verifyJavaScript} from "./chaos-forge-javascript.mjs";
import {buildPresetTool,toolPresets} from "./chaos-forge-tool-presets.mjs";
import {buildWebProject} from "./chaos-forge-web-project.mjs";
import {inspectProjectArchive} from "./chaos-forge-project-inspect.mjs";
import {buildProject} from "./chaos-forge-project.mjs";
import {generateVector,imageCatalog} from "./chaos-forge-image.mjs";
import {verifyLibrary} from "./chaos-forge-library.mjs";
import {synthesizeData} from "./chaos-forge-data-synthesis.mjs";
import {verifyDataSource,emitDataSource} from "./chaos-forge-data-source.mjs";
import {verifyData,decompileData,runData,emitDataModule,dataOperationCatalog} from "./chaos-forge-data.mjs";
import {verifyLogic,decompileLogic,compileLogic,runLogic} from "./chaos-forge-logic.mjs";
import {compileFunction,decompileFunction} from "./chaos-forge-functions.mjs";
import {compileFormula,decompileFormula,evaluateFormula} from "./chaos-forge-formula.mjs";
import {compileArtifact,decompileStack,hexBytes,inspectWasm} from "./chaos-forge-binary.mjs";
import {buildApplet} from "./chaos-forge-applets.mjs";
import {reverseSource} from "./chaos-forge-reverse.mjs";
const enc=new TextEncoder(),ID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const filePattern=/^miss-chaos-[a-z0-9-]+\.(html|wasm|json|mjs|svg|zip|py)$/;
const to64=b=>{let out="";for(let i=0;i<b.length;i+=8192)out+=String.fromCharCode(...b.subarray(i,i+8192));return btoa(out);};
const from64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const digest=async b=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",b)),x=>x.toString(16).padStart(2,"0")).join("");
const ownerId=id=>{const n=Number(id);if(!Number.isSafeInteger(n)||n<1)throw Error("Owner required.");return n;};
export async function saveForgeArtifact(env,owner,artifact){
 const user=ownerId(owner);
 if(!filePattern.test(artifact.filename))throw Error("Invalid artifact filename.");
 const bytes=artifact.bytes||enc.encode(artifact.content);if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>32768)throw Error("Artifact exceeds 32 KiB.");
 const id=crypto.randomUUID(),sha256=await digest(bytes),created=new Date().toISOString(),expires=new Date(Date.now()+7*86400000).toISOString();
 // Atomic quota check; stale artifacts do not block new builds.
 await env.DB.prepare("DELETE FROM chaos_forge_artifacts WHERE owner_id=? AND expires_at<=?").bind(user,created).run();
 const r=await env.DB.prepare("INSERT INTO chaos_forge_artifacts(id,owner_id,filename,data_base64,sha256,byte_count,created_at,expires_at) SELECT ?,?,?,?,?,?,?,? WHERE (SELECT count(*) FROM chaos_forge_artifacts WHERE owner_id=?)<40").bind(id,user,artifact.filename,to64(bytes),sha256,bytes.length,created,expires,user).run();
 if(r.meta?.changes!==1)throw Error("40 active artifacts allowed. Delete an old artifact or wait for expiry.");
 return {id,filename:artifact.filename,bytes:bytes.length,sha256,expiresAt:expires,downloadUrl:"https://api.ash-fall.com/api/god/eye/tools/forge-download/"+id};
}
export async function forgeDownload(env,owner,id){
 if(!ID.test(id))return null;
 const row=await env.DB.prepare("SELECT filename,data_base64,sha256,byte_count FROM chaos_forge_artifacts WHERE id=? AND owner_id=? AND expires_at>?").bind(id,ownerId(owner),new Date().toISOString()).first();
 if(!row||!filePattern.test(row.filename)||typeof row.data_base64!=="string"||row.data_base64.length>44000)return null;
 const bytes=from64(row.data_base64);if(bytes.length!==row.byte_count||await digest(bytes)!==row.sha256)throw Error("Artifact integrity check failed.");
 return new Response(bytes,{headers:{"Content-Type":"application/octet-stream","Content-Disposition":'attachment; filename="'+row.filename+'"',"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; sandbox","Referrer-Policy":"no-referrer"}});
}
export async function listForgeArtifacts(env,owner){const rows=(await env.DB.prepare("SELECT id,filename,sha256,byte_count,created_at,expires_at FROM chaos_forge_artifacts WHERE owner_id=? AND expires_at>? ORDER BY created_at DESC LIMIT 40").bind(ownerId(owner),new Date().toISOString()).all()).results||[];return rows.map(r=>({...r,downloadUrl:"https://api.ash-fall.com/api/god/eye/tools/forge-download/"+r.id}));}
export async function deleteForgeArtifact(env,owner,id){if(!ID.test(id))return false;const r=await env.DB.prepare("DELETE FROM chaos_forge_artifacts WHERE id=? AND owner_id=?").bind(id,ownerId(owner)).run();return r.meta?.changes===1;}
export async function forgeCommand(env,owner,question){
 if(typeof question!=="string"||question.length>65536)throw Error("Invalid forge command.");
 const composition=question.match(/^build composed script\s*:\s*([\s\S]+)$/i);
 if(composition){const report=compose(JSON.parse(composition[1]));const file=await saveForgeArtifact(env,owner,{filename:"miss-chaos-composed."+(report.language==="python"?"py":"mjs"),content:report.source});return {answer:"Composed script: "+file.downloadUrl+"\n"+report.notice,method:"independent-composition",artifact:file,report,externalInference:false};}
 const controlScript=question.match(/^build control script\s*:\s*([\s\S]+)$/i);
 if(controlScript){const report=synthesizeControl(JSON.parse(controlScript[1]));if(!report.source||!report.validationCases||report.status==="ambiguous"&&report.selection!=="explicit")throw Error("Provide validation and select an ambiguous candidate explicitly");const file=await saveForgeArtifact(env,owner,{filename:"miss-chaos-control-script."+(report.language==="python"?"py":"mjs"),content:report.source});return {answer:"Generated bounded control-flow script; "+report.validationPassed+" validation cases matched. Download: "+file.downloadUrl+"\n"+report.notice,method:"independent-control-script",artifact:file,report,externalInference:false};}
 const textScript=question.match(/^build text script\s*:\s*([\s\S]+)$/i);
 if(textScript){const report=selectTextPipeline(JSON.parse(textScript[1])),file=await saveForgeArtifact(env,owner,{filename:"miss-chaos-text-script."+(report.language==="python"?"py":"mjs"),content:report.source});return {answer:"Generated a bounded "+report.language+" text script; "+report.validationPassed+" validation cases matched in the typed interpreter. Download: "+file.downloadUrl+"\n"+report.notice,method:"independent-text-script",artifact:file,report,externalInference:false};}
 const scalar=question.match(/^build scalar script\s*:\s*([\s\S]+)$/i);
 if(scalar){const report=synthesizeScalar(JSON.parse(scalar[1]));if(report.status!=="example-match"||!report.source||report.validationCases<1)return {answer:"No unique candidate with independent validation examples. Supply more distinct examples; no artifact created.",method:"independent-scalar-script",report,externalInference:false};const file=await saveForgeArtifact(env,owner,{filename:"miss-chaos-scalar-script."+(report.language==="python"?"py":"mjs"),content:report.source});return {answer:"Generated a bounded "+report.language+" script; "+report.validationPassed+" validation examples matched in the typed interpreter. Download: "+file.downloadUrl+"\n"+report.notice,method:"independent-scalar-script",artifact:file,report,externalInference:false};}
 const sourceLibrary=question.match(/^compile source library(?: (module))?\s*:\s*([\s\S]+)$/i);
 if(sourceLibrary){const report=verifySourceLibrary(JSON.parse(sourceLibrary[2])),module=!!sourceLibrary[1],file=await saveForgeArtifact(env,owner,{filename:"miss-chaos-source-library"+(module?".mjs":".json"),content:module?report.module:JSON.stringify(report.program,null,2)});return {answer:"Compiled "+report.program.functions.length+" "+report.language+" functions; "+report.tests.length+" examples passed. Download: "+file.downloadUrl+"\n"+report.notice,method:"independent-source-library",artifact:file,report:{...report,module:undefined},externalInference:false};}
 const logicLibrary=question.match(/^compile logic library(?: (module))?\s*:\s*([\s\S]+)$/i);
 if(logicLibrary){const report=verifyLogicLibrary(JSON.parse(logicLibrary[2])),module=!!logicLibrary[1],file=await saveForgeArtifact(env,owner,{filename:"miss-chaos-logic-library"+(module?".mjs":".json"),content:module?report.module:JSON.stringify(report.program,null,2)});return {answer:"Compiled numeric function library; "+report.tests.length+" examples passed. Download: "+file.downloadUrl+"\n"+report.notice,method:"independent-logic-library",artifact:file,report:{...report,module:undefined},externalInference:false};}
 const decodeLogicLibrary=question.match(/^decompile logic library\s*:\s*([\s\S]+)$/i);
 if(decodeLogicLibrary){const report=decompileLogicLibrary(JSON.parse(decodeLogicLibrary[1]));return {answer:JSON.stringify(report.source,null,2),method:"independent-logic-library-decompiler",report,externalInference:false};}
 const control=question.match(/^compile (python|javascript control)(?: (module))?\s*:\s*([\s\S]+)$/i);
 if(control){const python=control[1].toLowerCase()==="python",report=(python?verifyPython:verifyControlJavaScript)(JSON.parse(control[3])),module=!!control[2],file=await saveForgeArtifact(env,owner,{filename:"miss-chaos-"+(python?"python":"javascript-control")+(module?".mjs":".json"),content:module?report.module:JSON.stringify(report.program,null,2)});return {answer:"Compiled numeric control flow; "+report.tests.length+" examples passed. Download: "+file.downloadUrl+"\n"+report.notice,method:"independent-control-compiler",artifact:file,report:{...report,module:undefined},externalInference:false};}
 const javascript=question.match(/^compile javascript(?: (module))?\s*:\s*([\s\S]+)$/i);
 if(javascript){const report=verifyJavaScript(JSON.parse(javascript[2])),module=!!javascript[1],file=await saveForgeArtifact(env,owner,{filename:module?"miss-chaos-javascript.mjs":"miss-chaos-javascript.json",content:module?report.module:JSON.stringify(report.program,null,2)});return {answer:"Compiled JavaScript subset and verified "+report.tests.length+" examples. Download: "+file.downloadUrl+"\nReconstructed typed source:\n"+report.source+"\n"+report.notice,method:"independent-javascript-compiler",artifact:file,report:{...report,module:undefined},externalInference:false};}
 const preset=question.match(/^build tool\s*:\s*([\s\S]+)$/i);
 if(preset){const a=buildPresetTool(preset[1]),file=await saveForgeArtifact(env,owner,a);return {answer:"Built "+a.report.name+" from a verified preset. Download: "+file.downloadUrl+"\n"+a.report.notice,method:"independent-preset-tool-builder",artifact:file,report:a.report,externalInference:false};}
 if(/^tool presets\s*:?\s*$/i.test(question)){const presets=toolPresets();return {answer:presets.map(p=>p.name+": "+p.description).join("\n"),method:"independent-tool-preset-catalog",report:{presets},externalInference:false};}
 const web=question.match(/^build web project\s*:\s*([\s\S]+)$/i);
 if(web){const a=buildWebProject(JSON.parse(web[1])),file=await saveForgeArtifact(env,owner,a);return {answer:"Created offline browser project "+a.report.name+" with "+a.report.files.length+" files. Download: "+file.downloadUrl+"\n"+a.report.notice,method:"independent-web-project-builder",artifact:file,report:a.report,externalInference:false};}
 const projectInspect=question.match(/^inspect project\s*:\s*([\s\S]+)$/i);
 if(projectInspect){const report=inspectProjectArchive(hexBytes(projectInspect[1]));return {answer:JSON.stringify(report,null,2).slice(0,20000),method:"independent-project-inspection",report,externalInference:false};}
 const project=question.match(/^(?:build|create) project\s*:\s*([\s\S]+)$/i);
 if(project){const a=buildProject(JSON.parse(project[1])),file=await saveForgeArtifact(env,owner,a);return {answer:"Created "+a.report.name+" with "+a.report.files.length+" project files and "+a.report.examples+" verified examples. Download: "+file.downloadUrl+"\n"+a.report.notice,method:"independent-project-builder",artifact:file,report:a.report,externalInference:false};}
 const image=question.match(/^image (?:vector|generate)\s*:\s*([\s\S]+)$/i);
 if(image){const a=generateVector(JSON.parse(image[1])),file=await saveForgeArtifact(env,owner,a);return {answer:"Generated independent "+a.report.motif+" artwork. Download: "+file.downloadUrl+"\n"+a.report.description,method:"independent-vector-image",artifact:file,report:a.report,externalInference:false};}
 if(/^image options\s*:?\s*$/i.test(question)){const report=imageCatalog();return {answer:JSON.stringify(report,null,2),method:"independent-image-options",report,externalInference:false};}
 if(/^data operations\s*:?\s*$/i.test(question)){const operations=dataOperationCatalog();return {answer:operations.map(o=>o.name+"("+o.inputs.join(", ")+") → "+o.output+": "+o.description).join("\n"),method:"independent-data-operation-catalog",report:{operations},externalInference:false};}
 const app=question.match(/^(?:applet|(?:make|create|build) (?:an? )?applet)\s*:\s*([\s\S]+)$/i);
 if(app){const a=await buildApplet(app[1]);const file=await saveForgeArtifact(env,owner,a);return {answer:"Created offline "+a.report.title+" applet. Download: "+file.downloadUrl+"\nSHA-256: "+file.sha256+"\nExpires in seven days. No external inference or dependencies.",method:"independent-applet-forge",artifact:file,report:a.report,externalInference:false};}
 const library=question.match(/^compile library\s*:\s*([\s\S]+)$/i);
 if(library){const report=verifyLibrary(JSON.parse(library[1])),file=await saveForgeArtifact(env,owner,{filename:"miss-chaos-library.mjs",content:report.module});return {answer:"Compiled "+report.functions+" functions into a reusable JavaScript module; "+report.tests.length+" examples passed. Download: "+file.downloadUrl+"\n"+report.notice,method:"independent-library-compiler",artifact:file,report:{...report,module:undefined},externalInference:false};}
 const synthesis=question.match(/^synthesize data\s*:\s*([\s\S]+)$/i);
 if(synthesis){const report=synthesizeData(JSON.parse(synthesis[1]));return {answer:(report.source||"No matching program in the searched grammar.")+"\nStatus: "+report.status+"; "+report.checked+" candidates checked; "+report.matching+" matched. "+report.notice+(report.counterexample?"\nDisambiguating input: "+JSON.stringify(report.counterexample):""),method:"independent-typed-program-synthesis",report,externalInference:false};}
 const source=question.match(/^compile source(?: (module))?\s*:\s*([\s\S]+)$/i);
 if(source){const report=verifyDataSource(JSON.parse(source[2])),module=!!source[1],file=await saveForgeArtifact(env,owner,{filename:module?"miss-chaos-source.mjs":"miss-chaos-source.json",content:module?emitDataModule(report.program):JSON.stringify(report.program,null,2)});return {answer:"Source compiled and "+report.tests.length+" examples verified. Download: "+file.downloadUrl+"\nReconstructed source:\n"+report.reconstructed,method:"independent-readable-source-compiler",artifact:file,report,externalInference:false};}
 const sourceDecode=question.match(/^(?:decompile|disassemble|reverse engineer) source\s*:\s*([\s\S]+)$/i);
 if(sourceDecode){const reconstructed=emitDataSource(JSON.parse(sourceDecode[1]));return {answer:reconstructed,method:"independent-readable-source-decompiler",report:{source:reconstructed,executed:false},externalInference:false};}
 const data=question.match(/^compile data(?: (module))?\s*:\s*([\s\S]+)$/i);
 if(data){const report=verifyData(JSON.parse(data[2])),module=!!data[1],file=await saveForgeArtifact(env,owner,{filename:module?"miss-chaos-data.mjs":"miss-chaos-data.json",content:module?emitDataModule(report.program):JSON.stringify(report.program,null,2)});return {answer:"Verified "+report.tests.length+" examples. Download: "+file.downloadUrl+"\n"+JSON.stringify(report.tests,null,2),method:module?"independent-data-module":"independent-data-compiler",artifact:file,report,externalInference:false};}
 const dataDecode=question.match(/^(?:decompile|disassemble|reverse engineer) data\s*:\s*([\s\S]+)$/i);
 if(dataDecode){const report=decompileData(JSON.parse(dataDecode[1]));return {answer:JSON.stringify(report.source,null,2),method:"independent-data-decompiler",report,externalInference:false};}
 const dataRun=question.match(/^run data\s*:\s*([\s\S]+)$/i);
 if(dataRun){const input=JSON.parse(dataRun[1]),result=runData(decompileData(input.program).program,input.values);return {answer:JSON.stringify(result,null,2),method:"independent-data-vm",report:{result},externalInference:false};}
 const logic=question.match(/^compile logic\s*:\s*([\s\S]+)$/i);
 if(logic){const report=verifyLogic(JSON.parse(logic[1])),file=await saveForgeArtifact(env,owner,{filename:"miss-chaos-logic.json",content:JSON.stringify(report.program,null,2)});return {answer:"Compiled and verified "+report.tests.length+" examples. Download: "+file.downloadUrl+"\n"+JSON.stringify(report.tests,null,2),method:"independent-logic-compiler",artifact:file,report,externalInference:false};}
 const decodeLogic=question.match(/^(?:decompile|disassemble|reverse engineer) logic\s*:\s*([\s\S]+)$/i);
 if(decodeLogic){const report=decompileLogic(JSON.parse(decodeLogic[1]));return {answer:JSON.stringify(report,null,2),method:"independent-logic-decompiler",report,externalInference:false};}
 const executeLogic=question.match(/^run logic\s*:\s*([\s\S]+)$/i);
 if(executeLogic){const input=JSON.parse(executeLogic[1]),program=compileLogic(decompileLogic(input.program).source),result=runLogic(program,input.values);return {answer:"Bounded VM result: "+result,method:"independent-logic-vm",report:{result},externalInference:false};}
 const native=question.match(/^compile function\s*:\s*([\s\S]+)$/i);
 if(native){const a=compileFunction(JSON.parse(native[1])),file=await saveForgeArtifact(env,owner,a);return {answer:"Compiled reusable native function. Download: "+file.downloadUrl+"\n"+JSON.stringify(a.report),method:"independent-native-function",artifact:file,report:a.report,externalInference:false};}
 const nativeDecode=question.match(/^(?:decompile|reverse engineer) function\s*:\s*([\s\S]+)$/i);
 if(nativeDecode){const report=decompileFunction(hexBytes(nativeDecode[1]));return {answer:JSON.stringify(report,null,2),method:"independent-native-decompiler",report,externalInference:false};}
 const formula=question.match(/^compile formula\s*:\s*([\s\S]+)$/i);
 if(formula){const input=JSON.parse(formula[1]),program=compileFormula(input.expression,input.fields),report={program,reconstructed:decompileFormula(program),exampleResult:input.values===undefined?null:evaluateFormula(program,input.values)},file=await saveForgeArtifact(env,owner,{filename:"miss-chaos-formula.json",content:JSON.stringify(program,null,2)});return {answer:"Compiled parameterized formula bytecode. Download: "+file.downloadUrl+"\n"+JSON.stringify(report,null,2),method:"independent-formula-compiler",artifact:file,report,externalInference:false};}
 const formulaDecode=question.match(/^(?:decompile|disassemble|reverse engineer) formula\s*:\s*([\s\S]+)$/i);
 if(formulaDecode){const report=decompileFormula(JSON.parse(formulaDecode[1]));return {answer:JSON.stringify(report,null,2),method:"independent-formula-decompiler",report,externalInference:false};}
 const compile=question.match(/^compile\s+(wasm|stack)\s*:\s*(.+)$/i);
 if(compile){const a=compileArtifact(compile[2],compile[1].toLowerCase());const file=await saveForgeArtifact(env,owner,a);return {answer:"Compiled "+a.report.target+" artifact; result "+a.report.result+". Download: "+file.downloadUrl+"\nSHA-256: "+file.sha256,method:"independent-binary-compiler",artifact:file,report:a.report,externalInference:false};}
 const decompile=question.match(/^(?:decompile|disassemble|reverse engineer)\s+(wasm|stack)\s*:\s*([\s\S]+)$/i);
 if(decompile){let report;if(decompile[1].toLowerCase()==="wasm")report=inspectWasm(hexBytes(decompile[2]));else{const parsed=JSON.parse(decompile[2]);report=decompileStack(Array.isArray(parsed)?parsed:parsed.ops);}
 return {answer:JSON.stringify(report,null,2).slice(0,20000),method:"independent-static-decompiler",report,externalInference:false};}
 const reverse=question.match(/^(?:reverse engineer|analyze source)\s+(javascript|typescript|jsx|tsx|json)\s*:\s*([\s\S]+)$/i);
 if(reverse){const report=reverseSource(reverse[2],reverse[1].toLowerCase());return {answer:JSON.stringify(report,null,2).slice(0,20000),method:"independent-static-source-analysis",report,externalInference:false};}
 return null;
}
