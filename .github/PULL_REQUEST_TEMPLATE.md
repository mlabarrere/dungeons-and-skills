<!-- Thanks for contributing! See CONTRIBUTING.md. -->

## What & why

<!-- What does this change and why? Link any issue. -->

## Checklist

- [ ] I edited the **source** (`docs/`, `AGENTS.md`, `skills/`), not generated files
      (`engine/`, `data/`, adapters, `project-mode/knowledge/`).
- [ ] Ran `node scripts/build-bundles.mjs && node scripts/build-adapters.mjs`; committed the output.
- [ ] `npm run skill:check` passes (no drift; grounding invariants present).
- [ ] `npm test` passes.
- [ ] New rules data cites its source (`ref` + `source`); nothing invented.
- [ ] Respects [ATTRIBUTION.md](../ATTRIBUTION.md) (SRD 5.2 / CC-BY for anything public).
- [ ] No personal data (real names, emails, filled character sheets).
