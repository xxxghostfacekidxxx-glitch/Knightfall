import * as Astronomy from "astronomy-engine";
import arcade from "../../public/arcade/catalog.json" with {type:"json"};
import {lunarSnapshot,phases} from "../../public/lunar-phases.mjs";
import {shadowPrompts} from "../../public/shadow-prompts.mjs";

const arcadeLink="/chaos-cartridge.html";
const publicGames=arcade.games.filter(game=>
  ["games","mini"].includes(game.collection) &&
  ["desktop","touch"].includes(game.device) &&
  /^\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.html$/.test(game.route) &&
  !game.route.startsWith("/casino/") && !/requires sign.in|unavailable|license pending/i.test(game.notes)
);
const words=text=>String(text||"").toLowerCase().match(/[a-z0-9]+/g)||[];
const genres=new Set(publicGames.map(game=>game.genre.toLowerCase()));
const stop=new Set(["a","an","the","me","my","i","it","to","on","of","for","in","and","some","something","with","good","any","please","can","you","could","would","want","like","play","playing","arcade","game","games","find","pick","recommend","recommendation","recommendations","suggest","suggestions","what","should","got","have","phone","mobile","touch","android","iphone","tablet","desktop","pc","keyboard","quick","short","mini","full","today","right","now","which","show"]);

export function arcadePicks({query="",device="",length=""}={}){
  const tokens=[...new Set(words(query).filter(word=>!stop.has(word)))].slice(0,12);
  const requestedGenres=tokens.map(word=>genres.has(word)?word:word.endsWith("s")&&genres.has(word.slice(0,-1))?word.slice(0,-1):null).filter(Boolean);
  const candidates=publicGames.filter(game=>
    (!device || game.device===device || device==="desktop"&&game.device==="touch") &&
    (!length || game.collection===length) &&
    (!requestedGenres.length || requestedGenres.includes(game.genre.toLowerCase()))
  );
  const terms=tokens.filter(word=>!requestedGenres.includes(word)&&!requestedGenres.includes(word.slice(0,-1)));
  const ranked=candidates.map(game=>{
    const title=words(game.title).join(" "), description=words(game.description).join(" ");
    const score=terms.reduce((sum,word)=>sum+(title.split(" ").includes(word)?8:description.split(" ").includes(word)?2:0),0);
    return {game,score};
  }).filter(item=>!terms.length||item.score>0)
    .sort((a,b)=>b.score-a.score||Number(b.game.featured)-Number(a.game.featured)||a.game.title.localeCompare(b.game.title));
  return {kind:"arcade",url:arcadeLink,results:ranked.slice(0,4).map(({game})=>({
    title:game.title,url:game.route,description:game.description,genre:game.genre,
    controls:game.device==="touch"?"Touch supported":"Keyboard / desktop",
    shelf:game.collection==="mini"?"Mini game":"Full game"
  }))};
}

export function moonBrief(now=new Date()){
  const {index,illumination}=lunarSnapshot(Astronomy,now), phase=phases[index];
  const next=Astronomy.SearchMoonQuarter(now);
  return {kind:"moon",phase:phase.name,icon:phase.icon,illumination:Math.round(illumination*100),
    as_of:now.toISOString(),next_phase:phases[next.quarter*2].name,next_at:next.time.date.toISOString(),
    prompt:phase.prompt,url:"/moonology.html"};
}

export function shadowBrief(topic="",now=new Date()){
  const key=topic.trim().toLowerCase();
  const prompt=shadowPrompts.find(item=>item.id===key)||
    shadowPrompts[Math.floor(now.getTime()/86400000)%shadowPrompts.length];
  return {kind:"shadow",...prompt,url:"/shadow-work.html",journal_url:"/shadow-work.html#journal"};
}

export function radarContext(message){
  const latest=String(message||"").trim();
  let evidence;
  if (/\b(?:moon phase|phase (?:is|of) the moon|current moon|moonology|(?:next|when is the) (?:new|full) moon)\b/i.test(latest)) {
    const now=new Date();
    evidence=moonBrief(now);
    // Include specific upcoming new/full events for direct timing questions.
    evidence.upcoming=["New Moon","Full Moon"].map((phase,i)=>({
      phase,at:Astronomy.SearchMoonPhase(i*180,now,35)?.date.toISOString()
    }));
  } else if (/\b(?:shadow work|shadow journal)\b/i.test(latest) && /\b(?:prompt|reflect|reflection|exercise|journal|start)\b/i.test(latest)) {
    const lower=latest.toLowerCase();
    const topic=shadowPrompts.find(item=>lower.includes(item.name.toLowerCase())||lower.includes(item.id.replaceAll("-"," ")));
    evidence=shadowBrief(topic?.id);
  } else if (/\b(?:arcade|games?)\b/i.test(latest) && /\b(?:find|pick|play|recommend|suggest|which|what)\b/i.test(latest)) {
    evidence=arcadePicks({query:latest,device:/\b(?:phone|mobile|touch|android|iphone|tablet)\b/i.test(latest)?"touch":"",
      length:/\b(?:quick|short|mini)\b/i.test(latest)?"mini":""});
  }
  if(!evidence)return "";
  return "\n\nCHAOS RADAR DATA (read-only, verified calculation or published catalog):\n"+JSON.stringify(evidence)+
    "\nWhen relevant, use these facts in your own voice. Render relevant paths as full https://ash-fall.com links on their own lines. "+
    "The arcade list reflects catalog metadata and does not guarantee that a game is currently working. If no games match, say so and link to the catalog. "+
    "Moon event timestamps are UTC. Treat reflection prompts as optional and never claim to have read or written a member's journal.";
}
