#!/usr/bin/env node
/* ci-guard.mjs — the no-fabrication + self-consistency gate for CI.
   1. The deterministic ORACLE run must be perfectly clean (0 erroneous units on every task):
      if the oracle disagrees with itself, the scorer is broken.
   2. Every oracle-backend row must be labelled provenance="oracle" and condition="oracle"
      — an engine output can never masquerade as a model result (spec §3, §13).
   Reads the latest results/runs.*-oracle.json (written by the CI oracle step). Exit non-zero
   on any violation. No API, no network. */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RES = join(ROOT, "benchmarks", "results");
const files = readdirSync(RES).filter((f) => f.endsWith("-oracle.json")).sort();
if (!files.length) { console.error("ci-guard: no oracle run found (run the oracle backend first)"); process.exit(1); }
const data = JSON.parse(readFileSync(join(RES, files[files.length - 1]), "utf8"));

let fail = 0;
for (const r of data.runs) {
  if (r.status !== "ok") { console.error(`ci-guard: oracle run not ok: ${r.skill}/${r.task} (${r.status})`); fail++; continue; }
  if (r.metrics.erroneous_units !== 0) { console.error(`ci-guard: oracle NOT self-consistent: ${r.skill}/${r.task} has ${r.metrics.erroneous_units} errors`); fail++; }
  if (r.provenance !== "oracle" || r.condition !== "oracle") { console.error(`ci-guard: oracle row mislabelled (${r.provenance}/${r.condition}) — would fabricate a model result`); fail++; }
}
if (fail) { console.error(`ci-guard FAILED (${fail} issue(s)).`); process.exit(1); }
console.log(`ci-guard OK: ${data.runs.length} oracle rows self-consistent and correctly labelled.`);
