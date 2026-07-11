#!/usr/bin/env node
/* validate.mjs — a compact JSON-Schema (draft-07 subset) validator, no dependencies.
   Supports: type (incl. unions), required, enum, properties, items, minLength, oneOf.
   Enough to validate our task / run / score / response schemas. Used by tests + CI.
   Usage: node benchmarks/validate.mjs   (validates every task file + the latest run file) */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMAS = join(ROOT, "benchmarks", "schemas");
const loadSchema = (name) => JSON.parse(readFileSync(join(SCHEMAS, name), "utf8"));

const typeOf = (v) => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v);
function typeOk(t, v) { const types = Array.isArray(t) ? t : [t]; return types.some((x) => (x === "integer" ? Number.isInteger(v) : typeOf(v) === x)); }

export function validate(schema, value, path = "$") {
  const errs = [];
  if (schema.oneOf) {
    const passes = schema.oneOf.filter((s) => validate(s, value).length === 0);
    if (passes.length !== 1) errs.push(`${path}: matched ${passes.length} of oneOf (need exactly 1)`);
    return errs;
  }
  if (schema.type && !typeOk(schema.type, value)) { errs.push(`${path}: expected ${schema.type}, got ${typeOf(value)}`); return errs; }
  if (schema.enum && !schema.enum.includes(value)) errs.push(`${path}: "${value}" not in [${schema.enum.join(", ")}]`);
  if (schema.minLength != null && typeof value === "string" && value.length < schema.minLength) errs.push(`${path}: shorter than ${schema.minLength}`);
  if (typeOf(value) === "object") {
    for (const req of schema.required || []) if (!(req in value)) errs.push(`${path}: missing required "${req}"`);
    for (const [k, sub] of Object.entries(schema.properties || {})) if (k in value) errs.push(...validate(sub, value[k], `${path}.${k}`));
  }
  if (typeOf(value) === "array" && schema.items) for (let i = 0; i < value.length; i++) errs.push(...validate(schema.items, value[i], `${path}[${i}]`));
  return errs;
}

export const schemas = { task: () => loadSchema("task.schema.json"), run: () => loadSchema("run.schema.json"),
  score: () => loadSchema("score.schema.json"), response: () => loadSchema("response.schema.json") };

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const taskSchema = loadSchema("task.schema.json");
  let bad = 0, n = 0;
  const TASKS = join(ROOT, "benchmarks", "tasks");
  for (const skill of ["dnd-build", "dnd-check", "dnd-lookup", "dnd-help"]) {
    const dir = join(TASKS, skill); if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
      n++; const errs = validate(taskSchema, JSON.parse(readFileSync(join(dir, f), "utf8")));
      if (errs.length) { bad++; console.error(`${skill}/${f}: ${errs.join("; ")}`); }
    }
  }
  const RES = join(ROOT, "benchmarks", "results");
  const runFiles = existsSync(RES) ? readdirSync(RES).filter((f) => f.startsWith("runs.") && f.endsWith(".json")).sort() : [];
  if (runFiles.length) {
    const runSchema = loadSchema("run.schema.json");
    const runs = JSON.parse(readFileSync(join(RES, runFiles[runFiles.length - 1]), "utf8")).runs;
    for (const r of runs) { const errs = validate(runSchema, r); if (errs.length) { bad++; console.error(`run ${r.key}: ${errs.join("; ")}`); } }
    console.log(`validated ${runs.length} run records from ${runFiles[runFiles.length - 1]}`);
  }
  console.log(bad ? `SCHEMA VALIDATION FAILED: ${bad} invalid` : `schema validation OK: ${n} tasks valid`);
  process.exit(bad ? 1 : 0);
}
