/* Deck Locker: private, account-scoped profile and server-owned premium cosmetics.
 * 0122_deck_locker_accounts.sql must be applied before activating these endpoints.
 * Local arcade play claims are rate-limited cosmetic achievements, NOT security proofs.
 */
export const DECK_FREE_SKINS=Object.freeze(["ash-classic","neon-riot","bone-white"]);
export const DECK_EARNED_SKINS=Object.freeze({
 "grave-velvet":3,"glitch-circuit":10,"ghost-orchid":25,"infernal-foil":50
});
export const DECK_PREMIUM_SKINS=Object.freeze(["void-royalty","crimson-rite","holo-wraith","toxic-pop","eclipse-noir"]);
export const DECK_ACTIVITY_GAMES=Object.freeze([
 "cards-against-chaos","chaos-blackjack","chaos-five-card-draw","chaos-war",
 "chaos-klondike","chaos-freecell","chaos-crazy-eights","chaos-gin-rummy",
 "chaos-texas-holdem","cinder-eights"
]);
const ROOT="/api/arcade/deck-locker";
const ALL=new Set([...DECK_FREE_SKINS,...Object.keys(DECK_EARNED_SKINS),...DECK_PREMIUM_SKINS]);
const GAMES=new Set(DECK_ACTIVITY_GAMES);
const EVENT_ID=/^[a-zA-Z0-9_-]{10,80}$/;
const MAX_LEGACY_IMPORT=50;
const DEAL_COOLDOWN_MS=2500;
const DEFAULT_PROFILE=Object.freeze({equipped_skin:"ash-classic",earned_deals:0,local_imported:0,revision:0});
const timestamp=()=>new Date().toISOString();
const changes=result=>Number(result?.meta?.changes||0);
export function canEquipDeckSkin(skinId,deals=0,ownedPremium=[]){
 if(!ALL.has(skinId))return false;
 if(DECK_FREE_SKINS.includes(skinId))return true;
 if(Object.hasOwn(DECK_EARNED_SKINS,skinId))return Number(deals)>=DECK_EARNED_SKINS[skinId];
 return DECK_PREMIUM_SKINS.includes(skinId)&&ownedPremium.includes(skinId);
}
function originAllowed(request){
 const origin=request.headers.get("Origin");
 return !origin||origin==="https://ash-fall.com"||origin==="https://www.ash-fall.com";
}
async function ownedPremiumSkins(env,userId){
 const r=await env.DB.prepare("SELECT skin_id FROM arcade_deck_entitlements WHERE user_id=? AND state='active'").bind(userId).all();
 return (r.results||[]).map(x=>x.skin_id).filter(id=>DECK_PREMIUM_SKINS.includes(id));
}
async function readAccount(env,userId){
 const [row,owned]=await Promise.all([
  env.DB.prepare("SELECT equipped_skin,earned_deals,local_imported,revision FROM arcade_deck_profiles WHERE user_id=?").bind(userId).first(),
  ownedPremiumSkins(env,userId)
 ]);
 const profile=row?{
  equipped_skin:String(row.equipped_skin||"ash-classic"),
  earned_deals:Number(row.earned_deals||0),
  local_imported:!!Number(row.local_imported),
  revision:Number(row.revision||0)
 }:{...DEFAULT_PROFILE,local_imported:false};
 if(!canEquipDeckSkin(profile.equipped_skin,profile.earned_deals,owned))
  profile.equipped_skin="ash-classic"; // refund/revocation must not display a premium finish
 return {ok:true,user_id:Number(userId),profile,owned_skin_ids:owned};
}
async function ensureProfile(env,userId){
 await env.DB.prepare("INSERT OR IGNORE INTO arcade_deck_profiles(user_id) VALUES (?)").bind(userId).run();
}
function response(json,origin,payload,status=200){
 return json(payload,status,origin,{"cache-control":"no-store"});
}
export async function handleArcadeDeckLocker(request,env,url,{getUser,json,rateLimit,origin}){
 if(url.pathname!==ROOT)return null;
 const send=(data,status=200)=>response(json,origin,data,status);
 if(!["GET","PUT","POST"].includes(request.method))return send({error:"Method not allowed."},405);
 if(request.method!=="GET"&&!originAllowed(request))return send({error:"Invalid request origin."},403);
 const user=await getUser(request,env);
 if(!user)return send({error:"Sign in to sync your Deck Locker."},401);
 const userId=Number(user.id);
 if(request.method==="GET")return send(await readAccount(env,userId));
 if(!await rateLimit(env,request,"deck-locker-write",70,60,userId))
  return send({error:"Too many Deck Locker updates; try again shortly."},429);
 if(!String(request.headers.get("content-type")||"").toLowerCase().includes("application/json"))
  return send({error:"Expected JSON."},415);
 let body;
 try{body=await request.json()}catch{return send({error:"Invalid JSON."},400)}
 if(!body||typeof body!=="object"||Array.isArray(body))return send({error:"Invalid Deck Locker request."},400);
 if(request.method==="PUT"){
  const skin=body.skin_id;
  if(typeof skin!=="string"||!ALL.has(skin))return send({error:"Unknown deck skin."},400);
  if(!Number.isSafeInteger(body.revision)||body.revision<0)return send({error:"Expected account wardrobe revision."},400);
  const current=await readAccount(env,userId);
  if(!canEquipDeckSkin(skin,current.profile.earned_deals,current.owned_skin_ids))
   return send({error:"This deck skin is not unlocked or owned.",...current},403);
  await ensureProfile(env,userId);
  const updated=await env.DB.prepare(`UPDATE arcade_deck_profiles
   SET equipped_skin=?,revision=revision+1,updated_at=?
   WHERE user_id=? AND revision=? RETURNING user_id`)
   .bind(skin,timestamp(),userId,body.revision).first();
  if(!updated)return send({error:"Deck Locker changed on another device. Refresh and try again.",...await readAccount(env,userId)},409);
  return send(await readAccount(env,userId));
 }
 if(body.action==="import"){
  const value=body.legacy_deals;
  if(!Number.isSafeInteger(value)||value<0||value>MAX_LEGACY_IMPORT)
   return send({error:"Legacy import must be 0–50 device-earned deals."},400);
  await ensureProfile(env,userId);
  const updated=await env.DB.prepare(`UPDATE arcade_deck_profiles
   SET earned_deals=MAX(earned_deals,?),local_imported=1,revision=revision+1,updated_at=?
   WHERE user_id=? AND local_imported=0 RETURNING user_id`)
   .bind(value,timestamp(),userId).first();
  if(!updated)return send({error:"This account already imported device progress.",...await readAccount(env,userId)},409);
  return send({...await readAccount(env,userId),imported:true});
 }
 if(body.action==="deal"){
  const game=body.game_key,eventId=body.event_id;
  if(typeof game!=="string"||!GAMES.has(game))return send({error:"Unknown card game."},400);
  if(typeof eventId!=="string"||!EVENT_ID.test(eventId))return send({error:"Invalid play event."},400);
  await ensureProfile(env,userId);
  const inserted=await env.DB.prepare(`INSERT OR IGNORE INTO arcade_deck_events(user_id,event_id,game_key)
    VALUES (?,?,?)`).bind(userId,eventId,game).run();
  let counted=false;
  if(changes(inserted)===1){
   const now=Date.now();
   const updated=await env.DB.prepare(`UPDATE arcade_deck_profiles
    SET earned_deals=MIN(100000,earned_deals+1),last_deal_at=?,revision=revision+1,updated_at=?
    WHERE user_id=? AND (last_deal_at IS NULL OR last_deal_at<=?)
    RETURNING user_id`)
    .bind(new Date(now).toISOString(),new Date(now).toISOString(),userId,new Date(now-DEAL_COOLDOWN_MS).toISOString()).first();
   counted=!!updated;
  }
  return send({...await readAccount(env,userId),counted});
 }
 return send({error:"Unknown Deck Locker action."},400);
}
