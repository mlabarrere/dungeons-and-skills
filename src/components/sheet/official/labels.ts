// Dictionnaire i18n de la fiche officielle D&D 2024 (réplique fidèle des 2 PDF).
// Aucune chaîne n'est écrite en dur dans les composants : tout passe par ici.
// Les listes de compétences sont ordonnées EXACTEMENT comme sur chaque fiche
// officielle (l'ordre diffère entre EN et FR — cf. docs/_analysis/character_sheet).

export type Locale = "en" | "fr";

/** Une caractéristique = un bloc de compétences sous elle. */
export interface AbilityBlock {
  /** clé stable, indépendante de la langue (utilisée pour les `key` React) */
  key: "str" | "dex" | "con" | "int" | "wis" | "cha";
  name: string;
  /** compétences listées sous cette caractéristique (dans l'ordre de la fiche) */
  skills: string[];
}

export interface SheetLabels {
  /** libellé de la langue pour le sélecteur */
  langName: string;
  wordmark: string; // "DUNGEONS & DRAGONS"

  // En-tête
  characterName: string;
  background: string;
  class: string;
  species: string;
  subclass: string;
  level: string;
  xp: string;

  // Bloc combat
  armorClass: string;
  shield: string;
  hitPoints: string;
  current: string;
  temp: string;
  max: string;
  hitDice: string;
  spent: string;
  deathSaves: string;
  successes: string;
  failures: string;

  // Barre d'infos
  proficiencyBonus: string;
  initiative: string;
  speed: string;
  size: string;
  passivePerception: string;

  // Caractéristiques
  modifier: string;
  score: string;
  savingThrow: string;
  heroicInspiration: string;
  /** les 6 caractéristiques dans l'ordre : gauche (STR/DEX/CON) puis centre (INT/WIS/CHA) */
  abilitiesLeft: AbilityBlock[];
  abilitiesRight: AbilityBlock[];

  // Blocs de droite (page 1)
  weaponsTitle: string;
  weaponName: string;
  atkBonusDc: string;
  damageType: string;
  notes: string;
  classFeatures: string;
  speciesTraits: string;
  feats: string;

  // Formations & maîtrises
  equipmentTraining: string;
  armorTraining: string;
  armorLight: string;
  armorMedium: string;
  armorHeavy: string;
  armorShields: string;
  weapons: string;
  tools: string;

  // Page 2 — incantation
  appearance: string;
  spellcastingAbility: string;
  spellcastingModifier: string;
  spellSaveDc: string;
  spellAttackBonus: string;
  spellSlots: string;
  levelWord: string; // "Level" / "Niveau" (pour "Level 1"…)
  spellSlotLevels: string[]; // labels "Level 1"..."Level 9" (localisés, ordinaux FR)
  total: string;
  expended: string;

  // Table sorts préparés
  preparedSpellsTitle: string;
  spellLevel: string;
  castingTime: string;
  range: string;
  concentrationRitualMaterial: string;
  crm: { c: string; r: string; m: string }; // marqueurs Concentration / Rituel / Matériel

  // Bloc personnage (droite page 2)
  backstory: string;
  alignment: string;
  languages: string;
  equipment: string;
  attunement: string;
  coins: string;
  coinLabels: string[]; // PC/PA/PE/PO/PP ou CP/SP/EP/GP/PP

  copyright: string;
}

const skillsEnDefault = {
  str: ["Athletics"],
  dex: ["Acrobatics", "Sleight of Hand", "Stealth"],
  int: ["Arcana", "History", "Investigation", "Nature", "Religion"],
  wis: ["Animal Handling", "Insight", "Medicine", "Perception", "Survival"],
  cha: ["Deception", "Intimidation", "Performance", "Persuasion"],
};

const en: SheetLabels = {
  langName: "English",
  wordmark: "DUNGEONS & DRAGONS",

  characterName: "Character Name",
  background: "Background",
  class: "Class",
  species: "Species",
  subclass: "Subclass",
  level: "Level",
  xp: "XP",

  armorClass: "Armor Class",
  shield: "Shield",
  hitPoints: "Hit Points",
  current: "Current",
  temp: "Temp",
  max: "Max",
  hitDice: "Hit Dice",
  spent: "Spent",
  deathSaves: "Death Saves",
  successes: "Successes",
  failures: "Failures",

  proficiencyBonus: "Proficiency Bonus",
  initiative: "Initiative",
  speed: "Speed",
  size: "Size",
  passivePerception: "Passive Perception",

  modifier: "Modifier",
  score: "Score",
  savingThrow: "Saving Throw",
  heroicInspiration: "Heroic Inspiration",
  abilitiesLeft: [
    { key: "str", name: "Strength", skills: skillsEnDefault.str },
    { key: "dex", name: "Dexterity", skills: skillsEnDefault.dex },
    { key: "con", name: "Constitution", skills: [] },
  ],
  abilitiesRight: [
    { key: "int", name: "Intelligence", skills: skillsEnDefault.int },
    { key: "wis", name: "Wisdom", skills: skillsEnDefault.wis },
    { key: "cha", name: "Charisma", skills: skillsEnDefault.cha },
  ],

  weaponsTitle: "Weapons & Damage Cantrips",
  weaponName: "Name",
  atkBonusDc: "Atk Bonus / DC",
  damageType: "Damage & Type",
  notes: "Notes",
  classFeatures: "Class Features",
  speciesTraits: "Species Traits",
  feats: "Feats",

  equipmentTraining: "Equipment Training & Proficiencies",
  armorTraining: "Armor Training",
  armorLight: "Light",
  armorMedium: "Medium",
  armorHeavy: "Heavy",
  armorShields: "Shields",
  weapons: "Weapons",
  tools: "Tools",

  appearance: "Appearance",
  spellcastingAbility: "Spellcasting Ability",
  spellcastingModifier: "Spellcasting Modifier",
  spellSaveDc: "Spell Save DC",
  spellAttackBonus: "Spell Attack Bonus",
  spellSlots: "Spell Slots",
  levelWord: "Level",
  spellSlotLevels: [
    "Level 1", "Level 2", "Level 3", "Level 4", "Level 5",
    "Level 6", "Level 7", "Level 8", "Level 9",
  ],
  total: "Total",
  expended: "Expended",

  preparedSpellsTitle: "Cantrips & Prepared Spells",
  spellLevel: "Level",
  castingTime: "Casting Time",
  range: "Range",
  concentrationRitualMaterial: "Concentration, Ritual & Required Material",
  crm: { c: "C", r: "R", m: "M" },

  backstory: "Backstory & Personality",
  alignment: "Alignment",
  languages: "Languages",
  equipment: "Equipment",
  attunement: "Magic Item Attunement",
  coins: "Coins",
  coinLabels: ["CP", "SP", "EP", "GP", "PP"],

  copyright:
    "TM & © 2024 Wizards of the Coast LLC. Illustrations by Richard Whitters.",
};

