import {repairSource} from "./chaos-core-source-repair.mjs";
import {translatePython} from "./chaos-forge-python.mjs";
import {translateControlJavaScript} from "./chaos-forge-javascript-control.mjs";
import {compileLogic,runLogic} from "./chaos-forge-logic.mjs";
export function repairNumericSource(task){const translate=task?.language==="python"?translatePython:translateControlJavaScript;return repairSource(task,input=>compileLogic(translate(input)),runLogic);}
