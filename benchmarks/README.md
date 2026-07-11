# Benchmarks (v2)

Measures, **per skill**, how useful each skill actually is — objectively, with an explicit
denominator, and without ever passing off the engine's own output as a model's. See
[AUDIT.md](AUDIT.md) for what changed from v1 and why.

## The objective metric

**Atomic error rate** = erroneous scorable units ÷ total scorable units × 100. Each task
declares verifiable *units* (class, species, each ability, AC, HP, each skill, each spell, each
factual claim, each procedure step…). Every unit ends `correct | incorrect | missing |
extraneous | not-applicable | not-scorable`; the last two are **excluded from every
denominator**. Alongside it we report the **severity-weighted** rate (minor 1 / significant 3 /
critical 5, denominator documented in `scoring.mjs`), the **perfect rate** (% responses with
zero errors), the **invalid rate** (% with a critical error), raw/mean/median errors, and
root-cause vs cascade counts. No percentage is ever printed without its denominator.

Errors carry a stable [taxonomy](taxonomy.mjs) (25 categories × 3 severities) and link
cascades to a root cause via `parent_error_id`.

## Backends — engine output is never a model result

| Backend | What it is | Labelled |
|---|---|---|
| `oracle` | the engine's correct answer | `provenance: oracle` — a self-consistency check, **never** a model row |
| `fixture` | a synthetic, hand-authored response (CI/demo) | synthetic |
| `replay` | a real captured model output (`captures/`) | real |
| `live` | a real API call (needs a key; runs the `run_engine` tool loop) | real |

The oracle backend must score **0 errors on every task** — that is the proof the scorer works
(`npm run bench:oracle` + `benchmarks/ci-guard.mjs`).

## Conditions (ablation) and their isolation

`bare` · `grounding-only` · `skill-only` · `skill-engine` · `full-project`
(see [conditions.mjs](conditions.mjs)). Isolation is enforced there and asserted in
`tests/bench.test.mjs`: `bare` receives no grounding, no skill and no tools; `skill-only` gets
the skill but no engine; only `skill-engine`/`full-project` may call `run_engine`. In an
engine-enabled condition the **model** calls the tool and interprets the result — the engine is
never injected as the answer. Conditions a platform cannot provide are recorded `not-supported`,
never estimated.

## Per-skill scorers + oracles (colocated in `skills/`)

- **dnd-build** — engine oracle; scores brief compliance, legality, derived-stat maths, counts,
  invented/edition content, with cascade linking.
- **dnd-check** — planted, annotated errors; scores true/false positives/negatives →
  precision / recall / F1, correction correctness, and penalises invented errors hard.
- **dnd-lookup** — catalogue-derived expected sets; scores recall (omissions), precision
  (foreign items), and correct recognition of "not in the catalogue".
- **dnd-help** — authored routing oracle; scores skill selection, procedure coverage and the
  grounding reflex.

## Corpora

Versioned under `tasks/<skill>/`, generated deterministically (seeded) by `tasks/gen.mjs`:
build **12**, check **24**, lookup **6**, help **8**. Build references are solved and validated
by the engine (0 lint errors). `--suite pilot` caps at 10/skill; `--suite full` uses all. Add a
task by dropping a valid file (or extending the generator) — permanent id, recorded seed.

## Commands

```bash
npm run bench:gen                 # (re)generate the corpora (seeded)
npm run bench:oracle              # deterministic self-consistency run (0 errors expected)
npm run bench:replay              # score real captured outputs offline
npm run bench:report -- --in results/runs.<id>.json --out reports/<name>.md
npm run bench:charts -- --in results/runs.<id>.json --condition bare
npm run bench:validate            # JSON-schema validation + scorer tests

# real models (needs ANTHROPIC_API_KEY; copy config/models.example.json -> models.json):
node benchmarks/runner.mjs --backend live --skills dnd-build,dnd-check,dnd-lookup,dnd-help \
  --models haiku,sonnet,opus --conditions bare,grounding-only,skill-only,skill-engine \
  --reasoning off,high --reps 5 --seed 20260711 --dry-run   # drop --dry-run to execute
```

Model API ids/prices live in `config/models.json` (never hardcoded). `--dry-run` prints the
matrix and a rough cost ceiling; the runner refuses to start if the estimate exceeds `--max-usd`.
Every run writes a provenance manifest (git commit, catalogue/engine/scorer/task hashes, seed,
prompt hash, tool access) and is replayable offline from `captures/`.

## What has actually been run (strictly separated)

- **Deterministic (offline):** the oracle self-consistency run — 34/34 tasks at 0 errors
  ([reports/oracle-selfcheck.md](reports/oracle-selfcheck.md)). This tests the instrument, not a
  model.
- **Real model data (exploratory pilot):** the **`bare`** condition of `dnd-build` for
  Haiku/Sonnet/Opus, from `captures/` (models answered from memory, no tools)
  ([reports/pilot-build-bare.md](reports/pilot-build-bare.md)). 2 tasks, n=1 — exploratory.
- **Synthetic:** `fixtures/` — for pipeline/CI demonstration only; never presented as a result.
- **Not yet run:** the full ablation (`grounding-only`/`skill-only`/`skill-engine`/`full-project`)
  and multi-reasoning matrix require API keys and are **not** measured here. No number for them is
  fabricated.

## Limits

Pilot scale (small n); lookup/help corpora are below the 10/skill pilot target and should be
grown; `full-project` needs the real multi-skill runtime to be meaningful; prices in
`models.example.json` are examples to verify.
