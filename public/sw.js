const CACHE_NAME = "knightfall-shell-v30";
const APP_SHELL = [
  "/index.html",
  "/offline.html",
  "/personal-bots-offline.html",
  "/personal-bots-offline.js",
  "/homepage.html",
  "/theme.css",
  "/design-system.css",
  "/section-overhaul.css",
  "/section-directory.css",
  "/visual-refresh.css",
  "/knightfall-unified-theme.css",
  "/neon-global.css",
  "/gravewave-consistency.css",
  "/nav.js",
  "/moonology.html",
  "/moonology.css",
  "/moonology.mjs",
  "/date-journal.mjs",
  "/shadow-work.html",
  "/shadow-work.css",
  "/shadow-work.mjs",
  "/shadow-prompts.mjs",
  "/moon-strip.css",
  "/moon-widget.mjs",
  "/lunar-phases.mjs",
  "/vendor/astronomy-engine-2.1.19.min.js",
  "/gravewave-takeover.css",
  "/gravewave-takeover.js",
  "/assets/devil-tools/neon-nuisances/moxie.svg",
  "/assets/devil-tools/neon-nuisances/gravebyte.svg",
  "/icons/chaos-cartridge.svg",
  "/icons/chaos-cartridge-maskable.svg",
  "/branding/chaos-cartridge-logo.svg"
];

self.addEventListener("install", event => {
  // A single optional asset failing over a mobile connection must not prevent
  // the push service worker from installing. cache.addAll rejected the entire
  // install when any one of these resources failed to download.
  event.waitUntil(caches.open(CACHE_NAME).then(async cache => {
    const results=await Promise.allSettled(APP_SHELL.map(resource=>cache.add(resource)));
    const failures=results.filter(result=>result.status==="rejected").length;
    if(failures)console.warn("offline_shell_partial_cache",failures);
  }));
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
  const tag = payload.tag ? String(payload.tag).slice(0, 100) : "ash-fall-alert";
  event.waitUntil((async () => {
    const testId=typeof payload.receipt_token==="string"&&/^[0-9a-f]{40}$/.test(payload.receipt_token)?payload.receipt_token:null;
    let stage="display-requested";
    try {
      // Android can reject notification artwork that desktop accepts. Keep the
      // payload icon-free until raster icons are available.
      await self.registration.showNotification(title, {
        body,
        tag,
        renotify:false,
        data:{url:path}
      });
    }catch(error){
      stage="display-failed";
      console.warn("push_show_notification_failed",String(error));
    }
    if(testId){
      // Background acknowledgements work even when no app window is open. The
      // capability token is delivered only in the encrypted push payload.
      for(const step of ["received",stage]){
        try{
          await fetch("https://api.ash-fall.com/api/push/receipt",{
            method:"POST",headers:{"content-type":"application/json"},
            credentials:"omit",body:JSON.stringify({test_id:testId,stage:step})
          });
        }catch(error){console.warn("push_receipt_unavailable",String(error));}
      }
    }
    const windows=await self.clients.matchAll({type:"window",includeUncontrolled:true});
    for(const client of windows)client.postMessage({type:"KF_PUSH_RECEIVED",tag,stage});
  })());
});
// Android/Chromium can rotate subscriptions while the app is not open.
// A browser-provided replacement is safe to register; a null replacement may
// represent a deliberate opt-out, so never silently subscribe again.
self.addEventListener("pushsubscriptionchange", event => {
  const sub=event.newSubscription;
  if(!sub)return;
  event.waitUntil((async()=>{
    try{
      const data=sub.toJSON();
      if(!data?.endpoint||!data?.keys?.p256dh||!data?.keys?.auth)return;
      const response=await fetch("https://api.ash-fall.com/api/push/subscriptions",{
        method:"POST",credentials:"include",cache:"no-store",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({subscription:data})
      });
      if(!response.ok)console.warn("push_subscription_rotation_not_registered",response.status);
    }catch(error){console.warn("push_subscription_rotation_unavailable",String(error))}
  })());
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
  const offlineBotAsset = url.pathname === "/personal-bots-offline.html" || url.pathname === "/personal-bots-offline.js";
  if (!offlineBotAsset && (url.pathname.startsWith("/profile") || url.pathname.startsWith("/miss-chaos") || url.pathname.startsWith("/adult") || url.pathname.startsWith("/dating") || url.pathname.startsWith("/account") || url.pathname.startsWith("/messages") || url.pathname.startsWith("/friends") || url.pathname.startsWith("/notifications") || url.pathname.startsWith("/admin") || url.pathname.startsWith("/personal-bots") || url.pathname.startsWith("/vault"))) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => {
      if (url.pathname === "/personal-bots-offline.html") {
        const localPage = await caches.match("/personal-bots-offline.html");
        if (localPage) return localPage;
      }
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
