(()=>{
"use strict";
const API="https://api.ash-fall.com",ROOT="/api/god/eye";
const $=id=>document.getElementById(id);
const status=$("eye-status"),results=$("eye-results");
let current=null,next=0,hasMore=false,showingTrash=false;
function element(tag,cls,value){const node=document.createElement(tag);if(cls)node.className=cls;if(value!==undefined)node.textContent=String(value);return node}
function message(text){status.textContent=text}
async function request(path,opts={}){
 const r=await fetch(API+path,{credentials:"include",cache:"no-store",...opts});
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(data.error||"Request failed ("+r.status+").");
 return data;
}
const post=(path)=>request(path,{method:"POST"});
function time(value){if(!value)return "";const d=new Date(String(value));return Number.isFinite(d.getTime())?d.toLocaleString():String(value)}
function renderRecord(category,item){
 const card=element("article","eye-result"),top=element("header");
 top.append(element("span","",category.replaceAll("_"," ").toUpperCase()+" / "+String(item.id??item.user_id??item.entry_date??"record")));
 top.append(element("time","",time(item.created_at||item.updated_at)));
 card.append(top);
 if(item.username||item.sender)card.append(element("h3","", "@"+String(item.username||item.sender)));
 const code=element("pre","");code.textContent=JSON.stringify(item,null,2);card.append(code);
 if(["profile_photos","message_attachments","vault_files"].includes(category)&&/^image\/(png|jpeg|webp|gif)$/.test(String(item.content_type||""))){
   const img=document.createElement("img");img.loading="lazy";
   img.alt="Private stored image";img.referrerPolicy="no-referrer";
   let id=String(item.id);
   if(category==="vault_files")id=id.replace(/^vault\//,"");
   img.src=API+ROOT+"/media/"+category+"/"+encodeURIComponent(id);
   card.append(img);
 }
 return card;
}
async function loadProgress(){
 const grid=$("eye-progress-grid"),status=$("eye-progress-status"),button=$("eye-progress-refresh");button.disabled=true;status.textContent="Checking actual research records…";
 try{const d=await request(ROOT+"/roundtable/progress");if(d.kind!=="research-aggregate")throw Error("Evidence unavailable");const sum=(list,key,value)=>Number(list.find(r=>r[key]===value)?.n||0);
 grid.replaceChildren();for(const [label,value] of [["Completed assignments",sum(d.runs,"status","complete")],["Failed assignments",sum(d.runs,"status","failed")],["Manual tool records",sum(d.tools,"provenance","manual")],["Other tool records",sum(d.tools,"provenance","other")],["Approved knowledge",sum(d.knowledge,"review_status","approved")],["Peer exchanges",d.lessons]]){const card=element("div","eye-progress-stat");card.append(element("strong","",value),element("small","",label));grid.append(card);}status.textContent=(d.enabled?"Collector enabled":"Collector paused")+" · "+time(d.as_of);
 }catch(e){grid.replaceChildren();status.textContent=e.message;}finally{button.disabled=false;}
}
$("eye-progress-refresh").addEventListener("click",loadProgress);
async function loadRoundtable(){
 const panel=$("eye-roundtable"),picker=$("eye-episode"),lines=$("eye-roundtable-lines"),notice=$("eye-roundtable-status");
 panel.hidden=false;
 try{const d=await request(ROOT+"/roundtable");if(d.kind!=="authored-fiction"||!Array.isArray(d.episodes))throw Error("Editorial unavailable");
 picker.replaceChildren();for(const ep of d.episodes){const option=element("option","",ep.title);option.value=ep.id;picker.append(option);}
 function render(){const ep=d.episodes.find(x=>x.id===picker.value);lines.replaceChildren();if(!ep)return;for(const [name,division,body] of ep.turns){const row=element("article","eye-whisper");row.dataset.speaker=name.toLowerCase();const mark=element("span","eye-whisper-mark",name.slice(0,1));mark.setAttribute("aria-hidden","true");const copy=element("div","eye-whisper-copy");copy.append(element("h3","",name),element("small","",division),element("p","",body));row.append(mark,copy);lines.append(row);}notice.textContent="Authored fictional conversation · "+ep.date;}
 const prev=$("eye-episode-prev"),next=$("eye-episode-next"),copy=$("eye-episode-copy");function select(i){picker.selectedIndex=Math.max(0,Math.min(d.episodes.length-1,i));render();prev.disabled=picker.selectedIndex===0;next.disabled=picker.selectedIndex===d.episodes.length-1;}picker.addEventListener("change",()=>select(picker.selectedIndex));prev.addEventListener("click",()=>select(picker.selectedIndex-1));next.addEventListener("click",()=>select(picker.selectedIndex+1));copy.addEventListener("click",async()=>{const ep=d.episodes[picker.selectedIndex];try{await navigator.clipboard.writeText(ep.title+"\n\n"+ep.turns.map(t=>t[0]+": "+t[2]).join("\n\n"));notice.textContent="Copied authored fictional episode.";}catch{notice.textContent="Clipboard unavailable.";}});select(d.episodes.length-1);void loadProgress();try{const mod=await import("/mad-court.mjs?v=20261127-fractured1");mod.mountCourt();}catch{$("court-status").textContent="Fractured Mind engine unavailable.";}
 }catch(e){notice.textContent=e.message;}
}

let alienReport=null;
async function loadLearning(){const panel=$("eye-learning"),out=$("eye-learning-status"),rows=$("eye-learning-rows"),refresh=$("eye-learning-refresh");refresh.disabled=true;out.textContent="Reading recorded agent progress…";try{const d=await request(ROOT+"/tools/learning");if(d.kind!=="recorded-peer-evidence"||!Array.isArray(d.agents))throw Error("Learning evidence unavailable.");panel.hidden=false;rows.replaceChildren();for(const a of d.agents){const row=element("tr");const cell=element("td"),button=element("button","eye-subtle",a.name);button.type="button";button.addEventListener("click",async()=>{const detail=$("eye-learning-detail");detail.textContent="Loading curriculum…";try{const result=await request(ROOT+"/tools/learning/"+encodeURIComponent(a.key));detail.textContent=a.name+" · "+JSON.stringify({reviewedKnowledge:result.evidence,sharedReviewedKnowledge:result.sharedReviewed||[],softwareResearchReferences:result.softwareReferences||[],peerCurriculum:result.curriculum||null,latestPeerAssessment:result.peerAssessment||null,codingPractice:result.codingPractice||null,note:"Reference delivery only; pending tool metadata is not approved training data."},null,2);}catch(error){detail.textContent=error.message;}});cell.append(button);row.append(cell);for(const v of [a.division,a.completed,a.failed,a.discoveries,a.learned,a.teachers,time(a.lastLesson)||"Never"])row.append(element("td","",v));rows.append(row);}const trained=d.agents.filter(a=>a.learned>0).length;out.textContent=(d.enabled?"Collector enabled":"Collector disabled")+(d.masterPaused?" · Master pause active":"")+" · "+trained+"/"+d.agents.length+" agents have reviewed knowledge receipts. All registered agents can access shared reviewed references; individual receipts are historical delivery records, not proof of comprehension.";}catch(e){rows.replaceChildren();out.textContent=e.message;}finally{refresh.disabled=false;}}
$("eye-learning-refresh").addEventListener("click",loadLearning);
$("eye-tutor-form").addEventListener("submit",async e=>{e.preventDefault();const button=$("eye-tutor-run"),out=$("eye-tutor-result");button.disabled=true;out.textContent="Searching the original curriculum…";try{const r=await request(ROOT+"/tools/original-tutor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:$("eye-tutor-input").value})});out.textContent=r.answer?JSON.stringify(r,null,2):"Insufficient curriculum evidence. No answer invented.";}catch(error){out.textContent=error.message;}finally{button.disabled=false;}});
$("eye-local-model-form").addEventListener("submit",async e=>{e.preventDefault();const button=$("eye-local-model-run"),out=$("eye-local-model-result");button.disabled=true;out.textContent="Generating with original local weights…";try{const r=await request(ROOT+"/tools/local-model",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:$("eye-local-model-input").value,seed:Number($("eye-local-model-seed").value),model:$("eye-local-model-version").value})});out.textContent=JSON.stringify(r,null,2);}catch(error){out.textContent=error.message;}finally{button.disabled=false;}});
$("eye-format-form").addEventListener("submit",async e=>{e.preventDefault();const button=$("eye-format-run"),out=$("eye-format-result");button.disabled=true;out.textContent="Running trained checkpoint…";try{const result=await request(ROOT+"/tools/format-classify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:$("eye-format-input").value})});out.textContent=JSON.stringify(result,null,2);}catch(error){out.textContent=error.message;}finally{button.disabled=false;}});
async function loadTools(){
 const panel=$("eye-tool-review"),list=$("eye-tools-list"),notice=$("eye-tools-status");
 try{const data=await request(ROOT+"/tools");panel.hidden=false;list.replaceChildren();notice.textContent=data.publication;$("eye-learning").hidden=false;void loadLearning();
 const alien=data.tools.find(t=>t.id==="alien-eyes");$("eye-alien-panel").hidden=!alien||alien.decision==="scrapped";
 for(const tool of data.tools){
 const card=element("article","eye-result"),select=element("select",""),label=element("label","","Osiris availability"),save=element("button","eye-subtle","Save decision");
 for(const [value,name] of [["osiris","Authorized · Osiris only"],["scrapped","Disable / scrap tool"]]){const option=element("option","",name);option.value=value;select.append(option);}
 select.value=tool.decision;label.append(select);save.type="button";
 save.addEventListener("click",async()=>{const decision=select.value;if(decision===tool.decision)return;if(!confirm("Save "+decision+" review decision for "+tool.name+"? Access remains Osiris-only."))return;save.disabled=true;try{await request(ROOT+"/tools/"+encodeURIComponent(tool.id)+"/decision",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({decision})});alienReport=null;$("eye-alien-report").textContent="";$("eye-alien-export").disabled=true;await loadTools();}catch(e){notice.textContent=e.message;save.disabled=false;}});
 card.append(element("h3","",tool.name),element("p","",tool.description),element("p","","Current decision: "+tool.decision+" · execution: "+tool.execution),label,save);if(tool.source){const source=element("a","","Upstream project");source.href=tool.source;source.rel="noopener noreferrer";source.target="_blank";const inspect=element("button","eye-subtle","Check upstream readiness"),out=element("pre","");inspect.type="button";inspect.disabled=tool.decision==="scrapped";inspect.addEventListener("click",async()=>{inspect.disabled=true;out.textContent="Checking upstream…";try{const result=await request(ROOT+"/tools/"+encodeURIComponent(tool.id)+"/inspect");out.textContent=JSON.stringify(result,null,2);}catch(e){out.textContent=e.message;}finally{inspect.disabled=false;}});card.append(element("p","",String(tool.license||"Unverified")+" · "+String(tool.division||"")),source,inspect,out);}list.append(card); }
 }catch(e){panel.hidden=true;notice.textContent=e.message;}
}
$("eye-alien-form").addEventListener("submit",async e=>{e.preventDefault();const button=$("eye-alien-run"),status=$("eye-alien-status");if(button.disabled)return;button.disabled=true;alienReport=null;$("eye-alien-export").disabled=true;$("eye-alien-report").textContent="";status.textContent="Inspecting project, languages, license, release and manifest inventory…";try{const data=await request(ROOT+"/tools/alien-eyes/inspect?"+new URLSearchParams({repository:$("eye-alien-repo").value,detail:"full"}));alienReport=data.report;$("eye-alien-report").textContent=JSON.stringify(alienReport,null,2);$("eye-alien-export").disabled=false;status.textContent="Inspection complete.";}catch(error){status.textContent=error.message;}finally{button.disabled=false;}});
$("eye-alien-catalog").addEventListener("click",async()=>{const button=$("eye-alien-catalog"),out=$("eye-alien-catalog-output");button.disabled=true;out.textContent="Reading scheduled reports…";try{const data=await request(ROOT+"/tools/alien-eyes/catalog");out.textContent=data.reports.length?JSON.stringify(data.reports,null,2):"No scheduled reports recorded yet.";}catch(e){out.textContent=e.message;}finally{button.disabled=false;}});
$("eye-alien-export").addEventListener("click",()=>{if(!alienReport)return;const url=URL.createObjectURL(new Blob([JSON.stringify(alienReport,null,2)],{type:"application/json"}));const link=element("a","");link.href=url;link.download="alien-eyes-project.json";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});

async function browse(continued=false){
 const category=$("eye-category").value;
 const user=$("eye-user").value.trim();
 if(user&&(!Number.isSafeInteger(Number(user))||Number(user)<1)){message("Provide a positive member ID.");return}
 const offset=continued?next:0;
 const params=new URLSearchParams({category,limit:"20",offset:String(offset)});
 if(user)params.set("user_id",user);
 message("Reading "+category.replaceAll("_"," ")+"…");
 try{
   const data=await request(ROOT+"/browse?"+params);
   if(!continued)results.replaceChildren();
   for(const item of data.items||[])results.append(renderRecord(category,item));
   if(!results.childElementCount)results.append(element("p","", "No stored records found."));
   next=offset+(data.items||[]).length;
   hasMore=data.has_more===true;
   $("eye-next").hidden=!hasMore;current={category,user};
   showingTrash=false;$("eye-count").textContent=next+" retained record(s) shown";
   message("GOD record browser ready.");
 }catch(e){message(e.message)}
}
async function trash(){
 showingTrash=true;results.replaceChildren();$("eye-next").hidden=true;message("Opening soft-deleted vault…");
 try{
   const data=await request("/api/god/trash");
   for(const entry of data.items||[]){
     const card=element("article","eye-result");
     const title=element("h3","",entry.category.replaceAll("_"," ")+" #"+entry.id);
     card.append(title,element("small","", "Owner: "+(entry.user_id||"Unknown")+" · Deleted: "+time(entry.deleted_at)));
     card.append(element("pre","",entry.label||"No description"));
     const controls=element("div","eye-toolbar");
     for(const [act,label] of [["restore","Restore"],["purge","Permanently purge"]]){
       const button=element("button","eye-subtle",label);button.type="button";
       button.addEventListener("click",async()=>{
         if(act==="purge"&&!confirm("PERMANENTLY DELETE this soft-deleted item? This cannot be undone, including its associated files."))return;
         button.disabled=true;
         try{
           const url="/api/god/trash/"+encodeURIComponent(entry.category)+"/"+encodeURIComponent(String(entry.id))+"/"+act;
           const params=entry.category==="moon_journal"||entry.category==="shadow_journal"?"?user_id="+encodeURIComponent(String(entry.user_id)):"";
           await post(url+params);message(act==="purge"?"Permanent deletion completed.":"Item restored.");await trash();
         }catch(e){message(e.message);button.disabled=false}
       });
       controls.append(button);
     }
     card.append(controls);results.append(card);
   }
   if(!results.childElementCount)results.append(element("p","", "No soft-deleted content found in indexed collections."));
   $("eye-count").textContent=(data.items||[]).length+" soft-deleted item(s)";
   message("GOD recovery vault ready.");
 }catch(e){message(e.message)}
}
$("eye-browse-form").addEventListener("submit",e=>{e.preventDefault();browse(false)});
$("eye-next").addEventListener("click",()=>{
 if(!showingTrash&&hasMore&&current){
   if(current.category===$("eye-category").value&&current.user===$("eye-user").value.trim())browse(true);
   else browse(false);
 }
});
$("eye-trash").addEventListener("click",trash);
(async()=>{
 try{
   const data=await request(ROOT+"/status");
   if(!data.god)throw Error("GOD access required.");
   const picker=$("eye-category");
   for(const item of data.datasets||[]){
     const option=document.createElement("option");option.value=item.id;option.textContent=item.label;picker.append(option);
   }
   $("eye-workspace").hidden=false;
   message("GOD access confirmed.");
   await loadRoundtable();
   await loadTools();
   if(location.hash!=="#eye-tool-review") await browse(false);
 }catch(e){$("eye-denied").hidden=false;message(e.message)}
})();
async function downloadForgeFile(file){
 const r=await fetch(API+ROOT+"/tools/forge-download/"+encodeURIComponent(file.id),{credentials:"include",cache:"no-store"});
 if(!r.ok)throw Error("Download failed ("+r.status+").");
 const blob=await r.blob();const bytes=await blob.arrayBuffer();
 if(file.sha256){const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)),x=>x.toString(16).padStart(2,"0")).join("");if(hash!==file.sha256)throw Error("Download checksum mismatch.");}
 const url=URL.createObjectURL(blob),a=element("a");a.href=url;a.download=file.filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
async function refreshForgeFiles(){
 const out=$("eye-forge-files");out.replaceChildren();
 try{const r=await request(ROOT+"/tools/forge");for(const file of r.artifacts||[]){
 if(!/^[a-f0-9-]{36}$/.test(file.id))continue;
 const row=element("article","eye-result"),download=element("button","eye-subtle","Download"),del=element("button","eye-subtle","Delete");
 const type=file.filename.endsWith(".html")?"Offline browser applet":file.filename.endsWith(".wasm")?"WebAssembly executable module":"Portable bytecode / report";
 row.append(element("strong","",file.filename),element("p","",type+" · "+file.byte_count+" bytes · Expires "+time(file.expires_at)),element("small","","SHA-256: "+file.sha256));
 download.type=del.type="button";download.addEventListener("click",async()=>{download.disabled=true;try{await downloadForgeFile(file);}catch(e){$("eye-forge-result").textContent=e.message;}finally{download.disabled=false;}});
 del.addEventListener("click",async()=>{if(!confirm("Delete this download?"))return;try{await request(ROOT+"/tools/forge-download/"+file.id,{method:"DELETE"});await refreshForgeFiles();}catch(e){$("eye-forge-result").textContent=e.message;}});
 row.append(download,del);out.append(row);
 }if(!out.children.length)out.textContent="No active artifacts.";}catch(e){out.textContent=e.message;}
}
const forgePicker=$("eye-forge-tool"),forgeInput=$("eye-forge-input"),forgeFile=$("eye-forge-file");
function showForgeTool(){const opt=forgePicker.selectedOptions[0];$("eye-forge-description").textContent=opt.dataset.description||"";forgeInput.value=opt.dataset.example||"";forgeFile.value="";}
forgePicker.addEventListener("change",showForgeTool);
$("eye-forge-example").addEventListener("click",showForgeTool);
forgeFile.addEventListener("change",async()=>{try{
 const file=forgeFile.files[0];if(!file)return;if(file.size>32768)throw Error("File exceeds 32 KiB.");
 const opt=forgePicker.selectedOptions[0],prefix=opt.dataset.prefix;if(!prefix)throw Error("Select a decompiler or source analyzer first.");
 const data=prefix.includes("wasm")||prefix.includes("function")?Array.from(new Uint8Array(await file.arrayBuffer()),b=>b.toString(16).padStart(2,"0")).join(""):await file.text();
 if(prefix.length+data.length>65536)throw Error("Encoded command exceeds size limit.");
 forgeInput.value=prefix+data;$("eye-forge-result").textContent="Loaded file locally. Run Forge to analyze it.";
 }catch(e){$("eye-forge-result").textContent=e.message;}});
$("eye-forge-refresh").addEventListener("click",refreshForgeFiles);
$("eye-forge-form").addEventListener("submit",async e=>{
 e.preventDefault();const btn=$("eye-forge-run"),out=$("eye-forge-result");btn.disabled=true;out.textContent="Running independent Forge…";$("eye-forge-latest").replaceChildren();
 try{const r=await request(ROOT+"/tools/forge",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:forgeInput.value})});out.textContent=r.answer;
 if(r.artifact){const btn=element("button","eye-subtle","Download "+r.artifact.filename);btn.type="button";btn.addEventListener("click",async()=>{btn.disabled=true;try{await downloadForgeFile(r.artifact);}catch(error){out.textContent=error.message;}finally{btn.disabled=false;}});$("eye-forge-latest").append(btn);}
 await refreshForgeFiles();}catch(error){out.textContent=error.message;}finally{btn.disabled=false;}
});
showForgeTool();
})();
