import {executeChaosCapability} from "./chaos-capabilities.mjs";
import {publicChaosHandlers} from "./chaos-public-tools.mjs";
import {chaosCalculate,chaosWordCount,chaosConvert} from "./chaos-utilities.mjs";
import {checkChaosContrast,scaleChaosPattern} from "./chaos-design-tools.mjs";
import {inspectChaosCode} from "./chaos-code-inspect.mjs";
import {formatChaosCode,buildChaosFlow} from "./chaos-code-format.mjs";
import {compareChaosCode,validateChaosJSON} from "./chaos-dev-utilities.mjs";

/**
 * Worker-side bridge for explicit tool calls. The Worker must supply a
 * VERIFIED principal from its own session and add private handlers itself.
 * Never trust a role, approval, or principal supplied by the model or browser.
 */
export async function dispatchChaosTool({name,input,principal,handlers={},approved=false,usedCalls=0}) {
  const trustedHandlers = {...publicChaosHandlers,"utility.calculate":async ({input})=>chaosCalculate(input),"utility.word_count":async ({input})=>chaosWordCount(input),"utility.convert":async ({input})=>chaosConvert(input),"design.color_contrast":async ({input})=>checkChaosContrast(input),"forge.scale_pattern":async ({input})=>scaleChaosPattern(input),"dev.code_inspect":async ({input})=>inspectChaosCode(input),"dev.code_format":async ({input})=>formatChaosCode(input),"dev.diagram_flow":async ({input})=>buildChaosFlow(input),"dev.code_diff":async ({input})=>compareChaosCode(input),"dev.json_shape":async ({input})=>validateChaosJSON(input),...handlers};
  return executeChaosCapability({name,input,principal,handlers:trustedHandlers,approved,usedCalls});
}
export function describeChaosTools(principal) {
  const publicTools = ["site.help","site.games","site.search","utility.calculate","utility.word_count","utility.convert","forge.pattern_draft","forge.material_estimate","design.color_contrast","forge.scale_pattern","dev.code_inspect","research.github_repos","dev.code_format","dev.diagram_flow","dev.code_diff","dev.json_shape"];
  if (principal?.id) publicTools.push("user.memories","user.notes","user.handoff","user.notifications","user.profile","user.inbox","radar.moon","radar.shadow","research.wikipedia","utility.now");
  if (principal?.id && principal.role==="god") publicTools.push("god.diagnostics","god.audit_summary","god.github_health","god.propose_change");
  return publicTools;
}
