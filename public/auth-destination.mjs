const fallback = "/account.html";

export function authDestination(value, origin = "https://ash-fall.com") {
  if (typeof value !== "string" || !value.trim()) return fallback;
  let target;
  try {
    target = new URL(value, origin);
  } catch {
    return fallback;
  }

  if (target.origin !== origin || target.username || target.password) return fallback;
  if (/^\/\/|%2f|%5c/i.test(target.pathname)) return fallback;

  const route = target.pathname.replace(/\/$/, "").replace(/\.html$/, "");
  if (route === "/auth") return fallback;
  if (!route || route === "/index" || route === "/homepage") {
    target.pathname = "/";
    for (const key of ["next", "mode", "oauth_error"]) target.searchParams.delete(key);
  }
  return target.pathname + target.search + target.hash;
}
