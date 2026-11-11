/* Knightfall profile wall. Render external content with textContent, not HTML. */
(() => {
"use strict";
const API="https://api.ash-fall.com";
const reactions=[["fire","🔥","Fire"],["heart","💚","Love"],["skull","💀","Skull"]];
async function api(path,options={}){
  const response=await fetch(API+path,{credentials:"include",cache:"no-store",...options,
    headers:{"content-type":"application/json",...(options.headers||{})}});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||"Request failed ("+response.status+").");
  return data;
}
const el=(tag,klass,content)=>{
  const node=document.createElement(tag);
  if(klass)node.className=klass;
  if(content!==undefined)node.textContent=String(content);
  return node;
};
const button=(label,klass,handler)=>{
  const node=el("button",klass,label);
  node.type="button";
  if(handler)node.addEventListener("click",handler);
  return node;
};
const date=value=>{
  const d=new Date(value);
  return Number.isNaN(d.getTime())?"Recently":d.toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"});
};
const makeStatus=(container,klass="profile-wall-status")=>{
  const node=el("p",klass);
  node.setAttribute("role","status");node.setAttribute("aria-live","polite");
  container.append(node);return node;
};
const showError=(status,error)=>{
  status.textContent=error instanceof Error?error.message:String(error);
};
async function mount(member,own,root,signedIn){
  if(!member?.username||!root)return;
  const section=el("section","profile-social-panel profile-wall");
  section.id="profile-wall";
  const header=el("div","profile-wall-heading");
  const introduction=el("div");
  introduction.append(el("p","eyebrow","THE MEMBER WALL"),el("h2","","Updates & conversations"),
    el("p","profile-wall-description","What this member is creating, thinking, and sharing. Ordinary community content only."));
  header.append(introduction);
  section.append(header);
  let editor=null;
  if(own){
    editor=el("form","profile-wall-composer");
    editor.id="profile-update-form";
    const textLabel=el("label","","Share something with your community");
    textLabel.htmlFor="profile-wall-body";
    const textarea=el("textarea");
    textarea.id="profile-wall-body";textarea.rows=3;textarea.maxLength=5000;textarea.required=true;
    textarea.placeholder="A project update, a thought, something you're working on…";
    const bottom=el("div","profile-wall-compose-bottom");
    const count=el("small","profile-wall-counter","0 / 5,000");
    textarea.addEventListener("input",()=>{count.textContent=textarea.value.length.toLocaleString()+" / 5,000";});
    const privacyLabel=el("label","profile-wall-privacy","Audience");
    const privacy=el("select");
    privacy.setAttribute("aria-label","Update visibility");
    for(const [value,label] of [["public","Everyone"],["followers","Followers"],["private","Only me"]]){
      const option=el("option","",label);option.value=value;privacy.append(option);
    }
    privacyLabel.append(privacy);
    const publish=el("button","action primary","Publish update");publish.type="submit";
    bottom.append(count,privacyLabel,publish);
    editor.append(textLabel,textarea,bottom);
    const feedback=makeStatus(editor);
    section.append(editor);
    editor.addEventListener("submit",async event=>{
      event.preventDefault();
      const body=textarea.value.trim();
      if(!body)return;
      publish.disabled=true;feedback.textContent="Publishing…";
      try{
        await api("/api/social/activity",{method:"POST",body:JSON.stringify({body,visibility:privacy.value})});
        textarea.value="";count.textContent="0 / 5,000";
        feedback.textContent="Published. Your update is on your wall.";
        await load(true);
      }catch(error){showError(feedback,error);}
      finally{publish.disabled=false;}
    });
  }
  const timeline=el("div","profile-wall-timeline");
  timeline.id="member-update-list";
  timeline.setAttribute("aria-live","polite");
  const footer=el("div","profile-wall-footer");
  const more=button("Load older updates","action profile-wall-more",()=>load(false));
  more.hidden=true;
  const listStatus=makeStatus(footer);
  footer.append(more);
  section.append(timeline,footer);
  root.append(section);
  let savedSection=null,savedFeed=null,savedStatus=null,savedLoading=false;
  if(own){
    savedSection=el("section","profile-wall profile-wall-saved");
    savedSection.id="profile-saved";
    const top=el("div","profile-wall-heading");
    const heading=el("div");
    heading.append(el("p","eyebrow","PRIVATE COLLECTION"),el("h2","","Saved updates"),
      el("p","profile-wall-description","Posts you've bookmarked. Only you can see this collection."));
    const refresh=button("↻ Refresh saved","action",()=>loadSaved());
    top.append(heading,refresh);
    savedFeed=el("div","profile-wall-saved-list");
    savedFeed.setAttribute("aria-live","polite");
    savedStatus=makeStatus(savedSection);
    savedSection.append(top,savedFeed);
    root.append(savedSection);
  }
  async function loadSaved(){
    if(!savedFeed||savedLoading)return;
    savedLoading=true;savedStatus.textContent="Loading saved updates…";
    try{
      const data=await api("/api/profile-wall/saved");
      savedFeed.replaceChildren();
      const entries=Array.isArray(data.posts)?data.posts:[];
      for(const entry of entries){
        const card=el("article","profile-wall-saved-item");
        const head=el("div","profile-wall-saved-top");
        const link=el("a","profile-wall-saved-author",entry.display_name||entry.username);
        link.href="/profile.html?username="+encodeURIComponent(entry.username)+"#profile-wall";
        link.append(el("small",""," @"+entry.username));
        const remove=button("Remove saved","profile-wall-subtle",async()=>{
          remove.disabled=true;
          try{
            await api("/api/profile-wall/posts/"+entry.id+"/bookmark",{method:"DELETE"});
            card.remove();
            savedStatus.textContent="Removed from saved updates.";
            if(!savedFeed.children.length)savedFeed.append(el("p","profile-wall-empty","Nothing saved yet."));
            for(const element of timeline.querySelectorAll("[data-bookmark-for]")){
              if(element.dataset.bookmarkFor===String(entry.id)){
                element.textContent="🔖 Save";
                element.setAttribute("aria-pressed","false");
                element.setAttribute("aria-label","Save update");
              }
            }
          }catch(error){showError(savedStatus,error);}
          finally{remove.disabled=false;}
        });
        head.append(link,remove);
        const body=el("p","profile-wall-post-body",entry.body);
        const when=el("small","profile-wall-saved-date","Saved "+date(entry.saved_at));
        card.append(head,body,when);
        savedFeed.append(card);
      }
      if(!entries.length)savedFeed.append(el("p","profile-wall-empty","No saved updates yet. Bookmark something worth keeping."));
      savedStatus.textContent=entries.length===30?"Showing your 30 most recent visible saved updates.":"";
    }catch(error){showError(savedStatus,error);}
    finally{savedLoading=false;}
  }
  let before=null,hasMore=true,loading=false,viewerId=null;
  async function load(reset=false){
    if(loading)return;
    if(!reset&&!hasMore)return;
    loading=true;more.disabled=true;listStatus.textContent="Loading updates…";
    const params=new URLSearchParams({username:member.username});
    if(!reset&&before)params.set("before",String(before));
    try{
      const data=await api("/api/profile-wall?"+params);
      viewerId=data.viewer_id??null;
      if(reset){timeline.replaceChildren();before=null;hasMore=true;}
      const posts=Array.isArray(data.posts)?data.posts:[];
      for(const post of posts)timeline.append(createPost(post));
      hasMore=!!data.has_more;
      before=data.next_before||null;
      more.hidden=!hasMore;
      if(!timeline.children.length)timeline.append(el("p","profile-wall-empty",own?
        "Your wall is ready. Start it with a project update or a little chaos.":"Nothing shared here yet."));
      listStatus.textContent="";
    }catch(error){showError(listStatus,error);}
    finally{loading=false;more.disabled=false;}
  }
  function createPost(post){
    const article=el("article","profile-wall-post");
    article.dataset.activityId=String(post.id);
    const head=el("div","profile-wall-post-head");
    const identity=el("div","profile-wall-post-identity");
    const name=el("strong","",member.display_name||member.username);
    const meta=el("small","",date(post.created_at)+(own?" · "+post.visibility:""));
    identity.append(name,meta);
    const actions=el("div","profile-wall-owner-actions");
    if(own){
      actions.append(button("Edit","profile-wall-subtle",()=>editPost()));
      actions.append(button("Delete","profile-wall-subtle profile-wall-destructive",()=>deletePost()));
    }
    head.append(identity,actions);
    const body=el("p","profile-wall-post-body",post.body);
    const reactionsRow=el("div","profile-wall-reactions");
    reactionsRow.setAttribute("role","group");
    reactionsRow.setAttribute("aria-label","React to update");
    const renderReactions=()=>{
      reactionsRow.replaceChildren();
      for(const [key,emoji,label] of reactions){
        const current=post.my_reaction===key;
        const count=Number(post[key+"_count"]||0);
        const reactionButton=button(emoji+" "+label+" · "+count,"profile-wall-reaction",async()=>{
          if(!signedIn){note.textContent="Sign in to react to posts.";return;}
          reactionButton.disabled=true;
          try{
            const method=current?"DELETE":"POST";
            const response=await api("/api/profile-wall/posts/"+post.id+"/reactions",{
              method,body:method==="POST"?JSON.stringify({reaction:key}):undefined
            });
            const previous=post.my_reaction;
            if(previous)post[previous+"_count"]=Math.max(0,Number(post[previous+"_count"]||0)-1);
            post.my_reaction=response.reaction||null;
            if(post.my_reaction)post[post.my_reaction+"_count"]=Number(post[post.my_reaction+"_count"]||0)+1;
            renderReactions();note.textContent="Reaction saved.";
          }catch(error){showError(note,error);reactionButton.disabled=false;}
        });
        reactionButton.setAttribute("aria-pressed",String(current));
        reactionButton.setAttribute("aria-label",label+" reaction, "+count+" total");
        reactionsRow.append(reactionButton);
      }
    };
    const note=makeStatus(article,"profile-wall-action-status");
    const discussion=el("div","profile-wall-discussion");
    const discussionButton=button("💬 Comments · "+Number(post.comment_count||0),"profile-wall-comments-toggle",async()=>{
      const expanded=discussionButton.getAttribute("aria-expanded")==="true";
      discussionButton.setAttribute("aria-expanded",String(!expanded));
      if(expanded){discussion.hidden=true;return;}
      discussion.hidden=false;
      if(!discussion.dataset.loaded)await loadComments(true);
    });
    discussionButton.setAttribute("aria-expanded","false");
    discussion.hidden=true;
    const commentsList=el("div","profile-wall-comment-list");
    const commentsFeedback=makeStatus(discussion);
    const older=button("Older comments","profile-wall-subtle",()=>loadComments(false));older.hidden=true;
    const commentComposer=el("form","profile-wall-comment-form");
    if(signedIn){
      const label=el("label","","Leave a comment");
      label.htmlFor="profile-wall-reply-"+post.id;
      const input=el("textarea");
      input.id=label.htmlFor;input.maxLength=1000;input.rows=2;input.required=true;
      input.placeholder="Keep the conversation going…";
      const send=el("button","action primary","Reply");send.type="submit";
      commentComposer.append(label,input,send);
      commentComposer.addEventListener("submit",async event=>{
        event.preventDefault();
        const value=input.value.trim();if(!value)return;
        send.disabled=true;commentsFeedback.textContent="Posting reply…";
        try{
          await api("/api/profile-wall/posts/"+post.id+"/comments",{method:"POST",body:JSON.stringify({body:value})});
          input.value="";
          post.comment_count=Number(post.comment_count||0)+1;
          discussionButton.textContent="💬 Comments · "+post.comment_count;
          await loadComments(true);
        }catch(error){showError(commentsFeedback,error);}
        finally{send.disabled=false;}
      });
    }else commentComposer.append(el("p","profile-wall-signin","Sign in to leave a comment."));
    discussion.append(commentsList,older,commentComposer);
    const controls=el("div","profile-wall-post-controls");
    controls.append(reactionsRow,discussionButton);
    if(signedIn){
      const bookmark=button(post.is_saved?"🔖 Saved":"🔖 Save","profile-wall-save",async()=>{
        bookmark.disabled=true;
        const alreadySaved=bookmark.getAttribute("aria-pressed")==="true";
        try{
          const result=await api("/api/profile-wall/posts/"+post.id+"/bookmark",{
            method:alreadySaved?"DELETE":"POST"
          });
          post.is_saved=!!result.saved;
          bookmark.textContent=post.is_saved?"🔖 Saved":"🔖 Save";
          bookmark.setAttribute("aria-pressed",String(post.is_saved));
          bookmark.setAttribute("aria-label",post.is_saved?"Remove saved update":"Save update");
          note.textContent=post.is_saved?"Added to your saved updates.":"Removed from saved updates.";
          if(own)await loadSaved();
        }catch(error){showError(note,error);}
        finally{bookmark.disabled=false;}
      });
      bookmark.dataset.bookmarkFor=String(post.id);
      bookmark.setAttribute("aria-pressed",String(!!post.is_saved));
      bookmark.setAttribute("aria-label",post.is_saved?"Remove saved update":"Save update");
      controls.append(bookmark);
    }
    let reportForm=null;
    if(signedIn&&!own){
      const reportToggle=button("⚑ Report","profile-wall-report-toggle",()=>{
        const expanded=reportToggle.getAttribute("aria-expanded")==="true";
        reportToggle.setAttribute("aria-expanded",String(!expanded));
        reportForm.hidden=expanded;
        if(!expanded)reportReason.focus();
      });
      reportToggle.setAttribute("aria-expanded","false");
      reportForm=el("form","profile-wall-report-form");
      reportForm.hidden=true;
      const heading=el("strong","","Report this update to moderators");
      const reasonLabel=el("label","","Reason");
      const reportReason=el("select");
      reportReason.required=true;
      for(const [value,label] of [["","Choose a reason"],["Spam","Spam or advertising"],["Harassment","Harassment or bullying"],["Hateful content","Hateful content"],["Impersonation","Impersonation"],["Other","Other concern"]]){
        const option=el("option","",label);option.value=value;reportReason.append(option);
      }
      reasonLabel.append(reportReason);
      const detailsLabel=el("label","","More details (optional)");
      const details=el("textarea");details.maxLength=1000;details.rows=2;
      details.placeholder="Describe the issue without repeating private information…";
      detailsLabel.append(details);
      const reportSend=el("button","action","Send report");reportSend.type="submit";
      const reportCancel=button("Cancel","profile-wall-subtle",()=>{
        reportForm.hidden=true;reportToggle.setAttribute("aria-expanded","false");
      });
      const reportActions=el("div","profile-wall-report-actions");
      reportActions.append(reportSend,reportCancel);
      const reportStatus=makeStatus(reportForm);
      reportForm.append(heading,reasonLabel,detailsLabel,reportActions);
      reportForm.append(reportStatus);
      reportForm.addEventListener("submit",async event=>{
        event.preventDefault();
        if(!reportReason.value)return;
        reportSend.disabled=true;reportStatus.textContent="Sending report…";
        try{
          await api("/api/social/report",{
            method:"POST",
            body:JSON.stringify({
              object_type:"activity",object_id:String(post.id),
              reported_user_id:Number(post.user_id),reason:reportReason.value,details:details.value.trim()
            })
          });
          reportStatus.textContent="Report received by Knightfall moderators.";
          reportSend.hidden=true;reportCancel.textContent="Close";
        }catch(error){showError(reportStatus,error);}
        finally{reportSend.disabled=false;}
      });
      controls.append(reportToggle);
    }
    article.append(head,body,controls,discussion);
    if(reportForm)article.append(reportForm);
    article.append(note);
    renderReactions();
    let commentsBefore=null,commentsBusy=false;
    async function loadComments(reset=false){
      if(commentsBusy)return;
      commentsBusy=true;older.disabled=true;commentsFeedback.textContent="Loading comments…";
      const query=new URLSearchParams();
      if(!reset&&commentsBefore)query.set("before",String(commentsBefore));
      try{
        const data=await api("/api/profile-wall/posts/"+post.id+"/comments?"+query);
        if(reset){commentsList.replaceChildren();commentsBefore=null;}
        const comments=Array.isArray(data.comments)?data.comments:[];
        for(const c of comments){
          const item=el("div","profile-wall-comment");
          const link=el("a","profile-wall-comment-author",c.display_name||c.username);
          link.href="/profile.html?username="+encodeURIComponent(c.username||"");
          const time=el("small","",date(c.created_at));
          const copy=el("p","",c.body);
          item.append(link,time,copy);
          if(signedIn&&(own||String(c.user_id)===String(viewerId))){
            const remove=button("Remove","profile-wall-subtle",async()=>{
              if(!window.confirm("Remove this comment?"))return;
              remove.disabled=true;
              try{
                await api("/api/profile-wall/comments/"+c.id,{method:"DELETE"});
                item.remove();post.comment_count=Math.max(0,Number(post.comment_count||0)-1);
                discussionButton.textContent="💬 Comments · "+post.comment_count;
                commentsFeedback.textContent="Comment removed.";
              }catch(error){showError(commentsFeedback,error);remove.disabled=false;}
            });item.append(remove);
          }
          commentsList.append(item);
        }
        if(!commentsList.children.length)commentsList.append(el("p","profile-wall-empty","No comments yet."));
        commentsBefore=data.next_before||null;
        older.hidden=!data.has_more;
        discussion.dataset.loaded="yes";
        commentsFeedback.textContent="";
      }catch(error){showError(commentsFeedback,error);}
      finally{commentsBusy=false;older.disabled=false;}
    }
    function editPost(){
      if(article.querySelector(".profile-wall-edit"))return;
      const form=el("form","profile-wall-edit");
      const textarea=el("textarea");textarea.value=post.body;textarea.maxLength=5000;textarea.rows=4;textarea.required=true;
      const selector=el("select");selector.setAttribute("aria-label","Edited post visibility");
      for(const [value,label] of [["public","Everyone"],["followers","Followers"],["private","Only me"]]){
        const option=el("option","",label);option.value=value;selector.append(option);
      }
      selector.value=post.visibility;
      const save=el("button","action primary","Save changes");save.type="submit";
      const cancel=button("Cancel","action",()=>form.remove());
      const footer=el("div","profile-wall-edit-actions");
      footer.append(selector,save,cancel);form.append(textarea,footer);
      form.addEventListener("submit",async event=>{
        event.preventDefault();save.disabled=true;
        try{
          const value=textarea.value.trim();
          await api("/api/profile-wall/posts/"+post.id,{method:"PATCH",body:JSON.stringify({body:value,visibility:selector.value})});
          post.body=value;post.visibility=selector.value;body.textContent=value;
          meta.textContent=date(post.created_at)+" · "+selector.value+" · Edited";
          form.remove();note.textContent="Update edited.";
        }catch(error){showError(note,error);save.disabled=false;}
      });
      body.after(form);textarea.focus();
    }
    async function deletePost(){
      if(!window.confirm("Delete this update and hide all of its comments?"))return;
      try{
        await api("/api/profile-wall/posts/"+post.id,{method:"DELETE"});
        article.remove();listStatus.textContent="Update deleted.";
        if(!timeline.children.length)timeline.append(el("p","profile-wall-empty","No updates to show yet."));
      }catch(error){showError(note,error);}
    }
    return article;
  }
  await load(true);
  if(own){
    await loadSaved();
    if(location.hash==="#profile-saved")savedSection?.scrollIntoView({block:"start",behavior:"auto"});
  }
}
window.KnightfallProfileWall={mount};
})();
