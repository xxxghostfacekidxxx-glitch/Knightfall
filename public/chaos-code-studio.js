import {buildChaosFlow} from "./chaos-flow-core.mjs";
const API="https://api.ash-fall.com";
const byId=id=>document.getElementById(id);
const code=byId("studio-code"),language=byId("studio-language");
const codeStatus=byId("studio-code-status"),codeResults=byId("studio-code-results");
const steps=byId("studio-steps"),diagramStatus=byId("studio-diagram-status");
const preview=byId("studio-diagram-preview"),mermaidOutput=byId("studio-mermaid");
const undo=byId("studio-undo"),diagramSvg=byId("studio-diagram-svg"),diagramMermaid=byId("studio-diagram-mermaid");
const encoder=new TextEncoder();
let beforeFormat=null,currentSvg=null;
const note=(element,text)=>{element.textContent=String(text);};
function download(name,content,type){
 const blob=content instanceof Blob?content:new Blob([content],{type});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1200);
}
async function utility(name,input){
 if(encoder.encode(JSON.stringify(input)).length>14500)throw Error("Too much source text. Keep code under 10 KB.");
 let response;
 try{
  response=await fetch(API+"/api/chaos/tools/execute",{
   method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},
   body:JSON.stringify({name,input})
  });
 }catch{throw Error("Knightfall API unavailable. Local editing and diagrams still work.");}
 let json;try{json=await response.json();}catch{throw Error("The API returned an unreadable response.");}
 if(!response.ok)throw Error(response.status===401?"Please sign in to Knightfall to use code tools.":String(json.error||"Request failed.").slice(0,180));
 return json.result;
}
// Staff source and CI inspection are read-only. The Worker rechecks staff role.
const repoRead=byId("studio-repo-read"),ciCheck=byId("studio-ci-check");
const repoCopy=byId("studio-repo-copy"),repoStatus=byId("studio-repo-status");
const repoOutput=byId("studio-repo-output"),ciOutput=byId("studio-ci-output"),ciStatus=byId("studio-ci-status"),repoPath=byId("studio-repo-path");
const repoStart=byId("studio-repo-start");
const repoDir=byId("studio-repo-dir"),repoQuery=byId("studio-repo-query");
const repoFind=byId("studio-repo-find"),repoFindStatus=byId("studio-repo-find-status");
const repoFileSelect=byId("studio-repo-file-select"),repoFileUse=byId("studio-repo-file-use");
repoFind.addEventListener("click",async()=>{
 repoFind.disabled=true;repoFileUse.disabled=true;repoFileSelect.disabled=true;repoFileSelect.replaceChildren();
 note(repoFindStatus,"Looking for verified public source files in "+repoDir.value+"…");
 try{
  const result=await utility("staff.source_files",{directory:repoDir.value,query:repoQuery.value.trim()});
  if(result?.branch!=="main"||!/^[a-f0-9]{40}$/i.test(result?.commit_sha||""))
   throw Error("GitHub source revision was not verified.");
  const files=(result.results||[]).filter(item=>typeof item.path==="string"&&
    item.path.startsWith(repoDir.value+"/")&&item.path.length<=190);
  for(const file of files)repoFileSelect.append(new Option(file.path,file.path));
  repoFileSelect.disabled=files.length===0;
  repoFileUse.disabled=files.length===0;
  note(repoFindStatus,result.matched+" matching public files at main commit "+
   result.commit_sha.slice(0,12)+". "+files.length+" listed. Choose one and load a separate verified excerpt.");
 }catch(err){note(repoFindStatus,String(err.message||"Source directory not available."));}
 finally{repoFind.disabled=false;}
});
repoFileSelect.addEventListener("change",()=>{repoFileUse.disabled=!repoFileSelect.value;});
repoFileUse.addEventListener("click",()=>{
 if(!repoFileSelect.value)return;
 repoPath.value=repoFileSelect.value;
 note(repoFindStatus,"Source path selected. Click Read file excerpt for a fresh SHA-pinned inspection.");
});

