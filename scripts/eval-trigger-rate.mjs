#!/usr/bin/env node
/* ==========================================================================
   eval-trigger-rate.mjs — measure the trigger-query accuracy of a skill.

   Reads the skill's trigger_queries.json, counts train and validation
   queries by should_trigger value, and prints:
     • query counts per split and expected label
     • a baseline random-guess accuracy (proportion of the majority class)
     • the accuracy a perfect description would achieve on each split

   This runner does NOT call a live model; it reports the difficulty of the
   grading problem so the description writer can see whether the label
   distribution is balanced and how far the random baseline is from perfect.

   Usage:
     node scripts/eval-trigger-rate.mjs [skill-name]
     node scripts/eval-trigger-rate.mjs          # reports all skills
     node scripts/eval-trigger-rate.mjs dnd-build

   Exit codes:
     0  success
     1  skill not found or malformed trigger_queries.json
   ========================================================================== */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function listSkills() {
  return readdirSync(join(ROOT, "skills"), { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(ROOT, "skills", e.name, "SKILL.md")))
    .map((e) => e.name)
    .sort();
}

function analyzeSkill(skill) {
  const path = join(ROOT, "skills", skill, "evals", "trigger_queries.json");
  if (!existsSync(path)) {
    console.error(`  ${skill}: no evals/trigger_queries.json`);
    return null;
  }

  let data;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    console.error(`  ${skill}: malformed JSON — ${e.message}`);
    return null;
  }

  const splits = { train: data.train || [], validation: data.validation || [] };
  const result = { skill, splits: {} };

  for (const [name, queries] of Object.entries(splits)) {
    const pos = queries.filter((q) => q.should_trigger === true).length;
    const neg = queries.filter((q) => q.should_trigger === false).length;
    const total = pos + neg;
    const majorityClass = Math.max(pos, neg) / total;
    result.splits[name] = { total, pos, neg, majorityClass };
  }

  return result;
}

function fmt(n) {
  return (n * 100).toFixed(1) + "%";
}

function report(result) {
  if (!result) return;
  const { skill, splits } = result;
  console.log(`\n  ${skill}`);
  console.log(`  ${"─".repeat(50)}`);

  for (const [name, stats] of Object.entries(splits)) {
    const { total, pos, neg, majorityClass } = stats;
    if (total === 0) {
      console.log(`    ${name.padEnd(12)} (empty)`);
      continue;
    }
    const balance = pos === neg ? "balanced" : (pos > neg ? `+${pos - neg} pos-heavy` : `+${neg - pos} neg-heavy`);
    console.log(
      `    ${name.padEnd(12)} total=${total}  pos=${pos}  neg=${neg}  (${balance})` +
      `\n                 random-baseline=${fmt(majorityClass)}  perfect-score=100%`
    );
  }

  const trainTotal = splits.train?.total || 0;
  const valTotal = splits.validation?.total || 0;
  const grand = trainTotal + valTotal;
  if (grand > 0) {
    const ratio = trainTotal / grand;
    const expected = Math.abs(ratio - 0.6) < 0.05 ? "✔" : `⚠ (expected ~60/40, got ${fmt(ratio)}/${fmt(1 - ratio)})`;
    console.log(`    split ratio: train=${fmt(ratio)} / val=${fmt(1 - ratio)}  ${expected}`);
  }
}

const args = process.argv.slice(2);
const skills = args.length > 0 ? args : listSkills();

let failed = false;
console.log("eval-trigger-rate: skill trigger-query difficulty report");
console.log("=".repeat(60));

for (const skill of skills) {
  if (!existsSync(join(ROOT, "skills", skill, "SKILL.md"))) {
    console.error(`skill "${skill}" not found in skills/`);
    failed = true;
    continue;
  }
  const result = analyzeSkill(skill);
  report(result);
  if (!result) failed = true;
}

console.log("\n" + "=".repeat(60));
console.log(
  "Note: random-baseline = majority-class accuracy (the rate a\n" +
  "classifier that always predicts the majority label achieves).\n" +
  "A good description beats this baseline on both splits."
);

process.exit(failed ? 1 : 0);
