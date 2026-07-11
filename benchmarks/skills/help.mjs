/* skills/help.mjs — scorer for dnd-help (routing / procedure guidance).
   The task declares the acceptable skill(s), the key procedure tokens the answer should
   contain, whether the right move is to ask for missing info, and whether it is out of
   scope. We score skill selection, procedure coverage, and the grounding reflex. */
import { makeError } from "../taxonomy.mjs";

const arr = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);
const norm = (s) => String(s || "").toLowerCase();

export function score(env, task, response) {
  const o = task.oracle || {};
  const resp = response || {};
  const units = [], errors = [];
  const E = (x) => errors.push(makeError({ task_id: task.id, skill: "dnd-help", ...x }));

  // Skill selection.
  const acceptable = new Set((o.acceptable || (o.expected_skill ? [o.expected_skill] : [])).map(norm));
  const chosen = norm(resp.skill);
  const selOk = acceptable.has(chosen) || (o.out_of_scope && (chosen === "none" || chosen === "" || !!resp.needs_more_info));
  units.push({ id: "skill-selection", type: "skill-selection", status: selOk ? "correct" : "incorrect" });
  if (!selOk) E({ category: "skill-selection-error", field: "skill", expected: [...acceptable].join("|") || "none", observed: resp.skill, evidence: "wrong skill routed" });

  // Procedure coverage: the answer should mention the key steps/tokens.
  const hay = norm([resp.answer, ...(arr(resp.steps))].join(" \n "));
  for (const tok of (o.require_step_tokens || [])) {
    const present = hay.includes(norm(tok));
    units.push({ id: `step:${tok}`, type: "procedure-step", status: present ? "correct" : "missing" });
    if (!present) E({ category: "procedure-error", field: "steps", expected: tok, evidence: "missing a required step in the guidance" });
  }
  // Forbidden claims (e.g. inventing a CLI flag / telling the user to answer from memory).
  for (const tok of (o.forbid_tokens || [])) {
    if (hay.includes(norm(tok))) { units.push({ id: `forbid:${tok}`, type: "procedure-step", status: "incorrect" }); E({ category: "invented-rule", field: "steps", observed: tok, evidence: "suggested a non-existent instruction or bypassed grounding" }); }
  }
  // Clarification reflex.
  if (o.clarify != null) {
    const ok = !!resp.needs_more_info === !!o.clarify;
    units.push({ id: "clarify", type: "procedure-step", status: ok ? "correct" : "incorrect" });
    if (!ok) E({ category: "procedure-error", field: "needs_more_info", expected: o.clarify, observed: !!resp.needs_more_info, evidence: o.clarify ? "should have asked for the missing detail" : "asked for info that was already given" });
  }
  return { units, errors };
}
