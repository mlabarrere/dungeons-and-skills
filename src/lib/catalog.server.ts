// Assemblage du catalogue cote SERVEUR uniquement (source unique : docs/data/).
// Renvoie la forme attendue par le moteur docs/_engine (identique a loadCatalogNode()).
import "server-only";
import type { Catalog } from "@engine/resolver.d.mts";

import classes from "@catalog/classes.json";
import subclasses from "@catalog/subclasses.json";
import species from "@catalog/species.json";
import backgrounds from "@catalog/backgrounds.json";
import feats from "@catalog/feats.json";
import equipment from "@catalog/equipment.json";
import spells from "@catalog/spells.json";
import spellsByClass from "@catalog/spells-by-class.json";
import languages from "@catalog/languages.json";
import conditions from "@catalog/conditions.json";
import graph from "@catalog/build-graph.json";

/** Catalogue complet (serveur) — ne jamais passer tel quel a un composant client. */
export function getCatalog(): Catalog {
  return {
    classes, subclasses, species, backgrounds, feats, equipment,
    spells, spellsByClass, languages, conditions, graph,
  } as unknown as Catalog;
}

/** Version allegee pour le client : sorts reduits a l'index utile (options/nom). */
export function buildClientCatalog(cat: Catalog): Catalog {
  const slimSpells = (cat.spells as Array<Record<string, unknown>>).map((s) => ({
    id: s.id, name: s.name, level: s.level, school: s.school,
    ritual: s.ritual, concentration: s.concentration, classes: s.classes,
  }));
  return { ...cat, spells: slimSpells as Catalog["spells"] };
}
