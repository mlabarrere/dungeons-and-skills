# Generateur online de personnage

Objectif final : construire une application web deployable sur Vercel qui guide la creation d'un personnage D&D 2024/5.5 et remplit une fiche imprimable au fil de l'eau.

Le repo Markdown reste la source de verite. Les images du livre ne doivent pas etre necessaires au fonctionnement de l'application.

## Experience cible

L'application doit presenter :

- a gauche : un assistant de creation avec les etapes, choix restants, conflits, recommandations et alertes ;
- a droite : une fiche de personnage visuelle, proche de la fiche officielle, prete a imprimer ;
- une mise a jour immediate quand le joueur change un choix ;
- une sortie imprimable via le navigateur ;
- une separation claire entre faits, calculs, choix manquants, conflits et recommandations.

Le joueur ne doit pas avoir a connaitre toutes les regles. L'interface doit lui demander seulement ce qui ne peut pas etre deduit depuis les sources Markdown.

## Principes non negociables

- Les fichiers Markdown sont la source documentaire.
- Les images ne sont pas utilisees par l'application.
- Un choix automatique ne doit jamais etre redemande.
- Un conflit ne doit jamais etre corrige silencieusement.
- Une recommandation ne doit jamais etre confondue avec une regle certaine.
- La fiche imprimable doit etre reproductible a partir d'un etat de personnage sauvegarde.
- Les contenus repris du livre doivent rester des aides personnelles de reference, pas une republication exhaustive publique.

## Role du LLM

Le LLM est utile pour :

- extraire et normaliser les informations Markdown pendant la phase de construction ;
- aider a detecter les trous documentaires ;
- proposer des remediations lisibles ;
- expliquer les conflits ou les choix au joueur.

Le LLM ne doit pas etre le seul moteur de calcul en production. Les calculs stables doivent etre codifies :

- modificateurs de caracteristiques ;
- bonus de maitrise ;
- points de vie ;
- CA ;
- initiative ;
- jets de sauvegarde ;
- competences ;
- perception passive ;
- DD des sorts ;
- attaques de sort ;
- attaques d'armes.

## Architecture cible

Stack recommandee :

- Next.js App Router sur Vercel ;
- TypeScript ;
- donnees de regles versionnees dans le repo ;
- moteur de generation cote client ou serveur selon les besoins ;
- rendu imprimable en HTML/CSS avec stylesheet `print`.

Structure possible :

```text
app/
  page.tsx
  character/[id]/page.tsx
  print/[id]/page.tsx
src/
  data/
    rules.generated.json
  domain/
    character.ts
    rules.ts
    validation.ts
    calculations.ts
  components/
    builder/
    sheet/
    alerts/
docs/
  md/
```

## Pipeline Markdown vers donnees

Le format Markdown reste lisible par humain, mais l'application doit consommer une representation structuree.

Pipeline propose :

1. Maintenir les fichiers `docs/md/*.md`.
2. Ajouter des sections et tableaux stables dans les MD.
3. Generer un fichier `rules.generated.json` depuis les MD.
4. Valider le JSON avec un schema.
5. Faire tourner les tests du moteur sur des personnages exemples, dont Medicis.

Le JSON genere ne remplace pas les MD. Il sert de format applicatif.

## Donnees applicatives minimales

Un personnage peut etre represente par :

```ts
type CharacterInput = {
  name: string
  level: number
  classId: string
  backgroundId: string
  speciesId: string
  lineageId?: string
  abilityScores: Record<Ability, number>
  choices: CharacterChoice[]
  notes?: CharacterNotes
}
```

Le moteur produit :

```ts
type CharacterBuild = {
  input: CharacterInput
  facts: Fact[]
  derived: DerivedValue[]
  sheet: PrintableSheet
  missingChoices: MissingChoice[]
  conflicts: Conflict[]
  recommendations: Recommendation[]
}
```

## Etats a afficher

Chaque information affichee dans l'interface doit garder son statut :

| Statut | Affichage attendu |
|---|---|
| Fourni | Valeur saisie par le joueur |
| Source | Valeur issue des regles Markdown |
| Calcule | Valeur calculee par le moteur |
| Deduit | Valeur probable, a confirmer |
| Manquant | Choix requis |
| A arbitrer | Decision MD ou table |
| Incoherent | Donnees incompatibles |
| Conflit | Choix duplique ou contradictoire |

## Fiche imprimable

La fiche imprimable doit etre une page HTML/CSS, pas forcement un PDF rempli.

Approche recommandee :

- recreer une fiche claire en HTML ;
- utiliser des zones fixes et un CSS `@media print` ;
- verifier le rendu A4 ;
- proposer un bouton `Imprimer` qui appelle `window.print()`.

Le PDF officiel peut servir de reference visuelle, mais le rendu final doit etre controle par l'application.

## Fonctionnement guide

L'assistant doit suivre cet ordre :

1. Identite : nom, niveau, classe, historique, espece, lignage.
2. Caracteristiques : valeurs et methode.
3. Choix automatiques : afficher ce qui est deja accorde.
4. Choix restants : poser uniquement les choix non resolus.
5. Equipement : option de classe, option d'historique, objets portes.
6. Sorts : distinguer sorts automatiques, sorts choisis, sorts prepares.
7. Validation : conflits, incoherences, manques.
8. Impression : fiche finale et resume des alertes.

## Tests de reference

Medicis doit devenir le premier test de bout en bout.

Le test doit verifier :

- que les PV sont calcules depuis druide niveau 1 et Constitution ;
- que les JS maitrises viennent de la classe ;
- que les competences viennent de la classe, de l'historique et de l'espece ;
- que `druidisme` automatique d'elfe sylvestre est detecte ;
- que `communication avec les animaux` automatique du druide est detecte ;
- que les doublons de sorts sont signales ;
- que l'equipement compose comme `focaliseur druidique (baton de combat)` est decomposable ;
- que la CA et les attaques sont calculees depuis l'equipement porte.

## Roadmap

### Phase 1 - Stabiliser les MD

- Completer les trous documentaires detectes.
- Normaliser les tableaux qui seront lus par machine.
- Ajouter les cas ambigus dans le protocole.
- Finaliser Medicis comme fiche de test.

### Phase 2 - Creer le moteur

- Definir les types TypeScript.
- Convertir les MD en JSON.
- Coder les calculs stables.
- Coder la detection des choix manquants.
- Coder la detection des conflits.

### Phase 3 - Construire l'interface

- Assistant de saisie.
- Panneau d'alertes.
- Fiche live.
- Mode impression.

### Phase 4 - Deployer

- Projet Next.js sur Vercel.
- Build de validation.
- Tests de non-regression avec Medicis et les autres personnages de la table.

## Questions ouvertes

| Sujet | Question | Impact |
|---|---|---|
| Sauvegarde | Les personnages doivent-ils etre stockes en local, dans le repo, ou dans une base ? | Produit / confidentialite |
| Authentification | L'application est-elle privee pour la table ou partageable ? | Vercel / securite |
| Multilingue | Francais seulement au depart ou structure prete pour plusieurs langues ? | Modele de donnees |
| Fiche officielle | Reproduire une fiche proche ou remplir un PDF officiel ? | Complexite technique |
| Sources | Jusqu'ou peut-on exposer les textes de regles dans une app web ? | Legal / diffusion |

