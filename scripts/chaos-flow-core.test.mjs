import test from "node:test";import assert from "node:assert/strict";import {buildChaosFlow} from "../public/chaos-flow-core.mjs";
test("flow retains all input steps and deterministic output",()=>{const first=buildChaosFlow({steps:"Idea -> Design -> Test"});const again=buildChaosFlow({steps:"Idea -> Design -> Test"});assert.deepEqual(first,again);assert.equal(first.nodes.length,3);assert.match(first.mermaid,/Idea/);assert.match(first.mermaid,/Test/);});

test("flow deduplicates edges and preserves branch layers",()=>{const result=buildChaosFlow({steps:"Idea -> Design -> Test\nIdea -> Design\nDesign -> Review"});assert.equal(result.edges.length,3);assert.deepEqual(result.layers,{N1:0,N2:1,N3:2,N4:2});});
test("flow rejects cycles and unsafe labels",()=>{assert.throws(()=>buildChaosFlow({steps:"A -> B -> A"}),/Cycles/);assert.throws(()=>buildChaosFlow({steps:"A -> <script>"}),/labels/);});
