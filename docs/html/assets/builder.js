/* ==========================================================================
   builder.js — assistant de creation D&D 5.5 (navigateur, DETERMINISTE, zero IA).
   Parcourt docs/data/build-graph.json, propose des champs contraints (options
   calculees par resolver.mjs), et calcule la fiche en direct via build-character.mjs.
   Imports ES : relatifs a CE module (docs/html/assets/) -> ../../_engine/.
   fetch : relatif au document (docs/html/) -> ../data/.
   Servir la racine sur docs/ (voir docs/html/UTILISATION.md).
   ========================================================================== */
import * as R from "../../_engine/resolver.mjs";
import { computeCharacter, renderHTML } from "../../_engine/build-character.mjs";

const ABIL = ["for", "dex", "con", "int", "sag", "cha"];
const ABIL_LABEL = { for: "Force", dex: "Dexterite", con: "Constitution", int: "Intelligence", sag: "Sagesse", cha: "Charisme" };
const KIND_LABEL = {
  "competence-classe": "competence (classe)", "competence": "competence", "cantrip": "sort mineur",
  "prepared": "sort prepare", "langue": "langue", "equipement": "equipement", "ordre-primitif": "ordre primitif",
  "ordre-divin": "ordre divin", "expertise": "expertise", "Dungeons & Skills": "Dungeons & Skills", "spellcasting-ability": "carac. d'incantation",
  "liste-sorts": "liste de sorts (don)", "caracteristique-incantation": "carac. d'incantation (don)",
  "style-de-combat": "style de combat", "outil": "outil", "toolProficiency": "outil",
};

const state = { catalog: null, graph: null, answers: {}, ready: false };
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const labelKind = (k) => KIND_LABEL[k] || k;
const asArray = (v) => (Array.isArray(v) ? v : v != null ? [v] : []);
const ansArray = (id) => asArray(state.answers[id]);

/* ------------------------------------------------------------- chargement */
async function loadCatalog() {
  const files = {
    classes: "classes.json", subclasses: "subclasses.json", species: "species.json",
    backgrounds: "backgrounds.json", feats: "feats.json", equipment: "equipment.json",
    spells: "spells.json", spellsByClass: "spells-by-class.json", languages: "languages.json",
    conditions: "conditions.json", graph: "build-graph.json",
  };
  const entries = await Promise.all(Object.entries(files).map(async ([k, f]) => {
    const res = await fetch(`../data/${f}`);
    if (!res.ok) throw new Error(`${f} : HTTP ${res.status}`);
    return [k, await res.json()];
  }));
  return Object.fromEntries(entries);
}

/* --------------------------------------------------- lecture du formulaire */
function readAnswers() {
  const form = document.getElementById("builder-form");
  const a = { _id: state.answers._id || "brouillon" };
  form.querySelectorAll('[data-answer="single"],[data-answer="choice-one"],[data-answer="text"]').forEach((el) => {
    if (el.value) a[el.dataset.key] = el.value;
  });
  // caracteristiques (valeurs de base)
  const scores = {}; let hasScore = false;
  form.querySelectorAll('[data-answer="ability"]').forEach((el) => { if (el.value !== "") { scores[el.dataset.key] = Number(el.value); hasScore = true; } });
  // bonus d'historique
  const bonus = {}; let hasBonus = false;
  form.querySelectorAll('[data-answer="bonus"]').forEach((el) => { const v = Number(el.value || 0); if (v) { bonus[el.dataset.key] = (bonus[el.dataset.key] || 0) + v; hasBonus = true; } });
  if (hasScore || hasBonus) {
    const final = { for: 10, dex: 10, con: 10, int: 10, sag: 10, cha: 10, ...scores };
    for (const k in bonus) final[k] = (final[k] || 0) + bonus[k];
    a.abilityScores = final;
  }
  if (hasBonus) a["bonus-historique"] = bonus;
  // choix multiples (cases)
  form.querySelectorAll('[data-answer="choice"]:checked').forEach((el) => {
    const k = el.dataset.key; (a[k] = a[k] || []).push(el.value);
  });
  state.answers = a;
}

