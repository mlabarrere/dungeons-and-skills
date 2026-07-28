/* GENERATED COPY — do not edit. Source: docs/_engine/render-character.mjs. */
/* Regenerate: node scripts/build-bundles.mjs — verified by scripts/check-sync.mjs. */
/* ==========================================================================
   render-character.mjs — pure HTML and Markdown projections of a computed
   character. No rules are calculated here.

   renderContext:
     { lang, labels, ui, mode: "standalone"|"site", source,
       assets: { css, js }, catalogGaps: Array<string|Problem> }
   ========================================================================== */

const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"];
const FALLBACK_UI = {
  home: "Home", characters: "Characters", characterName: "Character Name", level: "level", summary: "Summary",
  pb: "Proficiency Bonus", hp: "Hit Points", ac: "AC", init: "Initiative",
  pp: "Passive Perception", counters: "Counters", remaining: "Choices remaining",
  conflicts: "Conflicts", automaticDeductions: "Automatic deductions",
  source: "Source", effectGranted: "Effect granted", status: "Status",
  noPending: "No pending choices.", noConflicts: "No conflicts detected.",
  choice: "Choice", count: "Count", from: "From", item: "Item",
  path1: "Path 1", path2: "Path 2", resolution: "Resolution",
  abilityScores: "Ability scores", scoresProvided: "Scores provided. Modifiers computed.",
  defenseSpeed: "Defense & Speed", spellcasting: "Spellcasting",
  spellcastingSources: "Spellcasting sources", noSpellcasting: "No spellcasting.",
  saves: "Saving throws", skills: "Skills", skill: "Skill", ability: "Ability",
  total: "Total", provenance: "provenance", features: "Features",
  narrativeFeatures: "Features (narrative, not computed)", feature: "Feature",
  spells: "Spells", cantrips: "Cantrips", prepared: "Prepared spells", spell: "Spell", list: "List",
  origin: "Origin", equipment: "Equipment", equipmentRoles: "Roles", details: "Details",
  armorBase: "base AC", dexMax: "Dex max", versatile: "versatile",
  auditTrail: "Audit trail — sheet field → why", value: "Value",
  provenanceChain: "Provenance chain", sourceEffects: "Source → Effects",
  generated: "Generated sheet.", generatedHelp: "Computed projection from the source model. Edit the source, not this file.",
  print: "Print sheet", automatic: "Automatic", alwaysPrepared: "always prepared (not counted)",
  errors: "error(s)", warnings: "warning(s)", verified: "Counters, provenance, conflicts and duplicates verified.",
  manualVerification: "Manual verification required.", lint: "Lint",
  quotaNotDeclared: "quota not declared", none: "none",
  statuses: {
    source: "source", provided: "provided", granted: "granted", computed: "computed",
    derived: "derived", recommended: "recommended", "ruling-needed": "ruling needed",
    missing: "missing", incoherent: "incoherent", conflict: "conflict",
    warning: "warning", exceeded: "exceeded", unverified: "unverified", ok: "ok",
  },
  origins: { chosen: "chosen", granted: "granted", alwaysPrepared: "always prepared (not counted)" },
  roles: {},
  damageTypes: {},
  problemMessages: {
    "invalid-status": "Invalid status “{status}” on {entity} {id}.",
    "missing-precondition": "{source} requires {precondition}.",
    "counter-exceeded": "{kind} counter ({list}) exceeded: {used}/{allowed}.",
    "counter-unverified": "No declared quota: {items}. Count requires manual verification.",
    "granted-cantrip-missing": "Granted cantrip missing: {spell} ({source}).",
    "always-prepared-missing": "Always-prepared spell missing: {spell} ({source}).",
    "duplicate-spell-unmarked": "Duplicate spell is not marked conflict: {spell} ({source}).",
    "choice-overfilled": "Choice {kind} overfilled: {got}/{wanted} ({source}).",
    "missing-hit-die": "No Hit Die was granted; Hit Points cannot be computed.",
    "shield-without-training": "Shield equipped without Shield training.",
    "equipment-role-missing": "Equipment item has no decomposed role: {item}.",
    "legacy-id-unresolved": "Legacy {entity} has no unambiguous catalog ID: {label}.",
    "spell-list-membership": "{kind} {spell} is absent from the {list} spell list (data/spells-by-class.json).",
    "spell-catalog-missing": "{kind} {spell} is missing from the catalog.",
    "cantrip-level-invalid": "Cantrip {spell} has catalog level {level}; expected level 0.",
    "spell-level-unavailable": "{spell} level {level} exceeds the maximum slot level {max} for {list} at character level {characterLevel}.",
    "spell-list-unverified": "Spell-list membership was not verified for: {lists}.",
    "catalog-gap": "Documentation missing: {detail}.",
  },
};

