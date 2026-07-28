<!-- GENERATED from rules/doctor-exits.md by scripts/build-adapters.mjs — do not edit. -->
# What each exit code from `scripts/dnd.mjs` means

Load this the moment `doctor` returns anything other than 0. Do not guess which failure you
are looking at: three of these are your own bug and are fixable in one retry, one means the
bundle is genuinely missing, and one is a bug in the engine. They are not interchangeable,
and only one of them permits you to proceed at all.

| Exit | What you see | What it means | What to do |
|---|---|---|---|
| **0** | an installation report | code execution *and* the catalog are there | proceed; prefer its live counts to any number written in a skill file |
| **1** | `Cannot find module` | your path is wrong — **not** a missing bundle | retry with the absolute path of this skill folder |
| **1** | a report ending `NOT usable` | the bundle is present but a catalog file is missing | say which file the report named; answer only from the files that remain |
| **2** | `cannot find the Dungeons & Skills engine` | the bundle is genuinely absent | see *Exit 2* below |
| **3** | `unknown command` / `unknown flag` / `cannot read` | bad usage | the five commands are `options`, `build`, `check`, `progression`, `doctor`; read the single-line error and fix what it names |
| **4** | `internal error —` and a stack | the engine crashed — a bug in it, not in your input | report the message verbatim and stop; this does **not** license working from memory |
| **126** | `Permission denied` | you dropped the `node` prefix — the shim ships mode 644 and is not executable | re-run as `node scripts/dnd.mjs …`; nothing is wrong with the install |
| **127** | `node: command not found` | Node.js is not on this host's PATH | the engine cannot run here and you cannot install it; say so and stop |

Two traps in that table:

- **`doctor` ignores nothing.** It takes no arguments and refuses them with exit 3, so a stray
  flag announces itself rather than being silently dropped.
- **The `usage:` line printed on exit 3 names the engine's own path, not this shim's.** That is
  the engine talking about itself. You still invoke `node scripts/dnd.mjs` from inside this
  skill folder — copying the path out of that error message gets you exit 1.

## Exit 2 — what you can and cannot do without the engine

Exit 2 means the shim found no `scripts/dnd.mjs` carrying the catalog's own files beside it, so
"just read the catalog by hand" is not a fallback — it is a read of files that were only just
proven absent.

1. Try once more with the absolute path of this skill folder. A wrong path is exit 1, not exit 2.
2. If the catalog is genuinely elsewhere on disk and you can read it, say where you found it,
   apply the formulas in [references/schema.md](references/schema.md), and put one line before
   every value saying that nothing verified this arithmetic.
3. Otherwise say the rules bundle is not installed, point at
   `npx github:mlabarrere/dungeons-and-skills`, and **stop**.

Do not fill the gap from memory to be helpful. An uncited 2024 value and a remembered 2014 one
look identical to the user, and that is the single failure this toolkit exists to prevent.
