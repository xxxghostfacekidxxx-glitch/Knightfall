// Trusted server-side account and entitlement based personal bot policy.
const STAFF_ROLES=new Set(["god","admin","moderator"]);
export function botAccessPolicy(user,extraSlots=0,grant=null,premium=false) {
  const role=String(user?.role||"member").toLowerCase();
  const title=String(grant?.title||user?.public_title||"").trim();
  const staff=STAFF_ROLES.has(role)||title.toLowerCase()==="digital creator";
  const unlimited=staff||Number(grant?.unlimited_slots)===1;
  const purchased=Math.max(0,Math.min(100,Math.floor(Number(extraSlots)||0)));
  const tier=staff?"staff":premium?"premium":"member";
  const base=premium?10:5;
  return {
    limit:unlimited?null:base+purchased,
    unlimited,
    tier,
    advanced_builder:staff||Number(grant?.advanced_builder)===1,
    title:title||(role==="god"?"God":role==="admin"?"Administrator":role==="moderator"?"Moderator":premium?"Premium Member":"Member")
  };
}
