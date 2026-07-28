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

/* An installed tree is the one thing the unit tests never exercised, and it is
   where the pack was invisible: install.mjs wrote only .claude/, so a client
   that scans the vendor-neutral .agents/skills/ found nothing at all. Both
   trees must now resolve the engine, from a real install, end to end. */
test("install.mjs writes both skill trees and each resolves the engine", () => {
  const target = mkdtempSync(join(tmpdir(), "dnd-install-"));
  try {
    const install = spawnSync(process.execPath, [join(ROOT, "install.mjs"), target], { encoding: "utf8" });
    assert.equal(install.status, 0, install.stderr);

    const skills = readdirSync(join(ROOT, "skills"), { withFileTypes: true })
      .filter((e) => e.isDirectory()).map((e) => e.name);
    assert.ok(skills.length >= 5, "fixture must have the full pack");

    const fixtures = join(target, "fixtures");
    mkdirSync(fixtures);
    for (const tree of [".claude", ".agents"]) {
      for (const skill of skills) {
        const shim = join(target, tree, "skills", skill, "scripts", "dnd.mjs");
        assert.ok(existsSync(shim), `${tree}/skills/${skill} was not installed`);
      }
      // The bundle is written once, under .claude/ — .agents/ resolves it by the
      // shim's probe, so this proves the probe and a real build from the installed tree.
      const shim = join(target, tree, "skills", "dnd-build", "scripts", "dnd.mjs");
      const doctor = spawnSync(process.execPath, [shim, "doctor"], { encoding: "utf8" });
      assert.equal(doctor.status, 0, `${tree} tree could not reach the engine: ${doctor.stderr}`);
      assert.match(doctor.stdout, /the rules bundle is installed and readable/);

      const source = join(fixtures, `${tree.slice(1)}-fighter.answers.json`);
      cpSync(join(ROOT, "examples", "dwarf-fighter.answers.json"), source);
      const built = spawnSync(process.execPath, [shim, "build", source, "--lang", "en"], { encoding: "utf8" });
      assert.equal(built.status, 0, `${tree} installed build failed: ${built.stderr}`);
      const output = built.stdout.trim().replace(/^sheet:\s*/, "");
      assert.ok(existsSync(output), `${tree} build did not write ${output}`);
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
    assert.ok(!existsSync(join(target, ".agents", "data")),
      "the catalog must not be duplicated into .agents/");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});
