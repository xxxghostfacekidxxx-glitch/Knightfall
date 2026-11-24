// Call only with a server-resolved service identity and trusted registry.
export function forumBotProvenance(identity, registry, articleUrl) {
 if (!identity || identity.serviceAccount !== true || !identity.username) throw new Error("Verified service identity required");
 const bot = registry?.bots?.find(entry => entry.username === identity.username);
 if (!bot || bot.automated !== true || bot.enabled !== true) throw new Error("Bot publishing disabled");
 const source = new URL(bot.source_url);
 const article = new URL(articleUrl);
 if (source.protocol !== "https:" || article.protocol !== "https:" ||
     source.username || source.password || article.username || article.password ||
     article.origin !== source.origin || article.pathname === "/" ||
     article.pathname === source.pathname) throw new Error("Publisher article URL required");
 article.hash = "";
 for (const key of [...article.searchParams.keys()]) {
  if (/^(utm_|fbclid$|gclid$)/i.test(key)) article.searchParams.delete(key);
 }
 article.searchParams.sort();
 return Object.freeze({ automated: true, disclosure: "AI Bot", username: bot.username,
  source_name: bot.source_name, source_url: article.href, category_slug: bot.category_slug });
}