const FR_UI = {
  home: "Accueil", characters: "Personnages", characterName: "Nom du personnage", level: "niveau", summary: "Résumé",
  pb: "Bonus de maîtrise", counters: "Compteurs", remaining: "Choix restants",
  conflicts: "Conflits", automaticDeductions: "Déductions automatiques",
  source: "Source", effectGranted: "Effet accordé", status: "Statut",
  noPending: "Aucun choix en attente.", noConflicts: "Aucun conflit détecté.",
  choice: "Choix", count: "Nombre", from: "Parmi", item: "Élément",
  path1: "Chemin 1", path2: "Chemin 2", resolution: "Remédiation",
  abilityScores: "Caractéristiques", scoresProvided: "Scores fournis. Modificateurs calculés.",
  defenseSpeed: "Défense et vitesse", spellcasting: "Incantation",
  spellcastingSources: "Sources d’incantation", noSpellcasting: "Aucune incantation.",
  saves: "Jets de sauvegarde", skills: "Compétences", skill: "Compétence",
  ability: "Caractéristique", total: "Total", provenance: "provenance",
  features: "Aptitudes", narrativeFeatures: "Aptitudes (narratives, non calculées)",
  feature: "Aptitude", cantrips: "Sorts mineurs", prepared: "Sorts préparés",
  spell: "Sort", list: "Liste", origin: "Origine", equipment: "Équipement",
  equipmentRoles: "Rôles", details: "Détails", armorBase: "CA de base", dexMax: "Dex max", versatile: "polyvalente",
  auditTrail: "Traçabilité — case de fiche → pourquoi",
  value: "Valeur", provenanceChain: "Chaîne de provenance", sourceEffects: "Source → Effets",
  generated: "Fiche générée.", generatedHelp: "Projection calculée depuis le modèle source. Modifiez la source, pas ce fichier.",
  print: "Imprimer la fiche", automatic: "Automatique",
  alwaysPrepared: "toujours préparé (hors quota)", errors: "erreur(s)",
  warnings: "avertissement(s)", verified: "Compteurs, provenance, conflits et doublons vérifiés.",
  manualVerification: "Vérification manuelle requise.", lint: "Contrôle",
  quotaNotDeclared: "quota non déclaré", none: "aucun",
  statuses: {
    source: "source", provided: "fourni", granted: "accordé", computed: "calculé",
    derived: "déduit", recommended: "recommandé", "ruling-needed": "arbitrage requis",
    missing: "manquant", incoherent: "incohérent", conflict: "conflit",
    warning: "avertissement", exceeded: "dépassé", unverified: "non vérifié", ok: "conforme",
  },
  origins: { chosen: "choisi", granted: "accordé", alwaysPrepared: "toujours préparé (hors quota)" },
  problemMessages: {
    "invalid-status": "Statut « {status} » invalide pour {entity} {id}.",
    "missing-precondition": "{source} requiert {precondition}.",
    "counter-exceeded": "Compteur {kind} ({list}) dépassé : {used}/{allowed}.",
    "counter-unverified": "Aucun quota déclaré : {items}. Le nombre doit être vérifié manuellement.",
    "granted-cantrip-missing": "Sort mineur accordé absent : {spell} ({source}).",
    "always-prepared-missing": "Sort toujours préparé absent : {spell} ({source}).",
    "duplicate-spell-unmarked": "Le doublon n’est pas marqué conflit : {spell} ({source}).",
    "choice-overfilled": "Choix {kind} sur-rempli : {got}/{wanted} ({source}).",
    "missing-hit-die": "Aucun dé de vie accordé ; les points de vie sont incalculables.",
    "shield-without-training": "Bouclier équipé sans maîtrise des boucliers.",
    "equipment-role-missing": "Objet sans rôle décomposé : {item}.",
    "legacy-id-unresolved": "Ancien modèle : aucun ID catalogue non ambigu pour {entity} « {label} ».",
    "spell-list-membership": "{kind} {spell} est absent de la liste de sorts {list} (data/spells-by-class.json).",
    "spell-catalog-missing": "{kind} {spell} est absent du catalogue.",
    "cantrip-level-invalid": "Le sort mineur {spell} est de niveau {level} dans le catalogue ; niveau 0 attendu.",
    "spell-level-unavailable": "{spell} niveau {level} dépasse l’emplacement maximal {max} pour {list} au niveau {characterLevel}.",
    "spell-list-unverified": "Appartenance aux listes non vérifiée pour : {lists}.",
    "catalog-gap": "Manquant documentaire : {detail}.",
  },
};

