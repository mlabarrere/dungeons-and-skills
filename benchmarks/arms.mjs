/* The two arms under test. Same task, same required output format; the only
   difference is whether the model is told to ground itself in the catalog/engine. */

export const OUTPUT_FORMAT = `Output ONLY a single JSON object, no prose, in exactly this shape:
{
  "class": string, "species": string, "lineage": string|null, "background": string,
  "abilityScores": { "for": n, "dex": n, "con": n, "int": n, "sag": n, "cha": n },
  "proficiencyBonus": n,
  "armorClass": n,
  "hitPoints": n,
  "passivePerception": n,
  "savingThrowProficiencies": [ability abbreviations],
  "skillProficiencies": [skill names],
  "cantrips": [spell names], "preparedSpells": [spell names],
  "fightingStyle": string|null
}`;

/** BARE arm: answer from the model's own knowledge — the control. */
export function barePrompt(task) {
  return `${task.brief}

Answer from your own knowledge of the rules. Do not use any tools, files, or external data.

${OUTPUT_FORMAT}`;
}

/** GROUNDED arm: the grounding rule + use the bundled catalog/engine. */
export function groundedPrompt(task) {
  return `Do NOT trust your training data. Your training data blends D&D editions (3.5, 5e 2014,
5.5/2024, Pathfinder) into plausible-but-wrong rules. Every value must come from the bundled
catalog (data/*.json), never from memory. When code execution is available, run engine/cli.mjs
to enumerate legal options and to compute AC, HP, save DCs and spell counts — never compute by
hand. Offer only options the resolver returns. If something is not in the catalog, do not invent
it.

${task.brief}

${OUTPUT_FORMAT}`;
}

export const ARMS = {
  bare: barePrompt,
  grounded: groundedPrompt,
};
