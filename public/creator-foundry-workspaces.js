import { BLACK, WHITE } from "./arcade/hosted/cards-against-chaos/base-deck.js";
import { EXPANSION_PACKS } from "./arcade/hosted/cards-against-chaos/expansion-packs.js";

const el = id => document.getElementById(id);
function element(tag, value, className) {
  const node = document.createElement(tag);
  node.textContent = value;
  if (className) node.className = className;
  return node;
}

const cardWorkspace = el("chaos-card-catalog");
const cardSearch = el("chaos-catalog-search");
const deckFilter = el("chaos-catalog-deck");
const typeFilter = el("chaos-catalog-type");
const adultFilter = el("chaos-catalog-adult");
const cardList = el("chaos-catalog-cards");
const previous = el("chaos-catalog-prev");
const next = el("chaos-catalog-next");
const decks = [{ id: "base", title: "Base deck", black: BLACK, white: WHITE }, ...Object.values(EXPANSION_PACKS)];
const cards = decks.flatMap(deck => [
  ...deck.black.map((text, index) => ({ deck: deck.title, adult: deck.min_age >= 18, type: "prompt", id: deck.id + ":B" + (index + 1), text })),
  ...deck.white.map((text, index) => ({ deck: deck.title, adult: deck.min_age >= 18, type: "answer", id: deck.id + ":W" + (index + 1), text }))
]);
for (const deck of decks.slice(1)) {
  const option = new Option(deck.title);
  option.dataset.adult = String(deck.min_age >= 18);
  deckFilter.add(option);
}
function updateAdultDecks() {
  for (const option of deckFilter.options) {
    option.disabled = option.dataset.adult === "true" && !adultFilter.checked;
  }
  if (deckFilter.selectedOptions[0]?.disabled) deckFilter.value = "";
}
updateAdultDecks();
const pageSize = 24;
let cardPage = 0;

function renderCards() {
  const terms = cardSearch.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = cards.filter(card => (!card.adult || adultFilter.checked) && (!deckFilter.value || card.deck === deckFilter.value) &&
    (!typeFilter.value || card.type === typeFilter.value) &&
    terms.every(term => (card.id + " " + card.text).toLowerCase().includes(term)));
  const pages = Math.max(1, Math.ceil(matches.length / pageSize));
  cardPage = Math.min(cardPage, pages - 1);
  const start = cardPage * pageSize;
  cardList.replaceChildren(...matches.slice(start, start + pageSize).map(card => {
    const tile = element("article", "", "foundry-deck-card");
    tile.dataset.type = card.type;
    tile.append(element("small", card.deck + " · " + card.type), element("p", card.text), element("code", card.id));
    return tile;
  }));
  el("chaos-catalog-count").textContent = matches.length ?
    matches.length.toLocaleString() + (matches.length === 1 ? " card" : " cards") + " · Page " + (cardPage + 1) + " of " + pages : "No cards match.";
  previous.disabled = cardPage === 0;
  next.disabled = cardPage >= pages - 1;
}
for (const control of [cardSearch, deckFilter, typeFilter, adultFilter]) {
  control.addEventListener("input", () => {
    updateAdultDecks();
    cardPage = 0;
    renderCards();
  });
}
for (const [button, direction] of [[previous, -1], [next, 1]]) {
  button.addEventListener("click", () => {
    cardPage += direction;
    renderCards();
    const count = el("chaos-catalog-count");
    count.tabIndex = -1;
    count.focus({ preventScroll: true });
    count.scrollIntoView({ block: "start" });
  });
}
cardWorkspace.addEventListener("foundry:open", renderCards);

const api = "https://api.ash-fall.com/api/devil-tools/ideas";
const form = el("foundry-idea-form");
const project = form.elements.project;
const kind = form.elements.kind;
const submitStatus = el("foundry-idea-status");
const queueStatus = el("foundry-queue-status");
const ideaList = el("foundry-ideas-list");
const more = el("foundry-ideas-more");
const refresh = el("foundry-ideas-refresh");
const statusLabels = { pending: "Pending review", accepted: "Accepted", declined: "Declined" };
let cursor;

