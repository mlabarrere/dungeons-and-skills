// Perso de démonstration (Medicis, druide) — `answers` du moteur docs/_engine.
// Identique au cas golden (docs/_engine/golden-test.mjs) : reconstruit la fiche de référence.
import type { StoredCharacter } from "@/lib/store";

export const medicisSeed: StoredCharacter = {
  _id: "medicis",
  nom: "Medicis",
  answers: {
    _id: "medicis",
    nom: "Medicis",
    classe: "druide",
    espece: "elfe",
    lignage: "elfe-sylvestre",
    historique: "guide",
    alignement: "Neutre bon",
    methode: "des",
    abilityScores: { for: 10, dex: 11, con: 14, int: 14, sag: 17, cha: 14 },
    "druide-competences": ["dressage", "nature"],
    "elfe-sens-aiguises": ["perception"],
    "druide-ordre-primitif": "mage",
    "druide-cantrips": ["flammes"],
    "druide-prepares": ["amitie-avec-les-animaux", "lueurs-feeriques", "soins", "vague-tonnante"],
    "initie-a-la-magie-liste": "druide",
    "initie-a-la-magie-carac": "sag",
    "origine-langues-choix": ["elfique", "geant"],
    "druide-equipement": "A",
    "guide-equipement": "A",
  },
};
