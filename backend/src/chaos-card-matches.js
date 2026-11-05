// Cards Against Chaos: four seats, always. 1-4 real members; bots fill vacancies.
// All hands, AI decisions, invitations and scoring are Worker-owned.
import {BLACK,WHITE} from "./chaos-card-deck.js";

export const CHAOS_CARD_BOTS=Object.freeze([
 {id:"lydibug",name:"Lydibug",style:"bright"},
 {id:"butters",name:"Butters",style:"shy"},
 {id:"eddie",name:"Eddie",style:"bold"}
]);
const SEAT_COUNT=4;
const UUID=/^[a-f\d]{8}-[a-f\d]{4}-[1-8][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i;
const ROOT="/api/arcade/chaos-cards";
const ROW_SELECT=`SELECT m.*,
 u1.username AS first_username,u1.display_name AS first_display_name,
 u2.username AS second_username,u2.display_name AS second_display_name,
 u3.username AS third_username,u3.display_name AS third_display_name,
 u4.username AS fourth_username,u4.display_name AS fourth_display_name
 FROM arcade_chaos_four_matches m
 JOIN users u1 ON u1.id=m.player_one_id
 LEFT JOIN users u2 ON u2.id=m.player_two_id
 LEFT JOIN users u3 ON u3.id=m.player_three_id
 LEFT JOIN users u4 ON u4.id=m.player_four_id`;

function shuffle(list){
 const a=[...list];
 for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
 return a;
}
function draw(state,key,source){
 if(!state.decks[key].length)state.decks[key]=shuffle(source);
 return state.decks[key].pop();
}
function memberIds(row){
 return [row.player_one_id,row.player_two_id,row.player_three_id,row.player_four_id]
 .map(id=>id==null?null:Number(id));
}
function memberName(row,index){
 const prefix=["first","second","third","fourth"][index];
 return row[prefix+"_display_name"]||row[prefix+"_username"]||"Friend "+(index+1);
}
function memberSeat(state,viewerId){
 return state.members.findIndex((id,index)=>id!=null&&Number(id)===Number(viewerId)&&
 ["accepted","pending"].includes(state.invite_status[index]));
}
function joinedSeat(state,viewerId){
 return state.members.findIndex((id,index)=>id!=null&&Number(id)===Number(viewerId)&&
 state.invite_status[index]==="accepted");
}
function botForIndex(state,index){
 const used=state.invite_status.slice(0,index).filter(x=>x!=="accepted").length;
 return CHAOS_CARD_BOTS[used];
}
function seatsFor(row,state){
 const ids=memberIds(row);
 return Array.from({length:SEAT_COUNT},(_,seat)=>{
  if(state.invite_status[seat]==="accepted")
   return {seat,kind:"human",id:ids[seat],name:memberName(row,seat)};
  const bot=botForIndex(state,seat);
  return {seat,kind:"ai",id:bot.id,name:bot.name,
   pending_invite:state.invite_status[seat]==="pending"?memberName(row,seat):null};
 });
}
export function newChaosState(ownerId=1,invited=[]){
 if(!Array.isArray(invited)||invited.length>3)throw Error("One to four human seats only");
 const members=[Number(ownerId),...invited.map(Number)];
 while(members.length<SEAT_COUNT)members.push(null);
 const invite_status=members.map((id,index)=>index===0?"accepted":id==null?"bot":"pending");
 return {members,invite_status,round:0,phase:"lobby",judge:0,prompt:"",
 scores:[0,0,0,0],hands:[[],[],[],[]],submitted:{},choices:[],result:null,
 decks:{black:shuffle(BLACK),white:shuffle(WHITE)}};
}
function aiCard(state,bot){
 const offer=Array.from({length:4},()=>draw(state,"white",WHITE));
 const preferred=bot.style==="bright"?/tiny|parade|moon|glitter|cookie|crown|friend/i:
  bot.style==="shy"?/quiet|nap|pillow|sock|soft|library|blanket|ghost/i:
  /dragon|sword|thunder|raccoon|apocalypse|haunted|chaos/i;
 const matches=offer.filter(card=>preferred.test(card));
 const source=matches.length?matches:offer;
 const chosen=source[Math.floor(Math.random()*source.length)];
 state.decks.white.push(...offer.filter((_,i)=>offer.indexOf(chosen)!==i));
 return chosen;
}
function winnerChoice(state,index){
 const chosen=state.choices[index];
 if(!chosen)return false;
 state.scores[chosen.seat]++;
 state.result={round:state.round,seat:chosen.seat,card:chosen.card,judge:state.judge};
 state.phase=state.scores.some(score=>score>=5)?"finished":"results";
 return true;
}
function resolveSubmissions(state){
 if(Object.keys(state.submitted).length!==SEAT_COUNT-1)return;
 state.choices=shuffle(Object.entries(state.submitted).map(([seat,card])=>({seat:Number(seat),card})));
 if(state.invite_status[state.judge]!=="accepted"){
  const bot=botForIndex(state,state.judge);
  const preferred=bot.style==="bright"?/tiny|glitter|parade|moon/i:
   bot.style==="shy"?/soft|nap|quiet|library|sock/i:
   /dragon|raccoon|chaos|thunder|haunted/i;
  const pick=state.choices.findIndex(choice=>preferred.test(choice.card));
  winnerChoice(state,pick>=0?pick:Math.floor(Math.random()*state.choices.length));
 }else state.phase="judge";
}
export function beginChaosRound(state){
 if(!["active","results"].includes(state.phase))return false;
 state.round++;
 state.judge=(state.round-1)%SEAT_COUNT;
 state.prompt=draw(state,"black",BLACK);
 state.submitted={};state.choices=[];state.result=null;state.phase="submit";
 for(let seat=0;seat<SEAT_COUNT;seat++){
  if(seat!==state.judge&&state.invite_status[seat]!=="accepted")
   state.submitted[seat]=aiCard(state,botForIndex(state,seat));
 }
 resolveSubmissions(state);
 return true;
}
export function startChaosTable(state){
 if(state.phase!=="lobby")return false;
 state.invite_status=state.invite_status.map(status=>status==="pending"?"expired":status);
 for(let seat=0;seat<SEAT_COUNT;seat++)if(state.invite_status[seat]==="accepted")
  state.hands[seat]=Array.from({length:7},()=>draw(state,"white",WHITE));
 state.phase="active";
 return beginChaosRound(state);
}
export function playChaosCard(state,seat,index){
 if(state.phase!=="submit"||seat===state.judge||seat<0||seat>=SEAT_COUNT||
  state.invite_status[seat]!=="accepted"||state.submitted[seat]!==undefined)return false;
 const hand=state.hands[seat];
 if(!Array.isArray(hand)||!Number.isInteger(index)||index<0||index>=hand.length)return false;
 state.submitted[seat]=hand.splice(index,1)[0];
 hand.push(draw(state,"white",WHITE));
 resolveSubmissions(state);
 return true;
}
export function judgeChaosCard(state,seat,index){
 if(state.phase!=="judge"||seat!==state.judge||seat<0||seat>=SEAT_COUNT||
 state.invite_status[seat]!=="accepted"||!Number.isInteger(index)||
 index<0||index>=state.choices.length)return false;
 return winnerChoice(state,index);
}
export function visibleChaosMatch(row,viewerId){
 const state=JSON.parse(row.state_json);
 const viewer=memberSeat(state,viewerId);
 if(viewer<0)throw Error("Viewer not a table participant");
 const joined=state.invite_status[viewer]==="accepted";
 const canPlay=row.status==="active"&&joined&&state.phase==="submit"&&state.judge!==viewer&&
  state.submitted[viewer]===undefined;
 const canJudge=row.status==="active"&&joined&&state.phase==="judge"&&state.judge===viewer;
 return {
  id:row.id,status:row.status,version:Number(row.version),created_at:row.created_at,updated_at:row.updated_at,
  seats:seatsFor(row,state),viewer_seat:viewer,human_count:state.invite_status.filter(x=>x==="accepted").length,
  round:state.round,phase:state.phase,judge:state.judge,prompt:state.prompt,
  scores:state.scores,submitted_count:Object.keys(state.submitted).length,
  submitted_by_me:state.submitted[viewer]!==undefined,
  hand:canPlay?[...state.hands[viewer]]:[],
  choices:canJudge?state.choices.map((c,index)=>({index,card:c.card})):[],
  result:["results","finished"].includes(state.phase)?state.result:null,
  can_play:canPlay,can_judge:canJudge,
  can_next:row.status==="active"&&joined&&state.phase==="results",
  can_accept:row.status==="lobby"&&state.invite_status[viewer]==="pending",
  can_start:row.status==="lobby"&&viewer===0,
  can_cancel:row.status==="lobby"&&viewer===0,
  needs_action:(row.status==="lobby"&&viewer===0)||row.status==="lobby"&&state.invite_status[viewer]==="pending"||
    canPlay||canJudge||(row.status==="active"&&joined&&state.phase==="results"),
  winner:state.phase==="finished"?state.scores.indexOf(Math.max(...state.scores)):null
 };
}
async function loadRow(env,id){return env.DB.prepare(ROW_SELECT+" WHERE m.id=?").bind(id).first();}
async function blockedPair(env,a,b){
 return !!await env.DB.prepare("SELECT 1 FROM user_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?) LIMIT 1")
 .bind(a,b,b,a).first();
}
async function saveState(env,row,state,status){
 const now=new Date().toISOString();
 const updated=await env.DB.prepare(`UPDATE arcade_chaos_four_matches
 SET state_json=?,status=?,version=version+1,updated_at=? WHERE id=? AND version=? AND status=?`)
 .bind(JSON.stringify(state),status,now,row.id,row.version,row.status).run();
 return Number(updated.meta?.changes||0)===1;
}
function matchURL(id){return "/arcade/hosted/cards-against-chaos/index.html?match="+encodeURIComponent(id);}
async function notify(env,createNotification,row,userId,title,body,actorId=null){
 try{
  await createNotification(env,{userId,actorId,kind:"arcade_card_turn",targetType:"arcade_match",
   title,body,url:matchURL(row.id)});
 }catch(error){console.warn("chaos_card_notice_failed",String(error));}
}
async function notifyTurns(env,createNotification,row,actorId){
 if(row.status!=="active"&&row.status!=="completed")return;
 const state=JSON.parse(row.state_json);
 for(let seat=0;seat<SEAT_COUNT;seat++){
  if(state.invite_status[seat]!=="accepted")continue;
  const id=state.members[seat];if(Number(id)===Number(actorId))continue;
  const action=state.phase==="submit"&&state.judge!==seat&&state.submitted[seat]===undefined?"Choose your answer":
   state.phase==="judge"&&state.judge===seat?"Judge the cards":
   state.phase==="results"?"See the round winner":
   state.phase==="finished"?"See the final scores":null;
  if(action)await notify(env,createNotification,row,id,"Cards Against Chaos · "+action,
   "Your four-player card table is ready. Take your turn whenever you like.",actorId);
 }
}
export async function handleChaosCardMatches(request,env,url,{getUser,json,rateLimit,origin,createNotification}){
 if(!url.pathname.startsWith(ROOT))return null;
 const user=await getUser(request,env);
 if(!user)return json({error:"Sign in to play Cards Against Chaos."},401,origin);
 if(!await rateLimit(env,request,"chaos-card-matches",45,60,user.id))
  return json({error:"Too many card actions. Try again shortly."},429,origin);
 const reply=(body,status=200)=>json(body,status,origin);
 if(url.pathname===ROOT&&request.method==="GET"){
  const rows=await env.DB.prepare(ROW_SELECT+` WHERE
  (m.player_one_id=? OR m.player_two_id=? OR m.player_three_id=? OR m.player_four_id=?)
  AND NOT EXISTS (SELECT 1 FROM user_blocks b WHERE
    (b.blocker_id=m.player_one_id AND b.blocked_id=?)
    OR (b.blocked_id=m.player_one_id AND b.blocker_id=?))
  ORDER BY CASE m.status WHEN 'active' THEN 0 WHEN 'lobby' THEN 1 ELSE 2 END,
  m.updated_at DESC LIMIT 80`)
  .bind(user.id,user.id,user.id,user.id,user.id,user.id).all();
  const matches=[];
  for(const row of rows.results||[]){
   try{matches.push(visibleChaosMatch(row,user.id));}catch{/* declined or expired invitations stay private */}
  }
  return reply({matches});
 }
 if(url.pathname===ROOT&&request.method==="POST"){
  let body;try{body=await request.json();}catch{return reply({error:"Invalid JSON."},400);}
  if(!body||typeof body!=="object"||Array.isArray(body))return reply({error:"Invalid match setup."},400);
  const raw=body.opponent_ids===undefined?(body.opponent_id==null?[]:[body.opponent_id]):body.opponent_ids;
  if(!Array.isArray(raw)||raw.length>3)return reply({error:"Choose between one and four human players."},400);
  const invited=raw.map(Number);
  if(invited.some(id=>!Number.isSafeInteger(id)||id<1||id===Number(user.id))||
    new Set(invited).size!==invited.length)
   return reply({error:"Choose up to three different accepted friends."},400);
  // Validate every invitation before writing a match. Declined and blocked members are not participants.
  for(const id of invited){
   const [friend,account]=await Promise.all([
    env.DB.prepare("SELECT 1 FROM friend_requests WHERE status='accepted' AND ((requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?)) LIMIT 1")
      .bind(user.id,id,id,user.id).first(),
    env.DB.prepare("SELECT id,status FROM users WHERE id=?").bind(id).first()
   ]);
   if(!friend||!account||account.status!=="active"||await blockedPair(env,user.id,id))
    return reply({error:"Each invited player must be an active, unblocked friend."},403);
  }
  for(let a=0;a<invited.length;a++)for(let b=a+1;b<invited.length;b++){
   if(await blockedPair(env,invited[a],invited[b]))
    return reply({error:"Invited players have a block restriction between them."},403);
  }
  const state=newChaosState(user.id,invited);
  const solo=invited.length===0;
  if(solo)startChaosTable(state);
  const id=crypto.randomUUID(),now=new Date().toISOString();
  await env.DB.prepare(`INSERT INTO arcade_chaos_four_matches
    (id,player_one_id,player_two_id,player_three_id,player_four_id,status,state_json,version,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,0,?,?)`)
   .bind(id,user.id,invited[0]??null,invited[1]??null,invited[2]??null,solo?"active":"lobby",JSON.stringify(state),now,now).run();
  const row=await loadRow(env,id);
  for(const id of invited)await notify(env,createNotification,row,id,"Four-player Cards Against Chaos invite",
   "@"+user.username+" invited you to a four-seat card table. Any missing players are AI.",user.id);
  return reply({match:visibleChaosMatch(row,user.id)},201);
 }
 const route=url.pathname.match(/^\/api\/arcade\/chaos-cards\/([a-f\d-]{36})(?:\/(accept|decline|cancel|start|play|judge|next))?$/i);
 if(!route||!UUID.test(route[1]))return reply({error:"Card table not found."},404);
 const [,id,action]=route;
 const row=await loadRow(env,id);
 if(!row)return reply({error:"Card table not found."},404);
 const state=JSON.parse(row.state_json);
 const viewer=memberSeat(state,user.id);
 if(viewer<0)return reply({error:"This match belongs to other members."},403);
 if(Number(row.player_one_id)!==Number(user.id)&&await blockedPair(env,row.player_one_id,user.id))
  return reply({error:"This card table is unavailable."},404);
 if(!action&&request.method==="GET")return reply({match:visibleChaosMatch(row,user.id)});
 if(request.method!=="POST")return reply({error:"Method not allowed."},405);
 let body;try{body=await request.json();}catch{return reply({error:"Invalid JSON."},400);}
 if(!body||typeof body!=="object"||Array.isArray(body))return reply({error:"Invalid card action."},400);
 if(!Number.isSafeInteger(body.version)||body.version!==Number(row.version))
  return reply({error:"Table changed. Refresh and try again.",conflict:true},409);
 let status=row.status;
 if(action==="accept"||action==="decline"){
  if(status!=="lobby"||state.invite_status[viewer]!=="pending")
   return reply({error:"This invitation can no longer be accepted."},409);
  state.invite_status[viewer]=action==="accept"?"accepted":"declined";
  const otherPending=state.invite_status.includes("pending");
  if(!otherPending){startChaosTable(state);status="active";}
 }else if(action==="cancel"){
  if(viewer!==0||status!=="lobby")return reply({error:"Only the host can cancel an unstarted table."},409);
  status="cancelled";state.phase="cancelled";
 }else if(action==="start"){
  if(viewer!==0||status!=="lobby")return reply({error:"Only the host can begin this table."},409);
  startChaosTable(state);status="active";
 }else{
  if(status!=="active"||state.invite_status[viewer]!=="accepted")
   return reply({error:"This table is not accepting your move."},409);
  if(action==="play"&&!playChaosCard(state,viewer,body.card_index))
   return reply({error:"That card cannot be played on this turn."},409);
  if(action==="judge"&&!judgeChaosCard(state,viewer,body.choice_index))
   return reply({error:"Only the judge can pick an anonymous winning card."},409);
  if(action==="next"&&!beginChaosRound(state))
   return reply({error:"Finish this round before dealing again."},409);
  if(!["play","judge","next"].includes(action))return reply({error:"Unknown card action."},404);
  if(state.phase==="finished")status="completed";
 }
 if(!await saveState(env,row,state,status))
  return reply({error:"Table changed during your move. Refresh to continue.",conflict:true},409);
 const fresh=await loadRow(env,id);
 if(action==="accept"||action==="decline"||action==="cancel"){
  const title=action==="accept"?"Player joined the card table":action==="decline"?"Card invitation declined":"Card table cancelled";
  await notify(env,createNotification,fresh,row.player_one_id,title,
   "@"+user.username+" "+(action==="accept"?"accepted.":action==="decline"?"declined.":"cancelled the table."),user.id);
 }
 await notifyTurns(env,createNotification,fresh,user.id);
 if(action==="decline")return reply({closed:true,message:"Invitation declined."});
 return reply({match:visibleChaosMatch(fresh,user.id)});
}
