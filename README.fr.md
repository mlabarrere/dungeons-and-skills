# Dungeons & Skills — pack de skills D&D 2024 « ancré »

*[English](README.md)*

[![CI](https://github.com/mlabarrere/dungeons-and-skills/actions/workflows/test.yml/badge.svg)](https://github.com/mlabarrere/dungeons-and-skills/actions/workflows/test.yml)
![licence : MIT](https://img.shields.io/badge/licence-MIT-black)
![règles : D&D 2024 (5.5)](https://img.shields.io/badge/r%C3%A8gles-D%26D%202024%20(5.5)-black)
![skills : 1](https://img.shields.io/static/v1?label=skill&message=dungeons-and-skills&color=black)
![langues : 9](https://img.shields.io/badge/langues-EN·FR·DE·ES·IT·JA·RU·ZH·AR-black)
![ancré](https://img.shields.io/badge/ancr%C3%A9-z%C3%A9ro%20r%C3%A8gle%20invent%C3%A9e-black)

> [!NOTE]
> **Catalogue de bêta publique.** Le profil `srd-5.2` embarqué contient uniquement du contenu
> SRD 5.2.1 audité sous CC-BY-4.0. Le code original est sous licence MIT. Voir
> [ATTRIBUTION.md](ATTRIBUTION.md) et `data/catalog-provenance.json`.

Une Agent Skill autonome et multi-plateformes qui aide les assistants IA à **construire au niveau 1
et vérifier des personnages Dungeons & Dragons 2024 (« 5.5 »)** contre les règles couvertes par
le catalogue. Tout manque documentaire est signalé au lieu d'être inventé.

**Nouveau ici ? → [INSTALL.md](INSTALL.md) pour l'installer, puis `/dnd-build`.**

## Statut des hôtes

| Chemin | Statut | Fiabilité |
|--------|--------|-----------|
| Claude Code, OpenAI Codex et Cursor | **Hôtes bêta certifiés** | Smoke de release et moteur déterministe ; tout warning demande une vérification manuelle |
| Autres clients Agent Skills | **Compatible format** | Le format est attendu, mais l'UX et les permissions de chaque hôte ne sont pas certifiées ici |
| Claude/ChatGPT Projects et adaptateurs sans exécution | **Instructions uniquement** | Ancré dans le catalogue, mais calcul approximatif effectué par le modèle |

Installation standard depuis le dépôt public :

```bash
npx skills add mlabarrere/dungeons-and-skills --skill dungeons-and-skills
```

Il n'existe pas encore de paquet npm dédié ni de listing sur une marketplace tierce. Le CLI
`npx skills` installe directement depuis GitHub ; les archives de release restent le canal
hors ligne/de secours.

La skill publique suit la [spécification Agent Skills](https://agentskills.io/specification) :
son dossier contient son moteur, son catalogue SRD audité, ses assets et ses attributions.
La CI l'installe réellement via `npx skills` puis exécute `doctor`. Tout client compatible
charge `skills/dungeons-and-skills/` directement — voir
[PLATFORMS.md](PLATFORMS.md).

## Pourquoi

La mémoire d'entraînement d'un LLM mélange les éditions de D&D (3.5, 5e 2014, 5.5/2024,
Pathfinder) et produit des règles plausibles mais fausses. Une fiche de perso, c'est de
l'arithmétique avec citations ; une seule valeur fausse la rend illégale. D'où la règle qui
prime sur tout : **ne fais pas confiance à l'entraînement du modèle — lis le catalogue de règles
fourni et lance un moteur déterministe.** Voir [rules/grounding.md](rules/grounding.md).

## Skill

[`dungeons-and-skills`](skills/dungeons-and-skills/SKILL.md) détecte l'intention et exécute le
bon parcours : création guidée, audit, recherche catalogue, optimisation sous contraintes ou
diagnostic. Claude Code conserve `/dnd-build`, `/dnd-check`, `/dnd-lookup`, `/dnd-optimize` et
`/dnd-help` comme raccourcis explicites vers cette même skill.

## Comment ça marche

- **Catalogue** (`data/*.json`) : 12 classes, 12 sous-classes SRD, 9 espèces, 4 historiques,
  15 dons et 83 sorts SRD de niveau 0/1. Chaque entité distribuée possède une provenance
  SRD 5.2.1 primaire. L'interface existe en neuf langues ; les noms de catalogue utilisent
  l'anglais vérifié, puis l'ID stable en l'absence de traduction redistribuable.
- **Moteur** (`engine/`) : `resolver.mjs` ne renvoie que les options légales à chaque étape ;
  `build-character.mjs` calcule CA/PV/DD/nombre de sorts et vérifie le résultat ; `cli.mjs` est
  le wrapper appelé par les skills.
- **Règle d'ancrage** ([rules/grounding.md](rules/grounding.md)) : intégrée *verbatim* dans la
  skill, dans `AGENTS.md`, dans les instructions Mode Projets et dans chaque adaptateur —
  maintenue synchrone par `scripts/check-rule-copies.mjs`.

```bash
# depuis la racine du repo
node engine/cli.mjs options answers.json            # prochains choix légaux (filtrés par les règles)
node engine/cli.mjs build answers.json --lang fr     # HTML autonome à côté du fichier source
node engine/cli.mjs build answers.json --format markdown --lang fr
node engine/cli.mjs build answers.json --format json # JSON sur stdout (--json reste un alias)
node engine/cli.mjs check fiche.character.json       # audit Markdown sur stdout
node engine/cli.mjs check fiche.character.json --format html --output audit.html
```

`--format` accepte `html`, `markdown` et `json`. `--output` est disponible pour HTML et
Markdown ; JSON reste sur stdout. `--lang` accepte `en` `fr` `de` `es` `it` `ja` `ru` `zh`
`ar`, vaut `en` par défaut et se replie sur l'anglais si un label manque.

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

À catalogue, entrée et version du moteur identiques, le modèle calculé est reproductible. Changer
la langue d'affichage change les labels, jamais les valeurs de règles.

## Utilisation

- **Claude Code** — skill auto-chargée depuis `skills/` ; ou plugin via `.claude-plugin/`.
  Commandes : `/dnd-build`, `/dnd-check`, `/dnd-lookup`, `/dnd-optimize`, `/dnd-help`.
- **Cursor / Windsurf / Cline / Kiro / GitHub Copilot** — la règle always-on est générée dans le
  format natif de chaque outil.
- **Claude / ChatGPT Projects** — colle [project-mode/INSTRUCTIONS.md](project-mode/INSTRUCTIONS.md)
  dans les instructions du Projet et uploade `project-mode/knowledge/` comme connaissance.
- **Tout autre agent** — pointe-le vers [AGENTS.md](AGENTS.md).

## Documentation

- [INSTALL.md](INSTALL.md) — installation par plateforme (Claude Code, Projects, Cursor, …).
- [PLATFORMS.md](PLATFORMS.md) — portabilité multi-agents & modèle d'adaptateurs.
- [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md) — portée exacte, certification des hôtes et statut de release.
- [rules/grounding.md](rules/grounding.md) — la règle d'ancrage ; [rules/schema.md](rules/schema.md) — schéma + formules.
- [CONTRIBUTING.md](CONTRIBUTING.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) · [SECURITY.md](SECURITY.md) · [CHANGELOG.md](CHANGELOG.md)

## Multilingue

Le moteur rend des fiches en **9 langues**. Un label d'entité absent se replie sur l'anglais ;
les valeurs de règles ne changent pas.

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

Les noms anglais d'aptitudes disposent de manifests de sources primaires. Les autres overlays
combinent les sources éditeur, licenciées et communautaires indiquées ci-dessus. Les termes
exclusifs à 2024 sans traduction confirmée restent en anglais.

## Développement

```bash
node scripts/build-bundles.mjs    # régénère le moteur et la projection SRD auditée
node scripts/build-adapters.mjs   # régénère les adaptateurs depuis AGENTS.md
npm run skill:check               # check-sync + check-rule-copies + check-skills-spec (zéro drift)
npm test                          # adapters, behavior, catalog-interface, catalog, correctness, feature-label-manifests, golden, html, packaging, progression, public-catalog, release-archive, release-docs, release-manifest, rendering, skills-spec, validation
```

Le dépôt de développement privé projette sa source documentaire vers le profil public `data/`
audité. `engine/`, `data/`, la connaissance Project et les adaptateurs sont générés ; le dépôt
public ne contient ni la source privée ni son historique Git.

## Portée & limites

La création de personnage est limitée au niveau 1. Les tables de progression exposent des jalons
de référence 1–20, mais n'autorisent ni construction ni montée de niveau au-delà du niveau 1.
Voir [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md).

## Licence & attribution

Le travail original (moteur, scripts, prose et documentation) est sous [MIT](LICENSE). Le
catalogue public dérive uniquement du **SRD 5.2.1 (2024, CC-BY-4.0)** ; chaque entrée possède
une provenance et l'attribution obligatoire est fournie dans [ATTRIBUTION.md](ATTRIBUTION.md).
Contenu de fan non officiel, sans affiliation avec Wizards of the Coast.

> Ce travail inclut du matériel issu du System Reference Document 5.2 (« SRD 5.2 ») de Wizards of
> the Coast LLC, disponible sur https://www.dndbeyond.com/srd. Le SRD 5.2 est publié sous la
> licence Creative Commons Attribution 4.0 International.
