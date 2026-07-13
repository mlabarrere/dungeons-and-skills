#!/usr/bin/env node
// node benchmarks/score-arithmetic.mjs
// Scores arithmetic-suite captures: compares each derived stat numerically.
// Oracle values come from engine/cli.mjs build (authoritative ground truth).
import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TASK_DIR = join(ROOT, "benchmarks", "tasks", "dnd-build");
const CAP_DIR  = join(ROOT, "benchmarks", "captures", "dnd-build");
const OUT_DIR  = join(ROOT, "benchmarks", "results");
mkdirSync(OUT_DIR, { recursive: true });

// ── Load arithmetic tasks ─────────────────────────────────────────────────────
const tasks = readdirSync(TASK_DIR)
  .filter(f => f.endsWith("-stats.json"))
  .map(f => ({ ...JSON.parse(readFileSync(join(TASK_DIR, f), "utf8")), _file: f }));

const CELLS = [
  { model: "haiku",  condition: "bare" },
  { model: "sonnet", condition: "bare" },
  { model: "opus",   condition: "bare" },
  { model: "haiku",  condition: "skill-engine" },
  { model: "sonnet", condition: "skill-engine" },
  { model: "opus",   condition: "skill-engine" },
];

const NUMERIC_STATS = ["proficiencyBonus", "hitPoints", "armorClass", "passivePerception",
                       "spellSaveDC", "spellAttackBonus", "cantripsCount", "preparedSpellsCount"];

// ── Stat scorers ──────────────────────────────────────────────────────────────
function scoreNumeric(actual, expected) {
  if (expected === null) return null;  // N/A
  if (actual == null) return 0.0;
  const a = Number(actual), e = Number(expected);
  if (a === e) return 1.0;
  if (Math.abs(a - e) === 1) return 0.5;
  return 0.0;
}

function scoreJaccard(actual, expected) {
  if (!expected || expected.length === 0) return null;
  if (!actual || actual.length === 0) return 0.0;
  const exp = new Set(expected.map(s => s.toLowerCase()));
  const act = new Set(actual.map(s => s.toLowerCase()));
  let inter = 0;
  for (const s of act) if (exp.has(s)) inter++;
  const union = new Set([...exp, ...act]).size;
  return union === 0 ? 1.0 : inter / union;
}

function extractCaptureStat(capture, stat) {
  if (stat === "cantripsCount")      return capture.cantrips?.length ?? capture.cantripsCount ?? null;
  if (stat === "preparedSpellsCount") return capture.preparedSpells?.length ?? capture.preparedSpellsCount ?? null;
  if (stat === "spellAttackBonus")   return capture.spellAttackBonus ?? capture.spellAttack ?? null;
  return capture[stat] ?? null;
}

// ── Score a single cell ───────────────────────────────────────────────────────
function scoreCell(task, capture) {
  const oracle = task.oracle;
  const statScores = {};

  for (const stat of NUMERIC_STATS) {
    const expected = oracle[stat];
    if (expected === null || expected === undefined) { statScores[stat] = null; continue; }
    const actual = extractCaptureStat(capture, stat);
    statScores[stat] = scoreNumeric(actual, expected);
  }

  // Saves — Jaccard
  const savesScore = scoreJaccard(capture.savingThrowProficiencies, oracle.savingThrowProficiencies);
  statScores.savingThrowProficiencies = savesScore;

  const scored = Object.values(statScores).filter(v => v !== null);
  const mean = scored.length === 0 ? 0 : scored.reduce((s, v) => s + v, 0) / scored.length;

  return { statScores, mean, n: scored.length };
}

// ── Run ───────────────────────────────────────────────────────────────────────
const allResults = [];

