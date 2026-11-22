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
 if(/\b(?:journal|diary|die[ -]?ary)\b/i.test(text)){
   const query=cut(text.match(/\b(?:about|for|containing|related\s+to)\s+(.{2,90})/i)?.[1]||"");
   return lookup("user.journal",{query});
 }
 if(/\bmemor(?:y|ies)\b/i.test(text)){
   const query=cut(text.match(/\b(?:about|for|containing|related\s+to)\s+(.{2,90})/i)?.[1]||"");
   return lookup("user.memories",{query});
 }
 if(/\b(?:handoff|shared\s+tasks?|to.do\s+list|task\s+board|between\s+the\s+flames)\b/i.test(text))return lookup("user.handoff");
 if(/\b(?:bot\s+fleet|bot\s+roster|my\s+bots|our\s+bots|published\s+bots|personal\s+bots)\b/i.test(text))return lookup("user.bot_fleet");
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
 query=query.replace(/^\s*(?:(?:and|or|for|about|of|on|at|from|with|the|free|cc0|open.access|public.domain|models?|textures?|3d\s+assets?|hdris?|artworks?|artifacts?|facts?|entries?|information|records?)\s+)+/i," ");
 query=query.replace(/\s+(?:(?:from|in|at|on)\s+)?(?:the\s+)?(?:free|cc0|public.domain)\s*$/i," ");
 query=cut(query);
 if(query.length<2)return [];
 return matches.map(({name})=>({name,arguments:name==="resource.polyhaven"?
   {query,type:/\b(?:hdri|environment\s+map|sky)\b/i.test(text)?"hdris":
     /\b(?:textures?|materials?|surfaces?)\b/i.test(text)?"textures":"models"}:{query}}));
}


/**
 * Deterministic quick answers and navigation. These return tool arguments, NOT
 * fabricated answers. Each call is still validated by the Worker capability gate.
 */
export function explicitChaosQuickCall(message){
 const text=String(message||"").trim();
 if(text.length>4000)return null;
 const calc=text.match(/^(?:please\s+)?(?:calculate|solve|evaluate)\s+([0-9+\-*/().%\s]{1,100})\??$/i);
 if(calc)return {name:"utility.calculate",arguments:{expression:calc[1].trim().replace(/\?$/,"")}};
 const words=text.match(/^(?:please\s+)?(?:count\s+(?:the\s+)?words?|word\s+count)\s*[:\-]\s*([\s\S]{1,3500})$/i);
 if(words)return {name:"utility.word_count",arguments:{text:words[1]}};
 if(/^(?:please\s+)?(?:what(?:'s| is)\s+the\s+)?(?:current\s+)?moon\s+phase\s*(?:today|right\s+now)?\s*[?.!]?$/i.test(text))
   return {name:"radar.moon",arguments:{}};
 const time=text.match(/^(?:(?:what(?:'s| is)?\s+(?:the\s+)?(?:current\s+)?time)|(?:(?:current\s+)?time)|(?:show\s+time))\s+(?:in|for)\s+([a-z_]+\/[a-z_]+|UTC)\s*[?.!]?$/i);
 if(time)return {name:"utility.now",arguments:{timezone:time[1]}};
 return null;
}
export function explicitChaosSiteCall(message){
 const text=String(message||"").trim();
 if(/^(?:please\s+)?(?:teach\s+me|show\s+me\s+how|how\s+(?:do|can)\s+i\s+use|walk\s+me\s+through|help\s+me\s+(?:use|learn))\b/i.test(text) && /\b(?:foundry|creator|visual\s+lab|code\s+studio|chaos\s+forge|textract|crucible|production\s+lab|pixel\s+studio|atlas\s+packer|tilemap)\b/i.test(text))
   return {name:"site.help",arguments:{topic:text.slice(0,160)}};
 if(!/^(?:please\s+)?(?:where\s+(?:is|are|can\s+i\s+find)|how\s+(?:do|can)\s+i\s+(?:find|open)|find\s+the|show\s+(?:me\s+)?the|open\s+the|take\s+me\s+to)\b/i.test(text))
   return null;
 if(!/\b(?:knightfall|ash.fall|arcade|games?|chaosphere|messenger|forums?|members?|bots?|memo\s+pad|shop|profile|account|install|foundry|creator|chaos\s+forge|moonology|shadow\s+work|notifications?|legendary|families|boogie|specter|bubblemaw|ruckus|nox|visual\s+lab|code\s+studio|textract|crucible|tool\s+workspace)\b/i.test(text))
   return null;
 return {name:"site.search",arguments:{query:text.slice(0,160)}};
}
