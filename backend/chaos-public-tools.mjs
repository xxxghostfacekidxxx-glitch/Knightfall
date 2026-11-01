/**
 * Bounded, public-only search adapter for Miss Chaos.
 * Only hand-curated public pages belong here. Do not index private user data.
 */
export const PUBLIC_PAGES = Object.freeze([
  {title:"Personal Bots",url:"/personal-bots.html",terms:"create edit publish private personal bots companions slots"},
  {title:"Offline Personal Bots",url:"/personal-bots-offline.html",terms:"offline local bot backup export import device no internet"},
  {title:"Miss Chaos",url:"/miss-chaos.html",terms:"ai assistant chat conversation history memory voice"},
  {title:"Chaos Cartridge",url:"/chaos-cartridge.html",terms:"arcade games play browser"},
  {title:"Messages",url:"/messages.html",terms:"private messages inbox friends"}
]);
export function searchPublicPages(input = {}) {
  const query = String(input.query || "").trim().toLowerCase().slice(0,160);
  if (!query) return [];
  const tokens = [...new Set(query.match(/[a-z0-9]{2,}/g) || [])].slice(0,12);
  return PUBLIC_PAGES.map(page => {
    const haystack = (page.title+" "+page.terms).toLowerCase();
    return {...page,score:tokens.reduce((score,token)=>score+(haystack.includes(token)?1:0),0)};
  }).filter(page=>page.score>0).sort((a,b)=>b.score-a.score).slice(0,5).map(({title,url})=>({title,url}));
}
export const publicChaosHandlers = Object.freeze({
  "site.help": async ({input}) => ({results:searchPublicPages({query:input.topic})}),
  "site.games": async () => ({results:PUBLIC_PAGES.filter(page=>page.title==="Chaos Cartridge").map(({title,url})=>({title,url}))}),
  "site.search": async ({input}) => ({results:searchPublicPages(input)})
});
