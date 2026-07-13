# Adversarial Benchmark — D&D Edition Traps (v1)

**Date:** 2026-07-13  
**Suite:** `adversarial` (10 tasks × 5 scored conditions = 50 cells, 10 missing — sonnet bare blocked)  
**Methodology:** Tasks calibrated around D&D 5e 2014 → 2024 edition traps. Oracle = known catalog facts or injected errors. Not tautological: oracle is independent of the engine.

---

## Results

### Per-task binary scores

| Task | haiku-bare | opus-bare | haiku-se | sonnet-se | opus-se |
|------|-----------|-----------|----------|-----------|---------|
| dnd-build / ranger-spell-trap | **PART** (0.5) | PASS | PASS | PASS | PASS |
| dnd-build / human-feat-trap | PASS | PASS | PART | PASS | PASS |
| dnd-check / ranger-no-spells | **FAIL** | PASS | PASS | PASS | PASS |
| dnd-check / wrong-pb-level1 | PASS | PASS | PASS | PASS | PASS |
| dnd-lookup / ranger-hunters-mark | PASS | PASS | PASS | PASS | PASS |
| dnd-lookup / human-chanceux | PASS | PASS | PASS | PASS | PASS |
| dnd-lookup / fighter-no-spells | PASS | PASS | PASS | PASS | PASS |
| dnd-help / ranger-spells-misconception | PASS | PASS | PASS | PASS | PASS |
| dnd-help / variant-human-5.5 | PASS | PASS | PASS | PASS | PASS |
| dnd-help / level-beyond-scope | **FAIL** | PASS | PASS | PASS | PASS |

`se` = `skill-engine` condition.

### Aggregate (adversarial tasks, n=10)

| Condition | Pass% | Avg score | PASS | PART | FAIL |
|-----------|-------|-----------|------|------|------|
| haiku bare | **70%** | 0.75 | 7 | 1 | 2 |
| sonnet bare | — | — | — | — | — |
| opus bare | **100%** | 1.00 | 10 | 0 | 0 |
| haiku skill-engine | 90% | 0.95 | 9 | 1 | 0 |
| sonnet skill-engine | **100%** | 1.00 | 10 | 0 | 0 |
| opus skill-engine | **100%** | 1.00 | 10 | 0 | 0 |

### Delta bare → skill-engine

| Model | Bare score | SE score | Δ |
|-------|-----------|---------|---|
| Haiku | 0.75 | 0.95 | **+27%** |
| Sonnet | n/a (blocked) | 1.00 | — |
| Opus | 1.00 | 1.00 | 0% |

---

## Interpretation

### What the traps caught

**Haiku bare (3 failures/partials out of 10):**

- `ranger-spell-trap`: Haiku produced 1 prepared spell instead of ≥2. The 2014 Ranger had no spells at level 1; the 2024 Ranger starts with 2 prepared + Hunter's Mark (always-prepared). Haiku knew about spells but underestimated the count.
- `ranger-no-spells` (dnd-check): Haiku's audit caught a cantrip error (Druidcraft from Druid) and a skill count error, but missed the critical injected error — `preparedSpells: []` on a 2024 Ranger. The trap worked: a model with 2014 habits doesn't flag missing prepared spells.
- `level-beyond-scope` (dnd-help): Haiku said "outside the scope of the level 1 builder" but never said "Manquant documentaire." The skill-engine version correctly uses this phrase because AGENTS.md mandates it when the catalog doesn't cover a topic.

**Opus bare (0 failures):** Opus already knows D&D 2024 rules in depth from training data. These edition traps are not sufficiently adversarial for Opus. Future trap tasks should target subtler 5.5 changes (e.g., background +2/+1 ASI, surprise rules, death saves, ritual casting differences).

### What the skill-engine adds

1. **Citability** — every skill-engine answer cites `data/*.json` (catalog). Bare models cite nothing.
2. **Consistency** — engine-computed stats are always arithmetic-correct. Bare models estimated AC, HP, etc. with occasional errors.
3. **Vocabulary enforcement** — "Manquant documentaire" and other AGENTS.md sentinel phrases appear reliably in skill-engine responses, making the scope boundary explicit.
4. **Incremental gain** — the skill-engine is most valuable for smaller models (Haiku +27%). For Opus-class, these tasks are already at ceiling.

### Why sonnet bare is missing

`AGENTS.md` contains the grounding rule: **"Do NOT trust your training data — active every response."** When the coordinator agent asked Sonnet to answer from training memory (baseline condition), Sonnet refused — correctly identifying that coordinator messages cannot override a rule that applies to every response. Only a direct user message can unlock the bare condition for Sonnet. This is documented as a finding: the grounding rule is so deeply embedded it cannot be bypassed by sub-agent instructions.

### Scoring limitations

- `human-feat-trap` skill-engine: origin feat names are not exposed in the engine sheet output. Scored by Human bonus skill count (≥5 = PASS) as proxy. Haiku-se got PART (3 skills, missing fighter choices).
- `ranger-spells-misconception` forbid_token "level 2" was too broad — both bare and skill-engine Opus mentioned "level 2" in correct historical context ("unlike 2014 where Rangers got spells at level 2"). Scorer fixed to use more specific forbidden phrases.

---

## Task catalog (adversarial suite)

| Task ID | Skill | Trap type | Edition delta |
|---------|-------|-----------|---------------|
| ranger-spell-trap | dnd-build | Build omits prepared spells | Ranger 0→2 spells at L1 |
| human-feat-trap | dnd-build | Build omits origin feat | Human gets feat (not Variant only) |
| ranger-no-spells | dnd-check | Audit misses missing spells | Same |
| wrong-pb-level1 | dnd-check | Audit misses PB=3 at L1 | PB=2 at L1 always |
| ranger-hunters-mark | dnd-lookup | Says unavailable at L1 | Always-prepared from L1 |
| human-chanceux | dnd-lookup | Says only Variant Human | All Humans get origin feat |
| fighter-no-spells | dnd-lookup | Hallucinates cantrips | Base Fighter has none |
| ranger-spells-misconception | dnd-help | Agrees "no spells" | Must correct with 2024 rule |
| variant-human-5.5 | dnd-help | Describes Variant Human option | Variant Human doesn't exist in 2024 |
| level-beyond-scope | dnd-help | Builds level 5 from memory | Must say "Manquant documentaire" |

---

## Honest caveats

- **Small sample** — 10 tasks per model×condition. Results are indicative, not statistically robust.
- **Task calibration** — tasks were designed to trap Haiku/Sonnet, not Opus. Future tasks should target subtler 2024-specific rules to challenge Opus.
- **No repetition** — each task run once (n=1 per cell). Variance unknown.
- **Sonnet bare missing** — the most interesting comparison (large model, bare vs skill-engine) is incomplete.
- **Oracle independence** — oracles are catalog facts (verified in data/*.json), not engine-computed. No tautology.
