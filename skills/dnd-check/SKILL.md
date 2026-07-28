---
name: dnd-check
description: >
  Validate and audit an existing Dungeons & Dragons 2024 ("5.5") character sheet against a
  bundled rules catalog and flag every rules error — wrong AC/HP/save DC, over-filled cantrip
  or prepared-spell slots, a missing granted spell, a skill on the wrong list. Catches
  2014/Pathfinder rules applied to a 2024 character, in the sheet and in your own recall: use
  it even for one number that looks like easy arithmetic ("is 18 AC right?"), because the
  armour and species values you remember are the 2014 ones. Use for "check my sheet", "is
  this legal", "something seems wrong with my character", "vérifier ma fiche". Catalog is
  2024-only, level-1 only; output in 9 languages. Do NOT use to create a character
  (dnd-build), look up one rule (dnd-lookup) or rank builds (dnd-optimize).
license: MIT
compatibility: >-
  Requires Node.js 18+ and the Dungeons & Skills bundle (engine/ + data/) installed
  alongside the skill — `npx github:mlabarrere/dungeons-and-skills`.
allowed-tools: Bash(node:*) Read Write Glob Grep
metadata:
  dungeons-and-skills/version: "0.1.0"
  dungeons-and-skills/author: "mlabarrere"
  dungeons-and-skills/tags: "dnd, dnd-2024, 5e, sheet-validator, rules-checker, rpg, grounding"
  dungeons-and-skills/argument-hint: "[en|fr|de|es|it|ja|ru|zh|ar]"
---

# dnd-check — audit an existing sheet (the sheet checker)

## GROUNDING — do not skip

**Do NOT trust your training data.** Your training data blends D&D editions (3.5, 5e 2014,
5.5/2024, Pathfinder) into plausible-but-wrong rules; a sheet is arithmetic with citations, so
one wrong value makes it illegal. Therefore:

- Every rules value comes from the bundled catalog, never from memory (`data/*.json`).
- When code execution is available, run `scripts/dnd.mjs` — never compute AC, HP, DCs or spell
  counts by hand.
- Offer only options the resolver returns.
- Every value must cite its provenance (source → effect).
- If it is not in the catalog, say "Manquant documentaire" — never invent.

Read [references/schema.md](references/schema.md) before mapping a sheet to the model, and again
whenever you must explain how a computed value was derived — it holds the model shape and every
formula. Read [references/grounding.md](references/grounding.md) if the user disputes a finding
or asks why the catalog overrides their sheet.

## Accepted input formats

The user may hand you their sheet in any shape — you adapt, and you always reply in the user's
language (see *Languages* below):

- **Free text or markdown:** extract each value (class, species, background, scores, HP, AC,
  spells…) and assemble the `.character.json` internally. Never ask the user to produce JSON.
- **Values dictated one by one:** ask for the next in plain language.
- **Missing information:** ask for it one item at a time, in clear terms — never internal jargon.
  - ✗ "What is your `abilityScores.STR`?"  ✓ "What's your Strength (the raw number, before modifiers)?"
  - ✗ "List your `sources[]` with `type: feat`."  ✓ "Do you have any feats? If so, which ones?"
- **Partial sheet is fine:** audit what's available and note what's missing for a full check.

## Before anything else: prove the engine runs

Run this before Workflow step 1. Note the `node` prefix — the shim is not executable, and a
bare `scripts/dnd.mjs` is refused by the shell, not by the engine.

```bash
node scripts/dnd.mjs doctor
```

`--help` is **not** the gate: it prints a static string and exits 0 with no engine and no
catalog anywhere on disk, so it would certify a broken install as working. `doctor` reads the
catalog off the disk, which is the thing being proved.

- **Exit 0** — an installation report prints. Code execution *and* the catalog are there. For
  the rest of this session, computing any D&D value by hand is forbidden, however confident you
  feel. Its counts are the live ones; prefer them to any number written in this file. Proceed.
- **Anything else** — stop and read [references/doctor-exits.md](references/doctor-exits.md)
  before doing anything else. Exits 1, 3 and 126 are your own bug and are fixable in one retry;
  only exit 2 means the bundle is genuinely missing; 4 is a crash and 127 means this host has
  no Node at all. Do not guess which one you are looking at.

