/* ==========================================================================
   check-rule-copies.mjs — the grounding rule cannot drift.

   1. Every platform adapter's body must equal the canonical `dnd-builder`
      section of AGENTS.md (frontmatter / generated banner stripped).
   2. The load-bearing grounding invariants must appear VERBATIM in AGENTS.md,
      project-mode/INSTRUCTIONS.md and every skill's SKILL.md. Reword one and
      this fails until it is propagated everywhere — that is the point.
   Exit non-zero on any drift or missing invariant.
   ========================================================================== */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { canonicalRule } from "./build-adapters.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const rd = (p) => readFileSync(join(ROOT, p), "utf8").replace(/\r\n/g, "\n");
const stripFrontmatter = (t) => t.replace(/^---\n[\s\S]*?\n---\n*/, "");
const stripGenerated = (t) => t.replace(/^<!-- GENERATED[\s\S]*?-->\n/, "");
const norm = (t) => stripGenerated(stripFrontmatter(t)).trim();

const INVARIANTS = [
  "Do NOT trust your training data.",
  "blends D&D editions",
  "never from memory",
  "resolver",
  "cite its provenance",
  "Manquant documentaire",
  "engine/cli.mjs",
];

let failed = false;
const canonical = canonicalRule();

// 1. Adapter copies match the canonical rule body.
const ADAPTERS = [
  ".cursor/rules/dnd-builder.mdc",
  ".kiro/steering/dnd-builder.md",
  ".windsurf/rules/dnd-builder.md",
  ".clinerules/dnd-builder.md",
  ".github/copilot-instructions.md",
];
for (const rel of ADAPTERS) {
  if (norm(rd(rel)) !== canonical) { console.error(`DRIFT: ${rel} != AGENTS.md dnd-builder section`); failed = true; }
}

// 2. Invariants present verbatim in every rule-bearing file.
const SKILLS = ["dnd-build", "dnd-check", "dnd-lookup", "dnd-help"].map((s) => `skills/${s}/SKILL.md`);
const SOURCES = [
  ["AGENTS.md (dnd-builder)", canonical],
  ["project-mode/INSTRUCTIONS.md", rd("project-mode/INSTRUCTIONS.md")],
  ...SKILLS.map((p) => [p, rd(p)]),
];
for (const phrase of INVARIANTS) {
  for (const [label, text] of SOURCES) {
    if (!text.includes(phrase)) { console.error(`${label} is missing grounding invariant: "${phrase}"`); failed = true; }
  }
}

if (failed) {
  console.error("Run `node scripts/build-adapters.mjs` and/or realign the grounding text.");
  process.exit(1);
}
console.log(`check-rule-copies: ${ADAPTERS.length} adapters match AGENTS.md; ${INVARIANTS.length} invariants present in ${SOURCES.length} sources.`);
process.exit(0);
