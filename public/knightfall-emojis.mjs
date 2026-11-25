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

export function searchKnightfallEmojis(query="",category="all"){
  const terms=String(query).trim().toLowerCase().split(/\s+/).filter(Boolean);
  return KNIGHTFALL_EMOJIS.filter(item=>(category==="all"||(item.category||"legacy")===category)&&terms.every(term=>(item.name+" "+item.code+" "+(item.category||"legacy")).toLowerCase().includes(term)));
}

const byCode = new Map(KNIGHTFALL_EMOJIS.map(item=>[item.code,item]));
const shortcodePattern = /(:kf-[a-z0-9-]+:)/g;
const fallbackEscape = value=>String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));

export function renderKnightfallEmojiText(value,escapeHTML=fallbackEscape,{lineBreaks=false}={}) {
  const escape=typeof escapeHTML==="function"?escapeHTML:fallbackEscape;
  return String(value??"").split(shortcodePattern).map(part=>{
    const item=byCode.get(part);
    if(!item)return lineBreaks?escape(part).replace(/\n/g,"<br>"):escape(part);
    return '<img class="kf-emoji" src="/icons/emojis/'+item.file+'" alt="['+escape(item.name)+']" title="'+escape(item.name)+'" width="28" height="28" loading="lazy" decoding="async">';
  }).join("");
}

export function mountKnightfallEmojiPicker(root=typeof document!=="undefined"?document:null) {
  const doc=root?.ownerDocument||root;
  const trays=doc?.querySelectorAll?.("#cs-emoji-tray, #kf-chat-emoji-tray");
  if(!trays?.length)return 0;
  let mounted=0;
  for(const tray of trays){
    if(tray.dataset.kfEmojiMounted==="true")continue;
    const buttons=KNIGHTFALL_EMOJIS.map(item=>{
    const button=doc.createElement("button");
    button.type="button";button.className="kf-custom-emoji";
    button.dataset.insertEmoji=item.code;button.setAttribute("aria-label","Insert "+item.name);
    button.title=item.name;
    const image=doc.createElement("img");image.src="/icons/emojis/"+item.file;
    image.alt="";image.width=28;image.height=28;image.setAttribute("aria-hidden","true");
    button.append(image);return button;
    });
    if(typeof tray.querySelector==="function"){
      const tools=doc.createElement("div");tools.className="kf-emoji-tools";
      const search=doc.createElement("input");search.type="search";search.placeholder="Find a Knightfall emoji…";search.setAttribute("aria-label","Search Knightfall emojis");
      const category=doc.createElement("select");category.setAttribute("aria-label","Emoji collection");
      for(const [value,label] of [["all","All originals"],["legacy","First editions"],["faces","Imp moods"],["symbols","Symbols"],["chaos","Chaos"],["crew","Crew"]]){const opt=doc.createElement("option");opt.value=value;opt.textContent=label;category.append(opt);}
      const count=doc.createElement("small");count.className="kf-emoji-result-count";count.setAttribute("aria-live","polite");
      const update=()=>{const shown=new Set(searchKnightfallEmojis(search.value,category.value).map(x=>x.code));for(const button of buttons)button.hidden=!shown.has(button.dataset.insertEmoji);count.textContent=shown.size+" originals";};
      search.addEventListener("input",update);category.addEventListener("change",update);tools.append(search,category,count);tray.prepend(tools);update();
      for(const button of buttons){button.querySelector("img").loading="lazy";}
    }
    tray.append(...buttons);tray.dataset.kfEmojiMounted="true";mounted+=buttons.length;
  }
  return mounted;
}

if(typeof window!=="undefined"){
  window.KnightfallEmojis=Object.freeze({items:KNIGHTFALL_EMOJIS,render:renderKnightfallEmojiText,mount:mountKnightfallEmojiPicker,search:searchKnightfallEmojis});
  mountKnightfallEmojiPicker();
  window.__resolveKnightfallEmoji?.();
}
