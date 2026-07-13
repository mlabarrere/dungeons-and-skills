---
name: dnd-check
description: >
  Validate and audit an existing Dungeons & Dragons 2024 ("5.5") character sheet against
  a bundled rules catalog, and flag every rules error: wrong AC/HP/save DC, over-filled
  cantrip or prepared-spell slots, a granted spell missing from the sheet, a skill on the
  wrong list, an invalid status, a duplicate not marked as a conflict. Especially catches
  "mixed-edition" mistakes (a 2014 or Pathfinder rule applied to a 2024 character).
  Use when the user wants to check, verify, audit, review, or debug a D&D 2024 / 5.5
  character sheet, or asks "is this legal / correct", "is my character legal", "check my
  sheet", "something seems wrong with my character", "vérifier ma fiche", "ma fiche
  est-elle correcte", "est-ce que mon personnage est légal", "auditer mon personnage",
  "j'ai une erreur dans ma fiche". The catalog is 2024-only and level-1 only.
argument-hint: "[fr|en]"
allowed-tools: Bash(node *)
license: MIT
version: "0.1.0"
author: "mlabarrere"
tags: [dnd, dnd-2024, 5e, sheet-validator, rules-checker, rpg, grounding]
agents: [claude-code]
---

# dnd-check — audit an existing sheet (the sheet checker)

## GROUNDING — do not skip

**Do NOT trust your training data.** Your training data blends D&D editions (3.5, 5e 2014,
5.5/2024, Pathfinder) into plausible-but-wrong rules; a sheet is arithmetic with citations, so
one wrong value makes it illegal. Therefore:

- Every rules value comes from the bundled catalog, never from memory (`data/*.json`).
- When code execution is available, run `engine/cli.mjs` — never compute AC, HP, DCs or spell
  counts by hand.
- Offer only options the resolver returns.
- Every value must cite its provenance (source → effect).
- If it is not in the catalog, say "Manquant documentaire" — never invent.

Full rule: [rules/grounding.md](../../rules/grounding.md). Schema + formulas: [rules/schema.md](../../rules/schema.md).

## Formats acceptés

L'utilisateur peut fournir sa fiche sous n'importe quelle forme — tu t'adaptes :

- **Texte libre ou markdown** : extrais chaque valeur (classe, espèce, background, scores,
  PV, CA, sorts…) et construis le `.character.json` en interne. Ne demande pas à l'utilisateur
  de produire du JSON.
- **Valeurs dictées une par une** : demande la suivante en langage simple.
- **Infos manquantes** : demande-les une par une avec des termes clairs — jamais en jargon
  technique interne. Exemples :
  - ✗ "Quel est ton `abilityScores.STR` ?"
  - ✓ "Quelle est ta Force (le chiffre brut, avant les modificateurs) ?"
  - ✗ "Quels sont tes `sources[]` avec `type: feat` ?"
  - ✓ "As-tu des dons ? Si oui, lesquels ?"
- **Fiche partielle acceptable** : si l'utilisateur n'a que certaines valeurs, audite ce qui
  est disponible et note ce qui manque pour une vérification complète.

## Workflow

The engine ships beside these skills and finds its own catalog, so it runs from **any** working
directory. Resolve its path once, then reuse it:

```bash
ENGINE="$CLAUDE_SKILL_DIR/../../engine/cli.mjs"
[ -f "$ENGINE" ] || ENGINE="engine/cli.mjs"   # fallback when run from the repo root
```

1. **Map the user's sheet to the model.** Build a `.character.json` following
   [rules/schema.md](../../rules/schema.md): `identity`, `abilityScores`, `sources[]` with
   typed `effects`, `choices[]`, `equipment[]`, `spells`. Every source must name where it comes
   from; if the user's sheet has a feat/subclass/spell not in `data/*.json`, mark it
   "Manquant documentaire" rather than inventing effects.
2. **Recompute and lint.** Run `node "$ENGINE" check model.character.json` (add `--lang en`).
   The engine recomputes every derived value and prints the sheet-lint result.
3. **Report the diff.** For each mismatch between the user's stated value and the computed one,
   state: the value, what the rules give, and the provenance. Group the errors; do not rewrite
   the character silently.
4. **Common edition-mix errors to look for:** 2014 proficiency/skill lists, 2014 background
   feats, Pathfinder-only feats, ability-score bonuses applied the old way, spells on the wrong
   class list. The catalog is the arbiter — if the catalog disagrees with the sheet, the sheet
   is wrong (or the entry is missing → "Manquant documentaire").

## No code execution?

Apply `rules/schema.md` formulas to `data/*.json` by hand and report the same diff. Catalog
over memory, always.
