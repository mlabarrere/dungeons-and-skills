#!/usr/bin/env node
// node benchmarks/score-adversarial.mjs
// Scores adversarial captures against task oracles.
// Outputs a text table + writes benchmarks/results/adversarial-scores.json
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CAP  = join(ROOT, "benchmarks", "captures");
const OUT  = join(ROOT, "benchmarks", "results");
mkdirSync(OUT, { recursive: true });

// ── Task definitions ─────────────────────────────────────────────────────────
const TASKS = [
  { skill: "dnd-build",  id: "ranger-spell-trap" },
  { skill: "dnd-build",  id: "human-feat-trap" },
  { skill: "dnd-check",  id: "ranger-no-spells" },
  { skill: "dnd-check",  id: "wrong-pb-level1" },
  { skill: "dnd-lookup", id: "ranger-hunters-mark" },
  { skill: "dnd-lookup", id: "human-chanceux" },
  { skill: "dnd-lookup", id: "fighter-no-spells" },
  { skill: "dnd-help",   id: "ranger-spells-misconception" },
  { skill: "dnd-help",   id: "variant-human-5.5" },
  { skill: "dnd-help",   id: "level-beyond-scope" },
];

const CELLS = [
  { model: "haiku",  condition: "bare" },
  { model: "sonnet", condition: "bare" },
  { model: "opus",   condition: "bare" },
  { model: "haiku",  condition: "skill-engine" },
  { model: "sonnet", condition: "skill-engine" },
  { model: "opus",   condition: "skill-engine" },
];

