(() => {
  // Offline/local previews must not fetch a real member session, production
  // site settings, or notification counts. Live Ash-Fall retains all API behavior.
  const cloudAccountAvailable = ["ash-fall.com", "www.ash-fall.com"].includes(String(location.hostname || "").toLowerCase());
  // Late-mounted shared polish wins over legacy page skins without changing navigation logic.
  if (!document.querySelector('link[data-visual-refresh]')) {
    const polish=document.createElement('link');
    polish.rel='stylesheet';polish.href='/visual-refresh.css?v=20261029-v2';
    polish.dataset.visualRefresh='true';document.head.append(polish);
  }
  // Page-specific visual refresh is late-mounted so legacy inline styles cannot override it.
  if (!document.querySelector('link[data-section-overhaul]')) {
    const sections=document.createElement('link');sections.rel='stylesheet';
    sections.href='/section-overhaul.css?v=20261029-sections1';
    sections.dataset.sectionOverhaul='true';document.head.append(sections);
  }
  // Shared Gravewave theme and original artwork, loaded once on all nav-enabled pages.
  if (!document.querySelector('link[data-gravewave-theme]')) {
    const theme=document.createElement('link');theme.rel='stylesheet';theme.href='/neon-global.css?v=20261026-neonfix2';theme.dataset.gravewaveTheme='true';document.head.append(theme);
  }
  if (!document.querySelector('script[data-gravewave-decor]')) {
    const decor=document.createElement('script');decor.src='/gravewave-decor.js?v=20261026-neonfix2';decor.defer=true;decor.dataset.gravewaveDecor='true';document.head.append(decor);
  }
  // Loaded after legacy page styles, including on cached installed-app pages.
  if (!document.querySelector('link[data-gravewave-consistency]')) {
    const consistency=document.createElement('link');
    consistency.rel='stylesheet';
    consistency.href='/gravewave-consistency.css?v=20261027-profile-neon1';
    consistency.dataset.gravewaveConsistency='true';
    document.head.append(consistency);
  }
  // Full-site Gravewave signal interference and original mascot decorations.
  if (!document.querySelector('link[data-gravewave-takeover]')) {
    const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='/gravewave-takeover.css?v=20261102-mascot6';sheet.dataset.gravewaveTakeover='true';document.head.append(sheet);
  }
  if (!document.querySelector('script[data-gravewave-takeover],script[src*="/gravewave-takeover.js"]')) {
    const art=document.createElement('script');art.src='/gravewave-takeover.js?v=20261102-mascot6';art.defer=true;art.dataset.gravewaveTakeover='true';document.head.append(art);
  }
  // Final site-wide visual system. Insert after the legacy styles so every
  // shared-navigation page gets the same pink/lime/yellow chrome.
  if (!document.querySelector('link[data-knightfall-unified-theme]')) {
    const unified=document.createElement("link");
    unified.rel="stylesheet";
    unified.href="/knightfall-unified-theme.css?v=20261111-yellow1";
    unified.dataset.knightfallUnifiedTheme="true";
    document.head.append(unified);
  }
  // Chaos Cartridge CRT / signal-corruption skin, only on arcade routes.
  if (location.pathname.startsWith("/arcade") || location.pathname.startsWith("/chaos-cartridge")) {
    if (document.body) document.body.classList.add("chaos-glitch-arcade");
    else document.addEventListener("DOMContentLoaded", () => document.body.classList.add("chaos-glitch-arcade"), {once:true});
    if (!document.querySelector('link[data-chaos-glitch]')) {
      const glitch = document.createElement("link");
      glitch.rel = "stylesheet";
      glitch.href = "/chaos-glitch.css?v=20261026-glitch2";
      glitch.dataset.chaosGlitch = "true";
      document.head.append(glitch);
    }
  }
  // Shared donation footer. Payment destination is configured on the support page.
  const mountSupportFooter = () => {
    // The canonical home page already has its own footer with support and legal links.
    // Avoid stacking two separate footers and repeating the same navigation.
    if (document.getElementById("ashfall-support-footer") || document.querySelector(".site-footer")) return;
    const footer = document.createElement("footer");
    footer.id = "ashfall-support-footer";
    footer.setAttribute("aria-label", "Support Ash-Fall");
    footer.innerHTML = '<a href="/support.html">Support Ash-Fall</a> <a href="/user-agreement.html">Terms &amp; Policies</a>';
    const css = document.createElement("style");
    css.textContent = '#ashfall-support-footer{box-sizing:border-box;width:100%;margin-top:3rem;padding:1.3rem 1rem;text-align:center;background:#110f12;border-top:1px solid #ff55d8;color:#cfc4bb;font:500 14px/1.7 system-ui,sans-serif}#ashfall-support-footer a{display:inline-block;margin-left:.6rem;color:#c6ff45;font-weight:800;text-decoration:underline;text-underline-offset:3px}#ashfall-support-footer a:focus-visible{outline:2px solid #c6ff45;outline-offset:4px}@media(max-width:520px){#ashfall-support-footer a{display:block;margin:.4rem auto 0}}';
    document.head.append(css);
    document.body.append(footer);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",mountSupportFooter,{once:true});
  else mountSupportFooter();
  // Original Devil Tools SVG atlas: small, decorative stamps across shared pages.
  // Use the existing first-party asset; never insert SVG markup from user content.
  const mountDevilToolsStamps = () => {
    const atlas = "/assets/arcade/chaos-sprite-atlas.svg";
    const stamp = (name, index) => {
      const node = document.createElement("span");
      node.className = "kf-devil-stamp kf-devil-stamp-" + name;
      node.style.setProperty("--kf-sprite-x", (index % 12) * 100 / 11 + "%");
      node.style.setProperty("--kf-sprite-y", index < 12 ? "0%" : "100%");
      node.style.backgroundImage = 'url("' + atlas + '")';
      node.setAttribute("aria-hidden", "true");
      return node;
    };
    const footer = document.getElementById("ashfall-support-footer");
    if (footer && !footer.querySelector(".kf-devil-footer-stamps")) {
      const collection = document.createElement("span");
      collection.className = "kf-devil-footer-stamps";
      collection.setAttribute("aria-hidden", "true");
      collection.append(stamp("flame", 20), stamp("skull", 1), stamp("crown", 11));
      footer.prepend(collection);
    }
    const main = document.querySelector("main");
    const title = main?.querySelector("h1");
    if (!title || main.querySelector(".kf-devil-title-stamps")) return;
    const path = location.pathname;
    // Keep account, private content, moderation, and editor screens distraction-free.
    if (/\/(?:admin|moderation|account|profile|messages|vault|adult|dating|friends|notifications|devil-tools|die-ary|create-|edit-)/i.test(path)) return;
    const collection = document.createElement("span");
    collection.className = "kf-devil-title-stamps";
    collection.setAttribute("aria-hidden", "true");
    const indexes = /arcade|chaos-cartridge|game/i.test(path) ? [2, 6, 11] :
      /community|madhouse|social/i.test(path) ? [1, 10, 18] :
      /shop|support/i.test(path) ? [4, 20, 16] : [20, 1, 11];
    indexes.forEach((index, i) => collection.append(stamp("title-" + i, index)));
    title.after(collection);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountDevilToolsStamps, { once: true });
  else mountDevilToolsStamps();
  // Shared PWA setup and global Chaos Cartridge favicon.
  const iconLinks = [
    { rel: "icon", href: "/icons/chaos-cartridge.svg?v=20261026-brand1", type: "image/svg+xml" },
    { rel: "shortcut icon", href: "/icons/chaos-cartridge.svg?v=20261026-brand1", type: "image/svg+xml" },
    { rel: "apple-touch-icon", href: "/icons/chaos-cartridge.svg?v=20261026-brand1" }
  ];
  iconLinks.forEach(spec => {
    let link = document.head.querySelector('link[rel="' + spec.rel + '"]');
    if (!link) { link = document.createElement("link"); link.rel = spec.rel; document.head.append(link); }
    link.href = spec.href;
    if (spec.type) link.type = spec.type;
  });
  if (!document.querySelector('link[rel="manifest"]')) {
    const manifest = document.createElement("link");
    manifest.rel = "manifest";
    manifest.href = "/manifest.webmanifest";
    document.head.append(manifest);
  }
  let themeColor = document.querySelector('meta[name="theme-color"]');
  if (!themeColor) { themeColor = document.createElement("meta"); themeColor.name = "theme-color"; document.head.append(themeColor); }
  themeColor.content = "#080808";
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {}), { once: true });
  }

  // An update is announced, never forced in the middle of a chat or game.
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    let updateToast = null;
    const showUpdate = registration => {
      if (!registration.waiting || !navigator.serviceWorker.controller || updateToast) return;
      if (!document.getElementById("kf-app-update-style")) {
        const style = document.createElement("style");
        style.id = "kf-app-update-style";
        style.textContent = '.kf-app-update{position:fixed;z-index:2147483000;bottom:max(1rem,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);width:min(92vw,540px);display:flex;align-items:center;justify-content:center;gap:.7rem;flex-wrap:wrap;padding:.85rem 1rem;border:1px solid #ff55d8;border-radius:14px;background:#140d20f5;color:#f9f3ff;box-shadow:0 8px 36px #000a;font:600 14px/1.45 system-ui,sans-serif}.kf-app-update span{flex:1 1 210px}.kf-app-update button{min-height:40px;padding:.5rem .8rem;border-radius:8px;border:1px solid #ff55d8;background:#ff55d8;color:#15071b;font:700 14px system-ui;cursor:pointer}.kf-app-update button:last-child{background:transparent;color:#f9f3ff}.kf-app-update button:focus-visible{outline:2px solid #a8ff3e;outline-offset:2px}@media(max-width:400px){.kf-app-update{bottom:max(.4rem,env(safe-area-inset-bottom));gap:.45rem}}';
        document.head.append(style);
      }
      updateToast = document.createElement("aside");
      updateToast.className = "kf-app-update";
      updateToast.setAttribute("role", "status");
      const message = document.createElement("span");
      message.textContent = "Ash-Fall update ready. Install it when you're done here.";
      const apply = document.createElement("button");
      apply.type = "button"; apply.textContent = "Update";
      const later = document.createElement("button");
      later.type = "button"; later.textContent = "Later";
      apply.addEventListener("click", () => {
        apply.disabled = true; apply.textContent = "Updating…";
        registration.waiting?.postMessage({type:"SKIP_WAITING"});
      });
      later.addEventListener("click", () => { updateToast.remove(); updateToast = null; });
      updateToast.append(message, apply, later);
      document.body.append(updateToast);
    };
    navigator.serviceWorker.ready.then(registration => {
      if (registration.waiting) showUpdate(registration);
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed") showUpdate(registration);
        });
      });
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") registration.update().catch(() => {});
      });
    }).catch(() => {});
    let updateActivated = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (updateActivated) return;
      updateActivated = true;
      if (updateToast) location.reload();
    });
  }

  // Persistent Miss Chaos companion loads before the shared header guard so pages without a nav still get her.
  if (!document.querySelector('script[data-miss-chaos-presence]')) {
    const companion = document.createElement("script");
    companion.src = "/miss-chaos-presence.js?v=20261113-messaging2";
    companion.dataset.missChaosPresence = "true";
    document.head.append(companion);
  }

  // Defer navigation mounting for PWA pages that load the shared script early.
  const initializeNavigation = () => {
  let header = document.querySelector(".kf-header");
  if (!header) {
    header = document.createElement("header");
    header.className = "kf-header";
    document.body.prepend(header);
  }
  // A stale/partial mount must never leave the site without navigation.
  if (header.dataset.kfNavMounted === "true" && header.querySelector("#kf-primary-nav") && header.querySelector(".kf-nav-toggle")) return;
  header.dataset.kfNavMounted = "true";
  header.setAttribute("aria-label", "Ash-Fall site navigation");
  // Keep the mobile navigation above ambient glitch layers and floating mascots.
  if (!document.getElementById("kf-pwa-navigation-recovery")) {
    const recoveryStyle = document.createElement("style");
    recoveryStyle.id = "kf-pwa-navigation-recovery";
    recoveryStyle.textContent = `html body .kf-header{z-index:1000!important;isolation:isolate}html body .kf-header .kf-nav-toggle{position:relative;z-index:1002;visibility:visible;opacity:1;pointer-events:auto}html body .kf-header .kf-nav{z-index:1001}html body .kf-header .kf-nav.open{visibility:visible!important;opacity:1!important;pointer-events:auto!important}@media(max-width:1080px){html body .kf-header{display:flex!important;align-items:center;justify-content:space-between;min-height:60px}html body .kf-header .kf-nav-toggle{display:inline-flex!important;align-items:center!important;min-height:44px!important}html body .kf-header .kf-nav:not(.open){display:none!important}html body .kf-header .kf-nav.open{display:grid!important;position:absolute!important;top:100%!important;left:.5rem!important;right:.5rem!important;max-height:calc(100dvh - 80px)!important;overflow-y:auto!important;overscroll-behavior:contain!important;background:#100c1c!important;border:1px solid #ff55d8!important;box-shadow:0 12px 36px #000c!important;padding:.7rem!important}html body .kf-header .kf-nav.open a,html body .kf-header .kf-nav.open summary{min-height:44px}html body .kf-header .kf-nav-group[open] .kf-nav-menu{position:static!important;max-height:none!important}}`;
    document.head.append(recoveryStyle);
  }
  // Shared keyboard shortcut to bypass the site-wide navigation.
  const mainContent=document.querySelector("main");
  if(mainContent && !document.querySelector(".kf-skip-link")){
    if(!mainContent.id) mainContent.id="main-content";
    const skip=document.createElement("a");
    skip.className="kf-skip-link";
    skip.href="#"+mainContent.id;
    skip.textContent="Skip to content";
    header.before(skip);
  }
  // Inline emergency chrome so navigation survives delayed or cached theme CSS.
  if (!document.getElementById("kf-nav-emergency-css")) {
    const emergency=document.createElement("style");emergency.id="kf-nav-emergency-css";
    emergency.textContent='html body .kf-header{display:flex!important;align-items:center!important;gap:12px!important;position:sticky!important;top:0!important;z-index:2147482000!important;min-height:62px!important;padding:8px 14px!important;background:#100c1c!important;border-bottom:2px solid #ff55d8!important;visibility:visible!important;opacity:1!important}html body .kf-header .kf-brand{display:inline-flex!important;flex-shrink:0!important;color:white!important;font-weight:900!important}html body .kf-header .kf-nav-toggle{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:76px!important;min-height:44px!important;background:#22132d!important;color:#c6ff45!important;border:1px solid #ff55d8!important;border-radius:10px!important}html body .kf-header .kf-nav.open{visibility:visible!important;opacity:1!important;pointer-events:auto!important;display:grid!important;position:absolute!important;top:100%!important;left:8px!important;right:8px!important;z-index:2147482001!important;max-height:calc(100dvh - 75px)!important;overflow:auto!important;padding:12px!important;background:#100c1c!important;border:1px solid #ff55d8!important;border-radius:12px!important}html body .kf-header .kf-nav.open a,html body .kf-header .kf-nav.open summary{visibility:visible!important;opacity:1!important;color:#f9f3ff!important}@media(min-width:1081px){html body .kf-header .kf-nav{display:flex!important;visibility:visible!important;opacity:1!important;position:static!important;flex-wrap:wrap!important}html body .kf-header .kf-nav-toggle{display:none!important}}@media(max-width:1080px){html body .kf-header .kf-nav:not(.open){display:none!important}}';
    document.head.append(emergency);
  }
  // Legacy category pages sometimes wrap the header in transformed or clipped
  // containers. Move the shared chrome directly under body before mounting.
  if (header.parentElement !== document.body) document.body.prepend(header);
  // One consistent layer, above mascots and the persistent chat widget.
  if (!document.getElementById("kf-nav-stability-css")) {
    const stable=document.createElement("style");
    stable.id="kf-nav-stability-css";
    stable.textContent=`html body>.kf-header{position:sticky!important;top:0!important;z-index:2147483001!important;overflow:visible!important;transform:none!important;filter:none!important;isolation:isolate!important;width:100%!important;box-sizing:border-box!important}html body>.kf-header .kf-nav-toggle{cursor:pointer!important;pointer-events:auto!important}html body>.kf-header .kf-nav.open{z-index:2147483002!important;pointer-events:auto!important}html body>.kf-header .kf-nav-menu{z-index:2147483003!important}html body>.kf-header .kf-nav-group[open]>.kf-nav-menu{display:grid!important}html body>.kf-header .kf-nav a{pointer-events:auto!important}html body>.kf-header .kf-nav [hidden]{display:none!important}@media(max-width:1080px){html body>.kf-header .kf-nav.open{max-height:calc(100dvh - 80px)!important;overflow-y:auto!important;overscroll-behavior:contain!important}html body>.kf-header .kf-nav-group[open]>.kf-nav-menu{position:static!important;overflow:visible!important;max-height:none!important}}@media(min-width:1081px){html body>.kf-header .kf-nav{display:flex!important;flex-wrap:wrap!important;align-items:center!important}html body>.kf-header .kf-nav-group[open]>.kf-nav-menu{position:absolute!important}}`;
    document.head.append(stable);
  }
  header.innerHTML = `
    <a class="kf-brand" href="/" aria-label="Ash-Fall home"><span>ASH</span><b>-FALL</b></a>
    <button class="kf-nav-toggle" type="button" aria-expanded="false" aria-controls="kf-primary-nav" aria-label="Open navigation">☰ <span>Menu</span></button>
    <nav id="kf-primary-nav" class="kf-nav" aria-label="Primary navigation">
      <details class="kf-nav-group">
        <summary>Community <span aria-hidden="true">⌄</span></summary>
        <div class="kf-nav-menu">
          <a href="/community.html">Forums</a>
          <a href="/members.html">Member Directory</a>
          <a href="/social.html">Groups &amp; Activity</a>
        </div>
      </details>
      <a class="kf-nav-primary" href="/chaos-cartridge.html">Arcade</a>
      <a class="kf-nav-primary kf-messages-shortcut" href="/messages.html" hidden>Messages</a>
      <details class="kf-nav-group kf-profile-group" hidden>
        <summary>My Account <span aria-hidden="true">⌄</span></summary>
        <div class="kf-nav-menu">
          <a class="kf-my-profile-link" href="/profile.html">My Profile</a>
          <a href="/friends.html">Friends</a>
          <a class="kf-notify" href="/notifications.html">Notifications <span class="kf-notify-badge" hidden>0</span></a>
          <a class="kf-account-link" href="/account.html">Settings &amp; Tools</a>
          <a class="kf-admin-foundry-link" href="/devil-tools.html" hidden>Creator Foundry</a>
        </div>
      </details>
      <details class="kf-nav-group kf-staff-group" hidden>
        <summary>Staff <span aria-hidden="true">⌄</span></summary>
        <div class="kf-nav-menu">
          <a class="kf-admin-link" href="/admin.html" hidden>Admin Dashboard</a>
          <a class="kf-mod-link" href="/moderation.html">Moderation</a>
        </div>
      </details>
      <a class="kf-nav-primary kf-sign-in-link" href="/auth.html">Sign In</a>
    </nav>
    <a class="kf-lunar-strip" href="/moonology.html">
      <span class="kf-lunar-disks" aria-hidden="true"></span>
      <span class="kf-lunar-label">Moonology</span>
    </a>`;
  if (!document.querySelector('link[data-moon-strip]')) {
    const sheet = document.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.href = '/moon-strip.css';
    sheet.dataset.moonStrip = 'true';
    document.head.append(sheet);
  }
  import('/moon-widget.mjs').then(({mountMoonStrip}) => mountMoonStrip(header.querySelector('.kf-lunar-strip'))).catch(() => {});

  const nav = header.querySelector(".kf-nav");
  // Pages serves both extensionless routes and their original .html links.
  const normalizedPath = path => path.replace(/\/$/, "").replace(/\.html$/, "").replace(/^\/index$/, "") || "/";
  function markCurrentPage() {
    const currentPath = normalizedPath(location.pathname);
    // The brand is the sole global route to home. Avoid a duplicate Explore link.
    const brand = header.querySelector(".kf-brand");
    if (brand) {
      if (currentPath === "/") brand.setAttribute("aria-current", "page");
      else brand.removeAttribute("aria-current");
    }
    const sectionAliases = new Map([
      ["/profile-edit", "/profile"],
      ["/thread", "/community"],
      ["/community-topic", "/community"],
      ["/create-thread", "/community"]
    ]);
    const sectionPath = sectionAliases.get(currentPath) ||
      (currentPath.startsWith("/arcade/") || currentPath.startsWith("/arcade-") ? "/chaos-cartridge" : currentPath);
    nav.querySelectorAll('a[href^="/"]').forEach(link => {
      const destination = new URL(link.href);
      const samePage = normalizedPath(destination.pathname) === sectionPath;
      if (samePage && (!destination.hash || destination.hash === location.hash || sectionPath === "/")) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }
  markCurrentPage();
  nav.querySelectorAll(".kf-nav-group").forEach(group => {
    group.addEventListener("toggle", () => {
      if (group.open) nav.querySelectorAll(".kf-nav-group").forEach(other => { if (other !== group) other.open = false; });
    });
  });
  const toggle = header.querySelector(".kf-nav-toggle");
  const profileGroup = nav.querySelector(".kf-profile-group");
  const badge = nav.querySelector(".kf-notify-badge");
  const closeGroups = () => {
    nav.querySelectorAll(".kf-nav-group[open]").forEach(group => group.open = false);
  };
  const mobileNavViewport = window.matchMedia("(max-width: 1080px)");
  function setDrawer(open) {
    const visible = Boolean(open && mobileNavViewport.matches);
    nav.classList.toggle("open", visible);
    document.body.classList.toggle("kf-navigation-open", visible);
    toggle.setAttribute("aria-expanded", String(visible));
    toggle.setAttribute("aria-label", visible ? "Close navigation" : "Open navigation");
    if (!visible) closeGroups();
  }
  toggle.addEventListener("click", () => setDrawer(!nav.classList.contains("open")));
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    const openGroup = nav.querySelector(".kf-nav-group[open]");
    if (openGroup) {
      openGroup.open = false;
      openGroup.querySelector("summary").focus();
    } else if (nav.classList.contains("open")) {
      setDrawer(false);
      toggle.focus();
    }
  });
  document.addEventListener("pointerdown", event => {
    if (!header.contains(event.target)) setDrawer(false);
  });
  mobileNavViewport.addEventListener("change", () => setDrawer(false));
  window.addEventListener("popstate", () => setDrawer(false));
  nav.addEventListener("click", event => {
    if (event.target.closest("a")) setDrawer(false);
  });

  let notificationRefreshVersion=0;
  function refreshNotifications() {
    if (!cloudAccountAvailable) return;
    const requestVersion=++notificationRefreshVersion;
    fetch("https://api.ash-fall.com/api/notifications?unread=true&limit=1", {credentials:"include",cache:"no-store"})
      .then(r => { if (r.status===401 || r.status===403) return null; if (!r.ok) throw new Error("Auth temporarily unavailable: "+r.status); const type=r.headers.get("content-type")||""; if (!type.toLowerCase().includes("json")) throw new Error("Auth endpoint returned non-JSON"); return r.json(); })
      .then(d => {
        if (!d || !badge || requestVersion!==notificationRefreshVersion) return;
        const count = Number(d.unread_count || 0);
        badge.textContent = count > 99 ? "99+" : String(count);
        badge.hidden = count === 0;
      }).catch(() => {});
  }

  // Read receipts, other browser tabs, and push clicks must refresh the badge.
  window.addEventListener("kf:notifications-changed", refreshNotifications);
  window.addEventListener("storage", event => {
    if (event.key === "kf:notifications-changed") refreshNotifications();
  });
  window.addEventListener("focus", refreshNotifications);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refreshNotifications();
  });
  if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", event => {
    if (event.data?.type === "KF_NOTIFICATIONS_CHANGED") refreshNotifications();
  });

  (cloudAccountAvailable ? fetch("https://api.ash-fall.com/api/site-settings", {credentials:"include",cache:"no-store"}) : Promise.resolve(null))
    .then(r => r?.ok ? r.json() : null)
    .then(d => {
      const siteSettings = d?.settings;
      if (!siteSettings) return;
      if (siteSettings.feature_miss_chaos === "false") document.querySelector("[data-miss-chaos-directory]")?.setAttribute("hidden", "");
      if (siteSettings.announcements_enabled === "true" && (siteSettings.announcement_title || siteSettings.announcement_body)) {
        const banner = document.createElement("aside");
        banner.className = "kf-announcement";
        const heading = document.createElement("strong");
        heading.textContent = siteSettings.announcement_title || "Knightfall";
        const message = document.createElement("span");
        message.textContent = siteSettings.announcement_body || "";
        banner.append(heading, message);
        document.body.prepend(banner);
      }
      if (siteSettings.maintenance_mode === "true") {
        const banner = document.createElement("aside");
        banner.className = "kf-maintenance";
        banner.textContent = "Knightfall is in maintenance mode. Administrator access remains available.";
        document.body.prepend(banner);
      }
    }).catch(() => {});

  (cloudAccountAvailable ? fetch("https://api.ash-fall.com/api/auth/me", {credentials:"include",cache:"no-store"}) : Promise.resolve(null))
    .then(r => r?.ok ? r.json() : null)
    .then(d => {
      const user = d?.user;
      if (!user) return;
      profileGroup.hidden = false;
      nav.querySelector(".kf-messages-shortcut").hidden = false;
      nav.querySelector(".kf-sign-in-link").hidden = true;
      document.querySelector("[data-home-sign-in]")?.setAttribute("hidden", "");
      const role = String(user.role || "").trim().toLowerCase();
      const admin = role === "admin" || role === "god";
      const staff = admin || role === "moderator";
      const creator = String(user.public_title || "").trim() === "Digital Creator";
      nav.querySelector(".kf-admin-foundry-link").hidden = !admin && !creator;
      nav.querySelector(".kf-staff-group").hidden = !staff;
      nav.querySelector(".kf-admin-link").hidden = !admin;
      nav.querySelector(".kf-my-profile-link").href = "/profile.html?username=" + encodeURIComponent(user.username);
      refreshNotifications();
      setInterval(refreshNotifications, 45000);
      // One shared WebSocket signal for inbox bubbles, with polling fallback.
      if (location.pathname !== "/messages.html") {
        const startChatHeads=()=>{
          if (!document.querySelector('link[data-kf-chat-bubbles]')) {
            const sheet=document.createElement("link");
            sheet.rel="stylesheet";sheet.href="/chat-bubbles.css?v=20261113-2";
            sheet.dataset.kfChatBubbles="true";document.head.append(sheet);
          }
          if (!document.querySelector('script[data-kf-chat-bubbles]')) {
            const bubbles=document.createElement("script");
            bubbles.src="/chat-bubbles.js?v=20261113-live1";
            bubbles.dataset.kfChatBubbles="true";
            bubbles.dataset.userId=String(user.id);
            document.body.append(bubbles);
          }
        };
        if(window.KnightfallLive)startChatHeads();
        else {
          let liveScript=document.querySelector('script[data-kf-message-live]');
          if(!liveScript){
            liveScript=document.createElement("script");
            liveScript.src="/message-live.js?v=20261113-realtime1";
            liveScript.dataset.kfMessageLive="true";
            liveScript.onload=startChatHeads;
            liveScript.onerror=startChatHeads; // Polling still works if WebSockets are unavailable.
            document.body.append(liveScript);
          }else{
            liveScript.addEventListener("load",startChatHeads,{once:true});
            liveScript.addEventListener("error",startChatHeads,{once:true});
          }
        }
      }
      const pingActivity = () => fetch("https://api.ash-fall.com/api/activity/ping", {method:"POST",credentials:"include"}).catch(() => {});
      pingActivity();
      setInterval(pingActivity, 120000);
    }).catch(() => {});
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializeNavigation, {once:true});
  else initializeNavigation();
})();
