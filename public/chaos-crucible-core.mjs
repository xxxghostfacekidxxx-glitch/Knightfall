/* Miss Chaos Crucible: deterministic, private-by-default project briefs.
   Zero external libraries, zero AI tokens, and no automatic publishing. */
export const CRUCIBLE_KINDS=Object.freeze({
  character:Object.freeze({
    name:"Creature & Character",icon:"👹",tagline:"Give an original misfit a personality and production plan.",
    first:"Appearance, silhouette & palette",second:"Personality, abilities & evolution",
    firstHint:"Shape language, 3-5 colors, silhouette, species, scale…",
    secondHint:"Motivation, quirks, limitations, evolution stages…",
    steps:["Define a readable original silhouette and visual identity","Sketch three shape or color variations","Map personality, abilities, weaknesses and relationships","Choose the game, avatar or illustration asset format","Review originality, readability and iteration notes"],
    proof:["Readable thumbnail silhouette","Consistent palette and proportions","Clear usage and asset dimensions"],
    destination:"/chaos-visual-lab.html",destinationLabel:"Chaos Visual Lab"
  }),
  tattoo:Object.freeze({
    name:"Tattoo Blueprint",icon:"🖋️",tagline:"Turn an idea into a properly specified artwork brief.",
    first:"Placement and actual dimensions",second:"Linework, shading and symbolism",
    firstHint:"Body placement, width/height in inches or mm, orientation…",
    secondHint:"Blackwork, color, negative space, motifs, reference rights…",
    steps:["Record body placement and actual measured dimensions","Develop high-contrast original composition thumbnails","Plan line weights, skin breaks and long-term readability","Prepare a clean stencil-ready concept at measured scale","Review fit and safety with a qualified tattoo artist"],
    proof:["Dimensions established rather than assumed","Clear focal point and lineweight hierarchy","Readable stencil at working size"],
    destination:"/chaos-visual-lab.html",destinationLabel:"Stencil & Visual Lab"
  }),
  code:Object.freeze({
    name:"Code & Repair",icon:"⌘",tagline:"Fix a real defect with evidence, not guesses.",
    first:"Actual behavior and reproduction steps",second:"Expected behavior, environment and code scope",
    firstHint:"What fails, steps to reproduce, screenshots/logs and errors…",
    secondHint:"Expected result, browser/device, files, commit or test…",
    steps:["Reproduce the reported behavior before editing","Isolate the smallest affected module or route","Form a falsifiable cause hypothesis and safe minimal patch","Run syntax, unit and browser regression checks","Compare deployed commit with verified live behavior and rollback criteria"],
    proof:["Failure reproduced or explicitly marked unverified","Tests cover the original failure and adjacent paths","Deployment and device verification recorded honestly"],
    destination:"/chaos-code-studio.html",destinationLabel:"Chaos Code Studio"
  }),
  craft:Object.freeze({
    name:"Craft & Pattern",icon:"✂️",tagline:"Make the measurements lead the monster.",
    first:"Measurements, material and construction type",second:"Fit, seams, tools and tolerances",
    firstHint:"Real width/height/depth, fabric/material, thickness or grain…",
    secondHint:"Seam allowance, closures, assembly method, budget or waste…",
    steps:["Measure the reference and label unmeasured estimates","Break the object into pieces and physical joining methods","Calculate a prototype cut list and material allowance","Create a scaled mockup and test assembly order","Adjust fit and tolerances before cutting final materials"],
    proof:["Every critical dimension has units","Prototype and material assumptions stated","Physical fit or test plan exists"],
    destination:"/chaos-forge.html",destinationLabel:"Chaos Forge"
  }),
  story:Object.freeze({
    name:"Story & Lyrics",icon:"✒️",tagline:"Build a voice, a world and an emotional arc.",
    first:"Premise, narrator and setting",second:"Tone, structure and intended audience",
    firstHint:"Who speaks? What changed? Where and when does it happen?…",
    secondHint:"Genre, pacing, perspective, target length, ending or rhythm…",
    steps:["Define the narrator's goal and a meaningful obstacle","Outline the opening, escalation, turn and aftermath","Build original images, setting details and voice markers","Draft a complete first pass in the chosen format","Revise for clarity, rhythm, emotional truth and originality"],
    proof:["The narrative arc can be summarized","Voice and audience are consistent","Original wording and revision pass completed"],
    destination:"/memo-pad.html",destinationLabel:"Memo Pad"
  }),
  game:Object.freeze({
    name:"Game Mechanics",icon:"🎮",tagline:"An actual playable loop, not a marketing sentence.",
    first:"Core loop, controls and platform",second:"Progression, feedback and game-state rules",
    firstHint:"What does the player do every 5 seconds? Touch/keyboard?…",
    secondHint:"Level goals, loss condition, currency, animation and saves…",
    steps:["Define one meaningful player action and immediate feedback","Write the victory, failure and restart state transitions","Prototype on the smallest target screen and input method","Balance a short playable loop with real user testing","Add accessibility, performance and regression checks"],
    proof:["Input and feedback cycle demonstrable","Win/loss/reset behaviors are unambiguous","Mobile controls and performance verified"],
    destination:"/chaos-cartridge.html",destinationLabel:"Chaos Cartridge"
  })
});
export const CRUCIBLE_FIELD_LIMITS=Object.freeze({title:100,goal:240,known:650,first:350,second:350,constraints:450});
export function buildCrucibleBrief(raw={}){
  const kind=String(raw.kind||"character");
  const track=CRUCIBLE_KINDS[kind];
  if(!track)return {ok:false,errors:["Select a supported project type."]};
  const fields={};
  for(const [name,max] of Object.entries(CRUCIBLE_FIELD_LIMITS)){
    const value=String(raw[name]??"").trim();
    if(value.length>max)return {ok:false,errors:[name+" exceeds "+max+" characters. No text was shortened."]};
    fields[name]=value;
  }
  if(!fields.title||!fields.goal)return {ok:false,errors:["Add a project name and a specific goal first."]};
  const safeLine=value=>String(value).replace(/\r?\n/g," ").replace(/\s+/g," ").trim();
  const bullet=(label,value)=>"- **"+label+":** "+(value?safeLine(value):"Not provided; ask before assuming");
  const missing=[];
  if(!fields.known)missing.push("Verified facts or references");
  if(!fields.first)missing.push(track.first);
  if(!fields.second)missing.push(track.second);
  if(!fields.constraints)missing.push("Constraints and limits");
  const plan=track.steps.map((item,i)=>String(i+1)+". [ ] "+item);
  const checks=track.proof.map(item=>"- [ ] "+item);
  const markdown=[
    "# "+safeLine(fields.title),
    "",
    "> Miss Chaos Crucible · "+track.name+" · User-prepared creative brief",
    "",
    "## Objective",
    safeLine(fields.goal),
    "",
    "## Evidence and boundaries",
    bullet("What is verified",fields.known),
    bullet(track.first,fields.first),
    bullet(track.second,fields.second),
    bullet("Constraints",fields.constraints),
    "",
    "## Proposed workflow (not yet executed)",
    ...plan,
    "",
    "## Acceptance checks",
    ...checks,
    "",
    "## Open questions (do not fabricate answers)",
    ...(missing.length?missing.map(x=>"- [ ] Clarify "+x):["- [ ] Confirm the supplied facts still match the final brief"]),
    "",
    "## Relevant Knightfall tool",
    track.destinationLabel+" · "+track.destination,
    "",
    "All measurements, implementations and results require independent verification."
  ].join("\n");
  const aiPrompt="Help me turn this Crucible brief into a practical "+track.name.toLowerCase()+" deliverable. "+
    "Respect my specified facts and constraints. Ask about unknown details rather than inventing measurements, test results or sources. "+
    "Clearly separate proposals from verified outcomes. Do not post or modify anything without my explicit action.\n\n"+markdown;
  if(aiPrompt.length>4000)return {ok:false,errors:["This brief is too long for chat. Shorten the reference notes or constraints; nothing was deleted."]};
  return {ok:true,kind,track,title:fields.title,markdown,aiPrompt,missing,checklist:track.steps.slice(),destination:track.destination};
}