export function escapeText(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function escapeAttribute(value) {
  return escapeText(value);
}

const sign = (n) => (n >= 0 ? `+${n}` : String(n));
const deepMerge = (base, extra) => {
  const out = { ...base };
  for (const [key, value] of Object.entries(extra || {})) {
    out[key] = value && typeof value === "object" && !Array.isArray(value)
      ? deepMerge(base[key] && typeof base[key] === "object" ? base[key] : {}, value)
      : value;
  }
  return out;
};
const format = (template, params = {}) => String(template).replace(/\{(\w+)\}/g, (_, key) => {
  const value = params[key];
  return Array.isArray(value) ? value.join(" ; ") : value == null ? `{${key}}` : String(value);
});
const markdown = (value) => String(value == null ? "" : value)
  .replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/[\r\n]+/g, " ");
const stableId = (value, fallback = "unknown") => {
  const id = String(value || "").toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return id || fallback;
};
const labelMap = (labels, group, id, fallback, lang) => {
  if (id && labels?.[group]?.[id]) return labels[group][id];
  return id || fallback || "?";
};
const statusOf = (ui, status) => ui.statuses?.[status] || FALLBACK_UI.statuses[status] || status;
const badge = (ui, status, label = null) =>
  `<span class="badge" data-status="${escapeAttribute(status)}">${escapeText(label || statusOf(ui, status))}</span>`;
const problemMessage = (problem, ui, lang) => {
  const template = ui.problemMessages?.[problem.code];
  if (template) return format(template, problem.params);
  if (lang === "fr" && problem.msg) return problem.msg;
  return problem.code ? format(FALLBACK_UI.problemMessages[problem.code] || problem.code, problem.params) : (problem.msg || "unknown problem");
};
const effectiveProblems = (computed, context, ui) => {
  const gaps = (context.catalogGaps || []).map((gap) => typeof gap === "string"
    ? { level: "warn", code: "catalog-gap", params: { detail: gap }, msg: gap }
    : { level: gap.level || "warn", code: gap.code || "catalog-gap", params: gap.params || { detail: gap.msg || String(gap) }, msg: gap.msg || String(gap) });
  return [...(computed.problems || []), ...gaps].map((p) => ({ ...p, display: problemMessage(p, ui, context.lang || "en") }));
};
const contextOf = (context = {}) => {
  const lang = ["en", "fr", "de", "es", "it", "ja", "ru", "zh", "ar"].includes(context.lang) ? context.lang : "en";
  const selectedUi = context.ui?.[lang] || context.ui || {};
  const ui = deepMerge(lang === "fr" ? deepMerge(FALLBACK_UI, FR_UI) : FALLBACK_UI, selectedUi);
  const labels = deepMerge(context.fallbackLabels || {}, context.labels || {});
  return { ...context, lang, labels, ui, mode: context.mode === "site" ? "site" : "standalone" };
};
const safeHref = (href) => {
  const value = String(href || "").trim();
  return /^(?:https:\/\/|\.{0,2}\/|\/)[^\s]*$/i.test(value) ? value : null;
};
const sourceGroup = {
  "class-level": "classes", subclass: "subclasses", species: "species",
  lineage: "lineages", background: "backgrounds", feat: "feats",
};
const sourceDisplay = (computed, sourceId, fallback, labels, lang) => {
  const source = (computed.model?.sources || []).find((entry) => entry.id === sourceId);
  if (source) {
    const id = source.catalogId || source.id;
    return labelMap(labels, sourceGroup[source.kind], id, null, lang);
  }
  if (sourceId && labels?.equipment?.[sourceId]) return labels.equipment[sourceId];
  return sourceId || "?";
};
const provenanceText = (value, computed, labels, lang) => {
  if (!value?.provenance) return value?.prov || "";
  const formula = value.provenance.formula || value.key || "derived";
  const sources = (value.provenance.sources || [])
    .map((sourceId) => sourceDisplay(computed, sourceId, null, labels, lang));
  return sources.length ? `${formula} ← ${sources.join(", ")}` : formula;
};
const derivedLabel = (entry, ui, lang) => {
  const localized = {
    hp: ui.hp, hitDie: lang === "fr" ? "Dé de vie" : "Hit Die",
    ac: ui.ac, initiative: ui.init, passivePerception: ui.pp,
  };
  return localized[entry.key] || (lang === "fr" ? entry.name : entry.key || entry.name);
};
const derivedByKey = (computed, key, legacyName) =>
  (computed.derived || []).find((d) => d.key === key) || (computed.derived || []).find((d) => d.name === legacyName) || {};

