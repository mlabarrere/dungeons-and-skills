#!/usr/bin/env node
/* runner.mjs — run the benchmark matrix and score every response with the deterministic
   oracle. Backends: oracle | fixture | replay | live (see responders.mjs / live.mjs).
   Writes results/runs.<id>.json with a per-run provenance manifest. Never fabricates:
   a missing offline capture is recorded status="not-run"; an unsupported reasoning level
   is "not-supported". See benchmarks/README.md and AUDIT.md.

   node benchmarks/runner.mjs --backend replay --skills dnd-build --models haiku,sonnet,opus \
        --conditions bare --reasoning off --reps 1 --seed 20260711 [--dry-run] [--resume] */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadAll } from "./lib.mjs";
import { loadModelConfig, resolveModel, supportsReasoning, reasoningBudget, estimateCost } from "./models.mjs";
import { loadTasks } from "./tasks/load.mjs";
import { buildPrompt } from "./conditions.mjs";
import { scoreTask } from "./skills/index.mjs";
import { computeMetrics } from "./scoring.mjs";
import { oracleResponse, fixtureResponse, replayResponse } from "./responders.mjs";
import { gitInfo, versions, sha } from "./provenance.mjs";
import { mulberry32 } from "./stats.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "benchmarks", "results");
const cfgDefault = JSON.parse(readFileSync(join(ROOT, "benchmarks", "config", "benchmark.default.json"), "utf8"));

function arg(name, def) { const i = process.argv.indexOf(`--${name}`); return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : def; }
const has = (f) => process.argv.includes(`--${f}`);
const list = (v, d) => (v ? String(v).split(",") : d);

const backend = arg("backend", "replay");
const skills = list(arg("skills"), cfgDefault.skills);
const conditions = list(arg("conditions"), cfgDefault.conditions);
const reasoning = list(arg("reasoning"), cfgDefault.reasoning);
const reps = Number(arg("reps", cfgDefault.reps));
const seed = Number(arg("seed", cfgDefault.seed));
const suite = arg("suite", cfgDefault.suite);
const lang = arg("lang", cfgDefault.lang);
const maxUsd = Number(arg("max-usd", cfgDefault.maxUsd));
const dryRun = has("dry-run");
const resume = has("resume");

const env = await loadAll();
const modelCfg = loadModelConfig(arg("models-config"));
const modelAliases = backend === "oracle" ? ["oracle"] : list(arg("models"), cfgDefault.models);
const tasksBySkill = loadTasks({ skills, suite });

/* Build the cell matrix. Oracle backend collapses model/condition/reasoning/reps. */
let cells = [];
for (const skill of skills) for (const task of (tasksBySkill[skill] || [])) {
  if (backend === "oracle") { cells.push({ skill, task, model: "oracle", condition: "oracle", reason: "off", rep: 0 }); continue; }
  for (const model of modelAliases) for (const condition of conditions) for (const reason of reasoning) for (let rep = 0; rep < reps; rep++)
    cells.push({ skill, task, model, condition, reason, rep });
}
// Seeded shuffle (randomised order, spec §8) — reproducible.
if (cfgDefault.randomizeOrder) { const rnd = mulberry32(seed); for (let i = cells.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [cells[i], cells[j]] = [cells[j], cells[i]]; } }

const runId = `${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}-${backend}`;
const baseManifest = { ...gitInfo(), ...versions(), seed, backend, suite, lang, started_at: new Date().toISOString() };
mkdirSync(OUT, { recursive: true });
const outPath = join(OUT, `runs.${runId}.json`);
const runs = [];
const doneKeys = new Set();
if (resume) { const prev = join(OUT, arg("resume-file", `runs.${runId}.json`)); if (existsSync(prev)) for (const r of JSON.parse(readFileSync(prev, "utf8")).runs) { runs.push(r); doneKeys.add(r.key); } }

