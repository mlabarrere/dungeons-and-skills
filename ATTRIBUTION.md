# Attribution and content licensing

The public beta contains original project code and an audited SRD-only rules catalog.

## Original project code

The engine, release tooling, skill instructions, adapters, tests, assets and project
documentation are original work licensed under the [MIT License](LICENSE).

## SRD 5.2.1 rules data

The files declared by `data/catalog-manifest.json` form the `srd-5.2` catalog profile.
Every catalog entry is mapped to its SRD section and source reference in
`data/catalog-provenance.json`; `scripts/audit-public-catalog.mjs` rejects an entry without
verified `CC-BY-4.0` provenance.

Required attribution:

> This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by
> Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is
> licensed under the Creative Commons Attribution 4.0 International License, available at
> https://creativecommons.org/licenses/by/4.0/legalcode.

The source document used by this release is:
<https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf>.

No Player's Handbook-only catalog, private documentary source, scan reference or private
overlay is included in the public repository or release archives.

## Trademarks

*Dungeons & Dragons* and *D&D* are trademarks of Wizards of the Coast. This project is
unofficial, is not endorsed by or affiliated with Wizards of the Coast, and makes no claim
over those marks.
