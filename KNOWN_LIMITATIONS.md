# Known limitations

This file states the supported boundary for the current unreleased version. A missing capability
is reported as **Manquant documentaire**; it must not be filled from model memory.

## Rules scope

- Character creation and optimization are implemented for **level 1 only**.
- `progression` exposes cited class milestones for levels 1–20 and the twelve SRD subclasses.
  Those reference tables do
  not implement level-up choices, multiclassing, higher-level spell selection or a level 2–20
  character builder.
- An existing sheet can be audited only for rules represented by the bundled catalog and schema.
  Unknown entities and unresolved legacy identifiers are documentary gaps, not validated values.
- Chosen origin feats are recorded, but some mechanical effects are not expanded. Granted effects
  present in the catalog are still applied.
- The public catalog contains the 83 SRD spells needed by supported level-1 choices (cantrips and
  level-1 spells). Higher-level spell descriptions and non-SRD spells are documentary gaps.
- A `0 errors` result with one or more warnings is **not fully verified**. In particular, a spell
  list used without a declared quota requires manual comparison with the granting source.

## Rendering and localization

- Computed rules values are deterministic for the same input, catalog and engine version.
  Rendering language changes labels, not the computation.
- The UI chrome is translated into nine languages. Catalog entities use verified English labels,
  then stable IDs; unprovenanced catalog translations are deliberately not shipped.
- Standalone HTML embeds its assets. Site-mode HTML remains coupled to the documentation tree.
- HTML is a printable documentary artifact, not an interactive application. Beta browser checks
  cover standalone loading, no external assets, escaping, printing, RTL and warning visibility;
  exhaustive application-style accessibility certification is out of scope.

## Host support

- **Certified beta hosts:** Claude Code, OpenAI Codex and Cursor, using the same deterministic CLI
  and installed skill bundle.
- **Agent Skills compatible:** other hosts implementing the open Agent Skills specification.
- **Instruction-only:** Project/rule-file hosts without code execution. They remain catalog
  grounded, but calculations are performed by the model and may drift.

## Distribution status

- The project is not published to the npm registry.
- The repository is directly installable as a Claude Code plugin marketplace, but it is not
  yet listed in a central/community marketplace directory.
- Install from a GitHub release archive. Tags are immutable; fixes receive a new beta version.

Rules data has separate redistribution constraints from the MIT-licensed code. See
[ATTRIBUTION.md](ATTRIBUTION.md) before distributing any bundle.
