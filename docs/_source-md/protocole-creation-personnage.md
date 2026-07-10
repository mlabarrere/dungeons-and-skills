# Protocole de creation de personnage

Objectif : creer une fiche de personnage a partir des fichiers Markdown du repo, sans utiliser les images sources.

Ce protocole doit permettre de :

- remplir toutes les cases calculables ;
- identifier les choix manquants ;
- distinguer les donnees certaines, deduites et a arbitrer ;
- produire des recommandations sans masquer les choix du joueur ou du MD.

## Sources Markdown

Les sources de reference sont :

| Fichier | Role |
|---|---|
| `creation-personnage.md` | Procedure generale, calculs, caracteristiques, progression, formules |
| `classes/<classe>.md` | Traits de classe, aptitudes, maitrises, sorts, progression |
| `origines.md` | Historiques, especes, lignages, langues, traits d'origine |
| `dons.md` | Dons d'origine, dons generaux, prerequis, effets |
| `equipement.md` | Armes, armures, outils, paquetages, prix, poids, proprietes |
| `sorts-selectionnes.md` | Sorts effectivement choisis ou disponibles pour les joueurs |
| `personnages/<nom>.md` | Fiche de travail du personnage |
| `modele-graphe-provenance.md` | Modele des noeuds, aretes, statuts et lectures du graphe |

Les images ne doivent pas etre utilisees pendant la creation d'un personnage. Si une information manque dans les Markdown, le resultat doit indiquer que la base documentaire est incomplete.

## Statuts d'information

Chaque donnee importante doit etre classee dans l'un de ces statuts :

| Statut | Signification |
|---|---|
| Fourni | Donne explicitement par le joueur |
| Source | Trouve directement dans un Markdown de reference |
| Calcule | Derive par formule depuis des donnees fournies ou source |
| Deduit | Probable, mais non explicitement confirme |
| Manquant | Necessaire pour finir la fiche |
| A arbitrer | Demande une decision du MD ou une regle de table |
| Incoherent | Deux donnees se contredisent ou un calcul ne correspond pas |
| Conflit | Un choix joueur duplique ou contredit une option deja accordee par une autre source |

## Audit trail obligatoire

Chaque fiche doit permettre de comprendre pourquoi une case est remplie. La sortie ne doit pas seulement donner une valeur finale ; elle doit donner la chaine de justification.

Format minimal recommande :

| Case | Valeur | Statut | Pourquoi / preuve |
|---|---|---|---|
| Exemple | Exemple | Source / Calcule | Fichier ou choix qui justifie la valeur |

Regles :

- toute valeur issue d'une classe doit citer la classe ou l'aptitude ;
- toute valeur issue de l'espece doit citer le trait ou lignage ;
- toute valeur issue de l'historique doit citer l'historique ;
- toute valeur issue d'un don doit citer le don ;
- tout calcul doit afficher la formule ;
- tout doublon doit etre visible dans une section `Conflits et alertes` ;
- un objet compose doit etre decompose sans perdre le lien, par exemple `focaliseur druidique (baton de combat)` doit produire a la fois un focaliseur et un objet `baton de combat`.

Cette regle repond au besoin central : un joueur ou un MD doit pouvoir demander "pourquoi ce sort, cette maitrise ou cette arme est sur la fiche ?" et trouver la reponse sans refaire toute la creation.

## Graphe de provenance

L'audit trail doit etre bidirectionnel.

Le modele detaille est dans `modele-graphe-provenance.md`. Le protocole applique ce modele a la creation d'une fiche.

Lecture depuis une case de fiche :

```text
Case ou objet sur la fiche
<- source immediate
<- source parente
<- choix joueur ou regle automatique
```

Exemple :

```text
communication avec les animaux
<- toujours prepare par Druidique
<- aptitude de classe Druide niveau 1
<- personnage de classe Druide
```

Lecture depuis une source :

