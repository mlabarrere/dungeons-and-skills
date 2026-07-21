/* GENERATED COPY — do not edit. Source: docs/_engine/build-character.mjs. */
/* Regenerate: node scripts/build-bundles.mjs — verified by scripts/check-sync.mjs. */
/* ==========================================================================
   build-character.mjs — compute(Character) -> fiche HTML (projection)
   Usage : node docs/_engine/build-character.mjs medicis malbec
   Exporte computeCharacter() et renderHTML() pour sheet-lint.mjs.
   ESM PUR importable navigateur : aucune dependance Node en tete de module ;
   les APIs Node (fs/url/path) sont chargees dynamiquement dans le bloc CLI.
   ========================================================================== */
import { normId } from "./resolver.mjs";

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
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ------------------------------------------------------------------ compute */
export function computeCharacter(model) {
  const problems = [];
  const err = (msg) => problems.push({ level: "error", msg });
  const warn = (msg) => problems.push({ level: "warn", msg });

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
    if (!STATUSES.includes(c.status)) err(`choix ${c.id}: statut invalide "${c.status}"`);
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
  const features = grantsOf("feature").map((e) => ({ name: e.name || e.value, level: e.level, src: e._label, st: e._status || "source" }));
  // PV bonus par niveau (ex. nain : +1 PV/niveau).
  const bonusHPPerLevel = grantsOf("bonusHitPointsPerLevel").reduce((a, e) => a + (e.value || 0), 0);

  // -- requires (preconditions) ----------------------------------------------
  effects.filter((e) => e.type === "requires").forEach((e) => {
    if (e.precondition === "shieldTraining" && !hasShieldTraining)
      err(`${e._label}: requiert shieldTraining, absent`);
  });

  // -- Incantation : listes, compteurs ---------------------------------------
  const casting = {}; // list -> {ability, src}
  grantsOf("spellcasting").forEach((e) => { casting[e.list] = { ability: e.ability, src: e._label }; });
  const cantripAllowed = {}, preparedAllowed = {};
  grantsOf("cantripSlots").forEach((e) => { cantripAllowed[e.list] = (cantripAllowed[e.list] || 0) + e.count; });
  grantsOf("preparedSlots").forEach((e) => { preparedAllowed[e.list] = (preparedAllowed[e.list] || 0) + e.count; });

  const cantrips = (model.spells?.cantrips) || [];
  const prepared = (model.spells?.prepared) || [];
  const cantripUsed = {}, preparedUsed = {};
  cantrips.forEach((s) => { cantripUsed[s.list] = (cantripUsed[s.list] || 0) + 1; });
  prepared.forEach((s) => { if (s.origin !== "alwaysPrepared") preparedUsed[s.list] = (preparedUsed[s.list] || 0) + 1; });

  // Compteurs (uniquement les listes qui ont un quota)
  const counters = [];
  Object.keys(cantripAllowed).forEach((list) => {
    const used = cantripUsed[list] || 0, allowed = cantripAllowed[list];
    counters.push({ kind: "Sorts mineurs", list, used, allowed });
    if (used > allowed) err(`compteur cantrips (${list}) depasse : ${used}/${allowed}`);
  });
  Object.keys(preparedAllowed).forEach((list) => {
    const used = preparedUsed[list] || 0, allowed = preparedAllowed[list];
    counters.push({ kind: "Sorts prepares", list, used, allowed });
    if (used > allowed) err(`compteur sorts prepares (${list}) depasse : ${used}/${allowed}`);
  });

  // -- Verifs sorts : cantrips/alwaysPrepared accordas presents ---------------
  const cantripIds = new Set(cantrips.map((s) => s.id));
  grantsOf("cantrip").forEach((e) => {
    if (!cantripIds.has(e.spell)) err(`cantrip accorde absent de la fiche : ${e.spell} (${e._label})`);
  });
  const preparedIds = new Set(prepared.map((s) => s.id));
  grantsOf("alwaysPreparedSpell").forEach((e) => {
    if (!preparedIds.has(e.spell)) err(`sort toujours prepare absent : ${e.spell} (${e._label})`);
  });

  // -- Conflits : meme sort accorde (auto) ET choisi (chosen) -----------------
  const conflicts = [];
  const grantedCantripSpells = new Map();
  grantsOf("cantrip").forEach((e) => grantedCantripSpells.set(e.spell, e._label));
  cantrips.forEach((s) => {
    if (s.origin === "chosen" && grantedCantripSpells.has(s.id)) {
      const via = grantedCantripSpells.get(s.id);
      conflicts.push({ what: s.label || s.id, a: `choisi (${s.list})`, b: `deja accorde par ${via}`, fix: "remplacer le choix" });
      if (s.status !== "conflit") err(`doublon non marque conflit : ${s.id} (accorde par ${via} + choisi)`);
    }
  });

  // -- Choix manquants (requiresChoice non satisfaits) ------------------------
  const satisfied = new Set((model.choices || []).map((c) => c.satisfies));
  const missing = [];
  effects.filter((e) => e.type === "requiresChoice").forEach((e) => {
    if (!satisfied.has(e.kind)) missing.push({ kind: e.kind, count: e.count || 1, from: e.from, src: e._label });
  });
  // Compteurs de choix restants (cantrips/prepares sous quota)
  counters.forEach((c) => { if (c.used < c.allowed) missing.push({ kind: `${c.kind} ${c.list}`, count: c.allowed - c.used, from: `liste ${c.list}`, src: "quota" }); });

  // -- Valeurs derivees (avec provenance) -------------------------------------
  const D = []; // {name, value, status, prov}
  const conMod = mods.con;
  const hitDieE = grantsOf("hitDie")[0];
  if (!hitDieE) warn("aucun hitDie accorde (PV non calculable)");
  const hitDie = hitDieE ? hitDieE.die : null;
  if (hitDie) D.push({ name: "Points de vie", value: hitDie + conMod + bonusHPPerLevel * lvl, status: "calcule",
    prov: `de de vie d${hitDie} (max ${hitDie}) + mod Con (${sign(conMod)})${bonusHPPerLevel ? ` + ${bonusHPPerLevel}/niveau x${lvl}` : ""} <- ${esc(hitDieE._label)}` });
  D.push({ name: "De de vie", value: `1d${hitDie || "?"}`, status: hitDie ? "source" : "manquant",
    prov: hitDie ? `classe <- ${esc(hitDieE._label)} (de de vie, PAS de degats)` : "hitDie manquant" });

  // CA depuis l'equipement
  const armorItem = (model.equipment || []).find((it) => it.armor);
  const shieldItem = (model.equipment || []).find((it) => it.shield);
  let ca, caProv;
  if (armorItem) {
    const dexPart = armorItem.armor.dexMax != null ? Math.min(mods.dex, armorItem.armor.dexMax) : mods.dex;
    ca = armorItem.armor.base + dexPart;
    caProv = `${esc(armorItem.object)} base ${armorItem.armor.base} + Dex ${sign(dexPart)}${armorItem.armor.dexMax != null ? ` (plafond ${armorItem.armor.dexMax})` : ""}`;
  } else { ca = 10 + mods.dex; caProv = `10 + Dex ${sign(mods.dex)} (sans armure)`; }
  if (shieldItem) {
    if (!hasShieldTraining) err("bouclier equipe sans maitrise des boucliers");
    ca += 2;
    caProv += ` + bouclier +2`;
  }
  D.push({ name: "CA", value: ca, status: "calcule", prov: caProv });
  D.push({ name: "Initiative", value: sign(mods.dex), status: "calcule", prov: `mod Dex ${sign(mods.dex)}` });
  const percProf = !!skillProf[normId("Perception")];
  const pp = 10 + mods.wis + (percProf ? PB : 0);
  D.push({ name: "Perception passive", value: pp, status: "calcule", prov: `10 + Sag ${sign(mods.wis)}${percProf ? ` + maitrise ${sign(PB)}` : ""}` });

  // Incantation par liste
  const castingRows = [];
  Object.entries(casting).forEach(([list, c]) => {
    const m = mods[c.ability];
    castingRows.push({ list, ability: c.ability, dc: 8 + PB + m, atk: PB + m,
      prov: `DD 8 + maitrise ${sign(PB)} + ${ABILITY_LABEL[c.ability]} ${sign(m)} <- ${esc(c.src)}` });
  });

  // Jets de sauvegarde
  const saves = ABILITIES.map((a) => {
    const prof = !!saveProf[a];
    return { a, total: mods[a] + (prof ? PB : 0), prof, src: prof ? saveProf[a]._label : null };
  });

  // Competences
  const skills = Object.entries(SKILLS).map(([name, ab]) => {
    const p = skillProf[normId(name)];
    const exp = p && p.expertise;
    const total = mods[ab] + (p ? PB : 0) + (exp ? PB : 0);
    return { name, ab, total, prof: !!p, exp: !!exp, src: p ? (p._label || "") : null, st: p ? p._status : null };
  });

  // Equipement decompose
  (model.equipment || []).forEach((it) => {
    if (!it.roles || !it.roles.length) warn(`objet sans roles decomposes : ${it.object}`);
  });

  // Statuts hors enum sur les sorts
  [...cantrips, ...prepared].forEach((s) => { if (s.status && !STATUSES.includes(s.status)) err(`sort ${s.id}: statut invalide "${s.status}"`); });

  return { model, lvl, PB, scores, mods, effects, saveProf, skillProf, languages, tools, weaponProf,
    features, bonusHPPerLevel, armorTraining, hasShieldTraining, casting, castingRows, counters,
    cantrips, prepared, conflicts, missing, derived: D, saves, skills, problems };
}

