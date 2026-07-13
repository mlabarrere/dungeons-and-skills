/* Correctness: the engine builds each golden example with 0 rules errors and the
   expected computed values, and rejects a broken model. This is the proof that the
   deterministic core (not the model's memory) produces the numbers. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { computeCharacter } from "../engine/build-character.mjs";
import { loadCatalogNode, toCharacterModel } from "../engine/resolver.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJSON = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const derived = (C, name) => (C.derived.find((d) => d.name === name) || {}).value;

const catalog = await loadCatalogNode();

const CASES = [
  { file: "examples/dwarf-fighter.answers.json",
    expect: { pb: 2, hp: 13, ac: 16, pp: 13, cantrips: 0, prepared: 0 } },
  { file: "examples/elf-druid.answers.json",
    expect: { pb: 2, hp: 9, ac: 15, pp: 14, cantrips: 5, prepared: 6 } },
];

for (const c of CASES) {
  test(`build ${c.file}: 0 errors + expected values`, () => {
    const model = toCharacterModel(catalog, readJSON(c.file));
    const C = computeCharacter(model);
    const errs = C.problems.filter((p) => p.level === "error");
    assert.equal(errs.length, 0, `sheet-lint errors: ${errs.map((e) => e.msg).join(" ; ")}`);
    assert.equal(C.PB, c.expect.pb, "proficiency bonus");
    assert.equal(derived(C, "Points de vie"), c.expect.hp, "HP");
    assert.equal(derived(C, "CA"), c.expect.ac, "AC");
    assert.equal(derived(C, "Perception passive"), c.expect.pp, "passive Perception");
    assert.equal(C.cantrips.length, c.expect.cantrips, "cantrip count");
    assert.equal(C.prepared.length, c.expect.prepared, "prepared count");
  });
}

test("a broken model is rejected (over-filled cantrip slot)", () => {
  // One cantrip on a list with no cantripSlots quota -> counter exceeded -> error.
  const bad = {
    id: "bad", identity: { name: "Bad", level: 1, className: "Guerrier" },
    abilityScores: { for: 15, dex: 14, con: 13, int: 8, sag: 12, cha: 10 },
    sources: [{ id: "guerrier-1", kind: "class-level", label: "Guerrier",
      effects: [{ type: "grants", what: "hitDie", die: 10 },
        { type: "grants", what: "cantripSlots", count: 0, list: "guerrier" }] }],
    choices: [], equipment: [],
    spells: { cantrips: [{ id: "flammes", list: "guerrier", origin: "chosen", status: "fourni" }], prepared: [] },
  };
  const C = computeCharacter(bad);
  assert.ok(C.problems.some((p) => p.level === "error"), "expected a rules error");
});
