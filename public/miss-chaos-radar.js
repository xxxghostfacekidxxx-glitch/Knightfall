(() => {
  "use strict";
  const byId=id=>document.getElementById(id);
  const panel=byId("chaos-radar"), arcade=byId("radar-arcade-form"), shadow=byId("radar-shadow-form");
  const status=byId("radar-status"), results=byId("radar-results");
  const tabs=[...panel.querySelectorAll("[data-radar-mode]")];
  let mode="arcade", pending;
  if (window.matchMedia("(pointer: coarse)").matches) arcade.elements.device.value="touch";

  function node(tag,text){
    const item=document.createElement(tag);
    if(text)item.textContent=text;
    return item;
  }
  function link(text,path){
    const href=typeof path==="string"&&/^\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.html(?:#[a-z0-9_-]+)?$/.test(path)?path:"/miss-chaos.html";
    const item=node("a",text); item.href=href; return item;
  }
  function draft(text){
    const button=node("button","Discuss with Miss Chaos");button.type="button";
    button.addEventListener("click",()=>{
      const composer=byId("message-input");
      if(composer.disabled){status.textContent="Open one of your own conversations to discuss this.";return;}
      const next=[composer.value.trim(),text].filter(Boolean).join("\n\n");
      if(next.length>composer.maxLength){status.textContent="Your draft is full. Shorten it before adding this.";return;}
      composer.value=next;composer.dispatchEvent(new Event("input"));
      panel.close();composer.focus();
    });
    return button;
  }
  function card(title,detail){
    const article=node("article");
    article.append(node("h3",title),node("p",detail));
    results.append(article);return article;
  }
  function render(data){
    if(data.kind==="arcade"){
      for(const game of data.results){
        const item=card(game.title,game.description);
        item.append(node("p",[game.genre,game.shelf,game.controls].join(" · ")),link("Open "+game.title,game.url));
      }
      results.append(link("Browse the full arcade",data.url));
      status.textContent=data.results.length?data.results.length+" picks from the arcade catalog.":"No games matched. Try a different genre or control filter.";
    }else if(data.kind==="moon"){
      const next=new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"short"}).format(new Date(data.next_at));
      const item=card(data.icon+" "+data.phase,data.illumination+"% illuminated");
      item.append(node("p","Next primary phase: "+data.next_phase+" · "+next+" (local time)"),
        node("p",data.prompt),link("Open Moonology",data.url),
        draft("What is the current Moon phase? Give me an optional reflection prompt based on it."));
      status.textContent="";
    }else if(data.kind==="shadow"){
      const item=card(data.name,data.cue);
      item.append(node("p",data.question),link("Open Shadow Journal",data.journal_url),
        draft("Help me reflect on this optional Shadow Work prompt about "+data.name+": "+data.question));
      status.textContent="";
    }else throw Error("Radar returned an unexpected response.");
  }
  async function load(){
    pending?.abort();
    const request=new AbortController();pending=request;
    const params=new URLSearchParams({kind:mode});
    const form=mode==="arcade"?arcade:mode==="shadow"?shadow:null;
    if(form)for(const [key,value] of new FormData(form))if(value)params.set(key,value);
    results.replaceChildren();status.textContent="Tuning in…";
    try{
      const response=await fetch("https://api.ash-fall.com/api/chaos/radar?"+params,{
        credentials:"omit",cache:"no-store",signal:request.signal
      });
      const data=await response.json();
      if(request!==pending||!panel.open)return;
      if(!response.ok)throw Error(data.error||"Radar is temporarily unavailable.");
      render(data);
    }catch(error){
      if(request===pending&&panel.open&&error.name!=="AbortError")status.textContent=error.message||"Could not reach Radar.";
    }
  }
  for(const tab of tabs)tab.addEventListener("click",()=>{
    mode=tab.dataset.radarMode;
    for(const item of tabs)item.setAttribute("aria-pressed",String(item===tab));
    arcade.hidden=mode!=="arcade";shadow.hidden=mode!=="shadow";
    load();
  });
  for(const form of [arcade,shadow])form.addEventListener("submit",event=>{event.preventDefault();load()});
  byId("chaos-radar-open").addEventListener("click",()=>{panel.showModal();load()});
  byId("chaos-radar-close").addEventListener("click",()=>panel.close());
  panel.addEventListener("close",()=>{pending?.abort();pending=undefined;});
})();
