/* Valide les pages de sorts : presence et valeurs d'enum des data-*.
   Usage : node docs/_analysis/spellcheck.mjs */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SORTS = "C:/Users/mickael.labarrere/OneDrive - Accenture/Personal/DnD/docs/html/sorts";

const SCHOOLS = ["abjuration", "invocation", "divination", "enchantement", "evocation", "illusion", "necromancie", "transmutation"];
const CASTING = ["action", "action-bonus", "reaction", "1min", "10min", "1h", "8h", "12h", "24h"];
const BOOL = ["true", "false"];
const SAVE = ["for", "dex", "con", "int", "sag", "cha", "-", ""];

function attr(tag, name) {
  const m = tag.match(new RegExp(name + '\\s*=\\s*"([^"]*)"'));
  return m ? m[1] : null;
}

const files = readdirSync(SORTS).filter((f) => f.endsWith(".html") && f !== "index.html" && f !== "_TEMPLATE.html");
let problems = 0, ok = 0, stubs = 0;

for (const f of files) {
  const html = readFileSync(join(SORTS, f), "utf8");
  const artM = html.match(/<article[^>]*\bdata-entity="sort"[^>]*>/);
  const errs = [];
  if (!artM) { console.log(`  ERR ${f}: pas d'<article data-entity="sort">`); problems++; continue; }
  const tag = artM[0];
  const status = attr(tag, "data-status");

  if (!attr(tag, "data-id")) errs.push("data-id manquant");
  if (status === "manquant") {
    stubs++;
  } else {
    const lvl = attr(tag, "data-spell-level");
    if (!/^[0-9]$/.test(lvl || "")) errs.push(`data-spell-level invalide (${lvl})`);
    const sch = attr(tag, "data-school");
    if (!SCHOOLS.includes(sch)) errs.push(`data-school invalide (${sch})`);
    const ct = attr(tag, "data-casting-time");
    if (!CASTING.includes(ct)) errs.push(`data-casting-time invalide (${ct})`);
    if (!BOOL.includes(attr(tag, "data-ritual"))) errs.push("data-ritual doit etre true/false");
    if (!BOOL.includes(attr(tag, "data-concentration"))) errs.push("data-concentration doit etre true/false");
    if (!attr(tag, "data-range")) errs.push("data-range manquant");
    const comp = attr(tag, "data-components");
    if (comp === null) errs.push("data-components manquant");
    else if (!comp.split(",").every((c) => ["V", "S", "M"].includes(c.trim()))) errs.push(`data-components hors {V,S,M} (${comp})`);
    if (!attr(tag, "data-duration")) errs.push("data-duration manquant");
    if (!attr(tag, "data-classes")) errs.push("data-classes manquant");
    const save = attr(tag, "data-save");
    if (save !== null && !SAVE.includes(save)) errs.push(`data-save invalide (${save})`);
    const conc = attr(tag, "data-concentration");
    const dur = attr(tag, "data-duration") || "";
    if (dur.startsWith("conc-") && conc !== "true") errs.push("duree conc-* mais data-concentration=false");
  }

  if (errs.length) { problems++; console.log(`  ERR ${f}:\n    - ${errs.join("\n    - ")}`); }
  else ok++;
}

console.log(`\nSorts valides : ${ok} | stubs : ${stubs} | en erreur : ${problems} | total : ${files.length}`);
process.exit(problems ? 1 : 0);