let currentRepoExcerpt=null;
let proposalSnapshot=null, reviewPacket="", reviewCandidate="", reviewSummary="",reviewSubmission=null;
const proposeButton=byId("studio-repo-propose"),reviewDownload=byId("studio-proposal-export");
const reviewHandoff=byId("studio-proposal-handoff");
const reviewOutput=byId("studio-proposal-output"),reviewStatus=byId("studio-proposal-status");
const devSubmit=byId("studio-dev-review-submit"),devSummary=byId("studio-dev-review-summary"),devStatus=byId("studio-dev-review-status");
function clearReview(message="No proposal staged yet."){
 reviewPacket="";reviewCandidate="";reviewSummary="";reviewSubmission=null;reviewDownload.disabled=true;reviewHandoff.disabled=true;devSubmit.disabled=true;
 note(reviewOutput,message);
}
repoRead.addEventListener("click",async()=>{
 const path=repoPath.value.trim(),start=Number(repoStart.value);
 repoRead.disabled=true;repoCopy.disabled=true;proposeButton.disabled=true;
 currentRepoExcerpt=null;proposalSnapshot=null;clearReview();
 note(repoStatus,"Reading public main-branch source with staff authorization...");
 try{
  const result=await utility("staff.repo_file",{path,start_line:start,line_count:55});
  if(!result?.available){note(repoStatus,result?.message||"Source unavailable.");note(repoOutput,"No verified source.");return;}
  const lines=(result.lines||[]).filter(x=>Number.isInteger(x.number)&&typeof x.text==="string");
  if(result.branch!=="main"||!/^[a-f0-9]{40}$/i.test(result.commit_sha||"")){
   note(repoStatus,"Source revision could not be verified. No excerpt accepted.");return;
  }
  const contiguous=lines.every((line,i)=>line.number===start+i);
  if(!contiguous||lines.length!==Number(result.returned_lines)){
   note(repoStatus,"Incomplete or noncontiguous source lines. Read again.");return;
  }
  currentRepoExcerpt={path:result.path,lines,sourceUrl:result.source_url,branch:result.branch,
   commitSha:result.commit_sha,totalLines:result.total_lines,longLinesOmitted:result.long_lines_omitted===true};
  note(repoOutput,lines.map(l=>String(l.number).padStart(4," ")+" | "+l.text).join("\n"));
  repoCopy.disabled=lines.length===0||currentRepoExcerpt.longLinesOmitted;
  note(repoStatus,result.path+" @ "+result.commit_sha.slice(0,12)+" · "+lines.length+" of "+result.total_lines+
   " lines. "+(currentRepoExcerpt.longLinesOmitted?"Long lines were clipped. Cannot stage a patch from this excerpt.":"Read-only, immutable revision."));
 }catch(error){note(repoStatus,String(error.message||"Source could not be read."));note(repoOutput,"No verified source.")}
 finally{repoRead.disabled=false;}
});
repoCopy.addEventListener("click",()=>{
 if(!currentRepoExcerpt)return;
 const snippet=currentRepoExcerpt.lines.map(l=>l.text).join("\n");
 if(encoder.encode(snippet).length>10000){note(repoStatus,"Excerpt is over the editor's 10 KB limit. Load fewer lines.");return;}
 code.value=snippet;beforeFormat=null;undo.disabled=true;
 proposalSnapshot=encoder.encode(snippet).length<=5000?{...currentRepoExcerpt,original:snippet}:null;
 proposeButton.disabled=!proposalSnapshot;
 clearReview(proposalSnapshot?"Verified source captured. Edit the source and stage a review-only proposal.":"Excerpt exceeds 5 KB proposal limit. Read fewer lines.");
 const ext=currentRepoExcerpt.path.split(".").at(-1).toLowerCase();
 language.value=ext==="json"?"json":ext==="ts"?"typescript":ext==="tsx"?"tsx":ext==="jsx"?"jsx":"javascript";
 note(repoStatus,"Copied a "+currentRepoExcerpt.lines.length+"-line excerpt into the editor. This is not the complete file.");
 code.focus();
});
ciCheck.addEventListener("click",async()=>{
 ciCheck.disabled=true;note(ciStatus,"Checking actual GitHub Actions on main, not executing your proposal...");
 try{
  const data=await utility("staff.github_health",{});
  const entries=(data.workflows||[]).slice(0,12);
  note(ciOutput,entries.map(x=>x.name+" · "+(x.conclusion||x.status)+" · "+(x.url||"")).join("\n")||"No verified runs.");
  note(ciStatus,entries.length+" recent main-branch workflow runs, "+Number(data.failed_count||0)+
   " failures. Committed-source CI only; your uncommitted draft has not been tested or applied.");
 }catch(error){note(ciStatus,String(error.message||"GitHub status unavailable."));note(ciOutput,"No verified CI status.");}
 finally{ciCheck.disabled=false;}
});
proposeButton.addEventListener("click",async()=>{
 const snapshot=proposalSnapshot;
 if(!snapshot){note(reviewStatus,"Read and copy a verified main-branch excerpt first.");return;}
 const candidate=code.value;
 if(encoder.encode(snapshot.original).length>5000||encoder.encode(candidate).length>5000){
  note(reviewStatus,"Original and proposed excerpts must each be under 5 KB.");return;
 }
 proposeButton.disabled=true;clearReview("Generating a read-only change proposal...");
 note(reviewStatus,"Comparing the verified excerpt with your editor. No file writes or test execution.");
 try{
  // A proposal must still describe the live main revision, not a stale editor tab.
  const first=snapshot.lines[0]?.number,last=snapshot.lines.at(-1)?.number;
  if(!Number.isInteger(first)||!Number.isInteger(last))throw Error("Verified source range missing.");
  const fresh=await utility("staff.repo_file",{path:snapshot.path,start_line:first,line_count:snapshot.lines.length});
  const sameLines=Array.isArray(fresh?.lines)&&fresh.lines.length===snapshot.lines.length&&
   fresh.lines.every((line,i)=>line.number===snapshot.lines[i].number&&line.text===snapshot.lines[i].text);
  if(!fresh?.available||fresh.branch!=="main"||fresh.commit_sha!==snapshot.commitSha||
     fresh.long_lines_omitted||!sameLines){
   proposalSnapshot=null;
   clearReview("Main changed since this source was read. Reopen the source before proposing a patch.");
   note(reviewStatus,"STALE SOURCE: main revision or excerpt changed. Read current source and rebase your idea.");
   return;
  }
  const fullFile=first===1&&snapshot.lines.length===snapshot.totalLines;
  const ext=snapshot.path.split(".").at(-1)?.toLowerCase();
  let preflight="Not run: proposal is a partial excerpt or unsupported file type.";
  if(fullFile&&["js","mjs","cjs","ts","tsx","jsx","json"].includes(ext)){
   const expectedLanguage={js:"javascript",mjs:"javascript",cjs:"javascript",ts:"typescript",
    tsx:"tsx",jsx:"jsx",json:"json"}[ext];
   const inspection=await utility("dev.code_inspect",{code:candidate,language:expectedLanguage,
    source_type:ext==="cjs"?"script":"module"});
   if(!inspection?.syntax_valid){
    const error=(inspection?.errors||[]).slice(0,3).map(e=>e.message).join("; ");
    throw Error("Full-file syntax preflight failed: "+(error||"Syntax is invalid.")+
     " Fix it before staging.");
   }
   preflight="PASS: non-executing syntax inspection of the full proposed file ("+expectedLanguage+
    "); this is not a test suite or security audit.";
  }
  const result=await utility("dev.code_diff",{before:snapshot.original,after:candidate});
  if(result.identical){note(reviewStatus,"No changes to propose.");note(reviewOutput,"The source and edited excerpt are identical.");return;}
  const diff=String(result.unified_diff||"");
  if(!diff)throw Error("The code tool did not return a real diff.");
  if(code.value!==candidate)throw Error("Editor changed during verification. Stage again.");
  reviewPacket=[
   "KNIGHTFALL / MISS CHAOS / HUMAN REVIEW REQUIRED",
   "Status: PROPOSAL ONLY. Not committed, CI-tested or deployed.",
   "Repository: xxxghostfacekidxxx-glitch/Knightfall",
   "Branch inspected: main",
   "Immutable base commit SHA: "+snapshot.commitSha,
   "Freshness: main HEAD and selected lines rechecked before staging.",
   "Preflight: "+preflight,
   "Path: "+snapshot.path,
   "Original source URL: "+snapshot.sourceUrl,
   "Excerpt lines: "+first+"-"+last+" of "+snapshot.lines.length+" selected",
   "Prepared at: "+new Date().toISOString(),
   "Change count: +"+Number(result.added_lines||0)+" / -"+Number(result.removed_lines||0),
   "CAUTION: "+(fullFile?"Whole file was captured, but this proposal still has no automatic apply rights.":"A partial-file excerpt is NOT an apply-ready full-file patch."),
   "Before acceptance: re-read latest full file, verify current main SHA, inspect syntax,",
   "run real CI against the integrated change, obtain human approval,",
   "deploy the exact reviewed commit and verify production/device behavior.",
   "",
   "PROPOSED UNIFIED DIFF (excerpt only):",
   diff,
   "",
   "ORIGINAL EXCERPT:",
   snapshot.original,
   "",
   "PROPOSED REPLACEMENT EXCERPT:",
   candidate
  ].join("\n");
  reviewCandidate=candidate;
  reviewSubmission=fullFile?{path:snapshot.path,source_sha:snapshot.commitSha,
    original:snapshot.original,candidate}:null;
  devSubmit.disabled=!reviewSubmission;
  note(devStatus,fullFile?"Complete small file verified. Add a clear summary to submit for review; nothing will be committed.":
    "This is only an excerpt. Cannot submit a partial-file change to the review docket.");
  reviewSummary=[
   "MISS CHAOS / CODE REVIEW REQUEST (NOT APPROVED)",
   "Repository: xxxghostfacekidxxx-glitch/Knightfall",
   "File: "+snapshot.path,
   "Immutable base main SHA: "+snapshot.commitSha,
   "Lines: "+first+"-"+last+"; "+(fullFile?"full small file":"partial excerpt"),
   "Proposal: +"+Number(result.added_lines||0)+" / -"+Number(result.removed_lines||0)+" excerpt lines",
   "Preflight: "+preflight,
   "Status: NEEDS REVIEW. No candidate tests, code commit or deployment.",
   "Osiris/authorized Isis next: get exact proposed text from the author,",
   "review with full-file context, check base SHA, run isolated tests,",
   "explicitly approve integrated code, then verify exact deployed commit.",
   "Original source: "+snapshot.sourceUrl
  ].join("\n");
  note(reviewOutput,reviewPacket);reviewDownload.disabled=false;reviewHandoff.disabled=false;
  beforeDiff.value=snapshot.original;afterDiff.value=candidate;storedPatch="";
  diffDownload.disabled=true;
  note(reviewStatus,"Review packet staged at "+snapshot.commitSha.slice(0,12)+". "+preflight+
   " No CI tests were run on this proposal and no code was applied.");
 }catch(err){clearReview("No verified proposal.");note(reviewStatus,String(err.message||"Unable to stage proposal."));}
 finally{proposeButton.disabled=!proposalSnapshot;}
});
reviewDownload.addEventListener("click",()=>{
 if(!reviewPacket)return;
 if(code.value!==reviewCandidate){
  clearReview("Editor changed after the proposal was staged. Stage it again.");
  note(reviewStatus,"Proposal expired because the editor changed.");return;
 }
 download("knightfall-source-review.txt",reviewPacket,"text/plain;charset=utf-8");
 note(reviewStatus,"Read-only proposal downloaded. No repository or production change occurred.");
});
devSubmit.addEventListener("click",async()=>{
 const proposal=reviewSubmission;
 if(!proposal||!reviewPacket){note(devStatus,"Only complete SHA-verified source can enter the review docket.");return;}
 const summary=devSummary.value.trim();
 if(summary.length<12||summary.length>360){note(devStatus,"Write a specific 12–360 character explanation of the change.");return;}
 if(code.value!==proposal.candidate){
   clearReview("The editor changed; the old review candidate is no longer valid.");
   note(devStatus,"Editor changed. Re-stage the exact proposal before submitting.");return;
 }
 if(!window.confirm("Submit this full-file source change to the Osiris/Isis review docket? The proposal will be stored for staff review. This will NOT commit, run CI or deploy code."))return;
 devSubmit.disabled=true;
 note(devStatus,"Rechecking the immutable main file on the server, then saving a pending review…");
 try{
   const result=await fetch(API+"/api/chaos/dev-reviews",{
     method:"POST",credentials:"include",cache:"no-store",
     headers:{"content-type":"application/json"},
     body:JSON.stringify({...proposal,summary})
   });
   const data=await result.json().catch(()=>({}));
   if(!result.ok)throw Error(String(data.error||"Developer review docket unavailable.").slice(0,235));
   if(data.status!=="pending"||!data.id)throw Error("The server did not confirm a pending review.");
   note(devStatus,"Submitted review #"+data.id+". No code was committed or deployed. Open Eye of Chaos's approval panel.");
   reviewSubmission=null;devSubmit.disabled=true;
 }catch(error){devSubmit.disabled=false;note(devStatus,String(error.message||"Unable to submit this review."));}
});

