/* Regenere le <tbody> de docs/html/sorts/index.html a partir des pages sorts/*.html.
   Usage : node docs/_analysis/build-sorts-index.mjs
   Ne touche que la zone entre <!-- SORTS:START --> et <!-- SORTS:END -->. */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SORTS = "C:/Users/mickael.labarrere/OneDrive - Accenture/Personal/DnD/docs/html/sorts";
const INDEX = join(SORTS, "index.html");

function attr(tag, name) {
  const m = tag.match(new RegExp(name + '\\s*=\\s*"([^"]*)"'));
  return m ? m[1] : "";
}
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const files = readdirSync(SORTS)
  .filter((f) => f.endsWith(".html") && f !== "index.html" && f !== "_TEMPLATE.html");

const spells = [];
for (const f of files) {
  const html = readFileSync(join(SORTS, f), "utf8");
  const artM = html.match(/<article[^>]*\bdata-entity="sort"[^>]*>/);
  if (!artM) continue;
  const tag = artM[0];
  const h1M = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const name = h1M ? h1M[1].replace(/<[^>]+>/g, "").trim() : f.replace(/\.html$/, "");
  spells.push({
    id: attr(tag, "data-id") || f.replace(/\.html$/, ""),
    file: f,
    name,
    status: attr(tag, "data-status") || "source",
    level: attr(tag, "data-spell-level"),
    school: attr(tag, "data-school"),
    casting: attr(tag, "data-casting-time"),
    ritual: attr(tag, "data-ritual") || "false",
    conc: attr(tag, "data-concentration") || "false",
    classes: attr(tag, "data-classes"),
  });
}

spells.sort((a, b) => a.name.localeCompare(b.name, "fr"));

const rows = spells.map((s) => {
  const lvl = s.level === "0" ? "Mineur" : s.level ? "Niv. " + s.level : "—";
  const school = s.school ? s.school.charAt(0).toUpperCase() + s.school.slice(1) : "—";
  const classes = s.classes ? s.classes.split(",").map((c) => c.trim()).join(", ") : "—";
  const conc = s.conc === "true" ? "Oui" : "—";
  const rit = s.ritual === "true" ? "Oui" : "—";
  const badge = s.status === "manquant"
    ? '<span class="badge" data-status="manquant">Stub</span>'
    : '<span class="badge" data-status="source">Source</span>';
  return `            <tr data-id="${s.id}" data-name="${esc(s.name)}" data-level="${s.level}" data-school="${s.school}" data-casting="${s.casting}" data-classes="${s.classes}" data-ritual="${s.ritual}" data-concentration="${s.conc}">`
    + `<td><span class="name"><a href="${s.file}" data-ref="${s.id}">${esc(s.name)}</a></span></td>`
    + `<td>${lvl}</td><td>${school}</td><td>${esc(classes)}</td><td>${conc}</td><td>${rit}</td><td>${badge}</td></tr>`;
}).join("\n");

let idx = readFileSync(INDEX, "utf8");
const START = "<!-- SORTS:START -->";
const END = "<!-- SORTS:END -->";
const re = new RegExp(START + "[\\s\\S]*?" + END);
if (!re.test(idx)) {
  console.error("Marqueurs SORTS:START/END absents de index.html");
  process.exit(1);
}
idx = idx.replace(re, START + "\n" + rows + "\n            " + END);
writeFileSync(INDEX, idx, "utf8");
console.log(`Index regenere : ${spells.length} sorts (${spells.filter(s => s.status === "manquant").length} stubs).`);
