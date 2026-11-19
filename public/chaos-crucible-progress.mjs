/* Miss Chaos Crucible progress: verified milestones, private project notes,
   backwards-compatible portable workspaces. No network, trackers or paid tools. */
import {
  CRUCIBLE_KINDS, CRUCIBLE_FIELD_LIMITS,
  buildCrucibleBrief, parseCrucibleKit, CRUCIBLE_KIT_SCHEMA
} from "./chaos-crucible-core.mjs";

export const CRUCIBLE_WORKSPACE_SCHEMA="knightfall.miss-chaos.crucible.v2";
export const CRUCIBLE_PROGRESS_NOTE_LIMIT=500;
export const CRUCIBLE_WORKSPACE_MAX=12000;
export const CRUCIBLE_STEPS_PER_TRACK=5;

export function validateCrucibleProgress(raw={},kind="character"){
  if(!Object.hasOwn(CRUCIBLE_KINDS,kind))throw Error("Unsupported Crucible discipline.");
  if(!raw||typeof raw!=="object"||Array.isArray(raw))throw Error("Invalid project progress.");
  const completed=raw.completed??[];
  const notes=raw.notes??"";
  if(!Array.isArray(completed)||completed.length>CRUCIBLE_STEPS_PER_TRACK||
     !completed.every(index=>Number.isInteger(index)&&index>=0&&index<CRUCIBLE_KINDS[kind].steps.length)||
     new Set(completed).size!==completed.length)
    throw Error("Project milestones must be distinct valid step numbers.");
  if(typeof notes!=="string"||notes.length>CRUCIBLE_PROGRESS_NOTE_LIMIT)
    throw Error("Project notes must be text of at most "+CRUCIBLE_PROGRESS_NOTE_LIMIT+" characters.");
  return {completed:completed.slice().sort((a,b)=>a-b),notes};
}
export function buildCrucibleProgress(brief,raw={}){
  if(!brief?.ok||!brief?.track)throw Error("A valid Crucible project brief is required.");
  const progress=validateCrucibleProgress(raw,brief.kind);
  const done=new Set(progress.completed);
  const remaining=brief.track.steps.map((step,index)=>({step,index})).filter(item=>!done.has(item.index));
  const next=remaining[0]??null;
  const total=brief.track.steps.length;
  const completed=total-remaining.length;
  const percent=Math.round(completed/total*100);
  const verified=completed===total;
  const report=[
    "## Crucible checkpoint (self-reported; not independently verified)",
    "**Milestones marked complete:** "+completed+"/"+total+" ("+percent+"%)",
    ...brief.track.steps.map((step,index)=>"- ["+(done.has(index)?"x":" ")+"] "+step),
    "**Next proposed step:** "+(next?next.step:"All planned steps marked complete. Validate the acceptance checks independently."),
    "**Evidence and working notes:** "+(progress.notes.trim()?progress.notes.trim().replace(/\r?\n/g," "):"No evidence notes supplied; completion is self-reported."),
    verified?"**Status:** All planned milestones checked; acceptance tests remain independently unverified.":
             "**Status:** Work in progress; unchecked steps remain proposed."
  ].join("\n");
  return {progress,completed,total,percent,verified,nextStep:next?.step??null,report};
}
export function prepareCrucibleHandoff(brief,raw={},nextOnly=false){
  const state=buildCrucibleProgress(brief,raw);
  const prefix=nextOnly
    ?"Help me carry out ONLY the next unchecked Crucible step. Ask for missing context, give concrete actions and verifiable acceptance checks. Do not claim it is finished without evidence."
    :"Help me advance this Crucible project based on the verified details and member-reported checkpoint. Separate suggested actions from actual results.";
  const prompt=prefix+"\n\n"+brief.markdown+"\n\n"+state.report+
    "\n\nDo not publish, run code, deploy, or change private data without my explicit approval.";
  if(prompt.length>4000)return {ok:false,error:"The full project and progress notes exceed Miss Chaos's 4,000-character chat limit. Shorten notes or field details; nothing was discarded.",length:prompt.length};
  return {ok:true,prompt,length:prompt.length,nextStep:state.nextStep};
}
export function exportCrucibleWorkspace(raw,rawProgress={}){
  const brief=buildCrucibleBrief(raw);
  if(!brief.ok)throw Error(brief.errors.join(" "));
  const progress=validateCrucibleProgress(rawProgress,brief.kind);
  const project={kind:brief.kind};
  for(const key of Object.keys(CRUCIBLE_FIELD_LIMITS))project[key]=String(raw[key]??"").trim();
  const serialized=JSON.stringify({schema:CRUCIBLE_WORKSPACE_SCHEMA,project,progress},null,2)+"\n";
  if(serialized.length>CRUCIBLE_WORKSPACE_MAX)
    throw Error("Portable project kit exceeds 12 KB. Nothing was shortened.");
  return serialized;
}
export function parseCrucibleWorkspace(raw){
  if(typeof raw!=="string"||raw.length>CRUCIBLE_WORKSPACE_MAX)
    throw Error("Project kits must be JSON files under 12 KB.");
  let data;
  try{data=JSON.parse(raw);}catch{throw Error("This is not valid Crucible project JSON.");}
  if(!data||typeof data!=="object"||Array.isArray(data))
    throw Error("This is not a recognized Crucible project kit.");
  if(data.schema===CRUCIBLE_KIT_SCHEMA)
    return {project:parseCrucibleKit(raw),progress:{completed:[],notes:""},legacy:true};
  if(data.schema!==CRUCIBLE_WORKSPACE_SCHEMA)
    throw Error("Unrecognized Crucible project kit version.");
  if(!data.project||typeof data.project!=="object"||Array.isArray(data.project))
    throw Error("The project fields are missing or invalid.");
  const project={kind:data.project.kind};
  if(typeof project.kind!=="string"||!Object.hasOwn(CRUCIBLE_KINDS,project.kind))
    throw Error("Unsupported Crucible discipline.");
  for(const [key,max] of Object.entries(CRUCIBLE_FIELD_LIMITS)){
    if(typeof data.project[key]!=="string"||data.project[key].length>max)
      throw Error("Invalid or oversized "+key+" in project kit.");
    project[key]=data.project[key];
  }
  const brief=buildCrucibleBrief(project);
  if(!brief.ok)throw Error(brief.errors.join(" "));
  const progress=validateCrucibleProgress(data.progress,project.kind);
  return {project,progress,legacy:false};
}
