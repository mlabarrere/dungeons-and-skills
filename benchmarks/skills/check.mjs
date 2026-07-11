/* skills/check.mjs — oracle + scorer for dnd-check (the sheet auditor).
   A task carries a valid `base` build and a list of `mutations` (planted, annotated
   errors). The flawed sheet = the correct claim with the mutations applied. The model
   returns `findings`; we match them against the planted mutations to get TP/FP/FN,
   precision/recall/F1, correction correctness — and we penalise invented errors hard. */
import { correctClaim } from "./build.mjs";
import { makeError } from "../taxonomy.mjs";

/** Canonical field synonyms so a model's free-text field maps to the planted field id. */
function normField(f) {
  const s = String(f || "").toLowerCase().trim();
  const abbr = s.match(/^ability-(for|dex|con|int|sag|cha)$/);
  if (abbr) return s;
  if (/\bac\b|armou?r\s*class|armor-class/.test(s)) return "armor-class";
  if (/\bhp\b|hit\s*points?|hit-points/.test(s)) return "hit-points";
  if (/passive|perception passive|passive-perception/.test(s)) return "passive-perception";
  if (/sav(e|ing)|jets? de sauvegarde|saving-throw/.test(s)) return "saving-throws";
  if (/prof(iciency)?\s*bonus|bonus de ma[iî]trise/.test(s)) return "proficiency-bonus";
  if (/cantrip|sort mineur/.test(s)) return "cantrips";
  if (/prepared|pr[eé]par/.test(s)) return "prepared";
  // specific ability names -> ability-<abbr>
  if (/\bstr(ength)?\b|\bforce\b/.test(s)) return "ability-for";
  if (/\bdex(terity)?\b|dext[eé]rit/.test(s)) return "ability-dex";
  if (/\bcon(stitution)?\b/.test(s)) return "ability-con";
  if (/\bint(elligence)?\b/.test(s)) return "ability-int";
  if (/\bwis(dom)?\b|\bsagesse\b/.test(s)) return "ability-sag";
  if (/\bcha(risma)?\b|charisme/.test(s)) return "ability-cha";
  if (/ability|caract[eé]ristique|score/.test(s)) return "ability-scores";
  if (/\bclasse?\b/.test(s)) return "class";
  if (/species|esp[eè]ce|race/.test(s)) return "species";
  if (/skill|comp[eé]tence/.test(s)) return "skills";
  return s;
}

/** Apply planted mutations to the correct claim -> the flawed sheet the model audits. */
export function flawedSheet(env, task) {
  const sheet = structuredClone(correctClaim(env, task.base));
  for (const m of task.mutations || []) applyMutation(sheet, m);
  return sheet;
}
function applyMutation(sheet, m) {
  switch (m.field) {
    case "armor-class": sheet.armorClass = m.to; break;
    case "hit-points": sheet.hitPoints = m.to; break;
    case "passive-perception": sheet.passivePerception = m.to; break;
    case "proficiency-bonus": sheet.proficiencyBonus = m.to; break;
    case "saving-throws": sheet.savingThrowProficiencies = m.to; break;
    case "skills": sheet.skillProficiencies = m.to; break;
    case "cantrips": sheet.cantrips = m.to; break;
    case "prepared": sheet.preparedSpells = m.to; break;
    case "class": sheet.class = m.to; break;
    default: if (m.field.startsWith("ability-")) sheet.abilityScores[m.field.slice(8)] = m.to; break;
  }
}

export function score(env, task, response) {
  const planted = task.mutations || [];
  const findings = (response && response.findings) || [];
  const plantedFields = new Set(planted.map((p) => p.field));
  const units = [], errors = [];
  const E = (o) => errors.push(makeError({ task_id: task.id, skill: "dnd-check", ...o }));

  let tp = 0, fn = 0, fp = 0, correctionsOk = 0, correctionsBad = 0;

  // Recall: was each planted error detected?
  for (const p of planted) {
    const hit = findings.find((f) => normField(f.field) === p.field);
    if (hit) {
      tp++; units.push({ id: `planted:${p.field}`, type: "factual-claim", status: "correct" });
      if (hit.correction !== undefined) {
        const ok = String(hit.correction) === String(p.expected);
        ok ? correctionsOk++ : correctionsBad++;
        if (!ok) E({ category: "correction-error", field: p.field, expected: p.expected, observed: hit.correction, evidence: "proposed correction is wrong" });
      }
    } else {
      fn++; units.push({ id: `planted:${p.field}`, type: "factual-claim", status: "missing" });
      E({ category: "false-negative-check", severity: p.severity || "significant", field: p.field, expected: p.expected, observed: p.to, evidence: `missed a real ${p.category} error` });
    }
  }

  // Precision: findings that don't correspond to a planted error = invented errors (hard penalty).
  for (const f of findings) {
    const nf = normField(f.field);
    if (!plantedFields.has(nf)) {
      fp++; units.push({ id: `finding:${nf}`, type: "factual-claim", status: "extraneous" });
      E({ category: "false-positive-check", field: nf, observed: f.issue || f.field, evidence: "flagged an element that is actually correct" });
    }
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 1;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return { units, errors, extra: { detection: { tp, fp, fn, precision, recall, f1 }, corrections: { ok: correctionsOk, bad: correctionsBad } } };
}
