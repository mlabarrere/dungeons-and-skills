/* Regenere docs/html/creatures/index.html a partir des pages creatures/*.html.
   Usage : node docs/_analysis/build-creatures-index.mjs */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "C:/Users/mickael.labarrere/OneDrive - Accenture/Personal/DnD/docs/html/creatures";
function attr(t, n) { const m = t.match(new RegExp(n + '\\s*=\\s*"([^"]*)"')); return m ? m[1] : ""; }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

const files = readdirSync(DIR).filter((f) => f.endsWith(".html") && f !== "index.html");
const rows = files.map((f) => {
  const html = readFileSync(join(DIR, f), "utf8");
  const m = html.match(/<article[^>]*\bdata-entity="creature"[^>]*>/);
  const id = m ? attr(m[0], "data-id") : f.replace(/\.html$/, "");
  const name = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, f])[1].replace(/<[^>]+>/g, "").trim();
  return { id, file: f, name };
}).sort((a, b) => a.name.localeCompare(b.name, "fr"));

const body = rows.map((r) => `            <tr data-id="${r.id}" data-name="${esc(r.name)}"><td><span class="name"><a href="${r.file}" data-ref="${r.id}">${esc(r.name)}</a></span></td></tr>`).join("\n");

const page = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Creatures — Index (Annexe B)</title>
  <link rel="stylesheet" href="../assets/grimoire.css">
</head>
<body data-root=".." data-breadcrumb="Accueil|/index.html; Creatures">
  <main>
    <article class="sheet" data-entity="regle" data-id="creatures-index">
      <h1>Profils de creature (Annexe B)</h1>
      <p class="note">Betes et creatures invocables/familiers (Forme sauvage, invocations, Compagnon). ${rows.length} profils. Index genere par <code>docs/_analysis/build-creatures-index.mjs</code> — ne pas editer a la main.</p>
      <table class="entity-table">
        <thead><tr><th>Creature</th></tr></thead>
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
console.log(`creatures/index.html regenere : ${rows.length} creatures.`);
