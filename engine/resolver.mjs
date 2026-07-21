/* GENERATED COPY — do not edit. Source: docs/_engine/resolver.mjs. */
/* Regenerate: node scripts/build-bundles.mjs — verified by scripts/check-sync.mjs. */
/* ==========================================================================
   resolver.mjs — moteur de parcours de graphe DETERMINISTE (aucune IA).
   Fonctions PURES : (catalog, answers) -> options / character model.
   Partage Node (import) + navigateur (<script type="module">).
   Le chargement du catalogue est fait par l'appelant (loadCatalogNode ci-dessous
   pour Node ; fetch pour le navigateur) et passe en argument.
   ========================================================================== */

/* ---- helpers purs -------------------------------------------------------- */
export function byId(list, id) { return (list || []).find((e) => e.id === id) || null; }

// Canonical list of 18 skill ids (kebab-case). Shared source (catalog-lint imports).
export const SKILLS = ["acrobatics", "arcana", "athletics", "stealth", "animal-handling", "sleight-of-hand",
  "history", "intimidation", "insight", "investigation", "medicine", "nature", "perception",
  "persuasion", "religion", "performance", "deception", "survival"];

/* Table PARTAGEE : `kind` reel d'un choix -> id du noeud de graphe (bucket) qui le rend.
   Utilisee par builder.js (regroupement) ET catalog-lint.mjs (couverture). */
export const KIND_BUCKET = {
  "competence-classe": "competences", "competence": "competences",
  "cantrip": "cantrips",
  "prepared": "prepares", "sort": "prepares", "prepared-rituel": "prepares",
  "langue": "langues",
  "equipement": "equipement-classe",
  "abilityScoreIncrease": "bonus-historique", "bonus-caracteristique": "bonus-historique",
  "liste-sorts": "don-origine", "caracteristique-incantation": "don-origine", "don": "don-origine",
  "don-origine": "don-origine",
};
/* Kinds specifiques (classe/espece/sous-classe) sans noeud dedie : bucket « Autres choix ».
   L'union KIND_BUCKET ∪ OTHER_KINDS doit couvrir TOUS les kinds du catalogue (invariant lint). */
export const OTHER_KINDS = ["ordre-primitif", "ordre-divin", "manifestation-occulte",
  "expertise", "grimoire", "style-de-combat", "spellcasting-ability",
  "outil", "outil-artisan", "instrument", "toolProficiency",
  "competence-ou-expertise", "competence-ou-outil",
  "ancetre-draconique", "benefice-gigant", "botte-arme", "compagnon",
  "resistance", "type-de-degats", "type-degats",
  "manoeuvre", "aptitude-sous-classe", "environnement"];

// Guards contre les boucles infinies dans la resolution (don->don->don ou appliesEffects cycliques).
const MAX_FEAT_SOURCES  = 20;  // dons accordes max par personnage niveau 1
const MAX_CHOICE_EFFECTS = 50; // expansions choice-effect max (appliesEffects chainés)

// Resout le `count` d'un choix (entier ou mot-cle). Niveau 1 : bonus de maitrise = 2.
export function resolveCount(choice) {
  const c = choice.count;
  if (typeof c === "number") return c;
  if (c === "bonus-de-maitrise") return 2;
  return 1;
}

