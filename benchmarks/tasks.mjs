/* Benchmark tasks — each is a fully-specified D&D 2024 level-1 build brief.
   The `reference` is a known-valid answers object (0 engine errors) used to compute
   the deterministic truth (AC/HP/PB/saves) and as the "grounded" correct fixture.
   The model under test receives `brief` and must output the claim JSON (see arms.mjs).
   Adding a task = add a valid examples/<id>.answers.json and an entry here. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ans = (f) => JSON.parse(readFileSync(join(ROOT, "examples", f), "utf8"));

export const TASKS = [
  {
    id: "dwarf-fighter",
    caster: false,
    brief:
      "Create a Dungeons & Dragons 2024 (5.5e) level-1 character. Fixed by the brief: " +
      "Dwarf (Nain) Fighter (Guerrier), Soldier (Soldat) background, ability scores " +
      "STR 15, DEX 13, CON 14, INT 8, WIS 12, CHA 10, and Fighter starting-equipment option A " +
      "(chain mail + greatsword + flail + javelins). You choose: two Fighter skills, a fighting " +
      "style, the Soldier ability-score bump, tool proficiency, and two origin languages. " +
      "Report the final sheet.",
    reference: ans("dwarf-fighter.answers.json"),
  },
  {
    id: "elf-druid",
    caster: true,
    brief:
      "Create a Dungeons & Dragons 2024 (5.5e) level-1 character. Fixed by the brief: " +
      "Wood Elf (Elfe sylvestre) Druid (Druide), Guide background, ability scores " +
      "STR 10, DEX 14, CON 13, INT 12, WIS 15, CHA 8, and Druid starting-equipment option A. " +
      "You choose: two Druid skills, the Primal Order, two Druid cantrips, four prepared Druid " +
      "spells, the species spell-casting ability, the Guide ability bump, the Magic Initiate " +
      "(Druid) picks, and two origin languages. Report the final sheet with spells and DCs.",
    reference: ans("elf-druid.answers.json"),
  },
];

export const byId = (id) => TASKS.find((t) => t.id === id);
