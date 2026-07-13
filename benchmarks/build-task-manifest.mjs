#!/usr/bin/env node
// node benchmarks/build-task-manifest.mjs [--conditions bare,grounding-only,skill-engine] [--models haiku,sonnet,opus] [--missing-only]
// Emits per-model JSONL manifests to benchmarks/results/manifest-<model>.json
// Each entry: { skill, task_id, condition, system, user, capture_path, exists }
import { existsSync, writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadTasks } from "./tasks/load.mjs";
import { buildPrompt } from "./conditions.mjs";

const ROOT  = join(dirname(fileURLToPath(import.meta.url)), "..");
const CAP   = join(ROOT, "benchmarks", "captures");
const OUT   = join(ROOT, "benchmarks", "results");

const arg  = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i+1] : d; };
const list = (v, d) => v ? String(v).split(",") : d;

const conditions = list(arg("conditions"), ["bare", "grounding-only", "skill-engine"]);
const models     = list(arg("models"),     ["haiku", "sonnet", "opus"]);
const skills     = list(arg("skills"),     ["dnd-build", "dnd-check", "dnd-lookup", "dnd-help"]);
const missingOnly = process.argv.includes("--missing-only");

const tasksBySkill = loadTasks({ skills, suite: "pilot" });
mkdirSync(OUT, { recursive: true });

let total = 0, missing = 0;
const perModel = {};
for (const model of models) perModel[model] = [];

for (const skill of skills) {
  for (const task of (tasksBySkill[skill] || [])) {
    for (const condition of conditions) {
      const { system, user } = buildPrompt(condition, task);
      for (const model of models) {
        const capPath = join(CAP, skill, `${condition}.${model}.${task.id}.json`);
        const exists  = existsSync(capPath);
        total++;
        if (!exists) missing++;
        if (missingOnly && exists) continue;
        perModel[model].push({ skill, task_id: task.id, condition, system, user,
          capture_path: capPath.replace(ROOT + "\\", "").replace(ROOT + "/", ""),
          exists });
      }
    }
  }
}

for (const model of models) {
  const path = join(OUT, `manifest-${model}.json`);
  writeFileSync(path, JSON.stringify(perModel[model], null, 2));
  console.log(`${model}: ${perModel[model].length} cells → ${path.replace(ROOT+"\\","").replace(ROOT+"/","")}`);
}
console.log(`\nTotal cells: ${total} | Missing: ${missing} | Already captured: ${total - missing}`);
