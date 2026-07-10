# Catalogue machine (`docs/data/`)

Couche **données déterministe** dérivée de la doc HTML (`docs/html/`, vue humaine =
source de vérité). Consommée par `docs/_engine/resolver.mjs` (parcours de graphe pur) et
le prototype `docs/html/builder.html`. **Aucune IA** : que des fonctions pures.

## Fichiers

| Fichier | Contenu | Origine |
|---|---|---|
| `spells.json`, `spells-by-class.json` | 391 sorts + listes par classe | auto (`build-catalog-spells.mjs`) |
| `languages.json`, `conditions.json`, `glossary.json` | langues, 15 états, 152 termes | auto (`build-catalog-refs.mjs`) |
| `classes.json` | 12 classes (niveau 1) | authoring depuis `classes/*.html` |
| `subclasses.json` | 48 sous-classes | authoring |
| `species.json` | 10 espèces + lignages | authoring depuis `especes/*.html` |
| `backgrounds.json` | 16 historiques | authoring depuis `historiques/*.html` |
| `feats.json` | 75 dons | authoring depuis `dons/*.html` |
| `equipment.json` | armes/armures/outils/paquetages | authoring depuis `equipement/*.html` |
| `build-graph.json` | graphe de décision (création niv. 1) | authoring |

## Vocabulaire d'effets

Identique à [`docs/_engine/effects.md`](../_engine/effects.md) — à relire. Un effet :
`{ "type":"grants|effect|requiresChoice|requires", "what":..., ... }`. Les valeurs
(compétences, langues, sorts, objets) référencent des `id` d'autres fichiers du catalogue.

## `from` d'un `requiresChoice` (requête déterministe)

`from` est soit une **liste explicite d'ids**, soit une **requête** résolue par le resolver :
- `{ "fromSpellList": "druide", "level": 0 }` → sorts mineurs de druide (via `spells-by-class`).
- `{ "fromSkillSet": ["arcanes","dressage",...] }` → compétences parmi un ensemble.
- `{ "fromLanguages": "courante" }` → langues courantes.
- `{ "fromList": ["gardien","mage"] }` → options nommées (sous-choix de classe).

## Entrée de classe — RÉFÉRENCE (Druide, niveau 1)

Copier ce format pour les 11 autres classes. Effets = ce qu'accorde la classe au **niveau 1** ;
`choices` = les `requiresChoice` du niveau 1 ; `recommends` = recos du livre (jamais imposées).

```jsonc
{
  "id": "druide", "name": "Druide", "kind": "classe",
  "ref": "../classes/druide.html", "source": "img:79,80,81,82,83,84",
  "primaryAbility": "sag", "hitDie": 8,
  "savingThrows": ["int", "sag"],
  "subclass": { "level": 3, "kind": "cercle",
    "ids": ["cercle-des-astres","cercle-de-la-lune","cercle-des-mers","cercle-de-la-terre"] },
  "spellcasting": { "ability": "sag", "list": "druide", "cantrips": 2, "prepared": 4, "prepMinLevel": 1 },
  "effects": [
    { "type": "grants", "what": "hitDie", "die": 8 },
    { "type": "grants", "what": "savingThrowProficiency", "value": "int" },
    { "type": "grants", "what": "savingThrowProficiency", "value": "sag" },
    { "type": "grants", "what": "armorTraining", "value": "legere" },
    { "type": "grants", "what": "shieldTraining" },
    { "type": "grants", "what": "weaponProficiency", "value": "armes courantes" },
    { "type": "grants", "what": "toolProficiency", "value": "materiel d'herboriste" },
    { "type": "grants", "what": "spellcasting", "ability": "sag", "list": "druide" },
    { "type": "grants", "what": "cantripSlots", "count": 2, "list": "druide" },
    { "type": "grants", "what": "preparedSlots", "count": 4, "list": "druide", "minLevel": 1 },
    { "type": "grants", "what": "language", "value": "druidique" },
    { "type": "grants", "what": "alwaysPreparedSpell", "spell": "communication-avec-les-animaux", "list": "druide" }
  ],
  "choices": [
    { "id": "druide-competences", "kind": "competence-classe", "count": 2,
      "from": { "fromSkillSet": ["arcanes","dressage","intuition","medecine","nature","perception","religion","survie"] },
      "grantsEach": { "type": "grants", "what": "skillProficiency" } },
    { "id": "druide-ordre-primitif", "kind": "ordre-primitif", "count": 1,
      "from": { "fromList": ["gardien","mage"] },
      "appliesEffects": {
        "gardien": [ { "type": "grants", "what": "armorTraining", "value": "intermediaire" },
                     { "type": "grants", "what": "weaponProficiency", "value": "armes de guerre" } ],
        "mage": [ { "type": "grants", "what": "cantripSlots", "count": 1, "list": "druide" } ] } },
    { "id": "druide-cantrips", "kind": "cantrip", "count": 2,
      "from": { "fromSpellList": "druide", "level": 0 } },
    { "id": "druide-prepares", "kind": "prepared", "count": 4,
      "from": { "fromSpellList": "druide", "minLevel": 1 } },
    { "id": "druide-equipement", "kind": "equipement", "count": 1, "from": { "fromList": ["A","B"] } }
  ],
  "startingEquipment": [
    { "option": "A", "items": ["armure-de-cuir","bouclier","serpe","baton-de-combat","paquetage-d-explorateur","materiel-d-herboriste","9 po"],
      "grants": [ { "type": "effect", "what": "armorClass", "base": 11 }, { "type": "grants", "what": "shieldTraining" } ] },
    { "option": "B", "items": ["50 po"] }
  ],
  "recommends": [
    { "kind": "cantrip", "list": "druide", "ids": ["druidisme","flammes"] },
    { "kind": "prepared", "list": "druide", "ids": ["amitie-avec-les-animaux","lueurs-feeriques","soins","vague-tonnante"] },
    { "kind": "ordre-primitif", "value": "mage" }
  ]
}
```

## Règles d'authoring

- **Ne rien inventer** : tout provient de la page HTML citée en `ref` ; niveaux/valeurs exacts.
- Effets **niveau 1** uniquement pour l'instant (le schéma prévoit `level` pour étendre à 1-20).
- Les `id` (compétences, sorts, langues, objets, sous-classes) doivent correspondre aux `id`
  réels du catalogue/HTML (kebab-case sans accents). `catalog-lint.mjs` vérifie que tout résout.
- Une sous-classe (`subclasses.json`) : `{ id, name, parentClass, ref, source, level, effects[], choices[], recommends[] }`.
- Une espèce (`species.json`) : `{ id, name, ref, size, speed, effects[] (traits), lineages[]{id,name,effects[],choices[]} }`.
- Un historique (`backgrounds.json`) : `{ id, name, ref, abilityBonus{options}, skills[], toolProficiency, feat, equipment[] }`.
- Un don (`feats.json`) : `{ id, name, ref, category, prerequisite, repeatable, effects[], choices[] }`.
