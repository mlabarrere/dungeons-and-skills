/* ==========================================================================
   autolink.mjs — maillage type Wikipedia (liens sortants inter-fiches)
   --------------------------------------------------------------------------
   Passe idempotente sur docs/html/**.html. Construit un registre de toutes les
   entites (data-id + titre h1) + termes du glossaire (ancres), puis insere des
   liens <a data-ref> sur la PREMIERE occurrence de chaque entite citee dans le
   texte d'une page (style Wikipedia).

   Surete :
   - liens uniquement dans le TEXTE (jamais dans les balises, <a>, <h1..h3>, <th>,
     <code>, <script>, <style>, <title>, <head>) ;
   - pas de self-link ; premiere occurrence par cible par page ; idempotent
     (ne relie pas si un data-ref vers la cible existe deja sur la page) ;
   - anti-bruit : sorts d'un seul mot NON auto-lies (ambigus) ; entites nom-propre
     (classe/espece/lignage/historique/don/creature/sous-classe) liees meme en un mot ;
     etats du glossaire toujours lies ; stoplist de concepts trop frequents.
   Le contenu de la base est SANS accents -> matching direct, insensible a la casse.
   Usage : node docs/_engine/autolink.mjs        (applique)
           node docs/_engine/autolink.mjs --dry   (rapport seul)
   ========================================================================== */
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";

const ROOT = "C:/Users/mickael.labarrere/OneDrive - Accenture/Personal/DnD/docs/html";
const DRY = process.argv.includes("--dry");

function walk(d) {
  let o = [];
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    const s = statSync(p);
    if (s.isDirectory()) { if (e === "assets") continue; o = o.concat(walk(p)); }
    else if (e.endsWith(".html") && e !== "_TEMPLATE.html") o.push(p);
  }
  return o;
}
const files = walk(ROOT);
const attr = (t, n) => { const m = t.match(new RegExp(n + '\\s*=\\s*"([^"]*)"')); return m ? m[1] : null; };
const relHref = (fromFile, absTargetUrl) => {
  // absTargetUrl like "/sorts/foo.html#x" -> relative from fromFile dir
  const [path, frag] = absTargetUrl.split("#");
  const fromDir = dirname(fromFile);
  let r = relative(fromDir, join(ROOT, "." + path)).replace(/\\/g, "/");
  if (!r.startsWith(".")) r = "./" + r;
  return r + (frag ? "#" + frag : "");
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const NOMPROPRE = new Set(["classe", "sous-classe", "espece", "lignage", "historique", "don", "creature"]);
// concepts trop frequents a NE PAS auto-lier (bruit)
const STOP = new Set(["action", "cible", "creature", "objet", "magie", "sort", "sorts", "portee", "duree",
  "zone", "attaque", "degats", "resistance", "immunite", "vulnerabilite", "avantage", "desavantage",
  "test", "arme", "armure", "allie", "ennemi", "niveau", "reaction", "maitrise", "vitesse", "soins"]);

/* ---- Pass 1 : registre --------------------------------------------------- */
const registry = []; // {id, term(normalized), href, file, entity}
const glossaryAnchors = []; // {term, href}
for (const f of files) {
  const html = readFileSync(f, "utf8");
  const art = html.match(/<article[^>]*>/);
  const id = art ? attr(art[0], "data-id") : null;
  const entity = art ? attr(art[0], "data-entity") : null;
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, ""])[1].replace(/<[^>]+>/g, "").trim();
  const relf = relative(ROOT, f).replace(/\\/g, "/");
  if (id && entity && entity !== "regle" && h1) {
    const term = h1.toLowerCase().replace(/\s+/g, " ").trim();
    registry.push({ id, term, href: "/" + relf, file: f, entity });
  }
  // glossaire : ancres d'etats/concepts
  if (relf === "regles/glossaire.html") {
    for (const m of html.matchAll(/<h[23][^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h[23]>/g)) {
      const anchorId = m[1];
      const label = m[2].replace(/<[^>]+>/g, "").replace(/\[[^\]]*\]/g, "").trim();
      if (label) glossaryAnchors.push({ id: anchorId, term: label.toLowerCase().trim(), href: "/regles/glossaire.html#" + anchorId });
    }
  }
}

