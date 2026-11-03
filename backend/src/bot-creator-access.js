// Account-scoped bot privileges are independent of moderation/admin roles.
export function botAccessPolicy(user, extraSlots = 0, grant = null) {
  const role = String(user?.role || "member").toLowerCase();
  const base = role === "god" || role === "admin" ? 10 : role === "moderator" ? 5 : 2;
  const purchased = Math.max(0, Math.floor(Number(extraSlots) || 0));
  const unlimited = Number(grant?.unlimited_slots) === 1;
  return {
    limit: unlimited ? null : base + purchased,
    unlimited,
    advanced_builder: ["admin", "god"].includes(role) || Number(grant?.advanced_builder) === 1,
    title: grant?.title || (role === "god" ? "God" : role === "admin" ? "Administrator" : role === "moderator" ? "Moderator" : "Member")
  };
}
