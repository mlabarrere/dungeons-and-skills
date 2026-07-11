/* skills/index.mjs — dispatch a task to its per-skill scorer. Oracle + scorer are
   colocated in each module (no oracles/ vs scorers/ duplication). */
import * as build from "./build.mjs";
import * as check from "./check.mjs";
import * as lookup from "./lookup.mjs";
import * as help from "./help.mjs";

export const SCORERS = { "dnd-build": build, "dnd-check": check, "dnd-lookup": lookup, "dnd-help": help };

export function scoreTask(env, task, response) {
  const mod = SCORERS[task.skill];
  if (!mod) throw new Error(`no scorer for skill "${task.skill}"`);
  return mod.score(env, task, response);
}
