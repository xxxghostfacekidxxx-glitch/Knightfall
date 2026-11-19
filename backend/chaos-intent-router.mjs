/**
 * Explicit, low-cost read-only routing for Miss Chaos.
 * No arbitrary URLs, private IDs, side effects or model-generated tool names.
 * Every returned call still goes through the normal capability permissions.
 */
const verbs=/^\s*(?:please\s+)?(?:find|search|look\s*up|show|list|read|check|summarize|research|recommend|describe|review|what(?:'s| is| are)?|give\s+me)\b/i;
const privateVerb=/^\s*(?:please\s+)?(?:find|search|look\s*up|show|list|read|check|summarize|recall|describe|review|what(?:'s| is| are)?|any)\b/i;
const hasSelf=/\b(?:my|mine|our)\b/i;
const empty=()=>({});
const cut=(value)=>String(value||"").trim().replace(/[?!.,]+$/,"").slice(0,100).trim();
export function explicitChaosMemberCall(message){
 const text=String(message||"").trim();
 if(!privateVerb.test(text)||!hasSelf.test(text))return null;
 const lookup=(name,args=empty())=>({name,arguments:args});
 if(/\b(?:memos?|notes?)\b/i.test(text)){
   const query=cut(text.match(/\b(?:about|for|containing|related\s+to)\s+(.{2,90})/i)?.[1]||"");
   return lookup("user.notes",{query});
 }
 if(/\bmemor(?:y|ies)\b/i.test(text)){
   const query=cut(text.match(/\b(?:about|for|containing|related\s+to)\s+(.{2,90})/i)?.[1]||"");
   return lookup("user.memories",{query});
 }
 if(/\b(?:handoff|shared\s+tasks?|to.do\s+list|task\s+board)\b/i.test(text))return lookup("user.handoff");
 if(/\b(?:notifications?|unread\s+alerts?|alerts?)\b/i.test(text))return lookup("user.notifications");
 if(/\b(?:profile)\b/i.test(text))return lookup("user.profile");
 if(/\b(?:inbox|conversations?|dms?|direct\s+messages?|chaosphere\s+chats?|chats?)\b/i.test(text))return lookup("user.inbox");
 return null;
}
const sources=[
  {pattern:/\bpoly\s*haven\b/i,name:"resource.polyhaven"},
  {pattern:/\b(?:the\s+)?(?:metropolitan\s+museum|met\s+museum|the\s+met)\b/i,name:"resource.met"},
  {pattern:/\bwikidata\b/i,name:"resource.wikidata"},
  {pattern:/\bwikipedia\b/i,name:"research.wikipedia"}
];
export function explicitChaosSourceCalls(message){
 const text=String(message||"").trim();
 if(!verbs.test(text))return [];
 const matches=sources.filter(s=>s.pattern.test(text));
 if(!matches.length||matches.length>2)return [];
 // Pairwise encyclopedia lookup is useful for a lightweight cross-source check.
 if(matches.length===2 && !matches.every(s=>/wikipedia|wikidata/.test(s.name)))return [];
 let query=text.replace(verbs," ").replace(/\b(?:in|at|on|from)\s+(?:the\s+)?(?:poly\s+haven|metropolitan\s+museum|met\s+museum|the\s+met|wikipedia|wikidata)\b/gi," ");
 for(const src of matches)query=query.replace(src.pattern," ");
 query=query.replace(/^\s*(?:(?:for|about|of|on|at|from|with|the|free|cc0|open.access|public.domain|models?|textures?|3d\s+assets?|hdris?|artworks?|artifacts?|facts?|entries?|information|records?)\s+)+/i," ");
 query=query.replace(/\s+(?:(?:from|in|at|on)\s+)?(?:the\s+)?(?:free|cc0|public.domain)\s*$/i," ");
 query=cut(query);
 if(query.length<2)return [];
 return matches.map(({name})=>({name,arguments:name==="resource.polyhaven"?
   {query,type:/\b(?:hdri|environment\s+map|sky)\b/i.test(text)?"hdris":
     /\b(?:textures?|materials?|surfaces?)\b/i.test(text)?"textures":"models"}:{query}}));
}
