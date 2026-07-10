/* ==========================================================================
   catalog-lint.mjs — validation du catalogue docs/data/.
   Verifie : presence + JSON valide + comptes ; refs HTML existent ; ids croises
   resolvent (sous-classes<->classes, sorts, competences, dons, langues, outils) ;
   toute cle `from`/`optionsFrom` est connue ; le build-graph est un DAG ; chaque
   `kind` de choix est couvert par un bucket (invariant « aucun choix perdu »).
   Usage : node docs/_engine/catalog-lint.mjs
   ========================================================================== */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normId, SKILLS as SKILLS_LIST, KIND_BUCKET, OTHER_KINDS } from "./resolver.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, "..", "data");
const HTML = join(HERE, "..", "html");
const rd = (f) => JSON.parse(readFileSync(join(DATA, f), "utf8"));

const problems = [];
const err = (m) => problems.push(m);

const SKILLS = new Set(SKILLS_LIST);
// Cles `from`/`optionsFrom` reconnues par le resolver (garde-fou contre un type non supporte).
const KNOWN_FROM = new Set(["fromList", "fromSkillSet", "fromLanguages", "fromSpellList",
  "fromToolSet", "fromFeatCategory", "fromChoice", "fromCompetencesOuOutils", "fromSpellSchools",
  "fromSpellTag", "fromWeaponMastery",
  "catalog", "subclassesOf", "lineagesOf", "lineages", "list", "fromChoicesOf",
  "level", "minLevel", "maxLevel"]);

let classes, subclasses, species, backgrounds, feats, equipment, spells, languages, graph;
try {
  classes = rd("classes.json"); subclasses = rd("subclasses.json"); species = rd("species.json");
  backgrounds = rd("backgrounds.json"); feats = rd("feats.json"); equipment = rd("equipment.json");
  spells = rd("spells.json"); languages = rd("languages.json"); graph = rd("build-graph.json");
} catch (e) { console.error("JSON invalide :", e.message); process.exit(2); }

const spellIds = new Set(spells.map((s) => s.id));
const featIds = new Set(feats.map((f) => f.id));
const classIds = new Set(classes.map((c) => c.id));
const subIds = new Set(subclasses.map((s) => s.id));
const equipIds = new Set([].concat(...["weapons", "armors", "tools", "packs", "gear"].map((k) => (equipment[k] || []).map((x) => x.id))));
const toolIds = new Set((equipment.tools || []).map((t) => t.id));
const langIds = new Set([...(languages.courantes || []), ...(languages.rares || [])].map((l) => normId(l.name)));
const featCats = new Set(feats.map((f) => f.category));

console.log("=== COMPTES ===");
console.log(`classes ${classes.length} | subclasses ${subclasses.length} | species ${species.length} | backgrounds ${backgrounds.length} | feats ${feats.length} | spells ${spells.length} | equip ${equipIds.size}`);

