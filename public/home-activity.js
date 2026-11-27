(() => {
  "use strict";
  const root=document.getElementById("home-activity");
  if(!root)return;
  const $=id=>document.getElementById(id);
  const API="https://api.ash-fall.com";
  const list=$("home-activity-list"),status=$("home-activity-status");
  const more=$("home-activity-more"),composer=$("home-activity-composer");
  let cursor=null,busy=false,canPost=false;
  async function api(path,options={}) {
    const response=await fetch(API+path,{credentials:"include",cache:"no-store",...options});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw Error(data.error||"Activity could not be loaded.");
    return data;
  }
  const make=(tag,className,text)=>{
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(text!==undefined)node.textContent=String(text);
    return node;
  };
  function dateLabel(value) {
    if(!value)return "";
    const parsed=new Date(String(value).replace(" ","T")+(String(value).includes("Z")||String(value).includes("+")?"":"Z"));
    return Number.isFinite(parsed.getTime())?parsed.toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"}):String(value);
  }
  function postCard(post) {
    const card=make("article","activity-post");
    const top=make("div","activity-post-top");
    top.append(make("span","activity-post-category",post.category||"update"));
    const time=make("time","activity-post-time",dateLabel(post.created_at));
    time.dateTime=post.created_at;
    top.append(time);
    card.append(top,make("h3","",post.title),make("p","activity-post-body",post.body));
    const footer=make("div","activity-post-footer");
    const author=make("span","",("@" + post.username)+" · "+post.author_title);
    footer.append(author);
    if(post.can_delete){
      const remove=make("button","activity-delete","Remove");
      remove.type="button";
      remove.addEventListener("click",async()=>{
        if(!confirm("Remove this announcement from the homepage?"))return;
        remove.disabled=true;
        try{await api("/api/home/activity/"+post.id,{method:"DELETE"});await reload();status.textContent="Announcement removed.";}
        catch(e){status.textContent=e.message;remove.disabled=false;}
      });
      footer.append(remove);
    }
    card.append(footer);
    return card;
  }
  async function load(append=false) {
    if(busy)return;
    busy=true;more.disabled=true;
    if(!append)status.textContent="Loading the latest from staff…";
    try {
      const params=new URLSearchParams({limit:"8"});
      if(append&&cursor)params.set("before",String(cursor));
      const data=await api("/api/home/activity?"+params.toString());
      canPost=data.can_post===true;
      composer.hidden=!canPost;
      if(!append)list.replaceChildren();
      for(const post of data.posts||[])list.append(postCard(post));
      if(!list.childElementCount)list.append(make("p","activity-empty","No staff updates yet. The feed is ready for its first announcement."));
      cursor=data.next_before||null;
      more.hidden=!cursor;
      status.textContent=list.querySelectorAll(".activity-post").length+" staff update(s)";
    }catch(error){
      status.textContent="Couldn't load activity: "+error.message;
      if(!append&&!list.childElementCount)list.append(make("p","activity-empty","Updates are temporarily unavailable."));
    }finally{busy=false;more.disabled=false;}
  }
  async function reload(){cursor=null;await load(false);}
  more.addEventListener("click",()=>{if(cursor)load(true);});
  composer.addEventListener("submit",async e=>{
    e.preventDefault();
    if(!canPost||busy)return;
    const submit=composer.querySelector('button[type="submit"]');
    submit.disabled=true;
    status.textContent="Publishing your update…";
    try{
      const data=Object.fromEntries(new FormData(composer).entries());
      await api("/api/home/activity",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)});
      composer.reset();await reload();status.textContent="Your announcement is live.";
    }catch(error){status.textContent=error.message;}
    finally{submit.disabled=false;}
  });
  // The activity wire is below the main entry points. Fetch shortly before
  // it enters view rather than competing with the first screen and auth.
  if(typeof IntersectionObserver==="function"){
    status.textContent="Staff updates load as you approach this section.";
    const observer=new IntersectionObserver(entries=>{
      if(!entries.some(entry=>entry.isIntersecting))return;
      observer.disconnect();
      void load();
    },{rootMargin:"400px 0px"});
    observer.observe(root);
  }else void load();
})();