// Toutes les "sources" selectionnees (classe, sous-classe, espece, lignage, historique),
// avec les effets conditionnels appliques par les sous-choix (ex. ordre primitif = mage).
export function selectedSources(catalog, answers) {
  const out = [];
  const push = (kind, entity, extra) => {
    if (!entity) return;
    out.push({ id: entity.id, kind, label: entity.name, ref: entity.ref,
      effects: entity.effects || [], choices: entity.choices || [], recommends: entity.recommends || [], entity });
  };
  const cls = byId(catalog.classes, answers.class);
  push("class-level", cls);
  if (answers["subclass"]) push("subclass", byId(catalog.subclasses, answers["subclass"]));
  const sp = byId(catalog.species, answers.species);
  push("species", sp);
  if (sp && answers.lineage) {
    const lin = (sp.lineages || []).find((l) => l.id === answers.lineage);
    if (lin) out.push({ id: lin.id, kind: "lineage", label: lin.name, ref: sp.ref,
      effects: lin.effects || [], choices: lin.choices || [], recommends: lin.recommends || [], entity: lin });
  }
  push("background", byId(catalog.backgrounds, answers.background));

  // --- expansion des dons accordes (grants feat -> injecte effets + choix du don) ---
  const featSources = [];
  for (const s of out) for (const e of s.effects) {
    if (e.type === "grants" && e.what === "feat" && e.id) {
      const feat = byId(catalog.feats, e.id);
      if (!feat) continue;
      if (featSources.length >= MAX_FEAT_SOURCES)
        throw new Error(`resolver: feat expansion exceeded ${MAX_FEAT_SOURCES} — likely circular feat grants`);
      const featClass = (s.entity && s.entity.featClass) || null;
      // clone des choix ; si featClass fixe, contraindre le choix de liste de sorts.
      const choices = (feat.choices || []).map((ch) =>
        (featClass && ch.kind === "liste-sorts") ? { ...ch, from: { fromList: [featClass] } } : ch);
      const effects = (feat.effects || []).map((ef) => substEffect(ef, answers, featClass));
      featSources.push({ id: feat.id, kind: "feat", label: feat.name, ref: feat.ref,
        effects, choices, recommends: feat.recommends || [], entity: feat, featClass });
    }
  }
  out.push(...featSources);

  // --- langue(s) d'origine : regle de creation (commun + 2 langues courantes au choix) ---
  if (answers.class) {
    out.push({ id: "origine-langues", kind: "background", label: "Langues d'origine",
      ref: "../regles/creation-personnage.html",
      effects: [{ type: "grants", what: "language", value: "commun" }],
      choices: [{ id: "origine-langues-choix", kind: "langue", count: 2, from: { fromLanguages: "courante" } }],
      recommends: [], entity: null });
  }

  // effets appliques par les valeurs de sous-choix (choice.appliesEffects[value])
  // NOTE : `for...of` sur un tableau vivant — les items pushes en cours d'iteration SONT traites.
  // Le compteur `ceCount` evite les boucles infinies si appliesEffects est cyclique.
  let ceCount = 0;
  for (const s of out) for (const ch of s.choices) {
    const v = answers[ch.id];
    if (v != null && ch.appliesEffects && ch.appliesEffects[v]) {
      if (++ceCount > MAX_CHOICE_EFFECTS)
        throw new Error(`resolver: choice-effect depth exceeded ${MAX_CHOICE_EFFECTS} — likely circular appliesEffects`);
      out.push({ id: `${ch.id}:${v}`, kind: "choice-effect", label: `${ch.kind}=${v}`, ref: s.ref,
        effects: ch.appliesEffects[v], choices: [], recommends: [] });
    }
  }
  return out;
}

// Ensemble des "grants" agreges (pour dedupe : sorts/competences/langues deja accordes).
export function grantedSet(catalog, answers, what) {
  const set = new Set();
  for (const s of selectedSources(catalog, answers)) {
    for (const e of s.effects) {
      if (e.type !== "grants") continue;
      if (what === "cantrip" && e.what === "cantrip") set.add(e.spell);
      if (what === "spell" && (e.what === "cantrip" || e.what === "alwaysPreparedSpell")) set.add(e.spell);
      if (what === "skill" && e.what === "skillProficiency") set.add(e.value);
      if (what === "language" && e.what === "language") set.add(e.value);
    }
    // les choix deja resolus comptent aussi comme "accordes" pour la dedupe
  }
  return set;
}

