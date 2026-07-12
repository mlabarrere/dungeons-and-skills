#!/usr/bin/env node
/* install.mjs — drop the Dungeons & Skills bundle into a project so Claude Code (or any
   agent) can use it. Copies the skills into <target>/.claude/skills (+ commands) and the
   engine/data/rules into <target>/ so the skills' `node engine/cli.mjs` resolves from that
   project's root. Zero dependencies.

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

// Engine + data + rules at the project root (so `node engine/cli.mjs` works from the project).
for (const d of ["engine", "data", "rules"]) copyDir(d, join(target, d));
// Skills + commands under .claude (Claude Code auto-discovers .claude/skills).
copyDir("skills", join(target, ".claude", "skills"));
copyDir("commands", join(target, ".claude", "commands"));
copyDir("AGENTS.md", join(target, "AGENTS.md"));

console.log(`Dungeons & Skills installed into ${target}
  • .claude/skills/  (dnd-build, dnd-check, dnd-lookup, dnd-help)
  • engine/ data/ rules/  (the deterministic catalogue + engine)
Open Claude Code in that folder and run /dnd-build. Verify: node engine/cli.mjs build examples/…  (grounding rule: see rules/grounding.md).`);
