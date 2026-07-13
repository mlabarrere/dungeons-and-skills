# Arithmetic Benchmark — Derived-Stat Accuracy (v1)

**Date:** 2026-07-13  
**Suite:** `arithmetic` (4 tasks × 6 conditions = 24 cells)  
**Methodology:** Each task gives a complete character brief (class, species, background, scores, equipment) and asks models to compute derived stats (HP, AC, PP, saves, spell DC, spell attack, cantrips, prepared spells). No formulas are provided — models must apply D&D 2024 rules from memory (bare) or via the skill-engine. Oracle = D&D 2024 correct values (independently verified, not engine-computed for the AC case — see note below).

---

## Results

### Per-task accuracy (mean over all stat dimensions)

| Task | haiku-bare | sonnet-bare | opus-bare | haiku-se | sonnet-se | opus-se |
|------|-----------|------------|---------|---------|---------|---------|
| halfling-rogue-stats | **100%** | 100% | 100% | 100% | 100% | 100% |
| tiefling-sorcerer-stats | **100%** | 100% | 100% | 100% | 100% | 100% |
| orc-paladin-stats | 89% | **100%** | **100%** | 78% | 89% | 89% |
| gnome-warlock-stats | **100%** | 100% | 100% | 100% | 100% | 100% |

`se` = `skill-engine` condition.

### Aggregate (n=4 tasks per condition)

| Condition | Avg% | Perfect tasks |
|-----------|------|---------------|
| haiku bare | **97.2%** | 3/4 |
| sonnet bare | **100%** | 4/4 |
| opus bare | **100%** | 4/4 |
| haiku skill-engine | **94.4%** | 3/4 |
| sonnet skill-engine | **97.2%** | 3/4 |
| opus skill-engine | **97.2%** | 3/4 |

### Stat accuracy across all conditions

| Stat | Accuracy | Notes |
|------|----------|-------|
| proficiencyBonus | **100%** | — |
| hitPoints | **100%** | — |
| passivePerception | **100%** | — |
| spellSaveDC | **100%** | — |
| spellAttackBonus | **100%** | — |
| preparedSpellsCount | **100%** | — |
| savingThrowProficiencies | **100%** | Jaccard similarity |
| cantripsCount | **94.4%** | Haiku-se returned null for Paladin (should be 0) |
| **armorClass** | **83.3%** | Shield bug — see below |

---

## Interpretation

### 1. All large models are arithmetically accurate — from memory

Sonnet bare and Opus bare scored **100%** on all 4 tasks. Haiku bare scored 97.2% (one AC miss). The edition-specific traps embedded in the tasks (d6 HP for Sorcerer, WIS+CHA saves for Paladin, AC formula for Leather vs Chain Mail) were not trip-wires for any large model.

**Conclusion:** Arithmetic accuracy is not the differentiator between bare and skill-engine. Large models already apply D&D 2024 formulas correctly from training data alone.

### 2. The shield AC anomaly — an engine bug

The orc-paladin task brief explicitly lists a **Shield** in equipment. In D&D 2024, a shield grants +2 AC. Correct AC = Chain Mail (16) + Shield (+2) = **18**.

- Opus bare ✓, Sonnet bare ✓ → 18 (correct)
- Haiku bare ✗ → 16 (ignored the shield)
- All skill-engine conditions ✗ → 16 (engine bug)

**Engine bug confirmed:** The engine's output shows `Bouclier (bouclier)` in the equipment list but the AC provenance reads `"Cotte de mailles base 16 + Dex +0 (plafond 0)"` — the shield's +2 bonus is not applied. This is a known engine limitation that needs fixing.

**Implication:** On this specific stat, bare Opus/Sonnet outperform the skill-engine. The engine's `sheet-lint` passes (the bug is in derived stat computation, not in choice legality), so 0-lint guarantee still holds — but it does not guarantee arithmetic correctness for equipment bonuses.

### 3. The real value of skill-engine: not arithmetic, but choice legality

Arithmetic accuracy is high across all conditions because D&D derived stats are simple formulas. The cases where bare models fail in practice are different:

- **Illegal choices**: picking a spell a class can't access, selecting a feat with unmet prerequisites, combining a background with conflicting traits
- **Edition confusion**: treating a 2014-only option as valid in 2024 (see adversarial benchmark)
- **Consistency at scale**: the skill-engine produces a schema-valid, lint-clean character every time — building 50 characters guarantees 50 × `sheet-lint: 0 errors`

These are not tested by arithmetic accuracy — they require the full constraint-checking resolver.

---

## Task catalog (arithmetic suite)

| Task | Class/Species | Key traps | Oracle source |
|------|---------------|-----------|---------------|
| halfling-rogue-stats | Rogue/Halfling | PP=10+WIS only (no PB without Perception proficiency), saves=DEX+INT | Engine |
| tiefling-sorcerer-stats | Sorcerer/Tiefling | HP die d6 (not d8), AC=10+DEX only (no CON), saves=CON+CHA, 6 cantrips | Engine |
| orc-paladin-stats | Paladin/Orc | **Shield +2 AC** (oracle=18, engine bug outputs 16), saves=WIS+CHA, 0 cantrips | D&D 2024 rules |
| gnome-warlock-stats | Warlock/Gnome | saves=WIS+CHA (not STR+CON), 3 prepared = 2 chosen + 1 always-prepared | Engine |

---

## Known limitations

- **Small sample** — 4 tasks, n=1 per cell. Variance unknown.
- **Oracle bug fixed mid-run**: orc-paladin oracle was initially set to AC=16 (engine output). Corrected to AC=18 after confirming that Opus bare and Sonnet bare correctly applied the shield rule. Skill-engine captures are not invalidated — they reflect engine behavior (16), which is now documented as a bug.
- **Tasks may be too easy**: All traps were correctly avoided by 5/6 conditions. Harder traps (e.g., Exhaustion levels, multiclass spell slot computation, concentration interaction rules) would better differentiate models.
- **Sonnet bare was initially blocked by AGENTS.md** grounding rule in round 1 (refused to compute from memory). Round 2 prompts were carefully scoped as "pure arithmetic from given inputs" to avoid the blocking condition.

---

## Engine bug — filed for fixing

**Bug:** `engine/build-character.mjs` (or equivalent) does not add shield AC bonus (+2) when computing `armorClass`. The shield appears in the equipment list but its AC contribution is missing from the provenance chain.

**Workaround:** None. Users relying on skill-engine for orc-paladin-with-shield will get AC=16 instead of 18. The sheet-lint does not detect this error.

**Priority:** Medium — affects any heavy-armor class with a shield. Paladin, Fighter, Cleric subsets affected.
