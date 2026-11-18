/** Trusted read-only model tools. Every personal query binds the VERIFIED session id. */
export function createChaosAgentHandlers({env,arcadePicks,moonBrief,shadowBrief,readGodAuditSummary}){
  const safe=(value,max=160)=>String(value||"").trim().slice(0,max);
  const match=(text,query)=>!query||String(text||"").toLowerCase().includes(query.toLowerCase());
  return {
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
