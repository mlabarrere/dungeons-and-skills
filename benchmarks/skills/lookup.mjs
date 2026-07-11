/* skills/lookup.mjs — scorer for dnd-lookup (catalogue Q&A).
   The task declares its own oracle: a mode (list | exists | fact), the expected catalogue
   ids, and whether the thing exists at all. We reward exact catalogue-grounded answers,
   penalise omissions (recall) and items foreign to the catalogue / not asked for (precision),
   and reward correctly recognising that information is absent. */
import { resolve } from "../lib.mjs";
import { makeError } from "../taxonomy.mjs";

const GROUPS = ["spells", "feats", "classes", "species", "backgrounds", "skills"];
function resolveAny(index, name) {
  for (const g of GROUPS) { const id = resolve(index, g, name); if (id) return id; }
  return null;
}
const arr = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);

export function score(env, task, response) {
  const o = task.oracle || {};
  const resp = response || {};
  const units = [], errors = [];
  const E = (x) => errors.push(makeError({ task_id: task.id, skill: "dnd-lookup", ...x }));

  // Negative question: the correct answer is "not in the catalogue".
  if (o.mode === "exists" && o.exists === false) {
    const declined = !!resp.not_found && arr(resp.items).length === 0;
    units.push({ id: "recognition", type: "factual-claim", status: declined ? "correct" : "incorrect" });
    if (!declined) E({ category: "lookup-false-positive", field: "items", observed: arr(resp.items).join(",") || resp.answer, evidence: "claimed something that is not in the catalogue" });
    return { units, errors };
  }

  const expected = new Set((o.expected || []).map((x) => String(x)));
  const returned = arr(resp.items).map((n) => ({ name: n, id: resolveAny(env.index, n) }));
  const returnedIds = new Set(returned.filter((r) => r.id).map((r) => r.id));

  // Recall: each expected item present?
  for (const id of expected) {
    const found = returnedIds.has(id);
    units.push({ id: `exp:${id}`, type: "factual-claim", status: found ? "correct" : "missing" });
    if (!found) E({ category: "lookup-omission", field: "items", expected: id, evidence: "expected catalogue entry missing from the answer" });
  }
  // Precision: returned items not expected.
  for (const r of returned) {
    if (r.id && expected.has(r.id)) continue;
    if (!r.id) { units.push({ id: `inv:${r.name}`, type: "factual-claim", status: "extraneous" }); E({ category: "invented-entity", field: "items", observed: r.name, evidence: "item not found in the catalogue" }); }
    else { units.push({ id: `extra:${r.id}`, type: "factual-claim", status: "extraneous" }); E({ category: "lookup-false-positive", field: "items", observed: r.id, evidence: "item not part of the correct answer set" }); }
  }
  return { units, errors };
}
