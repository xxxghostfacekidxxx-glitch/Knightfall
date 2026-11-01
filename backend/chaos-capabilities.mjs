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
