// Hell & High Orbit original move progression, used by the offline battle client.
// Move IDs are stable save identifiers. Never trust client move values in multiplayer.
export const MOVES={
 swipe:{name:"Claw Swipe",type:"normal",power:40,accuracy:100,pp:30},
 jab:{name:"Cheap Shot",type:"normal",power:50,accuracy:95,pp:25},
 rush:{name:"Panic Rush",type:"normal",power:60,accuracy:90,pp:20},
 brace:{name:"Defiant Headbutt",type:"normal",power:70,accuracy:85,pp:15},
 ember:{name:"Cinder Burst",type:"fire",power:60,accuracy:95,pp:20},
 inferno:{name:"Hellfire Screech",type:"fire",power:85,accuracy:85,pp:10},
 tantrum:{name:"Apocalypse Tantrum",type:"fire",power:110,accuracy:75,pp:5},
 sprout:{name:"Grave Bloom",type:"grass",power:65,accuracy:95,pp:15},
 overgrow:{name:"Cemetery Rampage",type:"grass",power:95,accuracy:80,pp:10},
 tide:{name:"Abyss Jet",type:"water",power:65,accuracy:95,pp:15},
 undertow:{name:"Crypt Undertow",type:"water",power:95,accuracy:80,pp:10},
 shock:{name:"Voltage Bite",type:"electric",power:65,accuracy:95,pp:15},
 blackout:{name:"Blackout Surge",type:"electric",power:95,accuracy:80,pp:10},
 orbit:{name:"Orbital Glitch",type:"cosmic",power:65,accuracy:95,pp:15},
 supernova:{name:"Supernova Invoice",type:"cosmic",power:95,accuracy:80,pp:10},
 haunt:{name:"Nightmare Ping",type:"ghost",power:65,accuracy:95,pp:15},
 doom:{name:"Pocket-Sized Doom",type:"ghost",power:100,accuracy:80,pp:8},
 gust:{name:"Void Gust",type:"air",power:65,accuracy:95,pp:15},
 cyclone:{name:"Apocalypse Screech",type:"air",power:95,accuracy:80,pp:10},
 briar:{name:"Briar Hex",type:"thorn",power:65,accuracy:95,pp:15},
 thorns:{name:"Thorn Execution",type:"thorn",power:95,accuracy:80,pp:10},
 slam:{name:"Gravestone Slam",type:"stone",power:65,accuracy:95,pp:15},
 quake:{name:"Gravequake",type:"stone",power:95,accuracy:80,pp:10},
 mouse:{name:"Royal Short Circuit",type:"electric",power:110,accuracy:80,pp:6},
 villain:{name:"Villainous Monologue",type:"ghost",power:105,accuracy:85,pp:6},
 eddieClaw:{name:"Graveyard Claw",type:"normal",power:65,accuracy:100,pp:20},
 eddieFrenzy:{name:"Serrated Frenzy",type:"fire",power:90,accuracy:90,pp:10}
};
const elementMoves={fire:["ember","inferno","tantrum"],grass:["sprout","overgrow"],water:["tide","undertow"],electric:["shock","blackout"],cosmic:["orbit","supernova"],ghost:["haunt","doom"],air:["gust","cyclone"],thorn:["briar","thorns"],stone:["slam","quake"]};
const special={minionmouse:[[20,"mouse"]],minivillain:[[20,"villain"]],minieddie:[[1,"eddieClaw"],[15,"eddieFrenzy"],[25,"inferno"],[40,"tantrum"]]};
export function learnset(creature){
 const type=creature.type,elem=elementMoves[type]||[];
 const entries=[[1,"swipe"],[1,"jab"],[1,"rush"],[1,"brace"],[5,elem[0]],[10,elem[0]],[15,elem[1]],[30,elem[2]||elem[1]],...(special[creature.id]||[])];
 return [...new Set(entries.filter(([lv,id])=>creature.level>=lv&&MOVES[id]).map(([,id])=>id))];
}
export function ensureLoadout(creature){
 const available=learnset(creature);
 const owned=[...new Set([...(Array.isArray(creature.unlockedMoveIds)?creature.unlockedMoveIds:[]),...available])].filter(id=>MOVES[id]);
 creature.unlockedMoveIds=owned;
 const equipped=[...new Set(Array.isArray(creature.equippedMoveIds)?creature.equippedMoveIds:[])].filter(id=>owned.includes(id)).slice(0,4);
 for(const id of owned)if(equipped.length<4&&!equipped.includes(id))equipped.push(id);
 creature.equippedMoveIds=equipped;
 const previous=creature.movePp&&typeof creature.movePp==="object"?creature.movePp:{};
 creature.movePp=Object.fromEntries(owned.map(id=>[id,Number.isInteger(previous[id])?Math.max(0,Math.min(MOVES[id].pp,previous[id])):MOVES[id].pp]));
 return creature;
}
export function equipMove(creature,slot,id){
 ensureLoadout(creature);
 if(!Number.isInteger(slot)||slot<0||slot>3||!creature.unlockedMoveIds.includes(id))return false;
 if(creature.equippedMoveIds.includes(id)&&creature.equippedMoveIds[slot]!==id)return false;
 creature.equippedMoveIds[slot]=id;return true;
}
export function useMove(attacker,defender,id,typeMultiplier=()=>1,rng=Math.random){
 ensureLoadout(attacker);
 if(!attacker.equippedMoveIds.includes(id)||!MOVES[id])return {error:"Move is not equipped"};
 const move=MOVES[id];
 if(attacker.movePp[id]<=0)return {error:"No PP remaining"};
 attacker.movePp[id]--;
 if(rng()*100>=move.accuracy)return {miss:true,damage:0,move};
 const modifier=move.type==="normal"?1:typeMultiplier(move.type,defender.type);
 const damage=Math.max(1,Math.round((attacker.attack+2)*move.power/55*modifier));
 defender.hp=Math.max(0,defender.hp-damage);
 return {damage,move,multiplier:modifier};
}
