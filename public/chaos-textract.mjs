import {extractTextract,validateTextractFile,buildTextractDraft,TEXTRACT_LIMITS} from "./chaos-textract-core.mjs";
import {textStats,findTextMatches,extractKeyValues,extractPossibleTableRows,makeTextractCsv,makeTextractTableCsv,makeTextractJson,compareTextractTexts,formatTextractComparison} from "./chaos-textract-lab-core.mjs";
const $=id=>document.getElementById(id);
const input=$("textract-file"),drop=$("textract-drop"),output=$("textract-output"),status=$("textract-status");
const extractButton=$("textract-extract"),stopButton=$("textract-stop"),copyButton=$("textract-copy");
const downloadButton=$("textract-download"),handoffButton=$("textract-handoff");
const nameLabel=$("textract-filename"),stats=$("textract-stats"),task=$("textract-task");
const rotationControl=$("textract-photo-rotation"),rotationSection=$("textract-photo-orientation");
let currentFile=null,active=0,busy=false;
function report(message,isError=false){status.textContent=message;status.dataset.error=String(isError);}
function choose(file){
 // Clear the previous document before validating a new selection: failed image
 // or unsupported file changes must never expose stale text as the new result.
 active++;currentFile=null;output.value="";stats.textContent="";
 rotationSection.hidden=true;
 // Switching the primary document also invalidates its prior comparison.
 compareToken++;compareBusy=false;secondFile=null;compareFile.value="";compareOutput.value="";
 compareStatus.textContent="Choose a second file after extracting this document.";updateCompareControls();
 copyButton.disabled=true;downloadButton.disabled=true;handoffButton.disabled=true;
 nameLabel.textContent="No valid file selected";renderInsights();
 try{
  validateTextractFile(file);
  currentFile=file;nameLabel.textContent=file.name+" · "+(file.size/1024/1024).toFixed(2)+" MB";
  rotationSection.hidden=!/\.(?:jpe?g|png|webp|gif)$/i.test(file.name);
  extractButton.disabled=false;
  report("Ready. Press Extract text. The original stays on your device.");
 }catch(error){extractButton.disabled=true;report(error.message,true);}
}
function setBusy(on){busy=on;extractButton.disabled=on||!currentFile;stopButton.hidden=!on;input.disabled=on;rotationControl.disabled=on;}
rotationSection.hidden=true;
rotationControl.addEventListener("change",()=>{
 if(!currentFile||rotationSection.hidden||busy)return;
 active++;output.value="";stats.textContent="";renderInsights();
 copyButton.disabled=true;downloadButton.disabled=true;handoffButton.disabled=true;
 report("Photo orientation updated. Extract again to use the new rotation.");
});
input.addEventListener("change",()=>{if(input.files?.[0])choose(input.files[0]);});
for(const type of ["dragenter","dragover"]){drop.addEventListener(type,event=>{event.preventDefault();drop.classList.add("drag");});}
for(const type of ["dragleave","drop"]){drop.addEventListener(type,event=>{event.preventDefault();drop.classList.remove("drag");});}
drop.addEventListener("drop",event=>{if(!busy&&event.dataTransfer?.files?.[0])choose(event.dataTransfer.files[0]);});
drop.addEventListener("keydown",event=>{if((event.key==="Enter"||event.key===" ")&&!busy){event.preventDefault();input.click();}});
drop.addEventListener("click",event=>{if(event.target!==input&&!busy)input.click();});
extractButton.addEventListener("click",async()=>{
 if(!currentFile||busy)return;
 const run=++active, file=currentFile;
 setBusy(true);output.value="";stats.textContent="";copyButton.disabled=true;downloadButton.disabled=true;handoffButton.disabled=true;
 report("Preparing extraction…");
 try{
  const data=await extractTextract(file,{notify:message=>{if(run===active)report(message);},
   cancelled:()=>run!==active,imageRotation:rotationControl.value==="auto"?"auto":Number(rotationControl.value)});
  if(run!==active)return;
  output.value=data.text;renderInsights();
  stats.textContent=data.characters.toLocaleString()+" characters · "+data.extension.toUpperCase()+
   " · "+(data.mode==="device-ocr"?"device OCR":data.mode==="original-ocr"?"experimental OCR":data.mode.replaceAll("-"," "))+
   (typeof data.confidence==="number"?" · rough glyph match "+Math.round(data.confidence*100)+"%":"")+
   (data.rotation?" · rotated "+data.rotation+"° clockwise":"")+
   (data.truncated?" · capped at "+TEXTRACT_LIMITS.chars.toLocaleString()+" characters":"");
  copyButton.disabled=false;downloadButton.disabled=false;handoffButton.disabled=false;
  report(data.warning||"Extracted by Knightfall original code on your device. Review accuracy before sharing.");
 }catch(error){if(run===active){
   output.value="";renderInsights();
   copyButton.disabled=true;downloadButton.disabled=true;handoffButton.disabled=true;
   report(error?.message||"Extraction failed. Try a clearer file or a different text-layer format.",true);
  }}
 finally{if(run===active)setBusy(false);}
});
stopButton.addEventListener("click",()=>{active++;setBusy(false);report("Stopped. No text was sent.");});
output.addEventListener("input",()=>{
 const hasText=Boolean(output.value.trim());
 copyButton.disabled=!hasText;downloadButton.disabled=!hasText;handoffButton.disabled=!hasText;
 stats.textContent=output.value.length.toLocaleString()+" characters · edited preview";
 renderInsights();
});
copyButton.addEventListener("click",async()=>{
 if(!output.value.trim())return;
 try{await navigator.clipboard.writeText(output.value);report("Text copied.");}
 catch{output.focus();output.select();report("Clipboard unavailable. The text is selected for manual copying.",true);}
});
downloadButton.addEventListener("click",()=>{
 if(!output.value.trim())return;
 const blob=new Blob([output.value],{type:"text/plain;charset=utf-8"});
 const url=URL.createObjectURL(blob);const anchor=document.createElement("a");
 anchor.href=url;anchor.download=(currentFile?.name||"document").replace(/\.[^.]+$/,"").replace(/[^\w.-]/g,"_").slice(0,75)+"-textract.txt";
 document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);
 report("Text exported to a .txt file on your device.");
});
function returnToChat(){
 const direct=new URLSearchParams(location.search).get("return");
 const sources=[direct,document.referrer];
 for(const source of sources){
  if(!source)continue;
  try{
   const target=new URL(source,location.origin);
   if(target.origin!==location.origin)continue;
   if(!["/miss-chaos.html","/samantha-chaos.html"].includes(target.pathname))continue;
   return target.pathname+(target.pathname==="/miss-chaos.html"&&target.searchParams.get("companion")==="owner"?"?companion=owner":"");
  }catch{}
 }
 return "/miss-chaos.html";
}
handoffButton.addEventListener("click",()=>{
 if(!output.value.trim())return;
 try{
  const text=buildTextractDraft(currentFile?.name||"document",output.value,task.value);
  sessionStorage.setItem("knightfall:textract-draft",JSON.stringify({text,at:Date.now()}));
  location.assign(returnToChat());
 }catch(error){report("Could not stage a private draft: "+(error?.message||"Unknown error")+". Use Copy instead.",true);}
});
$("textract-clear").addEventListener("click",()=>{
 if(busy){active++;setBusy(false);}
 currentFile=null;input.value="";output.value="";renderInsights();nameLabel.textContent="No file selected";
 rotationControl.value="auto";rotationSection.hidden=true;
 secondFile=null;compareFile.value="";compareOutput.value="";compareToken++;compareBusy=false;updateCompareControls();
 stats.textContent="";copyButton.disabled=true;downloadButton.disabled=true;handoffButton.disabled=true;extractButton.disabled=true;
 report("Cleared. The browser has not uploaded your original file.");
});

