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
  "j'ai une erreur dans ma fiche". The catalog is 2024-only and level-1 only. Reports and
  sheet output are available in 9 languages: English, French, German, Spanish, Italian,
  Japanese, Russian, Chinese, or Arabic — pass --lang to engine/cli.mjs check.
argument-hint: "[en|fr|de|es|it|ja|ru|zh|ar]"
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

## Accepted input formats

The user may hand you their sheet in any shape — you adapt, and you always reply in the user's
language (see *Languages* below):

- **Free text or markdown:** extract each value (class, species, background, scores, HP, AC,
  spells…) and assemble the `.character.json` internally. Never ask the user to produce JSON.
- **Values dictated one by one:** ask for the next in plain language.
- **Missing information:** ask for it one item at a time, in clear terms — never internal jargon.
  - ✗ "What is your `abilityScores.STR`?"  ✓ "What's your Strength (the raw number, before modifiers)?"
  - ✗ "List your `sources[]` with `type: feat`."  ✓ "Do you have any feats? If so, which ones?"
- **Partial sheet is fine:** audit what's available and note what's missing for a full check.

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

## Languages

Detect the user's language and pass the matching code to `engine/cli.mjs check --lang <code>`:
`en` `fr` `de` `es` `it` `ja` `ru` `zh` `ar` (falls back to English if a label is missing).
Deliver the audit in that language; entity names resolve across languages via `data/labels.*.json`.