```text
Source
-> consequence directe
-> consequence indirecte
-> case(s) de fiche impactee(s)
```

Exemple :

```text
Guide
-> Initie a la magie (Druide)
-> 2 sorts mineurs + 1 sort de niveau 1 + caracteristique d'incantation
-> sections Dons, Sorts mineurs, Sorts prepares, Incantation
```

Une fiche auditee doit donc contenir au moins :

- un index "depuis la fiche" pour retrouver pourquoi une valeur existe ;
- un index "depuis les sources" pour voir ce que chaque classe, historique, espece, don ou choix apporte ;
- des relations marquees comme `Automatique`, `Choix`, `Calcule`, `Conflit`, `Manquant` ou `Possible mais non prouve`.
- les recommandations doivent etre marquees `Recommande`, jamais `Source`, tant qu'elles ne sont pas validees par le joueur.

Ce modele accepte les relations many-to-one, one-to-many et many-to-many.

Exemples :

- many-to-one : un meme sort peut etre donne par l'espece et choisi par la classe ;
- one-to-many : l'historique Guide donne des competences, un outil, un don et de l'equipement ;
- many-to-many : plusieurs sources de sorts peuvent alimenter les memes sections de fiche avec des regles differentes.

Les recommandations servent a pre-remplir l'interface ou la fiche de travail, mais elles ne deviennent pas des faits. Exemple : si `classes/druide.md` recommande `druidisme` et `flammes`, ces deux sorts peuvent etre proposes par defaut pour les 2 sorts mineurs du druide, mais ils restent des choix joueur. Si `druidisme` est deja accorde par Elfe sylvestre, le moteur doit signaler le conflit avant validation finale.

## Structure de sortie d'une fiche auditee

Une fiche de personnage doit etre structuree de facon stable pour etre lisible par un joueur, un MD et plus tard par un outil.

Sections attendues :

1. Identite.
2. Sources utilisees.
3. Caracteristiques.
4. Valeurs derivees principales.
5. Points de vie et defense.
6. Jets de sauvegarde.
7. Competences.
8. Capacites de classe.
9. Traits d'espece.
10. Dons.
11. Entrainement et maitrises.
12. Langues.
13. Equipement.
14. Liens avec objets magiques.
15. Armes et attaques.
16. Incantation.
17. Sorts mineurs.
18. Sorts prepares et sorts toujours prepares.
19. Emplacements et ressources.
20. Conflits et alertes.
21. Questions restantes.
22. Recommandations separees des faits.
23. Etat de completude.

Les sections de combat et de magie doivent utiliser des tableaux explicites.

Table minimale pour les armes :

| Arme | Bonus d'attaque | Type d'attaque | Degats | Notes | Statut | Pourquoi / preuve |
|---|---:|---|---|---|---|---|

Table minimale pour les sorts mineurs :

| Sort mineur | Source | Statut | Pourquoi / preuve | Audit |
|---|---|---|---|---|

Table minimale pour les sorts prepares :

| Sort | Niveau | Source | Compte dans les sorts prepares de classe ? | Statut | Pourquoi / preuve |
|---|---:|---|---|---|---|

Table minimale pour l'incantation :

| Source de sorts | Caracteristique | Modificateur d'incantation | DD de sauvegarde | Attaque de sort | Statut | Pourquoi / preuve |
|---|---|---:|---:|---:|---|---|

## Donnees minimales d'entree

Pour commencer une fiche, il faut idealement :

- nom ;
- niveau ;
- classe ;
- historique ;
- espece et lignage/sous-type si applicable ;
- valeurs de caracteristique ;
- points de vie si deja fixes ;
- choix de sorts connus ou prepares ;
- equipement deja choisi ;
- tout choix deja tranche par le joueur.

Si le niveau n'est pas fourni, supposer le niveau 1 uniquement pour un brouillon, et marquer `Niveau suppose`.

## Questions a poser pour remplir une fiche officielle

