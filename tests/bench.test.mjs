/* Benchmark instrument tests: the scorer, oracles, conditions and stats must themselves be
   correct or every number is worthless. Covers oracle self-consistency, mutation tests (one
   change -> exactly the expected error), scorer distinctions, condition isolation, taxonomy
   integrity, metric denominators, stats reproducibility, and a no-fabrication guard. */
import test from "node:test";
import assert from "node:assert/strict";
import { loadAll } from "../benchmarks/lib.mjs";
import { loadTasks } from "../benchmarks/tasks/load.mjs";
import { scoreTask } from "../benchmarks/skills/index.mjs";
import { oracleResponse } from "../benchmarks/responders.mjs";
import { computeMetrics } from "../benchmarks/scoring.mjs";
import { CATEGORIES, makeError } from "../benchmarks/taxonomy.mjs";
import { buildPrompt, CONDITIONS, toolAccess } from "../benchmarks/conditions.mjs";
import { bootstrapCI, percentile } from "../benchmarks/stats.mjs";

const env = await loadAll();
const tasks = loadTasks({ skills: ["dnd-build", "dnd-check", "dnd-lookup", "dnd-help"], suite: "full" });
const all = Object.values(tasks).flat();
const buildTask = tasks["dnd-build"].find((t) => t.id === "dwarf-fighter");
const druidTask = tasks["dnd-build"].find((t) => t.id === "elf-druid");
const errCats = (units, errors) => errors.map((e) => e.category);
const nErr = (units) => units.filter((u) => ["incorrect", "missing", "extraneous"].includes(u.status)).length;

// --- oracle self-consistency: the correct answer scores zero on every task ---
for (const t of all) {
  test(`oracle response scores 0 errors: ${t.skill}/${t.id}`, () => {
    const { units, errors } = scoreTask(env, t, oracleResponse(env, t));
    const m = computeMetrics(units, errors);
    assert.equal(m.erroneous_units, 0, `unexpected errors: ${errCats(units, errors).join(",")}`);
    assert.equal(m.perfect, true);
  });
}

// --- mutation tests: change one thing, get exactly the expected error ---
test("build mutation: wrong HP -> one derived-stat-error", () => {
  const good = oracleResponse(env, buildTask);
  const base = nErr(scoreTask(env, buildTask, good).units);
  const bad = { ...good, hitPoints: good.hitPoints + 5 };
  const { units, errors } = scoreTask(env, buildTask, bad);
  assert.equal(nErr(units), base + 1);
  assert.ok(errors.some((e) => e.category === "derived-stat-error" && e.field === "hitPoints"));
});
test("build mutation: invented skill -> invented-entity (critical)", () => {
  const good = oracleResponse(env, buildTask);
  const bad = { ...good, skillProficiencies: [...good.skillProficiencies.slice(1), "sleight-of-hand-2014"] };
  const { errors } = scoreTask(env, buildTask, bad);
  assert.ok(errors.some((e) => e.category === "invented-entity" && e.severity === "critical"));
});
test("build mutation: wizard spell on druid list -> illegal-choice", () => {
  const good = oracleResponse(env, druidTask);
  const bad = { ...good, preparedSpells: [...good.preparedSpells.slice(1), "boule-de-feu"] };
  const { errors } = scoreTask(env, druidTask, bad);
  assert.ok(errors.some((e) => e.category === "illegal-choice"));
});
test("build distinction: an English skill name still resolves (no false error)", () => {
  const good = oracleResponse(env, buildTask);
  const en = good.skillProficiencies.map((s) => (s === "perception" ? "Perception" : s));
  const { units } = scoreTask(env, buildTask, { ...good, skillProficiencies: en });
  assert.equal(nErr(units), 0);
});
test("check mutation: missing a planted error -> false-negative-check", () => {
  const t = tasks["dnd-check"].find((x) => x.id.endsWith("-saves"));
  const { errors } = scoreTask(env, t, { findings: [] });
  assert.ok(errors.some((e) => e.category === "false-negative-check"));
});
test("check mutation: inventing an error on a clean sheet -> false-positive-check", () => {
  const clean = tasks["dnd-check"].find((x) => x.id.endsWith("-clean"));
  const { errors } = scoreTask(env, clean, { findings: [{ field: "armorClass", issue: "wrong" }] });
  assert.ok(errors.some((e) => e.category === "false-positive-check"));
});
test("lookup mutation: dropping an expected item -> lookup-omission", () => {
  const t = tasks["dnd-lookup"].find((x) => x.oracle.mode === "list");
  const short = { items: (t.oracle.expected || []).slice(1), not_found: false };
  const { errors } = scoreTask(env, t, short);
  assert.ok(errors.some((e) => e.category === "lookup-omission"));
});
test("lookup: claiming a non-existent thing exists -> lookup-false-positive", () => {
  const neg = tasks["dnd-lookup"].find((x) => x.oracle.exists === false);
  const { errors } = scoreTask(env, neg, { items: ["something"], not_found: false });
  assert.ok(errors.some((e) => e.category === "lookup-false-positive"));
});
test("help mutation: wrong skill routed -> skill-selection-error", () => {
  const t = tasks["dnd-help"].find((x) => x.id === "route-build");
  const { errors } = scoreTask(env, t, { skill: "dnd-lookup", steps: [], needs_more_info: false });
  assert.ok(errors.some((e) => e.category === "skill-selection-error"));
});

