/* skills/build.mjs — oracle + scorer for dnd-build.
   Oracle: the engine computes the truth from the task's reference build. Scorer: turns
   the model's claimed sheet into atomic units + taxonomy errors, with cascade linking
   (derived-stat errors caused by a changed ability score become symptoms). */
import { computeCharacter } from "../../engine/build-character.mjs";
import { toCharacterModel, selectedSources, pendingChoices, normId } from "../../engine/resolver.mjs";
import { resolve } from "../lib.mjs";
import { makeError } from "../taxonomy.mjs";

const dv = (C, n) => { const d = C.derived.find((x) => x.name === n); return d ? Number(d.value) : NaN; };
const arr = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);
const ABIL = { str: "for", for: "for", dex: "dex", con: "con", int: "int", wis: "sag", sag: "sag", cha: "cha" };

export function oracle(env, task) {
  const { catalog } = env, ref = task.reference;
  const C = computeCharacter(toCharacterModel(catalog, ref));
  const classId = resolve(env.index, "classes", ref.classe) || ref.classe;
  const fixed = { classe: ref.classe, "sous-classe": ref["sous-classe"], espece: ref.espece,
    lignage: ref.lignage, historique: ref.historique, methode: ref.methode, abilityScores: ref.abilityScores, nom: ref.nom, _id: ref._id };

  const granted = new Set(), grantedCantrips = new Set(), grantedPrepared = new Set();
  for (const s of selectedSources(catalog, fixed)) for (const e of (s.effects || [])) {
    if (e.type === "grants" && e.what === "skillProficiency") granted.add(normId(e.value));
    if (e.type === "grants" && e.what === "cantrip") grantedCantrips.add(normId(e.spell));
    if (e.type === "grants" && e.what === "alwaysPreparedSpell") grantedPrepared.add(normId(e.spell));
  }
  let skillNeed = 0; const legalSkills = new Set(granted);
  for (const c of pendingChoices(catalog, fixed)) if ((c.kind || "").startsWith("competence")) {
    skillNeed += c.need || 1; for (const o of c.options) legalSkills.add(normId(o.id));
  }
  const classSpells = (catalog.spellsByClass && catalog.spellsByClass[classId]) || [];
  const legalCantrips = new Set(grantedCantrips), legalPrepared = new Set(grantedPrepared);
  for (const s of classSpells) ((s.level || 0) === 0 ? legalCantrips : legalPrepared).add(normId(s.id));

  // The reference is a real, engine-valid build: every skill/spell it actually grants IS
  // legal by definition. Fold them in so the oracle is self-consistent, and take the
  // expected counts from the reference itself (covers classes with skills from feats etc.).
  const refSkills = new Set(C.skills.filter((s) => s.prof).map((s) => normId(s.name)));
  for (const s of refSkills) legalSkills.add(s);
  for (const s of C.cantrips) legalCantrips.add(normId(s.id));   // feat-granted cantrips (e.g. Magic Initiate) are legal
  for (const s of C.prepared) legalPrepared.add(normId(s.id));

  return {
    classId, speciesId: resolve(env.index, "species", ref.espece), lineageId: ref.lignage || null,
    backgroundId: resolve(env.index, "backgrounds", ref.historique), scores: ref.abilityScores,
    PB: C.PB, ACs: new Set(C.derived.filter((d) => String(d.name).startsWith("CA")).map((d) => Number(d.value))),
    HP: dv(C, "Points de vie"), wisMod: C.mods.sag,
    saves: new Set(C.saves.filter((s) => s.prof).map((s) => s.a)),
    legalSkills, skillCount: refSkills.size,
    legalCantrips, legalPrepared, cantripCount: C.cantrips.length, preparedCount: C.prepared.length,
    isCaster: !!task.caster, isFighter: classId === "guerrier",
  };
}

/** The canonical correct claim for a reference build (engine-produced = ORACLE, never a
    model result). Used by the check oracle and the corpus generators. */
