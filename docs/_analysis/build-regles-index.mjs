/* Regenere docs/html/regles/index.html a partir des pages regles/*.html.
   Usage : node docs/_analysis/build-regles-index.mjs */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "html", "regles");
function attr(t, n) { const m = t.match(new RegExp(n + '\\s*=\\s*"([^"]*)"')); return m ? m[1] : ""; }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

const files = readdirSync(DIR).filter((f) => f.endsWith(".html") && f !== "index.html");
const rows = files.map((f) => {
  const html = readFileSync(join(DIR, f), "utf8");
  const m = html.match(/<article[^>]*\bdata-entity="regle"[^>]*>/);
  const id = (m && attr(m[0], "data-id")) || f.replace(/\.html$/, "");
  const status = (m && attr(m[0], "data-status")) || "source";
  const name = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, f])[1].replace(/<[^>]+>/g, "").trim();
  return { id, file: f, name, status };
}).sort((a, b) => a.name.localeCompare(b.name, "fr"));

const body = rows.map((r) => {
  const badge = r.status === "manquant"
    ? '<span class="badge" data-status="manquant">Manquant</span>'
    : '<span class="badge" data-status="source">Source</span>';
  const attr2 = r.status === "manquant" ? ' data-status="manquant"' : "";
  return `            <tr data-id="${r.id}"${attr2}><td><span class="name"><a href="${r.file}" data-ref="${r.id}">${esc(r.name)}</a></span></td><td>${badge}</td></tr>`;
}).join("\n");

const page = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Regles — Index</title>
  <link rel="stylesheet" href="../assets/ds.css">
</head>
<body data-root=".." data-breadcrumb="Accueil|/index.html; Regles">
  <main>
    <article class="sheet" data-entity="regle" data-id="regles-index">
      <h1>Regles</h1>
      <p class="note">Regles du jeu, creation de personnage et protocole (D&amp;D 2024). ${rows.length} pages. Index genere par <code>docs/_analysis/build-regles-index.mjs</code> — ne pas editer a la main.</p>
      <table class="entity-table">
        <thead><tr><th>Page</th><th>Statut</th></tr></thead>
        <tbody>
${body}
        </tbody>
      </table>
    </article>
  </main>
  <script src="../assets/ds.js" defer></script>
</body>
</html>
`;
writeFileSync(join(DIR, "index.html"), page, "utf8");
console.log(`regles/index.html regenere : ${rows.length} pages.`);
