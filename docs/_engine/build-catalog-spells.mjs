/* ==========================================================================
   build-catalog-spells.mjs — genere docs/data/spells.json depuis les data-*
   des pages docs/html/sorts/*.html (deja richement types). Deterministe.
   Usage : node docs/_engine/build-catalog-spells.mjs
   ========================================================================== */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const SORTS = join(HERE, "..", "html", "sorts");
const OUT = join(HERE, "..", "data");
mkdirSync(OUT, { recursive: true });

const attr = (t, n) => { const m = t.match(new RegExp(n + '\\s*=\\s*"([^"]*)"')); return m ? m[1] : null; };

const files = readdirSync(SORTS).filter((f) => f.endsWith(".html") && f !== "index.html" && f !== "_TEMPLATE.html");
const spells = [];
for (const f of files) {
  const html = readFileSync(join(SORTS, f), "utf8");
  const m = html.match(/<article[^>]*\bdata-entity="sort"[^>]*>/);
  if (!m) continue;
  const t = m[0];
  const name = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, f])[1].replace(/<[^>]+>/g, "").trim();
  const id = attr(t, "data-id") || f.replace(/\.html$/, "");
  const classes = (attr(t, "data-classes") || "").split(",").map((s) => s.trim()).filter(Boolean);
  const comps = (attr(t, "data-components") || "").split(",").map((s) => s.trim()).filter(Boolean);
  spells.push({
    id, name, ref: `../sorts/${f}`, status: attr(t, "data-status") || "source",
    level: attr(t, "data-spell-level") == null ? null : Number(attr(t, "data-spell-level")),
    school: attr(t, "data-school"),
    castingTime: attr(t, "data-casting-time"),
    ritual: attr(t, "data-ritual") === "true",
    concentration: attr(t, "data-concentration") === "true",
    range: attr(t, "data-range"),
    components: comps,
    material: attr(t, "data-material") || null,
    duration: attr(t, "data-duration"),
    classes,
    save: attr(t, "data-save") || null,
    damageType: attr(t, "data-damage-type") || null,
    source: attr(t, "data-source") || null,
  });
}
spells.sort((a, b) => a.name.localeCompare(b.name, "fr"));

// index d'appartenance : liste de sorts par classe et par niveau (pour le resolver)
const byClass = {};
for (const s of spells) for (const c of s.classes) {
  (byClass[c] = byClass[c] || []).push({ id: s.id, level: s.level });
}

writeFileSync(join(OUT, "spells.json"), JSON.stringify(spells, null, 1), "utf8");
writeFileSync(join(OUT, "spells-by-class.json"), JSON.stringify(byClass, null, 1), "utf8");
console.log(`spells.json : ${spells.length} sorts.`);
console.log(`spells-by-class.json : ${Object.keys(byClass).length} listes (${Object.entries(byClass).map(([c, a]) => c + ":" + a.length).join(", ")}).`);
