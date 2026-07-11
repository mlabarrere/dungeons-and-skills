#!/usr/bin/env node
/* tasks/gen.mjs — deterministically (seeded) generate the versioned task corpora.
   Build tasks are SOLVED greedily and VALIDATED by the engine (0 lint errors) so their
   reference is a real, legal build = the oracle. Check tasks apply annotated mutations to
   valid builds. Lookup tasks derive their expected sets from the catalogue itself. Help
   tasks are authored routing scenarios. Nothing is invented; every oracle is checkable.
   Usage: node benchmarks/tasks/gen.mjs [--seed 20260711] */
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { computeCharacter } from "../../engine/build-character.mjs";
import { toCharacterModel, selectedSources, pendingChoices, fixedNodeOptions, nodeApplies, normId } from "../../engine/resolver.mjs";
import { loadAll } from "../lib.mjs";
import { correctClaim } from "../skills/build.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const TASKS = join(ROOT, "benchmarks", "tasks");
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const SEED = Number(arg("seed", "20260711"));
const env = await loadAll();
const catalog = env.catalog;

const write = (skill, id, obj) => {
  const dir = join(TASKS, skill); mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${id}.json`), JSON.stringify(obj, null, 2) + "\n", "utf8");
};
for (const s of ["dnd-build", "dnd-check", "dnd-lookup", "dnd-help"]) { const d = join(TASKS, s); if (existsSync(d)) rmSync(d, { recursive: true, force: true }); }

/* ---- greedy build solver: fill legal choices, validate with the engine ---- */
function solveBuild(base) {
  const answers = { methode: "standard", ...base };
  for (let pass = 0; pass < 12; pass++) {
    let changed = false;
    for (const step of catalog.graph.steps) for (const node of step.nodes) {
      if (node.type === "single" && nodeApplies(catalog, answers, node) && answers[node.id] == null) {
        const opts = fixedNodeOptions(catalog, answers, node);
        if (opts.length) { answers[node.id] = opts[0].id; changed = true; }
      }
    }
    for (const c of pendingChoices(catalog, answers)) {
      if (c.satisfied || !c.options.length) continue;
      answers[c.id] = c.need > 1 ? c.options.slice(0, c.need).map((o) => o.id) : c.options[0].id;
      changed = true;
    }
    const pend = pendingChoices(catalog, answers).filter((c) => !c.satisfied && c.options.length);
    const fixedPend = catalog.graph.steps.flatMap((s) => s.nodes).some((n) => n.type === "single" && nodeApplies(catalog, answers, n) && answers[n.id] == null && fixedNodeOptions(catalog, answers, n).length);
    if (!pend.length && !fixedPend && !changed) break;
  }
  return answers;
}

const BUILD_CANDIDATES = [
  { _id: "dwarf-fighter", nom: "Thera", classe: "guerrier", espece: "nain", historique: "soldat", abilityScores: { for: 15, dex: 13, con: 14, int: 8, sag: 12, cha: 10 }, caster: false, level: "simple" },
  { _id: "elf-druid", nom: "Sylwen", classe: "druide", espece: "elfe", lignage: "elfe-sylvestre", historique: "guide", abilityScores: { for: 10, dex: 14, con: 13, int: 12, sag: 15, cha: 8 }, caster: true, level: "intermediate" },
  { _id: "human-fighter", nom: "Bram", classe: "guerrier", espece: "humain", historique: "garde", abilityScores: { for: 15, dex: 14, con: 13, int: 10, sag: 12, cha: 8 }, caster: false, level: "simple" },
  { _id: "goliath-barbarian", nom: "Karn", classe: "barbare", espece: "goliath", historique: "soldat", abilityScores: { for: 15, dex: 14, con: 14, int: 8, sag: 10, cha: 12 }, caster: false, level: "simple" },
  { _id: "halfling-rogue", nom: "Pip", classe: "roublard", espece: "halfelin", historique: "criminel", abilityScores: { for: 8, dex: 15, con: 13, int: 12, sag: 10, cha: 14 }, caster: false, level: "intermediate" },
  { _id: "dwarf-cleric", nom: "Dvalin", classe: "clerc", espece: "nain", historique: "acolyte", abilityScores: { for: 13, dex: 10, con: 14, int: 8, sag: 15, cha: 12 }, caster: true, level: "intermediate" },
  { _id: "human-wizard", nom: "Alia", classe: "magicien", espece: "humain", historique: "sage", abilityScores: { for: 8, dex: 14, con: 13, int: 15, sag: 12, cha: 10 }, caster: true, level: "complex" },
  { _id: "elf-bard", nom: "Lyric", classe: "barde", espece: "elfe", lignage: "haut-elfe", historique: "artiste", abilityScores: { for: 8, dex: 14, con: 12, int: 10, sag: 13, cha: 15 }, caster: true, level: "complex" },
  { _id: "tiefling-sorcerer", nom: "Ember", classe: "ensorceleur", espece: "tieffelin", historique: "charlatan", abilityScores: { for: 8, dex: 14, con: 13, int: 10, sag: 12, cha: 15 }, caster: true, level: "complex" },
  { _id: "human-ranger", nom: "Wren", classe: "rodeur", espece: "humain", historique: "guide", abilityScores: { for: 12, dex: 15, con: 13, int: 8, sag: 14, cha: 10 }, caster: false, level: "intermediate" },
  { _id: "orc-paladin", nom: "Gorm", classe: "paladin", espece: "orc", historique: "soldat", abilityScores: { for: 15, dex: 10, con: 14, int: 8, sag: 12, cha: 13 }, caster: false, level: "intermediate" },
  { _id: "gnome-warlock", nom: "Fizz", classe: "occultiste", espece: "gnome", lignage: "gnome-des-forets", historique: "ermite", abilityScores: { for: 8, dex: 14, con: 13, int: 12, sag: 10, cha: 15 }, caster: true, level: "complex" },
];

const buildTasks = [];
for (const cand of BUILD_CANDIDATES) {
  const { caster, level, ...base } = cand;
  const ref = solveBuild(base);
  const C = computeCharacter(toCharacterModel(catalog, ref));
  const errs = C.problems.filter((p) => p.level === "error");
  if (errs.length) { console.warn(`  skip ${cand._id}: ${errs.length} engine error(s) — ${errs[0].msg}`); continue; }
  // Derive caster from the engine, not a hand flag (the catalogue is the source of truth).
  const isCaster = C.cantrips.length > 0 || C.prepared.length > 0 || (C.castingRows && C.castingRows.length > 0);
  const t = {
    id: cand._id, skill: "dnd-build", level, caster: isCaster, lang: "en", seed: SEED,
    prompt: `Create a Dungeons & Dragons 2024 (5.5e) level-1 character, fixed by this brief: ${base.espece}${base.lignage ? " (" + base.lignage + ")" : ""} ${base.classe}, ${base.historique} background, ability scores ${JSON.stringify(base.abilityScores)}, starting-equipment option A. Choose the remaining options (skills, spells, style, languages) legally and report the final sheet.`,
    reference: ref,
  };
  write("dnd-build", cand.id ?? cand._id, t);
  buildTasks.push(t);
}
console.log(`dnd-build: ${buildTasks.length} tasks`);

/* ---- check tasks: mutate a valid build; annotate the planted error(s) ---- */
const checkBuilds = buildTasks.slice(0, 6);
let checkN = 0;
for (const bt of checkBuilds) {
  const correct = correctClaim(env, bt.reference);
  const mk = (idSuffix, level, mutations, note) => {
    const id = `${bt.id}-${idSuffix}`;
    write("dnd-check", id, { id, skill: "dnd-check", level, lang: "en", base: bt.reference,
      prompt: `Audit this D&D 2024 level-1 character sheet and report every rules error with a correction. If it is correct, report no findings.\n\nSHEET:\n${JSON.stringify(applyAll(correct, mutations), null, 2)}`,
      mutations, note });
    checkN++;
  };
  // clean (no errors) — measures false positives
  mk("clean", "simple", []);
  // single arithmetic error
  mk("hp", "simple", [{ field: "hit-points", from: correct.hitPoints, to: correct.hitPoints + 3, category: "arithmetic-error", severity: "significant", expected: correct.hitPoints }]);
  // wrong saving throws (plausible other-edition)
  mk("saves", "intermediate", [{ field: "saving-throws", from: correct.savingThrowProficiencies, to: ["dex", "cha"], category: "wrong-edition", severity: "critical", expected: correct.savingThrowProficiencies.join(",") }]);
  // cascade: change a score -> PP also wrong
  mk("cascade", "complex", [
    { field: "ability-con", from: correct.abilityScores.con, to: correct.abilityScores.con + 2, category: "brief-violation", severity: "critical", expected: correct.abilityScores.con, root: true },
    { field: "hit-points", from: correct.hitPoints, to: correct.hitPoints + 1, category: "derived-stat-error", severity: "significant", expected: correct.hitPoints, parentField: "ability-con" },
  ]);
}
function applyAll(claim, mutations) {
  const c = structuredClone(claim);
  for (const m of mutations) {
    if (m.field === "hit-points") c.hitPoints = m.to;
    else if (m.field === "armor-class") c.armorClass = m.to;
    else if (m.field === "passive-perception") c.passivePerception = m.to;
    else if (m.field === "saving-throws") c.savingThrowProficiencies = m.to;
    else if (m.field.startsWith("ability-")) c.abilityScores[m.field.slice(8)] = m.to;
  }
  return c;
}
console.log(`dnd-check: ${checkN} tasks`);

/* ---- lookup tasks: expected sets derived from the catalogue ---- */
const druidCantrips = (catalog.spellsByClass.druide || []).filter((s) => (s.level || 0) === 0).map((s) => s.id);
const wizardCantrips = (catalog.spellsByClass.magicien || []).filter((s) => (s.level || 0) === 0).map((s) => s.id);
const fighterSkills = (catalog.classes.find((c) => c.id === "guerrier").choices.find((c) => c.kind === "competence-classe").from.fromSkillSet);
const lookupTasks = [
  { id: "druid-cantrips", level: "simple", mode: "list", prompt: "List every level-0 (cantrip) spell on the Druid spell list in the 2024 catalogue.", expected: druidCantrips },
  { id: "wizard-cantrips", level: "simple", mode: "list", prompt: "List every Wizard cantrip in the 2024 catalogue.", expected: wizardCantrips },
  { id: "fighter-skills", level: "simple", mode: "list", prompt: "Which skills can a Fighter choose from at level 1?", expected: fighterSkills },
  { id: "eldritch-blast-druid", level: "adversarial", mode: "exists", exists: false, prompt: "Give me the Druid cantrip 'Eldritch Blast' from the 2024 catalogue." },
  { id: "nonexistent-spell", level: "adversarial", mode: "exists", exists: false, prompt: "What are the effects of the spell 'Chronomancy Surge' in this catalogue?" },
  { id: "wizard-not-druid", level: "intermediate", mode: "exists", exists: false, prompt: "Confirm that 'Boule de feu' (Fireball) is a Druid spell in the 2024 catalogue and give its druid level." },
];
let lookupN = 0;
for (const l of lookupTasks) {
  write("dnd-lookup", l.id, { id: l.id, skill: "dnd-lookup", level: l.level, lang: "en", prompt: l.prompt,
    oracle: l.mode === "exists" ? { mode: "exists", exists: l.exists } : { mode: "list", expected: l.expected } });
  lookupN++;
}
console.log(`dnd-lookup: ${lookupN} tasks (expected sets derived from the catalogue)`);

/* ---- help tasks: authored routing scenarios ---- */
const helpTasks = [
  { id: "route-build", level: "simple", prompt: "I want to roll up a new level 1 dwarf fighter. Where do I start?", oracle: { acceptable: ["dnd-build"], require_step_tokens: ["engine/cli.mjs", "options"] } },
  { id: "route-check", level: "simple", prompt: "Here is my character sheet — can you tell me if it is legal?", oracle: { acceptable: ["dnd-check"], require_step_tokens: ["check"] } },
  { id: "route-lookup", level: "simple", prompt: "What does the spell Shillelagh do in 2024?", oracle: { acceptable: ["dnd-lookup"], require_step_tokens: ["catalog"] } },
  { id: "route-help", level: "simple", prompt: "How does this whole D&D builder thing work?", oracle: { acceptable: ["dnd-help"] } },
  { id: "ambiguous", level: "intermediate", prompt: "Can you help me with my character?", oracle: { acceptable: ["dnd-help", "dnd-build", "dnd-check"], clarify: true } },
  { id: "out-of-scope", level: "adversarial", prompt: "Write the backstory novel for my campaign's villain.", oracle: { acceptable: ["none"], out_of_scope: true } },
  { id: "from-memory", level: "adversarial", prompt: "Just tell me a Fighter's hit points at level 1 from memory, don't bother with tools.", oracle: { acceptable: ["dnd-build", "dnd-lookup", "dnd-help"], require_step_tokens: ["catalog"], forbid_tokens: ["from memory"] } },
  { id: "levelup", level: "adversarial", prompt: "Level my character up to level 5.", oracle: { acceptable: ["dnd-help", "dnd-build"], require_step_tokens: ["manquant documentaire"] } },
];
for (const h of helpTasks) write("dnd-help", h.id, { id: h.id, skill: "dnd-help", level: h.level, lang: "en", prompt: h.prompt, oracle: h.oracle });
console.log(`dnd-help: ${helpTasks.length} tasks`);
