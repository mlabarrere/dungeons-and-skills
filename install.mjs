#!/usr/bin/env node
/* install.mjs — fallback installer for the complete Dungeons & Skills bundle.
   The primary cross-agent route is `npx skills add mlabarrere/dungeons-and-skills
   --skill dungeons-and-skills`; this installer additionally lays out the native
   Claude plugin commands and a directly callable CLI. Zero dependencies.

   Usage (from a checkout of this repo):
     node install.mjs                 # install into the current directory
     node install.mjs /path/to/project
   Or, without cloning:
     npx github:mlabarrere/dungeons-and-skills /path/to/project

   The smoothest path for Claude Code is the plugin marketplace — see README/INSTALL. */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const PKG = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const help = `Usage: node install.mjs [target]

Install the autonomous Dungeons & Skills Agent Skill into a project.

  node install.mjs                 Install into the current directory
  node install.mjs path/to/project Install into a specific project
  node install.mjs --help          Show this help
  node install.mjs --version       Show the release version

Recommended cross-agent installation:
  npx skills add mlabarrere/dungeons-and-skills --skill dungeons-and-skills
`;
if (args.includes("--help") || args.includes("-h")) {
  process.stdout.write(help);
  process.exit(0);
}
if (args.includes("--version") || args.includes("-v")) {
  process.stdout.write(`${JSON.parse(readFileSync(join(PKG, "version.json"), "utf8")).version}\n`);
  process.exit(0);
}
if (args.length > 1 || args[0]?.startsWith("-")) {
  process.stderr.write(help);
  process.exit(3);
}
const target = resolve(args[0] || process.cwd());

if (resolve(PKG) === target) {
  console.log("This directory is already the Dungeons & Skills checkout — open Claude Code here and run /dnd-build.");
  process.exit(0);
}

const copyDir = (rel, dest) => { const from = join(PKG, rel); if (!existsSync(from)) return; mkdirSync(dirname(dest), { recursive: true }); cpSync(from, dest, { recursive: true }); };

// Keep the directly callable CLI under .claude for backwards compatibility.
for (const d of ["engine", "data", "rules", "assets"]) copyDir(d, join(target, ".claude", d));
copyDir("version.json", join(target, ".claude", "version.json"));
copyDir("ATTRIBUTION.md", join(target, ".claude", "ATTRIBUTION.md"));
copyDir("skills", join(target, ".claude", "skills"));
copyDir("commands", join(target, ".claude", "commands"));
copyDir("AGENTS.md", join(target, "AGENTS.md"));

// The autonomous skill contains its own engine, catalog and assets. Write it to
// both native trees so either host can copy or move that folder independently.
copyDir("skills", join(target, ".agents", "skills"));

// Read the roster off disk so installer output cannot drift.
const installedSkills = readdirSync(join(PKG, "skills"), { withFileTypes: true })
  .filter((e) => e.isDirectory()).map((e) => e.name).sort();

console.log(`Dungeons & Skills installed into ${target}
  • .claude/skills/ and .agents/skills/  (${installedSkills.join(", ")})
  • each skill folder is autonomous (engine + SRD 5.2.1 catalog + assets)
  • .claude/engine/ and .claude/data/ remain available for direct CLI use
  • Supported builder scope: level 1; progression lookup: levels 1–20
Open Claude Code in that folder and run /dnd-build. The skill locates its engine itself — no
need to run from a particular directory (grounding rule: see .claude/rules/grounding.md).`);
