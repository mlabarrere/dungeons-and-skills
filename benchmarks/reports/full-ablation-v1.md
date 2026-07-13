# Benchmark report

- **Backend:** replay
- **Scored runs (status=ok):** 306 of 306
- **Provenance:** git 3b2587d1 (dirty) · catalogue aa5bbd7808e7 · engine 2f4d9bdb04e1 · scorer 7abe7ac0ee35 · tasks 96414fcf8b93 · seed 20260711
- **When:** 2026-07-13T12:18:15.598Z → 2026-07-13T12:18:17.410Z

Objective metric: **atomic error rate** = erroneous scorable units / total scorable units (not-applicable & not-scorable excluded). Lower is better. 95% CIs are bootstrap; small pilots are exploratory.

## Error rate by skill × model × condition

| Skill | Model | Condition | Reason | n | Atomic err % [95% CI] | Weighted % | Perfect % | Invalid % | Mean err |
|---|---|---|---|--:|---|--:|--:|--:|--:|
| dnd-build | haiku | bare | off | 10 | 30.6 [25.2–36.3] | 28.7 | 0.0 | 60.0 | 6.80 |
| dnd-build | haiku | grounding-only | off | 10 | 38.8 [30.7–46.9] | 44.4 | 0.0 | 100.0 | 10.50 |
| dnd-build | haiku | skill-engine | off | 10 | 17.9 [13.9–23.0] | 17.6 | 0.0 | 60.0 | 4.50 |
| dnd-build | opus | bare | off | 10 | 29.0 [24.6–33.3] | 29.3 | 0.0 | 100.0 | 6.90 |
| dnd-build | opus | grounding-only | off | 10 | 27.5 [24.6–30.3] | 28.5 | 0.0 | 100.0 | 6.80 |
| dnd-build | opus | skill-engine | off | 10 | 23.2 [19.3–27.0] | 25.6 | 0.0 | 100.0 | 6.00 |
| dnd-build | sonnet | bare | off | 10 | 26.1 [20.3–31.7] | 25.9 | 0.0 | 60.0 | 6.50 |
| dnd-build | sonnet | grounding-only | off | 10 | 32.4 [29.7–35.0] | 35.5 | 0.0 | 100.0 | 7.90 |
| dnd-build | sonnet | skill-engine | off | 10 | 19.8 [17.7–22.2] | 20.5 | 0.0 | 100.0 | 5.00 |
| dnd-check | haiku | bare | off | 10 | 0.0 [0.0–0.0] | 116.7 | 100.0 | 70.0 | 0.00 |
| dnd-check | haiku | grounding-only | off | 10 | 0.0 [0.0–0.0] | 116.7 | 100.0 | 70.0 | 0.00 |
| dnd-check | haiku | skill-engine | off | 10 | 73.3 [60.0–86.7] | 153.3 | 0.0 | 100.0 | 1.60 |
| dnd-check | opus | bare | off | 10 | 60.0 [35.0–85.0] | 142.2 | 30.0 | 90.0 | 1.20 |
| dnd-check | opus | grounding-only | off | 10 | 43.3 [20.0–66.7] | 150.0 | 40.0 | 90.0 | 1.20 |
| dnd-check | opus | skill-engine | off | 10 | 0.0 [0.0–0.0] | 33.3 | 100.0 | 20.0 | 0.00 |
| dnd-check | sonnet | bare | off | 10 | 66.7 [38.3–93.3] | 125.6 | 30.0 | 80.0 | 3.80 |
| dnd-check | sonnet | grounding-only | off | 10 | 30.0 [0.0–60.0] | 106.7 | 70.0 | 70.0 | 0.60 |
| dnd-check | sonnet | skill-engine | off | 10 | 30.0 [10.0–60.0] | 73.3 | 70.0 | 50.0 | 0.60 |
| dnd-help | haiku | bare | off | 8 | 29.2 [0.0–62.5] | 30.7 | 62.5 | 25.0 | 0.75 |
| dnd-help | haiku | grounding-only | off | 8 | 25.0 [4.2–54.2] | 27.3 | 62.5 | 25.0 | 0.63 |
| dnd-help | haiku | skill-engine | off | 8 | 22.9 [6.3–45.8] | 26.0 | 62.5 | 25.0 | 0.63 |
| dnd-help | opus | bare | off | 8 | 14.6 [4.2–29.2] | 16.9 | 62.5 | 25.0 | 0.38 |
| dnd-help | opus | grounding-only | off | 8 | 6.3 [0.0–18.8] | 7.8 | 87.5 | 12.5 | 0.13 |
| dnd-help | opus | skill-engine | off | 8 | 10.4 [0.0–25.0] | 13.5 | 75.0 | 25.0 | 0.25 |
| dnd-help | sonnet | bare | off | 8 | 10.4 [0.0–25.0] | 11.2 | 75.0 | 12.5 | 0.25 |
| dnd-help | sonnet | grounding-only | off | 8 | 16.7 [4.2–33.3] | 19.0 | 62.5 | 25.0 | 0.38 |
| dnd-help | sonnet | skill-engine | off | 8 | 22.9 [6.3–39.6] | 22.9 | 50.0 | 25.0 | 0.50 |
| dnd-lookup | haiku | bare | off | 6 | 40.9 [13.1–69.5] | 49.8 | 50.0 | 50.0 | 8.00 |
| dnd-lookup | haiku | grounding-only | off | 6 | 39.9 [11.4–70.5] | 47.3 | 50.0 | 50.0 | 8.67 |
| dnd-lookup | haiku | skill-engine | off | 6 | 16.7 [0.0–50.0] | 16.7 | 83.3 | 0.0 | 1.50 |
| dnd-lookup | opus | bare | off | 6 | 4.0 [0.0–8.8] | 4.8 | 66.7 | 16.7 | 0.67 |
| dnd-lookup | opus | grounding-only | off | 6 | 26.5 [5.3–53.1] | 34.5 | 50.0 | 50.0 | 4.50 |
| dnd-lookup | opus | skill-engine | off | 6 | 13.3 [0.0–40.0] | 17.8 | 83.3 | 16.7 | 2.00 |
| dnd-lookup | sonnet | bare | off | 6 | 35.8 [9.6–64.6] | 47.0 | 50.0 | 50.0 | 7.50 |
| dnd-lookup | sonnet | grounding-only | off | 6 | 54.7 [23.6–85.3] | 64.7 | 33.3 | 50.0 | 7.83 |
| dnd-lookup | sonnet | skill-engine | off | 6 | 33.3 [0.0–66.7] | 33.3 | 66.7 | 0.0 | 0.33 |

