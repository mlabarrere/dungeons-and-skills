# Agent portability

This is an agent-portable skill distribution. The **skills** in `skills/` and the **rules base**
in `data/` + `engine/` hold the behavior; the host-specific files are **thin adapters** that make
that behavior easy to load in a given agent. Adapters never diverge from the source — they are
generated from the `dnd-builder` section of `AGENTS.md` by `scripts/build-adapters.mjs`, and
`scripts/check-rule-copies.mjs` fails CI if any copy drifts.

## Tiers

- **Skill tier** — the host runs the skills in `skills/` and can execute `engine/cli.mjs`
  (rules-legal options + deterministic compute + lint). Best experience.
- **Instruction tier** — the host only loads an always-on rule file; it applies the grounding
  rule and reads `data/` by hand (no engine execution).

## Supported hosts

| Host | Files | Tier |
|------|-------|------|
| Claude Code | `.claude-plugin/plugin.json`, `skills/`, `commands/` | Skill |
| Claude Projects | `project-mode/INSTRUCTIONS.md` + `project-mode/knowledge/` | Instruction |
| ChatGPT Projects / Custom GPTs | `project-mode/INSTRUCTIONS.md` + `project-mode/knowledge/` | Instruction |
| Cursor | `.cursor/rules/dnd-builder.mdc` | Instruction |
| Windsurf | `.windsurf/rules/dnd-builder.md` | Instruction |
| Cline | `.clinerules/dnd-builder.md` | Instruction |
| Kiro | `.kiro/steering/dnd-builder.md` | Instruction |
| GitHub Copilot | `.github/copilot-instructions.md` | Instruction |
| Any other agent | `AGENTS.md` (always-on) or `skills/*/SKILL.md` loaded directly | Instruction |

## Adapter rule

Keep adapters thin. When a host supports skills, point it at `skills/`. When a host only supports
project instructions, keep its copied rule text aligned with the `dnd-builder` section of
`AGENTS.md` (the generator + `check-rule-copies` enforce this).

## Portable behavior

- `skills/dnd-build/SKILL.md` — guided level-1 character creation
- `skills/dnd-check/SKILL.md` — audit/validate an existing sheet
- `skills/dnd-lookup/SKILL.md` — catalog-only rules lookup
- `skills/dnd-help/SKILL.md` — family overview + grounding explainer
- `AGENTS.md` — compact always-on instruction set for agents without skill support
- `rules/grounding.md` — the load-bearing rule embedded verbatim everywhere

## Adding a host

Add the target file to `scripts/build-adapters.mjs`, run it, and add the file to the adapter
list in `scripts/check-rule-copies.mjs` so drift is caught. See [CONTRIBUTING.md](CONTRIBUTING.md).
