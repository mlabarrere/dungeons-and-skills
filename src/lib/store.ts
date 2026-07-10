// Persistance locale (localStorage) des personnages. Un perso = { _id, nom, answers }
// où `answers` est l'objet plat consommé par le moteur docs/_engine.
import type { Answers } from "@engine/resolver.d.mts";
import { medicisSeed } from "@/data/characters/medicis.seed";

export interface StoredCharacter {
  _id: string;
  nom: string;
  answers: Answers;
}

const KEY = "grimoire.characters.v3";

export function loadAll(): StoredCharacter[] {
  if (typeof window === "undefined") return [medicisSeed];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [medicisSeed];
    const parsed = JSON.parse(raw) as StoredCharacter[];
    return Array.isArray(parsed) && parsed.length ? parsed : [medicisSeed];
  } catch {
    return [medicisSeed];
  }
}

export function saveAll(chars: StoredCharacter[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(chars));
}

export function upsert(chars: StoredCharacter[], c: StoredCharacter): StoredCharacter[] {
  const i = chars.findIndex((x) => x._id === c._id);
  const next = i >= 0 ? chars.map((x) => (x._id === c._id ? c : x)) : [...chars, c];
  saveAll(next);
  return next;
}

export function remove(chars: StoredCharacter[], id: string): StoredCharacter[] {
  const next = chars.filter((x) => x._id !== id);
  saveAll(next);
  return next;
}

export function blankCharacter(): StoredCharacter {
  return { _id: `perso-${Date.now().toString(36)}`, nom: "Nouveau personnage", answers: {} };
}
