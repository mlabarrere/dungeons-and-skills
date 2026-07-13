# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project aims to follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] — 2026-07-13

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
- Publish-readiness: 400×400 logo (`assets/logo.svg`), enriched plugin/marketplace manifests
  (homepage, license, keywords, icon), a zero-dependency installer (`install.mjs` + `bin`,
  runnable via `npx github:…`), and a README Quickstart table per host.
- Benchmark suite (`benchmarks/`): research-grade atomic error scorer with 25-category taxonomy,
  per-skill oracles, five isolated conditions (`bare` → `full-project`), bootstrap CI stats, and
  a deterministic self-consistency oracle (34/34 at 0 errors).
- Exploratory ablation for `dnd-build` (5 characters, Haiku/Sonnet/Opus): `bare` vs
  `skill-engine`. Atomic error rate 14–21% (bare) → 0–0.6% (skill-engine); −96% to −100%
  relative reduction (`benchmarks/reports/pilot-build-ablation.md`).

### Changed
- **Grimoire → Dungeons & Skills** rebrand: renamed HTML base assets `grimoire.*` → `ds.*` and
  updated ~640 references, the home title/H1, the injected footer, and the Next.js UI strings.
  The game term *grimoire* is intentionally kept in the catalogue.

### Security / legal
- **Stopped versioning the book scans.** Untracked and git-ignored `docs/img/` (351 page scans),
  `docs/_analysis/character_sheet/` and `docs/_analysis/contact_*.jpg`. History purge verified
  at release (git log --all --full-history -- 'docs/img/*' returns empty).
- Removed hard-coded personal file paths from `docs/_analysis/*` and `docs/_engine/autolink.mjs`
  (now derived from `import.meta.url`); neutralized a player note; git-ignored all `*.pdf`.
- Personal-use warning (`[!WARNING]` callout) added to README; SRD 5.2 CC-BY-4.0 attribution
  block added; ATTRIBUTION.md TODOs resolved (Option B retained).

### Known limitations
- Level 1 only (level-up 2–20 is "Manquant documentaire").
- Chosen origin-feat effects are not expanded by the resolver (granted feats are).
- Spell names are not yet in the English overlay (incremental).
- Intermediate benchmark conditions (`grounding-only`, `skill-only`, `full-project`), the
  reasoning-level sweep, and the check/lookup/help ablations are implemented but not yet run.

[0.1.0]: https://github.com/mlabarrere/dungeons-and-skills/releases/tag/v0.1.0