// refs HTML
function checkRef(ref, ctx) {
  if (!ref) return;
  const p = ref.split("#")[0].replace(/^\.\.\//, "");
  if (!existsSync(join(HTML, p))) err(`ref HTML introuvable : ${ref} (${ctx})`);
}
[classes, subclasses, species, backgrounds, feats].flat().forEach((e) => checkRef(e.ref, e.id));

// sous-classes <-> classes
for (const s of subclasses) if (!classIds.has(s.parentClass)) err(`subclass ${s.id}: parentClass inconnu "${s.parentClass}"`);
for (const c of classes) for (const sid of (c.subclass?.ids || [])) if (!subIds.has(sid)) err(`classe ${c.id}: sous-classe inconnue "${sid}"`);

// sorts references (recommends + grants cantrip/alwaysPrepared)
function checkSpell(id, ctx) { if (id && !spellIds.has(id)) err(`sort inconnu : ${id} (${ctx})`); }
for (const e of [classes, subclasses, species, backgrounds, feats].flat()) {
  for (const r of (e.recommends || [])) for (const id of (r.ids || [])) if (r.kind === "cantrip" || r.kind === "prepared") checkSpell(id, `${e.id} recommends`);
  const eff = [...(e.effects || []), ...(e.lineages || []).flatMap((l) => l.effects || [])];
  for (const ef of eff) if (ef.type === "grants" && (ef.what === "cantrip" || ef.what === "alwaysPreparedSpell")) checkSpell(ef.spell, `${e.id} effect`);
}

// competences (backgrounds.skills + skillProficiency + fromSkillSet)
for (const b of backgrounds) for (const sk of (b.skills || [])) if (!SKILLS.has(sk)) err(`competence inconnue : ${sk} (background ${b.id})`);
for (const e of [classes, subclasses, species, backgrounds, feats].flat()) {
  for (const ef of (e.effects || [])) if (ef.type === "grants" && ef.what === "skillProficiency" && ef.value && ef.value !== "toutes" && !SKILLS.has(ef.value)) err(`competence inconnue : ${ef.value} (${e.id})`);
  for (const ch of (e.choices || [])) { const fs = ch.from?.fromSkillSet; if (Array.isArray(fs)) fs.forEach((sk) => { if (sk !== "toutes" && !SKILLS.has(sk)) err(`competence inconnue dans fromSkillSet : ${sk} (${e.id})`); }); }
}

// dons references par les historiques
for (const b of backgrounds) if (b.feat && !featIds.has(b.feat)) err(`don inconnu : ${b.feat} (background ${b.id})`);

// equipement de depart (ids d'objets)
const EQUIP_PLACEHOLDERS = new Set(["outil-au-choix", "instrument-de-musique-au-choix"]);
for (const c of classes) for (const opt of (c.startingEquipment || [])) for (const it of (opt.items || [])) {
  if (/\d+\s*p[oO]/.test(it) || it === "50 po") continue; // monnaie
  if (EQUIP_PLACEHOLDERS.has(it)) continue;               // placeholder de choix
  if (!equipIds.has(it)) err(`objet d'equipement inconnu : ${it} (classe ${c.id})`);
}

// ---- helpers de parcours ----
const ALL_ENTITIES = [classes, subclasses, species, backgrounds, feats].flat();
// entites + lignages (qui portent leurs propres effects/choices)
const ALL_WITH_LINEAGES = ALL_ENTITIES.concat(species.flatMap((sp) => sp.lineages || []));
function eachEffect(fn) { for (const e of ALL_WITH_LINEAGES) for (const ef of (e.effects || [])) fn(ef, e); }
function eachChoice(fn) { for (const e of ALL_WITH_LINEAGES) for (const ch of (e.choices || [])) fn(ch, e); }

// ---- langues resolvent (grants + choix) ----
eachEffect((ef, e) => {
  if (ef.type === "grants" && ef.what === "language" && ef.value && !langIds.has(normId(ef.value)))
    err(`langue inconnue : ${ef.value} (${e.id})`);
});

// ---- outils resolvent (grants toolProficiency + fromToolSet en tableau) ----
eachEffect((ef, e) => {
  if (ef.type === "grants" && ef.what === "toolProficiency" && ef.value) {
    const v = normId(ef.value);
    if (v !== "outil-au-choix" && v !== "instrument-de-musique-au-choix" && !toolIds.has(v))
      err(`outil inconnu : ${ef.value} (${e.id})`);
  }
});
eachChoice((ch, e) => {
  const ts = ch.from && ch.from.fromToolSet;
  if (Array.isArray(ts)) ts.forEach((id) => { if (!toolIds.has(id)) err(`outil inconnu dans fromToolSet : ${id} (${e.id})`); });
});

// ---- fromChoice cible un choix frere de la meme entite ----
eachChoice((ch, e) => {
  const fc = ch.from && ch.from.fromChoice;
  if (fc && !(e.choices || []).some((c) => c.id === fc))
    err(`fromChoice sans cible : "${fc}" absent des choices de ${e.id} (choix ${ch.id})`);
});

// ---- fromFeatCategory resolvent ----
eachChoice((ch, e) => {
  const cat = ch.from && ch.from.fromFeatCategory;
  if (cat && !featCats.has(cat)) err(`fromFeatCategory inconnue : "${cat}" (${e.id}, choix ${ch.id})`);
});

// ---- toute cle from/optionsFrom est connue ----
function checkFromKeys(obj, ctx) {
  if (!obj || Array.isArray(obj) || typeof obj !== "object") return;
  for (const k of Object.keys(obj)) if (!KNOWN_FROM.has(k)) err(`cle from/optionsFrom inconnue : "${k}" (${ctx})`);
}
eachChoice((ch, e) => { checkFromKeys(ch.from, `${e.id}/${ch.id}`); checkFromKeys(ch.optionsFrom, `${e.id}/${ch.id}`); });

// ---- couverture des kinds de choix (invariant « aucun choix perdu ») ----
const OTHER = new Set(OTHER_KINDS);
eachChoice((ch, e) => {
  if (!ch.kind) { err(`choix sans kind (${e.id}/${ch.id})`); return; }
  if (!KIND_BUCKET[ch.kind] && !OTHER.has(ch.kind))
    err(`kind de choix non couvert (ni bucket ni « Autres ») : "${ch.kind}" (${e.id}/${ch.id})`);
});

// ---- dons references + featClass des historiques ----
for (const b of backgrounds) if (b.featClass && !classIds.has(b.featClass)) err(`featClass inconnue : ${b.featClass} (background ${b.id})`);
eachEffect((ef, e) => { if (ef.type === "grants" && ef.what === "feat" && ef.id && !featIds.has(ef.id)) err(`don inconnu (grants feat) : ${ef.id} (${e.id})`); });

// ---- build-graph : structurel + DAG ----
(function checkGraph() {
  if (!graph || !Array.isArray(graph.steps)) { err("build-graph : steps manquants"); return; }
  const order = [];               // ids de noeuds dans l'ordre du graphe
  const nodeIds = new Set();
  for (const step of graph.steps) for (const n of (step.nodes || [])) { order.push(n); nodeIds.add(n.id); }
  const methodIds = new Set((graph.abilityMethods || []).map((m) => m.id));
  const seenSoFar = new Set();
  for (const n of order) {
    // dependsOn / references vers des noeuds definis PLUS TOT (acyclicite par ordre topologique)
    for (const dep of (n.dependsOn || [])) if (!seenSoFar.has(dep)) err(`graphe : ${n.id}.dependsOn "${dep}" non defini avant (cycle/ordre)`);
    const of = n.optionsFrom || {};
    for (const key of ["subclassesOf", "lineagesOf", "lineages"]) if (of[key] && !seenSoFar.has(of[key])) err(`graphe : ${n.id}.optionsFrom.${key} "${of[key]}" non defini avant`);
    if (n.fromChoicesOf && !seenSoFar.has(n.fromChoicesOf)) err(`graphe : ${n.id}.fromChoicesOf "${n.fromChoicesOf}" non defini avant`);
    if (of.list) for (const v of of.list) if (!methodIds.has(v) && n.id === "methode") err(`graphe : methode.list "${v}" absent de abilityMethods`);
    checkFromKeys(of, `graph/${n.id}`);
    seenSoFar.add(n.id);
  }
})();

console.log(`\n=== PROBLEMES (${problems.length}) ===`);
problems.slice(0, 120).forEach((p) => console.log("  " + p));
if (problems.length > 120) console.log(`  … +${problems.length - 120}`);
process.exit(problems.length ? 1 : 0);
