#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const canonical = JSON.parse(readFileSync(join(ROOT, "version.json"), "utf8")).version;
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(canonical || "")) {
  throw new Error("version.json must contain a valid semver `version`.");
}

const targets = [
  ["package.json", (value) => { value.version = canonical; }],
  ["package-lock.json", (value) => {
    value.version = canonical;
    if (value.packages?.[""]) value.packages[""].version = canonical;
  }],
  [".claude-plugin/plugin.json", (value) => { value.version = canonical; }],
  [".claude-plugin/marketplace.json", (value) => {
    for (const plugin of value.plugins || []) plugin.version = canonical;
  }],
];

let drift = false;
for (const [path, update] of targets) {
  const absolute = join(ROOT, path);
  const before = readFileSync(absolute, "utf8");
  const value = JSON.parse(before);
  const semanticBefore = JSON.stringify(value);
  update(value);
  if (semanticBefore === JSON.stringify(value)) continue;
  drift = true;
  if (process.argv.includes("--check")) console.error(`VERSION DRIFT: ${path} != ${canonical}`);
  else writeFileSync(absolute, JSON.stringify(value, null, 2) + "\n", "utf8");
}
if (process.argv.includes("--check") && drift) process.exit(1);
console.log(`version-sync: ${canonical}${drift && !process.argv.includes("--check") ? " written" : " verified"}.`);
