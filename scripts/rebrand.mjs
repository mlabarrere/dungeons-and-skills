#!/usr/bin/env node
/* rebrand.mjs — one-shot: rename the docs/html assets grimoire.* -> ds.* and rebrand every
   visible "Grimoire" occurrence to "Dungeons & Skills" across the HTML base, the docs .md and
   the Next.js UI strings. Idempotent-ish (safe to re-run). The localStorage key in
   src/lib/store.ts is intentionally NOT touched (renaming it would drop saved characters).
   Usage: node scripts/rebrand.mjs */
import { readdirSync, statSync, readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = join(ROOT, "docs", "html", "assets");

// 1. Rename the asset files (if still on the old names).
for (const [from, to] of [["grimoire.css", "ds.css"], ["grimoire.js", "ds.js"], ["grimoire.print.css", "ds.print.css"]]) {
  const a = join(ASSETS, from), b = join(ASSETS, to);
  if (existsSync(a)) { renameSync(a, b); console.log(`renamed assets/${from} -> assets/${to}`); }
}

// 2. Collect files to rewrite: all .html/.md under docs/html, a few extra md, fr.json, the renamed assets.
function walk(dir, exts, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e); const s = statSync(p);
    if (s.isDirectory()) walk(p, exts, out);
    else if (exts.includes(extname(p))) out.push(p);
  }
  return out;
}
const files = [
  ...walk(join(ROOT, "docs", "html"), [".html", ".md", ".css", ".js"]),
  join(ROOT, "docs", "_analysis", "couverture.md"),
  join(ROOT, "src", "i18n", "messages", "fr.json"),
].filter(existsSync);

// 3. Replacement rules, applied in order (asset refs first, then brand text).
const RULES = [
  [/grimoire\.print\.css/g, "ds.print.css"],
  [/grimoire\.css/g, "ds.css"],
  [/grimoire\.js/g, "ds.js"],
  [/Grimoire\s*D&amp;D/g, "Dungeons &amp; Skills"],
  [/Grimoire\s*D&D/g, "Dungeons & Skills"],
  [/grimoire/gi, "Dungeons & Skills"], // remaining brand text + comments (no functional ids here)
];

let changed = 0, hits = 0;
for (const f of files) {
  let txt = readFileSync(f, "utf8"), before = txt;
  for (const [re, rep] of RULES) txt = txt.replace(re, (m) => { hits++; return rep; });
  if (txt !== before) { writeFileSync(f, txt, "utf8"); changed++; }
}
console.log(`rebrand: ${changed} files updated, ${hits} replacements. Assets are now ds.*.`);
