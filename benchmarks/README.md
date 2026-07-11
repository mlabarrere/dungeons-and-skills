# Benchmarks — errors per character creation

**Objective metric:** the number of D&D 2024 rules errors in a character a model creates.
Lower is better; the goal is to show how far *grounding* (forcing the model to use the bundled
catalog + engine instead of its training memory) drives that number down.

## Why this can be objective

Unlike "quality", a character sheet is decidable. We already ship a deterministic oracle — the
engine (`engine/`) computes AC/HP/save-DCs/spell-counts and the resolver defines the legal
options. So [`scorer.mjs`](scorer.mjs) can score *any* character with **no LLM and no judgement**:
it recomputes the truth and counts each deviation, tagged by type.

### Error taxonomy

`math-ac` · `math-hp` · `math-pp` · `math-pb` · `math-saves` (computed value wrong) ·
`invented-{skill,cantrip,prepared,style}` (not in the catalog — wrong edition / hallucinated) ·
`illegal-{skill,cantrip,prepared,style}` (real, but not legal for this build / on the wrong list) ·
`wrong-count-{skills,cantrips,prepared}` (too many/few) · `illegal-spells-noncaster` ·
`ignored-brief` (changed the class/species/scores the brief fixed).

The scorer resolves French **and** English names (via `data/labels.en.json` + `aliases.en.json`)
so it measures *rules* errors, not FR/EN translation. It accepts AC with or without a carried
shield. The measuring instrument itself is unit-tested in [`tests/bench.test.mjs`](../tests/bench.test.mjs).

## Arms

- **bare** — the model builds the character from its own knowledge (the control).
- **grounded** — the model is told to distrust its training and use the catalog/engine. When it
  runs `engine/cli.mjs` its output is the engine's, so it scores **0 by construction**.

See [`arms.mjs`](arms.mjs) for the exact prompts and the required JSON output format.

## Running it

```bash
# Offline replay of captured outputs (reproducible, no API key):
node benchmarks/run.mjs --replay --models haiku,sonnet,opus --arms bare,grounded
node benchmarks/report.mjs --out results/<date>.md

# Live, real models (needs ANTHROPIC_API_KEY), with reasoning levels:
node benchmarks/run.mjs --live --models haiku,sonnet,opus --arms bare,grounded --reasoning off,high --reps 5
node benchmarks/report.mjs --out results/<date>.md
```

`run.mjs` writes `results/runs.json`; `report.mjs` aggregates it to a Markdown table (mean errors
per model × arm × reasoning, the reduction, and the taxonomy).

## The pilot in `results/`

[`results/2026-07-11-pilot.md`](results/2026-07-11-pilot.md) is a small **real** run: the three
Claude models answered the two build briefs **from memory, with no tools** (captured in
`captures/bare.<model>.<task>.json`), scored by the oracle. Grounded outputs are engine-produced.
It is a pilot (2 tasks, n=1) — widen it with `--reps` and `--live` for tighter numbers, and add
tasks by dropping a valid `examples/<id>.answers.json` and a `tasks.mjs` entry.

Headline: even the strongest model averages a few rules errors per character from memory
(missed species HP bonuses, wrong spell counts, a wrong saving-throw pair, changing the briefed
scores); grounded, all three score 0. Reproduce: the commands above.
