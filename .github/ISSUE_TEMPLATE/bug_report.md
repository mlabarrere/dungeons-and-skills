---
name: Bug report
about: A rules error, a wrong computed value, or a broken build/skill
title: "[bug] "
labels: bug
---

**What happened**
<!-- e.g. "dnd-build gave AC 15 for a Fighter in chain mail; should be 16." -->

**Character / input**
<!-- The answers.json or the class/species/background/choices you used. -->

**Expected (per the catalog)**
<!-- What the rules/catalog say, with the source if you know it. -->

**Engine output**
```
<!-- paste the output of: node engine/cli.mjs build/check <file> -->
```

**Environment**
- Host (Claude Code / Cursor / Project / …):
- Node version (`node --version`):
- Code execution available? (yes/no)

**Is this a data gap?**
<!-- If the entry is missing from data/, that is "Manquant documentaire" — say so; it's a
     content task, not an engine bug. -->