export function correctClaim(env, ref) {
  const C = computeCharacter(toCharacterModel(env.catalog, ref));
  const perceptionProf = C.skills.some((s) => s.prof && normId(s.name) === "perception");
  return {
    class: ref.classe, species: ref.espece, lineage: ref.lignage || null, background: ref.historique,
    abilityScores: ref.abilityScores, proficiencyBonus: C.PB,
    armorClass: dv(C, "CA"), hitPoints: dv(C, "Points de vie"),
    passivePerception: 10 + C.mods.sag + (perceptionProf ? C.PB : 0),
    savingThrowProficiencies: C.saves.filter((s) => s.prof).map((s) => s.a),
    skillProficiencies: C.skills.filter((s) => s.prof).map((s) => normId(s.name)),
    cantrips: C.cantrips.map((s) => s.id), preparedSpells: C.prepared.map((s) => s.id),
    fightingStyle: ref["guerrier-style-de-combat"] || null,
  };
}

export function score(env, task, response) {
  const O = oracle(env, task);
  const claim = response || {};
  const units = [], errors = [];
  const U = (id, type, status) => units.push({ id, type, status });
  const E = (o) => { const e = makeError({ task_id: task.id, skill: "dnd-build", ...o }); errors.push(e); return e; };

  // identity
  const gotClass = resolve(env.index, "classes", claim.class);
  U("class", "class", gotClass === O.classId ? "correct" : "incorrect");
  if (gotClass !== O.classId) E({ category: "brief-violation", severity: "critical", field: "class", expected: O.classId, observed: claim.class, evidence: "class differs from the brief" });
  const gotSpecies = resolve(env.index, "species", claim.species);
  U("species", "species", gotSpecies === O.speciesId ? "correct" : "incorrect");
  if (gotSpecies !== O.speciesId) E({ category: "brief-violation", severity: "critical", field: "species", expected: O.speciesId, observed: claim.species, evidence: "species differs from the brief" });
  const gotBg = resolve(env.index, "backgrounds", claim.background);
  U("background", "background", gotBg === O.backgroundId ? "correct" : "incorrect");
  if (gotBg !== O.backgroundId) E({ category: "brief-violation", field: "background", expected: O.backgroundId, observed: claim.background, evidence: "background differs from the brief" });

  // ability scores (brief-fixed). One root error if any changed; derived errors hang off it.
  const cs = claim.abilityScores || {};
  let abilityError = null;
  for (const a of ["for", "dex", "con", "int", "sag", "cha"]) {
    const ok = Number(cs[a]) === Number(O.scores[a]);
    U(`ability-${a}`, "ability-score", ok ? "correct" : "incorrect");
    if (!ok && !abilityError) abilityError = E({ category: "brief-violation", field: "abilityScores", expected: O.scores, observed: cs, evidence: "ability scores changed from the brief" });
  }
  const symptomParent = abilityError ? abilityError.error_id : null;
  const derivedErr = (o) => E({ ...o, root_cause: !symptomParent, parent_error_id: symptomParent });

  // derived
  U("proficiency-bonus", "proficiency-bonus", Number(claim.proficiencyBonus) === O.PB ? "correct" : "incorrect");
  if (Number(claim.proficiencyBonus) !== O.PB) derivedErr({ category: "arithmetic-error", field: "proficiencyBonus", expected: O.PB, observed: claim.proficiencyBonus, evidence: "PB is +2 at level 1" });
  U("armor-class", "armor-class", O.ACs.has(Number(claim.armorClass)) ? "correct" : "incorrect");
  if (!O.ACs.has(Number(claim.armorClass))) derivedErr({ category: "derived-stat-error", field: "armorClass", expected: [...O.ACs].join("/"), observed: claim.armorClass, evidence: "AC from armour + Dex (± shield)" });
  U("hit-points", "hit-points", Number(claim.hitPoints) === O.HP ? "correct" : "incorrect");
  if (Number(claim.hitPoints) !== O.HP) derivedErr({ category: "derived-stat-error", field: "hitPoints", expected: O.HP, observed: claim.hitPoints, evidence: "HP = max hit die + Con mod (+ species bonuses)" });

  const perceptionProf = arr(claim.skillProficiencies).map((s) => resolve(env.index, "skills", s)).includes("perception");
  const expPP = 10 + O.wisMod + (perceptionProf ? O.PB : 0);
  U("passive-perception", "passive-perception", Number(claim.passivePerception) === expPP ? "correct" : "incorrect");
  if (Number(claim.passivePerception) !== expPP) derivedErr({ category: "derived-stat-error", field: "passivePerception", expected: expPP, observed: claim.passivePerception, evidence: "10 + Wis mod + (PB if proficient)" });

  const claimSaves = new Set(arr(claim.savingThrowProficiencies).map((a) => ABIL[normId(a)] || normId(a)));
  const savesOk = claimSaves.size === O.saves.size && [...O.saves].every((a) => claimSaves.has(a));
  U("saving-throws", "saving-throw", savesOk ? "correct" : "incorrect");
  if (!savesOk) E({ category: "wrong-value", field: "savingThrowProficiencies", expected: [...O.saves].join(","), observed: [...claimSaves].join(","), evidence: "class saving-throw proficiencies" });

  // skills
  const claimedSkills = arr(claim.skillProficiencies);
  let legalCount = 0;
  claimedSkills.forEach((name) => {
    const id = resolve(env.index, "skills", name);
    if (!id) { U(`skill:${name}`, "skill", "incorrect"); E({ category: "invented-entity", field: "skillProficiencies", observed: name, evidence: "skill not in catalogue" }); }
    else if (!O.legalSkills.has(id)) { U(`skill:${id}`, "skill", "incorrect"); E({ category: "illegal-choice", field: "skillProficiencies", observed: id, evidence: "skill not legal for this build" }); }
    else { U(`skill:${id}`, "skill", "correct"); legalCount++; }
  });
  U("skill-count", "skill", claimedSkills.length === O.skillCount ? "correct" : "incorrect");
  if (claimedSkills.length !== O.skillCount) E({ category: "wrong-count", field: "skillProficiencies", expected: O.skillCount, observed: claimedSkills.length, evidence: "granted + chosen skill proficiencies" });

  // fighting style
  if (claim.fightingStyle) {
    if (!O.isFighter) { U("style", "feature", "extraneous"); E({ category: "illegal-choice", field: "fightingStyle", observed: claim.fightingStyle, evidence: "fighting style on a non-fighter" }); }
    else if (!resolve(env.index, "styles", claim.fightingStyle)) { U("style", "feature", "incorrect"); E({ category: "invented-entity", field: "fightingStyle", observed: claim.fightingStyle, evidence: "unknown fighting style" }); }
    else U("style", "feature", "correct");
  } else if (O.isFighter) { U("style", "feature", "missing"); E({ category: "missing-required-field", field: "fightingStyle", evidence: "a fighter chooses a fighting style" }); }

  // spells
  const scoreSpellList = (names, legal, expected, kind) => {
    names.forEach((name) => {
      const id = resolve(env.index, "spells", name);
      if (!id) { U(`${kind}:${name}`, "spell", "incorrect"); E({ category: "invented-entity", field: kind, observed: name, evidence: "spell not in catalogue" }); }
      else if (!legal.has(id)) { U(`${kind}:${id}`, "spell", "incorrect"); E({ category: "illegal-choice", field: kind, observed: id, evidence: `${kind} not on the class list` }); }
      else U(`${kind}:${id}`, "spell", "correct");
    });
    U(`${kind}-count`, "spell", names.length === expected ? "correct" : "incorrect");
    if (names.length !== expected) E({ category: "wrong-count", field: kind, expected, observed: names.length, evidence: `${kind} quota` });
  };
  const cantrips = arr(claim.cantrips), prepared = arr(claim.preparedSpells);
  if (!O.isCaster) {
    if (cantrips.length || prepared.length) { U("spells", "spell", "extraneous"); E({ category: "illegal-choice", field: "spells", severity: "critical", evidence: "non-caster has spells" }); }
    else U("spells", "spell", "not-applicable");
  } else {
    scoreSpellList(cantrips, O.legalCantrips, O.cantripCount, "cantrip");
    scoreSpellList(prepared, O.legalPrepared, O.preparedCount, "prepared");
  }

  return { units, errors };
}
