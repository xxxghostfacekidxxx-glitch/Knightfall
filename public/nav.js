(() => {
  // Offline/local previews must not fetch a real member session, production
  // site settings, or notification counts. Live Ash-Fall retains all API behavior.
  const cloudAccountAvailable = ["ash-fall.com", "www.ash-fall.com"].includes(String(location.hostname || "").toLowerCase());
  // Apply shared Gothic chrome AFTER every page-specific and inline stylesheet.
  // The previous eager injection could run in <head> before later stylesheets
  // were parsed, allowing old neon/page CSS to override the approved theme.
  const mountApprovedTheme = () => {
    const styles = [
      ["visual-refresh", "/visual-refresh.css?v=20261115-gothic9"],
      ["section-overhaul", "/section-overhaul.css?v=20261115-gothic9"],
      ["knightfall-unified-theme", "/knightfall-unified-theme.css?v=20261115-gothic9"],
      ["knightfall-artwork", "/knightfall-artwork.css?v=20261116-art9"]
    ];
    for (const [id, href] of styles) {
      const selector = 'link[data-' + id + ']';
      let link = document.querySelector(selector);
      if (!link) {
        link = document.createElement("link");
        link.rel = "stylesheet";
        link.dataset[id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = "true";
      }
      link.href = href;
      // Reposition existing links as well, so page styling cannot trail them.
      document.head.appendChild(link);
    }
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountApprovedTheme, {once:true});
  } else {
    mountApprovedTheme();
  }

  // Original section illustrations: site chrome only, not gameplay or personal themes.
  const mountRealmArtwork = () => {
    const path = location.pathname.toLowerCase();
    if (/^\/(?:arcade\/hosted\/|casino\/|games\/)/.test(path)) return;
    let realm = "general";
    // Canonical Pages URLs omit .html. A shared hyphen/dot/slash boundary
    // covers /admin, /admin.html, /admin-foo and /mascot-pets alike.
    if (path === "/" || path === "/index.html") realm = "home";
    else if (/^\/(?:community|homepage|thread|create-thread|forums|madhouse)(?:-|[./]|$)/.test(path)) realm = "madhouse";
    else if (/^\/(?:chaos-cartridge|chaos-lab|arcade|arcade-vault)(?:-|[./]|$)/.test(path)) realm = "arcade";
    else if (/^\/(?:devil-tools|dev-toolkit|creator|open-source-arsenal|cinderwild|cinderwind|personal-bots|bots)(?:-|[./]|$)/.test(path)) realm = "foundry";
    else if (/^\/(?:messages|ruinwire|social|friends|notifications|miss-chaos|bot)(?:-|[./]|$)/.test(path)) realm = "messages";
    else if (/^\/(?:moonology|shadow-work|astrology|birth-chart|cosmic)(?:-|[./]|$)/.test(path)) realm = "moon";
    else if (/^\/(?:shops|shop-builder|my-shop|store|support|billing|stripe-invoicing)(?:-|[./]|$)/.test(path)) realm = "market";
    else if (/^\/(?:members|profile|account|auth|login|register)(?:-|[./]|$)/.test(path)) realm = "members";
    else if (/^\/(?:admin|eye-of-chaos|eye-of-horus|god|moderation)(?:-|[./]|$)/.test(path)) realm = "god";
    else if (/^\/(?:mascot|pet|companion)(?:-|[./]|$)/.test(path)) realm = "pets";
    else if (/^\/(?:die-ary|memo-pad|vault|diary)(?:-|[./]|$)/.test(path)) realm = "diary";
    const main = document.querySelector("main");
    if (!main) return;
    document.body.dataset.kfRealm = realm;
    if (realm === "home") return; // Homepage has its own illustrated cathedral hero.
    // Keep actual games untouched even when a game lives at a root-level URL.
    if (realm === "general" && main.querySelector("canvas, [data-game-canvas]")) {
      document.body.classList.add("kf-gameplay-page");
      return;
    }
    const selectors = {
      madhouse: ".community-directory > .hero, .forum-hero, main > .hero",
      arcade: ".arcade-directory > .cartridge-hero, .lab > .hero, main > .hero",
      foundry: ".bots-shell > .bots-hero, .directory-shell > .directory-hero, main > .hero, .foundry-hero, .creator-hero",
      messages: ".messages-shell > .messages-hero, .rw-install-hero, .social-hero, .notifications-hero, .friends-hero",
      moon: ".moon-shell > .moon-intro, .moon-hero",
      market: ".directory-shell > .directory-hero, .market-hero, .builder-hero, main > .hero",
      members: ".members-page > .members-hero, .profile-hero, .account-hero",
      god: ".admin-shell > .hero, .chaos-shell > .chaos-hero, .eye-shell > .eye-hero, main > .hero",
      pets: ".sanctuary-shell > .sanctuary-header, .room-intro, .trials-hero, .mascot-hero",
      diary: ".diary-shell > .diary-hero, .memo-hero, .vault-hero",
      general: "main > .hero, main > .page-hero"
    };
    const hero = document.querySelector(selectors[realm]);
    if (hero && main.contains(hero)) hero.dataset.kfArtHero = realm;
    else main.dataset.kfArtBackdrop = realm; // Subtle backdrop on utility pages.
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", mountRealmArtwork, {once:true});
  else mountRealmArtwork();

  // Chaos Cartridge CRT / signal-corruption skin, only on arcade routes.
  if (location.pathname.startsWith("/arcade/hosted/")) {
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
    // One dedication link per footer, including home pages with custom footer markup.
    const existing=document.getElementById("ashfall-support-footer")||document.querySelector("footer.site-footer");
    if(existing){
      const links=existing.querySelector(".footer-links")||existing;
      for(const [href,label] of [["/privacy.html","Privacy"],["/account-deletion.html","Delete account"]]){
        if(!links.querySelector('a[href="'+href+'"]')){
          const a=document.createElement("a");a.href=href;a.textContent=label;a.className="kf-legal-link";
          links.append(a);
        }
      }
      if(!links.querySelector('a[href="/remembering-josh.html"]')){
        const dedication=document.createElement("a");dedication.href="/remembering-josh.html";
        dedication.className="kf-dedication-link";dedication.textContent="Dedication · Josh “Crush” Van Patten";
        links.append(dedication);
      }
      return;
    }
    const footer=document.createElement("footer");
    footer.id="ashfall-support-footer";
    footer.setAttribute("aria-label","Knightfall support and dedication");
    footer.innerHTML='<a href="/support.html">Support Knightfall</a> <a href="/user-agreement.html">Terms &amp; Policies</a> <a href="/privacy.html">Privacy</a> <a href="/account-deletion.html">Delete account</a> <a class="kf-dedication-link" href="/remembering-josh.html">Dedication · Josh “Crush” Van Patten</a>';
    const css=document.createElement("style");
    css.textContent='#ashfall-support-footer{box-sizing:border-box;width:100%;margin-top:3rem;padding:1.3rem 1rem;text-align:center;background:#17191c;border-top:1px solid #a48a75;color:#d7c8bc;font:500 14px/1.7 system-ui,sans-serif}#ashfall-support-footer a{display:inline-block;margin-left:.6rem;color:#d1b48b;font-weight:800;text-decoration:underline;text-underline-offset:3px}#ashfall-support-footer a:focus-visible{outline:2px solid #d1b48b;outline-offset:4px}@media(max-width:520px){#ashfall-support-footer a{display:block;margin:.4rem auto 0}}';
    document.head.append(css);
    document.body.append(footer);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",mountSupportFooter,{once:true});
  else mountSupportFooter();
  // Dedicated Ruinwire PWA keeps its own icon; all other pages use Knightfall's crest.
  const isRuinwire = ["/ruinwire", "/ruinwire.html"].includes(location.pathname) ||
    (["/messages", "/messages.html"].includes(location.pathname) &&
      new URLSearchParams(location.search).get("app") === "ruinwire");
  const iconLinks = isRuinwire ? [
    { rel: "icon", href: "/icons/ruinwire.svg", type: "image/svg+xml" },
    { rel: "shortcut icon", href: "/icons/ruinwire.svg", type: "image/svg+xml" },
    { rel: "apple-touch-icon", href: "/icons/knightfall-crest-512.png?v=20261114" }
  ] : [
    { rel: "icon", href: "/icons/knightfall-crest-192.png?v=20261114", type: "image/png" },
    { rel: "shortcut icon", href: "/icons/knightfall-crest-192.png?v=20261114", type: "image/png" },
    { rel: "apple-touch-icon", href: "/icons/knightfall-crest-512.png?v=20261114" }
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
  themeColor.content = "#0d1013";
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
        style.textContent = '.kf-app-update{position:fixed;z-index:2147483000;bottom:max(1rem,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);width:min(92vw,540px);display:flex;align-items:center;justify-content:center;gap:.7rem;flex-wrap:wrap;padding:.85rem 1rem;border:1px solid #ae8b79;border-radius:14px;background:#211e22f5;color:#efe1d2;box-shadow:0 8px 36px #000a;font:600 14px/1.45 system-ui,sans-serif}.kf-app-update span{flex:1 1 210px}.kf-app-update button{min-height:40px;padding:.5rem .8rem;border-radius:8px;border:1px solid #c5a57c;background:#9b4758;color:#fff3e4;font:700 14px system-ui;cursor:pointer}.kf-app-update button:last-child{background:transparent;color:#efe1d2}.kf-app-update button:focus-visible{outline:2px solid #c5a57c;outline-offset:2px}@media(max-width:400px){.kf-app-update{bottom:max(.4rem,env(safe-area-inset-bottom));gap:.45rem}}';
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
    companion.src = "/miss-chaos-presence.js?v=20261116-mobile-dock1";
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
  // CSS for the shared header lives in knightfall-unified-theme.css.
  // The former four injected emergency/recovery layers forced retired neon colors
  // with !important and overrode the approved site-wide identity.
  if (header.parentElement !== document.body) document.body.prepend(header);
  // Keep the keyboard skip link while leaving all appearance to shared CSS.
  const mainContent=document.querySelector("main");
  if (mainContent && !document.querySelector(".kf-skip-link")) {
    if (!mainContent.id) mainContent.id="main-content";
    const skip=document.createElement("a");
    skip.className="kf-skip-link";skip.href="#"+mainContent.id;
    skip.textContent="Skip to content";header.before(skip);
  }
  header.innerHTML = `
    <a class="kf-brand" href="/" aria-label="Knightfall home"><span>KNIGHT</span><b>FALL</b></a>
    <a href="/install.html" class="kf-install-pill" aria-label="Install Knightfall on your device">⬇ <span>Install</span></a>
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
      <a class="kf-nav-primary kf-messages-shortcut" href="/messages.html" hidden>Ruinwire</a>
      <details class="kf-nav-group kf-profile-group" hidden>
        <summary>My Account <span aria-hidden="true">⌄</span></summary>
        <div class="kf-nav-menu">
          <a class="kf-my-profile-link" href="/profile.html">My Profile</a>
          <a href="/friends.html">Friends</a>
          <a class="kf-notify" href="/notifications.html">Notifications <span class="kf-notify-badge" hidden>0</span></a>
          <a class="kf-account-link" href="/account.html">Settings &amp; Tools</a>
        </div>
      </details>
      <details class="kf-nav-group kf-staff-group" hidden>
        <summary>Staff <span aria-hidden="true">⌄</span></summary>
        <div class="kf-nav-menu">
          <a class="kf-admin-link" href="/admin.html" hidden>Admin Dashboard</a>
          <a class="kf-mod-link" href="/moderation.html" hidden>Moderation</a>
          <a class="kf-admin-foundry-link" href="/devil-tools.html" hidden>Creator Foundry</a>
          <a class="kf-god-eye-link" href="/eye-of-horus.html" hidden>𓂀 Eye of Horus</a>
        </div>
      </details>
      <a class="kf-nav-primary kf-sign-in-link" href="/auth.html">Sign In</a>
    </nav>
    <a class="kf-admin-quick-link" href="/admin.html" hidden aria-label="Administrator dashboard">Admin</a>
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
        banner.id="kf-shared-announcement";
        banner.className = "kf-announcement kf-shared-announcement";
        const heading = document.createElement("strong");
        heading.textContent = siteSettings.announcement_title || "Knightfall";
        const message = document.createElement("span");
        message.textContent = siteSettings.announcement_body || "";
        banner.append(heading, message);
        header.append(banner);
      }
      if (siteSettings.maintenance_mode === "true") {
        const banner = document.createElement("aside");
        banner.className = "kf-maintenance";
        banner.textContent = "Knightfall is in maintenance mode. Administrator access remains available.";
        banner.id="kf-shared-maintenance";
        banner.classList.add("kf-shared-maintenance");
        header.append(banner);
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
      const rights = user.staff_access || {};
      const canModerate = admin || role === "moderator";
      const canCreate = admin || (role === "member" && String(user.public_title || "").trim() === "Digital Creator");
      const staff = canModerate || canCreate;
      nav.querySelector(".kf-admin-foundry-link").hidden = !canCreate;
      nav.querySelector(".kf-mod-link").hidden = !canModerate;
      nav.querySelector(".kf-god-eye-link").hidden = role !== "god" || rights.can_eye_of_horus === false;
      nav.querySelector(".kf-staff-group").hidden = !staff;
      nav.querySelector(".kf-admin-link").hidden = !admin;
      header.querySelector(".kf-admin-quick-link").hidden=!admin;
      nav.querySelector(".kf-my-profile-link").href = "/profile.html?username=" + encodeURIComponent(user.username);
      refreshNotifications();
      setInterval(refreshNotifications, 45000);
      // One shared WebSocket signal for inbox bubbles, with polling fallback.
      if (!["/messages", "/messages.html"].includes(location.pathname)) {
        const startChatHeads=()=>{
          if (!document.querySelector('link[data-kf-chat-bubbles]')) {
            const sheet=document.createElement("link");
            sheet.rel="stylesheet";sheet.href="/chat-bubbles.css?v=20261115-gothic10";
            sheet.dataset.kfChatBubbles="true";document.head.append(sheet);
          }
          if (!document.querySelector('script[data-kf-chat-bubbles]')) {
            const bubbles=document.createElement("script");
            bubbles.src="/chat-bubbles.js?v=20261115-viewport3";
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