// Filtre de niveau partage par toutes les sources de sorts (level exact, minLevel, maxLevel).
function matchLevel(s, from) {
  if (from.level != null && (s.level || 0) !== from.level) return false;
  if (from.minLevel != null && (s.level || 0) < from.minLevel) return false;
  if (from.maxLevel != null && (s.level || 0) > from.maxLevel) return false;
  return true;
}
function spellListOptions(catalog, list, from) {
  return (list || []).filter((s) => matchLevel(s, from)).map((s) => ({ id: s.id, name: nameOfSpell(catalog, s.id) }));
}
function spellHasTag(s, tag) {
  const t = normId(tag);
  if (t === "rituel" || t === "ritual") return !!s.ritual;
  if (t === "concentration") return !!s.concentration;
  return false;
}
function toolSetOptions(catalog, set) {
  const tools = (catalog.equipment && catalog.equipment.tools) || [];
  if (Array.isArray(set)) { const ids = new Set(set); return tools.filter((t) => ids.has(t.id)).map((t) => ({ id: t.id, name: t.name })); }
  const key = normId(String(set));
  // 1) correspondance directe avec un id d'outil precis (ex. "boite-de-jeux", "instrument-de-musique")
  const direct = tools.find((t) => t.id === key);
  if (direct) return [{ id: direct.id, name: direct.name }];
  // 2) sinon, groupe : artisan et/ou instruments de musique
  const wantArtisan = key.includes("artisan");
  const wantMusic = key.includes("musique") || key.includes("instrument");
  return tools.filter((t) => (wantArtisan && t.kind === "artisan") || (wantMusic && t.id === "instrument-de-musique"))
    .map((t) => ({ id: t.id, name: t.name }));
}
function weaponMasteryOptions(catalog) {
  const seen = new Set(); const out = [];
  for (const w of ((catalog.equipment && catalog.equipment.weapons) || [])) {
    if (!w.mastery || seen.has(w.mastery)) continue; seen.add(w.mastery); out.push({ id: normId(w.mastery), name: w.mastery });
  }
  return out;
}
// `fromChoice` : options derivees d'un AUTRE choix deja repondu (dependance).
function fromChoiceOptions(catalog, answers, from) {
  const refVal = answers[from.fromChoice];
  // Cas 1 : la valeur referencee est une liste de sorts (classe) -> comme fromSpellList[valeur].
  if (typeof refVal === "string" && catalog.spellsByClass && catalog.spellsByClass[refVal]) {
    return spellListOptions(catalog, catalog.spellsByClass[refVal], from);
  }
  // Cas 2 : la valeur referencee est une liste d'ids deja choisis (ex. expertise sur competences).
  const vals = Array.isArray(refVal) ? refVal : (refVal != null ? [refVal] : []);
  return vals.map((v) => ({ id: v, name: v }));
}

// Options d'un choix, filtrees deterministiquement (dedupe + count).
export function optionsFor(catalog, answers, choice) {
  const from = choice.from || choice.optionsFrom || {};
  let opts = [];
  if (Array.isArray(from)) opts = from.map((v) => (typeof v === "string" ? { id: v, name: v } : v));
  else if (from.fromList) opts = from.fromList.map((v) => ({ id: v, name: v }));
  else if (from.fromSkillSet) {
    const set = from.fromSkillSet;
    const ids = Array.isArray(set) ? (set.includes("toutes") ? SKILLS : set) : SKILLS;
    opts = ids.map((v) => ({ id: v, name: v }));
  } else if (from.fromLanguages) {
    const langs = from.fromLanguages === "rare" ? catalog.languages.rares : catalog.languages.courantes;
    opts = langs.map((l) => ({ id: normId(l.name), name: l.name }));
  } else if (from.fromSpellList) {
    opts = spellListOptions(catalog, (catalog.spellsByClass && catalog.spellsByClass[from.fromSpellList]), from);
  } else if (from.fromToolSet) {
    opts = toolSetOptions(catalog, from.fromToolSet);
  } else if (from.fromFeatCategory) {
    opts = (catalog.feats || []).filter((f) => f.category === from.fromFeatCategory).map((f) => ({ id: f.id, name: f.name }));
  } else if (from.fromCompetencesOuOutils) {
    opts = SKILLS.map((v) => ({ id: v, name: v }))
      .concat(((catalog.equipment && catalog.equipment.tools) || []).map((t) => ({ id: t.id, name: t.name })));
  } else if (from.fromSpellSchools) {
    const schools = Array.isArray(from.fromSpellSchools) ? from.fromSpellSchools : [from.fromSpellSchools];
    opts = (catalog.spells || []).filter((s) => schools.includes(s.school) && matchLevel(s, from)).map((s) => ({ id: s.id, name: s.name }));
  } else if (from.fromSpellTag) {
    opts = (catalog.spells || []).filter((s) => spellHasTag(s, from.fromSpellTag) && matchLevel(s, from)).map((s) => ({ id: s.id, name: s.name }));
  } else if (from.fromWeaponMastery) {
    opts = weaponMasteryOptions(catalog);
  } else if (from.fromChoice) {
    opts = fromChoiceOptions(catalog, answers, from);
  }
  // dedupe contre ce qui est deja accorde/choisi ailleurs
  if (choice.dedupe !== false) {
    const kind = choice.kind === "cantrip" ? "cantrip" : choice.kind === "prepared" ? "spell"
      : choice.kind && choice.kind.startsWith("competence") ? "skill" : choice.kind === "langue" ? "language" : null;
    if (kind) {
      const granted = grantedSet(catalog, answers, kind);
      // + retirer ce qui est deja choisi dans un autre choix du meme kind
      for (const [cid, val] of Object.entries(answers)) {
        if (cid === choice.id) continue;
        (Array.isArray(val) ? val : []).forEach((v) => granted.add(v));
      }
      opts = opts.filter((o) => !granted.has(o.id));
    }
  }
  return opts;
}

