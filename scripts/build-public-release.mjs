#!/usr/bin/env node
import {
  existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createTarGz, createZip, sha256 } from "./lib/release-archive.mjs";

const ROOT = resolve(join(dirname(fileURLToPath(import.meta.url)), ".."));
const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index < 0 ? null : args[index + 1];
};
if (args.includes("--help")) {
  console.log("Usage: node scripts/build-public-release.mjs [--source PUBLIC_CHECKOUT] [--output DIR] [--source-date-epoch UNIX]");
  process.exit(0);
}

const sourceRoot = resolve(valueAfter("--source") || ROOT);
const outputRoot = resolve(valueAfter("--output") || join(dirname(sourceRoot), `${basename(sourceRoot)}-release`));
if (outputRoot === sourceRoot || sourceRoot.startsWith(outputRoot + sep) || outputRoot.startsWith(sourceRoot + sep)) {
  throw new Error("Release output must not contain or overwrite its source checkout.");
}
const versionSource = JSON.parse(readFileSync(join(sourceRoot, "version.json"), "utf8"));
const version = typeof versionSource === "string" ? versionSource : versionSource.version;
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version || "")) throw new Error("version.json has no valid semver version.");
const releaseName = `dungeons-and-skills-v${version}`;
const epochSeconds = Number(valueAfter("--source-date-epoch") || process.env.SOURCE_DATE_EPOCH || 0);
if (!Number.isSafeInteger(epochSeconds) || epochSeconds < 0) throw new Error("SOURCE_DATE_EPOCH must be a non-negative integer.");

const auditScript = join(sourceRoot, "scripts", "audit-public-catalog.mjs");
if (!existsSync(auditScript)) throw new Error("Missing scripts/audit-public-catalog.mjs; refusing to export an unaudited catalog.");
const audit = spawnSync(process.execPath, [auditScript], { cwd: sourceRoot, encoding: "utf8" });
if (audit.status !== 0) {
  process.stderr.write(audit.stdout);
  process.stderr.write(audit.stderr);
  throw new Error("Public catalog audit failed; no release was generated.");
}

const normalize = (path) => path.split(sep).join("/");
const files = [];
const visit = (directory) => {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    const absolute = join(directory, item.name);
    const path = normalize(relative(sourceRoot, absolute));
    if (path === ".git" || path.startsWith(".git/") || path === "release-manifest.json") continue;
    if (item.isDirectory()) visit(absolute);
    else if (item.isFile()) files.push(path);
    else throw new Error(`Unsupported filesystem entry in public checkout: ${path}`);
  }
};
visit(sourceRoot);
files.sort((a, b) => a.localeCompare(b, "en"));

const git = spawnSync("git", ["status", "--porcelain"], { cwd: sourceRoot, encoding: "utf8" });
if (git.status !== 0 || git.stdout.trim()) throw new Error("Public source checkout must be a clean Git repository.");
const gitHead = spawnSync("git", ["rev-parse", "HEAD"], { cwd: sourceRoot, encoding: "utf8" });
if (gitHead.status !== 0) throw new Error("Public source checkout has no commit.");
const commit = gitHead.stdout.trim();
const catalogManifest = JSON.parse(readFileSync(join(sourceRoot, "data", "catalog-manifest.json"), "utf8"));
const manifestFiles = files.map((path) => {
  const data = readFileSync(join(sourceRoot, path));
  return { path, bytes: data.length, sha256: sha256(data) };
});
const manifest = {
  schemaVersion: 1,
  version,
  commit,
  catalogProfile: catalogManifest.profile,
  catalogVersion: catalogManifest.version,
  license: catalogManifest.license,
  supportedRuntime: {
    node: ">=18",
    operatingSystems: ["ubuntu", "windows", "macos"],
    certifiedHosts: ["claude-code", "openai-codex", "cursor"]
  },
  generatedAt: epochSeconds ? new Date(epochSeconds * 1000).toISOString() : null,
  files: manifestFiles
};
const manifestText = JSON.stringify(manifest, null, 2) + "\n";
mkdirSync(outputRoot, { recursive: true });
writeFileSync(join(outputRoot, "release-manifest.json"), manifestText);
const entries = files.map((path) => ({
  path: `${releaseName}/${path}`,
  data: readFileSync(join(sourceRoot, path)),
  executable: path.endsWith(".mjs") && readFileSync(join(sourceRoot, path), "utf8").startsWith("#!")
}));
entries.push({ path: `${releaseName}/release-manifest.json`, data: Buffer.from(manifestText), executable: false });
const zipName = `${releaseName}.zip`;
const tgzName = `${releaseName}.tar.gz`;
const zip = createZip(entries, epochSeconds);
const tgz = createTarGz(entries, epochSeconds);
writeFileSync(join(outputRoot, zipName), zip);
writeFileSync(join(outputRoot, tgzName), tgz);
const manifestHash = sha256(Buffer.from(manifestText));
writeFileSync(join(outputRoot, "SHA256SUMS"),
  `${manifestHash}  release-manifest.json\n${sha256(tgz)}  ${tgzName}\n${sha256(zip)}  ${zipName}\n`);

console.log(`public-release: ${files.length + 1} files packaged from ${commit} into ${outputRoot}`);
