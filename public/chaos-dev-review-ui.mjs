/* Eye of Chaos: human-supervised full-file developer review queue.
 * This UI is NOT authorization; the Worker enforces staff + delegated review.
 * It never executes candidate source or calls a GitHub write/deploy endpoint.
 */
const panel=document.getElementById("chaos-dev-review-panel");
if(panel){
 const root=document.getElementById("chaos-dev-review-list");
 const status=document.getElementById("chaos-dev-review-status");
 const refresh=document.getElementById("chaos-dev-review-refresh");
 const endpoint="https://api.ash-fall.com/api/chaos/dev-reviews";
 const make=(tag,text,cls)=>{
   const el=document.createElement(tag);if(text!==undefined)el.textContent=String(text);
   if(cls)el.className=cls;
   return el;
 };
 const note=(message,error=false)=>{status.textContent=String(message||"");status.dataset.error=String(error);};
 let fetching=false;
 async function call(path="",method="GET",body){
   const res=await fetch(endpoint+path,{
     method,credentials:"include",cache:"no-store",
     headers:method==="GET"?{accept:"application/json"}:
       {accept:"application/json","content-type":"application/json"},
     ...(method==="GET"?{}:{body:JSON.stringify(body)})
   });
   const data=await res.json().catch(()=>({}));
   if(!res.ok)throw Error(String(data.error||"Developer review request failed.").slice(0,230));
   return data;
 }
 async function decision(row,verb,field,approveButton,rejectButton){
   const message=field.value.trim();
   if(message.length<12||message.length>600){note("Add a specific 12–600 character decision note.",true);return;}
   if(!window.confirm((verb==="approve"?"Approve":"Reject")+" exactly revision "+row.revision+" of "+row.path+" at "+row.source_sha.slice(0,12)+"? "+
     "Your decision will be recorded. NO source will be applied, tested, committed or deployed."))return;
   approveButton.disabled=true;rejectButton.disabled=true;
   note((verb==="approve"?"Revalidating main and recording approval":"Recording rejection")+" for "+row.path+"…");
   try{
     const result=await call("/"+row.id+"/"+verb,"POST",{revision:row.revision,note:message});
     if(!result.ok||result.status!==(verb==="approve"?"approved":"rejected"))
       throw Error("Server did not confirm the review decision.");
     note("Recorded "+result.status+" for "+row.path+". Source remains unintegrated and undeployed.");
     await loadReviews(true);
   }catch(error){
     approveButton.disabled=false;rejectButton.disabled=false;
     note(String(error.message||"Review decision unavailable."),true);
   }
 }
 async function expandReview(row,slot,button,canApprove){
   if(slot.dataset.loaded==="true"){slot.hidden=!slot.hidden;return;}
   button.disabled=true;
   try{
     const detail=await call("/"+row.id);
     if(detail.source_sha!==row.source_sha||detail.revision!==row.revision||
        detail.status!==row.status)throw Error("Proposal changed. Refresh the list before reviewing.");
     slot.replaceChildren();
     const heading=make("p","Immutable base: "+detail.source_sha+
       " · Source: "+detail.path+" · "+detail.syntax_status+" static syntax status","chaos-note");
     slot.append(heading);
     const files=make("a","View original source on GitHub");
     files.href=detail.source_url;files.target="_blank";files.rel="noopener noreferrer";slot.append(files);
     const diffTitle=make("h4","Verified stored proposal diff");
     const diff=make("pre",detail.diff,"chaos-dev-review-code");
     slot.append(diffTitle,diff);
     for(const [title,value] of [["Before · immutable original",detail.original],["After · proposed complete file",detail.candidate]]){
       const container=make("details");
       const summary=make("summary",title);
       const code=make("pre",value,"chaos-dev-review-code");
       container.append(summary,code);slot.append(container);
     }
     const audit=make("p",Array.isArray(detail.events)?
       "Recorded decisions: "+detail.events.map(e=>e.action+" by account "+e.actor_id+" ("+e.occurred_at+")").join("; "):
       "No audit record available","chaos-note");
     slot.append(audit);
     if(detail.status==="pending"&&canApprove){
       const area=make("div",undefined,"chaos-dev-review-decision");
       const label=make("label","Required review note (12–600 characters)");
       const field=make("textarea");field.maxLength=600;field.rows=3;
       field.placeholder="What did you check? Which tests and integration steps remain?";
       label.append(field);
       const buttons=make("div",undefined,"chaos-actions");
       const approve=make("button","Approve for separate integration review");
       approve.type="button";
       const reject=make("button","Reject this proposal","chaos-quiet");
       reject.type="button";
       approve.addEventListener("click",()=>void decision(detail,"approve",field,approve,reject));
       reject.addEventListener("click",()=>void decision(detail,"reject",field,approve,reject));
       buttons.append(approve,reject);area.append(label,buttons);slot.append(area);
     }
     slot.dataset.loaded="true";slot.hidden=false;
   }catch(error){note(String(error.message||"Cannot inspect review."),true);}
   finally{button.disabled=false;}
 }
 async function loadReviews(afterDecision=false){
   if(fetching)return;
   fetching=true;refresh.disabled=true;
   if(!afterDecision)note("Loading verified staff code proposals…");
   try{
     const response=await call("?status=all");
     root.replaceChildren();
     const rows=Array.isArray(response.reviews)?response.reviews:[];
     if(!rows.length){
       root.append(make("p","No submitted code changes. Prepare a complete small source file in Chaos Code Studio.","chaos-empty"));
     }
     for(const row of rows){
       const card=make("article",undefined,"chaos-card chaos-dev-review-item");
       const title=make("h4",row.path+" · "+String(row.status).toUpperCase());
       const metadata=make("p","Revision "+row.revision+" · base "+row.source_sha.slice(0,12)+
         " · "+row.syntax_status+" static syntax · author #"+row.created_by+
         " · "+row.created_at,"chaos-note");
       const description=make("p",row.change_summary);
       const explanation=make("p",row.status==="approved"
         ?"Human review approved. CI on this candidate, code integration, production deployment and device verification are NOT complete."
         :row.status==="rejected"
         ?"Rejected: "+String(row.review_note||"No note supplied.")
         :"Human review required before any separate integration process.","chaos-note");
       const toggle=make("button","Inspect immutable proposal","chaos-quiet");
       toggle.type="button";
       const slot=make("div",undefined,"chaos-dev-review-details");
       slot.hidden=true;
       toggle.addEventListener("click",()=>void expandReview(row,slot,toggle,response.can_approve===true));
       card.append(title,metadata,description,explanation,toggle,slot);
       root.append(card);
     }
     if(!afterDecision)note(rows.length+" developer proposal(s) listed. This docket cannot run code or deploy it.");
   }catch(error){
     root.replaceChildren();
     note(String(error.message||"Developer review docket unavailable."),true);
   }finally{fetching=false;refresh.disabled=false;}
 }
 refresh.addEventListener("click",()=>void loadReviews());
 const approvalsTab=document.querySelector('.chaos-tabs button[data-section="approvals"]');
 approvalsTab?.addEventListener("click",()=>void loadReviews());
}