export function renderHTML(computed, rawContext = {}) {
  const context = contextOf(rawContext);
  const { lang, ui, labels, mode } = context;
  const model = computed.model || {};
  const identity = model.identity || {};
  const source = context.source || `${model.id || "character"}.character.json`;
  const className = labelMap(labels, "classes", model.classId || model.sources?.find((s) => s.kind === "class-level")?.catalogId || model.sources?.find((s) => s.kind === "class-level")?.id, identity.className, lang);
  const speciesName = labelMap(labels, "species", model.speciesId || model.sources?.find((s) => s.kind === "species")?.catalogId || model.sources?.find((s) => s.kind === "species")?.id, identity.species, lang);
  const backgroundId = model.backgroundId || model.sources?.find((s) => s.kind === "background")?.catalogId || model.sources?.find((s) => s.kind === "background")?.id;
  const lineageId = model.lineageId || model.sources?.find((s) => s.kind === "lineage")?.catalogId || model.sources?.find((s) => s.kind === "lineage")?.id;
  const backgroundName = labelMap(labels, "backgrounds", backgroundId, identity.background, lang);
  const lineageName = identity.lineage ? labelMap(labels, "lineages", lineageId || stableId(identity.lineage, "lineage"), identity.lineage, lang) : null;
  const title = `${identity.name || "?"} — ${className || "?"} ${ui.level} ${computed.lvl}`.trim();
  const problems = effectiveProblems(computed, context, ui);
  const errors = problems.filter((p) => p.level === "error");
  const warnings = problems.filter((p) => p.level === "warn" || p.level === "warning");
  const problemItems = problems.map((p) => `<li>${badge(ui, p.level === "error" ? "conflict" : "warning")} ${escapeText(p.display)}</li>`).join("");
  const lintClass = errors.length ? "error" : warnings.length ? "warning" : "ok";
  const lintMessage = errors.length || warnings.length ? ui.manualVerification : ui.verified;
  const lintBanner = `<div class="callout ${lintClass}"><strong>sheet-lint: ${errors.length} ${escapeText(ui.errors)}, ${warnings.length} ${escapeText(ui.warnings)}.</strong> ${escapeText(lintMessage)}${problemItems ? `<ul>${problemItems}</ul>` : ""}</div>`;
  const counters = (computed.counters || []).map((counter) => {
    const quota = counter.quotaDeclared === false ? ui.quotaNotDeclared : counter.allowed;
    const state = counter.state || (counter.allowed != null && counter.used > counter.allowed ? "exceeded" : "ok");
    const badgeStatus = state === "unverified" ? "warning" : state === "exceeded" ? "conflict" : state;
    return `<li>${escapeText(counter.kind)} (${escapeText(counter.list)}): <strong>${counter.used}/${escapeText(quota)}</strong> ${state !== "ok" ? badge(ui, badgeStatus, statusOf(ui, state)) : ""}</li>`;
  }).join("");
  const scoreCells = ABILITIES.map((ability) => {
    const name = labels?.abilities?.[ability] || ability.toUpperCase();
    return `<div class="score"><span class="name">${escapeText(name.slice(0, 3))}</span><span class="mod">${sign(computed.mods?.[ability] || 0)}</span><span class="raw">${escapeText(computed.scores?.[ability] ?? "?")}</span></div>`;
  }).join("");
  const deductions = (computed.effects || []).filter((effect) => effect.type === "grants" && effect._status === "source").map((effect) => {
    const value = effect.value ?? effect.spell ?? effect.list ?? (effect.count != null ? `×${effect.count}` : "");
    return `<tr><td>${escapeText(sourceDisplay(computed, effect._from, effect._label, labels, lang))}</td><td>${escapeText(effect.what)}${value !== "" ? ` = ${escapeText(value)}` : ""}</td><td>${badge(ui, "source", ui.automatic)}</td></tr>`;
  }).join("");
  const missingRows = (computed.missing || []).map((entry) =>
    `<tr><td>${escapeText(entry.kind)}</td><td>${escapeText(entry.count)}</td><td>${escapeText(entry.from)}</td><td>${escapeText(sourceDisplay(computed, entry.sourceId, entry.src, labels, lang))}</td></tr>`).join("") ||
    `<tr><td colspan="4">${escapeText(ui.noPending)}</td></tr>`;
  const conflictRows = (computed.conflicts || []).map((entry) =>
    `<tr><td>${escapeText(entry.what)}</td><td>${escapeText(entry.a)}</td><td>${escapeText(entry.b)}</td><td>${escapeText(entry.fix)}</td></tr>`).join("") ||
    `<tr><td colspan="4">${escapeText(ui.noConflicts)}</td></tr>`;
  const derivedRows = (computed.derived || []).map((entry) =>
    `<div class="field"><span class="label">${escapeText(derivedLabel(entry, ui, lang))}</span><span class="value">${escapeText(entry.value)} ${badge(ui, entry.status)}</span><span class="provenance">${escapeText(provenanceText(entry, computed, labels, lang))}</span></div>`).join("");
  const castingRows = (computed.castingRows || []).map((row) =>
    `<div class="field"><span class="label">${escapeText(ui.spellcasting)}: ${escapeText(row.list)}</span><span class="value">DC ${escapeText(row.dc)} / atk ${sign(row.atk)}</span><span class="provenance">${escapeText(lang === "fr" ? row.prov : `8 + PB + ${row.ability} ← ${sourceDisplay(computed, row.sourceId, null, labels, lang)}`)}</span></div>`).join("");
  const saves = (computed.saves || []).map((save) => `<td>${sign(save.total)}${save.prof ? ` ${badge(ui, "source", "M")}` : ""}</td>`).join("");
  const skills = (computed.skills || []).map((skill) =>
    `<tr><td>${escapeText(labelMap(labels, "skills", skill.id || skill.name, skill.name, lang))}</td><td>${escapeText(labels?.abilities?.[skill.ab] || skill.ab)}</td><td>${sign(skill.total)}</td><td>${skill.prof ? `${escapeText(sourceDisplay(computed, skill.sourceId, skill.src, labels, lang))} ${skill.st ? badge(ui, skill.st) : ""}` : "—"}</td></tr>`).join("");
  const featureRows = (computed.features || []).map((feature) =>
    `<tr><td>${escapeText(labelMap(labels, "features", feature.featureId, feature.name, lang))}</td><td>${escapeText(feature.level ?? "—")}</td><td>${escapeText(sourceDisplay(computed, feature.sourceId, feature.src, labels, lang))}</td><td>${badge(ui, feature.st || "source")}</td></tr>`).join("");
  const spellRows = (spells, cols) => (spells || []).map((spell) =>
    `<tr><td>${escapeText(labelMap(labels, "spells", spell.id, spell.label, lang))}</td><td>${escapeText(spell.list)}</td><td>${escapeText(ui.origins?.[spell.origin] || spell.origin)}</td><td>${badge(ui, spell.status || "source")}</td>${cols === 5 ? `<td>${escapeText(spell.sourceId)}</td>` : ""}</tr>`).join("") || `<tr><td colspan="${cols}">—</td></tr>`;
  const equipmentRows = (model.equipment || []).map((equipment) => {
    const name = labelMap(labels, "equipment", equipment.id || stableId(equipment.object, "equipment"), equipment.object, lang);
    const roles = (equipment.roleIds || equipment.roles || []).map((role) => `<span class="pill">${escapeText(ui.roles?.[role] || role)}</span>`).join(" ");
    const details = equipment.weapon
      ? `${equipment.weapon.damage} ${ui.damageTypes?.[equipment.damageType || equipment.weapon.type] || equipment.damageType || equipment.weapon.type}${equipment.weapon.versatile ? ` (${ui.versatile} ${equipment.weapon.versatile})` : ""}, ${equipment.weapon.ability}`
      : equipment.armor ? `${ui.armorBase} ${equipment.armor.base}${equipment.armor.dexMax != null ? `, ${ui.dexMax} ${equipment.armor.dexMax}` : ""}` : equipment.shield ? "+2 Shield" : "—";
    return `<tr><td>${escapeText(name)}</td><td>${roles}</td><td>${escapeText(details)}</td><td>${escapeText(equipment.from)}</td></tr>`;
  }).join("") || `<tr><td colspan="4">—</td></tr>`;
  const auditRows = (computed.derived || []).map((entry) =>
    `<tr><td>${escapeText(derivedLabel(entry, ui, lang))}</td><td class="provenance">${escapeText(provenanceText(entry, computed, labels, lang))}</td><td>${badge(ui, entry.status)}</td></tr>`).join("");
  const sourceRows = (model.sources || []).map((src) => {
    const ref = mode === "site" ? safeHref(src.ref) : null;
    const label = escapeText(sourceDisplay(computed, src.id, src.label, labels, lang));
    const heading = ref
      ? `<a href="${escapeAttribute(ref)}">${label}</a>`
      : `${label}${src.ref ? ` — ${escapeText(src.ref)}` : ""}`;
    const effects = (src.effects || []).map((effect) => `<li>${escapeText(effect.type === "grants" ? effect.what : effect.type)}${effect.value != null ? ` = ${escapeText(effect.value)}` : effect.spell ? ` = ${escapeText(effect.spell)}` : ""}</li>`).join("");
    return `<div class="field"><span class="label">${heading}</span><ul>${effects}</ul></div>`;
  }).join("");
  const breadcrumb = mode === "site"
    ? `<nav class="breadcrumb" aria-label="Breadcrumb"><a href="../index.html">${escapeText(ui.home)}</a><span class="sep">/</span><a href="index.html">${escapeText(ui.characters)}</a><span class="sep">/</span><span aria-current="page">${escapeText(identity.name)}</span></nav>`
    : "";
  const css = mode === "standalone" ? `<style>${context.assets?.css || ""}</style>` : `<link rel="stylesheet" href="../assets/ds.css">`;
  const js = mode === "standalone" ? `<script>${String(context.assets?.js || "").replace(/<\/script/gi, "<\\/script")}</script>` : `<script src="../assets/ds.js" defer></script>`;
  return `<!doctype html>
<html lang="${escapeAttribute(lang)}"${lang === "ar" ? ' dir="rtl"' : ""}>
<!-- Generated by the Dungeons & Skills deterministic engine. -->
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeText(title)}</title>
  ${css}
</head>
<body data-root="${mode === "standalone" ? "." : ".."}" data-entity="personnage" data-id="${escapeAttribute(model.id || "character")}" data-generated="true"${mode === "standalone" ? ' data-standalone="true"' : ""}>
  <main>
    ${breadcrumb}
    <div class="print-actions"><button type="button" data-print>${escapeText(ui.print)}</button></div>
    <article class="sheet">
      <div class="callout info"><strong>${escapeText(ui.generated)}</strong> ${escapeText(ui.generatedHelp)} <code>${escapeText(source)}</code></div>
      ${lintBanner}
      <header class="header">
        <section class="identity"><span class="label">${escapeText(ui.characterName)}</span><h1>${escapeText(identity.name)}</h1>
          <p class="note">${escapeText(speciesName)}${lineageName ? ` (${escapeText(lineageName)})` : ""}, ${escapeText(className)} ${escapeText(ui.level)} ${computed.lvl}${backgroundName ? `, ${escapeText(backgroundName)}` : ""}.</p></section>
        <section class="meta-grid" aria-label="${escapeAttribute(ui.summary)}">
          <div class="field"><span class="label">${escapeText(ui.pb)}</span><span class="value">${sign(computed.PB)}</span></div>
          <div class="field"><span class="label">${escapeText(ui.counters)}</span><ul class="small-value">${counters || "<li>—</li>"}</ul></div>
          <div class="field"><span class="label">${escapeText(ui.remaining)}</span><span class="value">${computed.missing?.length || 0}</span></div>
          <div class="field"><span class="label">${escapeText(ui.conflicts)}</span><span class="value">${computed.conflicts?.length || 0}</span></div>
        </section>
      </header>
      <section class="section"><h2>1. ${escapeText(ui.automaticDeductions)}</h2><table><thead><tr><th>${escapeText(ui.source)}</th><th>${escapeText(ui.effectGranted)}</th><th>${escapeText(ui.status)}</th></tr></thead><tbody>${deductions}</tbody></table></section>
      <section class="section"><h2>2. ${escapeText(ui.remaining)}</h2><table><thead><tr><th>${escapeText(ui.choice)}</th><th>${escapeText(ui.count)}</th><th>${escapeText(ui.from)}</th><th>${escapeText(ui.source)}</th></tr></thead><tbody>${missingRows}</tbody></table></section>
      <section class="section"><h2>3. ${escapeText(ui.conflicts)}</h2><table><thead><tr><th>${escapeText(ui.item)}</th><th>${escapeText(ui.path1)}</th><th>${escapeText(ui.path2)}</th><th>${escapeText(ui.resolution)}</th></tr></thead><tbody>${conflictRows}</tbody></table></section>
      <section class="section"><h2>4. ${escapeText(ui.abilityScores)}</h2><div class="score-grid">${scoreCells}</div><p class="note">${escapeText(ui.scoresProvided)}</p></section>
      <section class="grid-3"><div class="section"><h2>${escapeText(ui.defenseSpeed)}</h2>${derivedRows}</div><div class="section"><h2>${escapeText(ui.spellcasting)}</h2>${castingRows || `<p class="note">${escapeText(ui.noSpellcasting)}</p>`}</div><div class="section"><h2>${escapeText(ui.spellcastingSources)}</h2>${Object.entries(computed.casting || {}).map(([list, cast]) => `<div class="field"><span class="label">${escapeText(list)}</span><span class="value">${escapeText(labels?.abilities?.[cast.ability] || cast.ability)}</span><span class="provenance">${escapeText(sourceDisplay(computed, cast.sourceId, cast.src, labels, lang))}</span></div>`).join("") || "—"}</div></section>
      <section class="section"><h2>${escapeText(ui.saves)}</h2><table><thead><tr>${ABILITIES.map((ability) => `<th>${escapeText(labels?.abilities?.[ability] || ability)}</th>`).join("")}</tr></thead><tbody><tr>${saves}</tr></tbody></table></section>
      <section class="section"><h2>${escapeText(ui.skills)}</h2><table><thead><tr><th>${escapeText(ui.skill)}</th><th>${escapeText(ui.ability)}</th><th>${escapeText(ui.total)}</th><th>${escapeText(ui.provenance)}</th></tr></thead><tbody>${skills}</tbody></table></section>
      ${featureRows ? `<section class="section"><h2>${escapeText(ui.narrativeFeatures)}</h2><table><thead><tr><th>${escapeText(ui.feature)}</th><th>${escapeText(ui.level)}</th><th>${escapeText(ui.source)}</th><th>${escapeText(ui.status)}</th></tr></thead><tbody>${featureRows}</tbody></table></section>` : ""}
      <section class="section"><h2>${escapeText(ui.cantrips)}</h2><table><thead><tr><th>${escapeText(ui.spell)}</th><th>${escapeText(ui.list)}</th><th>${escapeText(ui.origin)}</th><th>${escapeText(ui.status)}</th><th>${escapeText(ui.source)}</th></tr></thead><tbody>${spellRows(computed.cantrips, 5)}</tbody></table></section>
      <section class="section"><h2>${escapeText(ui.prepared)}</h2><table><thead><tr><th>${escapeText(ui.spell)}</th><th>${escapeText(ui.list)}</th><th>${escapeText(ui.origin)}</th><th>${escapeText(ui.status)}</th></tr></thead><tbody>${spellRows(computed.prepared, 4)}</tbody></table></section>
      <section class="section"><h2>${escapeText(ui.equipment)}</h2><table><thead><tr><th>${escapeText(ui.item)}</th><th>${escapeText(ui.equipmentRoles)}</th><th>${escapeText(ui.details)}</th><th>${escapeText(ui.provenance)}</th></tr></thead><tbody>${equipmentRows}</tbody></table></section>
      <section class="section"><h2>5. ${escapeText(ui.auditTrail)}</h2><table><thead><tr><th>${escapeText(ui.value)}</th><th>${escapeText(ui.provenanceChain)}</th><th>${escapeText(ui.status)}</th></tr></thead><tbody>${auditRows}</tbody></table></section>
      <section class="section"><h2>6. ${escapeText(ui.sourceEffects)}</h2><div class="grid-2">${sourceRows}</div></section>
    </article>
  </main>
  ${js}
</body>
</html>
`;
}