/* Dry-run: print the plan and (for live) a rough cost ceiling; never call anything. */
if (dryRun) {
  let estUsd = 0;
  for (const c of cells) {
    if (backend !== "live") continue;
    const m = resolveModel(modelCfg, c.model);
    const { system, user } = buildPrompt(c.condition, c.task);
    estUsd += estimateCost(m, (system.length + user.length) / 4, 900) || 0;
  }
  console.log(`DRY RUN: ${cells.length} cells · backend=${backend} · skills=${skills.join(",")} · conditions=${conditions.join(",")} · models=${modelAliases.join(",")} · reasoning=${reasoning.join(",")} · reps=${reps}`);
  if (backend === "live") console.log(`Estimated cost ≈ $${estUsd.toFixed(2)} (rough; budget max-usd=$${maxUsd}). Re-run without --dry-run to execute.`);
  process.exit(0);
}
if (backend === "live") {
  let estUsd = 0; for (const c of cells) { const m = resolveModel(modelCfg, c.model); const { system, user } = buildPrompt(c.condition, c.task); estUsd += estimateCost(m, (system.length + user.length) / 4, 900) || 0; }
  if (estUsd > maxUsd) { console.error(`Estimated cost $${estUsd.toFixed(2)} exceeds --max-usd $${maxUsd}. Aborting (no fabrication, no runaway spend).`); process.exit(2); }
}

const { callLive } = backend === "live" ? await import("./live.mjs") : { callLive: null };

for (const c of cells) {
  const key = `${c.skill}|${c.task.id}|${c.model}|${c.condition}|${c.reason}|${c.rep}`;
  if (doneKeys.has(key)) continue;
  const { system, user, tool_access } = c.condition === "oracle"
    ? { system: "", user: "", tool_access: [] }
    : buildPrompt(c.condition, c.task);
  const rec = { key, skill: c.skill, task: c.task.id, level: c.task.level, model: c.model, condition: c.condition,
    reasoning: c.reason, rep: c.rep, backend, provenance: backend, status: "not-run", source: null,
    errors: [], metrics: null, extra: null, usage: null, timing: null, cost: null, error_msg: null,
    manifest: { ...baseManifest, condition: c.condition, reasoning_level: c.reason, repetition: c.rep,
      prompt_hash: sha(system + "\n" + user), skill_hash: sha(c.skill), tool_access } };

  try {
    let response = null;
    if (backend === "oracle") { response = oracleResponse(env, c.task); rec.provenance = "oracle"; rec.source = "engine"; }
    else if (backend === "fixture") { const g = fixtureResponse(c.task, c.condition); if (g) { response = g.response; rec.source = g.source; } }
    else if (backend === "replay") { const g = replayResponse(c.task, c.condition, c.model); if (g) { response = g.response; rec.source = g.source; } }
    else if (backend === "live") {
      const m = resolveModel(modelCfg, c.model);
      if (!supportsReasoning(m, c.reason)) { rec.status = "not-supported"; runs.push(rec); continue; }
      const apiKey = process.env[m.providerCfg.keyEnv];
      if (!apiKey) throw new Error(`${m.providerCfg.keyEnv} not set`);
      rec.manifest.model_id = m.api_id; rec.manifest.provider = m.provider;
      const out = await callLive({ model: m, apiKey, system, user, tool_access, reasoningBudget: reasoningBudget(modelCfg, c.reason), timeoutMs: cfgDefault.timeoutMs });
      response = out.response; rec.usage = out.usage; rec.timing = out.timing; rec.cost = estimateCost(m, out.usage.input, out.usage.output);
    }
    if (response == null) { rec.status = "not-run"; runs.push(rec); continue; }

    const { units, errors, extra } = scoreTask(env, c.task, response);
    rec.status = "ok"; rec.errors = errors; rec.metrics = computeMetrics(units, errors); rec.extra = extra || null;
    rec.response_size = JSON.stringify(response).length;
  } catch (e) { rec.status = "error"; rec.error_msg = String(e.message || e); }
  runs.push(rec);
  writeFileSync(outPath, JSON.stringify({ meta: { ...baseManifest, finished_at: new Date().toISOString(), run_id: runId, cells: cells.length }, runs }, null, 2) + "\n", "utf8"); // incremental save (resume-safe)
}

const ok = runs.filter((r) => r.status === "ok").length;
console.log(`${runId}: ${ok}/${runs.length} scored (${backend}). ${runs.filter((r) => r.status === "not-run").length} not-run, ${runs.filter((r) => r.status === "not-supported").length} not-supported, ${runs.filter((r) => r.status === "error").length} error.`);
console.log(`→ ${outPath.replace(ROOT, ".")}`);
