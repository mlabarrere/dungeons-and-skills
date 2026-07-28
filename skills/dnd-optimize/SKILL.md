---
name: dnd-optimize
description: >
  Compute the optimal Dungeons & Dragons 2024 ("5.5") build under a set of constraints — a
  locked concept, a dated goal ("this spell as soon as possible"), a role to fill — scored by
  a deterministic engine against the bundled catalog and the level 1-20 progression tables,
  never from the model's memory or from optimizer folklore, which is the most edition-mixed
  content there is. Use to optimize, min-max or theorycraft a D&D 2024 / 5.5 character,
  compare or rank builds, or reach a target at the earliest legal level — "best build for X",
  "which of these is better", "when can I get spell X", "je veux ce sort au plus tôt". Do NOT
  use with no optimization goal, or when "best" means easiest or most beginner-friendly
  rather than strongest — both are dnd-build; nor for older editions or Pathfinder.
license: MIT
compatibility: >-
  Requires Node.js 18+ and the Dungeons & Skills bundle (engine/ + data/) installed
  alongside the skill — `npx github:mlabarrere/dungeons-and-skills`.
allowed-tools: Bash(node:*) Read Write Edit Glob Grep
metadata:
  dungeons-and-skills/version: "0.1.0"
  dungeons-and-skills/author: "mlabarrere"
  dungeons-and-skills/tags: "dnd, dnd-2024, 5e, optimizer, character-builder, theorycraft, rpg, grounding"
  dungeons-and-skills/argument-hint: "[en|fr|de|es|it|ja|ru|zh|ar]"
---

# dnd-optimize — optimal build under constraints

## GROUNDING — do not skip