/* -------------------------------------------------------- rendu des noeuds */
function renderSingle(node) {
  const opts = R.fixedNodeOptions(state.catalog, state.answers, node);
  const cur = state.answers[node.id] || "";
  const options = [`<option value="">— choisir —</option>`]
    .concat(opts.map((o) => `<option value="${esc(o.id)}" ${cur === o.id ? "selected" : ""}>${esc(o.name)}</option>`)).join("");
  const note = opts.length ? "" : `<p class="note">Aucune option (dependant d'un choix precedent).</p>`;
  return `<div class="builder-node"><span class="label">${esc(node.label)}</span>
    <select data-answer="single" data-key="${esc(node.id)}">${options}</select>${note}</div>`;
}

function renderAbilityScores(node) {
  const method = state.answers.methode;
  const m = (state.graph.abilityMethods || []).find((x) => x.id === method);
  const cur = state.answers.abilityScores || {};
  let body;
  if (!m) body = `<p class="note">Choisir d'abord une methode ci-dessus.</p>`;
  else if (m.id === "standard") {
    const pool = m.values;
    body = `<div class="meta-grid">` + ABIL.map((ab) => {
      const used = ABIL.filter((x) => x !== ab).map((x) => cur[x]);
      const opts = [`<option value="">—</option>`].concat(pool.map((v) => {
        const taken = used.includes(v) && cur[ab] !== v;
        return `<option value="${v}" ${cur[ab] === v ? "selected" : ""} ${taken ? "disabled" : ""}>${v}</option>`;
      })).join("");
      return `<div class="field"><span class="label">${ABIL_LABEL[ab]}</span>
        <select data-answer="ability" data-key="${ab}">${opts}</select></div>`;
    }).join("") + `</div><p class="note">Valeurs standard ${JSON.stringify(pool)} : chacune une seule fois.</p>`;
  } else if (m.id === "achat-points") {
    const cost = (v) => (m.costs[String(v)] != null ? m.costs[String(v)] : 99);
    const spent = ABIL.reduce((s, ab) => s + cost(cur[ab] != null ? cur[ab] : 8), 0);
    body = `<div class="meta-grid">` + ABIL.map((ab) =>
      `<div class="field"><span class="label">${ABIL_LABEL[ab]}</span>
        <input type="number" data-answer="ability" data-key="${ab}" min="${m.min}" max="${m.max}" value="${cur[ab] != null ? cur[ab] : 8}"></div>`).join("")
      + `</div><div class="budget ${spent > m.budget ? "over" : ""}" id="ability-budget">Cout : ${spent}/${m.budget} points ${spent > m.budget ? "(depassement !)" : ""}</div>`;
  } else { // des : saisie manuelle (aucun RNG -> deterministe/reproductible)
    body = `<div class="meta-grid">` + ABIL.map((ab) =>
      `<div class="field"><span class="label">${ABIL_LABEL[ab]}</span>
        <input type="number" data-answer="ability" data-key="${ab}" min="3" max="20" value="${cur[ab] != null ? cur[ab] : ""}"></div>`).join("")
      + `</div><p class="note">Lancez 4d6 en gardant les 3 meilleurs, puis saisissez les valeurs (le moteur ne lance pas les des).</p>`;
  }
  return `<div class="builder-node"><span class="label">${esc(node.label)}</span>${body}</div>`;
}

function renderAbilityBonus(node) {
  const bg = R.byId(state.catalog.backgrounds, state.answers.historique);
  if (!bg || !bg.abilityScores) return `<div class="builder-node"><span class="label">${esc(node.label)}</span><p class="note">Choisir un historique d'abord.</p></div>`;
  const abils = bg.abilityScores.abilities || [];
  const cur = state.answers["bonus-historique"] || {};
  const rows = abils.map((ab) => {
    const v = cur[ab] || 0;
    return `<div class="field"><span class="label">${ABIL_LABEL[ab] || ab}</span>
      <select data-answer="bonus" data-key="${ab}">
        <option value="0" ${v === 0 ? "selected" : ""}>+0</option>
        <option value="1" ${v === 1 ? "selected" : ""}>+1</option>
        <option value="2" ${v === 2 ? "selected" : ""}>+2</option>
      </select></div>`;
  }).join("");
  return `<div class="builder-node"><span class="label">${esc(node.label)}</span>
    <div class="meta-grid">${rows}</div><p class="note">Regle : ${esc(bg.abilityScores.rule || "+2/+1 ou +1/+1/+1")}.</p></div>`;
}

