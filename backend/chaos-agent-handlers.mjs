import {wikipediaLookup,currentClock} from "./chaos-research.mjs";
import {findChaosGithubRepos} from "./chaos-github-repos.mjs";
import {searchChaosResources} from "./chaos-resources.mjs";
import {findOpenBooks,findCrossrefPapers} from "./chaos-reference-sources.mjs";
import {makeChaosPatternDraft} from "./chaos-forge-tool.mjs";
import {estimateFabric} from "./chaos-fabric-estimate.mjs";
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
    "research.github_repos":async({input})=>findChaosGithubRepos(input),
    "research.books":async({input})=>findOpenBooks({query:safe(input.query,100)}),
    "research.papers":async({input})=>findCrossrefPapers({query:safe(input.query,100)}),
    "forge.pattern_draft":async({input})=>makeChaosPatternDraft(input),
    "forge.material_estimate":async({input})=>estimateFabric(input),
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
    "user.notifications":async({principal})=>{
      // Read-only, always scoped by the verified server session: never expose other members' alerts.
      const {results=[]}=await env.DB.prepare(
        "SELECT id,kind,title,body,url,created_at FROM notifications WHERE user_id=? AND read_at IS NULL ORDER BY created_at DESC LIMIT 10"
      ).bind(principal.id).all();
      const count=await env.DB.prepare(
        "SELECT COUNT(*) AS count FROM notifications WHERE user_id=? AND read_at IS NULL"
      ).bind(principal.id).first();
      const safeUrl=url=>typeof url==="string"&&url.startsWith("/")&&!url.startsWith("//")&&!/[\\\\\x00-\x1f]/.test(url)?url:null;
      return {source:"signed-in member's unread Knightfall alerts",
        unread_count:Number(count?.count||0),
        alerts:results.map(n=>({id:n.id,kind:safe(n.kind,60),title:safe(n.title,160),
          preview:safe(n.body,300),url:safeUrl(n.url),created_at:n.created_at})),
        read_only:true,notice:"Opening or clearing alerts on the Notifications page marks them read."};
    },
    "user.profile":async({principal})=>{
      // No email, birthday, billing, secrets, location, or other members' fields.
      const profile=await env.DB.prepare(
        "SELECT username,display_name,bio,profile_visibility,avatar_url FROM users WHERE id=? AND status='active' LIMIT 1"
      ).bind(principal.id).first();
      if(!profile)return {available:false,reason:"Account profile unavailable."};
      return {source:"signed-in member's own profile",read_only:true,
        profile:{username:safe(profile.username,24),display_name:safe(profile.display_name,80),
          bio:safe(profile.bio,500),visibility:safe(profile.profile_visibility,30),
          avatar_url:typeof profile.avatar_url==="string"&&profile.avatar_url.startsWith("/")&&!profile.avatar_url.startsWith("//")
            ?profile.avatar_url.slice(0,320):null},
        edit_url:"/profile.html",note:"This is a snapshot. Editing requires the member to use their account settings."};
    },
    "user.inbox":async({principal})=>{
      // The INNER JOIN on the verified session's membership is the privacy boundary.
      // Read-only; fetching these previews MUST NOT mark conversations as read.
      const {results=[]}=await env.DB.prepare(
        "SELECT c.id,c.kind,c.name AS group_name,c.updated_at,"+
        "(SELECT u.username FROM conversation_members om JOIN users u ON u.id=om.user_id "+
        "WHERE om.conversation_id=c.id AND om.user_id<>? AND c.kind='direct' LIMIT 1) AS other_username,"+
        "(SELECT m.body FROM messages m WHERE m.conversation_id=c.id AND m.deleted_at IS NULL "+
        "ORDER BY m.id DESC LIMIT 1) AS last_body "+
        "FROM conversations c JOIN conversation_members cm ON cm.conversation_id=c.id AND cm.user_id=? "+
        "WHERE c.kind IN ('direct','group') ORDER BY c.updated_at DESC LIMIT 10"
      ).bind(principal.id,principal.id).all();
      return {source:"signed-in member's joined conversations",read_only:true,more_possible:results.length===10,
        conversations:results.map(c=>({
          id:Number(c.id),kind:c.kind==="group"?"group":"direct",
          title:c.kind==="group"?safe(c.group_name,80):"@"+safe(c.other_username,24),
          latest_preview:safe(c.last_body,200),updated_at:c.updated_at,
          url:Number.isSafeInteger(Number(c.id))&&Number(c.id)>0
            ?"/messages.html?conversation="+Number(c.id):"/messages.html"
        })),
        note:"Only short excerpts from the user's own conversations. Open Chaosphere to read or reply."};
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
