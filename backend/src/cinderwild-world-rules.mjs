// Cinderwild authoritative movement rules for the future multiplayer world.
// This module intentionally has no HTTP route: all input positions and crests
// must be loaded from server-owned state before these rules are used.
export const WORLD_WIDTH=64, WORLD_HEIGHT=38, WORLD_RULES_VERSION=1;
export const WARDENS=Object.freeze([
 Object.freeze({id:"bramble",x:24,y:19}),
 Object.freeze({id:"storm",x:43,y:19}),
 Object.freeze({id:"eclipse",x:57,y:19})
]);
const NPCS=Object.freeze([{x:6,y:17},{x:10,y:17},...WARDENS]);
const DIRECTIONS=Object.freeze({up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]});
const hash=(x,y)=>{let z=(x*374761393+y*668265263+93284)|0;z=Math.imul(z^(z>>>13),1274126177);return(z^(z>>>16))>>>0;};
export function terrainAt(x,y){
 if(!Number.isSafeInteger(x)||!Number.isSafeInteger(y)||x<0||x>=WORLD_WIDTH||y<0||y>=WORLD_HEIGHT)return "wall";
 if(y===0||y===WORLD_HEIGHT-1||x===0||x===WORLD_WIDTH-1)return "tree";
 if(x<14&&y>=12&&y<=23){
  if((x===4||x===11)&&y===14)return "roof";
  if((x===4||x===11)&&y===15)return "house";
  return y>=17&&y<=19?"path":"town";
 }
 if(y>=17&&y<=19)return "path";
 if(x>=36&&x<=44&&y>=5&&y<=12)return "water";
 if((x>=15&&x<31&&y<5)||(x>=51&&y<7))return "tree";
 const value=hash(x,y)%100;
 if(value<9&&Math.abs(y-18)>4)return "tree";
 return value<57?"grass":"field";
}
export function canWalk(x,y){
 if(["tree","water","house","roof","wall"].includes(terrainAt(x,y)))return false;
 return !NPCS.some(n=>n.x===x&&n.y===y);
}
export function zoneAt(x){
 return x<14?"Cinder Town":x<32?"Bramble Trail":x<51?"Storm Marsh":"Eclipse Ridge";
}
export function advanceTrainer(serverPosition, direction, serverBadges=[]){
 // A client is only allowed to submit the direction, never the destination.
 // serverPosition and serverBadges are arguments for trusted server records,
 // not request JSON supplied by the browser.
 if(!Object.hasOwn(DIRECTIONS,direction))return {allowed:false,error:"INVALID_DIRECTION"};
 if(!serverPosition||!Number.isSafeInteger(serverPosition.x)||!Number.isSafeInteger(serverPosition.y)||!canWalk(serverPosition.x,serverPosition.y))
  return {allowed:false,error:"INVALID_SAVED_POSITION"};
 const [dx,dy]=DIRECTIONS[direction],x=serverPosition.x+dx,y=serverPosition.y+dy;
 if(x>=32&&!serverBadges.includes("bramble"))return {allowed:false,error:"BRAMBLE_CREST_REQUIRED"};
 if(x>=51&&!serverBadges.includes("storm"))return {allowed:false,error:"STORM_CREST_REQUIRED"};
 if(!canWalk(x,y))return {allowed:false,error:"BLOCKED_TILE"};
 const steps=Number.isSafeInteger(serverPosition.steps)?Math.max(0,serverPosition.steps):0;
 return {allowed:true,position:{x,y,steps:Math.min(10000000,steps+1)},zone:zoneAt(x)};
}
