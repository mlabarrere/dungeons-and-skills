import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sha256 } from "../scripts/lib/release-archive.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const VERSION = JSON.parse(readFileSync(join(ROOT, "version.json"), "utf8")).version;

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "dnd-public-manifest-"));
  mkdirSync(join(root, "data"));
  writeFileSync(join(root, "data", "value.json"), "{}\n");
  const data = readFileSync(join(root, "data", "value.json"));
  writeFileSync(join(root, "release-manifest.json"), JSON.stringify({
    version: VERSION,
    catalogProfile: "srd-5.2",
    license: "CC-BY-4.0",
    files: [{ path: "data/value.json", bytes: data.length, sha256: sha256(data) }]
  }));
  return root;
}

test("public release verifier accepts an exact manifest", () => {
  const root = fixture();
  try {
    const run = spawnSync(process.execPath, [join(ROOT, "scripts", "verify-public-release.mjs"), root], { encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /verified 1 files/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("public release verifier rejects content changed after manifest generation", () => {
  const root = fixture();
  try {
    writeFileSync(join(root, "data", "value.json"), "{\"changed\":true}\n");
    const run = spawnSync(process.execPath, [join(ROOT, "scripts", "verify-public-release.mjs"), root], { encoding: "utf8" });
    assert.equal(run.status, 1);
    assert.match(run.stderr, /Hash\/size mismatch/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
