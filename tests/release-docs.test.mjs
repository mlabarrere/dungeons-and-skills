/* Public promises and release gates must stay aligned with what CI actually
   exercises. This prevents a development manifest from becoming a publication
   claim, or progression reference data from becoming a level 2–20 promise. */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(join(ROOT, file), "utf8");

test("public docs state the level-1 builder boundary and link detailed limitations", () => {
  for (const file of ["README.md", "README.fr.md", "INSTALL.md"]) {
    const text = read(file);
    assert.match(text, /level.?1|niveau 1/i, `${file} must promise character creation only at level 1`);
    assert.match(text, /KNOWN_LIMITATIONS\.md/, `${file} must link the complete limitations`);
  }
  const limitations = read("KNOWN_LIMITATIONS.md");
  assert.match(limitations, /progression[\s\S]*1–20[\s\S]*do\s+not implement/i);
  assert.match(limitations, /0 errors[\s\S]*warnings[\s\S]*not fully verified/i);
});

test("host support uses certified, compatible and instruction-only statuses", () => {
  for (const file of ["README.md", "INSTALL.md", "PLATFORMS.md", "KNOWN_LIMITATIONS.md"]) {
    const text = read(file);
    assert.match(text, /Certified beta host|CI-certified/i, `${file} must define the certified path`);
    assert.match(text, /Agent Skills compatible|Format-compatible/i, `${file} must distinguish compatibility`);
    assert.match(text, /Instruction-only/i, `${file} must identify non-engine hosts`);
  }
});

test("public installation docs do not claim an npm or marketplace release", () => {
  const publicDocs = ["README.md", "README.fr.md", "INSTALL.md", "KNOWN_LIMITATIONS.md"]
    .map(read).join("\n");
  assert.match(publicDocs, /no npm-registry release|no npm-registry package|ni publication sur le registre npm/i);
  assert.match(publicDocs, /no marketplace listing|ni listing marketplace/i);
  assert.doesNotMatch(publicDocs, /\/plugin\s+marketplace\s+add/i);
  assert.doesNotMatch(publicDocs, /\/plugin\s+install/i);
});

test("release readiness is a validation-only OS and Node matrix", () => {
  const workflow = read(".github/workflows/release-readiness.yml");
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /ubuntu-latest/);
  assert.match(workflow, /windows-latest/);
  assert.match(workflow, /node:\s*18/);
  assert.match(workflow, /node:\s*22/);
  assert.match(workflow, /npm pack --dry-run --json/);
  assert.match(workflow, /playwright test --config playwright\.config\.mjs/);
  assert.doesNotMatch(workflow, /\bnpm publish\b|\bgh release create\b|marketplace.*publish/i);
  assert.ok(existsSync(join(ROOT, "playwright.config.mjs")));
  assert.ok(existsSync(join(ROOT, "tests", "browser", "standalone-sheet.spec.mjs")));
});
