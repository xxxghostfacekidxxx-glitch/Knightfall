// Knightfall staff is a hierarchy of authority with two independent Level-1 specialties.
// Digital Creator is an authenticated, trusted account title, not a moderator role.
export function staffCapabilities(user) {
  const role=String(user?.role||"member").trim().toLowerCase();
  const title=String(user?.public_title||"").trim().toLowerCase();
  const god=role==="god", admin=god||role==="admin";
  const moderator=role==="moderator";
  const digitalCreator=role==="member" && title==="digital creator";
  const canModerate=admin||moderator;
  const canCreate=admin||digitalCreator;
  const level=god?3:admin?2:moderator||digitalCreator?1:0;
  const track=god?"god":admin?"admin":moderator?"moderation":digitalCreator?"creation":"member";
  return {
    level, track, staff:level>0, can_moderate:canModerate,
    can_create:canCreate, can_admin:admin, can_eye_of_horus:god,
    unlimited_bots:level>0,
    advanced_bot_builder:canCreate
  };
}
export function canAccessCreatorFoundry(user){return staffCapabilities(user).can_create}
export function canAccessModeration(user){return staffCapabilities(user).can_moderate}
export function canAccessEyeOfHorus(user){return staffCapabilities(user).can_eye_of_horus}
