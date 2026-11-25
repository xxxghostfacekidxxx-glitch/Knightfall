// Knightfall's first original emoji family. These shortcodes are plain message
// text; the renderer only replaces entries present in this fixed catalogue.
export const KNIGHTFALL_EMOJIS = Object.freeze([
  {code:":kf-imp:",name:"Chaos Imp",file:"chaos-imp.svg"},
  {code:":kf-ashes:",name:"Reborn in Ash",file:"reborn-ashes.svg"},
  {code:":kf-eye:",name:"Eye of Chaos",file:"eye-of-chaos.svg"},
  {code:":kf-heartbreak:",name:"Cracked Heart",file:"cracked-heart.svg"},
  {code:":kf-voidstar:",name:"Void Star",file:"void-star.svg"},
  {code:":kf-glitch:",name:"Glitch Gremlin",file:"glitch-gremlin.svg"},
  {code:":kf-bat:",name:"Midnight Bat",file:"midnight-bat.svg"},
  {code:":kf-skull:",name:"Grinning Skull",file:"grinning-skull.svg"},
  {code:":kf-dice:",name:"Loaded with Chaos",file:"chaos-dice.svg"},
  {code:":kf-paw:",name:"Trouble Paw",file:"trouble-paw.svg"},
  {code:":kf-crown:",name:"Cinder Crown",file:"cinder-crown.svg"},
  {code:":kf-venomrose:",name:"Venom Rose",file:"venom-rose.svg"},
  {code:":kf-screambean:",name:"Scream Bean",file:"scream-bean.svg"},
  {code:":kf-moltenhalo:",name:"Molten Halo",file:"molten-halo.svg"},
  {code:":kf-brokenhalo:",name:"Broken Halo",file:"broken-halo.svg"},
  {code:":kf-nightbite:",name:"Night Bite",file:"night-bite.svg"},
  {code:":kf-littlemenace:",name:"Little Menace",file:"little-menace.svg"},
  {code:":kf-cackle:",name:"Cackling Imp",file:"cackle.svg",category:"faces"},
  {code:":kf-rage:",name:"Rage Imp",file:"rage.svg",category:"faces"},
  {code:":kf-sob:",name:"Sobbing Gremlin",file:"sob.svg",category:"faces"},
  {code:":kf-blush:",name:"Bashful Demon",file:"blush.svg",category:"faces"},
  {code:":kf-deadpan:",name:"Deadpan Imp",file:"deadpan.svg",category:"faces"},
  {code:":kf-shocked:",name:"System Shock",file:"shocked.svg",category:"faces"},
  {code:":kf-lovebite:",name:"Lovebite",file:"lovebite.svg",category:"symbols"},
  {code:":kf-ghost:",name:"Glitch Ghost",file:"ghost.svg",category:"symbols"},
  {code:":kf-sparkbomb:",name:"Spark Bomb",file:"sparkbomb.svg",category:"chaos"},
  {code:":kf-chaoscoffee:",name:"Cursed Coffee",file:"chaoscoffee.svg",category:"chaos"},
  {code:":kf-minion:",name:"Minion Mouse",file:"minion.svg",category:"crew"},
  {code:":kf-tinyvillain:",name:"Tiny Villain",file:"tinyvillain.svg",category:"crew"}
]);

