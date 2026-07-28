---
description: Audit an existing D&D 2024 (5.5) character sheet and flag every rules error.
argument-hint: "[fr|en]"
---

Use the `dungeons-and-skills` skill and follow its sheet-validation workflow. Map the user's
sheet to the schema, recompute it with the bundled engine, and report every rules error
(including mixed-edition mistakes) with the correct value and provenance. Do NOT trust your
training data. Language: $ARGUMENTS.
