#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index < 0 ? fallback : args[index + 1];
};
const catalogDir = resolve(valueAfter("--catalog", join(ROOT, "data")));
const projectDir = resolve(valueAfter("--project", join(ROOT, "project-mode", "knowledge")));
const manifestPath = join(catalogDir, "catalog-manifest.json");
const errors = [];
const fail = (message) => errors.push(message);
const parse = (path) => {
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch (error) { fail(`${path}: ${error.message}`); return null; }
};
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const stable = (value) => String(value || "").toLowerCase().normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

if (!existsSync(manifestPath)) fail(`missing ${manifestPath}`);
const manifest = existsSync(manifestPath) ? parse(manifestPath) : null;
for (const [key, expected] of Object.entries({
  schemaVersion: 1, profile: "srd-5.2", version: "5.2.1", ruleset: "2024", license: "CC-BY-4.0"
})) {
  if (manifest?.[key] !== expected) fail(`manifest ${key} must be ${JSON.stringify(expected)}`);
}

const declared = manifest?.files && typeof manifest.files === "object" ? manifest.files : {};
const expectedFiles = new Set([
  "classes.json", "subclasses.json", "species.json", "backgrounds.json", "feats.json",
  "equipment.json", "spells.json", "spells-by-class.json", "languages.json",
  "conditions.json", "glossary.json", "build-graph.json", "progression.json",
  ...["en", "fr", "de", "es", "it", "ja", "ru", "zh", "ar"].map((lang) => `labels.${lang}.json`),
  "ui-labels.json", "catalog-allowlist.json", "catalog-provenance.json"
]);
for (const file of expectedFiles) if (!declared[file]) fail(`manifest does not declare ${file}`);
for (const file of Object.keys(declared)) if (!expectedFiles.has(file)) fail(`manifest declares non-allowlisted file ${file}`);

const contents = {};
for (const [logical, descriptor] of Object.entries(declared)) {
  const path = typeof descriptor === "string" ? descriptor : descriptor?.path;
  if (path !== logical || path.includes("/") || path.includes("\\")) {
    fail(`manifest path for ${logical} must be the same root-level filename`);
    continue;
  }
  const absolute = join(catalogDir, path);
  if (!existsSync(absolute)) { fail(`declared file is missing: ${logical}`); continue; }
  const bytes = readFileSync(absolute);
  if (!descriptor.sha256 || hash(bytes) !== descriptor.sha256) fail(`checksum mismatch: ${logical}`);
  const text = bytes.toString("utf8");
  if (/img:\d+|docs\/html|Player.?s Handbook|personal use|private overlay/i.test(text))
    fail(`private/non-public provenance marker in ${logical}`);
  contents[logical] = parse(absolute);
  const projectPath = join(projectDir, logical);
  if (!existsSync(projectPath)) fail(`project-mode knowledge is missing ${logical}`);
  else if (!readFileSync(projectPath).equals(bytes)) fail(`data/project-mode divergence: ${logical}`);
}

