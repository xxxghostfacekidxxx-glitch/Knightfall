import { botAccessPolicy } from "./bot-creator-access.js";
export const BOT_SLOT_PRODUCTS={bot_slot_1:{slots:1,price_cents:199},bot_slot_5:{slots:5,price_cents:799}};
export function effectiveBotLimit(role,extra,{premium=false,title=""}={}) {
  return botAccessPolicy({role,public_title:title},extra,null,premium).limit;
}
