export const BOT_SLOT_PRODUCTS={bot_slot_1:{slots:1,price_cents:199},bot_slot_5:{slots:5,price_cents:799}};
export function effectiveBotLimit(role,extra){const base=role==="god"||role==="admin"?10:role==="moderator"?5:2;return base+Math.max(0,Math.min(100,Number(extra)||0));}