function renderChoice(p) {
  const need = p.need || p.count || 1;
  const chosen = ansArray(p.id);
  const reco = new Set(p.recommendations || []);
  const status = chosen.length >= need ? "fourni" : "manquant";
  const counter = `<span class="badge" data-status="${status}">${chosen.length}/${need}</span>`;
  let control;
  if (need === 1) {
    const options = [`<option value="">— choisir —</option>`].concat(p.options.map((o) =>
      `<option value="${esc(o.id)}" ${chosen[0] === o.id ? "selected" : ""}>${esc(o.name)}${reco.has(o.id) ? " ★" : ""}</option>`)).join("");
    control = `<select data-answer="choice-one" data-key="${esc(p.id)}">${options}</select>`;
  } else {
    control = `<div class="opt-list">` + p.options.map((o) => {
      const on = chosen.includes(o.id);
      const dis = !on && chosen.length >= need;
      return `<label class="${reco.has(o.id) ? "reco" : ""}"><input type="checkbox" data-answer="choice" data-key="${esc(p.id)}" value="${esc(o.id)}" ${on ? "checked" : ""} ${dis ? "disabled" : ""}>${esc(o.name)}${reco.has(o.id) ? " ★" : ""}</label>`;
    }).join("") + `</div>`;
  }
  const recoNote = reco.size ? `<p class="note">★ = recommande par le livre (jamais impose).</p>` : "";
  return `<div class="choice-group"><div>${esc(p.sourceLabel)} — ${esc(labelKind(p.kind))} ${counter}</div>${control}${p.note ? `<p class="note">${esc(p.note)}</p>` : ""}${recoNote}</div>`;
}

function renderAggregate(node, items) {
  const body = items.length ? items.map(renderChoice).join("")
    : `<p class="note">Aucun choix requis pour ce bloc (selon les entites choisies).</p>`;
  return `<div class="builder-node"><span class="label">${esc(node.label)}</span>${body}</div>`;
}

function renderAutres(items) {
  return `<div class="choice-group autres"><div class="label">Autres choix (specifiques classe / espece / sous-classe)</div>
    ${items.map(renderChoice).join("")}</div>`;
}

function renderText(node) {
  return `<div class="builder-node"><span class="label">${esc(node.label)}</span>
    <div class="meta-grid">
      <div class="field"><span class="label">Nom</span><input type="text" data-answer="text" data-key="nom" value="${esc(state.answers.nom || "")}"></div>
      <div class="field"><span class="label">Alignement</span><input type="text" data-answer="text" data-key="alignement" value="${esc(state.answers.alignement || "")}"></div>
    </div></div>`;
}

/* --------------------------------------------------------- rendu global */
function renderAll() {
  const form = document.getElementById("builder-form");
  if (!state.ready) { form.innerHTML = `<p class="note">Chargement du catalogue…</p>`; return; }

  // pendingChoices + regroupement par bucket (invariant : aucun choix perdu)
  const pend = R.pendingChoices(state.catalog, state.answers);
  const buckets = {}; const consumed = new Set();
  for (const p of pend) { const b = R.KIND_BUCKET[p.kind]; if (b) { (buckets[b] = buckets[b] || []).push(p); consumed.add(p.id); } }
  const autres = pend.filter((p) => !consumed.has(p.id));

  let html = "";
  for (const step of state.graph.steps) {
    if (!R.nodeApplies(state.catalog, state.answers, step)) continue;
    let nodesHtml = "";
    for (const node of step.nodes) {
      if (!R.nodeApplies(state.catalog, state.answers, node)) continue;
      if (node.type === "single") nodesHtml += renderSingle(node);
      else if (node.type === "ability-scores") nodesHtml += renderAbilityScores(node);
      else if (node.type === "ability-bonus") nodesHtml += renderAbilityBonus(node);
      else if (node.type === "aggregate-choices") nodesHtml += renderAggregate(node, buckets[node.id] || []);
      else if (node.type === "text") nodesHtml += renderText(node);
      else if (node.type === "compute") nodesHtml += `<p class="note">La fiche est calculee en direct dans le panneau de droite.</p>`;
    }
    if (step.id === "competences-langues" && autres.length) nodesHtml += renderAutres(autres);
    html += `<section class="builder-step"><h2>${esc(step.label)}</h2>${nodesHtml}</section>`;
  }
  form.innerHTML = html;
  renderSheet();
}

