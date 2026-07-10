/* ==========================================================================
   build-catalog-refs.mjs — genere docs/data/{languages,conditions,glossary}.json
   depuis docs/html/regles/{langues,glossaire}.html. Deterministe.
   ========================================================================== */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REGLES = join(HERE, "..", "html", "regles");
const OUT = join(HERE, "..", "data");
mkdirSync(OUT, { recursive: true });
const strip = (s) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&mdash;/g, "-").trim();

/* ---- langues ---- */
const lang = readFileSync(join(REGLES, "langues.html"), "utf8");
const tables = [...lang.matchAll(/<table>([\s\S]*?)<\/table>/g)].map((m) => m[1]);
function rows(tbodyHtml) {
  return [...tbodyHtml.matchAll(/<tr>([\s\S]*?)<\/tr>/g)]
    .map((r) => [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => strip(c[1])))
    .filter((cells) => cells.length);
}
const courantes = rows(tables[0] || "").map(([die, name, origin]) => ({ die, name, origin, rarity: "courante" }));
const rares = rows(tables[1] || "").map(([name, origin]) => ({ name, origin, rarity: "rare" }));
writeFileSync(join(OUT, "languages.json"), JSON.stringify({ courantes, rares, ref: "../regles/langues.html" }, null, 1), "utf8");

/* ---- glossaire + conditions ---- */
const ETATS = new Set(["a-terre", "agrippe", "assourdi", "aveugle", "charme", "effraye", "empoisonne",
  "entrave", "epuisement", "etourdi", "inconscient", "invisible", "neutralise", "paralyse", "petrifie"]);
const glo = readFileSync(join(REGLES, "glossaire.html"), "utf8");
const terms = [...glo.matchAll(/<h([23])[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g)]
  .map((m) => ({ id: m[2], label: strip(m[3]), ref: `../regles/glossaire.html#${m[2]}` }))
  .filter((t) => t.label);
const conditions = terms.filter((t) => ETATS.has(t.id));
writeFileSync(join(OUT, "glossary.json"), JSON.stringify(terms, null, 1), "utf8");
writeFileSync(join(OUT, "conditions.json"), JSON.stringify(conditions, null, 1), "utf8");

console.log(`languages.json : ${courantes.length} courantes, ${rares.length} rares.`);
console.log(`glossary.json : ${terms.length} termes ; conditions.json : ${conditions.length} etats.`);
