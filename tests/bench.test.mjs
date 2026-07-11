/* The benchmark's measuring instrument must itself be correct: a grounded (engine)
   output scores 0 errors, and a typical ungrounded output scores the expected errors
   with the expected taxonomy. If the scorer drifts, the whole benchmark is worthless. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadAll } from "../benchmarks/lib.mjs";
import { score } from "../benchmarks/scorer.mjs";
import { TASKS } from "../benchmarks/tasks.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const cap = (arm, id) => JSON.parse(readFileSync(join(ROOT, "benchmarks", "captures", `${arm}.${id}.json`), "utf8"));
const env = await loadAll();

for (const t of TASKS) {
  test(`grounded ${t.id} scores 0 errors`, () => {
    assert.equal(score(env, t, cap("grounded", t.id)).errors, 0);
  });
  test(`bare-typical ${t.id} scores > 0 errors`, () => {
    const r = score(env, t, cap("bare-typical", t.id));
    assert.ok(r.errors >= 4, `expected several errors, got ${r.errors}`);
    assert.ok(r.findings.some((f) => f.tag.startsWith("math")), "expected a math error");
  });
}

test("scorer flags an invented (wrong-edition) skill", () => {
  const claim = { ...cap("grounded", "dwarf-fighter"), skillProficiencies: ["athletisme", "intimidation", "perception", "sleight-of-hand-2014"] };
  const r = score(env, TASKS.find((t) => t.id === "dwarf-fighter"), claim);
  assert.ok(r.findings.some((f) => f.tag === "invented-skill"));
});
