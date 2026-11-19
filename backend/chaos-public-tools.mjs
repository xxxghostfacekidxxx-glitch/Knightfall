/**
 * Small, maintained public-only navigation index. No private pages or member data.
 * These links guide Miss Chaos; they are NOT evidence that a feature is bug-free.
 */
export const PUBLIC_PAGES = Object.freeze([
  {title:"Miss Chaos",url:"/miss-chaos.html",terms:"ai assistant conversation history memory voice astrology"},
  {title:"Chaos Cartridge",url:"/chaos-cartridge.html",terms:"arcade games game catalog play puzzle action"},
  {title:"Chaosphere Messenger",url:"/chaosphere.html",terms:"messaging chat messages inbox friends messenger"},
  {title:"Members",url:"/members.html",terms:"find people search members profiles community"},
  {title:"Forums",url:"/community.html",terms:"forum discussions topics comments madhouse"},
  {title:"Personal Bots",url:"/personal-bots.html",terms:"create edit publish private personal bots companions slots"},
  {title:"Offline Personal Bots",url:"/personal-bots-offline.html",terms:"offline local bot backup export import device no internet"},
  {title:"Memo Pad",url:"/memo-pad.html",terms:"notes memos private notebook draft memo mail"},
  {title:"Private Die-ary",url:"/die-ary.html",terms:"my journal private diary die ary entries personal writing reflection diary notes"},
  {title:"Moonology",url:"/moonology.html",terms:"moon phase journal moonology lunar ritual"},
  {title:"Shadow Work",url:"/shadow-work.html",terms:"shadow work reflection journal prompts introspection"},
  {title:"Devil's Toolkit / Creator Foundry",url:"/devil-tools.html",terms:"developer tools coding workshop creator foundry art tools pixel studio atlas packer tilemap artwork sprites free opensource"},
  {title:"Shop",url:"/cinder-shop.html",terms:"shop merch currency cosmetics purchases"},
  {title:"Account",url:"/account.html",terms:"member account profile settings sign in"},
  {title:"Notifications",url:"/notifications.html",terms:"notification alerts unread push phone Android subscription settings devices"},
  {title:"Install Knightfall",url:"/install.html",terms:"install app PWA Android home screen mobile offline update installation"},
  {title:"AI Handoff",url:"/ai-handoff.html",terms:"shared to do list task coordination collaboration invite assistant handoff"},
  {title:"Chaos Code Studio",url:"/chaos-code-studio.html",terms:"free programming code editor syntax formatting prettier flowchart diagram mermaid debug inspect javascript json"},
  {title:"Chaos Visual Lab",url:"/chaos-visual-lab.html",terms:"free local browser image resize pixel art avatar sprite photo png webp export palette extraction swatches css tokens tattoo stencil blackwork transfer mirror threshold outline contour svg vector tracing 100 percent printable calibrated size millimeters mm a4 letter QR share Openverse creator artwork colors"},
  {title:"Chaos Forge",url:"/chaos-forge.html",terms:"clothing sewing pattern drafting craft blueprints 3d model viewer camera photo image analysis poly haven met wikidata free resource maker"},
  {title:"The Crucible",url:"/chaos-crucible.html",terms:"miss chaos creative workbench project builder brief blueprint tattoo character game design craft sewing coding writing markdown export private memo save maker projects"}
]);
export function searchPublicPages(input={}) {
  const query=String(input.query||"").trim().toLowerCase().slice(0,160);
  if(!query)return [];
  const stop=new Set(["where","what","which","find","page","link","please","the","and","for","are","can","how","site","website","show","me","our","you","your","with","about","no"]);
  const tokens=[...new Set(query.match(/[a-z0-9]{2,}/g)||[])].filter(t=>!stop.has(t)).slice(0,12);
  return PUBLIC_PAGES.map(page=>{
    const hay=(page.title+" "+page.terms).toLowerCase();
    return {...page,score:tokens.reduce((n,t)=>n+(hay.includes(t)?1:0),0)};
  }).filter(page=>page.score>0).sort((a,b)=>b.score-a.score).slice(0,5)
    .map(({title,url})=>({title,url}));
}
export const publicChaosHandlers=Object.freeze({
  "site.help":async({input})=>({results:searchPublicPages({query:input.topic})}),
  "site.games":async()=>({results:PUBLIC_PAGES.filter(page=>page.title==="Chaos Cartridge").map(({title,url})=>({title,url}))}),
  "site.search":async({input})=>({results:searchPublicPages(input)})
});
