/* taxonomy.mjs — stable error categories, severities and weights.
   Every scored error references one of these categories. Severities are the DEFAULT
   for a category; a scorer may override per event (e.g. a brief-violation of a central
   constraint is critical). Weights feed the weighted error rate; the denominator is
   documented in scoring.mjs. */

export const SEVERITY_WEIGHT = { minor: 1, significant: 3, critical: 5 };
export const weightOf = (severity) => SEVERITY_WEIGHT[severity] ?? SEVERITY_WEIGHT.significant;

/** The 25 stable categories (spec §7) with their default severity. */
export const CATEGORY_SEVERITY = {
  "brief-violation": "significant",
  "missing-required-field": "significant",
  "extraneous-content": "minor",
  "illegal-choice": "critical",
  "invented-rule": "critical",
  "invented-entity": "critical",
  "wrong-edition": "critical",
  "wrong-value": "significant",
  "arithmetic-error": "significant",
  "derived-stat-error": "significant",
  "wrong-count": "significant",
  "dependency-error": "significant",
  "language-resolution-error": "minor",
  "lookup-omission": "significant",
  "lookup-false-positive": "significant",
  "unsupported-claim": "significant",
  "tool-not-used": "significant",
  "wrong-tool": "significant",
  "tool-result-misread": "critical",
  "skill-selection-error": "critical",
  "procedure-error": "significant",
  "false-positive-check": "critical",
  "false-negative-check": "significant",
  "correction-error": "critical",
  "format-contract-error": "minor",
};

export const CATEGORIES = Object.keys(CATEGORY_SEVERITY);
export const severityOf = (category) => CATEGORY_SEVERITY[category] || "significant";

let _seq = 0;
/** Build a taxonomy error event (spec §7 shape). */
export function makeError({ task_id, skill, category, field, expected, observed, evidence,
  severity, root_cause = true, parent_error_id = null }) {
  if (!CATEGORY_SEVERITY[category]) throw new Error(`unknown error category: ${category}`);
  const sev = severity || severityOf(category);
  return {
    error_id: `${task_id || "t"}#${category}#${++_seq}`,
    task_id: task_id || null,
    skill: skill || null,
    category,
    severity: sev,
    weight: weightOf(sev),
    field: field ?? null,
    expected: expected ?? null,
    observed: observed ?? null,
    evidence: evidence ?? null,
    root_cause,
    parent_error_id,
  };
}

export const resetErrorSeq = () => { _seq = 0; };
