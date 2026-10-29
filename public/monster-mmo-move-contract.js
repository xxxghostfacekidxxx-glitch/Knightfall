/* Hell & High Orbit: optional move data contract.
   No multiplayer actions are executed from this module. */
export const MOVE_RULES=Object.freeze({
 maxEquipped:4,
 minLevel:1,
 maxLevel:100,
 validTypes:Object.freeze(["fire","grass","water","electric","cosmic","ghost","air","thorn","stone","normal"])
});
export function normalizeMoveSlots(known,selected){
 const available=[...new Set((Array.isArray(known)?known:[]).filter(id=>typeof id==="string"&&/^[a-zA-Z][a-zA-Z0-9]{0,31}$/.test(id)))];
 const equipped=[...new Set((Array.isArray(selected)?selected:[]).filter(id=>available.includes(id)))].slice(0,MOVE_RULES.maxEquipped);
 for(const id of available)if(equipped.length<MOVE_RULES.maxEquipped&&!equipped.includes(id))equipped.push(id);
 return equipped;
}
export function validateMoveSelection(known,selected,slot,id){
 if(!Number.isInteger(slot)||slot<0||slot>=MOVE_RULES.maxEquipped)return false;
 if(typeof id!=="string"||!Array.isArray(known)||!known.includes(id))return false;
 const current=normalizeMoveSlots(known,selected);
 return !current.includes(id)||current[slot]===id;
}