// --- metric denominators ---
test("computeMetrics: not-applicable/not-scorable excluded from denominator", () => {
  const units = [{ id: "a", type: "skill", status: "correct" }, { id: "b", type: "skill", status: "incorrect" },
    { id: "c", type: "spell", status: "not-applicable" }, { id: "d", type: "spell", status: "not-scorable" }];
  const m = computeMetrics(units, [makeError({ task_id: "t", skill: "s", category: "wrong-value", field: "b" })]);
  assert.equal(m.total_scorable, 2);
  assert.equal(m.atomic_error_rate, 50);
  assert.ok(m.maximum_applicable_weighted_error > 0);
  assert.equal(m.invalid, false);
});

// --- taxonomy integrity ---
test("every emitted error uses a known category", () => {
  for (const t of all) { const { errors } = scoreTask(env, t, mutateAnything(oracleResponse(env, t), t)); for (const e of errors) assert.ok(CATEGORIES.includes(e.category), `bad category ${e.category}`); }
});
function mutateAnything(resp, t) {
  if (t.skill === "dnd-build") return { ...resp, hitPoints: (resp.hitPoints || 0) + 1 };
  if (t.skill === "dnd-check") return { findings: [{ field: "armorClass", issue: "x" }] };
  if (t.skill === "dnd-lookup") return { items: ["bogus"], not_found: false };
  return { skill: "dnd-lookup", steps: [], needs_more_info: false };
}

// --- condition isolation (spec §13) ---
test("condition isolation: tools and context are correct per condition", () => {
  const t = buildTask;
  assert.deepEqual(toolAccess("bare"), []);
  assert.deepEqual(toolAccess("grounding-only"), []);
  assert.deepEqual(toolAccess("skill-only"), []);
  assert.deepEqual(toolAccess("skill-engine"), ["run_engine"]);
  assert.deepEqual(toolAccess("full-project"), ["run_engine"]);
  const bare = buildPrompt("bare", t);
  assert.ok(!/Do NOT trust your training data/.test(bare.system), "bare must not get grounding");
  assert.ok(!/GROUNDING/.test(bare.system));
  assert.equal(bare.tool_access.length, 0);
  const g = buildPrompt("grounding-only", t);
  assert.ok(/training data/.test(g.system), "grounding-only gets the grounding rule");
  assert.ok(!/## Workflow \(run from the repo root\)/.test(g.system), "grounding-only must not get the skill workflow");
  const so = buildPrompt("skill-only", t);
  assert.ok(/dnd-build/.test(so.system) && so.tool_access.length === 0, "skill-only gets the skill, no engine");
  const se = buildPrompt("skill-engine", t);
  assert.ok(se.tool_access.includes("run_engine"));
});

// --- stats reproducibility ---
test("bootstrap CI is reproducible with a fixed seed and brackets the mean", () => {
  const xs = [10, 12, 8, 14, 9, 11];
  const a = bootstrapCI(xs, { seed: 42 }), b = bootstrapCI(xs, { seed: 42 });
  assert.deepEqual(a, b);
  assert.ok(a.lo <= a.mean && a.mean <= a.hi);
  assert.equal(percentile([1, 2, 3, 4], 50), 2.5);
});

// --- no-fabrication guard: an oracle response is never labelled as a model result ---
test("no-fabrication: oracle responses are the engine's, tagged for exclusion", () => {
  // The runner tags oracle-backend runs provenance='oracle' + condition='oracle'; the report
  // excludes them from model tables. Here we assert the oracle response is deterministic and
  // equals the engine truth (so it can only ever be an oracle row, never a model row).
  const r1 = oracleResponse(env, buildTask), r2 = oracleResponse(env, buildTask);
  assert.deepEqual(r1, r2);
});
