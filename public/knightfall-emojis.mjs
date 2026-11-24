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
  {code:":kf-venomrose:",name:"Venom Rose",file:"venom-rose.svg"}
]);

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
  const tray=doc?.getElementById?.("cs-emoji-tray");
  if(!tray||tray.dataset.kfEmojiMounted==="true")return 0;
  const buttons=KNIGHTFALL_EMOJIS.map(item=>{
    const button=doc.createElement("button");
    button.type="button";button.className="kf-custom-emoji";
    button.dataset.insertEmoji=item.code;button.setAttribute("aria-label","Insert "+item.name);
    button.title=item.name;
    const image=doc.createElement("img");image.src="/icons/emojis/"+item.file;
    image.alt="";image.width=28;image.height=28;image.setAttribute("aria-hidden","true");
    button.append(image);return button;
  });
  tray.append(...buttons);tray.dataset.kfEmojiMounted="true";
  return buttons.length;
}

if(typeof window!=="undefined"){
  window.KnightfallEmojis=Object.freeze({items:KNIGHTFALL_EMOJIS,render:renderKnightfallEmojiText,mount:mountKnightfallEmojiPicker});
  mountKnightfallEmojiPicker();
  window.__resolveKnightfallEmoji?.();
}
