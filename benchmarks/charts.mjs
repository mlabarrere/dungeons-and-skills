#!/usr/bin/env node
/* charts.mjs — render SVG charts from a runs.<id>.json into assets/. Self-contained light
   cards (readable on light & dark GitHub themes), value labels + a bootstrap-CI whisker, so
   identity/precision never rests on colour alone. Only real backends (replay/live) should feed
   the charts that go in the README; oracle/fixture runs are for the technical doc.
   Usage: node benchmarks/charts.mjs --in results/runs.<id>.json [--condition bare] [--prefix bench] */
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
const condition = arg("condition", "bare");
const prefix = arg("prefix", "bench");
const ok = data.runs.filter((r) => r.status === "ok" && r.condition === condition);
mkdirSync(ASSETS, { recursive: true });

/* --- chart 1: atomic error rate per model (with 95% CI whisker) --- */
const models = [...new Set(ok.map((r) => r.model))].sort();
const bars = models.map((m) => {
  const rates = ok.filter((r) => r.model === m).map((r) => r.metrics.atomic_error_rate);
  const ci = bootstrapCI(rates, { seed: data.meta?.seed || 1 });
  return { model: m, mean: aggregate(ok.filter((r) => r.model === m).map((r) => r.metrics)).mean_atomic_error_rate, lo: ci.lo, hi: ci.hi, n: rates.length };
});
const maxV = Math.max(5, ...bars.map((b) => b.hi || b.mean)) * 1.15;
const W = 720, H = 380, x0 = 70, x1 = 690, yTop = 96, yBot = 320;
const sx = (i) => x0 + (x1 - x0) * ((i + 0.5) / Math.max(1, bars.length));
const sy = (v) => yBot - (yBot - yTop) * (v / maxV);
let svg1 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" role="img" aria-label="Atomic error rate per model, ${condition} condition, with 95% confidence intervals.">
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" fill="#ffffff" stroke="#e7e5e4"/>
<text x="36" y="42" font-size="21" font-weight="700" fill="#292524">Atomic error rate — ${esc(condition)} (lower is better)</text>
<text x="36" y="66" font-size="13" fill="#78716c">% of scorable units wrong · 95% bootstrap CI · n per bar shown · ${esc(data.meta?.backend)} pilot</text>`;
for (let g = 0; g <= 4; g++) { const v = (maxV / 4) * g, y = sy(v); svg1 += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="#ece9e6"/><text x="${x0 - 8}" y="${y + 4}" font-size="12" fill="#a8a29e" text-anchor="end">${v.toFixed(0)}</text>`; }
bars.forEach((b, i) => {
  const cx = sx(i), bw = 70, y = sy(b.mean);
  svg1 += `<rect x="${cx - bw / 2}" y="${y}" width="${bw}" height="${yBot - y}" rx="4" fill="#E8833B"/>`;
  if (b.n > 1) svg1 += `<line x1="${cx}" y1="${sy(b.lo)}" x2="${cx}" y2="${sy(b.hi)}" stroke="#7c2d12" stroke-width="2"/><line x1="${cx - 8}" y1="${sy(b.lo)}" x2="${cx + 8}" y2="${sy(b.lo)}" stroke="#7c2d12" stroke-width="2"/><line x1="${cx - 8}" y1="${sy(b.hi)}" x2="${cx + 8}" y2="${sy(b.hi)}" stroke="#7c2d12" stroke-width="2"/>`;
  svg1 += `<text x="${cx}" y="${y - 8}" font-size="14" font-weight="700" fill="#9a5518" text-anchor="middle">${b.mean.toFixed(1)}%</text>`;
  svg1 += `<text x="${cx}" y="${yBot + 20}" font-size="13" fill="#44403c" text-anchor="middle">${esc(b.model)}</text>`;
  svg1 += `<text x="${cx}" y="${yBot + 38}" font-size="11" fill="#a8a29e" text-anchor="middle">n=${b.n}</text>`;
});
svg1 += `<text x="36" y="${H - 12}" font-size="11.5" fill="#a8a29e">Deterministic scorer; grounded conditions score 0 by construction and are shown in the report, not here.</text></svg>`;
writeFileSync(join(ASSETS, `${prefix}-errors.svg`), svg1 + "\n", "utf8");

/* --- chart 2: taxonomy --- */
const cat = {};
for (const r of ok) for (const e of (r.errors || [])) cat[e.category] = (cat[e.category] || 0) + 1;
const items = Object.entries(cat).sort((a, b) => b[1] - a[1]);
const maxC = Math.max(1, ...items.map((i) => i[1]));
const rowH = 30, top = 92, H2 = top + items.length * rowH + 30;
let svg2 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 ${H2}" font-family="-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" role="img" aria-label="Error taxonomy for the ${condition} condition.">
<rect x="0.5" y="0.5" width="719" height="${H2 - 1}" rx="16" fill="#ffffff" stroke="#e7e5e4"/>
<text x="36" y="42" font-size="21" font-weight="700" fill="#292524">Error taxonomy — ${esc(condition)}</text>
<text x="36" y="66" font-size="13" fill="#78716c">${ok.reduce((s, r) => s + (r.errors ? r.errors.length : 0), 0)} error events across ${ok.length} responses</text>`;
items.forEach(([c, n], i) => {
  const y = top + i * rowH, bw = (690 - 300) * (n / maxC);
  svg2 += `<text x="290" y="${y + 16}" font-size="13" fill="#44403c" text-anchor="end">${esc(c)}</text>`;
  svg2 += `<rect x="300" y="${y + 2}" width="${bw}" height="21" rx="4" fill="#E8833B"/>`;
  svg2 += `<text x="${300 + bw + 8}" y="${y + 17}" font-size="13" font-weight="700" fill="#9a5518">${n}</text>`;
});
svg2 += `</svg>`;
writeFileSync(join(ASSETS, `${prefix}-taxonomy.svg`), svg2 + "\n", "utf8");
console.log(`Wrote assets/${prefix}-errors.svg and assets/${prefix}-taxonomy.svg from ${inPath.replace(ROOT, ".")} (condition=${condition}).`);