## dnd-check detection (precision / recall / F1)

| Model | Condition | n | Precision | Recall | F1 |
|---|---|--:|--:|--:|--:|
| haiku | bare | 10 | 100.0 | 100.0 | 100.0 |
| haiku | grounding-only | 10 | 100.0 | 100.0 | 100.0 |
| haiku | skill-engine | 10 | 30.0 | 80.0 | 36.7 |
| opus | bare | 10 | 50.0 | 70.0 | 43.3 |
| opus | grounding-only | 10 | 56.7 | 100.0 | 63.3 |
| opus | skill-engine | 10 | 100.0 | 100.0 | 100.0 |
| sonnet | bare | 10 | 43.3 | 70.0 | 35.7 |
| sonnet | grounding-only | 10 | 100.0 | 70.0 | 70.0 |
| sonnet | skill-engine | 10 | 100.0 | 70.0 | 70.0 |

## Error taxonomy (939 events · 890 root causes · 49 cascade symptoms)

| Category | Count | | Severity | Count |
|---|--:|---|---|--:|
| invented-entity | 342 | | critical | 514 |
| lookup-omission | 146 | | significant | 425 |
| wrong-count | 100 | |  |  |
| brief-violation | 88 | |  |  |
| false-positive-check | 62 | |  |  |
| derived-stat-error | 52 | |  |  |
| correction-error | 48 | |  |  |
| illegal-choice | 28 | |  |  |
| false-negative-check | 28 | |  |  |
| lookup-false-positive | 14 | |  |  |
| skill-selection-error | 13 | |  |  |
| procedure-error | 12 | |  |  |
| invented-rule | 6 | |  |  |

## Ablation — bare vs skill-engine (paired on the same tasks)

| Skill | Model | n pairs | bare err % | skill-engine err % | Δ abs (pts) | Δ rel |
|---|---|--:|--:|--:|--:|--:|
| dnd-build | haiku | 10 | 30.6 | 17.9 | 12.6 | 41.4% |
| dnd-build | opus | 10 | 29.0 | 23.2 | 5.7 | 19.7% |
| dnd-build | sonnet | 10 | 26.1 | 19.8 | 6.3 | 24.1% |
| dnd-check | haiku | 10 | 0.0 | 73.3 | -73.3 | — |
| dnd-check | opus | 10 | 60.0 | 0.0 | 60.0 | 100.0% |
| dnd-check | sonnet | 10 | 66.7 | 30.0 | 36.7 | 55.0% |
| dnd-help | haiku | 8 | 29.2 | 22.9 | 6.3 | 21.4% |
| dnd-help | opus | 8 | 14.6 | 10.4 | 4.2 | 28.6% |
| dnd-help | sonnet | 8 | 10.4 | 22.9 | -12.5 | -120.0% |
| dnd-lookup | haiku | 6 | 40.9 | 16.7 | 24.3 | 59.3% |
| dnd-lookup | opus | 6 | 4.0 | 13.3 | -9.3 | -229.4% |
| dnd-lookup | sonnet | 6 | 35.8 | 33.3 | 2.4 | 6.8% |

---
_Generated from `.\benchmarks\results\runs.2026-07-13-12-18-14-replay.json`. Aggregates only status=ok rows. Real model rows come from the stated backend; see AUDIT.md._
