# Dungeons & Skills — a grounded D&D 2024 skill pack

*[Français](README.fr.md)*

[![CI](https://github.com/mlabarrere/dungeons-and-skills/actions/workflows/test.yml/badge.svg)](https://github.com/mlabarrere/dungeons-and-skills/actions/workflows/test.yml)
![licence: MIT](https://img.shields.io/badge/licence-MIT-black)
![rules: D&D 2024 (5.5)](https://img.shields.io/badge/rules-D%26D%202024%20(5.5)-black)
![skills: 1](https://img.shields.io/static/v1?label=skills&message=dungeons-and-skills&color=black)
![languages: 9](https://img.shields.io/badge/languages-EN·FR·DE·ES·IT·JA·RU·ZH·AR-black)
![grounded](https://img.shields.io/badge/grounded-no%20hallucinated%20rules-black)

> [!NOTE]
> **Public beta catalog.** The bundled `srd-5.2` profile contains only audited SRD 5.2.1
> material under CC-BY-4.0. Original project code is MIT-licensed. See
> [ATTRIBUTION.md](ATTRIBUTION.md) and `data/catalog-provenance.json`.

A self-contained, multi-platform Agent Skill that helps AI assistants **build level-1 and check
Dungeons & Dragons 2024 ("5.5") characters** against the rules covered by the bundled catalog.
Catalog gaps are reported instead of guessed.

## Quickstart (pick your host)

| Host path | Status | Install | Then |
|-----------|--------|---------|------|
| **Claude Code, OpenAI Codex, Cursor** | Certified beta hosts | `npx skills add mlabarrere/dungeons-and-skills --skill dungeons-and-skills` | describe the task |
| **Claude Code plugin** | Native plugin | add this repository as a marketplace, then install `dungeons-and-skills@dungeons-and-skills` | `/dnd-build` or describe the task |
| **Other Agent Skills clients** | Format-compatible | install or copy `skills/dungeons-and-skills/` | describe the task |
| **Node CLI** | CI-certified | clone the repository or use the release archive | run `node engine/cli.mjs` |
| **Claude / ChatGPT Projects** | Instruction-only | paste [`project-mode/INSTRUCTIONS.md`](project-mode/INSTRUCTIONS.md), upload [`project-mode/knowledge/`](project-mode/knowledge/) | ask it to build a level-1 character |
| **Windsurf / Cline / other rule-file hosts** | Instruction-only | use the generated adapter | describe the task |

Full details: [INSTALL.md](INSTALL.md).

There is currently no dedicated npm package or third-party marketplace listing. The standard
`npx skills` CLI installs directly from the public GitHub repository; release archives remain
the offline/fallback channel.

The single public skill follows the open
[Agent Skills specification](https://agentskills.io/specification). Its folder contains the
engine, audited SRD catalog, renderer assets, references and attribution required to run
independently; CI installs that folder through `npx skills` and runs `doctor`.

## Host status and reliability

Deterministic calculation and regression coverage apply to the engine output, not to every host integration.

| Status | Meaning | Reliability |
|--------|---------|-------------|
| **Certified beta host** | Claude Code, OpenAI Codex or Cursor passed the release smoke | Reproducible engine output for catalog-covered level-1 rules; warnings still require review |
| **Agent Skills compatible** | The host implements the open format but is not in the host smoke gate | Expected to load the same skills; host UX and tool permissions are not certified |
| **Instruction-only** | The host reads instructions/catalog files but cannot execute the engine | Grounded but approximate; calculated values may drift |

Engine-backed paths require Node.js 18+ and the rules bundle on disk. See
[PLATFORMS.md](PLATFORMS.md) for the current per-host classification.

## Why it exists

A language model's training data blends the D&D editions (3.5, 5e 2014, 5.5/2024, Pathfinder)
into rules that sound right and are wrong. A character sheet is arithmetic with citations, so a
single wrong value makes it illegal. One rule therefore overrides everything else: **do not trust
the model's memory — read the bundled rules catalogue and run a deterministic engine.** See
[rules/grounding.md](rules/grounding.md).

## Skill

[`dungeons-and-skills`](skills/dungeons-and-skills/SKILL.md) detects the intent and executes
the appropriate workflow: guided creation, sheet audit, catalog lookup, constrained
optimization or diagnostics. Claude Code also exposes `/dnd-build`, `/dnd-check`,
`/dnd-lookup`, `/dnd-optimize` and `/dnd-help` as explicit shortcuts to that same skill.

## How it works

- **Catalog** (`data/*.json`): 12 classes, 12 SRD subclasses, 9 species, 4 backgrounds,
  15 feats and 83 SRD level-0/1 spells. Every shipped entity has a primary SRD 5.2.1 provenance
  record. The UI is available in nine languages; catalog names use verified English, then stable
  IDs when no redistributable translation is recorded.
- **Engine** (`engine/`): `resolver.mjs` returns only the rules-legal options at each step;
  `build-character.mjs` works out AC, hit points, save DCs and spell counts and then lints the
  result; `cli.mjs` is the command the skills call.
- **Grounding rule** ([rules/grounding.md](rules/grounding.md)): embedded word-for-word in the
  skill, in `AGENTS.md`, in the Project-mode instructions and in every platform adapter — kept in
  step by `scripts/check-rule-copies.mjs`.

```bash
# from the repository root
node engine/cli.mjs options answers.json            # the next legal choices (rules-filtered)
node engine/cli.mjs build answers.json --lang en     # standalone HTML sheet beside the input
node engine/cli.mjs build answers.json --format markdown --lang fr
node engine/cli.mjs build answers.json --format json # JSON on stdout (--json remains an alias)
node engine/cli.mjs check sheet.character.json       # Markdown audit on stdout
node engine/cli.mjs check sheet.character.json --format html --output audit.html
```

`--format` accepts `html`, `markdown` and `json`. `--output` is available for HTML and
Markdown; JSON always goes to stdout. `--lang` accepts `en` `fr` `de` `es` `it` `ja` `ru`
`zh` `ar`, defaults to English, and falls back to English if a label is missing.

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

For the same catalog, input and engine version, the computed model is reproducible. Rendering it
in another supported language changes labels, not rules values.

## Documentation

- [INSTALL.md](INSTALL.md) — how to install it on each platform (Claude Code, Projects, Cursor, Windsurf and so on).
- [PLATFORMS.md](PLATFORMS.md) — agent portability and the adapter model.
- [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md) — exact rules scope, host certification and release status.
- [rules/grounding.md](rules/grounding.md) — the grounding rule; [rules/schema.md](rules/schema.md) — the schema and the formulas.
- [CONTRIBUTING.md](CONTRIBUTING.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) · [SECURITY.md](SECURITY.md) · [CHANGELOG.md](CHANGELOG.md)

## Languages

The engine renders a character sheet in **9 languages**. A missing localized entity label falls
back to English; rules values remain unchanged.

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

Pass `--lang <code>` to `engine/cli.mjs build`. English feature names carry primary-source
manifests; other overlays combine publisher, licensed and community sources as identified above.
New-2024-only terms without a confirmed translation fall back to English.

## Using it

- **Claude Code** — the skill loads automatically from `skills/`, or install the plugin from
  `.claude-plugin/`. Slash commands: `/dnd-build`, `/dnd-check`, `/dnd-lookup`, `/dnd-optimize`, `/dnd-help`.
- **Cursor / Windsurf / Cline / Kiro / GitHub Copilot** — the always-on rule is generated into
  each tool's native format (`.cursor/rules/`, `.windsurf/rules/`, `.clinerules/`,
  `.kiro/steering/`, `.github/copilot-instructions.md`).
- **Claude / ChatGPT Projects** — paste [project-mode/INSTRUCTIONS.md](project-mode/INSTRUCTIONS.md)
  into the Project's custom instructions and upload `project-mode/knowledge/` as its knowledge.
- **Any other agent** — point it at [AGENTS.md](AGENTS.md).

## Developing

```bash
node scripts/build-bundles.mjs    # regenerate the engine and audited SRD projection
node scripts/build-adapters.mjs   # regenerate the platform adapters from AGENTS.md
npm run skill:check               # check-sync + check-rule-copies + check-skills-spec (nothing has drifted)
npm test                          # adapters, behavior, catalog-interface, catalog, correctness, feature-label-manifests, golden, html, packaging, progression, public-catalog, release-archive, release-docs, release-manifest, rendering, skills-spec, validation
```

The private development checkout projects its documentary source into the audited public
`data/` profile. `engine/`, `data/`, project knowledge and adapters are generated copies;
the public repository contains neither the private source nor its Git history.

## Scope and limits

Character creation is level 1 only. Progression tables expose reference milestones for levels
1–20, but they do not authorize building or levelling a character above level 1. See
[KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md) for the complete boundary.

## Licence and attribution

The original work (engine, scripts, skill prose, documentation) is under the
[MIT Licence](LICENSE). The public rules catalog is derived only from
**SRD 5.2.1 (2024, CC-BY-4.0)** and carries entry-level provenance plus the required
attribution in [ATTRIBUTION.md](ATTRIBUTION.md). This is unofficial fan content and is not
affiliated with Wizards of the Coast.

> This work includes material from the System Reference Document 5.2 ("SRD 5.2") by Wizards of
> the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the
> Creative Commons Attribution 4.0 International License.
