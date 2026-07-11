/* Adapters + sync: engine/data have not drifted from docs, the grounding rule copies
   are aligned, and the Claude plugin manifests are valid JSON. */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const run = (rel) => {
  try { execFileSync("node", [join(ROOT, rel)], { stdio: "pipe" }); return 0; }
  catch (e) { return e.status || 1; }
};
const rd = (p) => readFileSync(join(ROOT, p), "utf8");

test("check-sync: engine/ and data/ match their docs sources", () => {
  assert.equal(run("scripts/check-sync.mjs"), 0);
});

test("check-rule-copies: adapters and invariants aligned", () => {
  assert.equal(run("scripts/check-rule-copies.mjs"), 0);
});

test("Claude plugin manifests are valid JSON", () => {
  for (const f of [".claude-plugin/plugin.json", ".claude-plugin/marketplace.json"]) {
    assert.doesNotThrow(() => JSON.parse(rd(f)), `${f} is not valid JSON`);
  }
  const plugin = JSON.parse(rd(".claude-plugin/plugin.json"));
  assert.equal(plugin.skills, "./skills");
});