export const CRUCIBLE_KIT_SCHEMA="knightfall.miss-chaos.crucible.v1";
export function exportCrucibleKit(raw={}){
 const result=buildCrucibleBrief(raw);
 if(!result.ok)throw Error(result.errors.join(" "));
 const project={kind:result.kind};
 for(const key of Object.keys(CRUCIBLE_FIELD_LIMITS))project[key]=String(raw[key]??"").trim();
 return JSON.stringify({schema:CRUCIBLE_KIT_SCHEMA,project},null,2)+"\n";
}
export function parseCrucibleKit(raw){
 if(typeof raw!=="string"||raw.length>12000)throw Error("Project kits must be JSON files under 12 KB.");
 let data;
 try{data=JSON.parse(raw);}catch{throw Error("This file is not valid Crucible project JSON.");}
 if(!data||typeof data!=="object"||Array.isArray(data)||
    data.schema!==CRUCIBLE_KIT_SCHEMA||
    !data.project||typeof data.project!=="object"||Array.isArray(data.project))
    throw Error("This is not a recognized Miss Chaos Crucible project kit.");
 const source=data.project;
 if(typeof source.kind!=="string"||!Object.hasOwn(CRUCIBLE_KINDS,source.kind))
    throw Error("This project kit contains an unsupported discipline.");
 const project={kind:source.kind};
 for(const [name,max] of Object.entries(CRUCIBLE_FIELD_LIMITS)){
   const value=source[name];
   if(typeof value!=="string"||value.length>max)
     throw Error("Invalid or oversized "+name+" in imported project kit.");
   project[name]=value;
 }
 if(!buildCrucibleBrief(project).ok)
   throw Error("The imported project kit is incomplete or too long for chat.");
 return project;
}
