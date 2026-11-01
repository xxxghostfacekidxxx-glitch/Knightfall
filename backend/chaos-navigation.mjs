import {searchPublicPages} from "./chaos-public-tools.mjs";
/** Deterministic read-only navigation intent. Never executes user-provided tool names. */
export function navigationContext(message) {
  if (typeof message !== "string" || !/\b(where|find|link|page|navigate|offline|personal bots?|arcade|games?|messages|features|website)\b/i.test(message)) return "";
  const results = searchPublicPages({query:message.slice(0,160)});
  if (!results.length) return "";
  return "\n\nKNOWN KNIGHTFALL PAGES (curated navigation, not web research):\n" +
    results.map(page => page.title + ": https://ash-fall.com" + page.url).join("\n") +
    "\nOnly recommend relevant pages. These links are not proof that a feature is currently working.";
}
