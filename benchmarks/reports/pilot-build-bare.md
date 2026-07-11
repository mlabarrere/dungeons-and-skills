# Benchmark report

- **Backend:** replay
- **Scored runs (status=ok):** 6 of 26
- **Provenance:** git 4b7ab681 (dirty) · catalogue 10d446c6ef7d · engine aa8db6fb433a · scorer f192cce7b0fb · tasks 56ef50fcdac2 · seed 20260711
- **When:** 2026-07-11T15:08:33.222Z → 2026-07-11T15:08:33.242Z
- **Not run:** 20 (no capture) · **Not supported:** 0 (reasoning level absent) — excluded, never estimated.

Objective metric: **atomic error rate** = erroneous scorable units / total scorable units (not-applicable & not-scorable excluded). Lower is better. 95% CIs are bootstrap; small pilots are exploratory.

## Error rate by skill × model × condition

| Skill | Model | Condition | Reason | n | Atomic err % [95% CI] | Weighted % | Perfect % | Invalid % | Mean err |
|---|---|---|---|--:|---|--:|--:|--:|--:|
| dnd-build | haiku | bare | off | 2 | 14.8 [11.1–18.5] | 13.3 | 0.0 | 0.0 | 3.50 |
| dnd-build | opus | bare | off | 2 | 12.5 [11.1–13.8] | 11.2 | 0.0 | 0.0 | 3.00 |
| dnd-build | sonnet | bare | off | 2 | 9.7 [0.0–19.4] | 7.4 | 50.0 | 0.0 | 3.00 |

## Error taxonomy (18 events · 16 root causes · 2 cascade symptoms)

| Category | Count | | Severity | Count |
|---|--:|---|---|--:|
| wrong-count | 10 | | significant | 18 |
| derived-stat-error | 6 | |  |  |
| brief-violation | 1 | |  |  |
| wrong-value | 1 | |  |  |

---
_Generated from `.\benchmarks\results\runs.2026-07-11-15-08-32-replay.json`. Aggregates only status=ok rows. Real model rows come from the stated backend; see AUDIT.md._