export const KNIGHTFALL_STICKERS=Object.freeze([
  {code:":kf-sticker-imp-party:",name:"Imp Unleashed",file:"sticker-imp-party.svg",category:"stickers",sticker:true},
  {code:":kf-sticker-minion-hug:",name:"Minion Mouse Hug",file:"sticker-minion-hug.svg",category:"stickers",sticker:true},
  {code:":kf-sticker-villain-plan:",name:"Tiny Villain's Master Plan",file:"sticker-villain-plan.svg",category:"stickers",sticker:true},
  {code:":kf-sticker-ghost-nope:",name:"Glitch Ghost Nope",file:"sticker-ghost-nope.svg",category:"stickers",sticker:true},
  {code:":kf-sticker-skull-sleep:",name:"Sleepy Skull",file:"sticker-skull-sleep.svg",category:"stickers",sticker:true},
  {code:":kf-sticker-cinder-love:",name:"Cinder Heart",file:"sticker-cinder-love.svg",category:"stickers",sticker:true}
]);
const expressiveMotion=new Map([["cackle","bounce"],["rage","shake"],["sob","sway"],["blush","pulse"],["shocked","bounce"],["ghost","sway"],["sparkbomb","shake"],["moltenhalo","pulse"],["sticker-imp-party","bounce"],["sticker-minion-hug","pulse"],["sticker-villain-plan","shake"],["sticker-ghost-nope","sway"]].map(([id,motion])=>[":kf-"+id+":",motion]));
const allItems=Object.freeze([...KNIGHTFALL_EMOJIS,...KNIGHTFALL_STICKERS]);
export function searchKnightfallEmojis(query="",category="all"){
  const terms=String(query).trim().toLowerCase().split(/\s+/).filter(Boolean);
  return allItems.filter(item=>(category==="all"||(item.category||"legacy")===category)&&terms.every(term=>(item.name+" "+item.code+" "+(item.category||"legacy")).toLowerCase().includes(term)));
}

const byCode = new Map(allItems.map(item=>[item.code,item]));
// Preferences contain only catalog shortcodes, never message text.
export function readEmojiPreferences(storage,account){
  const empty={favorites:[],recent:[]};
  if(!Number.isSafeInteger(Number(account))||Number(account)<1)return empty;
  const clean=values=>Array.isArray(values)?[...new Set(values.filter(code=>byCode.has(code)))]:[];
  try{const saved=JSON.parse(storage?.getItem("kf-emoji-prefs-"+Number(account))||"{}");return {favorites:clean(saved?.favorites).slice(0,allItems.length),recent:clean(saved?.recent).slice(0,12)};}catch{return empty;}
}
export function updateEmojiPreferences(storage,account,action,code){
  const prefs=readEmojiPreferences(storage,account);
  if(!Number.isSafeInteger(Number(account))||Number(account)<1||!byCode.has(code))return prefs;
  if(action==="favorite")prefs.favorites=prefs.favorites.includes(code)?prefs.favorites.filter(x=>x!==code):[code,...prefs.favorites].slice(0,allItems.length);
  else if(action==="recent")prefs.recent=[code,...prefs.recent.filter(x=>x!==code)].slice(0,12);
  else return prefs;
  try{storage?.setItem("kf-emoji-prefs-"+Number(account),JSON.stringify(prefs));}catch{}
  return prefs;
}
const shortcodePattern = /(:kf-[a-z0-9-]+:)/g;
const fallbackEscape = value=>String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));

export function renderKnightfallEmojiText(value,escapeHTML=fallbackEscape,{lineBreaks=false}={}) {
  const escape=typeof escapeHTML==="function"?escapeHTML:fallbackEscape;
  const raw=String(value??""),parts=raw.split(shortcodePattern),only=parts.filter(p=>p.trim()),jumbo=only.length>0&&only.length<=3&&only.every(p=>byCode.has(p));
  return parts.map(part=>{
    const item=byCode.get(part);
    if(!item)return lineBreaks?escape(part).replace(/\n/g,"<br>"):escape(part);
    const size=item.sticker?112:jumbo?44:28,motion=expressiveMotion.get(item.code);
    return '<img class="kf-emoji" src="/icons/emojis/'+item.file+'" alt="['+escape(item.name)+']" title="'+escape(item.name)+'" data-kf-code="'+item.code+'"'+(item.sticker?' data-kf-sticker="true"':jumbo?' data-kf-jumbo="true"':'')+(motion?' data-kf-motion="'+motion+'"':'')+' width="'+size+'" height="'+size+'" loading="lazy" decoding="async">';
  }).join("");
}

