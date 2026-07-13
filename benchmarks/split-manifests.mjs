#!/usr/bin/env node
// node benchmarks/split-manifests.mjs
// Reads per-model manifests and writes compact per-model-per-condition manifests.
// System prompt is stored once per (condition, skill) combo; tasks only carry user+path.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT  = join(ROOT, "benchmarks", "results");

const models     = ["haiku", "sonnet", "opus"];
const conditions = ["bare", "grounding-only", "skill-engine"];

for (const model of models) {
  const full = JSON.parse(readFileSync(join(OUT, `manifest-${model}.json`), "utf8"));
  for (const cond of conditions) {
    const cells = full.filter(c => c.condition === cond);
    // Deduplicate system prompts: one per skill within this condition
    const systemBySkill = {};
    for (const c of cells) systemBySkill[c.skill] = c.system;
    const compact = {
      model, condition: cond,
      systems: systemBySkill,         // { "dnd-build": "...", "dnd-check": "...", ... }
      tasks: cells.map(c => ({
        skill: c.skill,
        task_id: c.task_id,
        user: c.user,
        capture_path: c.capture_path, // repo-relative
      })),
    };
    const outPath = join(OUT, `manifest-${model}-${cond.replace("-","_")}.json`);
    writeFileSync(outPath, JSON.stringify(compact, null, 2));
    const kb = Math.round(JSON.stringify(compact).length / 1024);
    console.log(`${model}/${cond}: ${cells.length} tasks → ${kb}KB → ${outPath.replace(ROOT+"\\","").replace(ROOT+"/","")}`);
  }
}
