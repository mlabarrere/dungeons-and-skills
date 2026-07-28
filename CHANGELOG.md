# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project aims to follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- One autonomous public `dungeons-and-skills` Agent Skill containing its deterministic
  engine, audited SRD catalog, renderer assets, rule references, licence and attribution.
  Standard installation now works with
  `npx skills add mlabarrere/dungeons-and-skills --skill dungeons-and-skills`; CI verifies
  the isolated installed folder with `doctor` and a real build.
- Native Claude marketplace commands from the public GitHub repository, while preserving
  `/dnd-build`, `/dnd-check`, `/dnd-lookup`, `/dnd-optimize` and `/dnd-help` as shortcuts
  to the unified skill.
- Portable HTML/Markdown/JSON rendering for `build` and `check`, with strict
  `--format`, nine-language `--lang`, deterministic `--output` paths, embedded
  standalone assets, structured diagnostics/counters/provenance, and stable
  catalog IDs in built models.
- English labels for all catalogued class features and structural progression
  markers, generated from a primary-source audit maintained outside the public
  SRD distribution.
- Exact JSON and normalized HTML regression goldens, adversarial HTML-escaping
  coverage, CLI format/language matrices, and real installed-tree build tests.
- Fifth skill `dnd-optimize` — the optimal build under an arbitrary constraint set (locked
  concept, "this spell asap", a role to fill). It carries an explicit, community-aligned
  definition of *optimal*: legal (0 sheet-lint errors) + concept-first + earliest goals +
  Pareto non-dominance on the role-weighted offense/durability/control/reliability vector,
  under stated white-room assumptions. Candidates come only from the resolver and are scored
  by the engine.
- `data/progression.json` — level 1–20 milestones for the 12 classes (proficiency bonus,
  class features, spell slots, warlock pact slots, class counters), extracted mechanically
  from the class tables of the HTML rules base by `scripts/extract-progression.mjs`. New
  `node engine/cli.mjs progression <classId|subclassId>` reads it (subclass features by
  level come from `subclasses.json`), so "when do I get X" is cited, never recalled.
- `--json` on `engine/cli.mjs build` / `check` — machine-readable derived values, for
  comparing candidate builds without re-parsing the markdown sheet.

