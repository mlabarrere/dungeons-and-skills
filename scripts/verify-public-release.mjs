#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { sha256 } from "./lib/release-archive.mjs";

const root = resolve(process.argv[2] || "");
if (!process.argv[2] || !existsSync(root) || !statSync(root).isDirectory()) {
  console.error("Usage: node scripts/verify-public-release.mjs <exported-repository-directory>");
  process.exit(3);
}

const manifestPath = join(root, "release-manifest.json");
if (!existsSync(manifestPath)) {
  console.error("release-manifest.json is missing.");
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (error) {
  console.error(`release-manifest.json is invalid: ${error.message}`);
  process.exit(1);
}

const normalize = (path) => path.split(sep).join("/");
const actual = [];
const visit = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) visit(path);
    else if (entry.isFile()) actual.push(normalize(relative(root, path)));
    else {
      console.error(`Unsupported filesystem entry: ${normalize(relative(root, path))}`);
      process.exit(1);
    }
  }
};
visit(root);

const listed = new Map();
for (const file of manifest.files || []) {
  if (!file || typeof file.path !== "string" || !/^[a-f0-9]{64}$/.test(file.sha256 || "")) {
    console.error("Manifest contains an invalid file entry.");
    process.exit(1);
  }
  if (listed.has(file.path)) {
    console.error(`Manifest contains a duplicate path: ${file.path}`);
    process.exit(1);
  }
  listed.set(file.path, file);
}

const expectedPaths = [...listed.keys()].sort();
const actualPaths = actual.filter((path) => path !== "release-manifest.json").sort();
if (JSON.stringify(expectedPaths) !== JSON.stringify(actualPaths)) {
  const missing = expectedPaths.filter((path) => !actualPaths.includes(path));
  const extra = actualPaths.filter((path) => !expectedPaths.includes(path));
  console.error(`Manifest/file mismatch. Missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"}.`);
  process.exit(1);
}

for (const [path, expected] of listed) {
  const data = readFileSync(join(root, path));
  if (data.length !== expected.bytes || sha256(data) !== expected.sha256) {
    console.error(`Hash/size mismatch: ${path}`);
    process.exit(1);
  }
}

if (manifest.catalogProfile !== "srd-5.2" || manifest.license !== "CC-BY-4.0") {
  console.error("Release is not the certified srd-5.2 / CC-BY-4.0 profile.");
  process.exit(1);
}
if (actual.some((path) => path === ".git" || path.startsWith(".git/"))) {
  console.error("A Git history escaped into the history-free public repository.");
  process.exit(1);
}

console.log(`public-release: verified ${listed.size} files for v${manifest.version} (${manifest.catalogProfile}).`);