const extraJson = readdirSync(catalogDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
  .map((entry) => entry.name)
  .filter((file) => file !== "catalog-manifest.json" && !expectedFiles.has(file));
for (const file of extraJson) fail(`non-allowlisted JSON file in public catalog: ${file}`);

// The universal Agent Skill embeds the certified catalog because standard skill
// installers copy only one folder. Audit that second distribution surface too:
// every runtime JSON must be identical, and no documentary/private manifest may
// hitch a ride inside the skill archive.
if (catalogDir === resolve(join(ROOT, "data"))) {
  const embedded = join(ROOT, "skills", "dungeons-and-skills", "data");
  if (!existsSync(embedded)) fail("autonomous skill catalog is missing");
  else {
    for (const file of [...expectedFiles, "catalog-manifest.json"]) {
      const bundled = join(embedded, file);
      const source = join(catalogDir, file);
      if (!existsSync(bundled)) fail(`autonomous skill catalog is missing ${file}`);
      else if (!readFileSync(bundled).equals(readFileSync(source)))
        fail(`autonomous skill catalog diverges: ${file}`);
    }
    if (existsSync(join(embedded, "feature-labels.en")))
      fail("private feature-label manifests escaped into the autonomous skill");
    const embeddedJson = readdirSync(embedded, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => entry.name);
    for (const file of embeddedJson) {
      if (file !== "catalog-manifest.json" && !expectedFiles.has(file))
        fail(`non-allowlisted JSON file in autonomous skill catalog: ${file}`);
    }
  }
}

const allow = contents["catalog-allowlist.json"];
const publicIds = {
  classes: new Set((contents["classes.json"] || []).map((entry) => entry.id)),
  subclasses: new Set((contents["subclasses.json"] || []).map((entry) => entry.id)),
  species: new Set((contents["species.json"] || []).map((entry) => entry.id)),
  backgrounds: new Set((contents["backgrounds.json"] || []).map((entry) => entry.id)),
  feats: new Set((contents["feats.json"] || []).map((entry) => entry.id)),
  spells: new Set((contents["spells.json"] || []).map((entry) => entry.id)),
};
for (const group of Object.keys(publicIds)) {
  const expected = new Set(allow?.[group] || []);
  for (const id of expected) if (!publicIds[group].has(id)) fail(`allowlisted ${group} entry missing: ${id}`);
  for (const id of publicIds[group]) if (!expected.has(id)) fail(`non-allowlisted ${group} entry shipped: ${id}`);
}

for (const [classId, spells] of Object.entries(contents["spells-by-class.json"] || {})) {
  if (!publicIds.classes.has(classId)) fail(`spell list references excluded class: ${classId}`);
  for (const entry of spells) if (!publicIds.spells.has(entry.id)) fail(`spell list ${classId} references excluded spell: ${entry.id}`);
}

const provenance = contents["catalog-provenance.json"];
const provenanceEntries = provenance?.entries || {};
const requiredProvenance = [];
for (const [group, ids] of Object.entries(publicIds)) for (const id of ids) requiredProvenance.push(`${group}:${id}`);
for (const [group, entries] of Object.entries(contents["equipment.json"] || {}))
  if (Array.isArray(entries)) for (const entry of entries) requiredProvenance.push(`equipment:${group}:${entry.id}`);
for (const [group, entries] of Object.entries(contents["languages.json"] || {}))
  if (Array.isArray(entries)) for (const entry of entries) requiredProvenance.push(`languages:${group}:${entry.id}`);
for (const id of Object.keys(contents["spells-by-class.json"] || {})) requiredProvenance.push(`spells-by-class:${id}`);
for (const id of Object.keys(contents["progression.json"]?.classes || {})) requiredProvenance.push(`progression:${id}`);
for (const step of contents["build-graph.json"]?.steps || [])
  for (const node of step.nodes || []) requiredProvenance.push(`build-graph:${node.id}`);
for (const entry of contents["conditions.json"] || [])
  requiredProvenance.push(`conditions:${entry.id}`);
for (const entry of contents["glossary.json"] || [])
  requiredProvenance.push(`glossary:${entry.id || stable(entry.name)}`);

for (const key of requiredProvenance) {
  const entry = provenanceEntries[key];
  if (!entry) { fail(`missing provenance: ${key}`); continue; }
  if (entry.status !== "verified" || entry.license !== "CC-BY-4.0" ||
      entry.ruleset !== "2024" || !/^https:\/\/media\.dndbeyond\.com\/compendium-images\/srd\/5\.2\//.test(entry.sourceUrl || "")) {
    fail(`invalid provenance: ${key}`);
  }
}
for (const key of Object.keys(provenanceEntries)) {
  if (!requiredProvenance.includes(key) && !/^(glossary|build-graph):document$/.test(key))
    fail(`provenance has no public catalog entry: ${key}`);
}

for (const lang of ["fr", "de", "es", "it", "ja", "ru", "zh", "ar"]) {
  const labels = contents[`labels.${lang}.json`] || {};
  for (const group of ["classes", "subclasses", "species", "backgrounds", "feats", "spells", "features", "conditions"]) {
    if (Object.keys(labels[group] || {}).length) fail(`${lang} ${group} labels have no recorded redistribution provenance`);
  }
}

if (errors.length) {
  for (const error of errors) console.error(`PUBLIC CATALOG AUDIT: ${error}`);
  process.exit(1);
}
console.log(`public-catalog-audit: ${requiredProvenance.length} entries verified; ${Object.keys(declared).length} files allowlisted; data/project-mode identical.`);
