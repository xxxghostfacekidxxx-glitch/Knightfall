import model from "../training/checkpoints/chaos-core-program-selector-001.json" with {type:"json"};
import {select,validateModel} from "../training/chaos-core-program-selector.mjs";
export function selectProgram(spec){return select(model,spec.examples,spec.validation);}
export function selectorStatus(){validateModel(model);return {id:"chaos-core-program-selector-001",architecture:model.architecture,metrics:model.metrics,productionReplacement:false,externalInference:false,notice:"Original trained template ranking, not a general language model. Verification checks all candidates."};}