reviewHandoff.addEventListener("click",async()=>{
 if(!reviewSummary||!reviewPacket){note(reviewStatus,"Stage a verified proposal before sharing.");return;}
 if(code.value!==reviewCandidate){clearReview("Editor changed. Re-stage the proposal before sharing.");note(reviewStatus,"Review summary expired.");return;}
 if(!window.confirm("Post the proposal's file path, verified commit SHA and review checklist to your private Between the Flames board? This does not share code, approve or deploy it."))return;
 reviewHandoff.disabled=true;
 note(reviewStatus,"Posting the review summary to your authorized private handoff...");
 try{
  const response=await fetch(API+"/api/ai-handoff/notes",{
   method:"POST",credentials:"include",cache:"no-store",
   headers:{"Content-Type":"application/json"},
   body:JSON.stringify({category:"update",body:reviewSummary})
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(response.status===403?
   "Only Osiris and the accepted Between the Flames partner can post here.":
   String(data.error||"Private handoff post failed.").slice(0,180));
  if(!data.note?.id)throw Error("Board did not confirm a saved note.");
  note(reviewStatus,"Between the Flames saved review request #"+data.note.id+
   ". Neither the proposed code nor an approval was posted. You can open the board to continue review.");
 }catch(err){reviewHandoff.disabled=false;note(reviewStatus,String(err.message||"Unable to post summary."));}
});
async function handleCode(action){
 const text=code.value;
 if(!text.trim()){note(codeStatus,"Enter code first.");return;}
 if(encoder.encode(text).length>10000){note(codeStatus,"Code exceeds the 10 KB limit. Nothing was sent.");return;}
 const inspect=byId("studio-inspect"),format=byId("studio-format");
 inspect.disabled=true;format.disabled=true;
 note(codeStatus,action==="inspect"?"Checking syntax without running your code…":"Formatting through Knightfall's free Prettier Worker…");
 try{
  const input={code:text,language:language.value};
  const data=await utility(action==="inspect"?"dev.code_inspect":"dev.code_format",input);
  if(action==="inspect"){
   if(data.syntax_valid){
    const findings=(data.findings||[]).map(f=>f.rule+": "+f.message+" (line "+f.line+")");
    note(codeResults,"✓ Syntax valid. "+(data.parsed_nodes?data.parsed_nodes+" parsed nodes.":"")+"\n"+(findings.length?findings.join("\n"):"No flagged patterns in this limited inspection."));
    note(codeStatus,"Syntax inspection complete. This is not a full security audit.");
   }else{
    note(codeResults,"Syntax errors:\n"+(data.errors||[]).map(e=>e.message+(e.line?" at line "+e.line+", column "+e.column:"")).join("\n"));
    note(codeStatus,"Syntax needs repair before formatting.");
   }
  }else if(data.valid){
   beforeFormat=text;code.value=String(data.formatted||"");undo.disabled=false;
   note(codeResults,"Source formatted with Prettier. Review the result before using it.");
   note(codeStatus,data.changed?"Formatting applied. Undo is available.":"Code was already formatted.");
  }else{
   note(codeResults,"Formatter: "+String(data.error||"Invalid syntax."));
   note(codeStatus,"Formatting failed. Original code was not modified.");
  }
 }catch(error){
  note(codeStatus,String(error.message||"Could not reach the code tool."));
 }finally{inspect.disabled=false;format.disabled=false;}
}
byId("studio-inspect").addEventListener("click",()=>handleCode("inspect"));
byId("studio-format").addEventListener("click",()=>handleCode("format"));
undo.addEventListener("click",()=>{
 if(beforeFormat!==null){code.value=beforeFormat;beforeFormat=null;undo.disabled=true;note(codeStatus,"Last format undone.");}
});
code.addEventListener("keydown",e=>{
 if(e.key!=="Tab")return;
 e.preventDefault();
 const begin=code.selectionStart,end=code.selectionEnd,selected=code.value.slice(begin,end);
 if(e.shiftKey){
  const remove=selected.startsWith("  ")?2:selected.startsWith(" ")?1:0;
  if(remove){code.setRangeText(selected.slice(remove),begin,end,"select");}
 }else{code.setRangeText("  ",begin,end,"end");}
});
byId("studio-copy").addEventListener("click",async()=>{
 try{await navigator.clipboard.writeText(code.value);note(codeStatus,"Source copied.");}
 catch{note(codeStatus,"Clipboard access unavailable. Select the code and copy it manually.");}
});
byId("studio-save").addEventListener("click",()=>{
 download("chaos-code"+({javascript:".js",typescript:".ts",jsx:".jsx",tsx:".tsx",json:".json"}[language.value]||".txt"),code.value,"text/plain;charset=utf-8");
 note(codeStatus,"File prepared for download.");
});
byId("studio-import").addEventListener("change",async e=>{
 const f=e.target.files?.[0];
 if(!f)return;
 if(f.size>10000){note(codeStatus,"Only text files under 10 KB are supported.");e.target.value="";return;}
 if(!/\.(?:m?js|jsx|ts|tsx|json|txt)$/i.test(f.name)){note(codeStatus,"Use .js, .mjs, .jsx, .ts, .tsx, .json or .txt files.");e.target.value="";return;}
 try{
  const data=await f.text();
  if(encoder.encode(data).length>10000)throw Error("File text exceeds 10 KB.");
  code.value=data;beforeFormat=null;undo.disabled=true;
  language.value=/\.json$/i.test(f.name)?"json":/\.tsx$/i.test(f.name)?"tsx":/\.ts$/i.test(f.name)?"typescript":/\.jsx$/i.test(f.name)?"jsx":"javascript";
  note(codeStatus,"Local file loaded in the editor. Nothing uploaded.");
 }catch(err){note(codeStatus,String(err.message||"Could not open the file."));}
 e.target.value="";
});
function node(tag,attrs={},value){
 const element=document.createElementNS("http://www.w3.org/2000/svg",tag);
 for(const [key,val]of Object.entries(attrs))element.setAttribute(key,String(val));
 if(value!==undefined)element.textContent=String(value);
 return element;
}
function renderFlow(flow){
 const groups=new Map();
 for(const n of flow.nodes){
  const level=flow.layers[n.id]||0;
  if(!groups.has(level))groups.set(level,[]);
  groups.get(level).push(n);
 }
 const maxLevel=Math.max(...groups.keys()),maxPerRow=Math.max(...[...groups.values()].map(a=>a.length));
 const width=Math.max(690,maxPerRow*224+85),height=Math.max(280,(maxLevel+1)*118+75);
 const svg=node("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 "+width+" "+height,
  width,height,role:"img","aria-label":"Flowchart with "+flow.nodes.length+" steps"});
 svg.appendChild(node("rect",{width,height,fill:"#0c1019"}));
 const defs=node("defs"),marker=node("marker",{id:"chaos-arrow",markerWidth:10,markerHeight:10,refX:9,refY:4,
   orient:"auto",markerUnits:"strokeWidth"});marker.appendChild(node("path",{d:"M0 0 L9 4 L0 8 z",fill:"#84eabb"}));
 defs.appendChild(marker);svg.appendChild(defs);
 const coords=new Map();
 for(const [level,group]of groups){
  group.forEach((item,index)=>{
   coords.set(item.id,{x:width/2+(index-(group.length-1)/2)*224,y:35+level*118});
  });
 }
 for(const edge of flow.edges){
  const a=coords.get(edge.from),b=coords.get(edge.to);
  if(!a||!b)continue;
  const startY=a.y+62,endY=b.y-4;
  const controlY=(startY+endY)/2;
  svg.appendChild(node("path",{d:"M "+a.x+" "+startY+" C "+a.x+" "+controlY+", "+b.x+" "+controlY+", "+b.x+" "+endY,
    fill:"none",stroke:"#85edbb","stroke-width":2.5,"marker-end":"url(#chaos-arrow)"}));
 }
 for(const item of flow.nodes){
  const {x,y}=coords.get(item.id);
  svg.appendChild(node("rect",{x:x-95,y,width:190,height:62,rx:12,fill:"#33172e",stroke:"#eb69b9","stroke-width":1.8}));
  const words=item.label.split(/\s+/),chunks=[];let line="";
  for(const word of words){
   if((line+" "+word).trim().length>25&&line){chunks.push(line);line=word;}
   else line=(line+" "+word).trim();
  }
  if(line)chunks.push(line);
  const display=chunks.slice(0,2);
  const t=node("text",{x,y:y+(display.length===1?36:27),fill:"#fff1fa",
    "font-family":"Arial,sans-serif","font-size":13,"font-weight":"600","text-anchor":"middle"});
  for(const [i,value]of display.entries())t.appendChild(node("tspan",{x,dy:i?18:0},i===1&&chunks.length>2?value.slice(0,22)+"…":value));
  svg.appendChild(t);
 }
 return svg;
}
byId("studio-diagram-build").addEventListener("click",()=>{
 try{
  const graph=buildChaosFlow({steps:steps.value});
  currentSvg=renderFlow(graph);
  preview.replaceChildren(currentSvg);mermaidOutput.value=graph.mermaid;
  diagramSvg.disabled=false;diagramMermaid.disabled=false;
  note(diagramStatus,"Created "+graph.nodes.length+" nodes and "+graph.edges.length+" connections locally. No API calls.");
 }catch(error){
  currentSvg=null;preview.replaceChildren(node("svg",{width:1,height:1}));mermaidOutput.value="";
  diagramSvg.disabled=true;diagramMermaid.disabled=true;
  note(diagramStatus,String(error.message||"Invalid diagram steps."));
 }
});
diagramSvg.addEventListener("click",()=>{
 if(!currentSvg)return;
 const xml='<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(currentSvg);
 download("chaos-flowchart.svg",xml,"image/svg+xml;charset=utf-8");
});
diagramMermaid.addEventListener("click",()=>{
 if(mermaidOutput.value)download("chaos-flowchart.mmd",mermaidOutput.value,"text/plain;charset=utf-8");
});

let storedPatch="";
const beforeDiff=byId("studio-diff-before"),afterDiff=byId("studio-diff-after");
const diffOutput=byId("studio-diff-output"),diffStatus=byId("studio-diff-status");
const diffDownload=byId("studio-diff-export"),diffButton=byId("studio-diff-run");
const schema=byId("studio-schema"),documentData=byId("studio-json-data");
const schemaButton=byId("studio-schema-check"),schemaOutput=byId("studio-schema-output"),schemaStatus=byId("studio-schema-status");
byId("studio-copy-to-after").addEventListener("click",()=>{
 if(encoder.encode(code.value).length>5000){note(diffStatus,"Current editor exceeds the 5 KB comparison limit.");return;}
 afterDiff.value=code.value;storedPatch="";diffDownload.disabled=true;
 note(diffStatus,"Current editor copied to After. Nothing was changed in GitHub.");
});
diffButton.addEventListener("click",async()=>{
 const before=beforeDiff.value,after=afterDiff.value;
 if(encoder.encode(before).length>5000||encoder.encode(after).length>5000){
  note(diffStatus,"Each version must be 5 KB or smaller.");return;
 }
 diffButton.disabled=true;storedPatch="";diffDownload.disabled=true;
 note(diffStatus,"Comparing text. No code will execute and no patch will be applied.");
 try{
  const data=await utility("dev.code_diff",{before,after});
  storedPatch=String(data.unified_diff||"");
  note(diffOutput,storedPatch||"Identical source. Nothing changed.");
  diffDownload.disabled=!storedPatch;
  note(diffStatus,data.identical?"No differences detected.":"Comparison ready: "+data.added_lines+" added lines, "+data.removed_lines+" removed lines.");
 }catch(err){note(diffStatus,String(err.message||"Comparison failed."));note(diffOutput,"No verified diff.");}
 finally{diffButton.disabled=false;}
});
diffDownload.addEventListener("click",()=>{
 if(storedPatch)download("chaos-review.patch",storedPatch,"text/plain;charset=utf-8");
});
byId("studio-copy-json-data").addEventListener("click",()=>{
 if(language.value!=="json"){note(schemaStatus,"Switch the editor to JSON first.");return;}
 if(encoder.encode(code.value).length>5300){note(schemaStatus,"Editor JSON exceeds the 5.3 KB schema check limit.");return;}
 documentData.value=code.value;
 note(schemaStatus,"Current JSON editor copied into the validator. Nothing sent yet.");
});
schemaButton.addEventListener("click",async()=>{
 if(encoder.encode(schema.value).length>5300||encoder.encode(documentData.value).length>5300){
  note(schemaStatus,"Keep JSON and schema under 5.3 KB each.");return;
 }
 schemaButton.disabled=true;note(schemaStatus,"Validating document against your supplied safe schema…");
 try{
  const result=await utility("dev.json_shape",{schema:schema.value,document:documentData.value});
  const lines=result.errors?.map(e=>(e.path||"/")+": "+e.message)||[];
  note(schemaOutput,result.valid?"✓ JSON matches the supported schema subset.":lines.join("\n"));
  note(schemaStatus,result.valid?"Validation passed.":"Validation found "+lines.length+" issue(s).");
 }catch(e){note(schemaStatus,String(e.message||"Unable to validate."));note(schemaOutput,"No verified result.");}
 finally{schemaButton.disabled=false;}
});

// Diagram preview remains local and available without a signed-in account.
byId("studio-diagram-build").click();
