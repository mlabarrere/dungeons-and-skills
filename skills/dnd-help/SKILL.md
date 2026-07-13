---
name: dnd-help
description: >
  Explain this D&D 2024 character-builder skill family — what dnd-build, dnd-check and
  dnd-lookup do, how the grounding rule works (why the model must not trust its training
  data and must read the bundled catalog instead), the engine commands, 9-language output
  (EN/FR/DE/ES/IT/JA/RU/ZH/AR), and current scope/limits. Use when the user asks what
  these skills do, how to build a character, or any general orientation question —
  including "help", "how does this work", "what is this", "help me", "I'm lost",
  "getting started", "aide", "comment ça marche", "qu'est-ce que c'est",
  "je ne comprends pas", "comment utiliser", or how the D&D builder works.
argument-hint: ""
allowed-tools: Bash(node *)
license: MIT
version: "0.1.0"
author: "mlabarrere"
tags: [dnd, dnd-2024, 5e, help, documentation, rpg]
agents: [claude-code]
---

# dnd-help — how the D&D 2024 builder works

Ce builder vous aide à créer un personnage de Donjons & Dragons 2024 (aussi appelé D&D 5.5
ou "5e 2024") étape par étape, en vérifiant chaque valeur contre un catalogue de règles
officiel — pas contre la mémoire d'un modèle de langage. Il fonctionne en **9 langues**
(français, anglais, allemand, espagnol, italien, japonais, russe, chinois, arabe). Pour
commencer, dites simplement quel type de personnage vous voulez jouer. *(English below.)*

This builder guides you through creating a D&D 2024 character step by step, with every
value verified against a bundled rules catalog — not the model's memory. It outputs sheets
in **9 languages**: English, French, German, Spanish, Italian, Japanese, Russian, Chinese,
and Arabic. Just describe what kind of character you want to play; the rest is
questions-and-answers.

- **To create a character**, use `/dnd-build` (or just say "I want to make a character").
- **To look up a rule, spell, or feat**, use `/dnd-lookup`.
- **To verify an existing sheet**, use `/dnd-check`.

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

The engine ships beside the skills and self-locates its catalog, so it runs from **any** working
directory. Resolve its path once — `ENGINE="$CLAUDE_SKILL_DIR/../../engine/cli.mjs"`, falling back
to `engine/cli.mjs` from a repo checkout — then:

- `node "$ENGINE" options <answers.json>` — the next legal choices (rules-filtered).
- `node "$ENGINE" build <answers.json> [--lang en]` — answers → sheet + lint (need 0 errors).
- `node "$ENGINE" check <model.character.json>` — recompute/lint an existing model.

`--lang` accepts: `en` `fr` `de` `es` `it` `ja` `ru` `zh` `ar` (falls back to English if a label is missing).

Catalog: `data/*.json` (12 classes, 48 subclasses, 10 species, 16 backgrounds, 75 feats,
~391 spells). 9-language display overlays: `data/labels.*.json`. Schema + formulas: `rules/schema.md`.

## Languages

| Language | Code | Source |
|----------|------|--------|
| 🇬🇧 English | `en` | PHB 2024 (Wizards of the Coast) |
| 🇫🇷 Français | `fr` | PHB 2024 (Blackbook Éditions) |
| 🇩🇪 Deutsch | `de` | PHB 2024 (Ulisses Spiele) |
| 🇪🇸 Español | `es` | PHB 2024 (Devir) |
| 🇮🇹 Italiano | `it` | PHB 2024 (Need Games) |
| 🇯🇵 日本語 | `ja` | PHB 2024 (Hobby Japan) |
| 🇷🇺 Русский | `ru` | D&D 5e (Hobby World — quasi-official) |
| 🇨🇳 中文 | `zh` | Licensed CN edition + community standard |
| 🇸🇦 العربية | `ar` | Community (su3luq.com) |

All label files are triple-verified against each publisher's official text. New-2024-only terms
without a confirmed publisher translation fall back to English.

## Scope & known limits

- **Level 1 only.** The catalog models character creation at level 1 for D&D 2024. Level-up
  (2–20) is "Manquant documentaire".
- **Chosen origin feats** (e.g. a Human's chosen "Versatile" feat) are recorded but their
  mechanical effects are **not** expanded by the resolver yet — a granted feat (from a
  background) *is* expanded. Prefer species/backgrounds whose bonuses are granted, or note the
  gap. This is a documented engine limitation, not a rule.
- **9 languages.** Internal IDs are English slugs; display names in each language come from
  `data/labels.<lang>.json`. Use `--lang <code>` with `engine/cli.mjs build`.
