# Dungeons & Skills — a grounded D&D 2024 skill pack

*[Français](README.fr.md)*

[![CI](https://github.com/mlabarrere/dungeons-and-skills/actions/workflows/test.yml/badge.svg)](https://github.com/mlabarrere/dungeons-and-skills/actions/workflows/test.yml)
![licence: MIT](https://img.shields.io/badge/licence-MIT-black)
![rules: D&D 2024 (5.5)](https://img.shields.io/badge/rules-D%26D%202024%20(5.5)-black)
![skills: 4](https://img.shields.io/badge/skills-build%20·%20check%20·%20lookup%20·%20help-black)
![languages: 9](https://img.shields.io/badge/languages-EN·FR·DE·ES·IT·JA·RU·ZH·AR-black)
![grounded](https://img.shields.io/badge/grounded-no%20hallucinated%20rules-black)

> [!WARNING]
> **Rules data — personal use only.** The catalog (`data/`, `docs/`) is derived from D&D 2024
> material (Wizards of the Coast). The *code* is MIT; the *rules data* is for personal use —
> do not redistribute commercially. See [ATTRIBUTION.md](ATTRIBUTION.md).

A multi-skill, multi-platform, tested project that helps any AI assistant (Claude, ChatGPT,
Cursor, Copilot and friends) **build and check Dungeons & Dragons 2024 ("5.5") characters** — and
get the rules right.

## Quickstart (pick your host)

| Host | Install | Then |
|------|---------|------|
| **Claude Code** | `node install.mjs` (or `npx github:mlabarrere/dungeons-and-skills`) — plugin marketplace coming soon | `/dnd-build` |
| **Any project (script)** | `npx github:mlabarrere/dungeons-and-skills` (or clone + `node install.mjs`) | open Claude Code there, `/dnd-build` |
| **Claude / ChatGPT Projects** | paste [`project-mode/INSTRUCTIONS.md`](project-mode/INSTRUCTIONS.md), upload [`project-mode/knowledge/`](project-mode/knowledge/) | ask it to build a character |
| **Cursor / Windsurf / Cline / Kiro / Copilot** | the rule auto-loads from a checkout, or copy the matching adapter (see [PLATFORMS.md](PLATFORMS.md)) | describe the task |
| **Any other agent** | point it at [`AGENTS.md`](AGENTS.md) | — |

Full details: [INSTALL.md](INSTALL.md).

## Why it exists

A language model's training data blends the D&D editions (3.5, 5e 2014, 5.5/2024, Pathfinder)
into rules that sound right and are wrong. A character sheet is arithmetic with citations, so a
single wrong value makes it illegal. One rule therefore overrides everything else: **do not trust
the model's memory — read the bundled rules catalogue and run a deterministic engine.** See
[rules/grounding.md](rules/grounding.md).

## Skills

| Skill | What it does |
|-------|--------------|
| [`dnd-build`](skills/dnd-build/SKILL.md)  | Guided level-1 character creation, zero rules errors, output in any of 9 languages. |
| [`dnd-check`](skills/dnd-check/SKILL.md)  | Audit an existing sheet and flag every rules error (the sheet checker). |
| [`dnd-lookup`](skills/dnd-lookup/SKILL.md) | Look up a spell, feat or class from the catalogue and cite the source. |
| [`dnd-help`](skills/dnd-help/SKILL.md)   | How the family works, supported languages, and what grounding means. |

## How it works

- **Catalogue** (`data/*.json`): 12 classes, 48 subclasses, 10 species, 16 backgrounds, 75 feats
  and ~391 spells — deterministic rules data generated from `docs/`. Display names in 9 languages
  via `data/labels.*.json` (EN, FR, DE, ES, IT, JA, RU, ZH, AR — all publisher-verified).
- **Engine** (`engine/`): `resolver.mjs` returns only the rules-legal options at each step;
  `build-character.mjs` works out AC, hit points, save DCs and spell counts and then lints the
  result; `cli.mjs` is the command the skills call.
- **Grounding rule** ([rules/grounding.md](rules/grounding.md)): embedded word-for-word in every
  skill, in `AGENTS.md`, in the Project-mode instructions and in every platform adapter — kept in
  step by `scripts/check-rule-copies.mjs`.

```bash
# from the repository root
node engine/cli.mjs options answers.json            # the next legal choices (rules-filtered)
node engine/cli.mjs build   answers.json --lang en  # answers → sheet in English + lint (0 errors)
node engine/cli.mjs build   answers.json --lang fr  # → sheet in French
node engine/cli.mjs build   answers.json --lang de  # → sheet in German
node engine/cli.mjs build   answers.json --lang es  # → sheet in Spanish
node engine/cli.mjs check   sheet.character.json    # audit an existing sheet
```

`--lang` accepts: `en` `fr` `de` `es` `it` `ja` `ru` `zh` `ar` — falls back to English if a label is missing.

Worked examples live in [examples/](examples/) (`dwarf-fighter`, `elf-druid` — answers plus the
expected sheet).

## Why it stays correct

The reliability doesn't come from a cleverer prompt — it comes from taking the rules *out* of the
model's memory:

- **Catalog, not memory.** Every class, species, background, feat, spell, skill and item is read
  from the bundled `data/*.json`, extracted from the official 2024 rulebook — never recalled from
  training data (which blends 3.5, 5e 2014, 2024 and Pathfinder into plausible-but-wrong rules).
- **A deterministic engine, not mental arithmetic.** `engine/cli.mjs` computes AC, HP, save DCs
  and spell counts and lints the sheet; the model never guesses a number.
- **Only legal options are offered.** The resolver returns the exact rules-filtered choices at
  each step, so an illegal pick is never presented and a required one is never dropped.
- **Provenance on every value**, and an explicit **"Manquant documentaire"** whenever something
  falls outside the catalog — the model names the gap instead of inventing.

The result is a sheet that is arithmetic with citations: reproducible, auditable, and identical
whether it is built once or fifty times — in any of the nine supported languages.

## Documentation

- [INSTALL.md](INSTALL.md) — how to install it on each platform (Claude Code, Projects, Cursor, Windsurf and so on).
- [PLATFORMS.md](PLATFORMS.md) — agent portability and the adapter model.
- [rules/grounding.md](rules/grounding.md) — the grounding rule; [rules/schema.md](rules/schema.md) — the schema and the formulas.
- [CONTRIBUTING.md](CONTRIBUTING.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) · [SECURITY.md](SECURITY.md) · [CHANGELOG.md](CHANGELOG.md)

## Languages

The engine outputs a full character sheet in **9 languages** — every class, species, background,
skill, ability score and spell name is displayed in the chosen language, sourced from the
publisher-verified label files in `data/labels.*.json`.

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
| 🇸🇦 العربية | `ar` | Community (su3luq.com — TTRPG localization studio) |

Pass `--lang <code>` to `engine/cli.mjs build`. All label files are triple-verified against each
publisher's official text; new-2024-only terms without a confirmed translation fall back to English.

## Using it

- **Claude Code** — the skills load automatically from `skills/`, or install the plugin from
  `.claude-plugin/`. Slash commands: `/dnd-build`, `/dnd-check`, `/dnd-lookup`, `/dnd-help`.
- **Cursor / Windsurf / Cline / Kiro / GitHub Copilot** — the always-on rule is generated into
  each tool's native format (`.cursor/rules/`, `.windsurf/rules/`, `.clinerules/`,
  `.kiro/steering/`, `.github/copilot-instructions.md`).
- **Claude / ChatGPT Projects** — paste [project-mode/INSTRUCTIONS.md](project-mode/INSTRUCTIONS.md)
  into the Project's custom instructions and upload `project-mode/knowledge/` as its knowledge.
- **Any other agent** — point it at [AGENTS.md](AGENTS.md).

## Developing

```bash
node scripts/build-bundles.mjs    # regenerate engine/ + data/ + project-mode/knowledge from docs/
node scripts/build-adapters.mjs   # regenerate the platform adapters from AGENTS.md
npm run skill:check               # check-sync + check-rule-copies (nothing has drifted)
npm test                          # node --test: correctness, behaviour, catalogue, adapters, packaging, scorer
```

The single source of truth is `docs/` (the rules base) and the `dnd-builder` section of
`AGENTS.md` (the rule text). `engine/`, `data/` and the adapters are generated, so do not edit
them by hand.

## Scope and limits

Level 1 only (levelling up from 2 to 20 is reported as "Manquant documentaire"). Chosen origin
feats are recorded, but their mechanical effects are not expanded yet (granted feats are) — see
[dnd-help](skills/dnd-help/SKILL.md).

## Licence and attribution

The original work (engine, scripts, skill prose, documentation) is under the
[MIT Licence](LICENSE). The rules data under `data/` and `docs/` is derived from D&D 2024 material
and is included for **private use**; before distributing it publicly, keep the content within the
**SRD 5.2 (2024, CC-BY-4.0)** and attribute it — see [ATTRIBUTION.md](ATTRIBUTION.md). This is
unofficial fan content and is not affiliated with Wizards of the Coast.

> This work includes material from the System Reference Document 5.2 ("SRD 5.2") by Wizards of
> the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the
> Creative Commons Attribution 4.0 International License.