// Liste ordonnee des choix EN ATTENTE (non satisfaits) selon les sources selectionnees.
export function pendingChoices(catalog, answers) {
  const pend = [];
  for (const s of selectedSources(catalog, answers)) {
    for (const ch of s.choices) {
      const ans = answers[ch.id];
      const need = resolveCount(ch);
      const done = Array.isArray(ans) ? ans.length >= need : ans != null;
      pend.push({ ...ch, sourceId: s.id, sourceLabel: s.label, satisfied: done, need,
        options: optionsFor(catalog, answers, ch),
        recommendations: recommendationsFor(s, ch) });
    }
  }
  return pend;
}

function recommendationsFor(source, choice) {
  const recs = (source.recommends || []).filter((r) => r.kind === choice.kind);
  return recs.flatMap((r) => r.ids || (r.value ? [r.value] : []));
}

/* ---- options des noeuds FIXES du graphe (classe/sous-classe/espece/…) ------ */
// Gere optionsFrom.{catalog|subclassesOf|lineagesOf|list|fromLanguages}. Retourne [{id,name}].
export function fixedNodeOptions(catalog, answers, node) {
  const of = node.optionsFrom || {};
  if (of.catalog) return (catalog[of.catalog] || []).map((e) => ({ id: e.id, name: e.name }));
  if (of.subclassesOf) {
    const cls = byId(catalog.classes, answers[of.subclassesOf]);
    const ids = (cls && cls.subclass && cls.subclass.ids) || [];
    return ids.map((id) => { const s = byId(catalog.subclasses, id); return { id, name: s ? s.name : id }; });
  }
  if (of.lineagesOf) {
    const sp = byId(catalog.species, answers[of.lineagesOf]);
    return ((sp && sp.lineages) || []).map((l) => ({ id: l.id, name: l.name }));
  }
  if (of.list) {
    const methods = (catalog.graph && catalog.graph.abilityMethods) || [];
    return of.list.map((v) => { const m = methods.find((am) => am.id === v); return { id: v, name: m ? m.label : v }; });
  }
  if (of.fromLanguages) return optionsFor(catalog, answers, { from: of, kind: "langue" });
  return [];
}

// Vrai si au moins une source selectionnee accorde l'incantation (classe OU espece).
export function isSpellcaster(catalog, answers) {
  for (const s of selectedSources(catalog, answers))
    for (const e of s.effects) if (e.type === "grants" && e.what === "spellcasting") return true;
  return false;
}

// Predicat `when` d'un noeud de graphe (subclassLevelEquals / hasLineages / isSpellcaster).
export function nodeApplies(catalog, answers, node) {
  const w = node.when;
  if (!w) return true;
  if (w.subclassLevelEquals != null) {
    const cls = byId(catalog.classes, answers.class);
    return !!(cls && cls.subclass && cls.subclass.level === w.subclassLevelEquals);
  }
  if (w.hasLineages) {
    const sp = byId(catalog.species, answers[w.hasLineages]);
    return !!(sp && (sp.lineages || []).length > 0);
  }
  if (w.isSpellcaster) return isSpellcaster(catalog, answers);
  return true;
}

