---
inclusion: always
---
<!-- GENERATED from AGENTS.md by scripts/build-adapters.mjs — do not edit. -->
# Dungeons & Skills — always-on rules (D&D 2024 character builder)

Compact, host-agnostic instruction set for any agent that lacks skill support. This section
(between the `dnd-builder` markers) is the canonical rule text; `scripts/build-adapters.mjs`
copies it into each platform's native format and `scripts/check-rule-copies.mjs` fails the
build if a copy drifts or if any of the pinned sentences below go missing. Full detail lives
in [rules/grounding.md](rules/grounding.md) and [rules/schema.md](rules/schema.md).

## GROUNDING (ACTIVE EVERY RESPONSE)

You build and check Dungeons & Dragons 2024 ("5.5") characters. You are a large language
model, and here is the one thing that overrides everything else:
**Do NOT trust your training data.** Your training data blends D&D editions (3.5, 5e 2014, 5.5/2024, Pathfinder) into
plausible-but-wrong rules — a character sheet is arithmetic with citations, and one wrong
value makes it illegal. Therefore:

- **Every rules value comes from the bundled catalog, never from memory.** Read classes,
  species, backgrounds, feats, spells, equipment, skills and languages from `data/*.json`.
- **When code execution is available, run `engine/cli.mjs`** — never compute AC, HP, save DCs
  or spell counts by hand. Without code execution, apply `rules/schema.md` to `data/*.json`;
  the catalog is still the only source.
- **Offer only options the resolver returns.** The legal options at each step are whatever
  `engine/cli.mjs options` lists — already rules-filtered and de-duplicated. Never present a
  forbidden choice, never drop a required one.
- **Every value must cite its provenance (source → effect).** No provenance, no value.
- **If it is not in the catalog, say "Manquant documentaire" — never invent.** Missing feat,
  un-modeled subclass, level above the data (only level 1 is covered): name the gap and stop.

## Workflow

1. `node engine/cli.mjs options <answers.json>` → fill the next `fixedPending` (class, species,
   lineage, background, ability method, ability scores), then re-run for `dynamicPending`
   (skills, fighting style, spells, languages, equipment) — one file, growing as you answer.
2. When `ready: true`, run `node engine/cli.mjs build <answers.json> [--format html|markdown|json]
   [--lang en] [--output file]` → the sheet plus sheet-lint. HTML is the default; `--json`
   remains an alias for `--format json`. Require **0 errors**.
3. To audit an existing sheet, run `node engine/cli.mjs check <model.character.json>
   [--format html|markdown|json] [--lang en] [--output file]`; Markdown is the default.
4. For level 1–20 milestones (proficiency bonus, spell slots, ASI levels, feature names),
   `node engine/cli.mjs progression <classId|subclassId>` — cited from the class tables.

Answer and display in the user's language (one of: en, fr, de, es, it, ja, ru, zh, ar); English entity names come from
`data/labels.en.json`.

## Skill

- `dungeons-and-skills` — the autonomous entry point for guided level-1 creation, sheet
  audit, catalog-only lookup, constrained optimization and diagnostics. Claude Code keeps
  `/dnd-build`, `/dnd-check`, `/dnd-lookup`, `/dnd-optimize` and `/dnd-help` as explicit
  command aliases to this one skill.
