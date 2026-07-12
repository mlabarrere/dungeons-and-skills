#!/usr/bin/env node
/* html-lint.mjs — deterministic consistency + link checker for the docs/html base.
   Encodes the canonical format of CONVENTIONS.md / styleguide.html and fails (exit 1) on:
   format deviations, out-of-enum data-status/data-entity, dead internal links + anchors,
   broken breadcrumb targets, missing/incomplete section indexes, and orphan pages.
   Zero dependencies. Usage: node docs/_engine/html-lint.mjs [--quiet]
   Guarantees the base stays coherent / standardised / fully linked (run in CI). */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, resolve } from "node:path";

const HTML = join(dirname(fileURLToPath(import.meta.url)), "..", "html");
const rel = (p) => relative(HTML, p).replace(/\\/g, "/");

const STATUS = new Set(["fourni", "source", "calcule", "deduit", "recommande", "arbitrer", "manquant", "incoherent", "conflit"]);
const ENTITY = new Set(["classe", "sous-classe", "espece", "lignage", "historique", "don", "objet", "equipement", "sort", "creature", "personnage", "regle"]);
// Special pages exempt from entity-page format rules (by rel path).
const SPECIAL = new Set(["index.html", "styleguide.html", "builder.html", "sorts/_TEMPLATE.html"]);
const NO_DSJS = new Set(["builder.html"]);            // legitimately no ds.js
const ORPHAN_OK = new Set(["builder.html", "sorts/_TEMPLATE.html"]); // reachable via JS/docs, or a template

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { if (e !== "assets") walk(p, out); }
    else if (e.endsWith(".html")) out.push(p);
  }
  return out;
}
const files = walk(HTML);
const text = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));
const idsOf = (t) => new Set([...t.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
const attr = (t, re) => { const m = t.match(re); return m ? m[1] : null; };

const errors = [];
const err = (cat, file, msg) => errors.push({ cat, file: rel(file), msg });
const isIndex = (f) => rel(f).endsWith("/index.html") || rel(f) === "index.html";
const isSpecial = (f) => SPECIAL.has(rel(f));
const isEntity = (f) => !isIndex(f) && !isSpecial(f);

/* ---- per-file format + enums ---- */
for (const f of files) {
  const t = text.get(f), r = rel(f);
  if (!/<!doctype html>/i.test(t)) err("format", f, "missing <!doctype html>");
  if (!/<html lang="fr">/i.test(t)) err("format", f, 'missing <html lang="fr">');
  if (!/<meta charset="utf-8">/i.test(t)) err("format", f, "missing meta charset");
  if (!/<meta name="viewport"/i.test(t)) err("format", f, "missing meta viewport");
  if (!/<title>[^<]+<\/title>/i.test(t)) err("format", f, "missing <title>");
  const sheets = [...t.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/gi)];
  if (sheets.length !== 1) err("format", f, `expected exactly 1 stylesheet, found ${sheets.length}`);
  else if (!/href="[^"]*assets\/ds\.css"/.test(sheets[0][0])) err("format", f, "stylesheet is not assets/ds.css");
  if (!NO_DSJS.has(r) && !/<script[^>]+assets\/ds\.js"[^>]*\bdefer\b/.test(t)) err("format", f, "missing <script assets/ds.js defer>");
  if (!/<body[^>]*\bdata-root=/.test(t)) err("format", f, "body missing data-root");
  if (!isSpecial(f) && !/<body[^>]*\bdata-breadcrumb=/.test(t)) err("format", f, "body missing data-breadcrumb");

  // enums
  for (const m of t.matchAll(/data-status="([^"]+)"/g)) if (!STATUS.has(m[1])) err("enum", f, `data-status="${m[1]}" not in enum`);
  for (const m of t.matchAll(/data-entity="([^"]+)"/g)) if (!ENTITY.has(m[1])) err("enum", f, `data-entity="${m[1]}" not in enum`);

  // entity pages: title separator + data-entity/data-id present
  if (isEntity(f)) {
    const title = attr(t, /<title>([^<]*)<\/title>/i) || "";
    if (!title.includes(" — ")) err("title", f, `title lacks " — " separator: "${title}"`);
    if (!/data-entity="/.test(t)) err("format", f, "missing data-entity");
    if (!/data-id="/.test(t)) err("format", f, "missing data-id");
  }
}

/* ---- links + anchors + breadcrumbs ---- */
const linkGraph = new Map(); // file -> Set(targetFile) for reachability
for (const f of files) {
  const t = text.get(f), out = new Set();
  for (const m of t.matchAll(/href="([^"]+)"/g)) {
    let href = m[1];
    if (/^(https?:|mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    let anchor = null; const h = href.indexOf("#");
    if (h >= 0) { anchor = href.slice(h + 1); href = href.slice(0, h); }
    if (!href) { if (anchor && !idsOf(t).has(anchor)) err("anchor", f, `#${anchor} not found in page`); continue; }
    const target = resolve(dirname(f), href);
    if (!existsSync(target)) { err("link", f, `dead link → ${href}`); continue; }
    if (href.endsWith(".html")) out.add(target);
    if (anchor && href.endsWith(".html") && text.has(target) && !idsOf(text.get(target)).has(anchor)) err("anchor", f, `${href}#${anchor} → id absent`);
  }
  // breadcrumb targets (resolved against data-root)
  const root = attr(t, /data-root="([^"]*)"/); const bc = attr(t, /data-breadcrumb="([^"]*)"/);
  if (root != null && bc) for (const seg of bc.split(";")) {
    const parts = seg.split("|"); const bh = (parts[1] || "").trim();
    if (bh.startsWith("/")) { const target = resolve(dirname(f), root, "." + bh); if (!existsSync(target)) err("breadcrumb", f, `crumb → ${bh}`); else out.add(target); }
  }
  linkGraph.set(f, out);
}

/* ---- section index coverage ---- */
const sections = [...new Set(files.filter((f) => rel(f).includes("/")).map((f) => rel(f).split("/")[0]))];
for (const sec of sections) {
  const entries = files.filter((f) => rel(f).startsWith(sec + "/") && !rel(f).endsWith("/index.html") && !rel(f).endsWith("/_TEMPLATE.html"));
  if (!entries.length) continue;
  const idx = join(HTML, sec, "index.html");
  if (!existsSync(idx)) { err("index", join(HTML, sec), `section "${sec}" has ${entries.length} pages but no index.html`); continue; }
  const it = text.get(idx);
  for (const e of entries) { const name = rel(e).split("/").pop(); if (!it.includes(name)) err("index", idx, `index misses entry ${name}`); }
}

/* ---- orphans (reachable from root index.html) ---- */
const root = join(HTML, "index.html");
const seen = new Set([root]); const stack = [root];
while (stack.length) { const cur = stack.pop(); for (const nx of (linkGraph.get(cur) || [])) if (!seen.has(nx)) { seen.add(nx); stack.push(nx); } }
for (const f of files) if (!seen.has(f) && !ORPHAN_OK.has(rel(f))) err("orphan", f, "not reachable from index.html (links/breadcrumbs)");

/* ---- report ---- */
const quiet = process.argv.includes("--quiet");
const byCat = {};
for (const e of errors) (byCat[e.cat] ||= []).push(e);
console.log(`html-lint: ${files.length} pages checked, ${errors.length} problem(s).`);
for (const [cat, list] of Object.entries(byCat).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  [${cat}] ${list.length}`);
  if (!quiet) for (const e of list.slice(0, 8)) console.log(`     ${e.file}: ${e.msg}`);
  if (!quiet && list.length > 8) console.log(`     … +${list.length - 8} more`);
}
process.exit(errors.length ? 1 : 0);
