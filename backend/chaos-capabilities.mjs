/**
 * Miss Chaos capability registry, framework-independent and safe by default.
 * Import into the Worker router when its authenticated session and model adapter
 * are available. Defining a capability does NOT grant access to execute it.
 */
export const CAPABILITIES = Object.freeze({
  "site.help": Object.freeze({
    description: "Find help for public Knightfall features",
    scope: "public",
    mutates: false,
    confirmation: false,
    maxInputBytes: 2048
  }),
  "site.games": Object.freeze({
    description: "Look up public arcade game instructions",
    scope: "public",
    mutates: false,
    confirmation: false,
    maxInputBytes: 2048
  }),
  "site.search": Object.freeze({
    description: "Search a curated index of public Knightfall documentation",
    scope: "public",
    mutates: false,
    confirmation: false,
    maxInputBytes: 2048
  }),
  "research.wikipedia": Object.freeze({description:"Research public encyclopedic topics with attributed Wikipedia results",scope:"public",mutates:false,confirmation:false,maxInputBytes:512}),
  "resource.met": Object.freeze({description:"Find public-domain artworks and historical clothing or artifacts at The Met",scope:"public",mutates:false,confirmation:false,maxInputBytes:512}),
  "resource.polyhaven": Object.freeze({description:"Find freely reusable CC0 3D models, textures and HDRIs from Poly Haven",scope:"public",mutates:false,confirmation:false,maxInputBytes:512}),
  "resource.wikidata": Object.freeze({description:"Look up CC0 public knowledge from Wikidata",scope:"public",mutates:false,confirmation:false,maxInputBytes:512}),
  "research.github_repos": Object.freeze({description:"Find openly licensed GitHub public repositories using fixed source search",scope:"public",mutates:false,confirmation:false,maxInputBytes:512}),
  "dev.code_diff": Object.freeze({description:"Compare two code versions and produce a read-only unified diff",scope:"public",mutates:false,confirmation:false,maxInputBytes:12500}),
  "dev.json_shape": Object.freeze({description:"Validate JSON data against a bounded safe JSON Schema subset",scope:"public",mutates:false,confirmation:false,maxInputBytes:12500}),
  "dev.code_format": Object.freeze({description:"Format supplied JavaScript or JSON with local MIT-licensed Prettier, without execution",scope:"public",mutates:false,confirmation:false,maxInputBytes:12500}),
  "dev.diagram_flow": Object.freeze({description:"Turn supplied steps into a safe flowchart and Mermaid text",scope:"public",mutates:false,confirmation:false,maxInputBytes:2200}),
  "dev.code_inspect": Object.freeze({description:"Parse JavaScript or JSON snippets safely without running code",scope:"public",mutates:false,confirmation:false,maxInputBytes:12500}),
  "research.books": Object.freeze({description:"Look up publicly indexed books from Open Library; no copyrighted full-text retrieval",scope:"public",mutates:false,confirmation:false,maxInputBytes:512}),
  "research.papers": Object.freeze({description:"Search free Crossref scholarly publication metadata and DOI links",scope:"public",mutates:false,confirmation:false,maxInputBytes:512}),
  "forge.pattern_draft": Object.freeze({description:"Compute an inch-measured prototype cut list for a basic craft or garment pattern",scope:"public",mutates:false,confirmation:false,maxInputBytes:512}),
  "forge.material_estimate": Object.freeze({description:"Calculate rectangular fabric layout length, yardage and optional materials budget from real cut sizes",scope:"public",mutates:false,confirmation:false,maxInputBytes:6000}),
  "design.color_contrast": Object.freeze({description:"Check WCAG text contrast for provided hex colors",scope:"public",mutates:false,confirmation:false,maxInputBytes:256}),
  "forge.scale_pattern": Object.freeze({description:"Resize measured rectangular pattern pieces with fixed seam options",scope:"public",mutates:false,confirmation:false,maxInputBytes:6000}),
  "utility.now": Object.freeze({description:"Get current clock and date in an IANA time zone",scope:"public",mutates:false,confirmation:false,maxInputBytes:256}),
  "user.handoff": Object.freeze({description:"Read only the signed-in member's authorized shared Knightfall handoff board",scope:"user",mutates:false,confirmation:false,maxInputBytes:128}),
  "radar.moon": Object.freeze({description:"Measured moon phase and next quarter",scope:"public",mutates:false,confirmation:false,maxInputBytes:64}),
  "radar.shadow": Object.freeze({description:"Public shadow-work prompts",scope:"public",mutates:false,confirmation:false,maxInputBytes:512}),
  "user.notes": Object.freeze({description:"Read a member's own private memo previews",scope:"user",mutates:false,confirmation:false,maxInputBytes:512}),
  "utility.calculate": Object.freeze({description:"Calculate arithmetic expressions",scope:"public",mutates:false,confirmation:false,maxInputBytes:256}),
  "utility.word_count": Object.freeze({description:"Count words and estimate reading time",scope:"public",mutates:false,confirmation:false,maxInputBytes:13000}),
  "utility.convert": Object.freeze({description:"Convert craft, repair and everyday measurements with standard factors",scope:"public",mutates:false,confirmation:false,maxInputBytes:256}),
  "user.notifications": Object.freeze({description:"Read only the signed-in member's unread alerts; never mark them read",scope:"user",mutates:false,confirmation:false,maxInputBytes:128}),
  "user.profile": Object.freeze({description:"Read a small, safe selection of the signed-in member's own public-facing profile fields",scope:"user",mutates:false,confirmation:false,maxInputBytes:128}),
  "user.inbox": Object.freeze({description:"Summarize the signed-in member's own joined conversations without changing their read state",scope:"user",mutates:false,confirmation:false,maxInputBytes:128}),
  "user.memories": Object.freeze({
    description: "Read the current account's approved memories",
    scope: "user",
    mutates: false,
    confirmation: false,
    maxInputBytes: 1024
  }),
  "god.diagnostics": Object.freeze({
    description: "Read administrative diagnostics",
    scope: "god",
    mutates: false,
    confirmation: false,
    maxInputBytes: 1024
  }),
  "god.github_health": Object.freeze({description:"Read recent public Knightfall GitHub workflow results and prepare non-executing repair proposals",scope:"god",mutates:false,confirmation:false,maxInputBytes:128}),
  "god.audit_summary": Object.freeze({
    description: "Read a validated, counts-only Developer Arsenal audit summary via trusted backend",
    scope: "god",
    mutates: false,
    confirmation: false,
    maxInputBytes: 128
  }),
  "god.propose_change": Object.freeze({
    description: "Prepare an administrative change for approval",
    scope: "god",
    mutates: true,
    confirmation: true,
    maxInputBytes: 4096
  })
});

