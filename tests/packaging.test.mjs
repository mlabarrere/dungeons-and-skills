/* Packaging / open-source hygiene: the files that make this a complete OSS project
   are present, and package.json declares a license. */
import test from "node:test";
import assert from "node:assert/strict";
import {
  cpSync, existsSync, readFileSync, mkdtempSync, mkdirSync, readdirSync, rmSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const has = (p) => existsSync(join(ROOT, p));

const REQUIRED = [
  "LICENSE", "ATTRIBUTION.md", "README.md", "README.fr.md",
  "INSTALL.md", "PLATFORMS.md", "CONTRIBUTING.md", "CODE_OF_CONDUCT.md",
  "SECURITY.md", "CHANGELOG.md",
  ".github/PULL_REQUEST_TEMPLATE.md",
  ".github/ISSUE_TEMPLATE/bug_report.md",
  ".github/ISSUE_TEMPLATE/feature_request.md",
  ".github/workflows/test.yml",
];

for (const f of REQUIRED) {
  test(`required OSS file exists: ${f}`, () => assert.ok(has(f), `missing ${f}`));
}

test("package.json declares a license", () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  assert.equal(pkg.license, "MIT");
});

test("LICENSE is MIT and flags the data caveat", () => {
  const t = readFileSync(join(ROOT, "LICENSE"), "utf8");
  assert.match(t, /MIT License/);
  assert.match(t, /SRD/, "LICENSE should reference the SRD data caveat");
});

const SKILL = "dungeons-and-skills";

function assertAutonomousSkill(skillRoot, fixtures, label) {
  for (const rel of [
    "SKILL.md", "scripts/dnd.mjs", "engine/cli.mjs", "data/catalog-manifest.json",
    "assets/ds.css", "ATTRIBUTION.md", "LICENSE", "version.json",
  ]) {
    assert.ok(existsSync(join(skillRoot, rel)), `${label} is missing ${rel}`);
  }

  const shim = join(skillRoot, "scripts", "dnd.mjs");
  const doctor = spawnSync(process.execPath, [shim, "doctor", "--json"], { encoding: "utf8" });
  assert.equal(doctor.status, 0, `${label} could not reach its engine: ${doctor.stderr}`);
  const report = JSON.parse(doctor.stdout);
  assert.equal(report.healthy, true);
  assert.equal(report.catalogProfile, "srd-5.2");
  assert.ok(report.engine.startsWith(skillRoot), `${label} resolved an external engine: ${report.engine}`);
  assert.ok(report.catalogPath.startsWith(skillRoot), `${label} resolved an external catalog: ${report.catalogPath}`);

  const source = join(fixtures, `${label.replace(/[^a-z0-9]+/gi, "-")}.answers.json`);
  cpSync(join(ROOT, "examples", "dwarf-fighter.answers.json"), source);
  const built = spawnSync(process.execPath, [shim, "build", source, "--lang", "en"], { encoding: "utf8" });
  assert.equal(built.status, 0, `${label} build failed: ${built.stderr}`);
  const output = built.stdout.trim().replace(/^sheet:\s*/, "");
  assert.ok(existsSync(output), `${label} build did not write ${output}`);
  assert.equal(dirname(output), fixtures, "the portable sheet must be written beside its answers");
  const html = readFileSync(output, "utf8");
  assert.match(html, /<style\b[^>]*>[\s\S]+<\/style>/, "standalone HTML must embed its CSS");
  assert.match(html, /<script\b[^>]*>[\s\S]+<\/script>/, "standalone HTML must embed its JS");
  const markupOnly = html
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*<\/script>/gi, "");
  assert.doesNotMatch(markupOnly, /<(?:link|script)\b[^>]*(?:href|src)="[^"]*assets\//i,
    "standalone HTML must not depend on missing assets");
}

test("the public skill works when only its folder is copied", () => {
  const target = mkdtempSync(join(tmpdir(), "dnd-skill-copy-"));
  try {
    const skillRoot = join(target, SKILL);
    cpSync(join(ROOT, "skills", SKILL), skillRoot, { recursive: true });
    const fixtures = join(target, "fixtures");
    mkdirSync(fixtures);
    assertAutonomousSkill(skillRoot, fixtures, "isolated-copy");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

/* The fallback installer writes both native trees. Each copy must be usable
   after it is detached from the repository and must resolve its own engine,
   not the backwards-compatible root bundle in .claude/. */
test("install.mjs writes one autonomous skill to both agent trees", () => {
  const target = mkdtempSync(join(tmpdir(), "dnd-install-"));
  try {
    const install = spawnSync(process.execPath, [join(ROOT, "install.mjs"), target], { encoding: "utf8" });
    assert.equal(install.status, 0, install.stderr);

    const skills = readdirSync(join(ROOT, "skills"), { withFileTypes: true })
      .filter((e) => e.isDirectory()).map((e) => e.name).sort();
    assert.deepEqual(skills, [SKILL], "the public distribution unit must remain one skill");

    const fixtures = join(target, "fixtures");
    mkdirSync(fixtures);
    for (const tree of [".claude", ".agents"]) {
      const skillRoot = join(target, tree, "skills", SKILL);
      assertAutonomousSkill(skillRoot, fixtures, tree);
    }
    assert.ok(!existsSync(join(target, ".agents", "data")),
      "the autonomous catalog belongs inside the skill, not at .agents/data");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test("install.mjs help, version and invalid flags never create an accidental target", () => {
  const cwd = mkdtempSync(join(tmpdir(), "dnd-install-cli-"));
  try {
    const before = readdirSync(cwd);
    const help = spawnSync(process.execPath, [join(ROOT, "install.mjs"), "--help"], { cwd, encoding: "utf8" });
    assert.equal(help.status, 0, help.stderr);
    assert.match(help.stdout, /npx skills add mlabarrere\/dungeons-and-skills/);

    const version = spawnSync(process.execPath, [join(ROOT, "install.mjs"), "--version"], { cwd, encoding: "utf8" });
    assert.equal(version.status, 0, version.stderr);
    assert.equal(version.stdout.trim(), JSON.parse(readFileSync(join(ROOT, "version.json"), "utf8")).version);

    const invalid = spawnSync(process.execPath, [join(ROOT, "install.mjs"), "--wat"], { cwd, encoding: "utf8" });
    assert.equal(invalid.status, 3);
    assert.deepEqual(readdirSync(cwd), before);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