/* ------------------------------------------------------------------- render */
function badge(st, label) { return `<span class="badge" data-status="${st}">${esc(label || st)}</span>`; }

export function renderHTML(C) {
  const m = C.model, id = m.identity || {};
  const title = `${id.name} — ${id.className || ""} niveau ${C.lvl}`.trim();
  const bc = `Accueil|/index.html; Personnages|/personnages/index.html; ${esc(id.name)}`;

  const summaryCounters = C.counters.map((c) =>
    `<li>${c.kind} (${esc(c.list)}) : <strong>${c.used}/${c.allowed}</strong>${c.used > c.allowed ? " " + badge("conflit", "depasse") : ""}</li>`).join("");

  const deductions = C.effects.filter((e) => e.type === "grants" && e._status === "source").map((e) => {
    const what = e.what + (e.value ? ` = ${esc(e.value)}` : e.spell ? ` = ${esc(e.spell)}` : e.list ? ` (${esc(e.list)})` : e.count != null ? ` x${e.count}${e.list ? " " + esc(e.list) : ""}` : "");
    return `<tr><td>${esc(e._label)}</td><td>${esc(what)}</td><td>${badge("source", "Automatique")}</td></tr>`;
  }).join("");

  const missingRows = C.missing.map((x) =>
    `<tr><td>${esc(x.kind)}</td><td>${x.count}</td><td>${esc(x.from || "")}</td><td>${esc(x.src || "")}</td></tr>`).join("")
    || `<tr><td colspan="4">Aucun choix en attente.</td></tr>`;

  const conflictRows = C.conflicts.map((c) =>
    `<tr><td>${esc(c.what)}</td><td>${esc(c.a)}</td><td>${esc(c.b)}</td><td>${esc(c.fix)}</td></tr>`).join("")
    || `<tr><td colspan="4">Aucun conflit detecte.</td></tr>`;

  const scoreCells = ABILITIES.map((a) =>
    `<div class="score"><span class="name">${ABILITY_LABEL[a].slice(0, 3)}</span><span class="mod">${sign(C.mods[a])}</span><span class="raw">${C.scores[a] ?? "?"}</span></div>`).join("");

  const derivedFields = C.derived.map((d) =>
    `<div class="field"><span class="label">${esc(d.name)}</span><span class="value">${esc(d.value)} ${badge(d.status, d.status)}</span><span class="provenance">${d.prov}</span></div>`).join("");

  const castRows = C.castingRows.map((r) =>
    `<div class="field"><span class="label">Incantation ${esc(r.list)}</span><span class="value">DD ${r.dc} / atk ${sign(r.atk)}</span><span class="provenance">${r.prov}</span></div>`).join("");

  const saveRow = C.saves.map((s) => `<td>${sign(s.total)}${s.prof ? " " + badge("source", "M") : ""}</td>`).join("");

  const skillRows = C.skills.map((s) =>
    `<tr><td>${esc(s.name)}</td><td>${ABILITY_LABEL[s.ab].slice(0, 3)}</td><td>${sign(s.total)}</td><td>${s.prof ? esc(s.src) + (s.st ? " " + badge(s.st, s.st) : "") : "—"}</td></tr>`).join("");

  const cantripCounter = C.counters.filter((c) => c.kind === "Sorts mineurs").map((c) => `${esc(c.list)} ${c.used}/${c.allowed}`).join(" · ");
  const cantripRows = C.cantrips.map((s) =>
    `<tr><td>${esc(s.label || s.id)}</td><td>${esc(s.list)}</td><td>${esc(s.origin)}</td><td>${badge(s.status || "source", s.status || "source")}</td><td class="provenance">${esc(s.sourceId || "")}</td></tr>`).join("");

  const prepCounter = C.counters.filter((c) => c.kind === "Sorts prepares").map((c) => `${esc(c.list)} ${c.used}/${c.allowed}`).join(" · ");
  const prepRows = C.prepared.map((s) =>
    `<tr><td>${esc(s.label || s.id)}</td><td>${esc(s.list)}</td><td>${s.origin === "alwaysPrepared" ? "toujours prepare (hors quota)" : esc(s.origin)}</td><td>${badge(s.status || "source", s.status || "source")}</td></tr>`).join("");

  const equipRows = (m.equipment || []).map((it) =>
    `<tr><td>${esc(it.object)}</td><td>${(it.roles || []).map((r) => `<span class="pill">${esc(r)}</span>`).join(" ")}</td><td>${it.weapon ? esc(`${it.weapon.damage} ${it.weapon.type}${it.weapon.versatile ? " (versatile " + it.weapon.versatile + ")" : ""}, ${it.weapon.ability}`) : it.armor ? esc(`CA base ${it.armor.base}${it.armor.dexMax != null ? ", Dex max " + it.armor.dexMax : ""}`) : it.shield ? "bouclier +2" : "—"}</td><td>${esc(it.from || "")}</td></tr>`).join("");

  const auditRows = C.derived.map((d) => `<tr><td>${esc(d.name)}</td><td class="provenance">${d.prov}</td><td>${badge(d.status, d.status)}</td></tr>`).join("");

  const featureRows = (C.features || []).map((f) =>
    `<tr><td>${esc(f.name)}</td><td>${f.level != null ? "niv. " + f.level : "—"}</td><td>${esc(f.src)}</td><td>${badge(f.st, f.st)}</td></tr>`).join("");

  const sourceEffects = (m.sources || []).map((src) => {
    const items = (src.effects || []).map((e) => `<li>${esc(e.type === "grants" ? e.what : e.type)}${e.value ? " = " + esc(e.value) : e.spell ? " = " + esc(e.spell) : e.count != null ? " x" + e.count : ""}${e.list ? " (" + esc(e.list) + ")" : ""}</li>`).join("");
    return `<div class="field"><span class="label">${esc(src.label || src.id)}${src.ref ? ` — <a href="${esc(src.ref)}">source</a>` : ""}</span><ul>${items}</ul></div>`;
  }).join("");

  const problemsBanner = C.problems.filter((p) => p.level === "error").length
    ? `<div class="callout error"><strong>sheet-lint : ${C.problems.filter((p) => p.level === "error").length} erreur(s).</strong> ${C.problems.filter(p => p.level === "error").map((p) => esc(p.msg)).join(" ; ")}</div>`
    : `<div class="callout ok"><strong>sheet-lint : 0 erreur.</strong> Compteurs, provenance, conflits et doublons verifies.</div>`;

  return `<!doctype html>
<html lang="fr">
<!-- FICHE GENEREE par docs/_engine/build-character.mjs depuis
     docs/characters/${esc(m.id)}.character.json.
     NE PAS EDITER A LA MAIN : editer le JSON puis regenerer. -->
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <link rel="stylesheet" href="../assets/ds.css">
</head>
<body data-root=".." data-breadcrumb="${bc}" data-entity="personnage" data-id="${esc(m.id)}" data-generated="true">
  <main>
    <div class="print-actions"><button type="button" data-print>Imprimer la fiche</button></div>
    <article class="sheet">
      <div class="callout info"><strong>Fiche generee.</strong> Projection calculee de
        <code>docs/characters/${esc(m.id)}.character.json</code> par le moteur de domaine.
        Editer le JSON, pas ce fichier.</div>
      ${problemsBanner}

      <header class="header">
        <section class="identity"><span class="label">Nom du personnage</span><h1>${esc(id.name)}</h1>
          <p class="note">${esc(id.species || "")}${id.lineage ? " (" + esc(id.lineage) + ")" : ""}, ${esc(id.className || "")} niveau ${C.lvl}${id.background ? ", historique " + esc(id.background) : ""}.</p></section>
        <section class="meta-grid" aria-label="Resume">
          <div class="field"><span class="label">Bonus de maitrise</span><span class="value">${sign(C.PB)}</span></div>
          <div class="field"><span class="label">Compteurs</span><ul class="small-value">${summaryCounters || "<li>—</li>"}</ul></div>
          <div class="field"><span class="label">Choix restants</span><span class="value">${C.missing.length}</span></div>
          <div class="field"><span class="label">Conflits</span><span class="value">${C.conflicts.length}</span></div>
        </section>
      </header>

      <section class="section"><h2>1. Deductions automatiques (source &rarr; effet)</h2>
        <table><thead><tr><th>Objet source</th><th>Effet accorde</th><th>Statut</th></tr></thead><tbody>${deductions}</tbody></table></section>

      <section class="section"><h2>2. Choix restants</h2>
        <table><thead><tr><th>Choix</th><th>Nombre</th><th>Parmi</th><th>Source</th></tr></thead><tbody>${missingRows}</tbody></table></section>

      <section class="section"><h2>3. Conflits / doublons</h2>
        <table><thead><tr><th>Element</th><th>Chemin 1</th><th>Chemin 2</th><th>Remediation</th></tr></thead><tbody>${conflictRows}</tbody></table></section>

      <section class="section"><h2>4. Caracteristiques</h2><div class="score-grid">${scoreCells}</div>
        <p class="note">Scores : ${esc(C.scores.note || "fournis")}. Modificateurs calcules.</p></section>

      <section class="grid-3">
        <div class="section"><h2>Defense &amp; vitesse</h2>${derivedFields}</div>
        <div class="section"><h2>Incantation</h2>${castRows || "<p class=\"note\">Aucune incantation.</p>"}</div>
        <div class="section"><h2>Sources d'incantation</h2>${Object.entries(C.casting).map(([l, c]) => `<div class="field"><span class="label">${esc(l)}</span><span class="value">${ABILITY_LABEL[c.ability]}</span><span class="provenance">${esc(c.src)}</span></div>`).join("") || "—"}</div>
      </section>

      <section class="section"><h2>Jets de sauvegarde</h2>
        <table><thead><tr>${ABILITIES.map((a) => `<th>${ABILITY_LABEL[a]}</th>`).join("")}</tr></thead><tbody><tr>${saveRow}</tr></tbody></table></section>

      <section class="section"><h2>Competences</h2>
        <table><thead><tr><th>Competence</th><th>Carac.</th><th>Total</th><th>Provenance</th></tr></thead><tbody>${skillRows}</tbody></table></section>

      ${featureRows ? `<section class="section"><h2>Aptitudes (narratives, non calculees)</h2>
        <table><thead><tr><th>Aptitude</th><th>Niveau</th><th>Source</th><th>Statut</th></tr></thead><tbody>${featureRows}</tbody></table></section>` : ""}

      <section class="section"><h2>Sorts mineurs (cantrips) — compteur : ${esc(cantripCounter || "—")}</h2>
        <table><thead><tr><th>Sort</th><th>Liste</th><th>Origine</th><th>Statut</th><th>Source</th></tr></thead><tbody>${cantripRows || "<tr><td colspan=5>—</td></tr>"}</tbody></table></section>

      <section class="section"><h2>Sorts prepares — compteur : ${esc(prepCounter || "—")}</h2>
        <table><thead><tr><th>Sort</th><th>Liste</th><th>Origine</th><th>Statut</th></tr></thead><tbody>${prepRows || "<tr><td colspan=4>—</td></tr>"}</tbody></table></section>

      <section class="section"><h2>Equipement (decompose : objet &rarr; roles)</h2>
        <table><thead><tr><th>Objet</th><th>Roles</th><th>Details</th><th>Provenance</th></tr></thead><tbody>${equipRows || "<tr><td colspan=4>—</td></tr>"}</tbody></table></section>

      <section class="section"><h2>5. Audit trail — case de fiche &rarr; pourquoi</h2>
        <table><thead><tr><th>Valeur</th><th>Chaine de provenance</th><th>Statut</th></tr></thead><tbody>${auditRows}</tbody></table></section>

      <section class="section"><h2>6. Source &rarr; effets</h2><div class="grid-2">${sourceEffects}</div></section>
    </article>
  </main>
  <script src="../assets/ds.js" defer></script>
</body>
</html>
`;
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
      writeFileSync(join(OUTDIR, `${id}.html`), renderHTML(C), "utf8");
      const errs = C.problems.filter((p) => p.level === "error");
      totalErr += errs.length;
      console.log(`${id}.html genere — ${errs.length} erreur(s), ${C.problems.filter(p => p.level === "warn").length} avertissement(s).`);
      C.problems.forEach((p) => console.log(`   [${p.level}] ${p.msg}`));
    }
    process.exit(totalErr ? 1 : 0);
  })();
}