const LIMIT = 3;
const ALLOWED_SCOPES = new Set(["public", "user", "god"]);
function safeInput(input, maxBytes) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid tool arguments.");
  const raw = JSON.stringify(input);
  if (new TextEncoder().encode(raw).length > maxBytes) throw new Error("Tool arguments exceed limit.");
  return input;
}

/**
 * @param {object} params
 * @param {string} params.name
 * @param {object} params.input
 * @param {object} params.principal Verified server-side identity; never model-provided.
 * @param {object} params.handlers Trusted server-owned functions keyed by capability name.
 * @param {boolean} params.approved Verified, single-use server approval for this exact action.
 * @param {number} params.usedCalls Number of prior tool calls in this model turn.
 */
export async function executeChaosCapability({name, input, principal, handlers, approved = false, usedCalls = 0}) {
  const capability = Object.hasOwn(CAPABILITIES, name) ? CAPABILITIES[name] : null;
  if (!capability) throw new Error("Unknown capability.");
  if (!Number.isInteger(usedCalls) || usedCalls < 0 || usedCalls >= LIMIT) throw new Error("Tool call limit reached.");
  if (!ALLOWED_SCOPES.has(capability.scope)) throw new Error("Invalid capability scope.");
  if (capability.scope !== "public" && !principal?.id) throw new Error("Sign-in required.");
  if (capability.scope === "god" && principal?.role !== "god") throw new Error("Not authorized.");
  if (capability.mutates && (!capability.confirmation || approved !== true)) throw new Error("Approval required.");
  const args = safeInput(input, capability.maxInputBytes);
  const handler = handlers?.[name];
  if (typeof handler !== "function") throw new Error("Capability is not configured.");
  return await handler({input: args, principal});
}
