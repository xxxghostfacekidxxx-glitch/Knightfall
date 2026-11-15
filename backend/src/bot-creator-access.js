import { staffCapabilities } from "./staff-capabilities.js";
// Trusted server-side account and entitlement based bot policy.
// Level-1 moderators have unlimited ownership but *not* creator tools.
export function botAccessPolicy(user,extraSlots=0,grant=null,premium=false) {
  const permissions=staffCapabilities(user);
  const role=String(user?.role||"member").toLowerCase();
  const title=String(grant?.title||user?.public_title||"").trim();
  const unlimited=permissions.unlimited_bots || (role==="member"&&Number(grant?.unlimited_slots)===1);
  const purchased=Math.max(0,Math.min(100,Math.floor(Number(extraSlots)||0)));
  const tier=permissions.staff?"staff":premium?"premium":"member";
  const base=premium?10:5;
  return {
    limit:unlimited?null:base+purchased,
    unlimited,
    tier,
    advanced_builder:permissions.advanced_bot_builder || (role==="member"&&Number(grant?.advanced_builder)===1),
    title:title||(role==="god"?"God":role==="admin"?"Administrator":role==="moderator"?"Moderator":premium?"Premium Member":"Member")
  };
}
