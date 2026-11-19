/**
 * Pure, zero-cost diagram conversion shared by Worker and the browser.
 * Supports linear steps and bounded directed acyclic edge lists.
 * All labels are treated as text; no arbitrary Mermaid directives or HTML.
 */
const MAX_NODES=16;
const MAX_EDGES=24;
function validateLabel(value){
 const s=String(value||"").replace(/\s+/g," ").trim();
 if(s.length<1||s.length>54||/[\x00-\x1f<>"'\x60\\{}\[\]|;#]/.test(s))
   throw Error("Diagram labels must be 1–54 characters and contain no HTML or directives.");
 return s;
}
export function buildChaosFlow(input={}){
 const source=input?.steps;
 if(typeof source!=="string"||source.length<3||new TextEncoder().encode(source).length>1800)
   throw Error("Supply 3–1,800 bytes of diagram steps.");
 const lines=source.replace(/\r/g,"").split("\n").map(s=>s.trim()).filter(Boolean);
 if(!lines.length||lines.length>24)throw Error("Supply at most 24 nonblank diagram lines.");
 const arrowMode=lines.some(s=>/->|→/.test(s));
 const segments=arrowMode?lines.map(line=>{
   if(!/->|→/.test(line))throw Error("Use arrows in every line, or write one step per line.");
   return line.split(/\s*(?:->|→)\s*/).map(validateLabel);
 }):[lines.map(validateLabel)];
 if(segments.some(a=>a.length<2))throw Error("Each diagram path needs at least two steps.");
 const names=[],ids=new Map(),edges=[],edgeKeys=new Set();
 function node(label){
  if(!ids.has(label)){
   if(names.length>=MAX_NODES)throw Error("Diagram exceeds 16 distinct steps.");
   ids.set(label,"N"+(names.length+1));
   names.push({id:ids.get(label),label});
  }
  return ids.get(label);
 }
 for(const path of segments){
  for(let i=0;i<path.length-1;i++){
   const from=node(path[i]),to=node(path[i+1]);
   if(from===to)throw Error("Diagram steps cannot link to themselves.");
   const key=from+":"+to;
   if(!edgeKeys.has(key)){
    if(edges.length>=MAX_EDGES)throw Error("Diagram exceeds 24 connections.");
    edgeKeys.add(key);edges.push({from,to});
   }
  }
 }
 if(names.length<2)throw Error("At least two distinct diagram steps are required.");
 // Kahn traversal ensures that the lightweight browser renderer can layer the DAG.
 const indegree=Object.fromEntries(names.map(n=>[n.id,0]));
 const adjacency=Object.fromEntries(names.map(n=>[n.id,[]]));
 for(const edge of edges){indegree[edge.to]++;adjacency[edge.from].push(edge.to);}
 const queue=names.filter(n=>indegree[n.id]===0).map(n=>n.id);
 const layers=Object.fromEntries(names.map(n=>[n.id,0]));
 let visited=0;
 for(let i=0;i<queue.length;i++){
  const current=queue[i];visited++;
  for(const to of adjacency[current]){
   layers[to]=Math.max(layers[to],layers[current]+1);
   if(--indegree[to]===0)queue.push(to);
  }
 }
 if(visited!==names.length)throw Error("Cycles are not yet supported; use a non-circular diagram.");
 const escape=value=>value.replace(/&/g,"&amp;");
 const mermaid="flowchart TD\n"+names.map(n=>'  '+n.id+'["'+escape(n.label)+'"]').join("\n")+
   "\n"+edges.map(e=>"  "+e.from+" --> "+e.to).join("\n")+"\n";
 return {source:"Knightfall local flowchart builder",nodes:names,edges,layers,
   mermaid,editor_url:"/chaos-code-studio.html",
   limitations:"Direct acyclic flowcharts only (16 nodes/24 edges). Mermaid text is exported for optional third-party renderers; preview uses Knightfall's own SVG renderer. No script execution or external requests."};
}
