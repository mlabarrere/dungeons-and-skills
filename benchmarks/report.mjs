#!/usr/bin/env node
/* report.mjs — aggregate benchmarks/results/runs.json into a Markdown report:
   mean errors per (model × arm [× reasoning]), the with/without delta, and the error
   taxonomy. Objective metric = errors per character creation (lower is better).
   Usage: node benchmarks/report.mjs [--out results/<name>.md] */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };

const data = JSON.parse(readFileSync(join(ROOT, "benchmarks", "results", "runs.json"), "utf8"));
const runs = data.runs.filter((r) => r.errors != null);

const key = (r) => `${r.model}|||${r.reasoning}`;
const cells = new Map(); // model|||reasoning -> { arm -> {sum,n} }
const taxonomy = new Map();
for (const r of runs) {
  const c = cells.get(key(r)) || {};
  c[r.arm] = c[r.arm] || { sum: 0, n: 0 };
  c[r.arm].sum += r.errors; c[r.arm].n += 1;
  cells.set(key(r), c);
  if (r.arm === "bare") for (const t of r.tags) taxonomy.set(t, (taxonomy.get(t) || 0) + 1);
}

const mean = (o) => (o && o.n ? (o.sum / o.n) : null);
const fmt = (v) => (v == null ? "—" : v.toFixed(2));

const lines = [];
lines.push(`# Benchmark — errors per character creation`);
lines.push("");
lines.push(`Backend: **${data.meta.backend}** · ${data.meta.reps} rep(s) · generated ${data.meta.when}.`);
lines.push(`Objective metric: **mean rules errors per created character** (deterministic scorer, lower is better).`);
const bareRuns = runs.filter((r) => r.arm === "bare");
const perModel = bareRuns.length > 0 && bareRuns.every((r) => /^bare\.[^.]+\.[^.]+\.json$/.test(r.source || ""));
if (data.meta.backend === "live") lines.push(`\n> Live Anthropic API runs.`);
else if (perModel) lines.push(`\n> Replay of **captured real model outputs** (subagent pilot, models answering from memory with no tools). Grounded outputs are engine-produced (0 by construction). Reproduce/extend with \`node benchmarks/run.mjs --live\`. Method: [benchmarks/README.md](../README.md).`);
else lines.push(`\n> ⚠️ Replay of an **illustrative** typical-mistake fixture (no per-model captures present) — it demonstrates the scoring, not live measurements. Run \`node benchmarks/run.mjs --live\` for real numbers.`);
lines.push("");
lines.push(`## Mean errors per created character`);
lines.push("");
lines.push(`| Model | Reasoning | bare (no skill) | grounded (skill) | reduction |`);
lines.push(`|---|---|--:|--:|--:|`);
for (const [k, arms] of [...cells.entries()].sort()) {
  const [model, reasoning] = k.split("|||");
  const bare = mean(arms.bare), grounded = mean(arms.grounded);
  const red = bare != null && grounded != null && bare > 0 ? `${(100 * (bare - grounded) / bare).toFixed(0)}%` : "—";
  lines.push(`| ${model} | ${reasoning} | ${fmt(bare)} | ${fmt(grounded)} | ${red} |`);
}
lines.push("");
if (taxonomy.size) {
  lines.push(`## Error taxonomy (bare arm)`);
  lines.push("");
  lines.push(`| Error type | Count |`);
  lines.push(`|---|--:|`);
  for (const [tag, n] of [...taxonomy.entries()].sort((a, b) => b[1] - a[1])) lines.push(`| ${tag} | ${n} |`);
  lines.push("");
}
lines.push(`## Per-run detail`);
lines.push("");
lines.push(`| Model | Arm | Reasoning | Task | Errors | Tags |`);
lines.push(`|---|---|---|---|--:|---|`);
for (const r of runs) lines.push(`| ${r.model} | ${r.arm} | ${r.reasoning} | ${r.task} | ${r.errors} | ${r.tags.join(", ") || "—"} |`);
lines.push("");

const out = arg("out", null);
const text = lines.join("\n") + "\n";
if (out) { writeFileSync(join(ROOT, "benchmarks", out), text, "utf8"); console.log(`Wrote benchmarks/${out}`); }
else process.stdout.write(text);
