// Cards Against Chaos: asynchronous two-member + three scripted-bot table.
// The Worker owns all card draws, AI turns, private hands and judge decisions.
import {BLACK,WHITE} from "./chaos-card-deck.js";
const BOTS=Object.freeze([
 {id:"lydibug",name:"Lydibug",style:"bright"},
 {id:"butters",name:"Butters",style:"shy"},
 {id:"eddie",name:"Eddie",style:"bold"}
]);
const UUID=/^[a-f\d]{8}-[a-f\d]{4}-[1-8][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i;
const ROW_SELECT=`SELECT m.*,a.username AS first_username,a.display_name AS first_display_name,
 b.username AS second_username,b.display_name AS second_display_name
 FROM arcade_chaos_card_matches m
 JOIN users a ON a.id=m.player_one_id JOIN users b ON b.id=m.player_two_id`;
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function draw(state,key,source){if(!state.decks[key].length)state.decks[key]=shuffle([...source]);return state.decks[key].pop();}
function aiPick(state,bot,prompt){
 const offered=Array.from({length:4},()=>draw(state,"white",WHITE));
 const hints=bot.style==="bright"?/tiny|parade|moon|glitter|cookie|crown|friend/i:
 bot.style==="shy"?/quiet|nap|pillow|sock|soft|library|blanket|ghost/i:
 /dragon|sword|thunder|raccoon|apocalypse|haunted|chaos/i;
 const matching=offered.filter(card=>hints.test(card));
 const chosen=(matching.length?matching:offered)[Math.floor(Math.random()*(matching.length?matching.length:offered.length))];
 state.decks.white.push(...offered.filter(card=>card!==chosen));
 return chosen;
}
function seats(row){return [
 {seat:0,id:Number(row.player_one_id),name:row.first_display_name||row.first_username,kind:"human"},
 {seat:1,id:Number(row.player_two_id),name:row.second_display_name||row.second_username,kind:"human"},
 ...BOTS.map((bot,index)=>({seat:index+2,id:bot.id,name:bot.name,kind:"ai"}))
];}
export function newChaosState(){
 return {round:0,phase:"pending",judge:0,prompt:"",
 scores:[0,0,0,0,0],hands:[[],[]],submitted:{},choices:[],result:null,
 decks:{black:shuffle([...BLACK]),white:shuffle([...WHITE])}};
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
 if(Object.keys(state.submitted).length!==4)return;
 state.choices=shuffle(Object.entries(state.submitted).map(([seat,card])=>({seat:Number(seat),card})));
 if(state.judge>=2){
  const bot=BOTS[state.judge-2];
  const preference=bot.style==="bright"?/tiny|glitter|parade|moon/i:bot.style==="shy"?/soft|nap|quiet|library|sock/i:/dragon|raccoon|chaos|thunder|haunted/i;
  const index=state.choices.findIndex(choice=>preference.test(choice.card));
  winnerChoice(state,index>=0?index:Math.floor(Math.random()*state.choices.length));
 }else state.phase="judge";
}
export function beginChaosRound(state){
 state.round++;state.judge=(state.round-1)%5;
 state.prompt=draw(state,"black",BLACK);state.submitted={};state.choices=[];state.result=null;
 state.phase="submit";
 for(let seat=2;seat<5;seat++)if(seat!==state.judge)state.submitted[seat]=aiPick(state,BOTS[seat-2],state.prompt);
 resolveSubmissions(state);
 return state;
}
export function playChaosCard(state,seat,index){
 if(state.phase!=="submit"||seat===state.judge||seat<0||seat>1||state.submitted[seat]!==undefined)return false;
 const hand=state.hands[seat];
 if(!Number.isInteger(index)||index<0||index>=hand.length)return false;
 state.submitted[seat]=hand.splice(index,1)[0];hand.push(draw(state,"white",WHITE));
 resolveSubmissions(state);return true;
}
export function judgeChaosCard(state,seat,index){
 if(state.phase!=="judge"||state.judge!==seat||seat<0||seat>1||
 !Number.isInteger(index)||index<0||index>=state.choices.length)return false;
 return winnerChoice(state,index);
}
export function visibleChaosMatch(row,viewerId){
 const viewer=Number(viewerId)===Number(row.player_one_id)?0:Number(viewerId)===Number(row.player_two_id)?1:-1;
 if(viewer<0)throw Error("Viewer not a table participant");
 const s=JSON.parse(row.state_json);
 const canPlay=row.status==="active"&&s.phase==="submit"&&s.judge!==viewer&&s.submitted[viewer]===undefined;
 const canJudge=row.status==="active"&&s.phase==="judge"&&s.judge===viewer;
 return {id:row.id,status:row.status,version:Number(row.version),created_at:row.created_at,updated_at:row.updated_at,
 seats:seats(row),viewer_seat:viewer,round:s.round,phase:s.phase,judge:s.judge,prompt:s.prompt,
 scores:s.scores,submitted_count:Object.keys(s.submitted).length,submitted_by_me:s.submitted[viewer]!==undefined,
 hand:canPlay?s.hands[viewer]:[],choices:canJudge?s.choices.map((c,index)=>({index,card:c.card})):[],
 result:s.phase==="results"||s.phase==="finished"?s.result:null,
 can_play:canPlay,can_judge:canJudge,can_next:row.status==="active"&&s.phase==="results",
 needs_action:row.status==="pending"&&viewer===1||canPlay||canJudge||
 (row.status==="active"&&s.phase==="results"),
 winner:s.phase==="finished"?s.scores.indexOf(Math.max(...s.scores)):null
 };
}
async function findRow(env,id){return env.DB.prepare(ROW_SELECT+" WHERE m.id=?").bind(id).first();}
function tableUrl(id){return "/arcade/hosted/cards-against-chaos/index.html?match="+encodeURIComponent(id);}
async function notify(env,createNotification,row,target,title,body){
 try{await createNotification(env,{userId:target,actorId:null,kind:"arcade_card_turn",targetType:"arcade_match",
 title,body,url:tableUrl(row.id)});}catch(error){console.warn("chaos_cards_notify_failed",String(error));}
}
async function notifyTurn(env,createNotification,row){
 if(row.status!=="active")return;
 const s=JSON.parse(row.state_json);
 for(let seat=0;seat<2;seat++){
  const id=seat===0?Number(row.player_one_id):Number(row.player_two_id);
  const action=s.phase==="submit"&&s.judge!==seat&&s.submitted[seat]===undefined?"Pick your answer card":
   s.phase==="judge"&&s.judge===seat?"Judge the anonymous answers":
   s.phase==="results"?"Round results are ready":null;
  if(action)await notify(env,createNotification,row,id,"Cards Against Chaos · "+action,action+" with Lydibug, Butters and Eddie. Play whenever you're ready.");
 }
}
async function saveChange(env,row,state,nextStatus){
 const now=new Date().toISOString();
 const status=nextStatus||row.status;
 const result=await env.DB.prepare("UPDATE arcade_chaos_card_matches SET state_json=?,status=?,version=version+1,updated_at=? WHERE id=? AND version=? AND status=?")
 .bind(JSON.stringify(state),status,now,row.id,row.version,row.status).run();
 return Number(result.meta?.changes||0)===1;
}
export async function handleChaosCardMatches(request,env,url,{getUser,json,rateLimit,origin,createNotification}){
 if(!url.pathname.startsWith("/api/arcade/chaos-cards"))return null;
 const user=await getUser(request,env);
 if(!user)return json({error:"Sign in to play Cards Against Chaos through messaging."},401,origin);
 if(!await rateLimit(env,request,"chaos-card-matches",45,60,user.id))return json({error:"Too many card actions. Try again shortly."},429,origin);
 const respond=(payload,status=200)=>json(payload,status,origin);
 const root="/api/arcade/chaos-cards";
 if(url.pathname===root&&request.method==="GET"){
  const rows=await env.DB.prepare(ROW_SELECT+` WHERE (m.player_one_id=? OR m.player_two_id=?)
   AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE (b.blocker_id=m.player_one_id AND b.blocked_id=m.player_two_id)
   OR (b.blocker_id=m.player_two_id AND b.blocked_id=m.player_one_id))
   ORDER BY CASE WHEN m.status='active' THEN 0 WHEN m.status='pending' THEN 1 ELSE 2 END,m.updated_at DESC LIMIT 60`)
  .bind(user.id,user.id).all();
  return respond({matches:(rows.results||[]).map(row=>visibleChaosMatch(row,user.id))});
 }
 if(url.pathname===root&&request.method==="POST"){
  let body;try{body=await request.json()}catch{return respond({error:"Invalid JSON."},400)}
  const opponentId=Number(body?.opponent_id);
  if(!Number.isSafeInteger(opponentId)||opponentId<1||opponentId===Number(user.id))return respond({error:"Choose an accepted friend."},400);
  const [friend,other,blocked]=await Promise.all([
   env.DB.prepare("SELECT 1 FROM friend_requests WHERE status='accepted' AND ((requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?)) LIMIT 1").bind(user.id,opponentId,opponentId,user.id).first(),
   env.DB.prepare("SELECT id,status FROM users WHERE id=?").bind(opponentId).first(),
   env.DB.prepare("SELECT 1 FROM user_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?) LIMIT 1").bind(user.id,opponentId,opponentId,user.id).first()
  ]);
  if(!friend||blocked)return respond({error:"Only accepted, unblocked friends can play together."},403);
  if(!other||other.status!=="active")return respond({error:"Friend unavailable."},404);
  const existing=await env.DB.prepare("SELECT id FROM arcade_chaos_card_matches WHERE status IN ('pending','active') AND ((player_one_id=? AND player_two_id=?) OR (player_one_id=? AND player_two_id=?)) LIMIT 1").bind(user.id,opponentId,opponentId,user.id).first();
  if(existing)return respond({error:"An open table already exists for these friends.",match_id:existing.id},409);
  const id=crypto.randomUUID(),now=new Date().toISOString();
  try{await env.DB.prepare("INSERT INTO arcade_chaos_card_matches (id,player_one_id,player_two_id,created_by,status,state_json,version,created_at,updated_at) VALUES (?,?,?,?,'pending',?,0,?,?)")
   .bind(id,user.id,opponentId,user.id,JSON.stringify(newChaosState()),now,now).run();}
  catch(error){if(/UNIQUE constraint/i.test(String(error)))return respond({error:"An open table already exists."},409);throw error;}
  const row=await findRow(env,id);
  await notify(env,createNotification,row,opponentId,"Cards Against Chaos challenge","@"+user.username+" invited you to a five-seat card game with Lydibug, Butters and Eddie.");
  return respond({match:visibleChaosMatch(row,user.id)},201);
 }
 const route=url.pathname.match(/^\/api\/arcade\/chaos-cards\/([a-f\d-]{36})(?:\/(accept|decline|cancel|play|judge|next))?$/i);
 if(!route||!UUID.test(route[1]))return respond({error:"Card table not found."},404);
 const [,id,action]=route,row=await findRow(env,id);
 if(!row)return respond({error:"Card table not found."},404);
 const viewer=Number(row.player_one_id)===Number(user.id)?0:Number(row.player_two_id)===Number(user.id)?1:-1;
 if(viewer<0)return respond({error:"This card table belongs to other members."},403);
 const blocked=await env.DB.prepare("SELECT 1 FROM user_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?) LIMIT 1").bind(row.player_one_id,row.player_two_id,row.player_two_id,row.player_one_id).first();
 if(blocked)return respond({error:"This card table is unavailable."},404);
 if(!action&&request.method==="GET")return respond({match:visibleChaosMatch(row,user.id)});
 if(request.method!=="POST")return respond({error:"Method not allowed."},405);
 let body={};try{body=await request.json()||{}}catch{return respond({error:"Invalid JSON."},400)}
 if(!body||typeof body!=="object"||Array.isArray(body))return respond({error:"Invalid card action."},400);
 const state=JSON.parse(row.state_json);let status=row.status;
 if(action==="accept"||action==="decline"){
  if(viewer!==1||status!=="pending")return respond({error:"Invitation is no longer pending."},409);
  if(action==="accept"){
   for(let seat=0;seat<2;seat++)state.hands[seat]=Array.from({length:7},()=>draw(state,"white",WHITE));
   beginChaosRound(state);status="active";
  }else{status="declined";state.phase="declined";}
 }else if(action==="cancel"){
  if(viewer!==0||status!=="pending")return respond({error:"Only the inviter can cancel a pending game."},409);
  status="cancelled";state.phase="cancelled";
 }else{
  if(status!=="active")return respond({error:"This table is not accepting actions."},409);
  if(!Number.isSafeInteger(body.version)||body.version!==Number(row.version))return respond({error:"Table updated. Refresh before playing.",conflict:true},409);
  if(action==="play"&&!playChaosCard(state,viewer,body.card_index))return respond({error:"That card cannot be played on this turn."},409);
  if(action==="judge"&&!judgeChaosCard(state,viewer,body.choice_index))return respond({error:"Only the current human judge can pick an anonymous winner."},409);
  if(action==="next"){if(state.phase!=="results")return respond({error:"Finish judging this round first."},409);beginChaosRound(state);}
  if(!["play","judge","next"].includes(action))return respond({error:"Unknown card action."},404);
  if(state.phase==="finished")status="completed";
 }
 if(!await saveChange(env,row,state,status))return respond({error:"Table updated while you were playing. Refresh to continue.",conflict:true},409);
 const fresh=await findRow(env,id);
 if(action==="accept")await notify(env,createNotification,fresh,Number(row.player_one_id),"Challenge accepted","Your friend joined Cards Against Chaos. The first hand is ready.");
 if(action==="decline"||action==="cancel"){
  await notify(env,createNotification,fresh,viewer===0?Number(row.player_two_id):Number(row.player_one_id),"Cards Against Chaos invitation closed","The invitation was "+(action==="decline"?"declined.":"cancelled."));
 }else if(action==="play"||action==="judge"||action==="next")await notifyTurn(env,createNotification,fresh);
 return respond({match:visibleChaosMatch(fresh,user.id)});
}
