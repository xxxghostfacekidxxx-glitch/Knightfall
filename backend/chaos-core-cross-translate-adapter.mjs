import {crossTranslate} from "./chaos-core-cross-translate.mjs";
import {translatePython} from "./chaos-forge-python.mjs";
import {translateControlJavaScript} from "./chaos-forge-javascript-control.mjs";
import {compileLogic,runLogic} from "./chaos-forge-logic.mjs";
const compiler=lang=>input=>compileLogic((lang==="python"?translatePython:translateControlJavaScript)(input));
export function translateNumericSource(task){return crossTranslate(task,compiler(task?.language),compiler(task?.target),runLogic);}
