/* ==========================================================================
   golden-test.mjs — preuve « on ne se perd pas ».
   Reconstruit Medicis (druide) et Malbec (clerc) par PARCOURS DU GRAPHE
   (answers -> resolver.toCharacterModel -> computeCharacter) et compare la
   fiche calculee a la fiche de reference (docs/characters/<id>.character.json
   passee dans le MEME computeCharacter).
   Usage : node docs/_engine/golden-test.mjs
   Sortie : 0 si equivalence sur le noyau deterministe + 0 erreur ; 1 sinon.

   Noyau compare STRICTEMENT (le graphe le reconstruit entierement) :
     PB, modificateurs, jets de sauvegarde, competences (18), PV, CA, CA+bouclier,
     initiative, Perception passive, incantation (DD/atk) de la liste de classe,
     et 0 erreur de lint des deux cotes.
   Informatif (imprime, non bloquant) — divergences de MODELISATION connues entre
   la fiche de reference (ecrite main) et le catalogue (pilote par les choix) :
     langues (les references sont inegales : Medicis a ses langues d'origine, pas
     Malbec), listes de sorts et compteurs du don « Initie a la magie »
     (reference : liste dediee « initie-<classe> » ; catalogue : via choix).
   ========================================================================== */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadCatalogNode, toCharacterModel } from "./resolver.mjs";
import { computeCharacter } from "./build-character.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const CHARDIR = join(HERE, "..", "characters");

/* ---- answers retro-conçus depuis les fiches de reference ------------------ */
const ANSWERS = {
  medicis: {
    _id: "medicis", nom: "Medicis", classe: "druide", espece: "elfe",
    lignage: "elfe-sylvestre", historique: "guide",
    abilityScores: { for: 10, dex: 11, con: 14, int: 14, sag: 17, cha: 14 },
    "druide-competences": ["dressage", "nature"],
    "elfe-sens-aiguises": ["perception"],
    "druide-ordre-primitif": "mage",
    "druide-cantrips": ["flammes"],
    "druide-prepares": ["amitie-avec-les-animaux", "lueurs-feeriques", "soins", "vague-tonnante"],
    "initie-a-la-magie-liste": "druide", "initie-a-la-magie-carac": "sag",
    "origine-langues-choix": ["elfique", "geant"],
    "druide-equipement": "A", "guide-equipement": "A",
  },
  malbec: {
    _id: "malbec", nom: "Malbec", classe: "clerc", espece: "tieffelin",
    lignage: "tieffelin-abyssal", historique: "acolyte",
    abilityScores: { for: 13, dex: 12, con: 12, int: 13, sag: 18, cha: 11 },
    "clerc-competences": ["medecine", "histoire"],
    "clerc-ordre-divin": "thaumaturge",
    "clerc-cantrips": ["flamme-sacree", "mot-de-radiance", "glas"],
    "clerc-prepares": ["benediction", "soins", "rayon-tractant", "bouclier-de-la-foi"],
    "initie-a-la-magie-liste": "clerc", "initie-a-la-magie-carac": "sag",
    "origine-langues-choix": ["abyssal", "celeste"],
    "clerc-equipement": "A",
  },
};

/* ---- helpers de comparaison (insensibles a l'ordre) ----------------------- */
const J = (x) => JSON.stringify(x);
const derivedVal = (C, name) => { const d = C.derived.find((x) => x.name === name); return d ? d.value : undefined; };
const savesMap = (C) => Object.fromEntries(C.saves.map((s) => [s.a, { total: s.total, prof: s.prof }]));
const skillsMap = (C) => Object.fromEntries(C.skills.map((s) => [s.name, { total: s.total, prof: s.prof, exp: s.exp }]));
const castingFor = (C, list) => { const r = C.castingRows.find((x) => x.list === list); return r ? { dc: r.dc, atk: r.atk } : null; };

let totalFail = 0;

function check(label, expected, actual, fails) {
  const ok = J(expected) === J(actual);
  if (!ok) fails.push(`  ✗ ${label}\n      attendu : ${J(expected)}\n      obtenu  : ${J(actual)}`);
  return ok;
}

const cat = await loadCatalogNode();

for (const id of ["medicis", "malbec"]) {
  const ref = JSON.parse(readFileSync(join(CHARDIR, `${id}.character.json`), "utf8"));
  const Cg = computeCharacter(ref);                              // reference
  const Cr = computeCharacter(toCharacterModel(cat, ANSWERS[id])); // reconstruction
  const classList = ANSWERS[id].classe;
  const fails = [];

  check("PB", Cg.PB, Cr.PB, fails);
  check("niveau", Cg.lvl, Cr.lvl, fails);
  check("modificateurs", Cg.mods, Cr.mods, fails);
  check("jets de sauvegarde", savesMap(Cg), savesMap(Cr), fails);
  check("competences", skillsMap(Cg), skillsMap(Cr), fails);
  for (const nom of ["Points de vie", "CA", "CA avec bouclier", "Initiative", "Perception passive"])
    check(`derive ${nom}`, derivedVal(Cg, nom), derivedVal(Cr, nom), fails);
  check(`incantation (${classList}) DD/atk`, castingFor(Cg, classList), castingFor(Cr, classList), fails);

  const errG = Cg.problems.filter((p) => p.level === "error");
  const errR = Cr.problems.filter((p) => p.level === "error");
  if (errG.length) fails.push(`  ✗ reference ${id} : ${errG.length} erreur(s) de lint : ${errG.map((p) => p.msg).join(" ; ")}`);
  if (errR.length) fails.push(`  ✗ reconstruction ${id} : ${errR.length} erreur(s) de lint : ${errR.map((p) => p.msg).join(" ; ")}`);

  totalFail += fails.length;
  console.log(`\n=== ${id.toUpperCase()} (${classList}) — noyau deterministe ===`);
  console.log(fails.length ? fails.join("\n") : "  ✓ fiche calculee IDENTIQUE (PB, mods, JS, competences, PV/CA/init/PP, incantation, 0 erreur).");

  // --- informatif (divergences de modelisation connues) ---
  const langG = new Set(Cg.languages.map((l) => l.v)), langR = new Set(Cr.languages.map((l) => l.v));
  const setDiff = (a, b) => [...a].filter((x) => !b.has(x));
  console.log("  · langues        ref:", J([...langG].sort()), "| reconstruction:", J([...langR].sort()));
  console.log("  · cantrips (ids) ref:", J(Cg.cantrips.map((s) => s.id).sort()), "\n                   rec:", J(Cr.cantrips.map((s) => s.id).sort()));
  console.log("  · prepares (ids) ref:", J(Cg.prepared.map((s) => s.id).sort()), "\n                   rec:", J(Cr.prepared.map((s) => s.id).sort()));
  console.log("  · compteurs      ref:", J(Cg.counters.map((c) => `${c.list} ${c.used}/${c.allowed}`)), "\n                   rec:", J(Cr.counters.map((c) => `${c.list} ${c.used}/${c.allowed}`)));
}

console.log(`\n=== RESULTAT : ${totalFail ? totalFail + " ecart(s) sur le noyau" : "0 ecart — noyau deterministe equivalent"} ===`);
process.exit(totalFail ? 1 : 0);