for (const task of tasks) {
  const row = { taskId: task.id, cells: {} };
  for (const cell of CELLS) {
    const key = `${cell.model}-${cell.condition}`;
    const capPath = join(CAP_DIR, `${cell.condition}.${cell.model}.${task.id}.json`);
    if (!existsSync(capPath)) {
      row.cells[key] = { exists: false, mean: null, statScores: {} };
      continue;
    }
    let capture;
    try { capture = JSON.parse(readFileSync(capPath, "utf8")); } catch { row.cells[key] = { exists: false, mean: null, statScores: {} }; continue; }
    const result = scoreCell(task, capture);
    row.cells[key] = { exists: true, ...result };
    allResults.push({ taskId: task.id, ...cell, ...result });
  }
  console.log(`\n── ${task.id} ──`);
  console.log(`  trap: ${task.trap.slice(0, 100)}...`);
  const CKEYS = CELLS.map(c => `${c.model}-${c.condition}`);
  console.log("  " + CKEYS.map(k => k.padEnd(22)).join(""));
  const scores = CKEYS.map(k => {
    const c = row.cells[k];
    if (!c.exists) return "MISS".padEnd(22);
    return `${(c.mean * 100).toFixed(0)}%`.padEnd(22);
  });
  console.log("  " + scores.join(""));
  // Per-stat breakdown
  const allStats = [...NUMERIC_STATS, "savingThrowProficiencies"];
  for (const stat of allStats) {
    const vals = CKEYS.map(k => {
      const c = row.cells[k];
      if (!c.exists) return "—".padEnd(10);
      const v = c.statScores?.[stat];
      if (v === null || v === undefined) return "n/a".padEnd(10);
      return `${v.toFixed(2)}`.padEnd(10);
    });
    const oracleVal = task.oracle[stat];
    if (oracleVal === null || oracleVal === undefined) continue;
    console.log(`    ${stat.padEnd(28)} oracle=${JSON.stringify(oracleVal).padEnd(16)} ${vals.join("")}`);
  }
}

// ── Aggregate per condition ───────────────────────────────────────────────────
console.log("\n\n=== Aggregate per model×condition (arithmetic suite) ===\n");
console.log("Model-Condition             N     Avg%    Notes");
console.log("─".repeat(60));
for (const cell of CELLS) {
  const key = `${cell.model}-${cell.condition}`;
  const cellRes = allResults.filter(r => r.model === cell.model && r.condition === cell.condition && r.mean !== null);
  if (cellRes.length === 0) { console.log(`${key.padEnd(28)}0     (no captures)`); continue; }
  const avg = cellRes.reduce((s, r) => s + r.mean, 0) / cellRes.length;
  const perfect = cellRes.filter(r => r.mean === 1.0).length;
  console.log(`${key.padEnd(28)}${cellRes.length.toString().padEnd(6)}${(avg * 100).toFixed(1).padEnd(8)}${perfect}/${cellRes.length} perfect`);
}

// ── Stat-level aggregate (which stats are hardest) ───────────────────────────
console.log("\n=== Stat accuracy across all cells with captures ===\n");
const statAcc = {};
for (const stat of [...NUMERIC_STATS, "savingThrowProficiencies"]) {
  const vals = allResults.flatMap(r => {
    const v = r.statScores?.[stat];
    return v !== null && v !== undefined ? [v] : [];
  });
  if (vals.length > 0) {
    statAcc[stat] = { mean: vals.reduce((s, v) => s + v, 0) / vals.length, n: vals.length };
  }
}
const sorted = Object.entries(statAcc).sort(([, a], [, b]) => a.mean - b.mean);
for (const [stat, { mean, n }] of sorted) {
  const bar = "█".repeat(Math.round(mean * 20));
  console.log(`${stat.padEnd(30)} ${(mean * 100).toFixed(1).padStart(5)}%  [${bar.padEnd(20)}]  n=${n}`);
}

// ── Save JSON ─────────────────────────────────────────────────────────────────
const outPath = join(OUT_DIR, "arithmetic-scores.json");
const taskRows = tasks.map(t => ({
  taskId: t.id, oracle: t.oracle,
  cells: Object.fromEntries(CELLS.map(c => [`${c.model}-${c.condition}`, allResults.find(r => r.taskId === t.id && r.model === c.model && r.condition === c.condition) || null]))
}));
writeFileSync(outPath, JSON.stringify({ generated: new Date().toISOString(), tasks: taskRows, aggregate: allResults }, null, 2));
console.log(`\n→ JSON saved: ${outPath}`);
