# Installation

The project works two ways: as an **agent skill/rule pack** (an AI assistant loads the skills or
the always-on rule) and as a **Project knowledge bundle** (paste instructions + upload files into
a Claude/ChatGPT Project). Pick the row for your tool.

## Prerequisites

- **Node.js 18+** on your `PATH` — the deterministic engine (`engine/cli.mjs`) runs on Node.
  Without Node the skills still work in "no code execution" mode (the assistant reads `data/` and
  applies `rules/schema.md` by hand), just without the engine double-check.
- A clone of this repository (or the published plugin), so the assistant can reach `engine/`,
  `data/`, `skills/` and `rules/` from the working directory.

```bash
git clone https://github.com/mlabarrere/dungeons-and-skills.git
cd dungeons-and-skills
node engine/cli.mjs build examples/dwarf-fighter.answers.json   # smoke test → a sheet, 0 errors
```

## Claude Code

**Project skills (from a checkout):** open Claude Code with this repo as the working directory.
The four skills in `skills/` are auto-discovered; invoke them with `/dnd-build`, `/dnd-check`,
`/dnd-lookup`, `/dnd-help`, or just describe the task and the right skill triggers.

**As a plugin (once published):**

```
/plugin marketplace add mlabarrere/dungeons-and-skills
/plugin install dungeons-and-skills@dungeons-and-skills
```

(Two separate prompts.) The plugin manifest is `.claude-plugin/plugin.json`; it points at
`skills/` and `commands/`.

## Claude Projects / ChatGPT Projects / Custom GPTs

No code execution, so the assistant runs in "read the catalog by hand" mode — still grounded.

1. Open your Project's **custom instructions** and paste the whole of
   [`project-mode/INSTRUCTIONS.md`](project-mode/INSTRUCTIONS.md).
2. Upload everything in [`project-mode/knowledge/`](project-mode/knowledge/) as the Project's
   **knowledge** (the catalog `*.json`, `schema.md`, `grounding.md`).
3. Ask it to build or check a D&D 2024 character. It will use the uploaded catalog, not its memory.

## Cursor / Windsurf / Cline / Kiro / GitHub Copilot

The always-on rule is generated into each tool's native format. Working from a checkout it is
picked up automatically; to use it in another project, copy the matching file into that project:

| Tool | File |
|------|------|
| Cursor | [`.cursor/rules/dnd-builder.mdc`](.cursor/rules/dnd-builder.mdc) |
| Windsurf | [`.windsurf/rules/dnd-builder.md`](.windsurf/rules/dnd-builder.md) |
| Cline | [`.clinerules/dnd-builder.md`](.clinerules/dnd-builder.md) |
| Kiro | [`.kiro/steering/dnd-builder.md`](.kiro/steering/dnd-builder.md) |
| GitHub Copilot | [`.github/copilot-instructions.md`](.github/copilot-instructions.md) |

These are **generated** from `AGENTS.md` by `scripts/build-adapters.mjs` — edit `AGENTS.md`, not
the copies. To reach the engine, those tools still need this repo's `engine/` + `data/` on disk.

## Any other agent

Point it at [`AGENTS.md`](AGENTS.md) (read as always-on context) or load the skill files under
`skills/` directly. See [PLATFORMS.md](PLATFORMS.md) for the full list.

## Verify the install

```bash
node engine/cli.mjs options examples/elf-druid.answers.json   # lists rules-legal choices
node engine/cli.mjs build   examples/elf-druid.answers.json --lang en   # sheet in English, 0 errors
npm test                                                       # full test suite
npm run skill:check                                            # no drift between docs/ and the bundle
```
