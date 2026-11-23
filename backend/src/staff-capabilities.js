// Internal roles stay stable for authentication. Osiris and Isis are VERIFIED
// Knightfall ceremonial ranks layered on top of the existing permission system.
// Only the live, accepted partnership record may mark an admin as Isis.
export function staffCapabilities(user) {
  const role=String(user?.role||"member").trim().toLowerCase();
  const title=String(user?.public_title||"").trim().toLowerCase();
  const god=role==="god",admin=god||role==="admin";
  const isis=role==="admin"&&Number(user?.is_isis)===1;
  const moderator=role==="moderator";
  const digitalCreator=role==="member" && title==="digital creator";
  const canModerate=admin||moderator;
  const canCreate=admin||moderator||digitalCreator;
  const level=god?4:isis?3:admin?2:moderator||digitalCreator?1:0;
  const track=god?"osiris":isis?"isis":admin?"admin":moderator?"moderation":digitalCreator?"creation":"member";
  const rank_name=god?"Osiris":isis?"Isis":admin?"Administrator":moderator?"Moderator":digitalCreator?"Digital Creator":"Member";
  return {
    level, track, rank_name, rank_code:track, staff:level>0,
    can_moderate:canModerate, can_create:canCreate, can_admin:admin,
    can_eye_of_chaos:admin, can_eye_of_horus:god,
    can_delegate_approval:god||isis,
    // Private external correspondence is never inherited by admin or Isis.
    can_owner_mailbox:god,
    unlimited_bots:level>0,advanced_bot_builder:canCreate
  };
}
export function canAccessCreatorFoundry(user){return staffCapabilities(user).can_create}
export function canAccessModeration(user){return staffCapabilities(user).can_moderate}
export function canAccessEyeOfChaos(user){return staffCapabilities(user).can_eye_of_chaos}
export function canAccessEyeOfHorus(user){return staffCapabilities(user).can_eye_of_horus}

// Check this server-side before any future private mailbox route or attachment proxy.
// Client-side visibility and Miss Chaos prompt instructions are not authorization.
export function canAccessOwnerMailbox(user){
 return Boolean(user && user.status==='active' && staffCapabilities(user).can_owner_mailbox);
}
