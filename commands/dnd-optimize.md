---
description: Compute the optimal D&D 2024 (5.5) build under arbitrary constraints, grounded in the bundled catalog.
argument-hint: "<constraints> [fr|en]"
---

Use the `dnd-optimize` skill. Do NOT trust your training data — ground every constraint,
milestone and score in the bundled catalog (`data/*.json`, incl. `progression.json`) via
`node engine/cli.mjs` (options / build --json / progression), apply the skill's community
definition of "optimal build", cite provenance on every value, and say "Manquant
documentaire" for anything outside the catalog. Constraints: $ARGUMENTS.