/* ---- assemblage du character model (consomme par build-character.mjs) ---- */
export function toCharacterModel(catalog, answers) {
  const sources = [];
  for (const s of selectedSources(catalog, answers)) {
    if (s.kind === "choice-effect") { sources.push({ id: s.id, kind: "order", label: s.label, ref: s.ref, effects: s.effects }); continue; }
    sources.push({ id: s.id, kind: s.kind, label: s.label, ref: s.ref,
      effects: s.effects.filter((e) => e.type === "grants" || e.type === "effect") });
  }
  const choices = [];
  const cantrips = [], prepared = [];
  for (const s of selectedSources(catalog, answers)) {
    for (const ch of s.choices) {
      const val = answers[ch.id];
      if (val == null) continue;
      const vals = Array.isArray(val) ? val : [val];
      if (ch.kind === "cantrip") vals.forEach((v) => cantrips.push({ id: v, label: nameOfSpell(catalog, v), list: listOf(s, ch), origin: "chosen", status: "provided", sourceId: s.id }));
      else if (ch.kind === "prepared") vals.forEach((v) => prepared.push({ id: v, label: nameOfSpell(catalog, v), list: listOf(s, ch), origin: "chosen", status: "provided", sourceId: s.id }));
      else if (ch.kind && ch.kind.startsWith("competence")) vals.forEach((v) => choices.push({ id: `${ch.id}:${v}`, satisfies: ch.kind, value: v, status: "provided", effects: [{ type: "grants", what: "skillProficiency", value: v }] }));
      else if (ch.kind === "langue") vals.forEach((v) => choices.push({ id: `${ch.id}:${v}`, satisfies: ch.kind, value: v, status: "provided", effects: [{ type: "grants", what: "language", value: v }] }));
      else if (ch.kind === "expertise") vals.forEach((v) => choices.push({ id: `${ch.id}:${v}`, satisfies: ch.kind, value: v, status: "provided", effects: [{ type: "grants", what: "skillProficiency", value: v, expertise: true }] }));
      // NB : les appliesEffects sont deja emis comme source "choice-effect" (selectedSources) ;
      // ne PAS les rattacher ici sous peine de double comptage (ex. cantripSlots du mage).
      else choices.push({ id: ch.id, satisfies: ch.kind, value: val, status: "provided", effects: [] });
    }
  }
  // sorts accordes automatiquement (cantrip/alwaysPrepared) -> presents sur la fiche
  for (const s of selectedSources(catalog, answers)) for (const e of s.effects) {
    if (e.type === "grants" && e.what === "cantrip") cantrips.push({ id: e.spell, label: nameOfSpell(catalog, e.spell), list: e.list || "species", origin: "granted", status: "granted", sourceId: s.id });
    if (e.type === "grants" && e.what === "alwaysPreparedSpell") prepared.push({ id: e.spell, label: nameOfSpell(catalog, e.spell), list: e.list, origin: "alwaysPrepared", status: "granted", sourceId: s.id });
  }
  return {
    id: answers._id || "brouillon",
    identity: { name: answers.name || "Nouveau personnage", level: 1,
      className: labelOf(catalog.classes, answers.class), species: labelOf(catalog.species, answers.species),
      lineage: answers.lineage || null, background: labelOf(catalog.backgrounds, answers.background), alignment: answers.alignment || null },
    abilityScores: answers.abilityScores || { for: 10, dex: 10, con: 10, int: 10, sag: 10, cha: 10 },
    sources, choices,
    equipment: buildEquipment(catalog, answers),
    spells: { cantrips, prepared },
  };
}

/* ---- placeholders "choix:<id>" (dons dynamiques : liste/carac d'incantation) ---- */
function subst(val, answers, listFallback) {
  if (typeof val === "string" && val.startsWith("choix:")) {
    const id = val.slice(6);
    if (answers[id] != null) return answers[id];
    return listFallback != null ? listFallback : val;
  }
  return val;
}
function substEffect(ef, answers, featClass) {
  const o = { ...ef };
  if (o.ability != null) o.ability = subst(o.ability, answers, null);   // pas de fallback pour la carac
  if (o.list != null) o.list = subst(o.list, answers, featClass);       // liste peut retomber sur featClass
  if (o.value != null) o.value = subst(o.value, answers, null);
  if (o.spell != null) o.spell = subst(o.spell, answers, null);
  return o;
}

