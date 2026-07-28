# Installation

The project works two ways: as an **agent skill/rule pack** (an AI assistant loads the skills or
the always-on rule) and as a **Project knowledge bundle** (paste instructions + upload files into
a Claude/ChatGPT Project). Pick the row for your tool.

## Prerequisites

- **Node.js 18+** on your `PATH` — the deterministic engine (`engine/cli.mjs`) runs on Node.
  The skills in `skills/` require Node; without it they report the gap and stop. The
  instruction-tier hosts (Claude Projects, ChatGPT Projects) do not use the skills and do not
  need Node — they read the catalog files directly.
- The bundle on disk — via `install.mjs` or a clone of this repo. The
  skills locate the engine themselves (`$CLAUDE_SKILL_DIR/../../engine/cli.mjs`, or `engine/cli.mjs`
  from a checkout), so you do **not** have to run from any particular directory.

```bash
git clone https://github.com/mlabarrere/dungeons-and-skills-srd.git
cd dungeons-and-skills-srd
node engine/cli.mjs build examples/dwarf-fighter.answers.json   # smoke test → a sheet, 0 errors
```

## Host status

Status describes what this project actually verifies, not what a host may support in principle.

| Status | Paths | Engine | Reliability |
|--------|-------|--------|-------------|
| **Certified beta host** | Claude Code, OpenAI Codex and Cursor | Recorded release smoke plus deterministic CLI | Deterministic for catalog-covered level-1 rules; warnings require review |
| **Agent Skills compatible** | Kiro, Gemini CLI, VS Code/Copilot, OpenCode, Goose, Amp and other compatible clients | Expected when execution is permitted | Host integration is not certified |
| **Instruction-only** | Claude/ChatGPT Projects, Custom GPTs, Windsurf/Cline rule adapters | No engine execution | Grounded but approximate |

Engine-backed paths require Node.js 18+ and the rules bundle on disk. Instruction-only paths do
not require Node.js because the model reads the uploaded catalog itself.

## Claude Code

**Project skills (from a checkout):** open Claude Code with this repo as the working directory.
The five skills in `skills/` are auto-discovered; invoke them with `/dnd-build`, `/dnd-check`,
`/dnd-lookup`, `/dnd-optimize`, `/dnd-help`, or just describe the task and the right skill triggers.

The repository contains a plugin manifest for development and validation, but **there is no
marketplace listing yet**. There is likewise no npm-registry package today. Download the
GitHub release ZIP or tarball, extract it, and run `node install.mjs <target>`.

## Claude Projects / ChatGPT Projects / Custom GPTs

No code execution, so the assistant runs in "read the catalog by hand" mode — still grounded.

1. Open your Project's **custom instructions** and paste the whole of
   [`project-mode/INSTRUCTIONS.md`](project-mode/INSTRUCTIONS.md).
2. Upload everything in [`project-mode/knowledge/`](project-mode/knowledge/) as the Project's
   **knowledge** (the catalog `*.json`, `schema.md`, `grounding.md`).
3. Ask it to build a level-1 character or check an existing sheet. It will use the uploaded
   catalog, not its memory, but its arithmetic is not engine-certified.

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
node engine/cli.mjs build examples/elf-druid.answers.json --lang en     # standalone HTML beside input
node engine/cli.mjs check path/to/character.json --format markdown             # audit on stdout
npm test                                                       # full test suite
npm run skill:check                                            # no drift between docs/ and the bundle
```

Successful execution means the software path works; a sheet with warnings still requires manual
verification. Character creation above level 1 is outside the current implementation. See
[KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md).
