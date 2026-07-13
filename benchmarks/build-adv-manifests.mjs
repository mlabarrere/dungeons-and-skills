#!/usr/bin/env node
// node benchmarks/build-adv-manifests.mjs
// Builds per-model/condition manifests for the adversarial suite only.
import { loadTasks } from "./tasks/load.mjs";
import { buildPrompt } from "./conditions.mjs";
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CAP  = join(ROOT, "benchmarks", "captures");
const OUT  = join(ROOT, "benchmarks", "results");
mkdirSync(OUT, { recursive: true });

const skills    = ["dnd-build", "dnd-check", "dnd-lookup", "dnd-help"];
const models    = ["haiku", "sonnet", "opus"];
const conditions = ["bare", "skill-engine"];

const tasksBySkill = loadTasks({ skills, suite: "full" });
const adversarial  = [];
for (const [skill, tasks] of Object.entries(tasksBySkill))
  for (const t of tasks)
    if (t.suite === "adversarial") adversarial.push({ ...t, skill });

console.log(`Adversarial tasks (${adversarial.length}):`, adversarial.map(t => t.skill + "/" + t.id).join(", "));

for (const model of models) {
  for (const cond of conditions) {
    const tasks = adversarial.map(t => {
      const { system, user } = buildPrompt(cond, t);
      const capPath = join(CAP, t.skill, `${cond}.${model}.${t.id}.json`);
      return { skill: t.skill, task_id: t.id, condition: cond, model, system, user,
               capture_path: capPath.replace(ROOT + "\\", "").replace(ROOT + "/", ""),
               capture_abs: capPath, exists: existsSync(capPath) };
    });
    const slug = cond.replace("-", "_");
    const outPath = join(OUT, `manifest-adv-${model}-${slug}.json`);
    writeFileSync(outPath, JSON.stringify({ model, condition: cond, suite: "adversarial", tasks }, null, 2));
    const missing = tasks.filter(t => !t.exists).length;
    console.log(`${model}/${cond}: ${tasks.length} tasks, ${missing} missing -> ${outPath.replace(ROOT + "\\", "")}`);
  }
}
