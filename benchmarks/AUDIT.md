# Benchmark audit (v1 → v2)

Verified by running the code, not by trusting the prose.

## What v1 was (commit 4b7ab68, ~492 LOC)

- Covered **only `dnd-build`**, 2 tasks (`dwarf-fighter`, `elf-druid`).
- **2 conditions** only: `bare` vs `grounded`.
- Model ids **hardcoded** in `run.mjs` (`MODEL_IDS`).
- Error count was a flat tally of tags; **no explicit denominator**, no atomic units, no
  severity weighting, no root-cause/cascade, no per-error taxonomy object.
- No statistics (no CI, no percentiles), no paired analysis.
- No run manifest / provenance, no `--dry-run`, no cost control, no resume.
- Scorer tests were thin (0-vs->0), **no mutation tests**.
- No JSON schemas.
- The `grounded` captures are **engine-produced** and were labelled `grounded`. Per the v2
  spec, engine output is an **`oracle`** and must never be presented as a model result.

## What is kept

- The deterministic engine as the oracle (`engine/`), and the build-scoring logic (generalised
  into atomic units + taxonomy).
- The real captured **`bare`** subagent outputs (`captures/bare.<model>.<task>.json`) — genuine
  model outputs, reused as real `bare` data.
- Multilingual name resolution (`lib.mjs`) and the EN alias map.

## What is fixed / added in v2

Config-driven models; 4 per-skill scorers+oracles; 5 isolated conditions; atomic-unit error
rate with explicit denominators + severity weighting + root-cause/cascade; 25-category taxonomy;
schemas + validator; bootstrap CI + percentiles + paired analysis; run manifest + provenance;
`--dry-run`/cost/resume; mutation + isolation + schema tests; fixture mini-bench for CI; reports
+ charts. Engine output is relabelled `oracle`.

## Honesty constraints carried into v2

No API key is available in this environment, so **no live model performance is measured here**.
Offline: deterministic scorer/oracle tests + fixture-based report generation only, clearly
labelled. The real `bare` subagent captures are the only real model data and are labelled as a
small exploratory pilot. No number is fabricated.