/* ---- decomposition de l'equipement (option A/B -> objets avec stats) ---- */
function equipItemBase(catalog, itemId) {
  const eq = catalog.equipment || {};
  const a = byId(eq.armors, itemId);
  if (a) return a.category === "bouclier"
    ? { object: a.name, roles: ["bouclier"], shield: true }
    : { object: a.name, roles: ["armure"], armor: { base: a.baseAC, dexMax: a.dexMax } };
  const w = byId(eq.weapons, itemId);
  if (w) {
    const vers = (w.properties || []).find((p) => /polyvalente/i.test(p));
    const vd = vers && vers.match(/\(([^)]+)\)/);
    const wp = { damage: w.damage, type: w.damageType, ability: w.type === "distance" ? "dex" : "for" };
    if (vd) wp.versatile = vd[1];
    return { object: w.name, roles: ["arme"], weapon: wp };
  }
  const t = byId(eq.tools, itemId); if (t) return { object: t.name, roles: ["outil"] };
  const p = byId(eq.packs, itemId); if (p) return { object: p.name, roles: ["paquetage"] };
  const g = byId(eq.gear, itemId);
  if (g) return { object: g.name, roles: [g.note && /focaliseur/i.test(g.note) ? "focaliseur d'incantation" : "objet"] };
  return null;
}
// Resout un id d'item, en decodant les quantites des items d'historiques :
//   prefixe "N-<base>"        (ex. 2-dagues, 20-fleches, 2-sacoches)
//   suffixe "<base>-N-<unite>" (ex. huile-3-flasques, parchemin-8-feuilles)
// La base peut etre au pluriel (fleches, carreaux) ou singularisable (dagues->dague).
function equipItem(catalog, itemId) {
  let it = equipItemBase(catalog, itemId), qty = 1, unit = "";
  if (!it) {
    let m = itemId.match(/^(\d+)-(.+)$/);
    if (m) { qty = +m[1]; it = equipItemBase(catalog, m[2]) || equipItemBase(catalog, m[2].replace(/s$/, "")); }
    if (!it && (m = itemId.match(/^(.+?)-(\d+)-([a-z]+)$/))) { qty = +m[2]; unit = m[3]; it = equipItemBase(catalog, m[1]); }
  }
  if (it && qty > 1) it = { ...it, qty, object: `${it.object} (x${qty}${unit ? " " + unit : ""})` };
  return it; // null = monnaie ("9 po") ou placeholder de choix
}
// Construit equipment[] a partir des options A/B choisies (classe + historique).
function buildEquipment(catalog, answers) {
  if (Array.isArray(answers.equipment) && answers.equipment.length) return answers.equipment;
  const out = [];
  for (const s of selectedSources(catalog, answers)) {
    const ent = s.entity; if (!ent) continue;
    const opts = ent.startingEquipment || ent.equipment; if (!Array.isArray(opts)) continue;
    const eqChoice = (s.choices || []).find((c) => c.kind === "equipement");
    const pick = (eqChoice && answers[eqChoice.id]) || answers[`${s.id}-equipement`] || "A";
    const chosen = opts.find((o) => o.option === pick) || opts[0];
    for (const itemId of (chosen.items || [])) {
      const it = equipItem(catalog, itemId);
      if (it) { it.from = `${s.id}-${chosen.option}`; out.push(it); }
    }
  }
  return out;
}

/* ---- petits utilitaires ---- */
function listOf(source, choice) { return (choice.from && choice.from.fromSpellList) || (source.entity && source.entity.spellcasting && source.entity.spellcasting.list) || "classe"; }
function labelOf(list, id) { const e = byId(list, id); return e ? e.name : null; }
function nameOfSpell(catalog, id) { const s = byId(catalog.spells, id); return s ? s.name : id; }
export function normId(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

/* ---- chargement (Node uniquement ; le navigateur utilise fetch) ---------- */
export async function loadCatalogNode() {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { dirname, join } = await import("node:path");
  const D = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
  const rd = (f) => JSON.parse(readFileSync(join(D, f), "utf8"));
  return {
    classes: rd("classes.json"), subclasses: rd("subclasses.json"), species: rd("species.json"),
    backgrounds: rd("backgrounds.json"), feats: rd("feats.json"), equipment: rd("equipment.json"),
    spells: rd("spells.json"), spellsByClass: rd("spells-by-class.json"),
    languages: rd("languages.json"), conditions: rd("conditions.json"),
    graph: rd("build-graph.json"),
  };
}
