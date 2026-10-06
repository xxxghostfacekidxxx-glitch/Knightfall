(() => {
  const header = document.querySelector(".kf-header");
  if (!header) return;
  header.innerHTML = `
    <a class="kf-brand" href="/index.html" aria-label="Knightfall home"><span>KNIGHT</span><b>FALL</b></a>
    <button class="kf-nav-toggle" type="button" aria-expanded="false" aria-controls="kf-primary-nav" aria-label="Open navigation">☰</button>
    <nav id="kf-primary-nav" class="kf-nav" aria-label="Primary navigation">
      <a href="/homepage.html">Forum</a>
      <a href="/members.html">Members</a>
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
  fetch("https://api.ash-fall.com/api/auth/me", {credentials:"include", cache:"no-store"})
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      if (!d || !d.user) return;
      const account = nav.querySelector('a[href="/account.html"]');
      if (!account) return;
      const profile = document.createElement("a");
      profile.href = "/profile.html?username=" + encodeURIComponent(d.user.username);
      profile.textContent = "Profile";
      account.before(profile);
    })
    .catch(() => {});
})();