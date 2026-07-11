#!/usr/bin/env node
/* report.mjs — aggregate a runs.<id>.json into Markdown: per skill × model × condition ×
   reasoning, with bootstrap 95% CIs and explicit n; error taxonomy; check precision/recall/F1;
   quality–speed–cost when the backend captured it; and a paired ablation table. ORACLE runs are
   labelled a self-consistency check, never model performance. Nothing is fabricated: only the
   `status:"ok"` rows are aggregated, and the header states the backend + provenance + limits.
   Usage: node benchmarks/report.mjs --in results/runs.<id>.json --out reports/<name>.md */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { aggregate } from "./scoring.mjs";
import { bootstrapCI, percentiles } from "./stats.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RES = join(ROOT, "benchmarks", "results");
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };

const inPath = arg("in") ? join(ROOT, arg("in")) : join(RES, readdirSync(RES).filter((f) => f.startsWith("runs.") && f.endsWith(".json")).sort().pop());
const data = JSON.parse(readFileSync(inPath, "utf8"));
const ok = data.runs.filter((r) => r.status === "ok");
const meta = data.meta || {};
const isOracle = meta.backend === "oracle";
const f1 = (x) => (x == null || Number.isNaN(x) ? "—" : x.toFixed(1));
const groupBy = (rows, keyFn) => { const m = new Map(); for (const r of rows) { const k = keyFn(r); (m.get(k) || m.set(k, []).get(k)).push(r); } return m; };

const L = [];
L.push(`# Benchmark report`);
L.push("");
L.push(`- **Backend:** ${meta.backend}${isOracle ? " — ⚠️ ORACLE self-consistency check, **not** model performance" : ""}`);
L.push(`- **Scored runs (status=ok):** ${ok.length} of ${data.runs.length}`);
L.push(`- **Provenance:** git ${String(meta.git_commit).slice(0, 8)}${meta.dirty_worktree ? " (dirty)" : ""} · catalogue ${meta.catalogue_version} · engine ${meta.engine_version} · scorer ${meta.scorer_version} · tasks ${meta.task_set_version} · seed ${meta.seed}`);
L.push(`- **When:** ${meta.started_at} → ${meta.finished_at || "?"}`);
const notRun = data.runs.filter((r) => r.status === "not-run").length, notSup = data.runs.filter((r) => r.status === "not-supported").length;
if (notRun || notSup) L.push(`- **Not run:** ${notRun} (no capture) · **Not supported:** ${notSup} (reasoning level absent) — excluded, never estimated.`);
L.push("");
L.push(`Objective metric: **atomic error rate** = erroneous scorable units / total scorable units (not-applicable & not-scorable excluded). Lower is better. 95% CIs are bootstrap; small pilots are exploratory.`);
L.push("");

// Main table: skill × model × condition × reasoning
L.push(`## Error rate by skill × model × condition`);
L.push("");
L.push(`| Skill | Model | Condition | Reason | n | Atomic err % [95% CI] | Weighted % | Perfect % | Invalid % | Mean err |`);
L.push(`|---|---|---|---|--:|---|--:|--:|--:|--:|`);
const groups = groupBy(ok, (r) => `${r.skill}|${r.model}|${r.condition}|${r.reasoning}`);
for (const [k, rows] of [...groups.entries()].sort()) {
  const [skill, model, cond, reason] = k.split("|");
  const rates = rows.map((r) => r.metrics.atomic_error_rate);
  const ci = bootstrapCI(rates, { seed: meta.seed || 1 });
  const agg = aggregate(rows.map((r) => r.metrics));
  L.push(`| ${skill} | ${model} | ${cond} | ${reason} | ${rows.length} | ${f1(agg.mean_atomic_error_rate)} [${f1(ci.lo)}–${f1(ci.hi)}] | ${f1(agg.mean_weighted_error_rate)} | ${f1(agg.perfect_rate)} | ${f1(agg.invalid_rate)} | ${agg.mean_errors_per_response.toFixed(2)} |`);
}
L.push("");

// dnd-check detection metrics
const checkRows = ok.filter((r) => r.skill === "dnd-check" && r.extra && r.extra.detection);
if (checkRows.length) {
  L.push(`## dnd-check detection (precision / recall / F1)`);
  L.push("");
  L.push(`| Model | Condition | n | Precision | Recall | F1 |`);
  L.push(`|---|---|--:|--:|--:|--:|`);
  for (const [k, rows] of [...groupBy(checkRows, (r) => `${r.model}|${r.condition}`).entries()].sort()) {
    const [model, cond] = k.split("|");
    const avg = (f) => rows.reduce((s, r) => s + f(r), 0) / rows.length;
    L.push(`| ${model} | ${cond} | ${rows.length} | ${f1(100 * avg((r) => r.extra.detection.precision))} | ${f1(100 * avg((r) => r.extra.detection.recall))} | ${f1(100 * avg((r) => r.extra.detection.f1))} |`);
  }
  L.push("");
}

