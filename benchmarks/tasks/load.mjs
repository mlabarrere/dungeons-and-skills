/* tasks/load.mjs — load the versioned task corpora from benchmarks/tasks/<skill>/*.json. */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const SUITE_CAP = { pilot: 10, full: Infinity };

export function loadTasks({ skills, suite = "full", taskIds = null } = {}) {
  const out = {};
  for (const skill of skills) {
    const dir = join(HERE, skill);
    if (!existsSync(dir)) { out[skill] = []; continue; }
    let tasks = readdirSync(dir).filter((f) => f.endsWith(".json")).sort()
      .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));
    if (taskIds) tasks = tasks.filter((t) => taskIds.includes(t.id));
    const cap = SUITE_CAP[suite] ?? Infinity;
    out[skill] = tasks.slice(0, cap);
  }
  return out;
}
