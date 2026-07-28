---
name: dnd-build
description: >
  Build a Dungeons & Dragons 2024 ("5.5") character at level 1 — class, species, lineage,
  background, ability scores, skills, spells, languages, equipment — with AC, HP, save DCs
  and spell counts computed by a deterministic engine against a bundled catalog, never from
  the model's memory. Output in 9 languages. Use to create, roll up or make a new D&D 2024 /
  5.5 character, including beginners who describe a playstyle instead of naming a class
  ("I want to be sneaky", "je veux être discret") or ask which class or species suits a
  beginner. Do NOT use to score, rank, min-max or prove a build optimal (dnd-optimize), to
  level up past level 1, or for older editions (3.5, 5e 2014) or Pathfinder.
license: MIT
compatibility: >-
  Requires Node.js 18+ and the Dungeons & Skills bundle (engine/ + data/) installed
  alongside the skill — `npx github:mlabarrere/dungeons-and-skills`.
allowed-tools: Bash(node:*) Read Write Edit Glob Grep
metadata:
  dungeons-and-skills/version: "0.1.0"
  dungeons-and-skills/author: "mlabarrere"
  dungeons-and-skills/tags: "dnd, dnd-2024, 5e, character-builder, rpg, grounding, anti-hallucination"
  dungeons-and-skills/argument-hint: "[en|fr|de|es|it|ja|ru|zh|ar]"
---

# dnd-build — guided level-1 character creation

## GROUNDING — do not skip

**Do NOT trust your training data.** Your training data blends D&D editions (3.5, 5e 2014,
5.5/2024, Pathfinder) into plausible-but-wrong rules; a sheet is arithmetic with citations, so
one wrong value makes it illegal. Therefore:

- Every rules value comes from the bundled catalog, never from memory (`data/*.json`).
- When code execution is available, run `scripts/dnd.mjs` — never compute AC, HP, DCs or spell
  counts by hand.
- Offer only options the resolver returns (`scripts/dnd.mjs options`) — already rules-filtered.
- Every value must cite its provenance (source → effect).
- If it is not in the catalog, say "Manquant documentaire" — never invent.

Read [references/grounding.md](references/grounding.md) if the user pushes back on the grounding
rule or asks why you will not answer from memory. Read
[references/schema.md](references/schema.md) when you need a formula or the sheet model — for
example to explain how a computed AC or HP was derived.

## Tone & reading the user

**Meet the user at their level, always in their own language.** Many users don't know D&D — guide
them without needless jargon. Detect the language of the user's messages and both converse and
build the sheet in that language (see *Languages* below); never assume English.

