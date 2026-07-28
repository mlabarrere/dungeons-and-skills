#!/usr/bin/env node
/**
 * Validate the official-2024 feature-name manifests and deterministically merge
 * their English labels into data/labels.en.json.
 *
 * Usage:
 *   node scripts/merge-feature-labels.mjs --check
 *   node scripts/merge-feature-labels.mjs --write
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_DIR = join(ROOT, "data", "feature-labels.en");
const PROGRESSION = join(ROOT, "data", "progression.json");
const LABELS = join(ROOT, "data", "labels.en.json");
const EXPECTED_MANIFESTS = [
  "_shared.json",
  "barbarian.json",
  "bard.json",
  "cleric.json",
  "druid.json",
  "fighter.json",
  "monk.json",
  "paladin.json",
  "ranger.json",
  "rogue.json",
  "sorcerer.json",
  "warlock.json",
  "wizard.json",
];
const REQUIRED_FIELDS = [
  "sourceName",
  "label",
  "ruleset",
  "sourceUrl",
  "sourceSection",
  "status",
];
const OFFICIAL_SOURCE =
  "https://www.dndbeyond.com/sources/dnd/br-2024/character-classes";
const isApprovedOfficialSource = (url) =>
  url === OFFICIAL_SOURCE ||
  /^https:\/\/www\.dndbeyond\.com\/classes\/\d+-[a-z0-9-]+\/?$/.test(url);
const stableCompare = (a, b) => {
  const foldedA = a.toLowerCase();
  const foldedB = b.toLowerCase();
  return foldedA < foldedB ? -1 : foldedA > foldedB ? 1 : a < b ? -1 : a > b ? 1 : 0;
};

export function featureId(sourceName) {
  return sourceName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function catalogFeatureNames(progression) {
  const names = new Set();
  for (const cls of Object.values(progression.classes ?? {})) {
    for (const level of cls.levels ?? []) {
      for (const feature of level.features ?? []) names.add(feature.name);
    }
  }
  return names;
}

export function loadAndValidateManifests({
  manifestDir = MANIFEST_DIR,
  progressionPath = PROGRESSION,
} = {}) {
  const errors = [];
  const actualFiles = readdirSync(manifestDir)
    .filter((name) => name.endsWith(".json"))
    .sort();
  if (JSON.stringify(actualFiles) !== JSON.stringify(EXPECTED_MANIFESTS)) {
    errors.push(
      `manifest files differ: expected ${EXPECTED_MANIFESTS.join(", ")}, got ${actualFiles.join(", ")}`,
    );
  }

  const byId = new Map();
  const bySourceName = new Map();
  const byNormalizedSourceName = new Map();
  for (const filename of actualFiles) {
    const manifest = readJson(join(manifestDir, filename));
    if (!manifest || Array.isArray(manifest) || typeof manifest !== "object") {
      errors.push(`${filename}: root must be an object`);
      continue;
    }
    for (const [id, entry] of Object.entries(manifest)) {
      const where = `${filename}:${id}`;
      if (!entry || Array.isArray(entry) || typeof entry !== "object") {
        errors.push(`${where}: entry must be an object`);
        continue;
      }
      const fields = Object.keys(entry).sort();
      if (
        JSON.stringify(fields) !== JSON.stringify([...REQUIRED_FIELDS].sort())
      ) {
        errors.push(`${where}: fields must be exactly ${REQUIRED_FIELDS.join(", ")}`);
      }
      for (const field of REQUIRED_FIELDS) {
        if (typeof entry[field] !== "string" || entry[field].trim() === "") {
          errors.push(`${where}: ${field} must be a non-empty string`);
        }
      }
      if (entry.ruleset !== "2024") errors.push(`${where}: ruleset must be 2024`);
      if (entry.status !== "verified") {
        errors.push(`${where}: status must be verified`);
      }
      if (!isApprovedOfficialSource(entry.sourceUrl)) {
        errors.push(`${where}: sourceUrl is not the approved official 2024 source`);
      }
      if (featureId(entry.sourceName ?? "") !== id) {
        errors.push(`${where}: id must be the normalized sourceName`);
      }
      if (byId.has(id)) {
        errors.push(`${where}: duplicate featureId (also in ${byId.get(id).filename})`);
      } else {
        byId.set(id, { ...entry, filename });
      }
      if (bySourceName.has(entry.sourceName)) {
        errors.push(
          `${where}: duplicate sourceName (also in ${bySourceName.get(entry.sourceName).filename})`,
        );
      } else {
        bySourceName.set(entry.sourceName, { ...entry, filename });
      }
      const normalized = featureId(entry.sourceName ?? "");
      const previous = byNormalizedSourceName.get(normalized);
      if (previous && previous.sourceName !== entry.sourceName) {
        errors.push(
          `${where}: sourceName normalization collision with ${previous.sourceName}`,
        );
      } else {
        byNormalizedSourceName.set(normalized, { ...entry, filename });
      }
    }
  }

  const catalogNames = catalogFeatureNames(readJson(progressionPath));
  for (const name of [...catalogNames].sort()) {
    if (!bySourceName.has(name)) errors.push(`catalog feature not covered: ${name}`);
  }
  for (const name of [...bySourceName.keys()].sort()) {
    if (!catalogNames.has(name)) errors.push(`manifest feature absent from catalog: ${name}`);
  }

  if (errors.length) {
    throw new Error(`feature-label manifest validation failed:\n- ${errors.join("\n- ")}`);
  }
  return {
    entries: [...byId.entries()]
      .sort(([a], [b]) => stableCompare(a, b))
      .map(([id, entry]) => ({ id, ...entry })),
    catalogCount: catalogNames.size,
  };
}

export function generatedFeatureLabels(options) {
  const { entries, catalogCount } = loadAndValidateManifests(options);
  const labels = Object.fromEntries(
    entries
      .map((entry) => [entry.id, entry.label])
      .sort(([a], [b]) => stableCompare(a, b)),
  );
  return { labels, catalogCount };
}

export function updateLabelsFile({
  labelsPath = LABELS,
  write = false,
  ...options
} = {}) {
  const root = readJson(labelsPath);
  const generated = generatedFeatureLabels(options);
  const expectedRoot = { ...root, features: generated.labels };
  const current = readFileSync(labelsPath, "utf8");
  if (write) {
    const eol = current.includes("\r\n") ? "\r\n" : "\n";
    const expected = `${JSON.stringify(expectedRoot, null, 2).replace(/\n/g, eol)}${eol}`;
    if (current !== expected) writeFileSync(labelsPath, expected, "utf8");
  } else if (JSON.stringify(root) !== JSON.stringify(expectedRoot)) {
    throw new Error(
      "data/labels.en.json features are stale; run node scripts/merge-feature-labels.mjs --write",
    );
  }
  return generated;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length !== 1 || !["--check", "--write"].includes(args[0])) {
    throw new Error("usage: node scripts/merge-feature-labels.mjs <--check|--write>");
  }
  const result = updateLabelsFile({ write: args[0] === "--write" });
  console.log(
    `feature labels: ${result.catalogCount}/${result.catalogCount} catalog features verified`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
