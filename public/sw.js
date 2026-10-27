const CACHE_NAME = "knightfall-shell-v12";
const APP_SHELL = [
  "/index.html",
  "/offline.html",
  "/homepage.html",
  "/theme.css",
  "/nav.js",
  "/icons/chaos-cartridge.svg",
  "/icons/chaos-cartridge-maskable.svg",
  "/branding/chaos-cartridge-logo.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});
self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => /^(?:knightfall|ashfall)-shell-/.test(key) && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

// Web Push works when the site is backgrounded or closed, where the browser supports it.
function safeNotificationPath(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /%5c|%2f/i.test(value) || /[\\\\\x00-\x1f]/.test(value)) return "/notifications.html";
  try {
    const parsed = new URL(value, self.location.origin);
    if (parsed.origin !== self.location.origin) return "/notifications.html";
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return "/notifications.html";
  }
}

self.addEventListener("push", event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { payload = { title: "Ash-Fall alert", body: "You have a new notification." }; }
  const title = String(payload.title || "Ash-Fall alert").slice(0, 120);
  const body = String(payload.body || "You have a new notification.").slice(0, 240);
  const path = safeNotificationPath(payload.url);
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: "/icons/chaos-cartridge.svg",
    badge: "/icons/chaos-cartridge.svg",
    tag: payload.tag ? String(payload.tag).slice(0, 100) : "ash-fall-alert",
    renotify: false,
    data: { url: path }
  }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const path = safeNotificationPath(event.notification.data?.url);
  const target = new URL(path, self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
    // Never hijack a different chat, game, or unfinished form just because it shares our origin.
    const existing = clients.find(client => client.url === target);
    if (existing) return existing.focus();
    return self.clients.openWindow(target);
  }));
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/profile") || url.pathname.startsWith("/miss-chaos") || url.pathname.startsWith("/adult") || url.pathname.startsWith("/dating") || url.pathname.startsWith("/account") || url.pathname.startsWith("/messages") || url.pathname.startsWith("/friends") || url.pathname.startsWith("/notifications") || url.pathname.startsWith("/admin") || url.pathname.startsWith("/personal-bots") || url.pathname.startsWith("/vault")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => {
      const cached = await caches.match("/offline.html");
      return cached || new Response("You are offline. Reconnect to load Ash-Fall.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }));
    return;
  }
  if (APP_SHELL.includes(url.pathname) && !request.headers.has("Authorization")) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        // Prefer fresh shared assets after deployments, but retain offline fallback.
        const response = await fetch(request);
        if (response.ok && response.type === "basic") {
          await cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      } catch (error) {
        const cached = await cache.match(request, { ignoreSearch: true });
        if (cached) return cached;
        throw error;
      }
    })());
  }
});
