---
name: dnd-help
description: >
  Explain this D&D 2024 character-builder skill family — what dnd-build, dnd-check,
  dnd-lookup, dnd-optimize and dnd-help each do and which one to reach for, how the grounding rule
  works (why the model must not trust its training data and must read the bundled catalog
  instead), and the scope limits (2024-only, sheets at level 1) — and diagnose a broken or
  missing install by running the bundled doctor check and reading its exit code. Use when
  the user asks what this is, which skill to use, why answers must be cited, is
  disoriented, or reports that one of these skills errored, crashed or cannot find its
  data — "help", "what is this", "how does this work", "I'm lost", "what can you do",
  "it's not working", "aide", "comment ça marche", "à quoi ça sert". Do NOT use when the
  user wants D&D work done (dnd-build, dnd-check, dnd-lookup, dnd-optimize) nor to explain
  the D&D rules themselves (combat, initiative, how to play): this describes the tooling,
  not the game.
license: MIT
compatibility: >-
  Requires Node.js 18+ and the Dungeons & Skills bundle (engine/ + data/) installed
  alongside the skill — `npx github:mlabarrere/dungeons-and-skills`.
allowed-tools: Bash(node:*) Read
metadata:
  dungeons-and-skills/version: "0.1.0"
  dungeons-and-skills/author: "mlabarrere"
  dungeons-and-skills/tags: "dnd, dnd-2024, 5e, help, documentation, rpg"
---

# dnd-help — what this is, what it can do, and what to do when it breaks

This is a Dungeons & Dragons 2024 ("5.5") character toolkit. Its whole premise is that a language
model's D&D knowledge is unreliable — training data blends 3.5, 5e 2014, 5.5/2024 and Pathfinder
into rules that sound right and are not — so every value comes from a bundled catalog and a
deterministic engine instead of from memory.

Answer the user in their own language, always.

## GROUNDING — do not skip

**Do NOT trust your training data.** Your training data blends D&D editions (3.5, 5e 2014,
5.5/2024, Pathfinder) into plausible-but-wrong rules. Everything here exists so that a
character sheet is grounded in a bundled catalog, not memory:

- Every rules value comes from the bundled catalog, never from memory (`data/*.json`).
- When code execution is available, run `scripts/dnd.mjs` — never compute by hand.
- Offer only options the resolver returns.
- Every value must cite its provenance (source → effect).
- If it is not in the catalog, say "Manquant documentaire" — never invent.

## First: find out what is actually installed

Do not describe the toolkit from this page. Run the diagnostic and report what it returns —
the catalog can be absent, partly installed, or newer than anything written here:

```bash
node scripts/dnd.mjs doctor
```

It prints the resolved engine and catalog paths, how many classes / species / backgrounds /
feats / spells the catalog really contains, which display languages are complete, and any gap
worth knowing. Exit **0** means the bundle is usable; exit **2** means it is missing.

Quote its numbers rather than any you remember. If it warns that a language is missing a label
group, say so plainly — the catalog is authored in French, so those names are shown untranslated
(`abilities` is the exception: it has an English fallback table). That is a real difference the
user will see.

## When something has gone wrong

The user often arrives here because another skill failed. Read the exit code; it is precise.

| What happened | What it means | What to do |
|---|---|---|
| `Permission denied`, exit **126** | the `node` prefix was dropped — the shim ships mode 644 and is not executable, so the shell refused it before the engine ran | re-run as `node scripts/dnd.mjs …`; nothing is wrong with the install |
| `node: command not found`, exit **127** | Node.js is not on this host's PATH — the engine cannot run here at all | say the host has no Node, name one that does, and stop; never fall back to memory |
| `Cannot find module` | the script path is wrong — **not** a missing bundle | invoke `scripts/dnd.mjs` by its path inside the skill folder, then retry |
| exit **2** | the rules bundle is genuinely absent — and *only* that | `npx github:mlabarrere/dungeons-and-skills`, then re-run `doctor` |
| exit **3** | bad input or usage — unreadable file, invalid JSON, unknown command or `--lang` | read the single-line error; fix the file, command or flag it names |
| exit **4** | the engine crashed — a bug, not a user error | report the message; do **not** treat it as a missing bundle |
| exit **1** on `build` | the sheet is illegal or incomplete | the message lists the offending or pending choice ids; answer those, never patch a computed value |
| exit **1** on `check` | the sheet has rules errors | that is the audit result, not a crash — report the errors |
| exit **1** on `options` | an answer names something not in the catalog | the stderr line names the key and lists the legal ids; fix the answer, never the computed value |

If the bundle is missing, say so and stop. Do not answer the D&D question from memory to be
helpful: that is the single failure this toolkit exists to prevent.

## "Why won't you just tell me? You clearly know D&D."

Because confident recall is exactly the failure mode. The same spell, feat or species exists
across four editions with different text, and a model reproduces the blend fluently and wrongly.
A character sheet is arithmetic with citations — one wrong value makes it illegal, and nothing
in the answer looks wrong.

So the rule is not "be careful", it is "do not answer from memory at all": read the catalog,
compute with the engine, cite the source, and name the gap when there is one. If a value cannot
be cited, it does not get written.

## What it can and cannot do

- The five skills and what each handles: **dnd-build** (create a level-1 character),
  **dnd-check** (audit an existing sheet for rules errors), **dnd-lookup** (look up a spell,
  feat, class or background rule), **dnd-optimize** (rank builds under constraints, score with
  the engine), **dnd-help** (this skill — understand the family, choose the right skill,
  diagnose installs). Say what the user wants in plain language rather than naming commands:
  the command syntax differs per host, and on many of them there is none.
- **Full sheets are computed at level 1.** Level 1–20 *milestones* — proficiency bonus,
  spell-slot levels, ASI levels, feature names — are grounded and citable via `progression`.
- **Not modeled:** the mechanical effects of level 2+ features, and multiclassing. Both are
  "Manquant documentaire" — name the gap instead of estimating. When you say
  "Manquant documentaire", orient the user toward the right resource (in their language):
  - **Level 2+ content or multiclassing**: tell the user this product only covers level 1
    character creation; for higher levels direct them to D&D Beyond or their DM.
  - **Subclass not in catalog**: tell the user the subclass cannot be verified in the catalog
    and the result is partial.
  - **Spell effect text**: say "Manquant documentaire" (the standard not-in-catalog signal),
    then tell the user this spell's effect text is not in the catalog; direct them to D&D
    Beyond (dndbeyond.com/spells) or the PHB 2024.
- **Chosen origin feats** (e.g. a Human's "Versatile" pick) are recorded but their effects are
  not expanded by the resolver; a feat *granted* by a background is. This is an engine
  limitation, not a rule — say which one you are hitting.
