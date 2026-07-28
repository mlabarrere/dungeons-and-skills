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
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
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
for (const d of ["engine", "data", "rules", "assets"]) copyDir(d, join(target, ".claude", d));
copyDir("version.json", join(target, ".claude", "version.json"));
copyDir("ATTRIBUTION.md", join(target, ".claude", "ATTRIBUTION.md"));
copyDir("skills", join(target, ".claude", "skills"));
copyDir("commands", join(target, ".claude", "commands"));
copyDir("AGENTS.md", join(target, "AGENTS.md"));

// A client that scans only the vendor-neutral .agents/skills/ used to find
// nothing at all here. The skills are written to both trees; the bundle is not
// duplicated (it is ~1 MB) because dnd.mjs probes .claude/ and .agents/ at each
// level of its walk, so one copy serves both.
copyDir("skills", join(target, ".agents", "skills"));

// Read the roster off disk: the hand-written list said four skills for a whole
// release while five shipped, and nothing noticed.
const installedSkills = readdirSync(join(PKG, "skills"), { withFileTypes: true })
  .filter((e) => e.isDirectory()).map((e) => e.name).sort();

console.log(`Dungeons & Skills installed into ${target}
  • .claude/skills/ and .agents/skills/  (${installedSkills.join(", ")})
  • .claude/engine/ .claude/data/ .claude/rules/ .claude/assets/  (SRD 5.2.1 engine, catalog + standalone sheet assets)
  • Supported builder scope: level 1; progression lookup: levels 1–20
Open Claude Code in that folder and run /dnd-build. The skills locate the engine themselves — no
need to run from a particular directory (grounding rule: see .claude/rules/grounding.md).`);
