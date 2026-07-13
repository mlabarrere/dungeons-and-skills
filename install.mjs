#!/usr/bin/env node
/* install.mjs — drop the Dungeons & Skills bundle into a project so Claude Code (or any
   agent) can use it. Mirrors the plugin layout under <target>/.claude: skills (+ commands)
   plus engine/data/rules as siblings, so each skill reaches the engine at the same
   `$CLAUDE_SKILL_DIR/../../engine/cli.mjs` offset used in the plugin and in a checkout.
   Zero dependencies.

   Usage (from a checkout of this repo):
     node install.mjs                 # install into the current directory
     node install.mjs /path/to/project
   Or, without cloning:
     npx github:mlabarrere/dungeons-and-skills /path/to/project

   The smoothest path for Claude Code is still the plugin marketplace — see README/INSTALL. */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const PKG = dirname(fileURLToPath(import.meta.url));
const target = resolve(process.argv[2] || process.cwd());

if (resolve(PKG) === target) {
  console.log("This directory is already the Dungeons & Skills checkout — open Claude Code here and run /dnd-build.");
  process.exit(0);
}

const copyDir = (rel, dest) => { const from = join(PKG, rel); if (!existsSync(from)) return; mkdirSync(dirname(dest), { recursive: true }); cpSync(from, dest, { recursive: true }); };

// Everything under <target>/.claude so the skill's `$CLAUDE_SKILL_DIR/../../engine` offset holds.
// engine/ and data/ stay siblings, so the engine self-locates its catalog via import.meta.url.
for (const d of ["engine", "data", "rules"]) copyDir(d, join(target, ".claude", d));
copyDir("skills", join(target, ".claude", "skills"));
copyDir("commands", join(target, ".claude", "commands"));
copyDir("AGENTS.md", join(target, "AGENTS.md"));

console.log(`Dungeons & Skills installed into ${target}
  • .claude/skills/  (dnd-build, dnd-check, dnd-lookup, dnd-help)
  • .claude/engine/ .claude/data/ .claude/rules/  (the deterministic catalogue + engine)
Open Claude Code in that folder and run /dnd-build. The skills locate the engine themselves — no
need to run from a particular directory (grounding rule: see .claude/rules/grounding.md).`);
