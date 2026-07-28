import assert from "node:assert/strict";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { normId } from "../engine/resolver.mjs";
import {
  featureId,
  generatedFeatureLabels,
  loadAndValidateManifests,
} from "../scripts/merge-feature-labels.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_DIR = join(ROOT, "data", "feature-labels.en");
const PRIVATE_MANIFESTS_PRESENT = existsSync(MANIFEST_DIR);
const PROGRESSION = join(ROOT, "data", "progression.json");
const OFFICIAL_SOURCE =
  "https://www.dndbeyond.com/sources/dnd/br-2024/character-classes";
const STRUCTURAL_FEATURES = new Set([
  "Amelioration de caracteristique",
  "Aptitude de sous-classe",
  "Attaque supplementaire",
  "Bottes d'arme",
  "Faveur epique",
  "Sorts",
  "Sous-classe d'Ensorceleur",
  "Sous-classe d'Occultiste",
  "Sous-classe de Barbare",
  "Sous-classe de Barde",
  "Sous-classe de Clerc",
  "Sous-classe de Druide",
  "Sous-classe de Guerrier",
  "Sous-classe de Magicien",
  "Sous-classe de Moine",
  "Sous-classe de Paladin",
  "Sous-classe de rodeur",
  "Sous-classe de Roublard",
]);

function json(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function withManifestCopy(run) {
  const root = mkdtempSync(join(tmpdir(), "dnd-feature-labels-"));
  const manifestDir = join(root, "feature-labels.en");
  cpSync(MANIFEST_DIR, manifestDir, { recursive: true });
  try {
    run(manifestDir);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("official 2024 manifests cover the progression catalog exactly", { skip: !PRIVATE_MANIFESTS_PRESENT }, () => {
  const result = loadAndValidateManifests();
  assert.equal(result.catalogCount, 137);
  assert.equal(result.entries.length, 137);
  assert.equal(
    result.entries.filter((entry) => !STRUCTURAL_FEATURES.has(entry.sourceName)).length,
    119,
  );
  assert.equal(
    result.entries.filter((entry) => STRUCTURAL_FEATURES.has(entry.sourceName)).length,
    18,
  );
  assert.ok(result.entries.every((entry) => entry.ruleset === "2024"));
  assert.ok(result.entries.every((entry) => entry.status === "verified"));
  assert.ok(
    result.entries.every(
      (entry) =>
        entry.sourceUrl === OFFICIAL_SOURCE ||
        /^https:\/\/www\.dndbeyond\.com\/classes\/\d+-[a-z0-9-]+\/?$/.test(
          entry.sourceUrl,
        ),
    ),
  );
  assert.equal(featureId("Bottes d'arme"), "bottes-d-arme");
  assert.ok(
    result.entries.every((entry) => entry.id === normId(entry.sourceName)),
    "manifest featureIds must exactly match the runtime resolver's normId",
  );
});

test("labels.en.json feature overlay is exactly the deterministic manifest merge", { skip: !PRIVATE_MANIFESTS_PRESENT }, () => {
  const generated = generatedFeatureLabels().labels;
  const checkedIn = json(join(ROOT, "data", "labels.en.json")).features;
  assert.deepEqual(checkedIn, generated);
  assert.equal(generated.expertise, "Expertise");
  assert.equal(generated.rage, "Rage");
  assert.equal(generated["credo-du-moine"], "Monk's Focus");
  assert.equal(generated["credo-accru"], "Heightened Focus");
  assert.equal(generated["credo-paracheve"], "Perfect Focus");
  assert.equal(
    generated["intervention-divine-supreme"],
    "Greater Divine Intervention",
  );
});

test("manifest validation rejects duplicate IDs and source names", { skip: !PRIVATE_MANIFESTS_PRESENT }, () => {
  withManifestCopy((manifestDir) => {
    const path = join(manifestDir, "barbarian.json");
    const manifest = json(path);
    manifest["rage-copy"] = { ...manifest.rage };
    writeFileSync(path, JSON.stringify(manifest), "utf8");
    assert.throws(
      () =>
        loadAndValidateManifests({
          manifestDir,
          progressionPath: PROGRESSION,
        }),
      /duplicate featureId|duplicate sourceName/,
    );
  });
});

test("manifest validation rejects missing and non-catalog features", { skip: !PRIVATE_MANIFESTS_PRESENT }, () => {
  withManifestCopy((manifestDir) => {
    const path = join(manifestDir, "bard.json");
    const manifest = json(path);
    delete manifest["contre-charme"];
    manifest["aptitude-inventee"] = {
      sourceName: "Aptitude inventee",
      label: "Invented Feature",
      ruleset: "2024",
      sourceUrl: OFFICIAL_SOURCE,
      sourceSection: "Bard Features",
      status: "verified",
    };
    writeFileSync(path, JSON.stringify(manifest), "utf8");
    assert.throws(
      () =>
        loadAndValidateManifests({
          manifestDir,
          progressionPath: PROGRESSION,
        }),
      /catalog feature not covered: Contre-charme[\s\S]*manifest feature absent from catalog: Aptitude inventee/,
    );
  });
});

test("manifest validation rejects non-primary provenance", { skip: !PRIVATE_MANIFESTS_PRESENT }, () => {
  withManifestCopy((manifestDir) => {
    const path = join(manifestDir, "wizard.json");
    const manifest = json(path);
    manifest.erudition.sourceUrl = "https://example.com/wiki";
    writeFileSync(path, JSON.stringify(manifest), "utf8");
    assert.throws(
      () =>
        loadAndValidateManifests({
          manifestDir,
          progressionPath: PROGRESSION,
        }),
      /sourceUrl is not the approved official 2024 source/,
    );
  });
});

test("manifest validation accepts official numeric 2024 class pages", { skip: !PRIVATE_MANIFESTS_PRESENT }, () => {
  withManifestCopy((manifestDir) => {
    const path = join(manifestDir, "fighter.json");
    const manifest = json(path);
    manifest["sens-tactique"].sourceUrl =
      "https://www.dndbeyond.com/classes/2190879-fighter";
    writeFileSync(path, JSON.stringify(manifest), "utf8");
    assert.doesNotThrow(() =>
      loadAndValidateManifests({
        manifestDir,
        progressionPath: PROGRESSION,
      }),
    );
  });
});