export function renderMarkdown(computed, rawContext = {}) {
  const context = contextOf(rawContext);
  const { lang, ui, labels } = context;
  const model = computed.model || {};
  const identity = model.identity || {};
  const classId = model.classId || model.sources?.find((s) => s.kind === "class-level")?.id;
  const speciesId = model.speciesId || model.sources?.find((s) => s.kind === "species")?.id;
  const className = labelMap(labels, "classes", classId, identity.className, lang);
  const speciesName = labelMap(labels, "species", speciesId, identity.species, lang);
  const out = [`# ${markdown(identity.name || "?")}`, `*${markdown(speciesName)}, ${markdown(className)} ${markdown(ui.level)} ${computed.lvl}.*`, ""];
  out.push(`| ${ABILITIES.map((a) => markdown(labels?.abilities?.[a] || a)).join(" | ")} |`);
  out.push(`|${ABILITIES.map(() => "---").join("|")}|`);
  out.push(`| ${ABILITIES.map((a) => `${computed.scores?.[a] ?? "?"} (${sign(computed.mods?.[a] || 0)})`).join(" | ")} |`, "");
  const core = [
    [ui.pb, sign(computed.PB), "PB"],
    [ui.hp, derivedByKey(computed, "hp", "Points de vie")],
    [ui.ac, derivedByKey(computed, "ac", "CA")],
    [ui.init, derivedByKey(computed, "initiative", "Initiative")],
    [ui.pp, derivedByKey(computed, "passivePerception", "Perception passive")],
  ];
  for (const [name, entry, pbProv] of core) {
    const value = typeof entry === "object" ? entry.value : entry;
    const prov = typeof entry === "object" ? provenanceText(entry, computed, labels, lang) : pbProv;
    out.push(`- **${markdown(name)}**: ${markdown(value)} _(${markdown(ui.provenance)}: ${markdown(prov)})_`);
  }
  out.push("", `## ${markdown(ui.saves)}`, (computed.saves || []).map((save) => `${markdown(labels?.abilities?.[save.a] || save.a)} ${sign(save.total)}${save.prof ? "*" : ""}`).join(" · "), "");
  const proficient = (computed.skills || []).filter((skill) => skill.prof);
  if (proficient.length) out.push(`## ${markdown(ui.skills)}`, ...proficient.map((skill) => `- ${markdown(labelMap(labels, "skills", skill.id || skill.name, skill.name, lang))} ${sign(skill.total)} _(${markdown(sourceDisplay(computed, skill.sourceId, skill.src, labels, lang))})_`), "");
  if (computed.features?.length) out.push(`## ${markdown(ui.features)}`, ...computed.features.map((feature) => `- **${markdown(labelMap(labels, "features", feature.featureId, feature.name, lang))}** _(${markdown(sourceDisplay(computed, feature.sourceId, feature.src, labels, lang))})_`), "");
  if (computed.cantrips?.length || computed.prepared?.length) {
    out.push(`## ${markdown(ui.spells)}`);
    if (computed.cantrips?.length) out.push(`- **${markdown(ui.cantrips)}**: ${computed.cantrips.map((spell) => markdown(labelMap(labels, "spells", spell.id, spell.label, lang))).join(", ")}`);
    if (computed.prepared?.length) out.push(`- **${markdown(ui.prepared)}**: ${computed.prepared.map((spell) => markdown(labelMap(labels, "spells", spell.id, spell.label, lang))).join(", ")}`);
    out.push("");
  }
  if (model.equipment?.length) out.push(`## ${markdown(ui.equipment)}`, ...model.equipment.map((equipment) => `- ${markdown(labelMap(labels, "equipment", equipment.id || stableId(equipment.object, "equipment"), equipment.object, lang))} (${markdown((equipment.roleIds || equipment.roles || []).join(", "))})`), "");
  out.push(`## ${markdown(ui.lint)}`);
  out.push(`- ${markdown(ui.remaining)}: ${computed.missing?.length ? computed.missing.map((entry) => `${markdown(entry.kind)}×${entry.count}`).join(", ") : markdown(ui.none)}`);
  out.push(`- ${markdown(ui.conflicts)}: ${computed.conflicts?.length ? computed.conflicts.map((entry) => markdown(entry.what)).join(", ") : markdown(ui.none)}`);
  const problems = effectiveProblems(computed, context, ui);
  const errors = problems.filter((p) => p.level === "error");
  const warnings = problems.filter((p) => p.level === "warn" || p.level === "warning");
  out.push(`- ${errors.length ? "⛔" : "✅"} ${errors.length} ${markdown(ui.errors)}`);
  errors.forEach((problem) => out.push(`  - ${markdown(problem.display)}`));
  out.push(`- ${warnings.length ? "⚠" : "✅"} ${warnings.length} ${markdown(ui.warnings)}`);
  warnings.forEach((problem) => out.push(`  - ${markdown(problem.display)}`));
  out.push(`- ${markdown(errors.length || warnings.length ? ui.manualVerification : ui.verified)}`);
  return out.join("\n");
}