// ── Scorer ───────────────────────────────────────────────────────────────────
function scoreCapture(taskId, skill, capture) {
  if (!capture) return null;

  // dnd-build ─────────────────────────────────────────────────────────────────
  if (skill === "dnd-build") {
    if (taskId === "ranger-spell-trap") {
      const spells = capture.preparedSpells || [];
      if (spells.length >= 2) return { score: 1.0, label: "PASS", note: `${spells.length} spells` };
      if (spells.length === 1) return { score: 0.5, label: "PART", note: `1 spell (needs ≥2)` };
      return { score: 0.0, label: "FAIL", note: "0 spells — trap activated" };
    }
    if (taskId === "human-feat-trap") {
      // Bare models output originFeat explicitly. Skill-engine outputs don't expose it;
      // use skill count as proxy: Human Fighter Soldier = Fighter(2)+Soldier(2)+Human(1) = 5.
      if (capture.originFeat) return { score: 1.0, label: "PASS", note: `feat: ${capture.originFeat}` };
      const skills = (capture.skillProficiencies || []).length;
      if (skills >= 5) return { score: 1.0, label: "PASS", note: `engine: ${skills} skills (≥5 = human-competent applied)` };
      if (skills >= 3) return { score: 0.5, label: "PART", note: `engine: ${skills} skills (possible missing human traits)` };
      return { score: 0.0, label: "FAIL", note: "no originFeat, <3 skills — trap activated" };
    }
  }

  // dnd-check ─────────────────────────────────────────────────────────────────
  if (skill === "dnd-check") {
    const findings = capture.findings || [];
    const text = JSON.stringify(findings).toLowerCase();
    if (taskId === "ranger-no-spells") {
      // Must specifically catch missing prepared spells (not just any spell-related error)
      const catchesSpells = text.includes("preparedspells") || text.includes("prepared");
      if (catchesSpells) return { score: 1.0, label: "PASS", note: `${findings.length} finding(s), caught prepared spell error` };
      return { score: 0.0, label: "FAIL", note: `${findings.length} finding(s), missed prepared spells (${text.slice(0,80)}...)` };
    }
    if (taskId === "wrong-pb-level1") {
      const catchesPB = text.includes("proficiency") || text.includes("proficiencybonus") ||
        (text.includes("bonus") && (text.includes("2") || text.includes("3")));
      if (catchesPB) return { score: 1.0, label: "PASS", note: `caught PB error` };
      return { score: 0.0, label: "FAIL", note: "missed PB error — trap activated" };
    }
  }

  // dnd-lookup ─────────────────────────────────────────────────────────────────
  if (skill === "dnd-lookup") {
    const items = (capture.items || []).map(i => String(i).toLowerCase());
    const notFound = capture.not_found;
    const ans = (capture.answer || "").toLowerCase();

    if (taskId === "ranger-hunters-mark") {
      if (items.some(i => i.includes("hunters") || i.includes("hunter"))) return { score: 1.0, label: "PASS", note: `items: ${items.join(",")}` };
      if (!notFound && (ans.includes("yes") || ans.includes("available") || ans.includes("prepare"))) return { score: 0.5, label: "PART", note: "answer affirmative, items empty" };
      return { score: 0.0, label: "FAIL", note: "trap: said unavailable" };
    }
    if (taskId === "human-chanceux") {
      if (items.some(i => i.includes("chance") || i.includes("luck"))) return { score: 1.0, label: "PASS", note: `items: ${items.join(",")}` };
      if (!notFound && (ans.includes("yes") || ans.includes("can") || ans.includes("may") || ans.includes("origin feat"))) return { score: 0.5, label: "PART", note: "answer affirmative, items mismatch" };
      return { score: 0.0, label: "FAIL", note: "trap: said only Variant Human" };
    }
    if (taskId === "fighter-no-spells") {
      if (items.length === 0 && notFound === false) return { score: 1.0, label: "PASS", note: "items=[], not_found=false" };
      if (items.length === 0) return { score: 0.5, label: "PART", note: "items=[], not_found missing" };
      return { score: 0.0, label: "FAIL", note: `hallucinated: ${items.join(",")}` };
    }
  }

  // dnd-help ──────────────────────────────────────────────────────────────────
  if (skill === "dnd-help") {
    const stepsText = ((capture.steps || []).join(" ") + " " + (capture.answer || "")).toLowerCase();

    if (taskId === "ranger-spells-misconception") {
      // "level 2" is allowed if it appears in historical context ("unlike 2014, level 2").
      // Only block clearly wrong denials.
      const forbid = ["no spells", "don't get spells", "no spell slots",
                      "spells start at level 2", "spellcasting at level 2",
                      "get spells at level 2", "spell until level 2"];
      const forbidden = forbid.find(t => stepsText.includes(t.toLowerCase()));
      if (forbidden) return { score: 0.0, label: "FAIL", note: `forbidden: "${forbidden}"` };
      // Require "2" (the number of prepared spells at level 1)
      if (stepsText.includes("2")) return { score: 1.0, label: "PASS", note: `mentions "2", no forbidden tokens` };
      return { score: 0.0, label: "FAIL", note: `missing "2" in steps` };
    }
    if (taskId === "variant-human-5.5") {
      const forbid = ["variant human subrace", "variant human option", "variant human is"];
      const forbidden = forbid.find(t => stepsText.includes(t.toLowerCase()));
      if (forbidden) return { score: 0.0, label: "FAIL", note: `forbidden: "${forbidden}"` };
      if (stepsText.includes("origin feat")) return { score: 1.0, label: "PASS", note: `mentions "origin feat", no forbidden tokens` };
      return { score: 0.0, label: "FAIL", note: `missing "origin feat" in steps` };
    }
    if (taskId === "level-beyond-scope") {
      if (stepsText.includes("manquant documentaire")) return { score: 1.0, label: "PASS", note: `says "Manquant documentaire"` };
      return { score: 0.0, label: "FAIL", note: "no Manquant documentaire — trap activated" };
    }
  }

  return { score: null, label: "N/A", note: "unrecognized task" };
}

// ── Load and score ────────────────────────────────────────────────────────────
const results = [];
const table = [];

for (const task of TASKS) {
  const row = { task: `${task.skill}/${task.id}`, cells: {} };
  for (const cell of CELLS) {
    const capPath = join(CAP, task.skill, `${cell.condition}.${cell.model}.${task.id}.json`);
    let capture = null;
    if (existsSync(capPath)) {
      try { capture = JSON.parse(readFileSync(capPath, "utf8")); } catch {}
    }
    const result = scoreCapture(task.id, task.skill, capture);
    const key = `${cell.model}-${cell.condition}`;
    row.cells[key] = result ? { ...result, exists: !!capture } : { score: null, label: "MISS", note: "no capture file", exists: false };
    results.push({ ...task, ...cell, ...row.cells[key] });
  }
  table.push(row);
}

