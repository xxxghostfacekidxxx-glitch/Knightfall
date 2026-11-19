/* Member-facing, permission-aware Miss Chaos handbook metadata.
   This is documentation, NOT an authorization mechanism. Server sessions are authority. */
export const GUIDE_AREAS=Object.freeze([
 Object.freeze({
  id:"companion",icon:"🧠",title:"Companion & Memory",
  detail:"Talk, brainstorm, ask for advice, manage your own saved memories and conversations, and retrieve limited account-owned previews when you request them.",
  prompt:"Help me organize three project ideas, flag assumptions and suggest an achievable first task.",
  route:"/miss-chaos.html",routeLabel:"Open chat",
  capabilities:["user.memories","user.notes","user.journal","user.profile","user.inbox","user.notifications"]
 }),
 Object.freeze({
  id:"creative",icon:"🎨",title:"Creative Project Studio",
  detail:"Create original characters, tattoo briefs, story outlines, game plans and craft designs. The Crucible generates editable project kits, progress notes, checkpoints and next-step prompts.",
  prompt:"Help me design an original monster for a mobile arcade game. Include silhouette, color palette, animation needs and a small playable test.",
  route:"/chaos-crucible.html",routeLabel:"Open Crucible",
  capabilities:["design.palette_build","design.color_contrast"]
 }),
 Object.freeze({
  id:"maker",icon:"✂️",title:"Craft & Maker Tools",
  detail:"Build measured prototype cut lists, estimate material, resize rectangular craft patterns, and explore image references and local 3D mockups. Real fit and physical measurements still need checking.",
  prompt:"Help me prototype a fabric pouch. List the measurements I need, explain seam allowance and identify assumptions before calculating fabric.",
  route:"/chaos-forge.html",routeLabel:"Open Chaos Forge",
  capabilities:["forge.pattern_draft","forge.material_estimate","forge.scale_pattern","utility.convert"]
 }),
 Object.freeze({
  id:"dev",icon:"⌘",title:"Code & Troubleshooting",
  detail:"Inspect JavaScript/JSON snippets, format supported code, compare versions, validate JSON shape, and sketch flowcharts. These read-only tools do not execute arbitrary uploaded code or deploy patches.",
  prompt:"Help me debug a JavaScript error. First ask what happens, what I expected, how to reproduce it and which code you should inspect.",
  route:"/chaos-code-studio.html",routeLabel:"Open Code Studio",
  capabilities:["dev.code_inspect","dev.code_format","dev.code_diff","dev.json_shape","dev.diagram_flow"]
 }),
 Object.freeze({
  id:"research",icon:"🔎",title:"Research & Free Resources",
  detail:"Find attributed public information and references through selected sources including Wikipedia, Wikidata, Open Library, Crossref, The Met, Poly Haven and public GitHub repositories. Not unrestricted live web browsing.",
  prompt:"Find a freely reusable reference for an original gothic stone texture. Name the source, asset license and link, and tell me what still needs verification.",
  route:"/chaos-visual-lab.html",routeLabel:"Open Visual Lab",
  capabilities:["research.wikipedia","resource.wikidata","resource.met","resource.polyhaven","research.github_repos","research.books","research.papers","research.dictionary"]
 }),
 Object.freeze({
  id:"cosmic",icon:"🌙",title:"Moon, Reflection & Writing",
  detail:"Explore measured moon phase information, optional astrology-inspired reflection, personal journaling and shadow-work questions. Astrology is symbolic, not a proven way to predict events.",
  prompt:"Show me the current moon phase and give me a grounded, optional journal prompt without predicting the future.",
  route:"/moonology.html",routeLabel:"Explore Moonology",
  capabilities:["radar.moon","radar.shadow"]
 }),
 Object.freeze({
  id:"community",icon:"🎮",title:"Knightfall Guide",
  detail:"Navigate the site, find arcade games and available instructions, understand tools and features, and use calculations, measurements or word counts to plan projects.",
  prompt:"Help me find a Knightfall arcade game that works well on a touch screen, and tell me where its instructions are.",
  route:"/chaos-cartridge.html",routeLabel:"Explore arcade",
  capabilities:["site.help","site.games","site.search","utility.calculate","utility.word_count","utility.now"]
 })
]);
export const GUIDE_DEMOS=Object.freeze({
 calc:Object.freeze({id:"calc",name:"Quick calculation",capability:"utility.calculate",label:"Arithmetic expression",placeholder:"(12 * 4) + 7",description:"Runs the site's bounded arithmetic tool. It cannot run arbitrary JavaScript."}),
 words:Object.freeze({id:"words",name:"Word counter",capability:"utility.word_count",label:"Text to count",placeholder:"The tiny gremlin stole another screwdriver.",description:"Count words and estimate reading time without starting an AI conversation."})
});
export function guideViewer(modesResponse,toolsResponse){
 const modes=Array.isArray(modesResponse?.modes)?modesResponse.modes:[];
 const capabilities=Array.isArray(toolsResponse?.capabilities)?toolsResponse.capabilities:[];
 // Must be verified by both real server endpoints. Anything malformed fails closed.
 if(!modes.some(m=>m&&m.id==="standard")||!Array.isArray(toolsResponse?.capabilities))
  return {verified:false,role:"visitor",mode:null,permissions:{},capabilities:[]};
 const names=capabilities.filter(x=>typeof x==="string"&&/^[a-z_]+\.[a-z_]+$/.test(x));
 const partner=modes.find(m=>m?.id==="partner"&&m.full_chat==="/samantha-chaos.html");
 const owner=modes.find(m=>m?.id==="owner"&&m.full_chat==="/miss-chaos.html?companion=owner");
 const mode=owner||partner||null;
 // Role is derived from the server's verified mode list, not from username or local controls.
 return {verified:true,role:owner?"osiris":partner?"partner":"member",mode:mode?{
  id:mode.id,label:String(mode.label||"Private Companion"),full_chat:mode.full_chat
 }:null,permissions:modesResponse?.permissions&&typeof modesResponse.permissions==="object"?
   modesResponse.permissions:{},capabilities:[...new Set(names)]};
}
export function guideAreaCount(area,capabilities){
 const granted=new Set(Array.isArray(capabilities)?capabilities:[]);
 return area.capabilities.filter(id=>granted.has(id)).length;
}
export function guideDemoInput(type,text){
 const value=String(text||"").trim();
 if(type==="calc"){
  if(!value||value.length>100||!/^[0-9+*/().%\s-]+$/.test(value))
   throw Error("Use an arithmetic expression with numbers and operators, up to 100 characters.");
  return {name:"utility.calculate",input:{expression:value}};
 }
 if(type==="words"){
  if(!value||value.length>3000)throw Error("Enter between 1 and 3,000 characters of text.");
  return {name:"utility.word_count",input:{text:value}};
 }
 throw Error("Unsupported public tool demo.");
}
