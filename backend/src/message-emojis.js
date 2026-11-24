import {KNIGHTFALL_EMOJIS} from "../../public/knightfall-emojis.mjs";

export const MESSAGE_REACTION_EMOJIS=Object.freeze([
  "👍","❤️","😂","😮","😢","😡","🔥","🎉",
  ...KNIGHTFALL_EMOJIS.map(item=>item.code)
]);
const allowed=new Set(MESSAGE_REACTION_EMOJIS);

export function isAllowedMessageReaction(value){
  return typeof value==="string"&&allowed.has(value);
}
