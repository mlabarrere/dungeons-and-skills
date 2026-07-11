/* scorer.mjs — the deterministic error oracle.

   Given a task and a model's claimed character (JSON), it computes the TRUTH from
   the engine (AC/HP/PB/saves/quotas) and the legal option sets from the catalog,
   then counts every deviation as a tagged error. This is the objective metric:
   errors per character creation. No LLM, no judgement — pure functions.

   score(env, task, claim) -> { errors: number, findings: [{tag, detail}] } */
import { computeCharacter } from "../engine/build-character.mjs";
import { toCharacterModel, selectedSources, pendingChoices, normId } from "../engine/resolver.mjs";
import { resolve } from "./lib.mjs";

const derivedVal = (C, name) => { const d = C.derived.find((x) => x.name === name); return d ? Number(d.value) : NaN; };
const asArray = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);
const idSet = (arr) => new Set(arr.map((x) => normId(String(x))));

/** Everything the truth needs, derived once from the task's reference build. */
function expectations(env, task) {
  const { catalog } = env;
  const ref = task.reference;
  const truthModel = toCharacterModel(catalog, ref);
  const C = computeCharacter(truthModel);

  const classId = resolve(env.index, "classes", ref.classe) || ref.classe;
  const classEntry = catalog.classes.find((c) => c.id === classId) || {};

  // Fixed answers = identity + scores only; the free choices are what the model must make.
  const fixed = {
    classe: ref.classe, "sous-classe": ref["sous-classe"], espece: ref.espece,
    lignage: ref.lignage, historique: ref.historique, methode: ref.methode,
    abilityScores: ref.abilityScores, nom: ref.nom, _id: ref._id,
  };

  // Granted skills + the legal choosable skill set (skills have no cross-choice dependency).
  const granted = new Set();
  const grantedCantrips = new Set(), grantedPrepared = new Set();
  for (const s of selectedSources(catalog, fixed)) for (const e of (s.effects || [])) {
    if (e.type === "grants" && e.what === "skillProficiency") granted.add(normId(e.value));
    if (e.type === "grants" && e.what === "cantrip") grantedCantrips.add(normId(e.spell));
    if (e.type === "grants" && e.what === "alwaysPreparedSpell") grantedPrepared.add(normId(e.spell));
  }
  const pend = pendingChoices(catalog, fixed);
  let skillNeed = 0; const legalSkills = new Set(granted);
  for (const c of pend) if ((c.kind || "").startsWith("competence")) {
    skillNeed += c.need || 1;
    for (const o of c.options) legalSkills.add(normId(o.id));
  }

  // Spell universe = the class list (level 0 = cantrips, level >=1 = prepared) + granted.
  const classSpells = (catalog.spellsByClass && catalog.spellsByClass[classId]) || [];
  const legalCantrips = new Set(grantedCantrips), legalPrepared = new Set(grantedPrepared);
  for (const s of classSpells) {
    const lvl = s.level || 0;
    if (lvl === 0) legalCantrips.add(normId(s.id)); else legalPrepared.add(normId(s.id));
  }

  return {
    classId, hitDie: classEntry.hitDie,
    speciesId: resolve(env.index, "species", ref.espece),
    lineageId: ref.lignage || null,
    backgroundId: resolve(env.index, "backgrounds", ref.historique),
    scores: ref.abilityScores,
    PB: C.PB,
    ACs: new Set(C.derived.filter((d) => String(d.name).startsWith("CA")).map((d) => Number(d.value))),
    HP: derivedVal(C, "Points de vie"),
    saves: new Set(C.saves.filter((s) => s.prof).map((s) => s.a)),
    wisMod: C.mods.sag,
    granted, legalSkills, skillCount: granted.size + skillNeed,
    legalCantrips, legalPrepared,
    cantripCount: C.cantrips.length, preparedCount: C.prepared.length,
    isCaster: !!task.caster,
  };
}

