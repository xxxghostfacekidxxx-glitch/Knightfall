(() => {
  const header = document.querySelector(".kf-header");
  if (!header) return;
  header.innerHTML = `
    <a class="kf-brand" href="/index.html" aria-label="Knightfall home"><span>KNIGHT</span><b>FALL</b></a>
    <button class="kf-nav-toggle" type="button" aria-expanded="false" aria-controls="kf-primary-nav" aria-label="Open navigation">☰</button>
    <nav id="kf-primary-nav" class="kf-nav" aria-label="Primary navigation">
      <a href="/homepage.html">Forum</a>
      <a href="/miss-chaos.html">Miss Chaos</a>
      <a href="/create-thread.html">New Thread</a>
      <a href="/members.html">Members</a>
      <a href="/messages.html">Messages</a>
      <a class="kf-notify" href="/notifications.html" aria-label="Notifications">Alerts <span class="kf-notify-badge" hidden>0</span></a>
      <a href="/account.html">Account</a>
      <a href="/index.html">Sanctuary</a>
    </nav>`;
  const toggle = header.querySelector(".kf-nav-toggle");
  const nav = header.querySelector(".kf-nav");
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    toggle.setAttribute("aria-label", open ? "Open navigation" : "Close navigation");
    nav.classList.toggle("open", !open);
  });
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }));
  const notifyLink=nav.querySelector(".kf-notify"), badge=nav.querySelector(".kf-notify-badge");
  function refreshNotifications(){
    fetch("https://api.ash-fall.com/api/notifications?unread=true&limit=1",{credentials:"include",cache:"no-store"})
      .then(r=>r.ok?r.json():null).then(d=>{if(!d||!badge)return;const n=Number(d.unread_count||0);badge.textContent=n>99?"99+":String(n);badge.hidden=n===0;}).catch(()=>{});
  }
  refreshNotifications();
  setInterval(refreshNotifications,45000);

  setInterval(()=>fetch("https://api.ash-fall.com/api/activity/ping",{method:"POST",credentials:"include"}).catch(()=>{}),120000);
  fetch("https://api.ash-fall.com/api/site-settings", {credentials:"include", cache:"no-store"})
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      const x = d?.settings;
      if (!x) return;
      if (x.announcements_enabled === "true" && (x.announcement_title || x.announcement_body)) {
        const banner = document.createElement("aside");
        banner.className = "kf-announcement";
        banner.innerHTML = "<strong>" + String(x.announcement_title || "Knightfall") .replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])) + "</strong><span>" + String(x.announcement_body || "").replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])) + "</span>";
        document.body.prepend(banner);
      }
      if (x.maintenance_mode === "true") {
        const banner = document.createElement("aside");
        banner.className = "kf-maintenance";
        banner.textContent = "Knightfall is in maintenance mode. Administrator access remains available.";
        document.body.prepend(banner);
      }
    }).catch(() => {});
  fetch("https://api.ash-fall.com/api/auth/me", {credentials:"include", cache:"no-store"})
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      if (!d || !d.user) return;
      const account = nav.querySelector('a[href="/account.html"]');
      if (!account) return;
      const admin = document.createElement("a");
      if (d.user.role === "admin") { admin.href="/admin.html"; admin.textContent="Admin"; account.before(admin); }
      if ((d.user.role === "admin" || d.user.role === "moderator") && d.user.status !== "suspended" && d.user.status !== "banned") { const bots=document.createElement("a"); bots.href="/personal-bots.html"; bots.textContent="Personal Bots"; account.before(bots); }
      if (d.user.role === "admin" && d.user.username === "knightfall") { const vault=document.createElement("a"); vault.href="/vault.html"; vault.textContent="Private Vault"; account.before(vault); }
      const profile = document.createElement("a");
      profile.href = "/profile.html?username=" + encodeURIComponent(d.user.username);
      profile.textContent = "Profile";
      account.before(profile);
    })
    .catch(() => {});
})();