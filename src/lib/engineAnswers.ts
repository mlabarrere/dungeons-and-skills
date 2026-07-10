// Prépare les `answers` pour le moteur : somme le bonus d'historique dans abilityScores.
// L'UI édite les scores de BASE (answers.abilityScores) et le bonus séparément
// (answers["bonus-historique"]) ; le moteur reçoit la somme.
import type { Answers, AbilityScores, AbilityKey } from "@engine/resolver.d.mts";

const ABIL: AbilityKey[] = ["for", "dex", "con", "int", "sag", "cha"];

export function toEngineAnswers(answers: Answers): Answers {
  const base = answers.abilityScores;
  const bonus = answers["bonus-historique"] as Partial<Record<AbilityKey, number>> | undefined;
  if (!base || !bonus) return answers;
  const summed = {} as AbilityScores;
  for (const a of ABIL) summed[a] = (base[a] ?? 10) + (bonus[a] ?? 0);
  return { ...answers, abilityScores: summed };
}
