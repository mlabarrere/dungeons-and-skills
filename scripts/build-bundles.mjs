/* ==========================================================================
   build-bundles.mjs — assemble the portable, self-contained skill bundle.

   SINGLE SOURCE OF TRUTH: docs/_engine (pure engine) + docs/data (rules
   catalogue). This script COPIES them into the repo-root `engine/` and `data/`
   folders that the skills, the CLI and the Project-mode bundle ship with.
   NEVER edit engine/*.mjs or the copied data/*.json by hand — edit the source
   under docs/ and re-run `node scripts/build-bundles.mjs`. `check-sync.mjs`
   fails CI if a copy drifts from its source.

   Hand-authored files that live in the bundle and are NOT overwritten here:
     engine/cli.mjs        (the skill CLI wrapper)
     data/labels.en.json   (FR-id -> EN label overlay for multilingual output)
   ========================================================================== */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC_ENGINE = join(ROOT, "docs", "_engine");
const SRC_DATA = join(ROOT, "docs", "data");
const OUT_ENGINE = join(ROOT, "engine");
const OUT_DATA = join(ROOT, "data");
const OUT_PM = join(ROOT, "project-mode", "knowledge");

// Pure ESM modules the CLI depends on (importable in Node and the browser).
const ENGINE_FILES = ["resolver.mjs", "build-character.mjs", "sheet-lint.mjs"];

// Catalogue files loadCatalogNode() reads, plus glossary for dnd-lookup.
const DATA_FILES = [
  "classes.json", "subclasses.json", "species.json", "backgrounds.json",
  "feats.json", "equipment.json", "spells.json", "spells-by-class.json",
  "languages.json", "conditions.json", "glossary.json", "build-graph.json",
];

function banner(file) {
  return `/* GENERATED COPY — do not edit. Source: docs/_engine/${file}. */\n`
    + `/* Regenerate: node scripts/build-bundles.mjs — verified by scripts/check-sync.mjs. */\n`;
}

mkdirSync(OUT_ENGINE, { recursive: true });
mkdirSync(OUT_DATA, { recursive: true });
mkdirSync(OUT_PM, { recursive: true });

let n = 0;
for (const f of ENGINE_FILES) {
  const src = readFileSync(join(SRC_ENGINE, f), "utf8");
  writeFileSync(join(OUT_ENGINE, f), banner(f) + src, "utf8");
  n++;
}
for (const f of DATA_FILES) {
  copyFileSync(join(SRC_DATA, f), join(OUT_DATA, f));
  n++;
}

// Project-mode knowledge = the catalogue + the schema + the grounding rule,
// ready to upload as "knowledge" in a Claude/ChatGPT Project.
for (const f of DATA_FILES) copyFileSync(join(OUT_DATA, f), join(OUT_PM, f));
for (const [from, to] of [
  [join(ROOT, "rules", "schema.md"), join(OUT_PM, "schema.md")],
  [join(ROOT, "rules", "grounding.md"), join(OUT_PM, "grounding.md")],
]) {
  try { copyFileSync(from, to); n++; } catch { /* rules authored later; skip */ }
}

console.log(`build-bundles: synced ${n} files into engine/, data/ and project-mode/knowledge/.`);
