# Dungeons & Skills — pack de skills D&D 2024 « ancré »

*[English](README.md)*

[![CI](https://github.com/mlabarrere/dungeons-and-skills/actions/workflows/test.yml/badge.svg)](https://github.com/mlabarrere/dungeons-and-skills/actions/workflows/test.yml)
![licence : MIT](https://img.shields.io/badge/licence-MIT-black)
![règles : D&D 2024 (5.5)](https://img.shields.io/badge/r%C3%A8gles-D%26D%202024%20(5.5)-black)
![skills : 4](https://img.shields.io/badge/skills-build%20·%20check%20·%20lookup%20·%20help-black)
![langues : FR + EN](https://img.shields.io/badge/langues-FR%20%2B%20EN-black)
![ancré](https://img.shields.io/badge/ancr%C3%A9-z%C3%A9ro%20r%C3%A8gle%20invent%C3%A9e-black)

Un projet multi-skills, multi-plateformes et testé qui aide n'importe quel assistant IA (Claude,
ChatGPT, Cursor, Copilot…) à **construire et vérifier des personnages Dungeons & Dragons 2024
(« 5.5 »)** — avec les bonnes règles.

**Nouveau ici ? → [INSTALL.md](INSTALL.md) pour l'installer, puis `/dnd-build`.**

## Pourquoi

La mémoire d'entraînement d'un LLM mélange les éditions de D&D (3.5, 5e 2014, 5.5/2024,
Pathfinder) et produit des règles plausibles mais fausses. Une fiche de perso, c'est de
l'arithmétique avec citations ; une seule valeur fausse la rend illégale. D'où la règle qui
prime sur tout : **ne fais pas confiance à l'entraînement du modèle — lis le catalogue de règles
fourni et lance un moteur déterministe.** Voir [rules/grounding.md](rules/grounding.md).

## Skills

| Skill | Rôle |
|-------|------|
| [`dnd-build`](skills/dnd-build/SKILL.md)  | Création guidée d'un perso niveau 1, 0 erreur de règle. |
| [`dnd-check`](skills/dnd-check/SKILL.md)  | Audit d'une fiche existante, signale chaque erreur (le « checker »). |
| [`dnd-lookup`](skills/dnd-lookup/SKILL.md) | Recherche un sort/don/classe dans le catalogue et cite la source. |
| [`dnd-help`](skills/dnd-help/SKILL.md)   | Fonctionnement de la famille et principe d'ancrage. |

## Comment ça marche

- **Catalogue** (`data/*.json`) : 12 classes, 48 sous-classes, 10 espèces, 16 historiques,
  75 dons, ~390 sorts, équipement — données de règles déterministes, générées depuis la source
  de vérité `docs/`.
- **Moteur** (`engine/`) : `resolver.mjs` ne renvoie que les options légales à chaque étape ;
  `build-character.mjs` calcule CA/PV/DD/nombre de sorts et vérifie le résultat ; `cli.mjs` est
  le wrapper appelé par les skills.
- **Règle d'ancrage** ([rules/grounding.md](rules/grounding.md)) : intégrée *verbatim* dans chaque
  skill, dans `AGENTS.md`, dans les instructions Mode Projets et dans chaque adaptateur —
  maintenue synchrone par `scripts/check-rule-copies.mjs`.

```bash
# depuis la racine du repo
node engine/cli.mjs options answers.json           # prochains choix légaux (filtrés par les règles)
node engine/cli.mjs build   answers.json --lang fr # answers -> fiche + lint (0 erreur exigée)
node engine/cli.mjs check   fiche.character.json   # audit d'une fiche existante
```

Exemples : [examples/](examples/) (`dwarf-fighter`, `elf-druid` — answers + fiche attendue).

## Utilisation

- **Claude Code** — skills auto-chargés depuis `skills/` ; ou plugin via `.claude-plugin/`.
  Commandes : `/dnd-build`, `/dnd-check`, `/dnd-lookup`, `/dnd-help`.
- **Cursor / Windsurf / Cline / Kiro / GitHub Copilot** — la règle always-on est générée dans le
  format natif de chaque outil.
- **Claude / ChatGPT Projects** — colle [project-mode/INSTRUCTIONS.md](project-mode/INSTRUCTIONS.md)
  dans les instructions du Projet et uploade `project-mode/knowledge/` comme connaissance.
- **Tout autre agent** — pointe-le vers [AGENTS.md](AGENTS.md).

## Documentation

- [INSTALL.md](INSTALL.md) — installation par plateforme (Claude Code, Projects, Cursor, …).
- [PLATFORMS.md](PLATFORMS.md) — portabilité multi-agents & modèle d'adaptateurs.
- [rules/grounding.md](rules/grounding.md) — la règle d'ancrage ; [rules/schema.md](rules/schema.md) — schéma + formules.
- [CONTRIBUTING.md](CONTRIBUTING.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) · [SECURITY.md](SECURITY.md) · [CHANGELOG.md](CHANGELOG.md)

## Multilingue

Sortie en français ou anglais. Les `id` internes sont en français (clés du moteur) ; les noms
anglais viennent de `data/labels.en.json` (entités structurelles complètes ; noms de sorts =
extension incrémentale).

## Développement

```bash
node scripts/build-bundles.mjs    # régénère engine/ + data/ + project-mode/knowledge depuis docs/
node scripts/build-adapters.mjs   # régénère les adaptateurs depuis AGENTS.md
npm run skill:check               # check-sync + check-rule-copies (zéro drift)
npm test                          # node --test : correctness, behavior, catalog, adapters
```

Source de vérité : `docs/` (la base de règles) et la section `dnd-builder` d'`AGENTS.md` (le
texte de la règle). `engine/`, `data/` et les adaptateurs sont générés ; ne pas les éditer à la
main.

## Portée & limites

Niveau 1 uniquement (montée 2–20 = « Manquant documentaire »). Les dons d'origine *choisis* sont
enregistrés mais leurs effets ne sont pas encore développés (les dons *accordés* le sont) — voir
[dnd-help](skills/dnd-help/SKILL.md).

## Licence & attribution

Le travail original (moteur, scripts, prose des skills, docs) est sous [MIT](LICENSE). Les données
de règles sous `data/` et `docs/` dérivent du matériel D&D 2024 et sont incluses pour un **usage
privé** ; pour une distribution publique, rester dans le périmètre du **SRD 5.2 (2024, CC-BY-4.0)**
avec attribution — voir [ATTRIBUTION.md](ATTRIBUTION.md). Contenu de fan non officiel, sans
affiliation avec Wizards of the Coast.