const fr: SheetLabels = {
  langName: "Français",
  wordmark: "DUNGEONS & DRAGONS",

  characterName: "Nom du personnage",
  background: "Historique",
  class: "Classe",
  species: "Espèce",
  subclass: "Sous-classe",
  level: "Niveau",
  xp: "PX",

  armorClass: "Classe d’armure",
  shield: "Bouclier",
  hitPoints: "Points de vie",
  current: "Actuels",
  temp: "Temp.",
  max: "Max.",
  hitDice: "Dés de vie",
  spent: "Dépensés",
  deathSaves: "JS c. mort",
  successes: "Réussites",
  failures: "Échecs",

  proficiencyBonus: "Bonus de maîtrise",
  initiative: "Initiative",
  speed: "Vitesse",
  size: "Cat. de taille",
  passivePerception: "Perception passive",

  modifier: "Modificateur",
  score: "Valeur",
  savingThrow: "Jet de sauvegarde",
  heroicInspiration: "Inspiration héroïque",
  abilitiesLeft: [
    { key: "str", name: "Force", skills: ["Athlétisme"] },
    { key: "dex", name: "Dextérité", skills: ["Acrobaties", "Discrétion", "Escamotage"] },
    { key: "con", name: "Constitution", skills: [] },
  ],
  abilitiesRight: [
    { key: "int", name: "Intelligence", skills: ["Arcanes", "Histoire", "Investigation", "Nature", "Religion"] },
    { key: "wis", name: "Sagesse", skills: ["Dressage", "Intuition", "Médecine", "Perception", "Survie"] },
    { key: "cha", name: "Charisme", skills: ["Intimidation", "Persuasion", "Représentation", "Tromperie"] },
  ],

  weaponsTitle: "Armes et sorts mineurs offensifs",
  weaponName: "Nom",
  atkBonusDc: "Bonus att. / DD",
  damageType: "Dégâts et type",
  notes: "Notes",
  classFeatures: "Aptitudes de classe",
  speciesTraits: "Traits d’espèce",
  feats: "Dons",

  equipmentTraining: "Formations et maîtrises d’équipement",
  armorTraining: "Formation aux armures",
  armorLight: "Légères",
  armorMedium: "Intermédiaires",
  armorHeavy: "Lourdes",
  armorShields: "Boucliers",
  weapons: "Armes",
  tools: "Outils",

  appearance: "Aspect",
  spellcastingAbility: "Caractéristique d’incantation",
  spellcastingModifier: "Mod. car. d’incantation",
  spellSaveDc: "DD de sauvegarde des sorts",
  spellAttackBonus: "Bonus d’att. de sort",
  spellSlots: "Emplacements de sort",
  levelWord: "Niveau",
  spellSlotLevels: [
    "1er niveau", "2e niveau", "3e niveau", "4e niveau", "5e niveau",
    "6e niveau", "7e niveau", "8e niveau", "9e niveau",
  ],
  total: "Total",
  expended: "Dépensés",

  preparedSpellsTitle: "Sorts mineurs et préparés",
  spellLevel: "Niveau",
  castingTime: "Temps d’incantation",
  range: "Portée",
  concentrationRitualMaterial: "Concentration, rituel et composantes requises",
  crm: { c: "C", r: "R", m: "M" },

  backstory: "Passé et personnalité",
  alignment: "Alignement",
  languages: "Langues",
  equipment: "Équipement",
  attunement: "Harmonisation (objets magiques)",
  coins: "Monnaie",
  coinLabels: ["PC", "PA", "PE", "PO", "PP"],

  copyright:
    "TM & © 2025 Wizards of the Coast LLC. Illustrations de Richard Whitters.",
};

export const LABELS: Record<Locale, SheetLabels> = { en, fr };
