import model from "../training/checkpoints/chaos-core-recall-001.json" with {type:"json"};
import {documents} from "../training/chaos-core-recall-corpus.mjs";
import {recall} from "../training/chaos-core-recall.mjs";
export function recallAnswer(question){return recall(model,documents,question);}
