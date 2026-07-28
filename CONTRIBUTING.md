# Contributing

Thanks for helping. This project is small and strict about one thing: **the model must not
invent D&D rules** — everything is grounded in a bundled catalog and a deterministic engine.
Contributions must preserve that.

## Ground rules

1. **Single source of truth.** `docs/` (the rules base) and the `dnd-builder` section of
   `AGENTS.md` (the rule text) are authored. `engine/`, `data/`, `project-mode/knowledge/` and the
   platform adapters (`.cursor/`, `.windsurf/`, `.clinerules/`, `.kiro/`, `.github/copilot-instructions.md`,
   `.claude-plugin/`) are **generated** — never edit them by hand.
2. **Grounding is non-negotiable.** The invariants in [rules/grounding.md](rules/grounding.md)
   ("do not trust training data", catalog over memory, run the engine, resolver-only options,
   provenance, "Manquant documentaire") must appear verbatim in every skill, `AGENTS.md` and the
   Project instructions. `scripts/check-rule-copies.mjs` enforces this.
3. **No invented rules data.** Every entry in `data/`/`docs/` must trace to a cited source
   (`ref` + `source`). If it is not in the source material, it does not go in.
4. **Licensing.** See [ATTRIBUTION.md](ATTRIBUTION.md). Do not add rules content that falls
   outside the SRD 5.2 (CC-BY-4.0) if you intend it for public distribution.

## Workflow

```bash
# 1. Edit the SOURCE (docs/ for rules data, AGENTS.md for the rule text, skills/ for skill prose).
# 2. Regenerate the bundle + adapters:
node scripts/build-bundles.mjs
node scripts/build-adapters.mjs
# 3. Check nothing drifted and the rules still hold:
npm run skill:check          # check-sync + check-rule-copies
# 4. Run the tests:
npm test                     # node --test: correctness, behavior, catalog, adapters, packaging
```

### Adding rules data (class, species, background, feat, spell…)

Author it in `docs/` following `docs/data/README.md` and `docs/_engine/effects.md`, then
regenerate. The existing guards must stay green: `node docs/_engine/catalog-lint.mjs`,
`golden-test.mjs`, `sheet-lint.mjs`, plus this project's `npm test`.

### Adding an English label

Add the `id → EN name` to `data/labels.en.json`. `scripts/check-sync.mjs` reports coverage;
structural entities (classes, species, backgrounds) must be complete.

### Adding an example character

Build it with the engine, save `examples/<id>.answers.json`, regenerate `<id>.sheet.md`, and add
the expected values to `tests/correctness.test.mjs`. It must build with **0 sheet-lint errors**.

### Adding a platform adapter

Add the target file to `scripts/build-adapters.mjs`, run it, and add the path to the adapter list
in `scripts/check-rule-copies.mjs`. See [PLATFORMS.md](PLATFORMS.md).

## Pull request checklist

- [ ] Edited the source, not generated files.
- [ ] `node scripts/build-bundles.mjs && node scripts/build-adapters.mjs` run, output committed.
- [ ] `npm run skill:check` passes (no drift, invariants present).
- [ ] `npm test` passes.
- [ ] New rules data cites its source; nothing invented.
- [ ] No personal data (no real names, emails, filled character sheets).

By contributing you agree your contribution is licensed under the [MIT License](LICENSE) (code)
and that any rules content respects [ATTRIBUTION.md](ATTRIBUTION.md).
