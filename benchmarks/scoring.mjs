/* scoring.mjs — atomic-unit scoring with EXPLICIT denominators.

   A task declares a set of verifiable "units". Each unit ends up in one status:
     correct | incorrect | missing | extraneous | not-applicable | not-scorable
   Scorable = {correct, incorrect, missing, extraneous}. not-applicable and
   not-scorable are EXCLUDED from every denominator (spec §6.2).

   From the units + the taxonomy error events, computeMetrics derives every rate the
   report needs, each with a named, documented denominator. No percentage without one. */
import { weightOf } from "./taxonomy.mjs";

export const UNIT_STATUS = ["correct", "incorrect", "missing", "extraneous", "not-applicable", "not-scorable"];
export const ERRONEOUS = new Set(["incorrect", "missing", "extraneous"]);
export const isScorable = (u) => ERRONEOUS.has(u.status) || u.status === "correct";

/** Worst-case severity a unit of this type can carry — the per-unit cap for the
    weighted denominator (documented). Defaults to "significant" when unlisted. */
export const UNIT_MAX_SEVERITY = {
  species: "critical", class: "critical", background: "significant",
  "ability-score": "significant", modifier: "significant",
  "hit-points": "critical", "armor-class": "critical", "proficiency-bonus": "significant",
  initiative: "minor", "passive-perception": "significant",
  "saving-throw": "significant", skill: "significant", tool: "minor", language: "minor",
  equipment: "significant", feature: "significant", spell: "significant", prerequisite: "significant",
  "brief-constraint": "critical", "factual-claim": "significant", "procedure-step": "significant",
  "skill-selection": "critical",
};
const unitCapWeight = (u) => weightOf(UNIT_MAX_SEVERITY[u.type] || "significant");

const pct = (num, den) => (den > 0 ? (100 * num) / den : 0);

/**
 * @param {Array} units  [{id,type,status}]
 * @param {Array} errors  taxonomy error events (from makeError)
 * @returns metrics with explicit denominators
 */
export function computeMetrics(units, errors) {
  const scorable = units.filter(isScorable);
  const erroneous = units.filter((u) => ERRONEOUS.has(u.status));
  const total_scorable = scorable.length;

  // Atomic error rate: erroneous scorable units / total scorable units.
  const atomic_error_rate = pct(erroneous.length, total_scorable);

  // Weighted error rate: observed error weight / maximum applicable weight.
  // Denominator = Σ over scorable units of that unit type's worst-case weight.
  const maximum_applicable_weighted_error = scorable.reduce((s, u) => s + unitCapWeight(u), 0);
  const observed_weighted_error = errors.reduce((s, e) => s + (e.weight || 0), 0);
  const weighted_error_rate = pct(observed_weighted_error, maximum_applicable_weighted_error);

  const rootCauses = errors.filter((e) => e.root_cause);
  const symptoms = errors.filter((e) => !e.root_cause);
  const critical = errors.filter((e) => e.severity === "critical");

  const byCategory = {}, bySeverity = { minor: 0, significant: 0, critical: 0 };
  for (const e of errors) {
    byCategory[e.category] = (byCategory[e.category] || 0) + 1;
    bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
  }
  const byUnitStatus = {};
  for (const s of UNIT_STATUS) byUnitStatus[s] = units.filter((u) => u.status === s).length;

  return {
    total_units: units.length,
    total_scorable,
    erroneous_units: erroneous.length,
    atomic_error_rate,
    observed_weighted_error,
    maximum_applicable_weighted_error,
    weighted_error_rate,
    raw_errors: errors.length,
    root_cause_count: rootCauses.length,
    symptom_count: symptoms.length,
    critical_errors: critical.length,
    perfect: erroneous.length === 0,          // zero errors on this response
    invalid: critical.length > 0,             // at least one critical error
    by_category: byCategory,
    by_severity: bySeverity,
    by_unit_status: byUnitStatus,
    denominators: {
      atomic_error_rate: "erroneous scorable units / total scorable units × 100 (not-applicable & not-scorable excluded)",
      weighted_error_rate: "Σ error weights / Σ per-scorable-unit worst-case weights × 100",
    },
  };
}

/** Aggregate a set of per-response metrics into a group summary (spec §6.4). */
export function aggregate(metricsList) {
  const n = metricsList.length;
  if (!n) return { n: 0 };
  const sum = (f) => metricsList.reduce((s, m) => s + f(m), 0);
  const errsPer = metricsList.map((m) => m.erroneous_units).sort((a, b) => a - b);
  const median = errsPer.length % 2 ? errsPer[(errsPer.length - 1) / 2]
    : (errsPer[errsPer.length / 2 - 1] + errsPer[errsPer.length / 2]) / 2;
  const totalScorable = sum((m) => m.total_scorable);
  const totalErroneous = sum((m) => m.erroneous_units);
  return {
    n,
    mean_atomic_error_rate: sum((m) => m.atomic_error_rate) / n,
    pooled_atomic_error_rate: pct(totalErroneous, totalScorable),
    mean_weighted_error_rate: sum((m) => m.weighted_error_rate) / n,
    mean_errors_per_response: totalErroneous / n,
    median_errors_per_response: median,
    perfect_rate: pct(metricsList.filter((m) => m.perfect).length, n),
    invalid_rate: pct(metricsList.filter((m) => m.invalid).length, n),
    total_root_causes: sum((m) => m.root_cause_count),
    total_symptoms: sum((m) => m.symptom_count),
  };
}