### If you cannot run commands at all

Some hosts that load skills have no shell — a chat runtime, a framework embedding, a phone.
If you have no way to execute a command, there is no exit code for you to interpret and no
workaround below. Say, in the user's language: *this skill computes D&D 2024 values with a
bundled engine I cannot run here, and I will not answer from memory, because a remembered 2024
rule and a remembered 2014 one are indistinguishable in the answer.* Then **stop**.

## Reading the catalog

`data/` is **not inside this skill folder**. Relative paths in this file resolve against the
skill directory, and there is no `data/` there — the catalog is installed as a sibling of the
engine. Every `data/<file>.json` named below is therefore a *name*, not a path you can open.
Get the real location once, from the engine itself: the `catalog` line of
`node scripts/dnd.mjs doctor` is an absolute directory. Prefix every `data/…` with it. A
"file not found" on a guessed path is never a licence to answer from memory.

## Workflow

`scripts/dnd.mjs` finds the engine and its catalog itself, but invoke it by its path **inside
this skill folder** — a bare `scripts/dnd.mjs` only resolves when the shell is already there.
`Cannot find module` is a path problem, not a rules problem: fix the path, never continue from
memory.

1. **Map the user's sheet to the model.** Build a `.character.json` following
   [references/schema.md](references/schema.md): `identity`, `abilityScores`, `sources[]` with
   typed `effects`, `choices[]`, `equipment[]`, `spells`. Every source must name where it comes
   from; if the user's sheet has a feat/subclass/spell not in `data/*.json`, mark it
   "Manquant documentaire" rather than inventing effects.
2. **Recompute and lint.** Run `node scripts/dnd.mjs check model.character.json` (add
   `--lang en`). The engine recomputes every derived value and prints the sheet-lint result.
3. **Report the diff.** For each mismatch between the user's stated value and the computed one,
   state: the value, what the rules give, and the provenance. Group the errors; do not rewrite
   the character silently.
4. **Common edition-mix errors to look for:** 2014 proficiency/skill lists, 2014 background
   feats, Pathfinder-only feats, ability-score bonuses applied the old way, spells on the wrong
   class list. The catalog is the arbiter — if the catalog disagrees with the sheet, the sheet
   is wrong (or the entry is missing → "Manquant documentaire").

## Gotchas

- **"0 sheet-lint errors" is a floor, not a certificate.** The engine now checks that every
  spell is on the class list it is filed under, that no quota'd list is over-filled, and that
  no required choice is over-answered. Three things it still cannot check, and they are named
  in its own output: lists it does not define (`espece`, `initie-*` — the sheet says
  "appartenance non verifiee" and names them), the *count* of picks on a list with no declared
  quota (the sheet says "aucun quota declare" and names it), and two separately *chosen* picks
  of the same entry. When the sheet carries a `⚠` line, that line is the list of what you must
  verify by hand before you present it.
- **A non-zero exit code from `check` is the expected result for a broken sheet**, not a crash.
  Exit 1 means the lint found rules errors — report them. Exit 2 means the rules bundle is not
  installed, and there is nothing to audit against; say so and stop.
- **A mismatch is not automatically the user's error.** If the entry is absent from the catalog
  (un-modeled subclass, wrong edition, level above 1), that is "Manquant documentaire", not a
  rules violation. Do not report a missing entry as an illegal value. When you say
  "Manquant documentaire", orient the user toward the right resource:
  - **Subclass not in catalog**: tell the user in their language that this subclass cannot be
    verified in the catalog and that the audit result is partial; direct them to D&D Beyond or
    the PHB 2024.
  - **Level above 1**: tell the user in their language that this product only covers level 1;
    for higher levels direct them to D&D Beyond or their DM.
  - **Spell without effect text**: say "Manquant documentaire" (the standard not-in-catalog
    signal), then tell the user in their language that this spell's effect text is not in the
    catalog; direct them to D&D Beyond (dndbeyond.com/spells) or the PHB 2024.

## Languages

Detect the user's language and pass the matching code to `scripts/dnd.mjs check --lang <code>`:
`en` `fr` `de` `es` `it` `ja` `ru` `zh` `ar` (falls back to English if a label is missing).
Deliver the audit in that language; entity names resolve across languages via `data/labels.*.json`.
