/* ==========================================================================
   check-sync.mjs — fail if the shipped bundle drifted from its source.

   engine/*.mjs and data/*.json are GENERATED copies of docs/_engine and
   docs/data (see build-bundles.mjs). This guard proves they are still in sync,
   and reports data/labels.en.json coverage of the structural entities.
   Exit non-zero on drift. Missing EN labels are reported, not fatal (spells are
   an incremental extension).
   ========================================================================== */
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const rd = (p) => readFileSync(join(ROOT, p), "utf8").replace(/\r\n/g, "\n");

const ENGINE = ["resolver.mjs", "build-character.mjs", "render-character.mjs", "sheet-lint.mjs"];
const ASSETS = ["ds.css", "ds.print.css", "ds.js"];
let failed = false;
const hasPrivateSources = existsSync(join(ROOT, "docs", "_engine")) &&
  existsSync(join(ROOT, "docs", "data"));

// Engine: the copy is the source prefixed by a 2-line generated banner.
for (const f of hasPrivateSources ? ENGINE : []) {
  const src = rd(`docs/_engine/${f}`).trim();
  const copy = rd(`engine/${f}`).replace(/^\/\* GENERATED[\s\S]*?\*\/\n\/\* Regenerate[\s\S]*?\*\/\n/, "").trim();
  if (copy !== src) { console.error(`DRIFT: engine/${f} != docs/_engine/${f}`); failed = true; }
}
// Data: compare against a fresh deterministic SRD-only projection, never the
// private documentary source byte-for-byte.
const temp = hasPrivateSources ? mkdtempSync(join(tmpdir(), "dnd-public-catalog-check-")) : null;
try {
  if (!hasPrivateSources) {
    const manifest = JSON.parse(rd("data/catalog-manifest.json"));
    for (const f of [...Object.keys(manifest.files), "catalog-manifest.json"]) {
      if (rd(`project-mode/knowledge/${f}`) !== rd(`data/${f}`)) {
        console.error(`DRIFT: project-mode/knowledge/${f} != data/${f}`);
        failed = true;
      }
    }
  } else {
  const { buildPublicCatalog } = await import("./build-public-catalog.mjs");
  const expected = join(temp, "data");
  const expectedProject = join(temp, "project");
  const built = buildPublicCatalog({
    sourceDir: join(ROOT, "docs", "data"),
    outputDir: expected,
    projectOutputDir: expectedProject,
    overlayDir: join(ROOT, "data"),
  });
  for (const f of built.files) {
    const expectedText = readFileSync(join(expected, f), "utf8").replace(/\r\n/g, "\n");
    if (rd(`data/${f}`) !== expectedText) {
      console.error(`DRIFT: data/${f} != deterministic public SRD projection`);
      failed = true;
    }
    if (rd(`project-mode/knowledge/${f}`) !== expectedText) {
      console.error(`DRIFT: project-mode/knowledge/${f} != data/${f}`);
      failed = true;
    }
  }
  }
} finally {
  if (temp) rmSync(temp, { recursive: true, force: true });
}
for (const f of hasPrivateSources ? ASSETS : []) {
  if (rd(`assets/${f}`) !== rd(`docs/html/assets/${f}`)) {
    console.error(`DRIFT: assets/${f} != docs/html/assets/${f}`);
    failed = true;
  }
}

if (failed) {
  console.error("Run `node scripts/build-bundles.mjs` to resync engine/, data/ and assets/.");
  process.exit(1);
}

// EN label coverage (report only).
const labels = JSON.parse(rd("data/labels.en.json"));
const ids = (file) => JSON.parse(rd(`data/${file}`)).map((e) => e.id);
let missing = 0;
for (const [group, file] of [["classes", "classes.json"], ["species", "species.json"], ["backgrounds", "backgrounds.json"]]) {
  for (const id of ids(file)) if (!labels[group] || !labels[group][id]) { console.warn(`  EN label missing: ${group}.${id}`); missing++; }
}
const spellCount = JSON.parse(rd("data/spells.json")).length;
const spellLabels = Object.keys(labels.spells || {}).length;
console.log(`check-sync: ${hasPrivateSources ? "generated engine/data/assets" : "public data/project-mode"} in sync. EN structural labels missing: ${missing}. Spell EN labels: ${spellLabels}/${spellCount}.`);
process.exit(0);
