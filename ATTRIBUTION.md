# Attribution & content licensing

This project has two kinds of content with **different licenses**. Read this before
redistributing.

## 1. Original work — MIT

The engine, scripts, skill instructions, adapters, tests and documentation are original work,
licensed under the [MIT License](LICENSE). Reuse freely with attribution.

## 2. Game-rules data — not ours to relicense

The rules catalog (`data/*.json`) and the documentary base (`docs/`) are **derived from
Dungeons & Dragons 2024 rulebooks**. Game rules, statistics and text are the intellectual
property of Wizards of the Coast. This repository includes them for **private, personal use**
(a personal reference and character-builder).

**If you redistribute this project publicly**, you must ensure the rules content you ship is
within a license you are allowed to use:

- The **D&D System Reference Document 5.2 (2024)** is released by Wizards of the Coast under
  **[Creative Commons Attribution 4.0 (CC-BY-4.0)](https://creativecommons.org/licenses/by/4.0/)**.
  Content that appears in the SRD 5.2 may be redistributed **with attribution**.
- Content that is **only** in the Player's Handbook / Dungeon Master's Guide / Monster Manual
  (and not in the SRD) is **not** freely licensed. Remove or replace it before publishing, or
  keep the repository private.

Required CC-BY attribution when shipping SRD content, per Wizards' terms:

> This work includes material from the System Reference Document 5.2 ("SRD 5.2") by Wizards of
> the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the
> Creative Commons Attribution 4.0 International License, available at
> https://creativecommons.org/licenses/by/4.0/legalcode.

## 3. Trademarks / fan content

*Dungeons & Dragons* and *D&D* are trademarks of Wizards of the Coast. This project is
**unofficial fan content**, not published, endorsed by, or affiliated with Wizards of the Coast.
No challenge to their ownership is intended.

## Release status

- [x] Audit `data/` and `docs/` — personal-use strategy (Option B) retained; catalog ships
  as-is for personal use, with prominent `[!WARNING]` notice in README.
- [x] SRD 5.2 attribution block added to README.md and README.fr.md.
- [x] Repository name confirmed: **dungeons-and-skills** (`mlabarrere/dungeons-and-skills`).