Cette section sert de questionnaire complet. Chaque reponse doit devenir une donnee `Fournie`, `Source`, `Calculee`, `Deduite`, `Manquante`, `A arbitrer` ou `Incoherente`.

### Identite

| Question | Utilisation |
|---|---|
| Quel est le nom du personnage ? | Nom sur la fiche |
| Quel est son niveau ? | Maitrise, PV, aptitudes, sorts |
| Quelle est sa classe ? | Traits, JS, competences, PV, sorts |
| A-t-il une sous-classe ? | Aptitudes specialisees |
| Quel est son historique ? | Don, competences, outils, equipement |
| Quelle est son espece ? | Taille, vitesse, traits, langues, sorts |
| A-t-il un lignage ou sous-type ? | Traits supplementaires |
| Quel est son alignement ? | Roleplay |
| Quel est son age, sa taille, son poids, son apparence ? | Description |
| Quels sont ses pronoms ou son genre si le joueur veut les noter ? | Description |
| Quel est son nom de joueur ? | Suivi de table |

### Caracteristiques

| Question | Utilisation |
|---|---|
| Quelle methode a ete utilisee pour les caracteristiques ? | Controle qualite |
| Quelles sont les valeurs brutes ? | Calcul des modificateurs |
| Les bonus d'historique sont-ils deja inclus ? | Eviter double comptage |
| Une valeur depasse-t-elle 20 ? | Detecter une anomalie |
| Des dons modifient-ils les caracteristiques ? | Mise a jour des valeurs |

### Points de vie et ressources defensives

| Question | Utilisation |
|---|---|
| Quels sont les PV maximums ? | Case PV max |
| Les PV sont-ils calcules ou fixes par le MD ? | Controle d'incoherence |
| Quels sont les PV actuels ? | Suivi de jeu |
| Y a-t-il des PV temporaires ? | Suivi de jeu |
| Quel est le de de vie ? | Repos court |
| Combien de des de vie sont disponibles ? | Repos court |
| Y a-t-il des jets de sauvegarde contre la mort a noter ? | Combat |

### Classe d'armure et defense

| Question | Utilisation |
|---|---|
| Quelle armure est portee ? | CA |
| Le personnage porte-t-il un bouclier ? | CA |
| La Dexterite est-elle limitee par l'armure ? | CA |
| Une aptitude ou un don modifie-t-il la CA ? | CA finale |
| Quelles resistances, immunites ou vulnerabilites a-t-il ? | Defense |
| A-t-il des avantages/desavantages defensifs recurrents ? | Notes de combat |

### Deplacement

| Question | Utilisation |
|---|---|
| Quelle est la vitesse de base ? | Mouvement |
| A-t-il une vitesse d'escalade, nage, vol ou autre ? | Mouvement |
| Une armure, aptitude ou sort modifie-t-il la vitesse ? | Mouvement |

### Initiative

| Question | Utilisation |
|---|---|
| Quel est le modificateur de Dexterite ? | Initiative de base |
| Une aptitude ou un don modifie-t-il l'initiative ? | Initiative finale |
| L'initiative est-elle maitrisee ou augmentee ? | Controle |

### Jets de sauvegarde

| Question | Utilisation |
|---|---|
| Quels JS sont maitrises par la classe ? | Cases cochees |
| Un don, une espece ou une aptitude ajoute-t-il une maitrise de JS ? | Cases cochees |
| Y a-t-il un bonus special a certains JS ? | Notes |
| Y a-t-il avantage sur certains JS ? | Notes |

### Competences

| Question | Utilisation |
|---|---|
| Quelles competences viennent de la classe ? | Cases cochees |
| Quelles competences viennent de l'historique ? | Cases cochees |
| Quelles competences viennent de l'espece ? | Cases cochees |
| Quelles competences viennent d'un don ? | Cases cochees |
| Y a-t-il Expertise sur une competence ? | Double maitrise |
| Y a-t-il un doublon de competence ? | A arbitrer |
| Quelles competences restent a choisir ? | Choix manquants |

