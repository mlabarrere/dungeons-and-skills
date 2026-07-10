/* Types manuels pour resolver.mjs (moteur JS pur). Consommes par l'app Next.js.
   Volontairement pragmatiques : le catalogue est large, on type l'utile. */

export type AbilityKey = "for" | "dex" | "con" | "int" | "sag" | "cha";
export type AbilityScores = Record<AbilityKey, number>;

/** Un effet typé d'entité (grants / effect / requiresChoice / requires). */
export interface Effect {
  type: "grants" | "effect" | "requiresChoice" | "requires";
  what?: string;
  value?: string;
  spell?: string;
  list?: string;
  ability?: string;
  count?: number | string;
  die?: number;
  level?: number;
  minLevel?: number;
  range?: string;
  id?: string;
  name?: string;
  kind?: string;
  from?: unknown;
  [k: string]: unknown;
}

/** Requête d'options d'un choix (11 formes possibles) ou liste explicite. */
export type FromQuery =
  | string[]
  | {
      fromList?: string[];
      fromSkillSet?: string[] | string;
      fromLanguages?: "courante" | "rare" | string;
      fromSpellList?: string;
      fromToolSet?: string[] | string;
      fromFeatCategory?: string;
      fromChoice?: string;
      fromCompetencesOuOutils?: string;
      fromSpellSchools?: string[] | string;
      fromSpellTag?: string;
      fromWeaponMastery?: string;
      level?: number;
      minLevel?: number;
      maxLevel?: number;
      catalog?: string;
      subclassesOf?: string;
      lineagesOf?: string;
      list?: string[];
      [k: string]: unknown;
    };

export interface Choice {
  id: string;
  kind: string;
  count?: number | string;
  from?: FromQuery;
  optionsFrom?: FromQuery;
  appliesEffects?: Record<string, Effect[]>;
  grantsEach?: Effect;
  rule?: string;
  note?: string;
  level?: number;
  dedupe?: boolean;
}

export interface Entity {
  id: string;
  name: string;
  ref?: string;
  effects?: Effect[];
  choices?: Choice[];
  recommends?: Array<{ kind: string; ids?: string[]; value?: string; list?: string }>;
  [k: string]: unknown;
}

/** Nœud du graphe de création (build-graph.json). */
export interface GraphNode {
  id: string;
  type: "single" | "ability-scores" | "ability-bonus" | "aggregate-choices" | "text" | "compute";
  label: string;
  optionsFrom?: FromQuery;
  when?: Record<string, unknown>;
  kind?: string;
  produces?: string;
  dependsOn?: string[];
  fromChoicesOf?: string;
  showRecommendations?: boolean;
  dedupeAgainstGranted?: boolean;
  expandFeatChoices?: boolean;
  optional?: boolean;
  note?: string;
}
export interface GraphStep { id: string; label: string; when?: Record<string, unknown>; nodes: GraphNode[]; }
export interface AbilityMethod {
  id: string; label: string;
  values?: number[]; budget?: number; costs?: Record<string, number>;
  min?: number; max?: number; roll?: string; count?: number;
}
export interface BuildGraph {
  id: string; label: string; level: number; ref?: string; note?: string;
  abilityMethods: AbilityMethod[]; steps: GraphStep[];
}

export interface Catalog {
  classes: Entity[];
  subclasses: Entity[];
  species: Entity[];
  backgrounds: Entity[];
  feats: Entity[];
  equipment: Record<string, Array<Record<string, unknown> & { id: string; name: string }>>;
  spells: Array<Record<string, unknown> & { id: string; name: string; level?: number; school?: string; ritual?: boolean }>;
  spellsByClass: Record<string, Array<{ id: string; level: number }>>;
  languages: { courantes: Array<{ name: string }>; rares: Array<{ name: string }>; ref?: string };
  conditions: unknown;
  graph: BuildGraph;
}

/** Réponses du joueur (objet plat attendu par le resolver). */
export interface Answers {
  _id?: string;
  nom?: string;
  alignement?: string;
  classe?: string;
  "sous-classe"?: string;
  espece?: string;
  lignage?: string;
  historique?: string;
  methode?: string;
  abilityScores?: AbilityScores;
  equipment?: unknown[];
  [choiceId: string]: unknown;
}

export interface Option { id: string; name: string; }

export interface PendingChoice extends Choice {
  sourceId: string;
  sourceLabel: string;
  satisfied: boolean;
  need: number;
  options: Option[];
  recommendations: string[];
}

export interface Source {
  id: string; kind: string; label: string; ref?: string;
  effects: Effect[]; choices: Choice[]; recommends: unknown[]; entity?: Entity | null;
  featClass?: string | null;
}

/** Modèle de personnage (consommé par computeCharacter). */
export interface CharacterModel {
  id: string;
  identity: {
    name: string; level: number; className: string | null; species: string | null;
    lineage: string | null; background: string | null; alignment: string | null;
  };
  abilityScores: AbilityScores;
  sources: Array<{ id: string; kind: string; label: string; ref?: string; effects: Effect[] }>;
  choices: Array<{ id: string; satisfies: string; value: unknown; status: string; effects: Effect[] }>;
  equipment: unknown[];
  spells: { cantrips: SpellEntry[]; prepared: SpellEntry[] };
}
export interface SpellEntry { id: string; label: string; list: string; origin: string; status: string; sourceId: string; }

export function byId<T extends { id: string }>(list: T[] | undefined, id: string): T | null;
export const SKILLS: string[];
export const KIND_BUCKET: Record<string, string>;
export const OTHER_KINDS: string[];
export function resolveCount(choice: Choice): number;
export function selectedSources(catalog: Catalog, answers: Answers): Source[];
export function grantedSet(catalog: Catalog, answers: Answers, what: string): Set<string>;
export function optionsFor(catalog: Catalog, answers: Answers, choice: Choice): Option[];
export function pendingChoices(catalog: Catalog, answers: Answers): PendingChoice[];
export function fixedNodeOptions(catalog: Catalog, answers: Answers, node: GraphNode): Option[];
export function isSpellcaster(catalog: Catalog, answers: Answers): boolean;
export function nodeApplies(catalog: Catalog, answers: Answers, node: GraphNode | GraphStep): boolean;
export function toCharacterModel(catalog: Catalog, answers: Answers): CharacterModel;
export function normId(s: string): string;
export function loadCatalogNode(): Promise<Catalog>;
