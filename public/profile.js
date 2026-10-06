const API = "https://api.ash-fall.com";
const root = document.querySelector("#profile");
const username = new URLSearchParams(location.search).get("username");

const escapeHtml = (value = "") => String(value).replace(/[&<>\"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#39;"}[ch]));

async function loadProfile() {
  if (!username) {
    root.innerHTML = "<h1>Profile not found</h1><p>No username was supplied.</p>";
    return;
  }
  try {
    const response = await fetch(`${API}/api/users/${encodeURIComponent(username)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Profile unavailable");
    const user = data.user;
    root.innerHTML = `
      <div class="avatar">${escapeHtml((user.display_name || user.username).slice(0, 1).toUpperCase())}</div>
      <h1>${escapeHtml(user.display_name)}</h1>
      <p class="handle">@${escapeHtml(user.username)}</p>
      ${user.bio ? `<p class="bio">${escapeHtml(user.bio)}</p>` : ""}
      <dl>
        ${user.location ? `<div><dt>Location</dt><dd>${escapeHtml(user.location)}</dd></div>` : ""}
        ${user.pronouns ? `<div><dt>Pronouns</dt><dd>${escapeHtml(user.pronouns)}</dd></div>` : ""}
        ${user.website_url ? `<div><dt>Website</dt><dd><a href="${escapeHtml(user.website_url)}" rel="noopener noreferrer nofollow">${escapeHtml(user.website_url)}</a></dd></div>` : ""}
        <div><dt>Member since</dt><dd>${new Date(user.created_at).toLocaleDateString()}</dd></div>
      </dl>`;
  } catch (error) {
    root.innerHTML = `<h1>Profile unavailable</h1><p>${escapeHtml(error.message)}</p>`;
  }
}
loadProfile();
