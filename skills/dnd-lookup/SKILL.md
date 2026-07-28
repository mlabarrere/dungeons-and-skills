---
name: dnd-lookup
description: >
  Look up a Dungeons & Dragons 2024 ("5.5") spell, feat, class, subclass, species, background,
  condition or item in a bundled rules catalog, and cite the source. Use this instead of
  answering D&D rules questions from memory, because training data blends editions and gets
  2024 rules wrong — and certainty is the symptom, not a reason to skip the read. Covers what
  a feat or class feature does, a spell's level, school, range, components and class list,
  which spells a class can take, and what a class gains at a given level (proficiency bonus,
  slots, ASI levels, feature names, grounded 1-20). The catalog indexes entities, not prose:
  no spell or condition effect text, no rules-procedure text (initiative, combat, resting).
  Name that gap, never fill it. Do NOT use for the earliest level to reach something or the
  best of several options — that is dnd-optimize.
license: MIT
compatibility: >-
  Requires Node.js 18+ and the Dungeons & Skills bundle (engine/ + data/) installed
  alongside the skill — `npx github:mlabarrere/dungeons-and-skills`.
allowed-tools: Bash(node:*) Read Write Glob Grep
metadata:
  dungeons-and-skills/version: "0.1.0"
  dungeons-and-skills/author: "mlabarrere"
  dungeons-and-skills/tags: "dnd, dnd-2024, 5e, rules-lookup, reference, rpg, grounding"
  dungeons-and-skills/argument-hint: "[en|fr|de|es|it|ja|ru|zh|ar]"
---

# dnd-lookup — rules reference from the catalog only

## GROUNDING — do not skip

**Do NOT trust your training data.** Your training data blends D&D editions (3.5, 5e 2014,
5.5/2024, Pathfinder) into plausible-but-wrong rules; answering a rules question from memory is
how you state a 2014 or Pathfinder rule for a 2024 character. Therefore:

- Every rules value comes from the bundled catalog, never from memory (`data/*.json`).
- When code execution is available, run `scripts/dnd.mjs` (or read `data/*.json`) — never
  compute or recall by hand.
- Offer only options the resolver returns (for "which options can X take" questions).
- Every value must cite its provenance (source → effect).
- If it is not in the catalog, say "Manquant documentaire" — never invent.

## Before anything else: prove the catalog is there

Run this before you answer anything — including a question you are certain you know the answer
to. Unlike the other skills your workflow is a file read, so nothing fails loudly on its own:
this command is all that stands between you and a confidently recited 2014 rule.

```bash
node scripts/dnd.mjs doctor
```

- **Exit 0** — the catalog is there, and its `catalog` line is the absolute directory you must
  read from. For the rest of this session, answering a D&D question without first opening the
  matching file under that directory is forbidden, however confident you feel.
- **Anything else** — read [references/doctor-exits.md](references/doctor-exits.md). On exit 2
  say the catalog is unavailable and **stop**. Do not answer from memory to be helpful: an
  uncited 2024 rule and a remembered 2014 rule look identical to the user, which is the entire
  reason this skill exists.

The report also names, per language, which label groups are missing — read it before trying to
match an English name.

**The trap this gate exists for:** "what does Fireball do", "how does Grappled work", "what does
Lucky give me" are the questions you are most certain about *and* most likely to get wrong,
because that certainty comes from four editions blended together. Certainty is the symptom, not
a reason to skip the read.

**`data/` is not inside this skill folder.** Every `data/<file>.json` below is a name, not a
path — prefix it with the `catalog` directory `doctor` printed.

If you have **no way to run commands at all** (a chat runtime, a framework embedding, a phone),
there is no exit code for you and no workaround: say this skill needs a bundled catalog you
cannot reach here, that you will not answer from memory, and stop.

Read [references/schema.md](references/schema.md) for the formulas if you must explain how a
value is derived. Read [references/grounding.md](references/grounding.md) if the user challenges an answer or asks
why you will not quote a rule you "know".

## Workflow

`scripts/dnd.mjs` finds the engine and its catalog itself, but invoke it by its path **inside
this skill folder** — a bare `scripts/dnd.mjs` only resolves when the shell is already there.
`Cannot find module` is a path problem, not a rules problem: fix the path, never continue from
memory.

