// Server-owned theme entitlements. Browser preferences and client-supplied SKUs
// never grant paid content. Checkout fulfillment is intentionally not implemented.
export const THEME_IDS=Object.freeze(["obsidian","hellfire","egypt","mustafar","korriban","vader"]);
export const THEME_COMPONENTS=Object.freeze(["profile","chaosphere","miss_chaos","site"]);
export function themeSku(theme,component){return THEME_IDS.includes(theme)&&THEME_COMPONENTS.includes(component)?`theme.${theme}.${component}`:null}
export function themeBundleSku(theme){return THEME_IDS.includes(theme)?`theme.${theme}.complete`:null}
export async function themeAccess(db,userId,theme,component){
  const sku=themeSku(theme,component);
  if(!sku||!Number.isSafeInteger(Number(userId)))return false;
  // Existing art is currently a free preview. This must change to explicit
  // per-SKU entitlements before any collection is advertised as paid.
  const owned=await db.prepare("SELECT 1 FROM member_theme_entitlements WHERE user_id=? AND sku IN (?,?) AND revoked_at IS NULL LIMIT 1")
    .bind(Number(userId),sku,themeBundleSku(theme)).first();
  return !!owned;
}
export async function listThemeEntitlements(db,userId){
  const rows=await db.prepare("SELECT sku FROM member_theme_entitlements WHERE user_id=? AND revoked_at IS NULL ORDER BY sku")
    .bind(Number(userId)).all();
  return (rows.results||[]).map(row=>row.sku);
}
