import {extractTextract,validateTextractFile,buildTextractDraft,TEXTRACT_LIMITS} from "./chaos-textract-core.mjs";
const $=id=>document.getElementById(id);
const input=$("textract-file"),drop=$("textract-drop"),output=$("textract-output"),status=$("textract-status");
const extractButton=$("textract-extract"),stopButton=$("textract-stop"),copyButton=$("textract-copy");
const downloadButton=$("textract-download"),handoffButton=$("textract-handoff");
const nameLabel=$("textract-filename"),stats=$("textract-stats"),task=$("textract-task");
let currentFile=null,active=0,busy=false;
function report(message,isError=false){status.textContent=message;status.dataset.error=String(isError);}
function choose(file){
 try{
  validateTextractFile(file);
  currentFile=file;active++;output.value="";stats.textContent="";nameLabel.textContent=file.name+" · "+(file.size/1024/1024).toFixed(2)+" MB";
  extractButton.disabled=false;copyButton.disabled=true;downloadButton.disabled=true;handoffButton.disabled=true;
  report("Ready. Press Extract text. The original stays on your device.");
 }catch(error){currentFile=null;extractButton.disabled=true;report(error.message,true);}
}
function setBusy(on){busy=on;extractButton.disabled=on||!currentFile;stopButton.hidden=!on;input.disabled=on;}
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
   cancelled:()=>run!==active,ocrScans:$("textract-ocr-pdf").checked});
  if(run!==active)return;
  output.value=data.text;stats.textContent=data.characters.toLocaleString()+" characters · "+data.extension.toUpperCase()+(data.truncated?" · capped at "+TEXTRACT_LIMITS.chars.toLocaleString()+" characters":"");
  copyButton.disabled=false;downloadButton.disabled=false;handoffButton.disabled=false;
  report("Extracted on your device. Edit or verify the text, then copy, download, or stage a draft for Miss Chaos.");
 }catch(error){if(run===active)report(error?.message||"Extraction failed.",true);}
 finally{if(run===active)setBusy(false);}
});
stopButton.addEventListener("click",()=>{active++;setBusy(false);report("Stopped. No text was sent.");});
output.addEventListener("input",()=>{
 const hasText=Boolean(output.value.trim());
 copyButton.disabled=!hasText;downloadButton.disabled=!hasText;handoffButton.disabled=!hasText;
 stats.textContent=output.value.length.toLocaleString()+" characters · edited preview";
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
 currentFile=null;input.value="";output.value="";nameLabel.textContent="No file selected";
 stats.textContent="";copyButton.disabled=true;downloadButton.disabled=true;handoffButton.disabled=true;extractButton.disabled=true;
 report("Cleared. The browser has not uploaded your original file.");
});
