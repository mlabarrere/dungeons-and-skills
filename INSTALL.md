# Installation

The project works two ways: as an **autonomous agent skill/rule pack** (an AI assistant loads the skill or
the always-on rule) and as a **Project knowledge bundle** (paste instructions + upload files into
a Claude/ChatGPT Project). Pick the row for your tool.

## Prerequisites

- **Node.js 18+** on your `PATH` — the deterministic engine (`engine/cli.mjs`) runs on Node.
  The skills in `skills/` require Node; without it they report the gap and stop. The
  instruction-tier hosts (Claude Projects, ChatGPT Projects) do not use the skills and do not
  need Node — they read the catalog files directly.
- The autonomous skill on disk. Standard Agent Skills installers copy its engine, catalog,
  assets and attribution together, so it does **not** depend on the repository layout.

## Recommended: Agent Skills installer

From the project where you want to use the skill:

```bash
npx skills add mlabarrere/dungeons-and-skills --skill dungeons-and-skills
```

The installer detects supported agents and lets you choose project or global scope. To target
specific hosts non-interactively:

```bash
npx skills add mlabarrere/dungeons-and-skills --skill dungeons-and-skills --agent codex -y
npx skills add mlabarrere/dungeons-and-skills --skill dungeons-and-skills --agent claude-code -y
npx skills add mlabarrere/dungeons-and-skills --skill dungeons-and-skills --agent cursor -y
```

Add `--global` to make it available across projects. `npx skills update` and
`npx skills remove dungeons-and-skills` manage later updates and removal.

Verify an isolated installation by running the skill-local shim:

```bash
node .agents/skills/dungeons-and-skills/scripts/dnd.mjs doctor --json
```

Claude Code uses `.claude/skills/` instead of `.agents/skills/`.

## Checkout / offline fallback

```bash
git clone https://github.com/mlabarrere/dungeons-and-skills.git
cd dungeons-and-skills
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

For the native plugin experience:

```text
/plugin marketplace add mlabarrere/dungeons-and-skills
/plugin install dungeons-and-skills@dungeons-and-skills
/reload-plugins
```

The plugin exposes `/dnd-build`, `/dnd-check`, `/dnd-lookup`, `/dnd-optimize` and `/dnd-help`.
Plain-language D&D requests trigger the same unified skill automatically.

The repository is its own Claude marketplace; no central listing is required. The community
marketplace submission is tracked separately. The release ZIP or tarball remains available
for offline installs: extract it and run `node install.mjs <target>`.

## Claude Projects / ChatGPT Projects / Custom GPTs

No code execution, so the assistant runs in "read the catalog by hand" mode — still grounded.

1. Open your Project's **custom instructions** and paste the whole of
   [`project-mode/INSTRUCTIONS.md`](project-mode/INSTRUCTIONS.md).
2. Upload everything in [`project-mode/knowledge/`](project-mode/knowledge/) as the Project's
   **knowledge** (the catalog `*.json`, `schema.md`, `grounding.md`).
3. Ask it to build a level-1 character or check an existing sheet. It will use the uploaded
   catalog, not its memory, but its arithmetic is not engine-certified.

## Cursor / Windsurf / Cline / Kiro / GitHub Copilot

Prefer the `npx skills` command above for Cursor and every host that supports Agent Skills.
The always-on rule is also generated into each tool's native format as a fallback:

| Tool | File |
|------|------|
| Cursor | [`.cursor/rules/dnd-builder.mdc`](.cursor/rules/dnd-builder.mdc) |
| Windsurf | [`.windsurf/rules/dnd-builder.md`](.windsurf/rules/dnd-builder.md) |
| Cline | [`.clinerules/dnd-builder.md`](.clinerules/dnd-builder.md) |
| Kiro | [`.kiro/steering/dnd-builder.md`](.kiro/steering/dnd-builder.md) |
| GitHub Copilot | [`.github/copilot-instructions.md`](.github/copilot-instructions.md) |

These are generated from `AGENTS.md` by `scripts/build-adapters.mjs`. The autonomous skill
already contains the engine and catalog; rule-only fallbacks do not.

## Any other agent

Install or copy [`skills/dungeons-and-skills/`](skills/dungeons-and-skills/) as one unit. If the
host cannot load skills, point it at [`AGENTS.md`](AGENTS.md). See [PLATFORMS.md](PLATFORMS.md).

## Verify the install

```bash
node engine/cli.mjs options examples/elf-druid.answers.json   # lists rules-legal choices
node engine/cli.mjs build examples/elf-druid.answers.json --lang en     # standalone HTML beside input
node engine/cli.mjs check path/to/character.json --format markdown             # audit on stdout
npm test                                                       # full test suite
npm run skill:check                                            # no drift between docs/ and the bundle
```

For a marketplace-style install, `doctor` must resolve an engine path inside the installed
`dungeons-and-skills` skill folder, not from a surrounding checkout.

Successful execution means the software path works; a sheet with warnings still requires manual
verification. Character creation above level 1 is outside the current implementation. See
[KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md).
