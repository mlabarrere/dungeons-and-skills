#!/usr/bin/env node
/* run.mjs — run the benchmark matrix (models × arms × tasks × reps) and score every
   character with the deterministic oracle. Writes benchmarks/results/runs.json.

   Two backends:
     --replay            score pre-captured outputs in benchmarks/captures/ (offline,
                         reproducible, no API key). Default.
     --live              call the Anthropic API (needs ANTHROPIC_API_KEY). Real models.

   Options:
     --models a,b,c      default: haiku,sonnet,opus
     --arms bare,grounded
     --reasoning off,high   (live only) maps to extended-thinking budget
     --reps N            repetitions per cell (default 1)
     --tasks id,id       default: all

   The scorer is the same in both backends — that is the whole point: an objective,
   model-independent error count per character creation. See benchmarks/README.md. */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadAll } from "./lib.mjs";
import { score } from "./scorer.mjs";
import { TASKS } from "./tasks.mjs";
import { ARMS } from "./arms.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CAP = join(ROOT, "benchmarks", "captures");
const OUTDIR = join(ROOT, "benchmarks", "results");

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : def;
}
const has = (f) => process.argv.includes(`--${f}`);

const MODEL_IDS = { haiku: "claude-haiku-4-5-20251001", sonnet: "claude-sonnet-5", opus: "claude-opus-4-8" };

const models = arg("models", "haiku,sonnet,opus").split(",");
const arms = arg("arms", "bare,grounded").split(",");
const reasoning = arg("reasoning", "off").split(",");
const reps = Number(arg("reps", "1"));
const taskIds = arg("tasks", TASKS.map((t) => t.id).join(",")).split(",");
const live = has("live");
const tasks = TASKS.filter((t) => taskIds.includes(t.id));

/** Replay: read a captured claim for (arm, model, task) with fallback to a shared fixture. */
function replayClaim(arm, model, task) {
  for (const name of [`${arm}.${model}.${task.id}.json`, `${arm}.${task.id}.json`, `bare-typical.${task.id}.json`]) {
    const p = join(CAP, name);
    if (existsSync(p)) { const c = JSON.parse(readFileSync(p, "utf8")); return { claim: c, source: name }; }
  }
  return null;
}

/** Live: call the Anthropic API and parse the JSON claim from the reply. */
async function liveClaim(arm, model, task, reason) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set (required for --live)");
  const prompt = ARMS[arm](task);
  const body = { model: MODEL_IDS[model] || model, max_tokens: 2048, messages: [{ role: "user", content: prompt }] };
  if (reason && reason !== "off") body.thinking = { type: "enabled", budget_tokens: reason === "high" ? 8000 : 2000 };
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("no JSON object in model reply");
  return { claim: JSON.parse(m[0]), source: "live" };
}

const env = await loadAll();
const runs = [];
for (const model of models) {
  for (const arm of arms) {
    for (const reason of (live ? reasoning : ["off"])) {
      for (const task of tasks) {
        for (let rep = 0; rep < reps; rep++) {
          let claim = null, sourceInfo = "", error = null;
          try {
            const got = live ? await liveClaim(arm, model, task, reason) : replayClaim(arm, model, task);
            if (!got) throw new Error(`no capture for ${arm}/${model}/${task.id}`);
            claim = got.claim; sourceInfo = got.source;
          } catch (e) { error = String(e.message || e); }
          const scored = claim ? score(env, task, claim) : { errors: null, findings: [] };
          runs.push({ model, arm, reasoning: reason, task: task.id, rep, source: sourceInfo,
            errors: scored.errors, tags: scored.findings.map((f) => f.tag), error });
          const label = `${model}/${arm}${reason !== "off" ? "/" + reason : ""}/${task.id}#${rep}`;
          console.log(error ? `  [ERR] ${label}: ${error}` : `  ${label}: ${scored.errors} error(s)`);
        }
      }
    }
  }
}

mkdirSync(OUTDIR, { recursive: true });
const outPath = join(OUTDIR, "runs.json");
writeFileSync(outPath, JSON.stringify({ meta: { backend: live ? "live" : "replay", when: new Date().toISOString(), models, arms, reasoning: live ? reasoning : ["off"], reps }, runs }, null, 2) + "\n", "utf8");
console.log(`\nWrote ${runs.length} runs to ${outPath}. Aggregate with: node benchmarks/report.mjs`);