**Do NOT trust your training data.** Your training data blends D&D editions (3.5, 5e 2014,
5.5/2024, Pathfinder) into plausible-but-wrong rules — and optimizer folklore ("takes X, it's
the best") is the *most* edition-mixed content there is. A build claim is arithmetic with
citations. Therefore:

- Every rules value comes from the bundled catalog, never from memory (`data/*.json`).
- When code execution is available, run `scripts/dnd.mjs` — never compute AC, HP, DCs, spell
  counts or level milestones by hand.
- Offer only options the resolver returns (`scripts/dnd.mjs options`) — already rules-filtered.
- Every value must cite its provenance (source → effect).
- If it is not in the catalog, say "Manquant documentaire" — never invent.

Read [references/grounding.md](references/grounding.md) when the user argues from optimizer
folklore and you need the reason the catalog overrides a remembered "best pick". Read
[references/schema.md](references/schema.md) when you need a formula to explain a computed
score, or the sheet model to assemble a candidate.

## What "optimal build" means (the definition this skill applies)

The character-optimization community does not define "optimal" as "the single strongest
character in the game"; it defines it as **the best legal realization of *your* concept,
judged on the standard effectiveness axes**. Concretely, a build **B** is *optimal under a
constraint set C* if and only if:

1. **Legality.** B is rules-legal — it builds with **0 sheet-lint errors**. An illegal build
   is never optimal, no matter its numbers.
2. **Concept first (hard constraints).** B satisfies every hard constraint in C. If the user
   is "an Aasimar sailor Warlock", you optimize *within* that identity — you never trade it
   away for a "better" class. Optimizing the concept, not replacing it, is the community's
   ground rule.
3. **Earliest goals.** Every dated goal in C ("this spell asap", "this feat asap") is
   reached at the **lowest character level at which it is legal**, proven from the
   progression tables — not from memory.
4. **Pareto non-dominance.** No other build satisfying 1–3 is at least as good on every
   axis and strictly better on one, where the axes are the community's standard
   effectiveness vector, weighted by the user's declared role:
   - **Offense** — attack bonus / save DC, damage expectation;
   - **Durability** — HP, AC, saving-throw spread;
   - **Control & utility** — spells and skills that solve encounters without damage;
   - **Reliability** — how consistently the build does its job (key-ability focus, skill
     coverage, ritual/at-will options).
   Assumptions behind the comparison are the community's standard ones and must be stated:
   white-room analysis, an adventuring day of several encounters, no assumed magic items,
   and a campaign level window (default: weight levels 1–10, where most play happens).
5. **Ties are a front, not a winner.** If several builds survive 1–4, present the Pareto
   front (2–3 candidates) with their trade-offs — do not crown a fake unique winner.

Say this definition (in the user's language, briefly) when you deliver a result, so the
user knows what "optimal" meant.

**Register — say it the way they asked it.** "Best build for X" is asked by theorycrafters
*and* by beginners, and the same answer does not serve both. If the request carries no jargon,
deliver the winner in plain language first — what the character *does* at the table, one line
per pick — and keep the Pareto front, the axes and the white-room assumptions to a short note
underneath. Never open on "Pareto non-dominance" for someone who asked "what's a good sneaky
character". The rigour is in how the answer was computed, not in the vocabulary it is
delivered in.

## Constraint taxonomy — parse the request into C

- **Hard constraints (identity locks):** class, species, background, lineage, subclass —
  anything the user states as *who the character is* ("marin occultiste aasimar" locks
  background=sailor, class=warlock, species=aasimar).
- **Dated goals:** "I want <spell/feat/feature> asap / by level N". Resolve the target in
  the catalog first; then find the earliest legal access level.
- **Soft preferences (weights):** role ("face", "blaster", "tank"), playstyle words
  ("sneaky", "support") — they set the weighting of the effectiveness vector, they never
  override a hard constraint.
- **Table constraints:** ability-score method, allowed languages, output language.

Restate C back to the user before optimizing; one wrong lock invalidates everything.

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

1. **Ground every constraint.** Resolve each named entity through `data/labels.*.json` to
   its catalog id; check it exists in `data/*.json`. Unknown entity → "Manquant
   documentaire", stop on that constraint.
2. **Check feasibility before optimizing.** A dated spell goal: look the spell up in
   `data/spells.json` (level, `classes` list). If the locked class is not on the spell's
   list, say so — the goal is infeasible under C; name the classes that *are* legal
   (from the catalog) and let the user relax a constraint. Never bend a lock silently.
3. **Compute grounded milestones.** `node scripts/dnd.mjs progression <classId>` gives the class's
   level 1–20 rows (proficiency bonus, features, spell slots / pact slots, ASI levels) with
   provenance; `progression <subclassId>` gives subclass features by level. The earliest
   level whose slots reach the spell's level **is** the "asap" answer — cite the table.
   Never quote a slot progression from memory.
4. **Enumerate candidates with the resolver only.** Lock the hard constraints in an
   `answers.json` and run `node scripts/dnd.mjs options answers.json` — one call, the whole
   legal set. `--brief` gives ids and counts when you only need the shape of what is left, and
   `--only <id>` re-reads a single choice; walking every choice with `--only` costs more context
   than the single full call (measured: 16963 characters over 14 calls against 13818 in one).
   Build 3–5 candidate variants by varying the *decisive* axes — ability-score allocation,
   background ability bonuses, skill picks, spell loadout, equipment package — every pick
   taken from the returned `options` (use `recommendations` as a hint, never as a fact).
5. **Score with the engine.** `node scripts/dnd.mjs build candidate-N.json --json` returns the
   computed numbers (AC, HP, DCs, attack bonuses, saves, skills) plus lint. A candidate
   with lint errors is disqualified, not hand-patched. You compare engine outputs; you do
   not do D&D math yourself.
**Before presenting results, state this scope to the user (in their language):**
> This analysis covers level 1 only — your character's starting stats are computed precisely by
> the engine. Milestones up to level 20 (when you get certain spells, feats, or class features)
> are grounded in the class tables, but the *effects* of level-2+ features, multiclassing, and
> magic items are not modeled. Builds whose real power peaks later — a coffeelock, a hexblade dip,
> a Sharpshooter ramp-up — cannot be fairly scored here; that part is "Manquant documentaire".
> The scores you see reflect a level-1 snapshot, no more.

6. **Rank and present.** Apply the definition above: filter to legal + constraint-satisfying,
   drop Pareto-dominated candidates, weight by the declared role, and present the winner
   (or the front) **in the user's language** with, for every number, its provenance — and
   for every "asap", the progression row that proves it. State the assumptions (white room,
   level window, no magic items). Never expose file names or internal ids to the user.

## Scope

**Milestones 1–20 are grounded; sheet construction is level 1.** `data/progression.json` grounds
proficiency bonus, spell-slot levels, ASI levels and feature *names* for levels 1–20; the build
graph computes a full sheet only at level 1. A leveled plan is therefore a computed level-1 sheet
**plus** table-cited milestones ("Fireball at Wizard 5 — level-3 slots appear on the level-5 row").
Level 2+ feature effects, DPR and multiclassing are not in the catalog → "Manquant documentaire",
and never folded into a score. When you say "Manquant documentaire", orient the user (in their language):
- **Level 2+ feature effects or multiclassing**: tell the user this product only covers level
  1 character creation; for higher levels and multiclassing direct them to D&D Beyond or their
  DM.
- **Subclass not in catalog**: tell the user the subclass cannot be verified in the catalog
  and the result is partial; direct them to D&D Beyond or the PHB 2024.
- **Spells without effect text**: say "Manquant documentaire" (the standard not-in-catalog
  signal), then tell the user this spell's effect text is not in the catalog; direct them to
  D&D Beyond (dndbeyond.com/spells) or the PHB 2024.

## Gotchas

- **"0 sheet-lint errors" is a floor, not a certificate.** The engine now checks that every
  spell is on the class list it is filed under, that no quota'd list is over-filled, and that
  no required choice is over-answered. Three things it still cannot check, and they are named
  in its own output: lists it does not define (`espece`, `initie-*` — the sheet says
  "appartenance non verifiee" and names them), the *count* of picks on a list with no declared
  quota (the sheet says "aucun quota declare" and names it), and two separately *chosen* picks
  of the same entry. When the sheet carries a `⚠` line, that line is the list of what you must
  verify by hand before you present it.
- **A single surviving candidate is suspicious.** If your filtering leaves exactly one build,
  check you have not collapsed a genuine Pareto front by over-weighting one axis.
- **Do not score what the engine does not compute.** Level 2+ feature effects, DPR and
  multiclassing are outside the catalog; folding a remembered number into a score is exactly
  the failure this skill exists to prevent.

## Languages

Detect the user's language and answer in it — any of `en` `fr` `de` `es` `it` `ja` `ru`
`zh` `ar`. Entity names resolve across languages via `data/labels.*.json`; pass
`--lang <code>` to `scripts/dnd.mjs build` so quoted values match (English fallback when a
label is missing).