const labButtons=["textract-export-json","textract-export-csv","textract-export-fields","textract-export-tables"];
const search=$("textract-search"),results=$("textract-search-results"),found=$("textract-search-count"),
 fieldsPreview=$("textract-fields"),intelligenceStats=$("textract-intelligence-stats");
const compareFile=$("textract-compare-file"),compareButton=$("textract-compare"),
 compareStop=$("textract-compare-stop"),compareOutput=$("textract-compare-output"),
 compareStatus=$("textract-compare-status"),diffButton=$("textract-export-diff");
let secondFile=null,compareBusy=false,compareToken=0;
function downloadLocal(suffix,text,type="text/plain;charset=utf-8"){
 if(!String(text||"").trim())return;
 const filename=(currentFile?.name||"document").replace(/\.[^.]+$/,"").replace(/[^\w.-]/g,"_").slice(0,75);
 const blob=new Blob([text],{type});
 const href=URL.createObjectURL(blob);
 const a=document.createElement("a");a.href=href;a.download=filename+suffix;
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),15000);
}
function updateSearch(){
 results.replaceChildren();
 const matches=findTextMatches(output.value,search.value,80);
 found.textContent=search.value.trim()?matches.length+(matches.length===80?"+":"")+" matches shown":"";
 for(const match of matches){
  const li=document.createElement("li");li.textContent="Character "+(match.index+1)+" · "+match.snippet;
  const jump=document.createElement("button");jump.type="button";jump.textContent="Go";
  jump.style.cssText="margin-left:.5rem;padding:.15rem .45rem;font-size:.78rem";
  jump.addEventListener("click",()=>{output.focus();output.setSelectionRange(match.index,match.index+search.value.trim().length);});
  li.append(jump);results.append(li);
 }
}
function renderInsights(){
 const value=output.value;
 const hasText=Boolean(value.trim());
 const details=textStats(value);
 const fields=hasText?extractKeyValues(value,60):[];
 const tables=hasText?extractPossibleTableRows(value,500):[];
 intelligenceStats.textContent=hasText?
  details.words.toLocaleString()+" words · "+details.lines.toLocaleString()+" lines · "+
  details.sections+" sections · "+fields.length+(fields.length===60?"+":"")+" fields · "+
  tables.length+(tables.length===500?"+":"")+" table-like rows":
  "Extract a document to unlock statistics.";
 fieldsPreview.textContent=hasText?
  (fields.length?fields.slice(0,40).map(x=>x.key+": "+x.value).join("\n"):"No key-value pairs confidently detected."):
  "No document loaded.";
 for(const id of labButtons)$(id).disabled=!hasText;
 if(compareButton)compareButton.disabled=!hasText||!secondFile||busy||compareBusy;
 updateSearch();
}
search.addEventListener("input",updateSearch);
$("textract-export-json").addEventListener("click",()=>downloadLocal("-textract.json",makeTextractJson(currentFile?.name,output.value),"application/json;charset=utf-8"));
$("textract-export-csv").addEventListener("click",()=>downloadLocal("-lines.csv",makeTextractCsv(output.value),"text/csv;charset=utf-8"));
$("textract-export-fields").addEventListener("click",()=>downloadLocal("-fields.csv",makeTextractCsv(output.value,"fields"),"text/csv;charset=utf-8"));
$("textract-export-tables").addEventListener("click",()=>downloadLocal("-tables.csv",makeTextractTableCsv(output.value),"text/csv;charset=utf-8"));
function updateCompareControls(){
 compareButton.disabled=!secondFile||!output.value.trim()||busy||compareBusy;
 compareStop.hidden=!compareBusy;
 compareFile.disabled=compareBusy;
 diffButton.disabled=!compareOutput.value.trim();
}
compareFile.addEventListener("change",()=>{
 const chosen=compareFile.files?.[0];
 try{
  validateTextractFile(chosen);secondFile=chosen;
  compareStatus.textContent="Ready to compare with "+chosen.name+". Your original files stay local.";
 }catch(error){secondFile=null;compareStatus.textContent=error.message;}
 updateCompareControls();
});
compareButton.addEventListener("click",async()=>{
 if(!secondFile||!output.value.trim()||compareBusy||busy)return;
 const id=++compareToken,file=secondFile,original=output.value;
 compareBusy=true;compareOutput.value="";diffButton.disabled=true;updateCompareControls();
 compareStatus.textContent="Extracting second document locally…";
 try{
  const second=await extractTextract(file,{notify:message=>{if(id===compareToken)compareStatus.textContent=message;},
   cancelled:()=>id!==compareToken});
  if(id!==compareToken)return;
  const report=compareTextractTexts(original,second.text);
  compareOutput.value=formatTextractComparison(report);
  compareStatus.textContent=(report.identical?"No text changes.":report.reordered?"Text was rearranged.":"Changes detected.")+
   " Added: "+report.added.length+"; removed: "+report.removed.length+". Review against both originals.";
 }catch(error){if(id===compareToken)compareStatus.textContent=error?.message||"Comparison failed.";}
 finally{if(id===compareToken){compareBusy=false;updateCompareControls();}}
});
compareStop.addEventListener("click",()=>{
 compareToken++;compareBusy=false;updateCompareControls();
 compareStatus.textContent="Comparison stopped. Neither document was uploaded.";
});
diffButton.addEventListener("click",()=>downloadLocal("-comparison.txt",compareOutput.value));
renderInsights();

/* Local diagnostic: a tiny, public synthetic PDF helps distinguish engine
   problems from unreadable scans or unsupported source formats. */
const capability=$("textract-ocr-availability");
capability.textContent=typeof TextDetector==="function"?
 "This device exposes on-device text recognition for images. Results still need checking.":
 "This browser does not expose a native text detector. Image OCR will use the limited, experimental glyph reader.";
$("textract-self-test").addEventListener("click",()=>{
 if(busy)return;
 if(output.value.trim()&&!confirm("Replace the current text preview with a small PDF extraction self-test?"))return;
 const stream="BT (Knightfall Textract self-test passed) Tj ET";
 const pdf="%PDF-1.4\n1 0 obj << /Type /Page /Contents 2 0 R >>\nendobj\n"+
  "2 0 obj << /Length "+stream.length+" >>\nstream\n"+stream+"\nendstream\nendobj\n%%EOF";
 input.value="";
 choose(new File([pdf],"Knightfall-self-test.pdf",{type:"application/pdf"}));
 extractButton.click();
});
