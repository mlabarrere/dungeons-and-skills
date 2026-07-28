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
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC_ENGINE = join(ROOT, "docs", "_engine");
const SRC_DATA = join(ROOT, "docs", "data");
const SRC_ASSETS = join(ROOT, "docs", "html", "assets");
const OUT_ENGINE = join(ROOT, "engine");
const OUT_DATA = join(ROOT, "data");
const OUT_ASSETS = join(ROOT, "assets");
const OUT_PM = join(ROOT, "project-mode", "knowledge");

// Pure ESM modules the CLI depends on (importable in Node and the browser).
const ENGINE_FILES = ["resolver.mjs", "build-character.mjs", "render-character.mjs", "sheet-lint.mjs"];
// Standalone character sheets inline these assets. `sorts.js` is specific to
// the website's spell index and deliberately not part of the portable bundle.
const ASSET_FILES = ["ds.css", "ds.print.css", "ds.js"];

function banner(file) {
  return `/* GENERATED COPY — do not edit. Source: docs/_engine/${file}. */\n`
    + `/* Regenerate: node scripts/build-bundles.mjs — verified by scripts/check-sync.mjs. */\n`;
}

mkdirSync(OUT_ENGINE, { recursive: true });
mkdirSync(OUT_DATA, { recursive: true });
mkdirSync(OUT_ASSETS, { recursive: true });
mkdirSync(OUT_PM, { recursive: true });

let n = 0;
const hasDevelopmentSources = existsSync(SRC_ENGINE) && existsSync(SRC_DATA);
if (hasDevelopmentSources) {
  for (const f of ENGINE_FILES) {
    const src = readFileSync(join(SRC_ENGINE, f), "utf8");
    writeFileSync(join(OUT_ENGINE, f), banner(f) + src, "utf8");
    n++;
  }
  for (const f of ASSET_FILES) {
    copyFileSync(join(SRC_ASSETS, f), join(OUT_ASSETS, f));
    n++;
  }

  // Filter the private documentary source into the only shippable profile.
  const { buildPublicCatalog } = await import("./build-public-catalog.mjs");
  const publicCatalog = buildPublicCatalog({
    sourceDir: SRC_DATA,
    outputDir: OUT_DATA,
    projectOutputDir: OUT_PM,
    overlayDir: OUT_DATA,
  });
  n += publicCatalog.files.length;
} else {
  // In the history-free public checkout, engine/, data/ and assets/ are already
  // the canonical SRD projection. Building remains a supported, deterministic
  // operation and regenerates only the adapters below.
  for (const required of [
    ...ENGINE_FILES.map((file) => join(OUT_ENGINE, file)),
    ...ASSET_FILES.map((file) => join(OUT_ASSETS, file)),
    join(OUT_DATA, "catalog-manifest.json"),
  ]) {
    if (!existsSync(required)) throw new Error(`Public bundle is incomplete: ${required}`);
  }
}

// Project-mode knowledge = the public catalogue + the schema + the grounding rule,
// ready to upload as "knowledge" in a Claude/ChatGPT Project.
for (const [from, to] of [
  [join(ROOT, "rules", "schema.md"), join(OUT_PM, "schema.md")],
  [join(ROOT, "rules", "grounding.md"), join(OUT_PM, "grounding.md")],
]) {
  try { copyFileSync(from, to); n++; } catch { /* rules authored later; skip */ }
}

console.log(hasDevelopmentSources
  ? `build-bundles: synced ${n} files into engine/, data/, assets/ and project-mode/knowledge/.`
  : "build-bundles: public SRD projection verified; adapters may now be regenerated.");
