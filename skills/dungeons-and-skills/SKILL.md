---
name: dungeons-and-skills
description: >
  Build and check level-1 Dungeons & Dragons 2024 ("5.5") characters, look up
  catalog rules, compare constrained builds, and retrieve level 1-20 progression
  milestones with a bundled deterministic engine and SRD 5.2.1 catalog. Use for
  any D&D 2024 character request: guided creation, sheet validation, legality or
  arithmetic checks, spell/feat/class lookup, optimization, progression, or help
  with this toolkit. Never answer rules values from model memory. Do not use for
  D&D 2014, other editions, Pathfinder, level-2+ character construction, or
  uncatalogued mechanical effects.
---

# Dungeons & Skills

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

Read [references/grounding.md](references/grounding.md) when the user asks why model memory is
not accepted. Read [references/schema.md](references/schema.md) when explaining a computed value
or constructing a model for `check`. If `doctor` fails, read
[references/doctor-exits.md](references/doctor-exits.md) before deciding what the exit means.

## Before anything else: prove the engine runs

Run this before any other step. Note the `node` prefix — the shim is not executable, and a
bare `scripts/dnd.mjs` is refused by the shell, not by the engine.

```bash
node scripts/dnd.mjs doctor
```

- **Exit 0** — the catalog is present and readable. Proceed.
- **Anything else** — stop. Exit 2 = the autonomous bundle is incomplete and must be reinstalled
  with `npx skills add mlabarrere/dungeons-and-skills --skill dungeons-and-skills`;
  exit 127 = no Node.js on this host; exits 1, 3, 126 are fixable on retry. Do not answer from
  memory.

### If you cannot run commands at all

Say, in the user's language: *this skill computes D&D 2024 values with a bundled engine I
cannot run here, and I will not answer from memory, because a remembered 2024 rule and a
remembered 2014 one are indistinguishable in the answer.* Then **stop**.

## Reading the catalog

The autonomous skill ships `engine/`, `data/` and `assets/` inside its own folder. Get the
canonical absolute catalog path from the `catalog` field of `node scripts/dnd.mjs doctor`;
use that path whenever direct inspection is necessary. A file-not-found error is never a
licence to answer from memory.

## Intent detection

Before doing anything else, detect the user's intent. Do not reveal internal skill names to
the user — execute the right workflow silently. Answer and display in the user's language.

| Intent signals | Detected intent | Go to |
|---|---|---|
| "create", "make", "build", "new character", "crée", "je veux jouer", "je veux faire", "rôle" | **Create** a character | Workflow A |
| "check", "audit", "validate", "vérifier", "quelque chose cloche", "is this right", "is my sheet legal" | **Check** an existing sheet | Workflow B |
| "what does", "look up", "how does", "qu'est-ce que", "le sort", "le don", "la classe", "what is the" | **Look up** a rule | Workflow C |
| "best build", "optimal", "optimize", "meilleur build", "min-max", "strongest" | **Optimize** a build | Workflow D |
| "how does this work", "what is this", "aide", "comment ça marche", "which skill", "help", "broken", "error", "what can you do" | **Help** / diagnostics | Workflow E |
| **Ambiguous** — none of the above | Unclear intent | Ask one question |

**If the intent is clear:** proceed immediately without announcing the workflow name.
**If ambiguous:** ask exactly one question in the user's language — do they want to create a
character, check an existing sheet, or look up a rule? Then proceed once answered.

## Workflow A — Character creation

The engine is driven by one growing `answers.json` file. Keys are graph/choice ids —
discover them from the engine output, never guess them.

1. **Start.** Create `answers.json` (start `{}` or with `_id`, `nom`). Run:
   `node scripts/dnd.mjs options answers.json`
2. **Fixed choices first.** The `fixedPending` array lists head decisions (class, species,
   lineage when applicable, background, ability method, ability scores) with their legal
   `options`. Present them in the user's language, let the user pick, write the answer into
   `answers.json`, re-run `options`. Describe each option from the `facts` object the engine
   returns (`hitDie`, `primaryAbility`, `savingThrows`, etc.) — never from memory.
