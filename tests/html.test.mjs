/* HTML base consistency: the docs/html linter must pass — canonical format, data-* enums,
   no dead links/anchors/breadcrumbs, complete section indexes, no orphans. Guarantees the
   documentation stays coherent, standardised and fully cross-linked (629+ pages). */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

test("docs/html passes html-lint (format, enums, links, index coverage, orphans)", () => {
  let status = 0, out = "";
  try { out = execFileSync("node", [join(ROOT, "docs/_engine/html-lint.mjs"), "--quiet"], { encoding: "utf8" }); }
  catch (e) { status = e.status || 1; out = (e.stdout || "") + (e.stderr || ""); }
  assert.equal(status, 0, `html-lint reported problems:\n${out}`);
});
