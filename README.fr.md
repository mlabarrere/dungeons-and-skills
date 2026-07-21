# Dungeons & Skills — pack de skills D&D 2024 « ancré »

*[English](README.md)*

[![CI](https://github.com/mlabarrere/dungeons-and-skills/actions/workflows/test.yml/badge.svg)](https://github.com/mlabarrere/dungeons-and-skills/actions/workflows/test.yml)
![licence : MIT](https://img.shields.io/badge/licence-MIT-black)
![règles : D&D 2024 (5.5)](https://img.shields.io/badge/r%C3%A8gles-D%26D%202024%20(5.5)-black)
![skills : 4](https://img.shields.io/badge/skills-build%20·%20check%20·%20lookup%20·%20help-black)
![langues : 9](https://img.shields.io/badge/langues-EN·FR·DE·ES·IT·JA·RU·ZH·AR-black)
![ancré](https://img.shields.io/badge/ancr%C3%A9-z%C3%A9ro%20r%C3%A8gle%20invent%C3%A9e-black)

> [!WARNING]
> **Données de règles — usage personnel uniquement.** Le catalogue (`data/`, `docs/`) est dérivé
> du matériel D&D 2024 (Wizards of the Coast). Le *code* est MIT ; les *données de règles* sont
> réservées à un usage personnel — ne pas redistribuer commercialement. Voir [ATTRIBUTION.md](ATTRIBUTION.md).

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
| [`dnd-build`](skills/dnd-build/SKILL.md)  | Création guidée d'un perso niveau 1, 0 erreur de règle, sortie en 9 langues. |
| [`dnd-check`](skills/dnd-check/SKILL.md)  | Audit d'une fiche existante, signale chaque erreur (le « checker »). |
| [`dnd-lookup`](skills/dnd-lookup/SKILL.md) | Recherche un sort/don/classe dans le catalogue et cite la source. |
| [`dnd-help`](skills/dnd-help/SKILL.md)   | Fonctionnement de la famille, langues supportées, principe d'ancrage. |

## Comment ça marche

- **Catalogue** (`data/*.json`) : 12 classes, 48 sous-classes, 10 espèces, 16 historiques,
  75 dons, ~391 sorts — données de règles déterministes, générées depuis `docs/`. Noms d'affichage
  en 9 langues via `data/labels.*.json` (EN, FR, DE, ES, IT, JA, RU, ZH, AR — tous vérifiés).
- **Moteur** (`engine/`) : `resolver.mjs` ne renvoie que les options légales à chaque étape ;
  `build-character.mjs` calcule CA/PV/DD/nombre de sorts et vérifie le résultat ; `cli.mjs` est
  le wrapper appelé par les skills.
- **Règle d'ancrage** ([rules/grounding.md](rules/grounding.md)) : intégrée *verbatim* dans chaque
  skill, dans `AGENTS.md`, dans les instructions Mode Projets et dans chaque adaptateur —
  maintenue synchrone par `scripts/check-rule-copies.mjs`.

```bash
# depuis la racine du repo
node engine/cli.mjs options answers.json            # prochains choix légaux (filtrés par les règles)
node engine/cli.mjs build   answers.json --lang fr  # answers → fiche en français + lint (0 erreur)
node engine/cli.mjs build   answers.json --lang en  # → fiche en anglais
node engine/cli.mjs build   answers.json --lang de  # → fiche en allemand
node engine/cli.mjs build   answers.json --lang es  # → fiche en espagnol
node engine/cli.mjs check   fiche.character.json    # audit d'une fiche existante
```

`--lang` accepte : `en` `fr` `de` `es` `it` `ja` `ru` `zh` `ar` — repli sur l'anglais si un label est absent.

Exemples : [examples/](examples/) (`dwarf-fighter`, `elf-druid` — answers + fiche attendue).

## Pourquoi les fiches restent justes

La fiabilité ne vient pas d'un prompt plus malin — elle vient du fait de sortir les règles de la
mémoire du modèle :

- **Le catalogue, pas la mémoire.** Chaque classe, espèce, background, don, sort, compétence et
  objet est lu depuis les `data/*.json` fournis, extraits du manuel officiel 2024 — jamais rappelé
  de l'entraînement (qui mélange 3.5, 5e 2014, 2024 et Pathfinder en règles plausibles-mais-fausses).
- **Un moteur déterministe, pas du calcul mental.** `engine/cli.mjs` calcule CA, PV, DD de
  sauvegarde et nombres de sorts, et lint la fiche ; le modèle ne devine jamais une valeur.
- **Seules les options légales sont proposées.** Le résolveur renvoie les choix exacts filtrés par
  les règles à chaque étape : un choix illégal n'est jamais présenté, un choix requis jamais oublié.
- **Provenance sur chaque valeur**, et un **« Manquant documentaire »** explicite dès que quelque
  chose sort du catalogue — le modèle nomme le manque au lieu d'inventer.

Le résultat : une fiche qui est de l'arithmétique avec citations — reproductible, auditable, et
identique qu'on la construise une fois ou cinquante, dans chacune des neuf langues supportées.

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

Le moteur génère des fiches complètes en **9 langues** — noms de classes, espèces, historiques,
compétences, caractéristiques et sorts dans la langue choisie, depuis les fichiers
`data/labels.*.json` vérifiés auprès des éditeurs officiels.

| Langue | Code | Éditeur |
|--------|------|---------|
| 🇬🇧 English | `en` | PHB 2024 (Wizards of the Coast) |
| 🇫🇷 Français | `fr` | PHB 2024 (Blackbook Éditions) |
| 🇩🇪 Deutsch | `de` | PHB 2024 (Ulisses Spiele) |
| 🇪🇸 Español | `es` | PHB 2024 (Devir) |
| 🇮🇹 Italiano | `it` | PHB 2024 (Need Games) |
| 🇯🇵 日本語 | `ja` | PHB 2024 (Hobby Japan) |
| 🇷🇺 Русский | `ru` | D&D 5e (Hobby World — quasi-officiel) |
| 🇨🇳 中文 | `zh` | Édition CN licenciée + standard communautaire |
| 🇸🇦 العربية | `ar` | Communauté (su3luq.com — studio de localisation TTRPG) |

Tous les labels ont été triple-vérifiés contre les textes officiels. Les termes exclusifs à 2024
sans traduction confirmée restent en anglais.

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

> Ce travail inclut du matériel issu du System Reference Document 5.2 (« SRD 5.2 ») de Wizards of
> the Coast LLC, disponible sur https://www.dndbeyond.com/srd. Le SRD 5.2 est publié sous la
> licence Creative Commons Attribution 4.0 International.
