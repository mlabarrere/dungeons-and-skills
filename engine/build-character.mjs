/* GENERATED COPY — do not edit. Source: docs/_engine/build-character.mjs. */
/* Regenerate: node scripts/build-bundles.mjs — verified by scripts/check-sync.mjs. */
/* ==========================================================================
   build-character.mjs — deterministic Character computation
   Usage : node docs/_engine/build-character.mjs medicis malbec
   Exporte computeCharacter(); renderers are re-exported for compatibility.
   ESM PUR importable navigateur : aucune dependance Node en tete de module ;
   les APIs Node (fs/url/path) sont chargees dynamiquement dans le bloc CLI.
   ========================================================================== */
import { normId } from "./resolver.mjs";
export { renderHTML, renderMarkdown } from "./render-character.mjs";
import { renderHTML } from "./render-character.mjs";

export const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"];
const ABILITY_LABEL = { str: "Strength", dex: "Dexterity", con: "Constitution", int: "Intelligence", wis: "Wisdom", cha: "Charisma" };
const SKILLS = {
  "Acrobatics": "dex", "Arcana": "int", "Athletics": "str", "Stealth": "dex",
  "Animal Handling": "wis", "Sleight of Hand": "dex", "History": "int", "Intimidation": "cha",
  "Insight": "wis", "Investigation": "int", "Medicine": "wis", "Nature": "int",
  "Perception": "wis", "Persuasion": "cha", "Performance": "cha", "Religion": "int",
  "Deception": "cha", "Survival": "wis",
};
const STATUSES = ["provided", "granted", "computed", "derived", "recommended", "ruling-needed", "missing", "incoherent", "conflict"];

const mod = (s) => Math.floor((s - 10) / 2);
const sign = (n) => (n >= 0 ? "+" + n : "" + n);
const pbForLevel = (lvl) => 2 + Math.floor((Math.max(1, lvl) - 1) / 4);
const provenance = (text, sources = [], formula = null) => ({ text, sources: sources.filter(Boolean), ...(formula ? { formula } : {}) });

