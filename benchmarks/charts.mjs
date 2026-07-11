#!/usr/bin/env node
/* charts.mjs — render SVG charts from a runs.<id>.json into assets/. Self-contained light
   cards (readable on light & dark GitHub themes) with value labels and bootstrap-CI whiskers,
   so precision never rests on colour alone. Grouped bars when several conditions are present
   (the ablation). Only real backends (replay/live) should feed README charts.
   Usage: node benchmarks/charts.mjs --in results/runs.<id>.json [--conditions bare,skill-engine] [--prefix bench] */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { aggregate } from "./scoring.mjs";
import { bootstrapCI } from "./stats.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RES = join(ROOT, "benchmarks", "results");
const ASSETS = join(ROOT, "assets");
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

const inPath = arg("in") ? join(ROOT, arg("in")) : join(RES, readdirSync(RES).filter((f) => f.startsWith("runs.") && f.endsWith(".json")).sort().pop());
const data = JSON.parse(readFileSync(inPath, "utf8"));
const prefix = arg("prefix", "bench");
const seed = data.meta?.seed || 1;
const ok = data.runs.filter((r) => r.status === "ok");
const models = [...new Set(ok.map((r) => r.model))].sort();
const CONDS = (arg("conditions") ? arg("conditions").split(",") : [...new Set(ok.map((r) => r.condition))]);
const COLOR = { "bare": "#E8833B", "grounding-only": "#C99A2E", "skill-only": "#5B8C51", "skill-engine": "#2F6FB0", "full-project": "#7A5195" };
mkdirSync(ASSETS, { recursive: true });

const cell = (model, cond) => {
  const rows = ok.filter((r) => r.model === model && r.condition === cond);
  if (!rows.length) return null;
  const rates = rows.map((r) => r.metrics.atomic_error_rate);
  const ci = bootstrapCI(rates, { seed });
  return { mean: aggregate(rows.map((r) => r.metrics)).mean_atomic_error_rate, lo: ci.lo, hi: ci.hi, n: rates.length };
};

/* --- chart 1: grouped atomic error rate (model × condition) with CI whiskers --- */
const W = 760, H = 400, x0 = 66, x1 = 724, yTop = 104, yBot = 320;
let maxV = 5;
for (const m of models) for (const c of CONDS) { const d = cell(m, c); if (d) maxV = Math.max(maxV, d.hi || d.mean); }
maxV *= 1.15;
const sy = (v) => yBot - (yBot - yTop) * (v / maxV);
const groupW = (x1 - x0) / models.length, bw = Math.min(60, (groupW - 20) / CONDS.length);
let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" role="img" aria-label="Atomic error rate per model and condition, with 95% confidence intervals.">
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" fill="#ffffff" stroke="#e7e5e4"/>
<text x="34" y="40" font-size="21" font-weight="700" fill="#292524">D&amp;D 2024 build errors — with vs without the skill</text>
<text x="34" y="64" font-size="13" fill="#78716c">Atomic error rate (% of verifiable units wrong, lower is better) · 95% bootstrap CI · ${esc(data.meta?.backend)} · real models</text>`;
// legend
let lx = 34;
for (const c of CONDS) { s += `<rect x="${lx}" y="78" width="12" height="12" rx="3" fill="${COLOR[c] || "#999"}"/><text x="${lx + 17}" y="88" font-size="12" fill="#57534e">${esc(c)}</text>`; lx += 30 + esc(c).length * 7.2; }
for (let g = 0; g <= 4; g++) { const v = (maxV / 4) * g, y = sy(v); s += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="#ece9e6"/><text x="${x0 - 8}" y="${y + 4}" font-size="12" fill="#a8a29e" text-anchor="end">${v.toFixed(0)}%</text>`; }
models.forEach((m, mi) => {
  const gx = x0 + mi * groupW + groupW / 2;
  const totalW = CONDS.length * bw + (CONDS.length - 1) * 8;
  CONDS.forEach((c, ci) => {
    const d = cell(m, c); if (!d) return;
    const bx = gx - totalW / 2 + ci * (bw + 8), y = sy(d.mean);
    s += `<rect x="${bx}" y="${y}" width="${bw}" height="${yBot - y}" rx="4" fill="${COLOR[c] || "#999"}"/>`;
    if (d.n > 1 && d.hi > d.lo) { const cx = bx + bw / 2; s += `<line x1="${cx}" y1="${sy(d.lo)}" x2="${cx}" y2="${sy(d.hi)}" stroke="#44403c" stroke-width="1.5"/><line x1="${cx - 6}" y1="${sy(d.hi)}" x2="${cx + 6}" y2="${sy(d.hi)}" stroke="#44403c" stroke-width="1.5"/>`; }
    s += `<text x="${bx + bw / 2}" y="${y - 7}" font-size="12.5" font-weight="700" fill="#44403c" text-anchor="middle">${d.mean.toFixed(1)}%</text>`;
  });
  s += `<text x="${gx}" y="${yBot + 22}" font-size="14" fill="#292524" text-anchor="middle">${esc(m)}</text>`;
  const d0 = cell(m, CONDS[0]); s += `<text x="${gx}" y="${yBot + 40}" font-size="11" fill="#a8a29e" text-anchor="middle">n=${d0 ? d0.n : 0}/condition</text>`;
});
s += `<text x="34" y="${H - 12}" font-size="11.5" fill="#a8a29e">bare = model from memory; skill-engine = model reads the skill and runs the engine. Exploratory pilot (dnd-build, 5 characters).</text></svg>`;
writeFileSync(join(ASSETS, `${prefix}-errors.svg`), s + "\n", "utf8");

/* --- chart 2: taxonomy for the first condition (bare) --- */
const baseCond = CONDS[0];
const cat = {};
for (const r of ok.filter((r) => r.condition === baseCond)) for (const e of (r.errors || [])) cat[e.category] = (cat[e.category] || 0) + 1;
const items = Object.entries(cat).sort((a, b) => b[1] - a[1]);
const maxC = Math.max(1, ...items.map((i) => i[1]));
const rowH = 30, top = 92, H2 = top + items.length * rowH + 30;
let s2 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 ${H2}" font-family="-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" role="img" aria-label="Error taxonomy for the ${baseCond} condition.">
<rect x="0.5" y="0.5" width="759" height="${H2 - 1}" rx="16" fill="#ffffff" stroke="#e7e5e4"/>
<text x="34" y="42" font-size="21" font-weight="700" fill="#292524">Where the ${esc(baseCond)} errors come from</text>
<text x="34" y="66" font-size="13" fill="#78716c">${ok.filter((r) => r.condition === baseCond).reduce((a, r) => a + (r.errors ? r.errors.length : 0), 0)} error events across ${ok.filter((r) => r.condition === baseCond).length} responses</text>`;
items.forEach(([c, n], i) => { const y = top + i * rowH, bw2 = (724 - 320) * (n / maxC);
  s2 += `<text x="310" y="${y + 16}" font-size="13" fill="#44403c" text-anchor="end">${esc(c)}</text><rect x="320" y="${y + 2}" width="${bw2}" height="21" rx="4" fill="#E8833B"/><text x="${320 + bw2 + 8}" y="${y + 17}" font-size="13" font-weight="700" fill="#9a5518">${n}</text>`; });
s2 += `</svg>`;
writeFileSync(join(ASSETS, `${prefix}-taxonomy.svg`), s2 + "\n", "utf8");
console.log(`Wrote assets/${prefix}-errors.svg (grouped ${CONDS.join(" vs ")}) and assets/${prefix}-taxonomy.svg from ${inPath.replace(ROOT, ".")}`);
