/* Types manuels pour build-character.mjs. */
import type { AbilityKey, CharacterModel, Effect } from "./resolver.d.mts";

export const ABILITIES: AbilityKey[];

export interface DerivedRow { name: string; value: string | number; status: string; prov: string; }
export interface SaveRow { a: AbilityKey; total: number; prof: boolean; src: string | null; }
export interface SkillRow { name: string; ab: AbilityKey; total: number; prof: boolean; exp: boolean; src: string | null; st: string | null; }
export interface CastingRow { list: string; ability: AbilityKey; dc: number; atk: number; prov: string; }
export interface CounterRow { kind: string; list: string; used: number; allowed: number; }
export interface ComputedSpell { id: string; label?: string; list: string; origin: string; status?: string; sourceId?: string; }
export interface FeatureRow { name: string; level?: number; src: string; st: string; }
export interface Conflict { what: string; a: string; b: string; fix: string; }
export interface Missing { kind: string; count: number; from?: string; src?: string; }
export interface Problem { level: "error" | "warn"; msg: string; }

/** Résultat de computeCharacter (fiche calculée + audit). */
export interface Computed {
  model: CharacterModel;
  lvl: number;
  PB: number;
  scores: Record<string, number> & { note?: string };
  mods: Record<AbilityKey, number>;
  effects: Array<Effect & { _from?: string; _label?: string; _ref?: string; _kind?: string; _status?: string; _via?: string }>;
  saveProf: Record<string, unknown>;
  skillProf: Record<string, unknown>;
  languages: Array<{ v: string; src: string; st: string }>;
  tools: Array<{ v: string; src: string; st: string }>;
  features: FeatureRow[];
  bonusHPPerLevel: number;
  armorTraining: string[];
  hasShieldTraining: boolean;
  casting: Record<string, { ability: AbilityKey; src: string }>;
  castingRows: CastingRow[];
  counters: CounterRow[];
  cantrips: ComputedSpell[];
  prepared: ComputedSpell[];
  conflicts: Conflict[];
  missing: Missing[];
  derived: DerivedRow[];
  saves: SaveRow[];
  skills: SkillRow[];
  problems: Problem[];
}

export function computeCharacter(model: CharacterModel): Computed;
export function renderHTML(C: Computed): string;
