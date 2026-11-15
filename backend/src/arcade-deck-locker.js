/* Deck Locker: private account-scoped cosmetic profile. All current skins free.
 * 0122_deck_locker_accounts.sql must be applied before activating these endpoints.
 * Local arcade play claims are rate-limited cosmetic achievements, NOT security proofs.
 */
export const DECK_FREE_SKINS=Object.freeze(["ash-classic","neon-riot","bone-white","grave-velvet","glitch-circuit","ghost-orchid","infernal-foil","void-royalty","crimson-rite","holo-wraith","toxic-pop","eclipse-noir"]);
export const DECK_EARNED_SKINS=Object.freeze({}); // Existing finishes no longer require deals.
import {PREMIUM_DECK_PRODUCTS} from "./deck-skin-products.js";
import {CINDER_DECK_SKINS,CINDER_DECK_IDS} from "./deck-cinder-products.js";
export const DECK_PREMIUM_SKINS=Object.freeze(Object.keys(PREMIUM_DECK_PRODUCTS)); // Twelve NEW purchasable designs.
export const DECK_ACTIVITY_GAMES=Object.freeze([
 "cards-against-chaos","chaos-blackjack","chaos-five-card-draw","chaos-war",
 "chaos-klondike","chaos-freecell","chaos-crazy-eights","chaos-gin-rummy",
 "chaos-texas-holdem","cinder-eights"
]);
const ROOT="/api/arcade/deck-locker";
const ALL=new Set([...DECK_FREE_SKINS,...Object.keys(DECK_EARNED_SKINS),...DECK_PREMIUM_SKINS,...CINDER_DECK_IDS]);
const GAMES=new Set(DECK_ACTIVITY_GAMES);
const EVENT_ID=/^[a-zA-Z0-9_-]{10,80}$/;
const MAX_LEGACY_IMPORT=50;
const DEAL_COOLDOWN_MS=2500;
const DEFAULT_PROFILE=Object.freeze({equipped_skin:"ash-classic",earned_deals:0,local_imported:0,revision:0});
const timestamp=()=>new Date().toISOString();
const changes=result=>Number(result?.meta?.changes||0);
export function canEquipDeckSkin(skinId,deals=0,ownedPremium=[],ownedCinders=[],vipActive=false){
 if(DECK_FREE_SKINS.includes(skinId))return true;
 if(DECK_PREMIUM_SKINS.includes(skinId))return ownedPremium.includes(skinId);
 const product=CINDER_DECK_SKINS[skinId];
 if(product)return ownedCinders.includes(skinId)&&(product.kind!=="vip"||vipActive);
 return false;
}
function originAllowed(request){
 const origin=request.headers.get("Origin");
 return !origin||origin==="https://ash-fall.com"||origin==="https://www.ash-fall.com";
}
async function ownedPremiumSkins(env,userId){
 // A migration may arrive after code deploy. Keep the twelve free skins usable
 // while the new paid-entitlement table is being provisioned.
 try {
  const r=await env.DB.prepare("SELECT skin_id FROM arcade_deck_paid_entitlements WHERE user_id=? AND state='active'").bind(userId).all();
  return (r.results||[]).map(x=>x.skin_id).filter(id=>DECK_PREMIUM_SKINS.includes(id));
 } catch(error){
  if(/no such table/i.test(String(error)))return [];
  throw error;
 }
}
async function cinderState(env,userId){
 const [owned,member,wallet]=await Promise.all([
  env.DB.prepare("SELECT skin_id FROM arcade_deck_cinder_purchases WHERE user_id=?").bind(userId).all(),
  env.DB.prepare("SELECT 1 AS active FROM member_premium_memberships WHERE user_id=? AND status='active' AND (expires_at IS NULL OR datetime(expires_at)>CURRENT_TIMESTAMP)").bind(userId).first(),
  env.DB.prepare("SELECT balance FROM user_wallets WHERE user_id=?").bind(userId).first()
 ]);
 return {owned_cinder_skin_ids:(owned.results||[]).map(x=>x.skin_id).filter(id=>Object.hasOwn(CINDER_DECK_SKINS,id)),vip_active:!!member,wallet_balance:Number(wallet?.balance||0)};
}
async function readAccount(env,userId){
 const [row,owned,cinders]=await Promise.all([
  env.DB.prepare("SELECT equipped_skin,earned_deals,local_imported,revision FROM arcade_deck_profiles WHERE user_id=?").bind(userId).first(),
  ownedPremiumSkins(env,userId),cinderState(env,userId)
 ]);
 const profile=row?{
  equipped_skin:String(row.equipped_skin||"ash-classic"),
  earned_deals:Number(row.earned_deals||0),
  local_imported:!!Number(row.local_imported),
  revision:Number(row.revision||0)
 }:{...DEFAULT_PROFILE,local_imported:false};
 if(!canEquipDeckSkin(profile.equipped_skin,profile.earned_deals,owned,cinders.owned_cinder_skin_ids,cinders.vip_active))
  profile.equipped_skin="ash-classic"; // Revalidate premium ownership and VIP access on every read.
 return {ok:true,user_id:Number(userId),profile,owned_skin_ids:owned,...cinders};
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
  if(!canEquipDeckSkin(skin,current.profile.earned_deals,current.owned_skin_ids,current.owned_cinder_skin_ids,current.vip_active))
   return send({error:"Unknown or unavailable deck skin.",...current},403);
  await ensureProfile(env,userId);
  const updated=await env.DB.prepare(`UPDATE arcade_deck_profiles
   SET equipped_skin=?,revision=revision+1,updated_at=?
   WHERE user_id=? AND revision=? RETURNING user_id`)
   .bind(skin,timestamp(),userId,body.revision).first();
  if(!updated)return send({error:"Deck Locker changed on another device. Refresh and try again.",...await readAccount(env,userId)},409);
  return send(await readAccount(env,userId));
 }
 if(body.action==="buy_cinders"){
  const item=CINDER_DECK_SKINS[body.skin_id];
  if(!item)return send({error:"Unknown Cinders deck skin."},400);
  // The browser supplies only an ID. SQLite validates tier, price, balance and
  // one-purchase-per-account atomically using the 0142 triggers.
  const current=await readAccount(env,userId);
  if(current.owned_cinder_skin_ids.includes(item.id))return send({error:"You already own this deck skin.",...current},409);
  if(item.kind==="vip"&&!current.vip_active)return send({error:"An active VIP membership is required for this design.",...current},403);
  if(current.wallet_balance<item.cost_cinders)return send({error:"Not enough Cinders.",...current},409);
  await env.DB.prepare("INSERT OR IGNORE INTO user_wallets(user_id,balance) VALUES(?,?)").bind(userId,(user.username==="knightfall"||["admin","moderator","god"].includes(user.role))?1000000:2000).run();
  try{
   await env.DB.prepare("INSERT INTO arcade_deck_cinder_purchases(user_id,skin_id,cost_cinders) VALUES(?,?,?)").bind(userId,item.id,item.cost_cinders).run();
  }catch(error){
   const msg=String(error?.message||error);
   if(/VIP membership required/.test(msg))return send({error:"Active VIP membership required."},403);
   if(/Already owned|Not enough Cinders|Invalid Cinders skin price/.test(msg))return send({error:msg.match(/Already owned|Not enough Cinders|Invalid Cinders skin price/)[0]},409);
   console.warn("deck_cinders_purchase_rejected",msg.slice(0,150));
   return send({error:"Purchase was not completed. Please retry."},409);
  }
  return send({...await readAccount(env,userId),purchased:item.id,cinders_spent:item.cost_cinders},201);
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