export function mountKnightfallEmojiPicker(root=typeof document!=="undefined"?document:null) {
  const doc=root?.ownerDocument||root;
  const trays=doc?.querySelectorAll?.("#cs-emoji-tray, #kf-chat-emoji-tray");
  if(!trays?.length)return 0;
  let mounted=0;
  for(const tray of trays){
    if(tray.dataset.kfEmojiMounted==="true")continue;
    const buttons=allItems.map(item=>{
    const button=doc.createElement("button");
    button.type="button";button.className="kf-custom-emoji";
    button.dataset.insertEmoji=item.code;button.setAttribute("aria-label","Insert "+item.name);
    button.title=item.name;if(item.sticker)button.dataset.sticker="true";
    const image=doc.createElement("img");image.src="/icons/emojis/"+item.file;
    image.alt="";image.width=28;image.height=28;image.setAttribute("aria-hidden","true");
    button.append(image);return button;
    });
    if(typeof tray.querySelector==="function"){
      const tools=doc.createElement("div");tools.className="kf-emoji-tools";
      const search=doc.createElement("input");search.type="search";search.placeholder="Find a Knightfall emoji…";search.setAttribute("aria-label","Search Knightfall emojis");
      const category=doc.createElement("select");category.setAttribute("aria-label","Emoji collection");
      for(const [value,label] of [["all","All originals"],["recent","Recently used"],["favorites","Favorites"],["legacy","First editions"],["faces","Imp moods"],["symbols","Symbols"],["chaos","Chaos"],["crew","Crew"],["stickers","Character stickers"]]){const opt=doc.createElement("option");opt.value=value;opt.textContent=label;category.append(opt);}
      const count=doc.createElement("small");count.className="kf-emoji-result-count";count.setAttribute("aria-live","polite");
      const star=doc.createElement("button");star.type="button";star.className="kf-emoji-star-mode";star.textContent="☆ Save favorites";star.setAttribute("aria-pressed","false");
      let starring=false,lastUsed=null;
      const account=()=>Number(tray.dataset.kfEmojiAccount)||0;
      const storage=()=>{try{return doc.defaultView?.localStorage}catch{return null}};
      const update=()=>{
        const prefs=readEmojiPreferences(storage(),account()),mode=category.value;
        const ids=mode==="recent"?prefs.recent:mode==="favorites"?prefs.favorites:null;
        const shown=new Set(searchKnightfallEmojis(search.value,ids?"all":mode).filter(item=>!ids||ids.includes(item.code)).map(x=>x.code));
        star.disabled=!account();star.textContent=starring?"★ Choose favorites":"☆ Save favorites";
        for(const button of buttons){const code=button.dataset.insertEmoji;button.hidden=!shown.has(code);button.dataset.favorite=String(prefs.favorites.includes(code));button.style.order=ids?String(Math.max(0,ids.indexOf(code))+1):"0";}
        count.textContent=shown.size+" originals"+(starring?" · Select an emoji to toggle favorite":"");
      };
      star.addEventListener("click",()=>{starring=!starring;star.setAttribute("aria-pressed",String(starring));update();});
      tray.addEventListener("click",event=>{
        const button=event.target.closest?.(".kf-custom-emoji[data-insert-emoji]");if(!button||!tray.contains(button))return;
        const code=button.dataset.insertEmoji;
        if(starring){event.preventDefault();event.stopImmediatePropagation();updateEmojiPreferences(storage(),account(),"favorite",code);update();return;}
        const input=tray.closest("form")?.querySelector("textarea");lastUsed={code,value:input?.value};
        // After existing composer handlers run, record only a successful insertion.
        queueMicrotask(()=>{if(lastUsed?.code===code&&input&&input.value!==lastUsed.value){updateEmojiPreferences(storage(),account(),"recent",code);update();}lastUsed=null;});
      },true);
      tray.addEventListener("kf:emoji-account",update);
      doc.defaultView?.addEventListener("storage",event=>{if(event.key==="kf-emoji-prefs-"+account())update();});
      tools.append(star);
      search.addEventListener("input",update);category.addEventListener("change",update);tools.prepend(search,category);tools.append(count);tray.prepend(tools);update();
      for(const button of buttons){button.querySelector("img").loading="lazy";}
    }
    tray.append(...buttons);tray.dataset.kfEmojiMounted="true";mounted+=buttons.length;
  }
  return mounted;
}

if(typeof window!=="undefined"){
  window.KnightfallEmojis=Object.freeze({items:KNIGHTFALL_EMOJIS,stickers:KNIGHTFALL_STICKERS,render:renderKnightfallEmojiText,mount:mountKnightfallEmojiPicker,search:searchKnightfallEmojis});
  mountKnightfallEmojiPicker();
  window.__resolveKnightfallEmoji?.();
}
