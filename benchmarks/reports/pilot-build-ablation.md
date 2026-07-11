# Benchmark report

- **Backend:** replay
- **Scored runs (status=ok):** 30 of 70
- **Provenance:** git d5a327e8 (dirty) · catalogue 10d446c6ef7d · engine aa8db6fb433a · scorer f192cce7b0fb · tasks 56ef50fcdac2 · seed 20260711
- **When:** 2026-07-11T16:36:54.173Z → 2026-07-11T16:36:54.294Z
- **Not run:** 40 (no capture) · **Not supported:** 0 (reasoning level absent) — excluded, never estimated.

Objective metric: **atomic error rate** = erroneous scorable units / total scorable units (not-applicable & not-scorable excluded). Lower is better. 95% CIs are bootstrap; small pilots are exploratory.

## Error rate by skill × model × condition

| Skill | Model | Condition | Reason | n | Atomic err % [95% CI] | Weighted % | Perfect % | Invalid % | Mean err |
|---|---|---|---|--:|---|--:|--:|--:|--:|
| dnd-build | haiku | bare | off | 5 | 21.0 [12.1–30.0] | 24.1 | 0.0 | 40.0 | 5.00 |
| dnd-build | haiku | skill-engine | off | 5 | 0.6 [0.0–1.9] | 0.6 | 80.0 | 0.0 | 0.20 |
| dnd-build | opus | bare | off | 5 | 15.3 [11.4–20.0] | 14.7 | 0.0 | 20.0 | 3.60 |
| dnd-build | opus | skill-engine | off | 5 | 0.6 [0.0–1.9] | 0.6 | 80.0 | 0.0 | 0.20 |
| dnd-build | sonnet | bare | off | 5 | 14.2 [5.0–23.6] | 17.7 | 20.0 | 40.0 | 3.80 |
| dnd-build | sonnet | skill-engine | off | 5 | 0.0 [0.0–0.0] | 0.0 | 100.0 | 0.0 | 0.00 |

## Error taxonomy (64 events · 64 root causes · 0 cascade symptoms)

| Category | Count | | Severity | Count |
|---|--:|---|---|--:|
| wrong-count | 29 | | significant | 40 |
| invented-entity | 24 | | critical | 24 |
| derived-stat-error | 11 | |  |  |

## Ablation — bare vs skill-engine (paired on the same tasks)

| Skill | Model | n pairs | bare err % | skill-engine err % | Δ abs (pts) | Δ rel |
|---|---|--:|--:|--:|--:|--:|
| dnd-build | haiku | 5 | 21.0 | 0.6 | 20.4 | 97.0% |
| dnd-build | opus | 5 | 15.3 | 0.6 | 14.7 | 95.9% |
| dnd-build | sonnet | 5 | 14.2 | 0.0 | 14.2 | 100.0% |

---
_Generated from `.\benchmarks\results\runs.2026-07-11-16-36-53-replay.json`. Aggregates only status=ok rows. Real model rows come from the stated backend; see AUDIT.md._
