import test from "node:test";
import assert from "node:assert/strict";
import {executeChaosCapability} from "./chaos-capabilities.mjs";

const handlers = {
  "site.help": async ({input}) => ({answer: input.topic}),
  "user.memories": async ({principal}) => ({owner: principal.id}),
  "god.diagnostics": async () => ({ok: true}),
  "god.propose_change": async () => ({proposed: true})
};
const run = (name, overrides = {}) => executeChaosCapability({
  name, input: {}, principal: null, handlers, ...overrides
});

test("public read-only capability", async () => {
  assert.deepEqual(await run("site.help", {input: {topic: "arcade"}}), {answer: "arcade"});
});
test("unknown tool rejected", async () => {
  await assert.rejects(run("shell.exec"), /Unknown capability/);
});
test("personal memory requires verified identity", async () => {
  await assert.rejects(run("user.memories"), /Sign-in required/);
  assert.deepEqual(await run("user.memories", {principal: {id: "a"}}), {owner: "a"});
});
test("god tools cannot be called by normal users", async () => {
  await assert.rejects(run("god.diagnostics", {principal: {id: "a", role: "user"}}), /Not authorized/);
});
test("mutations require approval", async () => {
  const principal = {id: "owner", role: "god"};
  await assert.rejects(run("god.propose_change", {principal}), /Approval required/);
  assert.deepEqual(await run("god.propose_change", {principal, approved: true}), {proposed: true});
});
test("tool budget enforced", async () => {
  await assert.rejects(run("site.help", {usedCalls: 3}), /Tool call limit/);
});
test("unconfigured tools fail closed", async () => {
  await assert.rejects(run("site.games"), /not configured/);
});
test("oversized and invalid arguments rejected", async () => {
  await assert.rejects(run("site.help", {input: {topic: "x".repeat(3000)}}), /exceed limit/);
  await assert.rejects(run("site.help", {input: []}), /Invalid tool arguments/);
});
