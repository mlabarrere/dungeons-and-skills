/* conditions.mjs — the five experimental conditions and their ISOLATION (spec §4, §13).

   The difference between conditions is exactly (a) what context is injected and (b) which
   tools the model may call. Isolation is enforced here and asserted by tests:
     bare            no grounding, no skill, no engine/files       tools: []
     grounding-only  grounding preamble only                       tools: []
     skill-only      the skill's protocol, but no engine           tools: []
     skill-engine    the skill + the deterministic engine          tools: [run_engine]
     full-project    all skills + engine; the model must route     tools: [run_engine]

   Engine output is a tool result the model interprets — never injected as the answer. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const rd = (p) => readFileSync(join(ROOT, p), "utf8");

export const CONDITIONS = ["bare", "grounding-only", "skill-only", "skill-engine", "full-project"];
export const CONDITION_SPEC = {
  "bare":           { grounding: false, skill: "none", engine: false },
  "grounding-only": { grounding: true,  skill: "none", engine: false },
  "skill-only":     { grounding: true,  skill: "task", engine: false },
  "skill-engine":   { grounding: true,  skill: "task", engine: true },
  "full-project":   { grounding: true,  skill: "all",  engine: true },
};
export const toolAccess = (condition) => (CONDITION_SPEC[condition].engine ? ["run_engine"] : []);

export const RESPONSE_FORMATS = {
  "dnd-build": `Output ONLY one JSON object: {"class","species","lineage","background","abilityScores":{"for","dex","con","int","sag","cha"},"proficiencyBonus","armorClass","hitPoints","passivePerception","savingThrowProficiencies":[...],"skillProficiencies":[...],"cantrips":[...],"preparedSpells":[...],"fightingStyle"}`,
  "dnd-check": `Output ONLY one JSON object: {"findings":[{"field":"...","issue":"...","correction":"..."}]}. If the sheet is correct, return {"findings":[]}.`,
  "dnd-lookup": `Output ONLY one JSON object: {"items":[names or ids],"not_found":false,"answer":"..."}. If the thing is not in the catalogue, set "not_found":true and "items":[].`,
  "dnd-help": `Output ONLY one JSON object: {"skill":"dnd-build|dnd-check|dnd-lookup|dnd-help|none","steps":["..."],"needs_more_info":false}`,
};

function groundingText() {
  const a = rd("AGENTS.md").replace(/\r\n/g, "\n");
  const m = a.match(/## GROUNDING[\s\S]*?(?=\n## Workflow)/);
  return m ? m[0].trim() : "Do NOT trust your training data; use only the bundled catalogue.";
}
const skillText = (skill) => rd(`skills/${skill}/SKILL.md`);
function allSkillsText() {
  const a = rd("AGENTS.md").replace(/\r\n/g, "\n");
  const m = a.match(/<!-- BEGIN:dnd-builder -->\n([\s\S]*?)\n<!-- END:dnd-builder -->/);
  return m ? m[1].trim() : a;
}

/** Build the prompt + declared tool access for a (condition, task). Deterministic. */
export function buildPrompt(condition, task) {
  const spec = CONDITION_SPEC[condition];
  if (!spec) throw new Error(`unknown condition ${condition}`);
  const parts = [];
  if (spec.grounding) parts.push(groundingText());
  if (spec.skill === "task") parts.push(skillText(task.skill));
  else if (spec.skill === "all") parts.push(allSkillsText());
  if (!spec.engine) parts.push("You have NO tools and NO files. Answer only from what you have been given" + (spec.skill === "none" && !spec.grounding ? " and your own knowledge." : "."));
  else parts.push("You may call the `run_engine` tool (runs `node engine/cli.mjs <args>`) and must interpret its output yourself; do not copy it verbatim as the answer.");

  const system = parts.join("\n\n---\n\n");
  const user = `${task.prompt}\n\n${RESPONSE_FORMATS[task.skill]}`;
  return { system, user, tool_access: toolAccess(condition) };
}

export { groundingText, allSkillsText };
