/* provenance.mjs — reproducibility manifest helpers (spec §14). */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function hashPaths(paths) {
  const h = createHash("sha256");
  for (const p of paths.sort()) { try { h.update(p); h.update(readFileSync(p)); } catch { /* skip */ } }
  return h.digest("hex").slice(0, 12);
}
function filesIn(dir, exts) {
  const out = [];
  const walk = (d) => { for (const e of readdirSync(d)) { const p = join(d, e); const s = statSync(p);
    if (s.isDirectory()) walk(p); else if (!exts || exts.some((x) => p.endsWith(x))) out.push(p); } };
  if (existsSync(dir)) walk(dir);
  return out;
}
export const sha = (s) => createHash("sha256").update(String(s)).digest("hex").slice(0, 12);

export function gitInfo() {
  try {
    const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT }).toString().trim();
    const dirty = execFileSync("git", ["status", "--porcelain"], { cwd: ROOT }).toString().trim().length > 0;
    return { git_commit: commit, dirty_worktree: dirty };
  } catch { return { git_commit: null, dirty_worktree: null }; }
}

export function versions() {
  return {
    catalogue_version: hashPaths(filesIn(join(ROOT, "data"), [".json"])),
    engine_version: hashPaths(filesIn(join(ROOT, "engine"), [".mjs"])),
    scorer_version: hashPaths([
      ...filesIn(join(ROOT, "benchmarks", "skills"), [".mjs"]),
      join(ROOT, "benchmarks", "scoring.mjs"), join(ROOT, "benchmarks", "taxonomy.mjs"),
    ]),
    task_set_version: hashPaths(filesIn(join(ROOT, "benchmarks", "tasks"), [".json"])),
  };
}
