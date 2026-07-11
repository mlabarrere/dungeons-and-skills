/* Generate the "grounded" capture for each task = the claim a model produces when it
   actually runs the engine. By construction this scores 0 errors; it is the reference
   fixture and the grounded-arm replay output. Run: node benchmarks/gen-grounded.mjs */
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { computeCharacter } from "../engine/build-character.mjs";
import { toCharacterModel, normId } from "../engine/resolver.mjs";
import { loadAll } from "./lib.mjs";
import { TASKS } from "./tasks.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "benchmarks", "captures");
mkdirSync(OUT, { recursive: true });

const env = await loadAll();
const dv = (C, n) => { const d = C.derived.find((x) => x.name === n); return Number(d.value); };

for (const task of TASKS) {
  const ref = task.reference;
  const C = computeCharacter(toCharacterModel(env.catalog, ref));
  const perceptionProf = C.skills.some((s) => s.prof && normId(s.name) === "perception");
  const claim = {
    class: ref.classe, species: ref.espece, lineage: ref.lignage || null, background: ref.historique,
    abilityScores: ref.abilityScores,
    proficiencyBonus: C.PB,
    armorClass: dv(C, "CA"),
    hitPoints: dv(C, "Points de vie"),
    passivePerception: 10 + C.mods.sag + (perceptionProf ? C.PB : 0),
    savingThrowProficiencies: C.saves.filter((s) => s.prof).map((s) => s.a),
    skillProficiencies: C.skills.filter((s) => s.prof).map((s) => normId(s.name)),
    cantrips: C.cantrips.map((s) => s.id),
    preparedSpells: C.prepared.map((s) => s.id),
    fightingStyle: ref["guerrier-style-de-combat"] || null,
  };
  writeFileSync(join(OUT, `grounded.${task.id}.json`), JSON.stringify(claim, null, 2) + "\n", "utf8");
  console.log(`wrote grounded.${task.id}.json`);
}
