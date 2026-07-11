/* Catalog integrity: the existing deterministic suite (catalog-lint, golden-test,
   sheet-lint) still passes, and the EN label overlay covers the structural entities. */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const run = (rel) => {
  try { execFileSync("node", [join(ROOT, rel)], { stdio: "pipe" }); return 0; }
  catch (e) { return e.status || 1; }
};

for (const s of ["catalog-lint", "golden-test", "sheet-lint"]) {
  test(`docs/_engine/${s}.mjs exits 0`, () => {
    assert.equal(run(`docs/_engine/${s}.mjs`), 0, `${s} reported problems`);
  });
}

test("labels.en.json covers all classes, species and backgrounds", () => {
  const rd = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
  const labels = rd("data/labels.en.json");
  for (const [group, file] of [["classes", "classes.json"], ["species", "species.json"], ["backgrounds", "backgrounds.json"]]) {
    for (const { id } of rd(`data/${file}`)) {
      assert.ok(labels[group] && labels[group][id], `EN label missing for ${group}.${id}`);
    }
  }
});
