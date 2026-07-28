/* Progression 1–20: data/progression.json is extracted from the class tables of the
   HTML rules base, so it must cover every class at every level with a coherent
   proficiency bonus and spell-slot shape. Also guards the level-1 prepared-spell cap:
   the resolver must not offer spells above the slots a level-1 character actually has. */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const rd = (p) => readFileSync(join(ROOT, p), "utf8");
const J = (p) => JSON.parse(rd(p));

const prog = J("data/progression.json");
const classes = J("data/classes.json");
const spells = J("data/spells.json");

const PB = (lvl) => 2 + Math.floor((lvl - 1) / 4); // SRD 5.2.1: +2 at 1–4, +3 at 5–8, …
const FULL_CASTERS = ["bard", "cleric", "druid", "sorcerer", "wizard"];
const HALF_CASTERS = ["paladin", "ranger"];

test("every class has 20 consecutive levels with the correct proficiency bonus", () => {
  for (const c of classes) {
    const entry = prog.classes[c.id];
    assert.ok(entry, `no progression for ${c.id}`);
    assert.equal(entry.levels.length, 20, `${c.id}: expected 20 levels`);
    entry.levels.forEach((row, i) => {
      assert.equal(row.level, i + 1, `${c.id}: level ${i + 1} out of order`);
      assert.equal(row.pb, PB(row.level), `${c.id} lvl ${row.level}: PB ${row.pb} != ${PB(row.level)}`);
    });
  }
});

test("each class cites the primary SRD document", () => {
  for (const c of classes) {
    assert.match(prog.classes[c.id].source, /^SRD 5\.2\.1 \(CC-BY-4\.0\)$/);
  }
});

test("full casters reach 9th-level slots; half casters stop at 5th; warlock uses pact slots", () => {
  for (const id of FULL_CASTERS) {
    const top = prog.classes[id].levels[19].slots;
    assert.ok(top && top["9"] >= 1, `${id}: no 9th-level slots at level 20`);
  }
  for (const id of HALF_CASTERS) {
    const top = prog.classes[id].levels[19].slots;
    assert.ok(top && top["5"] >= 1 && !top["6"], `${id}: half-caster slots should top out at 5th`);
  }
  const warlock = prog.classes.warlock.levels;
  assert.equal(warlock[0].pact.level, 1, "warlock lvl 1: pact slots are 1st level");
  assert.equal(warlock[19].pact.level, 5, "warlock lvl 20: pact slots are 5th level");
});

test("Ability Score Improvements land on levels 4, 8, 12 and 16", () => {
  for (const c of classes) {
    for (const lvl of [4, 8, 12, 16]) {
      const names = prog.classes[c.id].levels[lvl - 1].features.map((f) => f.name).join(" | ");
      assert.match(names, /Amelioration de caracteristique/, `${c.id} lvl ${lvl}: no ASI`);
    }
  }
});

test("engine/cli.mjs progression reports classes and subclasses, and admits gaps", () => {
  const run = (arg) => execFileSync("node", [join(ROOT, "engine/cli.mjs"), "progression", arg], { encoding: "utf8" });
  const warlock = JSON.parse(run("warlock"));
  assert.equal(warlock.levels.length, 20);
  const land = JSON.parse(run("circle-of-the-land"));
  assert.equal(land.parentClass, "druid");
  assert.ok(land.featuresByLevel["3"], "subclass features start at level 3");
  assert.throws(() => run("not-a-class"), /Manquant documentaire|status 1|Command failed/);
});

test("level-1 prepared-spell options never exceed the slots a level-1 caster has", async () => {
  // pathToFileURL: a bare absolute path is not a valid ESM specifier on Windows.
  const { loadCatalogNode, pendingChoices } = await import(pathToFileURL(join(ROOT, "engine/resolver.mjs")).href);
  const catalog = await loadCatalogNode();
  const spellLevel = new Map(spells.map((s) => [s.id, s.level]));
  for (const c of classes.filter((x) => x.spellcasting)) {
    const answers = { class: c.id, species: "human", background: "acolyte" };
    for (const choice of pendingChoices(catalog, answers)) {
      if (choice.kind !== "prepared") continue;
      for (const opt of choice.options || []) {
        const lvl = spellLevel.get(opt.id ?? opt);
        assert.equal(lvl, 1, `${c.id}: ${opt.id ?? opt} is level ${lvl}, not castable at character level 1`);
      }
    }
  }
});
