/* Behavior: the grounding invariants — "do not trust training data", catalog over
   memory, run the engine, resolver-only options, provenance, "Manquant documentaire" —
   appear verbatim in every rule-bearing file. If a skill loses the grounding block,
   this fails. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const rd = (p) => readFileSync(join(ROOT, p), "utf8").replace(/\r\n/g, "\n");

const INVARIANTS = [
  "Do NOT trust your training data.",
  "blends D&D editions",
  "never from memory",
  "resolver",
  "cite its provenance",
  "Manquant documentaire",
  "engine/cli.mjs",
];

const FILES = [
  "AGENTS.md",
  "project-mode/INSTRUCTIONS.md",
  "skills/dnd-build/SKILL.md",
  "skills/dnd-check/SKILL.md",
  "skills/dnd-lookup/SKILL.md",
  "skills/dnd-help/SKILL.md",
];

for (const f of FILES) {
  test(`${f} contains every grounding invariant`, () => {
    const text = rd(f);
    for (const phrase of INVARIANTS) {
      assert.ok(text.includes(phrase), `missing invariant "${phrase}" in ${f}`);
    }
  });
}

test("every skill has YAML frontmatter with name + description", () => {
  for (const f of FILES.filter((x) => x.startsWith("skills/"))) {
    const text = rd(f);
    assert.match(text, /^---\n[\s\S]*?name:\s*dnd-/, `${f} needs a name in frontmatter`);
    assert.match(text, /\ndescription:\s*>/, `${f} needs a description`);
  }
});