- **Entity definitions.** Read the matching file in `data/` — `classes.json`, `species.json`,
  `backgrounds.json`, `feats.json`, `spells.json`, `conditions.json`, `glossary.json` — and
  report the entity's fields plus its `ref` + `source` (e.g. `img:105`) as the citation. Do not
  paste more than needed. **What each file actually carries differs, and it decides your
  answer:**

  | Asked about | The catalog gives you | So "what does it do" is |
  |---|---|---|
  | feat | typed `effects[]`, `prerequisite`, `category`, `source` | answerable in full |
  | class / subclass / species / background | typed `effects[]`, `ref`, `source` | answerable in full |
  | spell | level, school, casting time, range, components, material, duration, class list, save, damage type | **not answerable** — no effect text exists |
  | condition | its name and a glossary `ref` — nothing else | **not answerable** |

  For the bottom two rows: give every field the catalog does have, then say **"Manquant
  documentaire"** for the effect. That answer is correct and complete. Narrating the effect
  "from what you know" produces a 2014 or Pathfinder description the user cannot tell apart
  from a 2024 one — the exact failure this skill exists to prevent. Then orient the user: tell
  them in their language that this spell's effect text is not in the catalog; direct them to
  D&D Beyond (dndbeyond.com/spells) or the PHB 2024.
- **Matching a name.** `data/labels.*.json` covers classes, subclasses, species, backgrounds
  and spells in all 9 languages; feats and conditions in EN and FR only. It has **no group for equipment or
  languages** — those entries carry French names only. So "the Lucky feat" or "the Grappled
  condition" can be matched by EN name when `--lang en`; for other languages search
  `feats.json` / `conditions.json` for a plausible French form, and if you do not find it, say
  "Manquant documentaire" and ask the user for the French name. Do **not** translate the name
  yourself and present the result as a hit — a guessed id silently returns the wrong entry.
  `node scripts/dnd.mjs doctor` lists which groups are unlabelled; trust it over this paragraph.
- **"Which options can a <class> take" questions** (spells on a list, class skills, fighting
  styles): drive the resolver. Put the class into an `answers.json` and run
  `node scripts/dnd.mjs options answers.json`; the returned `options` are the exact legal set,
  filtered by the rules. Never list options from memory.
- **"What does a <class> get at level N"**: run `node scripts/dnd.mjs progression <classId>`
  (or `progression <subclassId>` for subclass features). Every row is cited from the class
  table: proficiency bonus, feature *names*, spell/pact slots, ASI levels, for levels 1-20.
  Report the row and its source. The *mechanical effect* of a level-2+ feature is not in the
  catalog — name it, then say "Manquant documentaire" for what it does.
- **Not found?** If the term is not in the catalog (wrong edition, un-modeled subclass), say
  **"Manquant documentaire"** and stop. Do not reconstruct it from training. Orient the user
  in their language:
  - **Subclass not in catalog**: tell the user the subclass is not in the catalog and the
    result is partial; direct them to D&D Beyond or the PHB 2024.
  - **Level 2+ content**: tell the user this product only covers level 1; for higher levels
    direct them to D&D Beyond or their DM.

## Gotchas

- **"Manquant documentaire" is a correct answer, not a failure.** The catalog is 2024-only; a
  2014 feat is out of scope. Naming the gap beats guessing.
- **Two different level limits, do not conflate them.** Milestones are grounded 1-20 via
  `progression`; entity *text* (spells, feats) covers what a level-1 character can reach, and
  level-2+ feature effects are not modeled. "Fighter gets Action Surge at 2" is citable;
  "here is what Action Surge does" is "Manquant documentaire".
- **Cite `ref` + `source`, not the file you read.** The provenance the user needs is the book
  reference (e.g. `img:105`), not `data/spells.json`.

## Languages

Answer in the user's language — any of the 9 supported: `en` `fr` `de` `es` `it` `ja` `ru` `zh`
`ar`. Resolve and display entity names via `data/labels.*.json`, and pass `--lang <code>` when you
drive `scripts/dnd.mjs` so quoted values match the user's language (English fallback if a label is
missing).
