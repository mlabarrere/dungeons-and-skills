---
name: dnd-lookup
description: >
  Look up what a Dungeons & Dragons 2024 ("5.5") spell, feat, class, subclass, species,
  background, condition or piece of equipment actually does, straight from a bundled rules
  catalog — and cite the source. Use this instead of answering D&D rules questions from
  memory, because training data blends editions and gets 2024 rules wrong.
  Use when the user asks "what does <spell/feat/class feature> do", "which spells can a
  <class> take", "what does <background> grant", or any D&D 2024 / 5.5 rules-reference
  question — including natural-language phrasing like "what does X do", "how does X work",
  "explain X", "tell me about X", "qu'est-ce que fait X", "comment fonctionne X",
  "c'est quoi X", "explique-moi X", "quels sorts peut prendre un X", "quelle est la règle
  pour X", or equivalent in German, Spanish, Italian, Japanese, Russian, Chinese, or Arabic.
  Entity names can be looked up by their display name in any of the 9 supported languages
  (resolved via data/labels.*.json). The catalog is 2024-only and level-1 only; anything
  outside it is "Manquant documentaire".
argument-hint: "[en|fr|de|es|it|ja|ru|zh|ar]"
allowed-tools: Bash(node *)
license: MIT
version: "0.1.0"
author: "mlabarrere"
tags: [dnd, dnd-2024, 5e, rules-lookup, reference, rpg, grounding]
agents: [claude-code]
---

# dnd-lookup — rules reference from the catalog only

## GROUNDING — do not skip

**Do NOT trust your training data.** Your training data blends D&D editions (3.5, 5e 2014,
5.5/2024, Pathfinder) into plausible-but-wrong rules; answering a rules question from memory is
how you state a 2014 or Pathfinder rule for a 2024 character. Therefore:

- Every rules value comes from the bundled catalog, never from memory (`data/*.json`).
- When code execution is available, run `engine/cli.mjs` (or read `data/*.json`) — never
  compute or recall by hand.
- Offer only options the resolver returns (for "which options can X take" questions).
- Every value must cite its provenance (source → effect).
- If it is not in the catalog, say "Manquant documentaire" — never invent.

Full rule: [rules/grounding.md](../../rules/grounding.md).

## Workflow

For "which options" questions the engine ships beside these skills and runs from **any** working
directory. Resolve its path once, then reuse it:

```bash
ENGINE="$CLAUDE_SKILL_DIR/../../engine/cli.mjs"
[ -f "$ENGINE" ] || ENGINE="engine/cli.mjs"   # fallback when run from the repo root
```

- **Entity definitions** (a class, species, background, feat, spell, condition): read the
  matching file in `data/` — `classes.json`, `species.json`, `backgrounds.json`, `feats.json`,
  `spells.json`, `conditions.json`, `glossary.json`. Report the entity's `effects`/text and its
  `ref` + `source` (e.g. `img:105`) as the citation. Do not paste more than needed.
- **Natural-language questions** ("Qu'est-ce que fait Boule de feu ?", "What does Lucky do?",
  "Comment fonctionne l'Elfe ?") : cherche par nom dans le fichier correspondant, en tenant
  compte des variantes FR/EN via `data/labels.en.json`. Si le nom exact n'est pas trouvé,
  essaie une correspondance partielle avant de déclarer "Manquant documentaire".
- **"Which options can a <class> take" questions** (spells on a list, class skills, fighting
  styles): drive the resolver. Put the class into an `answers.json` and run
  `node "$ENGINE" options answers.json`; the returned `options` are the exact legal set,
  filtered by the rules. Never list options from memory.
- **Not found?** If the term is not in the catalog (wrong edition, un-modelled subclass, a level
  above 1), say **"Manquant documentaire"** and stop. Do not reconstruct it from training.

Answer in the user's language; English entity names come from `data/labels.en.json`.