Liste de competences a verifier :

| Competence | Caracteristique habituelle |
|---|---|
| Acrobaties | Dexterite |
| Arcanes | Intelligence |
| Athletisme | Force |
| Discretion | Dexterite |
| Dressage | Sagesse |
| Escamotage | Dexterite |
| Histoire | Intelligence |
| Intimidation | Charisme |
| Intuition | Sagesse |
| Investigation | Intelligence |
| Medecine | Sagesse |
| Nature | Intelligence |
| Perception | Sagesse |
| Persuasion | Charisme |
| Representation | Charisme |
| Religion | Intelligence |
| Tromperie | Charisme |
| Survie | Sagesse |

### Sens passifs

| Question | Utilisation |
|---|---|
| Quelle est la Perception passive ? | Fiche principale |
| Perception est-elle maitrisee ou sous Expertise ? | Calcul |
| Le personnage a-t-il Vision dans le noir ? | Exploration |
| Quelle est la portee de Vision dans le noir ? | Exploration |
| A-t-il vision aveugle, perception des vibrations ou autre sens ? | Exploration/combat |

### Maitrises hors competences

| Question | Utilisation |
|---|---|
| Quelles armes sont maitrisees ? | Attaques |
| Quelles armures sont maitrisees ? | CA et penalites |
| Quels boucliers sont maitrises ? | CA |
| Quels outils sont maitrises ? | Outils |
| Quels instruments, jeux, vehicules ou artisanats sont maitrises ? | Outils |
| Quelles langues sont connues ? | Roleplay/exploration |
| Les langues rares sont-elles autorisees ? | A arbitrer |

### Combat et attaques

| Question | Utilisation |
|---|---|
| Quelles armes sont equipees ? | Attaques |
| Quelle caracteristique utilise chaque attaque ? | Bonus d'attaque |
| Le personnage maitrise-t-il l'arme ? | Bonus d'attaque |
| Quels sont les degats et types de degats ? | Attaques |
| Quelles proprietes d'armes s'appliquent ? | Notes |
| Y a-t-il des attaques speciales ? | Actions |
| Y a-t-il une attaque de sort ? | Sorts |

### Sorts

| Question | Utilisation |
|---|---|
| Le personnage lance-t-il des sorts ? | Section sorts |
| Quelle est la caracteristique d'incantation par source ? | DD et attaque de sort |
| Combien de sorts mineurs connait-il par source ? | Sorts mineurs |
| Quels sorts mineurs sont choisis ? | Sorts mineurs |
| Combien de sorts sont prepares ? | Sorts prepares |
| Quels sorts sont prepares ? | Sorts prepares |
| Quels sorts sont toujours prepares ? | Notes |
| Combien d'emplacements a-t-il par niveau ? | Ressources |
| Comment recupere-t-il ses emplacements ou utilisations ? | Repos |
| Y a-t-il des sorts doublons entre classe, espece et don ? | A arbitrer |
| Le personnage a-t-il un focaliseur ? | Incantation |
| Des sorts demandent-ils concentration, rituel ou composantes materielles ? | Notes |

### Traits, dons et aptitudes

| Question | Utilisation |
|---|---|
| Quels traits de classe niveau par niveau sont actifs ? | Aptitudes |
| Quels traits d'espece sont actifs ? | Aptitudes |
| Quels traits d'historique sont actifs ? | Aptitudes |
| Quels dons sont actifs ? | Dons |
| Y a-t-il des ressources a suivre ? | Cases / compteurs |
| Quelles aptitudes se recuperent au repos court ? | Ressources |
| Quelles aptitudes se recuperent au repos long ? | Ressources |

### Equipement et argent