/* ------------------------------------------------------------------ compute */
export function computeCharacter(model) {
  const problems = [];
  const problem = (level, code, params, msg) => problems.push({ level, code, params: params || {}, msg });
  const err = (code, params, msg) => problem("error", code, params, msg);
  const warn = (code, params, msg) => problem("warn", code, params, msg);

  const lvl = model.identity?.level ?? 1;
  const PB = pbForLevel(lvl);
  const scores = model.abilityScores || {};
  const mods = {};
  ABILITIES.forEach((a) => { mods[a] = mod(scores[a] ?? 10); });

  // -- Rassembler les effets (sources + choix qui portent des effets) --------
  const effects = [];
  (model.sources || []).forEach((src) => {
    (src.effects || []).forEach((e) =>
      effects.push({ ...e, _from: src.id, _label: src.label || src.id, _ref: src.ref, _kind: src.kind, _status: "source" }));
  });
  (model.choices || []).forEach((c) => {
    if (!STATUSES.includes(c.status)) err("invalid-status", { entity: "choice", id: c.id, status: c.status }, `choix ${c.id}: statut invalide "${c.status}"`);
    (c.effects || []).forEach((e) =>
      effects.push({ ...e, _from: c.id, _label: c.label || c.id, _status: c.status, _via: "choix" }));
  });
  const grantsOf = (what) => effects.filter((e) => e.type === "grants" && e.what === what);

  // -- Maitrises --------------------------------------------------------------
  const saveProf = {};
  grantsOf("savingThrowProficiency").forEach((e) => { saveProf[e.value] = e; });
  const skillProf = {};
  // Cle normalisee (id kebab) : le catalogue utilise "discretion", les fiches "Discretion".
  grantsOf("skillProficiency").forEach((e) => { const k = normId(e.value); if (!skillProf[k] || e.expertise) skillProf[k] = e; });
  const languages = grantsOf("language").map((e) => ({ v: e.value, src: e._label, st: e._status }));
  const tools = grantsOf("toolProficiency").map((e) => ({ v: e.value, src: e._label, st: e._status }));
  const armorTraining = grantsOf("armorTraining").map((e) => e.value);
  const hasShieldTraining = grantsOf("shieldTraining").length > 0;
  const weaponProf = grantsOf("weaponProficiency").map((e) => ({ v: e.value, src: e._label }));
  // Aptitudes narratives (effect `feature`) : affichees, jamais calculees.
  const features = grantsOf("feature").map((e) => ({
    featureId: e.featureId || e.id || normId(e.name || e.value || "feature"),
    name: e.name || e.value, level: e.level, src: e._label, sourceId: e._from,
    st: e._status || "source",
  }));
  // PV bonus par niveau (ex. nain : +1 PV/niveau).
  const bonusHPPerLevel = grantsOf("bonusHitPointsPerLevel").reduce((a, e) => a + (e.value || 0), 0);

  // -- requires (preconditions) ----------------------------------------------
  effects.filter((e) => e.type === "requires").forEach((e) => {
    if (e.precondition === "shieldTraining" && !hasShieldTraining)
      err("missing-precondition", { source: e._label, precondition: "shieldTraining" }, `${e._label}: requiert shieldTraining, absent`);
  });

  // -- Incantation : listes, compteurs ---------------------------------------
  const casting = {}; // list -> {ability, src, sourceId}
  grantsOf("spellcasting").forEach((e) => {
    casting[e.list] = { ability: e.ability, src: e._label, sourceId: e._from };
  });
  const cantripAllowed = {}, preparedAllowed = {};
  grantsOf("cantripSlots").forEach((e) => { cantripAllowed[e.list] = (cantripAllowed[e.list] || 0) + e.count; });
  grantsOf("preparedSlots").forEach((e) => { preparedAllowed[e.list] = (preparedAllowed[e.list] || 0) + e.count; });

  const cantrips = (model.spells?.cantrips) || [];
  const prepared = (model.spells?.prepared) || [];
  // Un sort ACCORDE est justifie par son effet d'octroi, pas par un quota (les
  // cantrips d'espece n'ont pas de `cantripSlots`). Ne compter que les picks
  // CHOISIS permet d'iterer l'union des listes sans exception codee en dur.
  const cantripUsed = {}, preparedUsed = {};
  cantrips.forEach((s) => { if (s.origin === "chosen") cantripUsed[s.list] = (cantripUsed[s.list] || 0) + 1; });
  prepared.forEach((s) => { if (s.origin === "chosen") preparedUsed[s.list] = (preparedUsed[s.list] || 0) + 1; });

  // Compteurs sur l'UNION quota+usage. N'iterer que `*Allowed` rendait invisible
  // tout pick choisi sur une liste sans quota : la fiche en portait autant qu'elle
  // voulait et le lint restait vert.
  const counters = [];
  const unionLists = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])];
  /* Deux regimes, et les confondre produit des faux positifs sur des fiches
     legales. Une liste AVEC quota est bornee : la depasser est une erreur dure.
     Une liste SANS quota n'est pas forcement illegale — le don Initie a la magie
     autorise ses picks via le `count` d'un `choices`, pas via un `*Slots`, et le
     modele construit ne porte pas les choices de ses sources, donc le linter ne
     peut pas attribuer la permission. On le SIGNALE au lieu de l'inventer dans un
     sens ou dans l'autre : la fiche ne passe plus pour verifiee, et l'agent sait
     exactement quoi controler a la main. */
  const unquota = [];
  unionLists(cantripAllowed, cantripUsed).forEach((list) => {
    const used = cantripUsed[list] || 0;
    const quotaDeclared = Object.prototype.hasOwnProperty.call(cantripAllowed, list);
    const allowed = quotaDeclared ? cantripAllowed[list] : null;
    const state = quotaDeclared ? (used > allowed ? "exceeded" : used < allowed ? "missing" : "ok") : (used ? "unverified" : "ok");
    counters.push({ key: "cantrips", kind: "Sorts mineurs", list, used, allowed, quotaDeclared, state });
    if (quotaDeclared && used > allowed) err("counter-exceeded", { kind: "cantrips", list, used, allowed }, `compteur cantrips (${list}) depasse : ${used}/${allowed}`);
    else if (!quotaDeclared && used) unquota.push(`${used} sort(s) mineur(s) sur la liste "${list}"`);
  });
  unionLists(preparedAllowed, preparedUsed).forEach((list) => {
    const used = preparedUsed[list] || 0;
    const quotaDeclared = Object.prototype.hasOwnProperty.call(preparedAllowed, list);
    const allowed = quotaDeclared ? preparedAllowed[list] : null;
    const state = quotaDeclared ? (used > allowed ? "exceeded" : used < allowed ? "missing" : "ok") : (used ? "unverified" : "ok");
    counters.push({ key: "prepared", kind: "Sorts prepares", list, used, allowed, quotaDeclared, state });
    if (quotaDeclared && used > allowed) err("counter-exceeded", { kind: "prepared", list, used, allowed }, `compteur sorts prepares (${list}) depasse : ${used}/${allowed}`);
    else if (!quotaDeclared && used) unquota.push(`${used} sort(s) prepare(s) sur la liste "${list}"`);
  });
  if (unquota.length) {
    warn("counter-unverified", { items: unquota }, `aucun quota declare pour : ${unquota.join(" ; ")} — nombre non verifie par le moteur, a controler contre la source qui les accorde`);
  }

  // -- Verifs sorts : cantrips/alwaysPrepared accordas presents ---------------
  const cantripIds = new Set(cantrips.map((s) => s.id));
  grantsOf("cantrip").forEach((e) => {
    if (!cantripIds.has(e.spell)) err("granted-cantrip-missing", { spell: e.spell, source: e._label }, `cantrip accorde absent de la fiche : ${e.spell} (${e._label})`);
  });
  const preparedIds = new Set(prepared.map((s) => s.id));
  grantsOf("alwaysPreparedSpell").forEach((e) => {
    if (!preparedIds.has(e.spell)) err("always-prepared-missing", { spell: e.spell, source: e._label }, `sort toujours prepare absent : ${e.spell} (${e._label})`);
  });

  // -- Conflits : meme sort accorde (auto) ET choisi (chosen) -----------------
  const conflicts = [];
  const grantedCantripSpells = new Map();
  grantsOf("cantrip").forEach((e) => grantedCantripSpells.set(e.spell, e._label));
  cantrips.forEach((s) => {
    if (s.origin === "chosen" && grantedCantripSpells.has(s.id)) {
      const via = grantedCantripSpells.get(s.id);
      conflicts.push({ what: s.label || s.id, a: `choisi (${s.list})`, b: `deja accorde par ${via}`, fix: "remplacer le choix" });
      if (s.status !== "conflict") err("duplicate-spell-unmarked", { spell: s.id, source: via }, `doublon non marque conflit : ${s.id} (accorde par ${via} + choisi)`);
    }
  });

  // -- Choix manquants (requiresChoice non satisfaits) ------------------------
  // Le plancher etait verifie, jamais le plafond : fournir 4 picks la ou l'effet
  // en demande 2 passait a 0 erreur, et la fiche portait deux maitrises illegales.
  const satisfiedCount = {};
  (model.choices || []).forEach((c) => { if (c.satisfies) satisfiedCount[c.satisfies] = (satisfiedCount[c.satisfies] || 0) + 1; });
  const satisfied = new Set(Object.keys(satisfiedCount));
  const missing = [];
  effects.filter((e) => e.type === "requiresChoice").forEach((e) => {
    const want = e.count || 1, got = satisfiedCount[e.kind] || 0;
    if (!got) missing.push({ kind: e.kind, count: want, from: e.from, src: e._label, sourceId: e._from });
    else if (got > want) err("choice-overfilled", { kind: e.kind, got, wanted: want, source: e._label }, `choix "${e.kind}" sur-rempli : ${got} pour ${want} demande(s) (${e._label})`);
    else if (got < want) missing.push({ kind: e.kind, count: want - got, from: e.from, src: e._label, sourceId: e._from });
  });
  // Compteurs de choix restants (cantrips/prepares sous quota)
  counters.forEach((c) => { if (c.quotaDeclared && c.used < c.allowed) missing.push({ kind: `${c.kind} ${c.list}`, count: c.allowed - c.used, from: `liste ${c.list}`, src: "quota" }); });

  // -- Valeurs derivees (avec provenance) -------------------------------------
  const D = []; // {name, value, status, prov}
  const conMod = mods.con;
  const hitDieE = grantsOf("hitDie")[0];
  if (!hitDieE) warn("missing-hit-die", {}, "aucun hitDie accorde (PV non calculable)");
  const hitDie = hitDieE ? hitDieE.die : null;
  if (hitDie) {
    const prov = `dé de vie d${hitDie} (max ${hitDie}) + mod Con (${sign(conMod)})${bonusHPPerLevel ? ` + ${bonusHPPerLevel}/niveau x${lvl}` : ""} <- ${hitDieE._label}`;
    D.push({ key: "hp", name: "Points de vie", value: hitDie + conMod + bonusHPPerLevel * lvl, status: "computed",
      prov, provenance: provenance(prov, [hitDieE._from], "hitDie + conMod + bonusHPPerLevel * level") });
  }
  {
    const prov = hitDie ? `classe <- ${hitDieE._label} (dé de vie, PAS de dégâts)` : "hitDie manquant";
    D.push({ key: "hitDie", name: "Dé de vie", value: `1d${hitDie || "?"}`, status: hitDie ? "source" : "missing",
      prov, provenance: provenance(prov, hitDieE ? [hitDieE._from] : []) });
  }

  // CA depuis l'equipement
  const armorItem = (model.equipment || []).find((it) => it.armor);
  const shieldItem = (model.equipment || []).find((it) => it.shield);
  let ca, caProv;
  if (armorItem) {
    const dexPart = armorItem.armor.dexMax != null ? Math.min(mods.dex, armorItem.armor.dexMax) : mods.dex;
    ca = armorItem.armor.base + dexPart;
    caProv = `${armorItem.object} base ${armorItem.armor.base} + Dex ${sign(dexPart)}${armorItem.armor.dexMax != null ? ` (plafond ${armorItem.armor.dexMax})` : ""}`;
  } else { ca = 10 + mods.dex; caProv = `10 + Dex ${sign(mods.dex)} (sans armure)`; }
  if (shieldItem) {
    if (!hasShieldTraining) err("shield-without-training", {}, "bouclier equipe sans maitrise des boucliers");
    ca += 2;
    caProv += ` + bouclier +2`;
  }
  D.push({ key: "ac", name: "CA", value: ca, status: "computed", prov: caProv,
    provenance: provenance(caProv, [armorItem?.id, shieldItem?.id], "armorBase + dexterity + shield") });
  D.push({ key: "initiative", name: "Initiative", value: sign(mods.dex), status: "computed", prov: `mod Dex ${sign(mods.dex)}`,
    provenance: provenance(`mod Dex ${sign(mods.dex)}`, [], "dexterityModifier") });
  const percProf = !!skillProf[normId("Perception")];
  const pp = 10 + mods.wis + (percProf ? PB : 0);
  const ppProv = `10 + Sag ${sign(mods.wis)}${percProf ? ` + maitrise ${sign(PB)}` : ""}`;
  D.push({ key: "passivePerception", name: "Perception passive", value: pp, status: "computed", prov: ppProv,
    provenance: provenance(ppProv, percProf ? [skillProf[normId("Perception")]._from] : [], "10 + wisdomModifier + proficiency") });

  // Incantation par liste
  const castingRows = [];
  Object.entries(casting).forEach(([list, c]) => {
    const m = mods[c.ability];
    castingRows.push({ list, ability: c.ability, dc: 8 + PB + m, atk: PB + m, sourceId: c.sourceId,
      prov: `DD 8 + maitrise ${sign(PB)} + ${ABILITY_LABEL[c.ability]} ${sign(m)} <- ${c.src}` });
  });

  // Jets de sauvegarde
  const saves = ABILITIES.map((a) => {
    const prof = !!saveProf[a];
    return { a, total: mods[a] + (prof ? PB : 0), prof, src: prof ? saveProf[a]._label : null,
      sourceId: prof ? saveProf[a]._from : null };
  });

  // Competences
  const skills = Object.entries(SKILLS).map(([name, ab]) => {
    const p = skillProf[normId(name)];
    const exp = p && p.expertise;
    const total = mods[ab] + (p ? PB : 0) + (exp ? PB : 0);
    return { name, ab, total, prof: !!p, exp: !!exp, src: p ? (p._label || "") : null,
      sourceId: p ? p._from : null, st: p ? p._status : null };
  });

  // Equipement decompose
  (model.equipment || []).forEach((it) => {
    if (!it.roles || !it.roles.length) warn("equipment-role-missing", { item: it.object }, `objet sans roles decomposes : ${it.object}`);
    if (!it.id) warn("legacy-id-unresolved", { entity: "equipment", label: it.object }, `ancien modele : id catalogue non resolu pour l'objet "${it.object}"`);
  });

  // Statuts hors enum sur les sorts
  [...cantrips, ...prepared].forEach((s) => { if (s.status && !STATUSES.includes(s.status)) err("invalid-status", { entity: "spell", id: s.id, status: s.status }, `sort ${s.id}: statut invalide "${s.status}"`); });

  return { model, lvl, PB, scores, mods, effects, saveProf, skillProf, languages, tools, weaponProf,
    features, bonusHPPerLevel, armorTraining, hasShieldTraining, casting, castingRows, counters,
    cantrips, prepared, conflicts, missing, derived: D, saves, skills, problems };
}

