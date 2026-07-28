/* Behavior: the grounding invariants — "do not trust training data", catalog over
   memory, run the engine, resolver-only options, provenance, "Manquant documentaire" —
   appear verbatim in every rule-bearing file. If a skill loses the grounding block,
   this fails. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { listSkills } from "../scripts/build-adapters.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const rd = (p) => readFileSync(join(ROOT, p), "utf8").replace(/\r\n/g, "\n");

/* Canonical list: scripts/check-rule-copies.mjs. Kept here too so a lost
   grounding block names the exact file that lost it. */
const INVARIANTS = [
  "Do NOT trust your training data.",
  "blends D&D editions",
  "never from memory",
  "resolver",
  "cite its provenance",
  "Manquant documentaire",
];

/* "Delegate the arithmetic to the engine" is spelled per tier: repo-level
   instruction files name the engine, a SKILL.md names its own shim because the
   Agent Skills spec forbids referencing paths outside the skill folder. */
const INSTRUCTION_FILES = ["AGENTS.md", "project-mode/INSTRUCTIONS.md"];
// Discovered, not listed — a new skill must be covered without editing this file.
const SKILL_FILES = listSkills().map((s) => `skills/${s}/SKILL.md`);
const FILES = [...INSTRUCTION_FILES, ...SKILL_FILES];

for (const f of FILES) {
  test(`${f} contains every grounding invariant`, () => {
    const text = rd(f);
    for (const phrase of INVARIANTS) {
      assert.ok(text.includes(phrase), `missing invariant "${phrase}" in ${f}`);
    }
    const engine = INSTRUCTION_FILES.includes(f) ? "engine/cli.mjs" : "scripts/dnd.mjs";
    assert.ok(text.includes(engine), `missing invariant "${engine}" in ${f}`);
  });
}

test("every skill has YAML frontmatter with name + description", () => {
  for (const f of FILES.filter((x) => x.startsWith("skills/"))) {
    const text = rd(f);
    assert.match(text, /^---\n[\s\S]*?name:\s*dnd-/, `${f} needs a name in frontmatter`);
    assert.match(text, /\ndescription:\s*>/, `${f} needs a description`);
  }
});