/* ---- Termes eligibles ---------------------------------------------------- */
const terms = []; // {term, href, id, kind}
for (const r of registry) {
  const words = r.term.split(" ").filter(Boolean);
  if (r.term.length < 4) continue;
  if (r.entity === "sort" && words.length < 2) continue;          // sorts 1 mot : ambigus -> skip
  if (words.length === 1 && STOP.has(r.term)) continue;
  terms.push({ term: r.term, href: r.href, id: r.id, kind: r.entity });
}
const ETATS = new Set(["a terre", "agrippe", "assourdi", "aveugle", "charme", "effraye", "empoisonne",
  "entrave", "epuisement", "etourdi", "inconscient", "invisible", "neutralise", "paralyse", "petrifie"]);
for (const g of glossaryAnchors) {
  const words = g.term.split(" ").filter(Boolean);
  if (ETATS.has(g.term) || words.length >= 2) {
    if (g.term.length >= 4 && !(words.length === 1 && STOP.has(g.term)))
      terms.push({ term: g.term, href: g.href, id: g.id, kind: "concept" });
  }
}
// dedup par term (garde la 1re), tri longueur desc
const seen = new Set();
const uniqTerms = [];
for (const t of terms.sort((a, b) => b.term.length - a.term.length)) {
  if (seen.has(t.term)) continue; seen.add(t.term); uniqTerms.push(t);
}
const combined = new RegExp("\\b(" + uniqTerms.map((t) => esc(t.term)).join("|") + ")\\b", "gi");
const byTerm = new Map(uniqTerms.map((t) => [t.term, t]));

/* ---- Pass 2 : insertion des liens --------------------------------------- */
const SKIP_TAGS = new Set(["a", "h1", "h2", "h3", "th", "code", "script", "style", "title", "button"]);
let totalLinks = 0, changedFiles = 0;

for (const f of files) {
  let html = readFileSync(f, "utf8");
  const relf = relative(ROOT, f).replace(/\\/g, "/");
  const selfId = (html.match(/<article[^>]*>/) || [""])[0].match(/data-id="([^"]*)"/)?.[1] || null;
  const linked = new Set(); // termes deja lies sur cette page
  for (const m of html.matchAll(/data-ref="([^"]*)"/g)) linked.add(m[1]); // idempotence par id cible

  // tokenise en balises / texte
  const parts = html.split(/(<[^>]+>)/);
  const skipStack = [];
  let inBody = false;
  let added = 0;

  for (let i = 0; i < parts.length; i++) {
    const tok = parts[i];
    if (tok.startsWith("<")) {
      const tm = tok.match(/^<\s*(\/?)\s*([a-zA-Z0-9]+)/);
      if (tm) {
        const closing = tm[1] === "/";
        const name = tm[2].toLowerCase();
        if (name === "body") inBody = !closing ? true : inBody;
        const selfClose = /\/>\s*$/.test(tok) || name === "br" || name === "img" || name === "meta" || name === "link" || name === "input";
        if (SKIP_TAGS.has(name) && !selfClose) {
          if (!closing) skipStack.push(name);
          else { const idx = skipStack.lastIndexOf(name); if (idx >= 0) skipStack.splice(idx, 1); }
        }
      }
      continue;
    }
    if (!inBody || skipStack.length || !tok.trim()) continue;
    // texte lie-able
    parts[i] = tok.replace(combined, (match) => {
      const key = match.toLowerCase();
      const t = byTerm.get(key);
      if (!t) return match;
      if (t.id === selfId) return match;         // pas de self-link
      if (linked.has(t.id)) return match;        // deja lie sur la page (1re occ.)
      linked.add(t.id);
      added++;
      const href = relHref(f, t.href);
      return `<a href="${href}" data-ref="${t.id}">${match}</a>`;
    });
  }

  if (added > 0) {
    totalLinks += added; changedFiles++;
    if (!DRY) writeFileSync(f, parts.join(""), "utf8");
  }
}

console.log(`${DRY ? "[DRY] " : ""}Registre : ${uniqTerms.length} termes (${registry.length} entites + ${glossaryAnchors.length} ancres glossaire).`);
console.log(`Liens ajoutes : ${totalLinks} sur ${changedFiles} fichiers (/${files.length}).`);
