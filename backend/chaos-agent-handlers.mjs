import {wikipediaLookup,currentClock} from "./chaos-research.mjs";
import {searchChaosResources} from "./chaos-resources.mjs";
import {handleAiHandoff} from "./src/ai-handoff.js";
/** Trusted read-only model tools. Every personal query binds the VERIFIED session id. */
export function createChaosAgentHandlers({env,arcadePicks,moonBrief,shadowBrief,readGodAuditSummary}){
  const safe=(value,max=160)=>String(value||"").trim().slice(0,max);
  const match=(text,query)=>!query||String(text||"").toLowerCase().includes(query.toLowerCase());
  return {
    "research.wikipedia":async({input})=>wikipediaLookup(input),
    "resource.met":async({input})=>searchChaosResources({source:"met",query:safe(input.query,90)}),
    "resource.polyhaven":async({input})=>searchChaosResources({source:"polyhaven",query:safe(input.query,90),type:input.type}),
    "resource.wikidata":async({input})=>searchChaosResources({source:"wikidata",query:safe(input.query,90)}),
    "utility.now":async({input})=>currentClock(input),
    "user.handoff":async({principal})=>{
      // Delegate authorization to the same route as the member's existing shared board.
      const url=new URL("https://api.ash-fall.com/api/ai-handoff/");
      const response=await handleAiHandoff(new Request(url),env,url,{
        getUser:async()=>({id:principal.id,role:principal.role}),
        json:(data,status=200)=>Response.json(data,{status}),
        origin:"https://ash-fall.com",
        rateLimit:async()=>false
      });
      if(!response.ok)return {available:false,reason:"No authorized shared handoff is available."};
      const board=await response.json();
      if(!board.confirmed_access)return {available:false,reason:"This account must accept its invitation first."};
      return {available:true,source:"authorized Knightfall shared AI handoff",
        tasks:(board.tasks||[]).slice(0,25).map(t=>({id:t.id,title:String(t.title).slice(0,180),
          details:String(t.details||"").slice(0,400),status:t.status,priority:t.priority,updated_at:t.updated_at})),
        notes:(board.notes||[]).slice(0,5).map(n=>({category:n.category,body:String(n.body||"").slice(0,400),created_at:n.created_at})),
        reminder:"Read-only snapshot. Project changes must be explicitly approved and performed through the authenticated handoff page."};
    },
    "site.games":async({input})=>arcadePicks({
      query:safe(input.query,120),
      device:["touch","desktop"].includes(input.device)?input.device:"",
      length:["mini","games"].includes(input.length)?input.length:""
    }),
    "radar.moon":async()=>moonBrief(),
    "radar.shadow":async({input})=>shadowBrief(safe(input.topic,120)),
    "user.memories":async({input,principal})=>{
      const query=safe(input.query,120);
      const {results=[]}=await env.DB.prepare(
        "SELECT memory,category,updated_at FROM chaos_memories WHERE user_id=? AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 80"
      ).bind(principal.id).all();
      const items=results.filter(x=>match(x.memory,query)).slice(0,12)
        .map(x=>({memory:String(x.memory).slice(0,500),category:x.category,updated_at:x.updated_at}));
      return {results:items,source:"signed-in user's saved memories",more:results.length>items.length};
    },
    "user.notes":async({input,principal})=>{
      const query=safe(input.query,120);
      const {results=[]}=await env.DB.prepare(
        "SELECT id,title,body,updated_at FROM member_memos WHERE user_id=? AND deleted_at IS NULL ORDER BY updated_at DESC,id DESC LIMIT 80"
      ).bind(principal.id).all();
      const items=results.filter(x=>match(x.title,query)||match(x.body,query)).slice(0,8)
        .map(x=>({id:x.id,title:String(x.title).slice(0,100),preview:String(x.body||"").slice(0,500),updated_at:x.updated_at}));
      return {results:items,source:"signed-in user's private Memo Pad",previews_only:true,more:results.length>items.length};
    },
    "god.audit_summary":async({principal})=>readGodAuditSummary({env,principal})
  };
}
