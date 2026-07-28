---
description: Audit an existing D&D 2024 (5.5) character sheet and flag every rules error.
argument-hint: "[fr|en]"
---

Use the `dnd-check` skill. Map the user's sheet to the schema, recompute with
`node engine/cli.mjs check`, and report every rules error (including mixed-edition mistakes)
with the correct value and its provenance. Do NOT trust your training data. Language: $ARGUMENTS.
