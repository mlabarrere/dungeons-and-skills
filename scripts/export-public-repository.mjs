#!/usr/bin/env node
import {
  chmodSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(join(dirname(fileURLToPath(import.meta.url)), ".."));
const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index < 0 ? null : args[index + 1];
};
if (args.includes("--help")) {
  console.log("Usage: node scripts/export-public-repository.mjs --output DIR");
  process.exit(0);
}
const output = valueAfter("--output");
if (!output) {
  console.error("An explicit --output directory is required.");
  process.exit(3);
}
const destination = resolve(output);
if (destination === ROOT || destination.startsWith(ROOT + sep) && !destination.startsWith(join(ROOT, "release") + sep)) {
  throw new Error("Public export may not overwrite the development checkout.");
}

const auditScript = join(ROOT, "scripts", "audit-public-catalog.mjs");
if (!existsSync(auditScript)) throw new Error("Missing scripts/audit-public-catalog.mjs; refusing to export an unaudited catalog.");
const audit = spawnSync(process.execPath, [auditScript], { cwd: ROOT, encoding: "utf8" });
if (audit.status !== 0) {
  process.stderr.write(audit.stdout);
  process.stderr.write(audit.stderr);
  throw new Error("Public catalog audit failed; no repository was exported.");
}

const config = JSON.parse(readFileSync(join(ROOT, "config", "public-release-files.json"), "utf8"));
const normalize = (path) => path.split(sep).join("/");
const excluded = config.exclude.map((path) => path.replaceAll("\\", "/").replace(/\/$/, ""));
const isExcluded = (rel) => excluded.some((entry) => rel === entry || rel.startsWith(entry + "/"));
const selected = new Set(config.files);
for (const directory of config.directories) {
  const absolute = join(ROOT, directory);
  if (!existsSync(absolute)) throw new Error(`Public release allowlist directory is missing: ${directory}`);
  const visit = (current) => {
    for (const item of readdirSync(current, { withFileTypes: true })) {
      const absoluteItem = join(current, item.name);
      const rel = normalize(relative(ROOT, absoluteItem));
      if (isExcluded(rel)) continue;
      if (item.isDirectory()) visit(absoluteItem);
      else if (item.isFile()) selected.add(rel);
      else throw new Error(`Unsupported filesystem entry in public allowlist: ${rel}`);
    }
  };
  visit(absolute);
}

const privateMarkers = [
  /(?:^|\/)\.claude\/worktrees(?:\/|$)/i,
  /(?:^|\/)docs\/(?:html|characters|_analysis)(?:\/|$)/i,
  /(?:^|\/)(?:private[-_.]|proprietary[-_.])/i,
  /(?:^|\/)(?:work|node_modules|release)(?:\/|$)/i,
];
for (const file of selected) {
  if (isExcluded(file)) throw new Error(`Allowlisted public file is also excluded: ${file}`);
  if (!existsSync(join(ROOT, file)) || !statSync(join(ROOT, file)).isFile()) {
    throw new Error(`Public release allowlist file is missing: ${file}`);
  }
  if (privateMarkers.some((pattern) => pattern.test(file))) {
    throw new Error(`Private/development path escaped into the public release: ${file}`);
  }
}

rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });
const files = [...selected].sort((a, b) => a.localeCompare(b, "en"));
for (const file of files) {
  const target = join(destination, file);
  mkdirSync(dirname(target), { recursive: true });
  cpSync(join(ROOT, file), target);
  if (file.endsWith(".mjs") && readFileSync(join(ROOT, file), "utf8").startsWith("#!")) chmodSync(target, 0o755);
}
console.log(`public-export: ${files.length} allowlisted files copied to ${destination} (no Git history).`);