| Question | Utilisation |
|---|---|
| L'equipement de classe est-il choisi : option A ou B ? | Inventaire |
| L'equipement d'historique est-il choisi : option A ou B ? | Inventaire |
| Quelle armure est portee ? | CA |
| Quel bouclier est porte ? | CA |
| Quelles armes sont portees ? | Attaques |
| Quels outils et focaliseurs sont possedes ? | Maitrises/sorts |
| Combien de pieces d'or restent ? | Argent |
| Le poids et l'encombrement sont-ils suivis ? | Inventaire |

### Roleplay et notes

| Question | Utilisation |
|---|---|
| Quels traits de personnalite veut-on noter ? | Roleplay |
| Quels ideaux, liens et defauts veut-on noter ? | Roleplay |
| Qui compte pour le personnage ? | Backstory |
| Que cherche-t-il en aventure ? | Backstory |
| Quelle est sa peur principale ? | Backstory |
| Quels allies, contacts ou organisations connait-il ? | Campagne |

## Ordre de traitement

1. Creer ou ouvrir `personnages/<nom>.md`.
2. Reporter les donnees fournies sans les modifier.
3. Charger les donnees de classe depuis `classes/<classe>.md`.
4. Charger l'historique et l'espece depuis `origines.md`.
5. Charger les dons imposes ou choisis depuis `dons.md`.
6. Charger l'equipement depuis `equipement.md` si les options sont choisies.
7. Charger les sorts depuis `sorts-selectionnes.md` ou depuis les listes de classe deja extraites.
8. Calculer les valeurs derivees.
9. Identifier les choix automatiques deja imposes par classe, espece, historique ou don.
10. Identifier les choix restants.
11. Identifier les conflits et doublons.
12. Lister les choix manquants.
13. Lister les incoherences.
14. Proposer des recommandations separees des donnees certaines.

## Choix automatiques, choix restants et conflits

Une fiche ne doit pas redemander un choix deja impose par une source.

Exemples :

- si une classe donne automatiquement une langue, elle doit etre notee comme `Source`, pas demandee au joueur ;
- si une espece donne automatiquement un sort, il doit etre note comme `Source`, pas compte comme un choix libre ;
- si un historique impose un don, le don doit etre ajoute automatiquement ;
- si un choix joueur duplique une option automatique, marquer `Conflit` et proposer une remediation.

Quand une table permet de choisir ou de tirer au hasard :

- ne pas tirer sans accord explicite ;
- lister les options possibles si elles existent dans les Markdown ;
- si la table existe dans les Markdown, indiquer le de a lancer ;
- si la table n'existe pas dans les Markdown, marquer `Manquant documentaire`.

Un conflit ne doit jamais etre corrige silencieusement. La fiche doit contenir :

| Element | Source 1 | Source 2 | Type de conflit | Remediation proposee |
|---|---|---|---|---|
| Exemple | Exemple | Exemple | Doublon | Remplacer un choix libre par une option non dupliquee |

## Calculs systematiques

### Caracteristiques

Pour chaque caracteristique :

- noter la valeur ;
- calculer le modificateur ;
- verifier si les bonus d'historique ont bien ete appliques ;
- verifier qu'aucune valeur ne depasse 20 sauf regle explicite.

### Niveau et maitrise

Depuis `creation-personnage.md` :

- niveau 1 : bonus de maitrise +2 ;
- utiliser la table de progression pour les niveaux suivants.

### Points de vie

Au niveau 1 :

```text
PV = maximum du de de vie de classe + modificateur de Constitution
```

Pour les niveaux suivants, il faut connaitre la methode choisie par le MD :

- moyenne fixe ;
- jet de de ;
- autre regle de table.

Si les PV fournis ne correspondent pas au calcul connu, marquer `Incoherent` ou `A arbitrer`.

### Classe d'armure

Par defaut :

```text
CA sans armure = 10 + modificateur de Dexterite
```

Ensuite verifier :

- armure portee ;
- bouclier ;
- limite de Dexterite de l'armure ;
- aptitude de classe ;
- don ;
- objet special.

