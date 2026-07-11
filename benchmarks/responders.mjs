/* responders.mjs — how a response is obtained for a (task, condition). Four backends,
   strictly separated so an ORACLE output can never be mistaken for a model result:
     oracle  — the engine's correct answer. Labelled 'oracle'. NOT a model. Proves the scorer.
     fixture — a synthetic, hand-authored response in fixtures/ (deterministic, for CI/demo).
     replay  — a real captured model output in captures/.
     live    — a real API call (needs a key; implements the tool loop for engine conditions).
*/
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { correctClaim } from "./skills/build.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CAP = join(ROOT, "benchmarks", "captures");
const FIX = join(ROOT, "benchmarks", "fixtures");

/** The engine-correct answer for a task. Provenance: 'oracle'. */
export function oracleResponse(env, task) {
  switch (task.skill) {
    case "dnd-build": return correctClaim(env, task.reference);
    case "dnd-check": return { findings: (task.mutations || []).map((m) => ({ field: m.field, issue: m.category, correction: String(m.expected) })) };
    case "dnd-lookup": return task.oracle.mode === "exists" && task.oracle.exists === false
      ? { not_found: true, items: [] } : { items: task.oracle.expected || [], not_found: false };
    case "dnd-help": {
      const o = task.oracle || {};
      const skill = (o.acceptable && o.acceptable[0]) || o.expected_skill || "none";
      return { skill, steps: [...(o.require_step_tokens || [])], needs_more_info: !!o.clarify };
    }
    default: throw new Error(`no oracle response for ${task.skill}`);
  }
}

function readIfExists(paths) {
  for (const p of paths) if (existsSync(p)) return { response: JSON.parse(readFileSync(p, "utf8")), source: p.replace(ROOT + "\\", "").replace(ROOT + "/", "") };
  return null;
}
export function fixtureResponse(task, condition) {
  return readIfExists([join(FIX, task.skill, `${condition}.${task.id}.json`), join(FIX, task.skill, `${task.id}.json`)]);
}
export function replayResponse(task, condition, model) {
  return readIfExists([
    join(CAP, task.skill, `${condition}.${model}.${task.id}.json`),
    join(CAP, `${condition}.${model}.${task.id}.json`), // legacy flat (bare.opus.dwarf-fighter.json)
  ]);
}
