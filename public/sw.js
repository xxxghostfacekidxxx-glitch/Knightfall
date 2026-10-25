const CACHE_NAME = "knightfall-shell-v5";
const APP_SHELL = [
  "/index.html",
  "/theme.css",
  "/nav.js",
  "/icons/knightfall.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => /^(?:knightfall|ashfall)-shell-/.test(key) && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

// Web Push works when the site is backgrounded or closed, where the browser supports it.
self.addEventListener("push", event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { payload = { title: "Ash-Fall alert", body: "You have a new notification." }; }
  const title = String(payload.title || "Ash-Fall alert").slice(0, 120);
  const body = String(payload.body || "You have a new notification.").slice(0, 240);
  const path = typeof payload.url === "string" && payload.url.startsWith("/") && !payload.url.startsWith("//") ? payload.url : "/notifications.html";
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: "/icons/knightfall.svg",
    badge: "/icons/knightfall.svg",
    tag: payload.tag ? String(payload.tag).slice(0, 100) : "ash-fall-alert",
    renotify: false,
    data: { url: path }
  }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const path = event.notification.data && typeof event.notification.data.url === "string" && event.notification.data.url.startsWith("/") && !event.notification.data.url.startsWith("//") ? event.notification.data.url : "/notifications.html";
  const target = new URL(path, self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
    const existing = clients.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) return existing.navigate(target).then(() => existing.focus());
    return self.clients.openWindow(target);
  }));
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/account") || url.pathname.startsWith("/messages") || url.pathname.startsWith("/friends") || url.pathname.startsWith("/notifications") || url.pathname.startsWith("/admin") || url.pathname.startsWith("/personal-bots") || url.pathname.startsWith("/vault")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => {
      const cached = await caches.match("/index.html");
      return cached || new Response("You are offline. Reconnect to load Knightfall.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }));
    return;
  }
  if (APP_SHELL.includes(url.pathname)) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(async response => {
      if (response.ok) { const cache = await caches.open(CACHE_NAME); cache.put(request, response.clone()); }
      return response;
    })));
  }
});
