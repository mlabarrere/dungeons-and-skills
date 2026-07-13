#!/usr/bin/env node
// node benchmarks/merge.mjs results/A.json results/B.json results/C.json
// Concatenates .runs[] from each file and writes benchmarks/results/runs.merged-v1.json
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT  = join(ROOT, "benchmarks", "results");

const files = process.argv.slice(2);
if (!files.length) { console.error("Usage: node benchmarks/merge.mjs <file1.json> [file2.json ...]"); process.exit(1); }

const parsed = files.map(f => JSON.parse(readFileSync(f.startsWith("/") || f.match(/^[A-Z]:/i) ? f : join(ROOT, f), "utf8")));
const runs   = parsed.flatMap(p => p.runs);
const meta   = { ...parsed[0].meta, merged_from: files, merged_at: new Date().toISOString() };

const outPath = join(OUT, "runs.merged-v1.json");
writeFileSync(outPath, JSON.stringify({ meta, runs }, null, 2));
console.log(`Merged ${runs.length} runs from ${files.length} files → ${outPath}`);
