/* Agent Skills conformance: the skills satisfy the open spec, their generated
   bundles are in sync, and their eval sets are well-formed.
   Spec: https://agentskills.io/specification */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const run = (rel) => {
  try { execFileSync("node", [join(ROOT, rel)], { stdio: "pipe" }); return 0; }
  catch (e) { return e.status || 1; }
};
const rd = (p) => readFileSync(join(ROOT, p), "utf8");
const SKILLS = readdirSync(join(ROOT, "skills"), { withFileTypes: true })
  .filter((e) => e.isDirectory()).map((e) => e.name).sort();

test("check-skills-spec: every skill conforms to the Agent Skills spec", () => {
  assert.equal(run("scripts/check-skills-spec.mjs"), 0);
});

/* The bundled script must actually RUN. Byte-comparing it against the generator
   proves it is in sync, not that it parses — a stray backtick in the help text
   ships a shim that dies on import while every drift check stays green. */
for (const skill of SKILLS) {
  test(`${skill}: scripts/dnd.mjs runs and documents itself`, () => {
    const shim = join(ROOT, "skills", skill, "scripts", "dnd.mjs");
    const out = execFileSync("node", [shim, "--help"], { stdio: "pipe", encoding: "utf8" });
    assert.match(out, /Usage:/, "--help must print usage");
    assert.match(out, /Exit codes:/, "--help must document its exit codes");
  });
}

/* The spec caps SKILL.md at 500 lines so the activated body stays affordable. */
for (const skill of SKILLS) {
  test(`${skill}: SKILL.md stays under the 500-line guidance`, () => {
    const lines = rd(`skills/${skill}/SKILL.md`).split("\n").length;
    assert.ok(lines < 500, `${skill}/SKILL.md is ${lines} lines`);
  });
}

/* Eval sets follow the documented shape, and every referenced input file
   exists — a dangling `files` entry silently voids the test case.
   https://agentskills.io/skill-creation/evaluating-skills */
for (const skill of SKILLS) {
  test(`${skill}: evals.json is well-formed and its input files exist`, () => {
    const rel = `skills/${skill}/evals/evals.json`;
    assert.ok(existsSync(join(ROOT, rel)), `missing ${rel}`);
    const doc = JSON.parse(rd(rel));
    assert.equal(doc.skill_name, skill, "skill_name must match the skill directory");
    assert.ok(Array.isArray(doc.evals) && doc.evals.length > 0, "evals must be a non-empty array");
    for (const ev of doc.evals) {
      assert.ok(typeof ev.id === "number", `${skill}: eval id must be a number`);
      assert.ok(ev.prompt?.trim(), `${skill}: eval ${ev.id} needs a prompt`);
      assert.ok(ev.expected_output?.trim(), `${skill}: eval ${ev.id} needs an expected_output`);
      assert.ok(Array.isArray(ev.assertions) && ev.assertions.length > 0, `${skill}: eval ${ev.id} needs assertions`);
      for (const f of ev.files || []) {
        assert.ok(existsSync(join(ROOT, "skills", skill, f)), `${skill}: eval ${ev.id} references missing file ${f}`);
      }
    }
  });

  test(`${skill}: trigger queries are split and balanced`, () => {
    const doc = JSON.parse(rd(`skills/${skill}/evals/trigger_queries.json`));
    assert.equal(doc.skill_name, skill);
    const all = [...doc.train, ...doc.validation];
    assert.ok(all.length >= 16, `${skill}: only ${all.length} trigger queries`);
    // Both classes must be represented in each split, or the split measures nothing.
    for (const [name, set] of [["train", doc.train], ["validation", doc.validation]]) {
      assert.ok(set.some((q) => q.should_trigger === true), `${skill}: ${name} has no positive query`);
      assert.ok(set.some((q) => q.should_trigger === false), `${skill}: ${name} has no negative query`);
    }
  });
}
