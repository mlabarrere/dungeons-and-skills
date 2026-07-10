/* Regenere docs/html/classes/index.html a partir des pages classes/*.html.
   Groupe chaque classe avec ses sous-classes (data-parent-class).
   Usage : node docs/_analysis/build-classes-index.mjs */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "C:/Users/mickael.labarrere/OneDrive - Accenture/Personal/DnD/docs/html/classes";

function attr(tag, name) { const m = tag.match(new RegExp(name + '\\s*=\\s*"([^"]*)"')); return m ? m[1] : ""; }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

const files = readdirSync(DIR).filter((f) => f.endsWith(".html") && f !== "index.html");
const classes = {}, subs = {};
for (const f of files) {
  const html = readFileSync(join(DIR, f), "utf8");
  const m = html.match(/<article[^>]*\bdata-entity="(classe|sous-classe)"[^>]*>/);
  if (!m) continue;
  const tag = m[0];
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, f])[1].replace(/<[^>]+>/g, "").trim();
  const entry = { file: f, id: attr(tag, "data-id") || f.replace(/\.html$/, ""), name: h1, status: attr(tag, "data-status") || "source" };
  if (m[1] === "classe") classes[entry.id] = entry;
  else { const p = attr(tag, "data-parent-class") || "?"; (subs[p] = subs[p] || []).push(entry); }
}

const order = ["barbare","barde","clerc","druide","ensorceleur","guerrier","magicien","moine","occultiste","paladin","rodeur","roublard"];
const ids = Object.keys(classes).sort((a, b) => {
  const ia = order.indexOf(a), ib = order.indexOf(b);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
});

const rows = ids.map((id) => {
  const c = classes[id];
  const sc = (subs[id] || []).sort((a, b) => a.name.localeCompare(b.name, "fr"));
  const badge = c.status === "manquant" ? '<span class="badge" data-status="manquant">Manquant</span>' : '<span class="badge" data-status="source">Source</span>';
  const scLinks = sc.length
    ? sc.map((s) => `<a href="${s.file}" data-ref="${s.id}">${esc(s.name)}</a>`).join(" · ")
    : "<span class=\"provenance\">a completer</span>";
  return `            <tr data-id="${id}"><td><span class="name"><a href="${c.file}" data-ref="${id}">${esc(c.name)}</a></span></td><td>${badge}</td><td>${sc.length}</td><td>${scLinks}</td></tr>`;
}).join("\n");

const totalSub = Object.values(subs).reduce((n, a) => n + a.length, 0);

const page = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Classes — Index</title>
  <link rel="stylesheet" href="../assets/grimoire.css">
</head>
<body data-root=".." data-breadcrumb="Accueil|/index.html; Classes">
  <main>
    <article class="sheet" data-entity="regle" data-id="classes-index">
      <h1>Classes</h1>
      <p class="note">Les 12 classes de D&amp;D 2024 (5.5) et leurs sous-classes. ${ids.length} classes, ${totalSub} sous-classes. Index genere par <code>docs/_analysis/build-classes-index.mjs</code> — ne pas editer a la main.</p>
      <table class="entity-table">
        <thead><tr><th>Classe</th><th>Statut</th><th>Sous-classes</th><th>Detail</th></tr></thead>
        <tbody>
${rows}
        </tbody>
      </table>
    </article>
  </main>
  <script src="../assets/grimoire.js" defer></script>
</body>
</html>
`;
writeFileSync(join(DIR, "index.html"), page, "utf8");
console.log(`classes/index.html regenere : ${ids.length} classes, ${totalSub} sous-classes.`);
const stubs = ids.filter((id) => classes[id].status === "manquant");
if (stubs.length) console.log("Classes encore stub : " + stubs.join(", "));