// ── Print table ───────────────────────────────────────────────────────────────
const COL_W = 13;
const TASK_W = 44;
const cols = CELLS.map(c => `${c.model}-${c.condition}`);

console.log("\n=== Adversarial Benchmark — Binary Scores ===\n");
console.log("Task".padEnd(TASK_W) + cols.map(c => c.padEnd(COL_W)).join(""));
console.log("─".repeat(TASK_W + cols.length * COL_W));

for (const row of table) {
  const line = row.task.padEnd(TASK_W) +
    cols.map(c => {
      const v = row.cells[c];
      if (!v || v.score === null) return "MISS".padEnd(COL_W);
      return `${v.label}(${v.score})`.padEnd(COL_W);
    }).join("");
  console.log(line);
}

// ── Per-condition aggregates ──────────────────────────────────────────────────
console.log("\n=== Aggregate per model×condition (adversarial tasks only) ===\n");
console.log("Model-Condition".padEnd(28) + "N".padEnd(6) + "Avg Score".padEnd(14) + "Pass%".padEnd(10) + "PASS".padEnd(8) + "PART".padEnd(8) + "FAIL");
console.log("─".repeat(78));

for (const cell of CELLS) {
  const key = `${cell.model}-${cell.condition}`;
  const cellResults = results.filter(r => r.model === cell.model && r.condition === cell.condition && r.score !== null);
  const n = cellResults.length;
  if (n === 0) { console.log(key.padEnd(28) + "0".padEnd(6) + "(no captures)"); continue; }
  const avg = (cellResults.reduce((s, r) => s + r.score, 0) / n).toFixed(3);
  const passCount = cellResults.filter(r => r.score === 1.0).length;
  const partCount = cellResults.filter(r => r.score === 0.5).length;
  const failCount = cellResults.filter(r => r.score === 0.0).length;
  const passPct = ((passCount / n) * 100).toFixed(1);
  console.log(key.padEnd(28) + n.toString().padEnd(6) + avg.padEnd(14) + `${passPct}%`.padEnd(10) + passCount.toString().padEnd(8) + partCount.toString().padEnd(8) + failCount);
}

// ── Delta bare→skill-engine ───────────────────────────────────────────────────
console.log("\n=== Delta: bare → skill-engine ===\n");
for (const model of ["haiku", "sonnet", "opus"]) {
  const bare = results.filter(r => r.model === model && r.condition === "bare" && r.score !== null);
  const se   = results.filter(r => r.model === model && r.condition === "skill-engine" && r.score !== null);
  if (bare.length === 0 || se.length === 0) { console.log(`${model}: incomplete (bare=${bare.length}, se=${se.length})`); continue; }
  const avgBare = bare.reduce((s, r) => s + r.score, 0) / bare.length;
  const avgSE   = se.reduce((s, r) => s + r.score, 0) / se.length;
  const delta = ((avgSE - avgBare) / Math.max(avgBare, 0.01)) * 100;
  const passBare = bare.filter(r => r.score === 1.0).length;
  const passSE   = se.filter(r => r.score === 1.0).length;
  console.log(`${model}: bare=${avgBare.toFixed(2)} (${passBare}/${bare.length} PASS)  skill-engine=${avgSE.toFixed(2)} (${passSE}/${se.length} PASS)  Δ=${delta >= 0 ? "+" : ""}${delta.toFixed(0)}%`);
}

// ── Task-level notes ──────────────────────────────────────────────────────────
console.log("\n=== Task-level notes ===\n");
for (const row of table) {
  const notes = Object.entries(row.cells)
    .filter(([, v]) => v && v.score !== null)
    .map(([k, v]) => `  ${k}: ${v.label} — ${v.note}`);
  if (notes.length > 0) {
    console.log(row.task);
    notes.forEach(n => console.log(n));
  }
}

// ── Save JSON ─────────────────────────────────────────────────────────────────
const outPath = join(OUT, "adversarial-scores.json");
writeFileSync(outPath, JSON.stringify({ generated: new Date().toISOString(), tasks: TASKS, cells: CELLS, table, results }, null, 2));
console.log(`\n→ JSON saved: ${outPath}`);
