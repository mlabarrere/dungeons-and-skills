import test, { after } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(ROOT, "engine", "cli.mjs");
const DATA = join(ROOT, "data");
const TMP = mkdtempSync(join(tmpdir(), "dnd-catalog-interface-"));
after(() => rmSync(TMP, { recursive: true, force: true }));

function makeCatalog(name, version = "5.2.1") {
  const dir = join(TMP, name);
  cpSync(DATA, dir, { recursive: true });
  const files = {};
  for (const file of readdirSync(dir)) if (file.endsWith(".json") && file !== "catalog-manifest.json")
    files[file] = file;
  writeFileSync(join(dir, "catalog-manifest.json"), JSON.stringify({
    schemaVersion: 1,
    profile: "srd-5.2",
    version,
    ruleset: "2024",
    license: "CC-BY-4.0",
    files,
  }));
  return dir;
}

function run(args, env = {}) {
  return spawnSync(process.execPath, [CLI, ...args], {
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

test("--version is sourced from version.json", () => {
  const expected = JSON.parse(readFileSync(join(ROOT, "version.json"), "utf8")).version;
  const result = run(["--version"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), `dungeons-and-skills ${expected}`);
});

test("doctor reports selected catalog identity and CLI overrides the environment", () => {
  const envCatalog = makeCatalog("environment", "5.2.1-env");
  const cliCatalog = makeCatalog("cli", "5.2.1-cli");
  const result = run(["doctor", "--json", "--catalog", cliCatalog], {
    DND_SKILLS_CATALOG_DIR: envCatalog,
  });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.catalog, cliCatalog);
  assert.equal(report.catalogSource, "cli");
  assert.equal(report.catalogSchemaVersion, 1);
  assert.equal(report.catalogProfile, "srd-5.2");
  assert.equal(report.catalogVersion, "5.2.1-cli");
  assert.equal(report.catalogRuleset, "2024");
  assert.equal(report.catalogLicense, "CC-BY-4.0");
});

test("environment catalog is selected when --catalog is absent", () => {
  const catalog = makeCatalog("env-only");
  const result = run(["doctor", "--json"], { DND_SKILLS_CATALOG_DIR: catalog });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.catalog, catalog);
  assert.equal(report.catalogSource, "environment");
});

test("rules commands read the selected catalog rather than bundled data", () => {
  const catalog = makeCatalog("rules-command");
  const classesPath = join(catalog, "classes.json");
  const classes = JSON.parse(readFileSync(classesPath, "utf8"));
  classes[0].name = "Catalog Override Sentinel";
  writeFileSync(classesPath, JSON.stringify(classes));
  const answers = join(TMP, "empty.answers.json");
  writeFileSync(answers, "{}");
  const result = run(["--catalog", catalog, "options", answers]);
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  const classChoice = payload.fixedPending.find((choice) => choice.id === "class");
  assert.ok(classChoice.options.some((option) => option.name === "Catalog Override Sentinel"));
});

test("manifest contract, file checksums, and catalog schemas fail closed", () => {
  const badProfile = makeCatalog("bad-profile");
  const profileManifest = JSON.parse(readFileSync(join(badProfile, "catalog-manifest.json"), "utf8"));
  profileManifest.profile = "homebrew";
  writeFileSync(join(badProfile, "catalog-manifest.json"), JSON.stringify(profileManifest));
  const profileResult = run(["doctor", "--json", "--catalog", badProfile]);
  assert.equal(profileResult.status, 1);
  assert.ok(JSON.parse(profileResult.stdout).warnings.some((warning) => /profile must be "srd-5\.2"/.test(warning)));

  const badHash = makeCatalog("bad-hash");
  const hashManifest = JSON.parse(readFileSync(join(badHash, "catalog-manifest.json"), "utf8"));
  hashManifest.files["classes.json"] = { path: "classes.json", sha256: "0".repeat(64) };
  writeFileSync(join(badHash, "catalog-manifest.json"), JSON.stringify(hashManifest));
  const hashResult = run(["doctor", "--json", "--catalog", badHash]);
  assert.equal(hashResult.status, 1);
  assert.ok(JSON.parse(hashResult.stdout).warnings.some((warning) => /checksum mismatch for classes\.json/.test(warning)));

  const badSchema = makeCatalog("bad-schema");
  writeFileSync(join(badSchema, "classes.json"), JSON.stringify({ not: "an array" }));
  const schemaResult = run(["doctor", "--json", "--catalog", badSchema]);
  assert.equal(schemaResult.status, 1);
  assert.ok(JSON.parse(schemaResult.stdout).warnings.some((warning) => /schema error: classes\.json must contain an array/.test(warning)));
});

test("missing --catalog value and duplicate selection are usage errors", () => {
  assert.equal(run(["doctor", "--catalog"]).status, 3);
  const catalog = makeCatalog("duplicate");
  const duplicate = run(["doctor", "--catalog", catalog, `--catalog=${catalog}`]);
  assert.equal(duplicate.status, 3);
  assert.match(duplicate.stderr, /--catalog was provided more than once/);
});
