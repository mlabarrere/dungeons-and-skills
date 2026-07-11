/* ==========================================================================
   check-sync.mjs — fail if the shipped bundle drifted from its source.

   engine/*.mjs and data/*.json are GENERATED copies of docs/_engine and
   docs/data (see build-bundles.mjs). This guard proves they are still in sync,
   and reports data/labels.en.json coverage of the structural entities.
   Exit non-zero on drift. Missing EN labels are reported, not fatal (spells are
   an incremental extension).
   ========================================================================== */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const rd = (p) => readFileSync(join(ROOT, p), "utf8").replace(/\r\n/g, "\n");

const ENGINE = ["resolver.mjs", "build-character.mjs", "sheet-lint.mjs"];
const DATA = [
  "classes.json", "subclasses.json", "species.json", "backgrounds.json",
  "feats.json", "equipment.json", "spells.json", "spells-by-class.json",
  "languages.json", "conditions.json", "glossary.json", "build-graph.json",
];

let failed = false;

// Engine: the copy is the source prefixed by a 2-line generated banner.
for (const f of ENGINE) {
  const src = rd(`docs/_engine/${f}`).trim();
  const copy = rd(`engine/${f}`).replace(/^\/\* GENERATED[\s\S]*?\*\/\n\/\* Regenerate[\s\S]*?\*\/\n/, "").trim();
  if (copy !== src) { console.error(`DRIFT: engine/${f} != docs/_engine/${f}`); failed = true; }
}
// Data: byte-for-byte copies.
for (const f of DATA) {
  if (rd(`data/${f}`) !== rd(`docs/data/${f}`)) { console.error(`DRIFT: data/${f} != docs/data/${f}`); failed = true; }
}

if (failed) {
  console.error("Run `node scripts/build-bundles.mjs` to resync engine/ and data/.");
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
console.log(`check-sync: engine/ + data/ in sync. EN structural labels missing: ${missing}. Spell EN labels: incremental (0/${spellCount} — non-fatal).`);
process.exit(0);