- **Agent Skills specification conformance.** `scripts/check-skills-spec.mjs` (zero-dependency)
  enforces the [open spec](https://agentskills.io/specification) in CI: spec-only frontmatter
  keys, `description` within 1024 characters, `compatibility` within 500, string-valued
  `metadata`, and no path escaping a skill folder.
- **Autonomous skill runtime.** The generated `scripts/dnd.mjs` resolves the engine embedded
  in the same skill folder, which also carries generated `references/`, `engine/`, `data/`
  and `assets/` copies. Drift checks compare every runtime byte with its audited source.
- Unified `evals/evals.json` output-quality cases and
  `evals/trigger_queries.json` triggering queries covering creation, checking, lookup,
  optimization, diagnostics and ambiguous requests.
- Skills and their `references/` are DISCOVERED on disk, never listed. A hardcoded roster
  silently skips a newly added skill instead of failing; `listSkills()` and `referencesFor()`
  in `scripts/build-adapters.mjs` replace every roster, and unlinked reference copies are
  reported as orphans and garbage-collected.

- `node engine/cli.mjs doctor` — reports the installation as it actually is: resolved engine and
  catalog paths, per-entity counts read from disk, per-language label coverage, Node version.
  Exit 0 when the bundle is usable, 2 when it is missing. Its first run surfaced a real gap:
  `labels.en.json` has no `abilities` group, so English ability names fall back to a constant.

### Fixed
- Release `.tar.gz` archives now use a host-neutral RFC 1952 OS byte, making
  their SHA-256 digest reproducible across Windows, Linux and macOS. The
  immutable `v0.2.0-beta.2` remains installable but is superseded by
  `v0.2.0-beta.3` for cross-platform byte reproducibility.
- **The engine accepted values that are not in the catalog.** A hallucinated class id
  (`"class":"warlord"`) was treated as answered, so the sheet computed from nothing and
  rendered `undefined` under a green lint — the exact failure this pack exists to prevent.
  Every answered value is now checked against the option set the resolver itself returns,
  and an unknown id is refused rather than defaulted.
- **`build` ignored `ready`.** An incomplete answers file produced a sheet reporting "no
  remaining choices" and 0 lint errors while silently defaulting ability scores to 10 and
  merging every equipment package. `build` now refuses and names the pending choice ids.
- **An option the resolver OFFERED produced `DC NaN / atk NaN`** with 0 lint errors: the
  catalog listed French ability ids (`sag`, `for`) while the engine computes on English ones
  (`wis`, `str`). 17 stale ids in `docs/data/` and two in `docs/_engine/resolver.mjs`
  (the default ability block and melee weapon ability) corrected.
- **`--lang` guessed instead of validating**: `--lang=en` rendered French, `--lang klingon`
  rendered English, both exiting 0. It is now a closed set and `--lang=xx` is honoured.
- A misspelled answer key was silently discarded; it is now reported.
- Read failures returned raw Node stack traces naming internal files; they are now one
  actionable line. Input and usage errors exit 3, leaving exit 2 to mean only "bundle missing".
- `check` crashed with a TypeError when handed an answers file; it now says which command to use.
- **The engine shim could execute an arbitrary `engine/cli.mjs`** found by walking up from the
  caller's working directory. The `process.cwd()` fallback is gone and a candidate must have a
  sibling `data/` catalog.
- The generated `references/` copies told the agent to run `engine/cli.mjs` and read
  `rules/schema.md` — neither reachable from inside a skill folder. `referenceCopy()` now
  rewrites those paths, and the validator scans `references/` for dead links and escapes.
- `rules/schema.md` documented French answer keys (`classe`, `guerrier-competences`) against an
  engine that uses English slugs, and `rules/grounding.md` claimed ids were French kebab-case and
  that level-up was absent from the data. Both corrected.
- Every SKILL.md claimed `scripts/dnd.mjs` "runs from any working directory". The engine
  self-locates; the shim path does not. Corrected in all five.
- **`dnd-help` was documentation wearing a skill's frontmatter** — 79 body lines, zero
  procedures, and it shipped `scripts/dnd.mjs` without ever invoking it. Everything it routed was
  already in the four sibling descriptions the agent holds in context permanently, and its own
  family table had gone stale for a commit. It now runs `doctor` instead of asserting catalog
  sizes from prose, owns the recovery procedure keyed to the exit-code taxonomy, and answers the
  one question no sibling does ("why won't you just tell me from memory"). The hardcoded counts,
  the family table, the duplicated command list and the Claude-Code-only slash commands are gone;
  a test keeps the counts from coming back.
- `examples/*.sheet.md` had rotted — no test compared them. Regenerated, and `tests/golden.test.mjs`
  now diffs them against live engine output.

- Prepared-spell options were not capped by level: at level 1 the resolver offered every
  spell of levels 1–9 on the class list, so a level-1 Warlock could "prepare" a 7th-level
  spell with 0 lint errors. The `preparedSlots` effects and `prepared` choices of the 8
  casting classes now carry `maxLevel: 1` (the class tables give only level-1 slots at
  level 1), and `engine/cli.mjs` cross-checks every prepared spell and cantrip against
  `spells.json` + `progression.json` on `build`/`check` — catching user-supplied sheets too.

### Changed
- Skill frontmatter reduced to spec keys; `version`, `author`, `tags` and `argument-hint` moved
  under `metadata` with namespaced keys, `agents` dropped. `compatibility` added — these skills
  require Node.js 18+ and the bundled catalog.
- `dnd-build` (1168 → 980) and `dnd-lookup` (1066 → 884) descriptions brought under the
  1024-character limit; `dnd-check` (1018 → 817) given headroom. Playstyle-based triggers and the
  explicit 3.5 / 5e 2014 / Pathfinder exclusion were preserved.
- Skills reference `scripts/dnd.mjs` instead of `$CLAUDE_SKILL_DIR/../../engine/cli.mjs`, removing
  the dependency on a Claude-Code-specific environment variable.
- `PLATFORMS.md` re-tiered: clients with native Agent Skills support now load `skills/` directly.
  The rule-file adapters are kept as fallbacks and are still generated and drift-checked.
- `allowed-tools` is now `Bash(node:*)`. The spec defines the field as a space-separated
  string, so the inner space in `Bash(node *)` split the token in two.
- Description length now counts the trailing newline that YAML clip-chomping (`>`) keeps,
  matching the reference validator exactly.
- US English spelling across the skills and the rule sources (`armor`, `modeled`, `localized`).
- `.claude-plugin/marketplace.json` fields that had been hand-edited (`$schema`, `category`,
  `author`, `tags`…) are now emitted by the generator, so regeneration is lossless.

- Skill instructions unified to a single English meta-prose with first-class multilingual
  behaviour — the assistant converses and outputs in any of the 9 supported languages. Removed the
  French-only sections and the "FR or EN" cap; every skill now carries a consistent *Languages*
  section.

### Removed
- The Next.js web app (`src/`, Next/React/Tailwind tooling) and the static builder site
  (`docs/html/builder.html` + `builder.js`): this is a skill pack for agents, not a web app. The
  HTML documentary base and the deterministic engine under `docs/` are kept.
- The benchmark suite (`benchmarks/`) and its CI gates: exploratory and no longer maintained. The
  skills' reliability rests on the deterministic engine + catalog, documented in the READMEs.

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
