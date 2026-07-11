# Benchmark report

- **Backend:** oracle — ⚠️ ORACLE self-consistency check, **not** model performance
- **Scored runs (status=ok):** 34 of 34
- **Provenance:** git 4b7ab681 (dirty) · catalogue 10d446c6ef7d · engine aa8db6fb433a · scorer f192cce7b0fb · tasks 56ef50fcdac2 · seed 20260711
- **When:** 2026-07-11T15:08:30.007Z → 2026-07-11T15:08:30.054Z

Objective metric: **atomic error rate** = erroneous scorable units / total scorable units (not-applicable & not-scorable excluded). Lower is better. 95% CIs are bootstrap; small pilots are exploratory.

## Error rate by skill × model × condition

| Skill | Model | Condition | Reason | n | Atomic err % [95% CI] | Weighted % | Perfect % | Invalid % | Mean err |
|---|---|---|---|--:|---|--:|--:|--:|--:|
| dnd-build | oracle | oracle | off | 10 | 0.0 [0.0–0.0] | 0.0 | 100.0 | 0.0 | 0.00 |
| dnd-check | oracle | oracle | off | 10 | 0.0 [0.0–0.0] | 0.0 | 100.0 | 0.0 | 0.00 |
| dnd-help | oracle | oracle | off | 8 | 0.0 [0.0–0.0] | 0.0 | 100.0 | 0.0 | 0.00 |
| dnd-lookup | oracle | oracle | off | 6 | 0.0 [0.0–0.0] | 0.0 | 100.0 | 0.0 | 0.00 |

## dnd-check detection (precision / recall / F1)

| Model | Condition | n | Precision | Recall | F1 |
|---|---|--:|--:|--:|--:|
| oracle | oracle | 10 | 100.0 | 100.0 | 100.0 |

---
_Generated from `.\benchmarks\results\runs.2026-07-11-15-08-29-oracle.json`. Aggregates only status=ok rows. Oracle self-consistency — not a model result._