/* --------------------------------------------------------- fiche live */
function statusStrip(C) {
  const nbErr = C.problems.filter((p) => p.level === "error").length;
  const counters = C.counters.map((c) => {
    const over = c.used > c.allowed;
    return `<li class="counter-line ${over ? "over" : ""}">${esc(c.kind)} (${esc(c.list)}) : ${c.used}/${c.allowed}${over ? " ⚠ depassement" : ""}</li>`;
  }).join("") || "<li>—</li>";
  const conflicts = C.conflicts.map((c) => `<li>${esc(c.what)} — ${esc(c.fix)}</li>`).join("");
  const missing = C.missing.map((x) => `<li>${esc(x.kind)} ×${x.count}</li>`).join("");
  return `<div class="summary">
    <div class="card ${nbErr ? "bad" : "ok"}"><h3>Validation</h3><ul>
      <li>${nbErr ? `${nbErr} erreur(s)` : "0 erreur — fiche valide"}</li>
      ${nbErr ? C.problems.filter((p) => p.level === "error").map((p) => `<li>${esc(p.msg)}</li>`).join("") : ""}
    </ul></div>
    <div class="card ${C.counters.some((c) => c.used > c.allowed) ? "bad" : "warn"}"><h3>Compteurs</h3><ul>${counters}</ul></div>
    <div class="card ${C.conflicts.length ? "bad" : "warn"}"><h3>Choix restants / conflits</h3><ul>
      ${missing || "<li>Aucun choix en attente.</li>"}${conflicts}
    </ul></div>
  </div>`;
}

function renderSheet() {
  if (!state.ready) return;
  const statusEl = document.getElementById("sheet-status");
  const frame = document.getElementById("sheet-frame");
  try {
    const model = R.toCharacterModel(state.catalog, state.answers);
    const C = computeCharacter(model);
    statusEl.innerHTML = statusStrip(C);
    let doc = renderHTML(C).split("../assets/").join("assets/");
    doc = doc.replace(/<script src="assets\/Dungeons & Skills\.js"[^>]*><\/script>/, ""); // fiche statique : pas de JS
    frame.srcdoc = doc;
  } catch (e) {
    statusEl.innerHTML = `<div class="callout error"><strong>Erreur de calcul :</strong> ${esc(e.message)}</div>`;
  }
}

function updateBudget() {
  const el = document.getElementById("ability-budget");
  const m = (state.graph.abilityMethods || []).find((x) => x.id === state.answers.methode);
  if (!el || !m || m.id !== "achat-points") return;
  const cur = state.answers.abilityScores || {};
  const cost = (v) => (m.costs[String(v)] != null ? m.costs[String(v)] : 99);
  const spent = ABIL.reduce((s, ab) => s + cost(cur[ab] != null ? cur[ab] : 8), 0);
  el.textContent = `Cout : ${spent}/${m.budget} points ${spent > m.budget ? "(depassement !)" : ""}`;
  el.classList.toggle("over", spent > m.budget);
}

/* --------------------------------------------------------- evenements */
let sheetTimer = null;
const debounceSheet = () => { clearTimeout(sheetTimer); sheetTimer = setTimeout(renderSheet, 150); };

function wire() {
  const form = document.getElementById("builder-form");
  // 'change' (selects, cases) : re-derive tout (champs dependants recalcules).
  form.addEventListener("change", () => { readAnswers(); renderAll(); });
  // 'input' (nombres/texte) : mise a jour de la fiche sans reconstruire le formulaire (focus conserve).
  form.addEventListener("input", (e) => {
    if (!e.target.matches('[data-answer="ability"],[data-answer="text"]')) return;
    readAnswers(); updateBudget(); debounceSheet();
  });
}

async function init() {
  try {
    const cat = await loadCatalog();
    state.catalog = cat; state.graph = cat.graph; state.ready = true;
    wire(); renderAll();
  } catch (e) {
    const box = document.getElementById("builder-error");
    box.hidden = false;
    box.innerHTML = `<strong>Chargement impossible :</strong> ${esc(e.message)}.
      Servez la racine sur <code>docs/</code> puis ouvrez <code>/html/builder.html</code> (voir docs/html/UTILISATION.md).`;
  }
}

init();
