# Grounding — the one rule that overrides everything

> Single source of truth. This text is embedded **verbatim** into every `SKILL.md`,
> `AGENTS.md`, `project-mode/INSTRUCTIONS.md` and every platform adapter. The pinned
> sentences below are checked by `scripts/check-rule-copies.mjs`: change one here and the
> build fails until it is propagated everywhere. That is the point — the rule must be
> impossible to drift away from.

## Why this rule exists

You are a large language model. You have read thousands of homebrew sheets, wiki pages,
forum posts and three incompatible rulebooks. **Do NOT trust your training data.** Your
training data blends D&D editions (3.5, 5e 2014, 5.5/2024, Pathfinder) into
plausible-but-wrong rules. You will confidently state a 2014 rule for a 2024 character, a
Pathfinder feat as if it were D&D, a skill list from the wrong edition. It feels right. It
is wrong often enough to ruin a character sheet.

This project exists because a character sheet is **arithmetic with citations**, not vibes.
One wrong proficiency bonus, one spell on the wrong list, one over-filled cantrip slot, and
the sheet is illegal. So the rule is simple and absolute:

## The rule (ACTIVE EVERY RESPONSE)

1. **Every rules value comes from the bundled catalog, never from memory.** Classes,
   species, backgrounds, feats, spells, equipment, skills, languages — read them from
   `data/*.json`. Not from what you "know".
2. **When code execution is available, run `engine/cli.mjs` — never compute by hand.** AC,
   HP, save DCs, spell attack, proficiency bonus, prepared/cantrip counts: the deterministic
   engine computes them. You do not eyeball D&D math.
3. **Offer only options the resolver returns.** At every choice, the valid options are
   whatever `engine/cli.mjs options` (backed by `resolver.pendingChoices`) lists — already
   filtered by the rules and de-duplicated. Never present a choice the rules forbid, and
   never omit one they require.
4. **Every value must cite its provenance (source → effect).** "AC 16 = chain mail base 16"
   , "Perception proficiency ← Elf lineage". If you cannot name where a value comes from,
   you do not get to write it down.
5. **If it is not in the catalog, say "Manquant documentaire" — never invent.** A missing
   feat, an un-modelled subclass, a level above what the data covers: name the gap, stop.
   Inventing a value is worse than admitting the gap.

## If you cannot run code

Some hosts (a plain chat, some Project modes) cannot execute `engine/cli.mjs`. Then you
**read `data/*.json` and `rules/schema.md` and apply the same rules by hand** — the catalog
is still the only source, and the formulas in `rules/schema.md` are the only math. The rule
does not relax; only the tooling changes. Still: catalog over memory, always.

## Scope right now

The catalog covers **character creation at level 1** for the D&D 2024 ("5.5") ruleset,
in French (internal ids are French kebab-case; English display labels come from
`data/labels.en.json`). Level-up (2–20) is **not** in the data yet — for anything past
level 1, say "Manquant documentaire" rather than guessing.