export function score(env, task, claim) {
  const F = [];
  const add = (tag, detail) => F.push({ tag, detail });
  const E = expectations(env, task);
  claim = claim || {};

  // --- brief compliance: identity + given scores ---------------------------
  if (resolve(env.index, "classes", claim.class) !== E.classId) add("ignored-brief", `class: got "${claim.class}", expected ${E.classId}`);
  if (resolve(env.index, "species", claim.species) !== E.speciesId) add("ignored-brief", `species: got "${claim.species}"`);
  if (resolve(env.index, "backgrounds", claim.background) !== E.backgroundId) add("ignored-brief", `background: got "${claim.background}"`);
  const cs = claim.abilityScores || {};
  if (["for", "dex", "con", "int", "sag", "cha"].some((a) => Number(cs[a]) !== Number(E.scores[a]))) add("ignored-brief", "ability scores changed from the brief");

  // --- core math (edition-mix shows up here) -------------------------------
  if (Number(claim.proficiencyBonus) !== E.PB) add("math-pb", `PB ${claim.proficiencyBonus} != ${E.PB}`);
  if (!E.ACs.has(Number(claim.armorClass))) add("math-ac", `AC ${claim.armorClass} not in {${[...E.ACs].join(",")}}`);
  if (Number(claim.hitPoints) !== E.HP) add("math-hp", `HP ${claim.hitPoints} != ${E.HP}`);

  const ABIL = { str: "for", for: "for", dex: "dex", con: "con", int: "int", wis: "sag", sag: "sag", cha: "cha" };
  const claimSaves = new Set(asArray(claim.savingThrowProficiencies).map((a) => ABIL[normId(a)] || normId(a)));
  const sameSaves = claimSaves.size === E.saves.size && [...E.saves].every((a) => claimSaves.has(a));
  if (!sameSaves) add("math-saves", `save proficiencies ${[...claimSaves]} != ${[...E.saves]}`);

  const claimSkills = asArray(claim.skillProficiencies);
  const resolvedSkills = claimSkills.map((s) => resolve(env.index, "skills", s));
  const perceptionProf = resolvedSkills.includes("perception");
  const expectedPP = 10 + E.wisMod + (perceptionProf ? E.PB : 0);
  if (Number(claim.passivePerception) !== expectedPP) add("math-pp", `passive Perception ${claim.passivePerception} != ${expectedPP}`);

  // --- skills: invented / illegal / count ----------------------------------
  const legalResolved = [];
  resolvedSkills.forEach((id, i) => {
    if (!id) add("invented-skill", `skill "${claimSkills[i]}" not in catalog (wrong edition?)`);
    else if (!E.legalSkills.has(id)) add("illegal-skill", `skill "${id}" not legal for this build`);
    else legalResolved.push(id);
  });
  if (new Set(legalResolved).size + resolvedSkills.filter((x) => !x).length !== E.skillCount &&
      claimSkills.length !== E.skillCount) add("wrong-count-skills", `${claimSkills.length} skill proficiencies, expected ${E.skillCount}`);

  // --- fighting style (fighter only) ---------------------------------------
  if (claim.fightingStyle) {
    if (E.classId !== "guerrier") add("illegal-style", "fighting style on a non-fighter");
    else if (!resolve(env.index, "styles", claim.fightingStyle)) add("invented-style", `fighting style "${claim.fightingStyle}" unknown`);
  }

  // --- spells --------------------------------------------------------------
  const cantrips = asArray(claim.cantrips), prepared = asArray(claim.preparedSpells);
  if (!E.isCaster) {
    if (cantrips.length || prepared.length) add("illegal-spells-noncaster", "non-caster has spells");
  } else {
    const checkList = (names, legal, kind, expected) => {
      const resolved = names.map((n) => resolve(env.index, "spells", n));
      resolved.forEach((id, i) => {
        if (!id) add(`invented-${kind}`, `${kind} "${names[i]}" not in catalog (wrong edition?)`);
        else if (!legal.has(id)) add(`illegal-${kind}`, `${kind} "${id}" not on the class list`);
      });
      if (names.length !== expected) add(`wrong-count-${kind}`, `${names.length} ${kind}, expected ${expected}`);
    };
    checkList(cantrips, E.legalCantrips, "cantrip", E.cantripCount);
    checkList(prepared, E.legalPrepared, "prepared", E.preparedCount);
  }

  return { errors: F.length, findings: F };
}

export { expectations };
