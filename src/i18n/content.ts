// Couche de libellés de CONTENU (noms d'entités / de sorts).
// Aujourd'hui : renvoie le nom FR du catalogue. Demain : superposer un overlay
// `content/<locale>.json` (id -> libellé) SANS toucher au moteur ni aux ids.
// Isomorphe (client + serveur), aucune dépendance Node.
import type { Locale } from "./config";

// Overlays de traduction par locale (id d'entité/sort -> libellé). Vide pour l'instant.
const OVERLAYS: Partial<Record<Locale, Record<string, string>>> = {
  // en: { druide: "Druid", clerc: "Cleric", ... }
};

/** Libellé affiché pour un id de contenu ; retombe sur le nom FR fourni par le catalogue. */
export function label(id: string, frName: string, locale: Locale): string {
  return OVERLAYS[locale]?.[id] ?? frName;
}
