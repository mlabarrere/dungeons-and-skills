/* Regenere docs/html/especes/index.html a partir des pages especes/*.html.
   Usage : node docs/_analysis/build-especes-index.mjs */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "html", "especes");
function attr(t, n) { const m = t.match(new RegExp(n + '\\s*=\\s*"([^"]*)"')); return m ? m[1] : ""; }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

const files = readdirSync(DIR).filter((f) => f.endsWith(".html") && f !== "index.html");
const rows = files.map((f) => {
  const html = readFileSync(join(DIR, f), "utf8");
  const m = html.match(/<article[^>]*\bdata-entity="espece"[^>]*>/);
  if (!m) return null;
  const id = attr(m[0], "data-id") || f.replace(/\.html$/, "");
  const status = attr(m[0], "data-status") || "source";
  const name = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, f])[1].replace(/<[^>]+>/g, "").trim();
  // lignages : sections data-entity="lignage" avec id d'ancre
  const lin = [...html.matchAll(/<[^>]*\bdata-entity="lignage"[^>]*\bid="([^"]+)"[^>]*>/g)].map((x) => x[1]);
  return { id, file: f, name, status, lin };
}).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name, "fr"));

const body = rows.map((r) => {
  const badge = r.status === "manquant" ? '<span class="badge" data-status="manquant">Manquant</span>' : '<span class="badge" data-status="source">Source</span>';
  const linTxt = r.lin.length ? r.lin.map((a) => `<a href="${r.file}#${a}" data-ref="${a}">${esc(a)}</a>`).join(" · ") : "—";
  const attr2 = r.status === "manquant" ? ' data-status="manquant"' : "";
  return `            <tr data-id="${r.id}"${attr2}><td><span class="name"><a href="${r.file}" data-ref="${r.id}">${esc(r.name)}</a></span></td><td>${badge}</td><td>${linTxt}</td></tr>`;
}).join("\n");

const page = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Especes — Index</title>
  <link rel="stylesheet" href="../assets/grimoire.css">
</head>
<body data-root=".." data-breadcrumb="Accueil|/index.html; Especes">
  <main>
    <article class="sheet" data-entity="regle" data-id="especes-index">
      <h1>Especes</h1>
      <p class="note">Especes de D&amp;D 2024 (5.5). ${rows.length} especes. Index genere par <code>docs/_analysis/build-especes-index.mjs</code> — ne pas editer a la main.</p>
      <table class="entity-table">
        <thead><tr><th>Espece</th><th>Statut</th><th>Lignages / heritages</th></tr></thead>
        <tbody>
${body}
        </tbody>
      </table>
    </article>
  </main>
  <script src="../assets/grimoire.js" defer></script>
</body>
</html>
`;
writeFileSync(join(DIR, "index.html"), page, "utf8");
console.log(`especes/index.html regenere : ${rows.length} especes (${rows.filter((r) => r.status === "manquant").length} stub).`);
