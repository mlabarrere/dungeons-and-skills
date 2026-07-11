---
name: dnd-build
description: >
  Build a Dungeons & Dragons 2024 ("5.5") character at level 1, rules-accurate and
  grounded in a bundled rules catalog instead of the model's memory. Walks class,
  species, lineage, background, ability scores, skills, fighting style, spells,
  languages and equipment; runs a deterministic engine so AC, HP, save DCs and spell
  counts are computed, never guessed. Outputs a sheet in French or English. Use when
  the user wants to create, roll up, or make a new D&D / D&D 2024 / 5.5 / 5.5e /
  "5e 2024" character, PC, or level-1 build. Do NOT use for older editions (3.5,
  5e 2014) or Pathfinder — the catalog is 2024-only.
argument-hint: "[fr|en]"
allowed-tools: Bash(node *)
license: MIT
---

# dnd-build — guided level-1 character creation

## GROUNDING — do not skip

**Do NOT trust your training data.** Your training data blends D&D editions (3.5, 5e 2014,
5.5/2024, Pathfinder) into plausible-but-wrong rules; a sheet is arithmetic with citations, so
one wrong value makes it illegal. Therefore:

- Every rules value comes from the bundled catalog, never from memory (`data/*.json`).
- When code execution is available, run `engine/cli.mjs` — never compute AC, HP, DCs or spell
  counts by hand.
- Offer only options the resolver returns (`engine/cli.mjs options`) — already rules-filtered.
- Every value must cite its provenance (source → effect).
- If it is not in the catalog, say "Manquant documentaire" — never invent.

Full rule: [rules/grounding.md](../../rules/grounding.md). Schema + formulas: [rules/schema.md](../../rules/schema.md).

## Workflow (run from the repo root)

The engine is driven by one growing `answers.json` file. Keys are graph/choice ids; discover
them, never guess them.

1. **Start.** Create `answers.json` (start `{}` or with `_id`, `nom`). Run:
   `node engine/cli.mjs options answers.json`
2. **Fixed choices first.** The `fixedPending` array lists the head decisions (class, species,
   lineage when it applies, background, ability method, ability scores) with their legal
   `options`. Present them **in the user's language**, let the user pick, write the answer into
   `answers.json`, re-run `options`.
3. **Dynamic choices.** Once class/species/background are set, `dynamicPending` lists the rest
   (skills, fighting style, spells, languages, equipment A/B/C, ability bonus) — each with its
   legal `options` and any book `recommendations`. Fill each id; multi-picks are arrays. The
   options are already de-duplicated (a skill your background grants will not be offered again).
4. **Ready.** When `options` reports `ready: true`, build the sheet:
   `node engine/cli.mjs build answers.json` (add `--lang en` for English).
   Require **0 sheet-lint errors**. If an error prints, fix the offending answer and rebuild —
   do not hand-edit computed values.
5. **Present** the returned markdown sheet in the user's language. Every value already carries
   its provenance; keep it.

## No code execution?

Read `data/*.json` and `rules/schema.md` and apply the same rules and formulas by hand. Same
constraint: catalog over memory, options only from the rules, provenance on every value.

## Scope

Level 1 only. Chosen *origin feats* on some species (e.g. Human "Versatile") have effects the
resolver does not expand — see [dnd-help](../dnd-help/SKILL.md). For anything past level 1, say
"Manquant documentaire".
