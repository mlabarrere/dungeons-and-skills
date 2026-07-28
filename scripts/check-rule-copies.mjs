/* ==========================================================================
   check-rule-copies.mjs — the grounding rule cannot drift.

   1. Every platform adapter's body must equal the canonical `dnd-builder`
      section of AGENTS.md (frontmatter / generated banner stripped).
   2. The load-bearing grounding invariants must appear VERBATIM in AGENTS.md,
      project-mode/INSTRUCTIONS.md and every skill's SKILL.md. Reword one and
      this fails until it is propagated everywhere — that is the point.
   3. Each skill's generated bundle (its engine shim and its references/ copies
      of rules/) matches what build-adapters.mjs would write. A skill folder is
      self-contained, so those copies are the only rule text it carries — they
      must never drift from rules/.
   Exit non-zero on any drift or missing invariant.
   ========================================================================== */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { canonicalRule, ENGINE_SHIM, listSkills, referencesFor, referenceCopy, SKILL_GROUNDING_OPENING, SKILL_GROUNDING_INVARIANT_BULLETS } from "./build-adapters.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const rd = (p) => readFileSync(join(ROOT, p), "utf8").replace(/\r\n/g, "\n");
const stripFrontmatter = (t) => t.replace(/^---\n[\s\S]*?\n---\n*/, "");
const stripGenerated = (t) => t.replace(/^<!-- GENERATED[\s\S]*?-->\n/, "");
const norm = (t) => stripGenerated(stripFrontmatter(t)).trim();

/* The grounding text every rule-bearing file must carry, word for word.
   These substring checks cover the whole file. For SKILL.md files the structural
   check below (section 2b) additionally verifies these phrases appear inside the
   ## GROUNDING block itself — not buried in prose elsewhere. */
const INVARIANTS = [
  "Do NOT trust your training data.",
  "blends D&D editions",
  "never from memory",
  "resolver",
  "cite its provenance",
  "Manquant documentaire",
];

/* "Delegate the arithmetic to the deterministic engine" is the same invariant
   everywhere, but it is spelled differently by tier: repo-level instruction
   files name the engine directly, while a SKILL.md may only reference paths
   inside its own folder (Agent Skills spec) and so names the shim. */
const ENGINE_INVARIANT = "engine/cli.mjs";
const SKILL_ENGINE_INVARIANT = "scripts/dnd.mjs";

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
const SKILL_NAMES = listSkills();
const INSTRUCTION_SOURCES = [
  ["AGENTS.md (dnd-builder)", canonical],
  ["project-mode/INSTRUCTIONS.md", rd("project-mode/INSTRUCTIONS.md")],
];
const SKILL_SOURCES = SKILL_NAMES.map((s) => [`skills/${s}/SKILL.md`, rd(`skills/${s}/SKILL.md`)]);
const SOURCES = [...INSTRUCTION_SOURCES, ...SKILL_SOURCES];

for (const phrase of INVARIANTS) {
  for (const [label, text] of SOURCES) {
    if (!text.includes(phrase)) { console.error(`${label} is missing grounding invariant: "${phrase}"`); failed = true; }
  }
}
for (const [label, text] of INSTRUCTION_SOURCES) {
  if (!text.includes(ENGINE_INVARIANT)) { console.error(`${label} is missing grounding invariant: "${ENGINE_INVARIANT}"`); failed = true; }
}
for (const [label, text] of SKILL_SOURCES) {
  if (!text.includes(SKILL_ENGINE_INVARIANT)) { console.error(`${label} is missing grounding invariant: "${SKILL_ENGINE_INVARIANT}"`); failed = true; }
}

// 2b. Structural integrity of the ## GROUNDING section in each SKILL.md.
//     Substring checks on the whole file cannot catch a block whose opening line
//     was inverted while the invariant phrases were kept elsewhere in the file.
//     Extracting the section and verifying its structure closes that gap.
function extractGrounding(text) {
  const m = text.match(/## GROUNDING[^\n]*\n([\s\S]*?)(?=\n## |$)/);
  return m ? m[1] : "";
}
for (const [label, text] of SKILL_SOURCES) {
  const block = extractGrounding(text);
  if (!block.trim()) { console.error(`${label}: no ## GROUNDING section found`); failed = true; continue; }
  const lines = block.split("\n");
  if (!lines.slice(0, 3).some((l) => l.trimStart().startsWith(SKILL_GROUNDING_OPENING))) {
    console.error(`${label}: GROUNDING section does not open with "${SKILL_GROUNDING_OPENING}" in first 3 lines (line must START with this phrase, not merely contain it)`); failed = true;
  }
  for (const bullet of SKILL_GROUNDING_INVARIANT_BULLETS) {
    if (!lines.some((l) => l === bullet)) {
      console.error(`${label}: GROUNDING section is missing invariant bullet:\n  expected: ${bullet}`); failed = true;
    }
  }
}

// 3. Each skill's generated bundle matches what build-adapters.mjs would write.
//    Skills and their references are discovered, never listed: a hardcoded roster
//    would silently skip a newly added skill instead of failing.
let bundled = 0;
for (const skill of SKILL_NAMES) {
  const shim = `skills/${skill}/scripts/dnd.mjs`;
  if (rd(shim) !== ENGINE_SHIM) { console.error(`DRIFT: ${shim} != the generated engine shim`); failed = true; }
  bundled++;

  const refs = referencesFor(skill);
  for (const ref of refs) {
    const copy = `skills/${skill}/references/${ref}`;
    if (rd(copy) !== referenceCopy(ref, refs)) { console.error(`DRIFT: ${copy} != rules/${ref}`); failed = true; }
    bundled++;
  }
  // An unlinked copy is drift too: it ships rule text the skill never points at.
  const dir = join(ROOT, "skills", skill, "references");
  if (existsSync(dir)) {
    for (const f of readdirSync(dir)) {
      if (!refs.includes(f)) { console.error(`ORPHAN: skills/${skill}/references/${f} is not linked from SKILL.md`); failed = true; }
    }
  }
}

if (failed) {
  console.error("Run `node scripts/build-adapters.mjs` and/or realign the grounding text.");
  process.exit(1);
}
console.log(`check-rule-copies: ${ADAPTERS.length} adapters match AGENTS.md; ${INVARIANTS.length + 1} invariants present in ${SOURCES.length} sources; ${bundled} generated skill files in sync.`);
process.exit(0);
