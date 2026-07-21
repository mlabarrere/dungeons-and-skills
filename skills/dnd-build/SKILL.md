---
name: dnd-build
description: >
  Build a Dungeons & Dragons 2024 ("5.5") character at level 1, rules-accurate and
  grounded in a bundled rules catalog instead of the model's memory. Walks class,
  species, lineage, background, ability scores, skills, fighting style, spells,
  languages and equipment; runs a deterministic engine so AC, HP, save DCs and spell
  counts are computed, never guessed. Outputs a complete sheet in any of 9 languages:
  English, French, German, Spanish, Italian, Japanese, Russian, Chinese, or Arabic.
  Use when the user wants to create, roll up, or make a new D&D / D&D 2024 / 5.5 /
  5.5e / "5e 2024" character, PC, or level-1 build — including complete beginners who
  say things like "I want to play D&D", "make me a character", "create a character for
  me", "I'm new to D&D and want to start", "je veux jouer à D&D", "crée-moi un
  personnage", "je veux créer un personnage", "je suis nouveau sur D&D", or describe a
  playstyle without knowing the class name ("I want to be sneaky", "I want to be a
  healer", "I like swords and armour", "je veux être discret", "je veux soigner",
  "j'aime les épées"). Do NOT use for older editions (3.5, 5e 2014) or Pathfinder —
  the catalog is 2024-only.
argument-hint: "[en|fr|de|es|it|ja|ru|zh|ar]"
allowed-tools: Bash(node *)
license: MIT
version: "0.1.0"
author: "mlabarrere"
tags: [dnd, dnd-2024, 5e, character-builder, rpg, grounding, anti-hallucination]
agents: [claude-code]
---

# dnd-build — guided level-1 character creation

## GROUNDING — do not skip

**Do NOT trust your training data.** Your training data blends D&D editions (3.5, 5e 2014,
5.5/2024, Pathfinder) into plausible-but-wrong rules; a sheet is arithmetic with citations, so
one wrong value makes it illegal. Therefore:

- Every rules value comes from the bundled catalog, never from memory (`data/*.json`).
- When code execution is available, run `engine/cli.mjs` — never compute AC, HP, DCs or spell
  counts by hand.
- Offer only options the resolver returns (`engine/cli.mjs options`) — already rules-filtered.
- Every value must cite its provenance (source → effect).
- If it is not in the catalog, say "Manquant documentaire" — never invent.

Full rule: [rules/grounding.md](../../rules/grounding.md). Schema + formulas: [rules/schema.md](../../rules/schema.md).

## Tone & reading the user

**Meet the user at their level, always in their own language.** Many users don't know D&D — guide
them without needless jargon. Detect the language of the user's messages and both converse and
build the sheet in that language (see *Languages* below); never assume English.

- **Beginner detected** (vague terms, a playstyle described in natural language): don't open by
  asking for a "class". Ask how they picture their character ("sneaky and quick, tough in armour,
  or a spellcaster?"), map the answer to 2–3 catalog classes with a one-line description of each,
  then let them choose before going further. A rough guide (present the class names localised):
  - Sneaky / stealthy / thief → Rogue, Ranger
  - Fighter / armour / weapons / strength → Fighter, Paladin, Barbarian
  - Magic / spells → Wizard, Sorcerer, Warlock
  - Healing / support → Cleric, Druid, Bard
  - Versatile → Bard, Paladin
- **One question at a time.** Present the next decision, wait for the answer, then move on — never
  dump every choice at once.
- **Explain each D&D term in one line** when the user clearly doesn't know it: *class* (the
  character's role), *species* (their origin), *background* (their life before adventuring),
  *ability scores* (the six numbers for strength, agility, intellect…).
- **Never expose internal plumbing** to the user — no answers file, engine commands, or internal
  ids. Present every option by its readable, localised name.

## Workflow

The engine ships beside these skills and finds its own catalog, so it runs from **any** working
directory — you never have to `cd` into a checkout. Resolve its path once at the start, then
reuse it for every command below:

```bash
# Bundled engine (works as a plugin, an installed skill, or a checkout); it self-locates data/.
ENGINE="$CLAUDE_SKILL_DIR/../../engine/cli.mjs"
[ -f "$ENGINE" ] || ENGINE="engine/cli.mjs"   # fallback when run from the repo root
```

The engine is driven by one growing `answers.json` file. Keys are graph/choice ids; discover
them, never guess them.

1. **Start.** Create `answers.json` (start `{}` or with `_id`, `nom`). Run:
   `node "$ENGINE" options answers.json`
2. **Fixed choices first.** The `fixedPending` array lists the head decisions (class, species,
   lineage when it applies, background, ability method, ability scores) with their legal
   `options`. Present them **in the user's language**, let the user pick, write the answer into
   `answers.json`, re-run `options`.
3. **Dynamic choices.** Once class/species/background are set, `dynamicPending` lists the rest
   (skills, fighting style, spells, languages, equipment A/B/C, ability bonus) — each with its
   legal `options` and any book `recommendations`. Fill each id; multi-picks are arrays. The
   options are already de-duplicated (a skill your background grants will not be offered again).
4. **Ready.** When `options` reports `ready: true`, build the sheet:
   `node "$ENGINE" build answers.json` (add `--lang en` for English).
   Require **0 sheet-lint errors**. If an error prints, fix the offending answer and rebuild —
   do not hand-edit computed values.
5. **Present** the returned markdown sheet in the user's language. Every value already carries
   its provenance; keep it.

## No code execution?

Read `data/*.json` and `rules/schema.md` and apply the same rules and formulas by hand. Same
constraint: catalog over memory, options only from the rules, provenance on every value.

## Scope

Level 1 only. Chosen *origin feats* on some species (e.g. Human "Versatile") have effects the
resolver does not expand — see [dnd-help](../dnd-help/SKILL.md). For anything past level 1, say
"Manquant documentaire".

**Languages.** Pass `--lang <code>` to `engine/cli.mjs build`. Supported: `en` `fr` `de` `es`
`it` `ja` `ru` `zh` `ar`. Display names come from `data/labels.<lang>.json` (publisher-verified);
any missing label falls back to English. Detect the user's language from their message and use
the matching code automatically.