async function request(path = "", method = "GET", body) {
  const response = await fetch(api + path, {
    method, credentials: "include", cache: "no-store",
    ...(body && { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || (response.status === 404 ? "Submission service is unavailable." : "Request failed."));
  }
  return data;
}

function updateKinds() {
  for (const option of kind.options) {
    option.disabled = option.value.endsWith(" card") && project.value !== "Cards Against Chaos";
  }
  if (kind.selectedOptions[0]?.disabled) kind.value = "Feature";
}
project.addEventListener("change", updateKinds);
updateKinds();
document.getElementById("workshop").addEventListener("click", event => {
  const shortcut = event.target.closest('a[href="#creator-handoff"][data-project]');
  if (!shortcut || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  project.value = shortcut.dataset.project;
  kind.value = shortcut.dataset.kind;
  updateKinds();
});

function ideaCard(idea, canReview) {
  const card = element("article", "", "foundry-idea");
  card.dataset.status = idea.status;
  const title = element("h4", idea.title);
  const meta = element("p", [idea.project, idea.kind, "@" + idea.author,
    new Date(idea.created_at).toLocaleDateString()].join(" · "), "foundry-idea-meta");
  const detail = element("p", idea.detail, "foundry-idea-detail");
  const status = element("p", statusLabels[idea.status] || idea.status, "foundry-idea-state");
  card.append(title, meta, detail, status);
  if (canReview && idea.status === "pending") {
    const actions = element("div", "", "foundry-links");
    for (const [label, decision] of [["Accept", "accepted"], ["Decline", "declined"]]) {
      const button = element("button", label, "btn");
      button.type = "button";
      button.addEventListener("click", async () => {
        for (const action of actions.children) action.disabled = true;
        try {
          const path = "/" + encodeURIComponent(idea.author_id) + "/" + encodeURIComponent(idea.id);
          const result = await request(path, "PATCH", { status: decision });
          card.replaceWith(ideaCard(result.idea, canReview));
          queueStatus.textContent = "Marked “" + idea.title + "” " + decision + ".";
        } catch (error) {
          queueStatus.textContent = error.message;
          for (const action of actions.children) action.disabled = false;
        }
      });
      actions.append(button);
    }
    card.append(actions);
  }
  return card;
}

async function loadIdeas(append = false) {
  if (refresh.disabled) return;
  refresh.disabled = true;
  more.disabled = true;
  queueStatus.textContent = "Loading submissions…";
  try {
    const query = append && cursor ? "?cursor=" + encodeURIComponent(cursor) : "";
    const data = await request(query);
    if (!Array.isArray(data.ideas)) throw new Error("Submission service returned an invalid response.");
    el("foundry-queue-title").textContent = data.can_review ? "Review submissions" : "My submissions";
    if (!append) ideaList.replaceChildren();
    const entries = data.ideas.sort((a, b) => Number(a.status !== "pending") - Number(b.status !== "pending") ||
      b.created_at.localeCompare(a.created_at));
    ideaList.append(...entries.map(idea => ideaCard(idea, data.can_review)));
    cursor = data.cursor;
    more.hidden = !cursor;
    queueStatus.textContent = ideaList.children.length ? "" : "No submissions yet.";
  } catch (error) {
    queueStatus.textContent = error.message;
  } finally {
    refresh.disabled = false;
    more.disabled = false;
  }
}
refresh.addEventListener("click", () => void loadIdeas());
more.addEventListener("click", () => void loadIdeas(true));
el("creator-handoff").addEventListener("foundry:open", () => void loadIdeas());
form.addEventListener("submit", async event => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  submitStatus.textContent = "Sending…";
  try {
    const data = await request("", "POST", Object.fromEntries(new FormData(form)));
    if (!data.idea) throw new Error("The submission could not be confirmed.");
    form.elements.title.value = "";
    form.elements.detail.value = "";
    submitStatus.textContent = "Submitted for review.";
    await loadIdeas();
  } catch (error) {
    submitStatus.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

// A direct bookmark may be displayed while this module is loading.
if (!cardWorkspace.hidden) renderCards();
if (!el("creator-handoff").hidden) void loadIdeas();