Si l'equipement n'est pas choisi, calculer seulement la CA sans armure et marquer la CA equipee comme manquante.

### Initiative

```text
Initiative = modificateur de Dexterite
```

Ajouter les dons, aptitudes ou objets si documentes.

### Jets de sauvegarde

Pour chaque JS :

```text
JS non maitrise = modificateur de caracteristique
JS maitrise = modificateur de caracteristique + bonus de maitrise
```

Les JS maitrises viennent principalement de la classe.

### Competences

Pour chaque competence :

```text
Competence non maitrisee = modificateur associe
Competence maitrisee = modificateur associe + bonus de maitrise
Expertise = modificateur associe + 2 x bonus de maitrise
```

Verifier les sources de maitrise :

- classe ;
- historique ;
- espece ;
- don ;
- autre aptitude.

Si une meme competence est donnee deux fois, ne pas cumuler automatiquement. Marquer comme `A arbitrer` ou appliquer la regle documentee si elle existe.

### Perception passive

```text
Perception passive = 10 + modificateur de Sagesse (Perception)
```

Si Perception est maitrisee, inclure le bonus de maitrise.

### Sorts

Pour chaque classe ou don donnant des sorts, noter separement :

- sorts mineurs connus ;
- sorts prepares ;
- sorts toujours prepares ;
- emplacements ;
- caracteristique d'incantation ;
- DD de sauvegarde ;
- bonus d'attaque de sort ;
- limites de recuperation.

Formules :

```text
DD des sorts = 8 + modificateur d'incantation + bonus de maitrise
Attaque de sort = modificateur d'incantation + bonus de maitrise
```

Un sort donne par plusieurs sources doit etre signale comme doublon possible.

Si une source donne automatiquement un sort et qu'un joueur choisit le meme sort via une autre source, marquer `Conflit`. Proposer de remplacer le choix libre si la regle ou le MD l'autorise.

## Checklist de sortie

Chaque fiche de personnage doit contenir :

- donnees fournies ;
- modificateurs ;
- calculs derives ;
- classe ;
- origine ;
- espece ;
- dons ;
- jets de sauvegarde ;
- maitrises ;
- competences ;
- sens passifs ;
- langues ;
- equipement ;
- attaques ;
- sorts ;
- aptitudes ;
- actions frequentes ;
- ressources a suivre ;
- choix manquants ;
- incoherences ;
- recommandations.

## Format des choix manquants

Utiliser un tableau :

| Priorite | Source | Choix manquant | Options connues | Impact |
|---|---|---|---|---|
| Haute | Classe | Exemple | Exemple | Bloque un calcul ou une case |

Priorites :

- Haute : bloque la fiche ou un calcul important.
- Moyenne : utile en jeu mais pas bloquant.
- Basse : detail narratif ou optimisation.

## Format des recommandations

Les recommandations doivent etre separees des faits.

Exemple :

| Sujet | Recommandation | Raison | A valider par |
|---|---|---|---|
| Sort mineur | Remplacer un doublon | Evite de perdre un choix | Joueur / MD |

Ne jamais remplacer un choix joueur sans le signaler.

## Controle qualite

Avant de considerer une fiche exploitable :

- verifier que toutes les donnees viennent des Markdown ;
- verifier les calculs principaux ;
- verifier les doublons de maitrise, sorts ou equipement ;
- verifier les incoherences entre PV, niveau, classe et Constitution ;
- verifier que chaque choix manquant est liste ;
- verifier que chaque recommandation est separee des donnees certaines.

## Cas Medicis comme test

Medicis sert de test du protocole.

Resultat attendu :

- la fiche doit pouvoir etre initialisee depuis les Markdown ;
- les calculs de base doivent etre remplis ;
- les choix manquants doivent etre explicites ;
- l'incoherence des PV doit etre visible ;
- le doublon potentiel `druidisme` doit etre visible ;
- aucune image ne doit etre consultee pendant la generation finale.