/* ---------------------------------------------------------------------- CLI */
/* Bloc Node uniquement : ignore silencieusement dans le navigateur (pas de `process`).
   Les APIs Node sont importees dynamiquement pour garder le module importable partout. */
if (typeof process !== "undefined" && process.argv && process.argv[1]) {
  (async () => {
    const { readFileSync, writeFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const { dirname, join } = await import("node:path");
    if (fileURLToPath(import.meta.url) !== process.argv[1]) return; // importe, pas execute
    const HERE = dirname(fileURLToPath(import.meta.url));
    const CHARDIR = join(HERE, "..", "characters");
    const OUTDIR = join(HERE, "..", "html", "personnages");
    const ids = process.argv.slice(2);
    if (!ids.length) { console.error("usage: node build-character.mjs <id> [<id>...]"); process.exit(2); }
    let totalErr = 0;
    for (const id of ids) {
      const model = JSON.parse(readFileSync(join(CHARDIR, `${id}.character.json`), "utf8"));
      const C = computeCharacter(model);
      writeFileSync(join(OUTDIR, `${id}.html`), renderHTML(C, {
        lang: "en", mode: "site", source: `docs/characters/${id}.character.json`,
      }), "utf8");
      const errs = C.problems.filter((p) => p.level === "error");
      totalErr += errs.length;
      console.log(`${id}.html generated — ${errs.length} error(s), ${C.problems.filter(p => p.level === "warn").length} warning(s).`);
      C.problems.forEach((p) => console.log(`   [${p.level}] ${p.msg}`));
    }
    process.exit(totalErr ? 1 : 0);
  })();
}
