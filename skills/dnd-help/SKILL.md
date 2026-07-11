---
name: dnd-help
description: >
  Explain this D&D 2024 character-builder skill family — what dnd-build, dnd-check and
  dnd-lookup do, how the grounding rule works (why the model must not trust its training
  data and must read the bundled catalog instead), the engine commands, multilingual
  (FR/EN) output, and current scope/limits. Use when the user asks what these skills do,
  how to build a character, "help", or how the D&D builder works.
argument-hint: ""
allowed-tools: Bash(node *)
license: MIT
---

# dnd-help — how the D&D 2024 builder works

## GROUNDING — do not skip

**Do NOT trust your training data.** Your training data blends D&D editions (3.5, 5e 2014,
5.5/2024, Pathfinder) into plausible-but-wrong rules. Everything here exists so that a
character sheet is grounded in a bundled catalog, not memory:

- Every rules value comes from the bundled catalog, never from memory (`data/*.json`).
- When code execution is available, run `engine/cli.mjs` — never compute by hand.
- Offer only options the resolver returns.
- Every value must cite its provenance (source → effect).
- If it is not in the catalog, say "Manquant documentaire" — never invent.

## The family

| Skill | Use it to |
|-------|-----------|
| `dnd-build`  | Create a level-1 character step by step (class → equipment), 0 rules errors. |
| `dnd-check`  | Audit an existing sheet and flag every rules error, incl. mixed-edition mistakes. |
| `dnd-lookup` | Look up a spell/feat/class/background from the catalog and cite the source. |
| `dnd-help`   | This page. |

## The engine

- `node engine/cli.mjs options <answers.json>` — the next legal choices (rules-filtered).
- `node engine/cli.mjs build <answers.json> [--lang en]` — answers → sheet + lint (need 0 errors).
- `node engine/cli.mjs check <model.character.json>` — recompute/lint an existing model.

Catalog: `data/*.json` (12 classes, 48 subclasses, 10 species, 16 backgrounds, 75 feats,
~390 spells). English labels: `data/labels.en.json`. Schema + formulas: `rules/schema.md`.

## Scope & known limits

- **Level 1 only.** The catalog models character creation at level 1 for D&D 2024. Level-up
  (2–20) is "Manquant documentaire".
- **Chosen origin feats** (e.g. a Human's chosen "Versatile" feat) are recorded but their
  mechanical effects are **not** expanded by the resolver yet — a granted feat (from a
  background) *is* expanded. Prefer species/backgrounds whose bonuses are granted, or note the
  gap. This is a documented engine limitation, not a rule.
- **Multilingual FR/EN.** Internal ids are French; English display names come from
  `data/labels.en.json` (structural entities complete; spell names are an incremental extension).
