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
  {title:"Creator Foundry · Tool Workspaces",url:"/devil-tools.html",terms:"where is creator foundry devil toolkit developer tools coding workshop tool workspace how to use tutorial teach guide art tools pixel studio atlas packer tilemap artwork sprites free opensource"},
  {title:"Legendary Families",url:"/legendary-families.html",terms:"legendary families boogie minion mouse mini villain the eddie bubblemaw specter nox ruckus midnight mayhem tiny tyrants companion art gallery"},
  {title:"Textract · Miss Chaos Document Reader",url:"/chaos-textract.html",terms:"textract OCR recognize scanned text image document PDF DOCX XLSX PPTX extract words photo copy download file"},
  {title:"Shop",url:"/cinder-shop.html",terms:"shop merch currency cosmetics purchases"},
  {title:"Account",url:"/account.html",terms:"member account profile settings sign in"},
  {title:"Notifications",url:"/notifications.html",terms:"notification alerts unread push phone Android subscription settings devices"},
  {title:"Install Knightfall",url:"/install.html",terms:"install app PWA Android home screen mobile offline update installation"},
  {title:"AI Handoff",url:"/ai-handoff.html",terms:"shared to do list task coordination collaboration invite assistant handoff"},
  {title:"Chaos Code Studio",url:"/chaos-code-studio.html",terms:"free programming code editor syntax formatting prettier flowchart diagram mermaid debug inspect javascript json"},
  {title:"Chaos Visual Lab",url:"/chaos-visual-lab.html",terms:"free local browser image resize pixel art avatar sprite photo png webp export palette extraction swatches css tokens tattoo stencil blackwork transfer mirror threshold outline contour svg vector tracing 100 percent printable calibrated size millimeters mm a4 letter QR share Openverse creator artwork colors"},
  {title:"Chaos Forge",url:"/chaos-forge.html",terms:"clothing sewing pattern drafting craft blueprints 3d model viewer camera photo image analysis poly haven met wikidata free resource maker"},
  {title:"The Crucible",url:"/chaos-crucible.html",terms:"miss chaos creative workbench project builder brief blueprint tattoo character game design craft sewing coding writing markdown export private memo save maker projects"},
  {title:"Miss Chaos Abilities Guide",url:"/miss-chaos-guide.html",terms:"what can miss chaos do capabilities guide ai tools how to use assistant member osiris isis private modes permissions creator code research demo"}
]);
/** Simple, grounded tool lessons. Each step points to an existing workspace. */
export const FOUNDRY_LESSONS=Object.freeze([
 {name:"Visual Lab",url:"/chaos-visual-lab.html",terms:"visual lab image picture photo resize pixel art tattoo stencil trace",steps:["Open Visual Lab.","Choose an image from your device.","Select one edit, preview the result, then export when ready."]},
 {name:"Code Studio",url:"/chaos-code-studio.html",terms:"code studio programming javascript json format debug diagram",steps:["Open Code Studio.","Paste a short code sample or JSON document.","Choose inspect, format, compare or diagram, then review the output."]},
 {name:"Chaos Forge",url:"/chaos-forge.html",terms:"forge craft sewing pattern fabric 3d material measurements",steps:["Open Chaos Forge.","Choose the project or pattern you want to prototype.","Enter actual measurements and check the estimates before cutting material."]},
 {name:"Textract",url:"/chaos-textract.html",terms:"textract document pdf photo scan ocr extract text",steps:["Open Textract.","Choose a supported photo or document.","Extract text, correct any recognition mistakes, then copy the result."]},
 {name:"The Crucible",url:"/chaos-crucible.html",terms:"crucible idea project brief plan design workspace",steps:["Open The Crucible.","Describe what you want to create.","Review the generated project brief and work through one task at a time."]},
 {name:"Production Lab",url:"/devil-tools.html#production-workbench",terms:"production lab pixel sprite atlas packer tilemap game map",steps:["Open Creator Foundry and select the Production Lab workspace.","Choose Pixel Studio, Atlas Packer or the map editor.","Make a small test asset and export it before starting a large project."]}
]);
export function findFoundryLesson(topic){
 const query=String(topic||"").toLowerCase().slice(0,160);
 const aliases=[
  ["Visual Lab",/\b(?:visual\s+lab|image\s+edit(?:or|ing)?|photo\s+edit(?:or|ing)?|tattoo\s+stencil|vector\s+trac(?:e|ing))\b/],
  ["Code Studio",/\b(?:code\s+studio|code\s+edit(?:or|ing)?|javascript|json\s+format|debug\s+code|flowchart)\b/],
  ["Chaos Forge",/\b(?:chaos\s+forge|sewing\s+pattern|fabric\s+estimate|craft\s+pattern|pattern\s+draft)\b/],
  ["Textract",/\b(?:textract|ocr|extract\s+text|scan\s+document|read\s+pdf)\b/],
  ["The Crucible",/\b(?:the\s+crucible|project\s+brief|project\s+builder|creative\s+workbench)\b/],
  ["Production Lab",/\b(?:production\s+lab|pixel\s+studio|atlas\s+packer|tilemap|sprite\s+sheet)\b/]
 ];
 const found=aliases.filter(([,pattern])=>pattern.test(query));
 return found.length===1?FOUNDRY_LESSONS.find(lesson=>lesson.name===found[0][0]):null;
}
export const FOUNDRY_EXERCISES=Object.freeze({
 "Visual Lab":{task:"Make a 64 by 64 pixel test icon and export it as PNG.",check:"Confirm the exported file opens and is 64 by 64 pixels."},
 "Code Studio":{task:"Paste a tiny JSON object with a name and a color, then run its validator.",check:"Confirm the editor reports valid JSON before copying it."},
 "Chaos Forge":{task:"Draft a simple rectangular pouch using measured dimensions.",check:"Confirm every cut piece has a width, height and seam allowance."},
 "Textract":{task:"Extract text from a short document you have permission to use.",check:"Compare the first and last sentence against the original before copying."},
 "The Crucible":{task:"Write a three-sentence project brief for a small creative project.",check:"Confirm it states the goal, materials and first action."},
 "Production Lab":{task:"Create a tiny sprite and export it to a local file.",check:"Open the exported asset and check its dimensions and transparency."}
});
export function foundryLessonResponse(topic){
 const query=String(topic||"").slice(0,160);
 const lesson=findFoundryLesson(query);
 if(!lesson)return null;
 const requested=query.match(/\b(?:step|stage)\s*([1-3])\b/i);
 const step=requested?Number(requested[1]):1;
 const issue=/\b(?:stuck|error|broken|failed|fails|doesn.t\s+work|not\s+working|problem|trouble|confused)\b/i.test(query);
 const exercise=FOUNDRY_EXERCISES[lesson.name];
 return {...lesson,currentStep:step,instruction:lesson.steps[step-1],nextStep:step<lesson.steps.length?step+1:null,
  exercise:step===lesson.steps.length?exercise:null,verified:false,
  guidance:issue?"Tell me the exact error message and what happened after this step. Check your selected file or input, then retry. I cannot inspect your screen or claim to have fixed the tool.":
  "Try this step in the linked workspace. Tell me when you are ready for the next step or describe what went wrong. I cannot see or click your screen."};
}
export function searchPublicPages(input={}) {
  const query=String(input.query||"").trim().toLowerCase().slice(0,160);
  if(!query)return [];
  const stop=new Set(["where","is","what","which","find","page","link","please","the","and","for","are","can","how","site","website","show","me","our","you","your","with","about","no"]);
  const tokens=[...new Set(query.match(/[a-z0-9]{2,}/g)||[])].filter(t=>!stop.has(t)).slice(0,12);
  if(!tokens.length)return [];
  return PUBLIC_PAGES.map(page=>{
    const hay=(page.title+" "+page.terms).toLowerCase();
    const title=page.title.toLowerCase();
    // Match complete words, not incidental substrings ("is" in "Miss").
    // A page matching more distinct query terms must outrank a generic title.
    const words=new Set(hay.match(/[a-z0-9]{2,}/g)||[]);
    const titleWords=new Set(title.match(/[a-z0-9]{2,}/g)||[]);
    return {...page,score:tokens.reduce((n,t)=>n+(titleWords.has(t)?4:words.has(t)?2:0),0)};
  }).filter(page=>page.score>0).sort((a,b)=>b.score-a.score).slice(0,5)
    .map(({title,url})=>({title,url}));
}
export const publicChaosHandlers=Object.freeze({
  "site.help":async({input})=>{
    const topic=String(input?.topic||"").slice(0,160);
    return {results:searchPublicPages({query:topic}),lesson:foundryLessonResponse(topic)};
  },
  "site.games":async()=>({results:PUBLIC_PAGES.filter(page=>page.title==="Chaos Cartridge").map(({title,url})=>({title,url}))}),
  "site.search":async({input})=>({results:searchPublicPages(input)})
});
