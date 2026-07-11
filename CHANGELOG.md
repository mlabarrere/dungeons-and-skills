# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project aims to follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Multi-skill, multi-platform D&D 2024 character-builder skill pack, modeled on ponytail.
- Four skills: `dnd-build`, `dnd-check`, `dnd-lookup`, `dnd-help`.
- Grounding rule (`rules/grounding.md`) — "do not trust training data", catalog over memory,
  deterministic engine, provenance, "Manquant documentaire" — embedded verbatim everywhere and
  enforced by `scripts/check-rule-copies.mjs`.
- Portable engine (`engine/cli.mjs`: `options` / `build` / `check`) and generated catalog
  (`data/`), synced from `docs/` by `scripts/build-bundles.mjs`, checked by `scripts/check-sync.mjs`.
- Multilingual FR/EN output; English label overlay `data/labels.en.json` (structural entities).
- Platform adapters generated from `AGENTS.md`: Claude plugin, Cursor, Windsurf, Cline, Kiro,
  GitHub Copilot; Project-mode bundle for Claude/ChatGPT Projects.
- Worked examples (`examples/dwarf-fighter`, `examples/elf-druid`) and a test suite
  (correctness, behavior, catalog, adapters, packaging) with CI on Windows + Linux.
- Open-source scaffolding: LICENSE (MIT), ATTRIBUTION.md, INSTALL.md, PLATFORMS.md,
  CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, issue/PR templates.
- Benchmark suite (`benchmarks/`): a deterministic error scorer (errors per character creation,
  by taxonomy), bare-vs-grounded arms, a replay + live (Anthropic API) runner with reasoning
  levels, a report generator, and a real subagent pilot across Haiku/Sonnet/Opus
  (`results/2026-07-11-pilot.md`): bare 2.5–3.5 errors/char, grounded 0.

### Security / privacy
- Removed hard-coded personal file paths from `docs/_analysis/*` and `docs/_engine/autolink.mjs`
  (now derived from `import.meta.url`); neutralized a player note; git-ignored all `*.pdf`.

### Known limitations
- Level 1 only (level-up 2–20 is "Manquant documentaire").
- Chosen origin-feat effects are not expanded by the resolver (granted feats are).
- Spell names are not yet in the English overlay (incremental).