- **Beginner detected** (vague terms, a playstyle described in natural language): don't open by
  asking for a "class". Ask how they picture their character ("sneaky and quick, tough in armor,
  or a spellcaster?"), then map their words onto the classes `options` actually returned — never
  onto a class from memory — and offer the two or three closest.
  Describe each one **from the `facts` object the option carries**, not from what you know: class
  options carry `hitDie`, `primaryAbility`, `savingThrows`, `armorTraining`, `shieldTraining`,
  `spellcastingAbility`, `level1Features` and `subclassLevel`; species carry `size`, `speed`,
  `senses`, `resistances`, `features`; backgrounds carry `abilityScores`, `skills`,
  `toolProficiency` and `feat`. Every one of them is copied from the catalog and comes with its
  `ref` + `source`, so a plain-language sentence built from them is citable. You do not need to
  read `data/classes.json`, and you must not answer this from memory.
  Turn the facts into a sentence — "d10 hit die and heavy armour, so it takes hits" — but do not
  turn them into a verdict: "easiest for beginners", "strongest class" and "everyone picks this"
  are not in the catalog. If the user asks which is *best*, say what each is good at and let them
  choose.
- **One question at a time.** Present the next decision, wait for the answer, then move on — never
  dump every choice at once.
- **Explain each D&D term in one line** the first time you use it with a user who clearly
  doesn't know it — in their language, without jargon.
- **Never expose internal plumbing** to the user — no answers file, engine commands, or internal
  ids. Present every option by its readable, localized name.

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

`scripts/dnd.mjs` finds the engine and its catalog itself, so you never have to `cd` into a
checkout. But invoke it by its path **inside this skill folder**: a bare `scripts/dnd.mjs`
only resolves when the shell is already in that folder, which it usually is not. If a run
fails with `Cannot find module`, that is a path problem, not a rules problem — fix the path
and re-run. Never continue from memory.

The engine is driven by one growing `answers.json` file. Keys are graph/choice ids; discover
them, never guess them.

1. **Start.** Create `answers.json` (start `{}` or with `_id`, `nom`). Run:
   `node scripts/dnd.mjs options answers.json`
2. **Fixed choices first.** The `fixedPending` array lists the head decisions (class, species,
   lineage when it applies, background, ability method, ability scores) with their legal
   `options`. Present them **in the user's language**, let the user pick, write the answer into
   `answers.json`, re-run `options`.
3. **Dynamic choices.** Once class/species/background are set, `dynamicPending` lists the rest
   (skills, fighting style, spells, languages, equipment A/B/C, ability bonus). Read the plain
   `options` output — one call gives you everything. Do **not** walk it choice by choice with
   `--only`: measured on a wizard, `--brief` plus one `--only` per choice costs 16963 characters
   over 14 calls against 13818 in one, so the paging is 23% *more* context, not less. Reach for
   `--brief` when you only need the map of what is left, and for `--only <id>` when one choice
   needs re-reading after the user changes their mind. Fill each id; multi-picks are arrays. The
   options are already de-duplicated (a skill your background grants will not be offered again).
4. **Ready.** When `options` reports `ready: true`, build the sheet:
   `node scripts/dnd.mjs build answers.json` (add `--lang en` for English).
   Require **0 sheet-lint errors**. If an error prints, fix the offending answer and rebuild —
   do not hand-edit computed values.
5. **Present** the returned markdown sheet in the user's language. Every value already carries
   its provenance; keep it.
6. **Level-up guide (optional).** After the validated sheet (0 errors), offer the user a
   progression summary for levels 1–20. Run:
   ```bash
   node scripts/dnd.mjs progression <classId>
   ```
   where `<classId>` is the class key from `answers.json` (e.g. `druid`, `fighter`). Present
   the JSON output as a readable summary:

   - **Features gained** at levels 2, 3, 4, 5 (at minimum) — names only, cited from the
     class tables (`progression.json`). Introduce the table with its source.
   - **Subclass level** and **ASI levels**: do not match feature names by string — the
     catalog locale may vary. Instead, read them programmatically from the catalog path
     printed by `doctor` (replace `<catalog>` with the path from the `catalog` line and
     `<classId>` with the class key from `answers.json`):
     ```bash
     node -e "const d=JSON.parse(require('fs').readFileSync('<catalog>/data/progression.json','utf8')); const cls=d.classes['<classId>']; console.log(JSON.stringify(cls.levels.map(l=>({level:l.level,features:l.features.map(f=>f.name)})),null,2))"
     ```
     Then identify: the level whose feature names contain `"Sous-classe"` or `"Subclass"`;
     and every level whose feature names contain `"Amélioration"` or `"Ability Score
     Improvement"`.
   - **Spell slots** (for spellcasting classes): the `slots` or `pact` object at each level
     from `progression.json`.

   **Grounding note** — feature *names* are cited directly from the class tables; their
   mechanical *effects* at level 2+ are **not modeled** in `progression.json`. Tell the user
   so, and redirect them to the PHB or D&D Beyond for mechanical details. Every value in the
   summary must cite its provenance as `progression.json → <classId>`.

## Gotchas

- **"0 sheet-lint errors" is a floor, not a certificate.** The engine now checks that every
  spell is on the class list it is filed under, that no quota'd list is over-filled, and that
  no required choice is over-answered. Three things it still cannot check, and they are named
  in its own output: lists it does not define (`espece`, `initie-*` — the sheet says
  "appartenance non verifiee" and names them), the *count* of picks on a list with no declared
  quota (the sheet says "aucun quota declare" and names it), and two separately *chosen* picks
  of the same entry. When the sheet carries a `⚠` line, that line is the list of what you must
  verify by hand before you present it.
- **A non-zero exit code from `build` means the sheet is illegal**, not that the command broke.
  Read the lint errors, fix the offending *answer*, and rebuild. Never patch a computed value.
- **Answer keys are graph ids, not English words.** Read them from `fixedPending` /
  `dynamicPending`; a guessed key is silently ignored and the choice stays pending.
- **`options` already de-duplicates.** A skill granted by the background is not offered again —
  if a choice you expected is absent, it is already granted, not missing.
- **Some species grant a chosen *origin feat*** (e.g. Human "Versatile") whose effects the
  resolver does not expand. Say so rather than applying the feat's effects yourself.

## Scope

Full sheets are computed at level 1 — that is what this skill delivers. Level 1-20
*milestones* are still grounded: `node scripts/dnd.mjs progression <classId>` cites proficiency
bonus, spell-slot levels, ASI levels and feature *names* for any level, straight from the class
table. So "what do I get at level 5?" is answerable and must be answered. Only the mechanical
*effects* of level-2+ features, multiclassing, and full sheets above level 1 are
"Manquant documentaire". When you say "Manquant documentaire", orient the user (in their language):
- **Spell with no effect text** (the catalog stores metadata, not descriptions): say
  "Manquant documentaire" (the standard not-in-catalog signal), then tell the user in their
  language that this spell's effect text is not in the catalog; direct them to D&D Beyond
  (dndbeyond.com/spells) or the PHB 2024.
- **Level 2+ content** (multiclassing, subclass features above level 1): tell the user in
  their language that this product only covers level 1 character creation; for higher levels
  direct them to D&D Beyond or their DM.
- **Subclass not in the catalog**: tell the user in their language that the subclass cannot
  be verified in the catalog and that the resulting sheet is partial.
The `dnd-help` skill explains the family's scope and limits in full.

**Languages.** Pass `--lang <code>` to `scripts/dnd.mjs build`. Supported: `en` `fr` `de` `es`
`it` `ja` `ru` `zh` `ar`. Display names come from `data/labels.<lang>.json` (publisher-verified);
any missing label falls back to English. Detect the user's language from their message and use
the matching code automatically.