3. **Dynamic choices.** Once class/species/background are set, `dynamicPending` lists the rest
   (skills, fighting style, spells, languages, equipment, ability bonus). Fill each id;
   multi-picks are arrays. Options are already de-duplicated.
4. **Ready.** When `options` reports `ready: true`:
   `node scripts/dnd.mjs build answers.json --format markdown` (add `--lang en` or `--lang fr`
   as detected).
   Require **0 sheet-lint errors**. If errors print, fix the offending answer and rebuild —
   never patch a computed value.
5. **Present** the returned markdown sheet. Every value already carries its provenance; keep it.

**Tone:** meet the user at their level. Beginners: ask about the character concept first, not
for a class name. One question at a time. Never expose `answers.json`, engine commands, or
internal ids to the user.

## Workflow B — Sheet validation

1. **Gather the sheet.** Accept free text, markdown, or values dictated one by one. Ask for
   missing information one item at a time in plain language.
2. **Build the model.** Assemble a `.character.json`: `identity`, `abilityScores`, `sources[]`
   with typed `effects`, `choices[]`, `equipment[]`, `spells`. Mark any entry absent from the
   catalog as "Manquant documentaire" rather than inventing effects.
3. **Recompute and lint.** Run
   `node scripts/dnd.mjs check model.character.json --format markdown` (add `--lang`).
4. **Report.** For each mismatch: state the value, what the rules give, and the provenance.
   Exit 1 means rules errors found (expected for a broken sheet) — report them. A missing
   catalog entry is "Manquant documentaire", not a rules violation.

## Workflow C — Rule lookup

1. Run `node scripts/dnd.mjs doctor` to confirm the catalog is reachable.
2. Find the entry: run `node scripts/dnd.mjs options '{}'` to see what is available, or inspect
   the catalog directory printed by `doctor`.
3. Present only fields actually stored in the entry, with its source citation. The catalog
   contains spell metadata but not spell effect prose; missing effect text is therefore
   "Manquant documentaire", even when the spell itself exists. Never reconstruct it from
   memory. The catalog covers D&D 2024 (5.5) only; requests for 3.5, 5e 2014 or Pathfinder
   entries are "Manquant documentaire".

## Workflow D — Optimization

**Scope:** full sheets at level 1 only. Level 1–20 milestones are grounded via
`node scripts/dnd.mjs progression <classId>`. Higher-level effects and multiclassing are
"Manquant documentaire" — name the gap instead of estimating.

1. Clarify the constraint: locked concept, a spell ASAP, a combat role, a playstyle.
2. Iterate candidates using `node scripts/dnd.mjs options <answers.json>`.
3. Score each with `node scripts/dnd.mjs build <answers.json> --json` — compare derived values
   without re-parsing markdown.
4. Present the top result with full provenance. Cite the progression table for milestones.

## Workflow E — Help & diagnostics

1. Run `node scripts/dnd.mjs doctor` and report its output exactly (do not paraphrase counts).
2. Explain what this toolkit does and which task each workflow addresses — in plain language,
   without naming internal skill files.
3. **Error exits:** exit 2 = bundle missing; exit 126 = add `node` prefix; exit 127 = no Node
   on this host; exits 1/3/4 = fix and retry; never fall back to memory.
4. Full sheets are computed at level 1; level 1–20 milestones are grounded; multiclassing and
   level 2+ effects are "Manquant documentaire".

## Output formats

Use Markdown for an answer that must be shown in the conversation. Use standalone HTML only
when the user asks for a printable/documentary artifact; the renderer embeds its CSS and
JavaScript. Use JSON for machine-to-machine processing. Warnings never mean verification:
report every warning and say that manual verification is required.

## Languages

Detect the user's language and pass `--lang <code>` to `scripts/dnd.mjs build` and `check`.
Supported: `en` `fr` `de` `es` `it` `ja` `ru` `zh` `ar` (falls back to English if a label
is missing). Always reply in the user's language.
