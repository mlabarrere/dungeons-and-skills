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
- Benchmark suite v1 (`benchmarks/`): a deterministic error scorer and a bare-vs-grounded
  subagent pilot on `dnd-build`.

## [Unreleased] — benchmarks v2

### Changed / added
- Rebuilt the benchmark system per-skill and research-grade (see `benchmarks/AUDIT.md`):
  - **Atomic error rate** with explicit denominators + severity-weighted rate; perfect/invalid
    rates; root-cause vs cascade linking; a 25-category taxonomy (`taxonomy.mjs`, `scoring.mjs`).
  - **Per-skill oracles + scorers** for build/check/lookup/help (`benchmarks/skills/`), incl.
    precision/recall/F1 for the checker and catalogue-grounded recall/precision for lookup.
  - **Five isolated conditions** (`bare` → `full-project`) with enforced tool access
    (`conditions.mjs`); engine output is labelled `oracle`, never a model result.
  - **Config-driven models** (`config/models.example.json`) — no API id hardcoded in logic.
  - **Runner** (`runner.mjs`) with replay + live (tool loop) backends, run manifest/provenance,
    `--dry-run`, cost ceiling, resume, randomised seeded order; **stats** (bootstrap CI,
    percentiles, paired) in `stats.mjs`.
  - **Seeded corpora** (`tasks/gen.mjs`): build 12 (engine-validated), check 24, lookup 6, help 8.
  - **Schemas + validator** (`schemas/`, `validate.mjs`); **charts** (`charts.mjs`); reports with
    CIs and provenance (`report.mjs`).
  - Tests: oracle self-consistency (34/34 at 0), mutation, condition-isolation, taxonomy,
    denominator, stats, no-fabrication (`tests/bench.test.mjs`); CI runs the offline gates only.
- Removed the v1 benchmark files (scorer/tasks/arms/run/gen-grounded) — superseded, no duplication.

### Honesty
- Ran a **real exploratory ablation** for `dnd-build` (5 characters, Haiku/Sonnet/Opus) via
  model sub-agents: `bare` vs `skill-engine`, the latter actually running the engine. Atomic
  error rate 14–21% (bare) → 0–0.6% (skill-engine); a −96% to −100% relative reduction
  (`benchmarks/reports/pilot-build-ablation.md`). `skill-engine` is not a flat 0 (real
  transcription slips), i.e. a measured model result, not injected engine output.
- Still **not run** (no figure fabricated): the `grounding-only` / `skill-only` / `full-project`
  conditions, the reasoning-level sweep, and the check/lookup/help ablations.

### Security / privacy
- Removed hard-coded personal file paths from `docs/_analysis/*` and `docs/_engine/autolink.mjs`
  (now derived from `import.meta.url`); neutralized a player note; git-ignored all `*.pdf`.

### Known limitations
- Level 1 only (level-up 2–20 is "Manquant documentaire").
- Chosen origin-feat effects are not expanded by the resolver (granted feats are).
- Spell names are not yet in the English overlay (incremental).