// Taxonomy
const allErrors = ok.flatMap((r) => r.errors || []);
if (allErrors.length) {
  const byCat = {}, bySev = {};
  for (const e of allErrors) { byCat[e.category] = (byCat[e.category] || 0) + 1; bySev[e.severity] = (bySev[e.severity] || 0) + 1; }
  const roots = allErrors.filter((e) => e.root_cause).length;
  L.push(`## Error taxonomy (${allErrors.length} events · ${roots} root causes · ${allErrors.length - roots} cascade symptoms)`);
  L.push("");
  L.push(`| Category | Count | | Severity | Count |`);
  L.push(`|---|--:|---|---|--:|`);
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const sevs = Object.entries(bySev).sort((a, b) => b[1] - a[1]);
  for (let i = 0; i < cats.length; i++) L.push(`| ${cats[i][0]} | ${cats[i][1]} | | ${sevs[i] ? sevs[i][0] : ""} | ${sevs[i] ? sevs[i][1] : ""} |`);
  L.push("");
}

// Quality–speed–cost (only if captured, i.e. live backend)
const timed = ok.filter((r) => r.timing && r.timing.total_ms != null);
if (timed.length) {
  L.push(`## Quality, speed and cost`);
  L.push("");
  L.push(`| Model | Condition | n | Atomic err % | Latency p50 (ms) | p95 (ms) | Mean cost $ |`);
  L.push(`|---|---|--:|--:|--:|--:|--:|`);
  for (const [k, rows] of [...groupBy(timed, (r) => `${r.model}|${r.condition}`).entries()].sort()) {
    const [model, cond] = k.split("|");
    const lat = percentiles(rows.map((r) => r.timing.total_ms));
    const err = aggregate(rows.map((r) => r.metrics)).mean_atomic_error_rate;
    const cost = rows.filter((r) => r.cost != null);
    const meanCost = cost.length ? cost.reduce((s, r) => s + r.cost, 0) / cost.length : null;
    L.push(`| ${model} | ${cond} | ${rows.length} | ${f1(err)} | ${lat.p50.toFixed(0)} | ${lat.p95.toFixed(0)} | ${meanCost == null ? "—" : meanCost.toFixed(4)} |`);
  }
  L.push("");
}

// Paired ablation (bare vs skill-engine on the same tasks), per skill/model
const conds = [...new Set(ok.map((r) => r.condition))];
if (conds.includes("bare") && (conds.includes("skill-engine") || conds.includes("skill-only"))) {
  const target = conds.includes("skill-engine") ? "skill-engine" : "skill-only";
  L.push(`## Ablation — bare vs ${target} (paired on the same tasks)`);
  L.push("");
  L.push(`| Skill | Model | n pairs | bare err % | ${target} err % | Δ abs (pts) | Δ rel |`);
  L.push(`|---|---|--:|--:|--:|--:|--:|`);
  for (const [k, rows] of [...groupBy(ok, (r) => `${r.skill}|${r.model}`).entries()].sort()) {
    const [skill, model] = k.split("|");
    const byTask = groupBy(rows, (r) => r.task);
    const bare = [], skl = [];
    for (const [, trs] of byTask) {
      const b = trs.find((r) => r.condition === "bare"), s = trs.find((r) => r.condition === target);
      if (b && s) { bare.push(b.metrics.atomic_error_rate); skl.push(s.metrics.atomic_error_rate); }
    }
    if (!bare.length) continue;
    const mb = bare.reduce((a, c) => a + c, 0) / bare.length, ms = skl.reduce((a, c) => a + c, 0) / skl.length;
    L.push(`| ${skill} | ${model} | ${bare.length} | ${f1(mb)} | ${f1(ms)} | ${f1(mb - ms)} | ${mb > 0 ? f1(100 * (mb - ms) / mb) + "%" : "—"} |`);
  }
  L.push("");
}

L.push(`---`);
L.push(`_Generated from \`${inPath.replace(ROOT, ".")}\`. Aggregates only status=ok rows. ${isOracle ? "Oracle self-consistency — not a model result." : "Real model rows come from the stated backend; see AUDIT.md."}_`);

const out = arg("out");
const text = L.join("\n") + "\n";
if (out) { mkdirSync(dirname(join(ROOT, "benchmarks", out)), { recursive: true }); writeFileSync(join(ROOT, "benchmarks", out), text, "utf8"); console.log(`Wrote benchmarks/${out}`); }
else process.stdout.write(text);
