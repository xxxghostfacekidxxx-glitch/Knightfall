import {executeChaosCapability} from "./chaos-capabilities.mjs";
import {publicChaosHandlers} from "./chaos-public-tools.mjs";
import {chaosCalculate,chaosWordCount} from "./chaos-utilities.mjs";

/**
 * Worker-side bridge for explicit tool calls. The Worker must supply a
 * VERIFIED principal from its own session and add private handlers itself.
 * Never trust a role, approval, or principal supplied by the model or browser.
 */
export async function dispatchChaosTool({name,input,principal,handlers={},approved=false,usedCalls=0}) {
  const trustedHandlers = {...publicChaosHandlers,"utility.calculate":async ({input})=>chaosCalculate(input),"utility.word_count":async ({input})=>chaosWordCount(input),...handlers};
  return executeChaosCapability({name,input,principal,handlers:trustedHandlers,approved,usedCalls});
}
export function describeChaosTools(principal) {
  const publicTools = ["site.help","site.games","site.search","utility.calculate","utility.word_count"];
  if (principal?.id) publicTools.push("user.memories");
  if (principal?.id && principal.role==="god") publicTools.push("god.diagnostics","god.audit_summary","god.propose_change");
  return publicTools;
}
