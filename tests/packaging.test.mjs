/* Packaging / open-source hygiene: the files that make this a complete OSS project
   are present, and package.json declares a license. */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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
