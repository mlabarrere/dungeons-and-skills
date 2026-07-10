# Modele de graphe de provenance

Objectif : representer les regles, choix, calculs et cases de fiche comme un graphe oriente de provenance.

Ce modele doit permettre deux questions symetriques :

- depuis une case de fiche : "Pourquoi ai-je cette valeur, cette competence, ce sort, cette arme ?"
- depuis une source : "Si je suis Guide, Druide, Elfe sylvestre, ou si je prends tel don, qu'est-ce que ca m'apporte ?"

## Deux graphes complementaires

### Graphe de regles

Le graphe de regles vient des fichiers Markdown de reference.

Exemples :

```text
Historique: Guide
-> Don: Initie a la magie (Druide)
-> Choix requis: 2 sorts mineurs de druide
-> Choix requis: 1 sort de druide niveau 1
-> Choix requis: caracteristique d'incantation Int/Sag/Cha
```

```text
Classe: Druide
-> Equipement option A
-> Focaliseur druidique (baton de combat)
-> Objet: baton de combat
-> Role: focaliseur druidique
-> Arme: baton de combat
```

### Graphe de personnage

Le graphe de personnage instancie les regles avec les choix du joueur.

Exemple avec Medicis :

```text
Medicis
-> Historique: Guide
-> Don: Initie a la magie (Druide)
-> Choix manquant: 2 sorts mineurs
-> Choix manquant: 1 sort niveau 1
```

```text
Medicis
-> Classe: Druide
-> Aptitude: Druidique
-> Sort toujours prepare: communication avec les animaux
-> Case fiche: sorts prepares et toujours prepares
```

## Types de noeuds

| Type | Exemples | Role |
|---|---|---|
| Personnage | Medicis | Racine d'un graphe instancie |
| Choix joueur | Classe Druide, Guide, Elfe sylvestre | Decision fournie |
| Source regle | Classe, historique, espece, lignage, don | Source documentaire |
| Aptitude | Druidique, Sens aiguises | Trait qui donne des effets |
| Don | Initie a la magie | Source secondaire d'effets |
| Maitrise | Perception, armes courantes, outils | Case ou capacite de fiche |
| Objet | Baton de combat, arc court | Element d'inventaire |
| Role d'objet | Focaliseur, arme, armure | Usage d'un objet |
| Sort | Druidisme, communication avec les animaux | Sort connu, choisi ou prepare |
| Calcul | CA, PV, DD des sorts | Valeur derivee |
| Case fiche | Attaques, langues, dons, sorts prepares | Destination visible |
| Choix requis | Langue, sort, ordre primitif | Trou a remplir |
| Conflit | Doublon druidisme | Alerte a resoudre |
| Recommandation | Sort conseille, equipement conseille | Proposition issue d'une source mais non encore choisie |

## Types d'aretes

| Relation | Sens | Exemple |
|---|---|---|
| `choisit` | Personnage -> choix joueur | Medicis choisit Druide |
| `accorde` | Source -> consequence automatique | Druide accorde Druidique |
| `requiert_choix` | Source -> choix requis | Initie a la magie requiert 2 sorts mineurs |
| `instancie` | Choix joueur -> source regle | Guide instancie Historique Guide |
| `calcule` | Donnees -> calcul | Con + d8 calcule PV |
| `remplit` | Effet -> case fiche | Druidique remplit Langues |
| `utilise` | Calcul -> donnee source | CA utilise armure de cuir |
| `duplique` | Source -> meme consequence | Elfe sylvestre et Druide donnent druidisme |
| `decompose` | Objet compose -> composants | Focaliseur druidique (baton) decompose baton + focaliseur |
| `bloque` | Manquant -> case fiche | Sorts prepares manquants bloquent section Sorts |
| `recommande` | Source -> option conseillee | Druide recommande druidisme et flammes |
| `pre_remplit` | Recommandation -> choix requis | Sort conseille propose dans l'interface |

## Statuts sur les noeuds ou aretes

| Statut | Usage |
|---|---|
| Automatique | Accordé par une source sans choix supplementaire |
| Fourni | Donne par le joueur |
| Calcule | Produit par une formule |
| Choix requis | Decision restante |
| Manquant documentaire | Source absente des MD |
| Conflit | Deux chemins incompatibles ou redondants |
| Possible | Chemin plausible mais non prouve |
| Remplace | Remediation validee |
| Recommande | Propose par la source, mais pas encore valide par le joueur |

## Direction du graphe

Le graphe principal va des causes vers les consequences :

```text
Source ou choix
-> aptitude, don, objet, maitrise, sort
-> calcul ou case de fiche
```

La lecture inverse est indispensable pour l'audit :

```text
Case de fiche
<- calcul ou effet
<- aptitude, don, objet, maitrise, sort
<- source ou choix
```

L'application ou la fiche Markdown doit pouvoir afficher les deux.

## DAG ou pas DAG

Le graphe devrait etre principalement un DAG si on separe correctement :

- les sources de regles ;
- les choix du joueur ;
- les effets ;
- les cases de fiche ;
- les alertes.

Mais il peut devenir cyclique si on melange une case finale avec sa propre justification.

Exemple a eviter :

```text
Sort prepare
-> section Sorts
-> validation des sorts
-> Sort prepare
```

Regle pratique : les calculs et validations peuvent lire le graphe, mais ne doivent pas redevenir des prerequis de leurs propres sources.

## Automatique, recommande, choisi

Ces trois statuts doivent rester separes.

| Statut | Effet dans le graphe | Effet dans l'interface |
|---|---|---|
| Automatique | Ajoute directement un noeud de fiche | Rempli sans demander au joueur |
| Recommande | Ajoute une option conseillee | Pre-remplit ou met en avant, mais reste modifiable |
| Choisi | Valide une option | Devient une source effective pour la fiche |

Exemple druide :

```text
Classe: Druide niveau 1
-> recommande: druidisme
-> recommande: flammes
-> choix requis: 2 sorts mineurs de druide
```

Si le joueur accepte les recommandations :

```text
Medicis
-> choisit sort mineur: druidisme
-> choisit sort mineur: flammes
```

Puis le moteur detecte :

```text
druidisme
<- choisi comme sort mineur de druide
<- deja accorde automatiquement par Elfe sylvestre
-> conflit: doublon
```

Exemple sorts prepares druide niveau 1 :

```text
Classe: Druide niveau 1
-> choix requis: 4 sorts prepares de niveau 1+
-> recommande: amitie avec les animaux
-> recommande: lueurs feeriques
-> recommande: soins
-> recommande: vague tonnante
```

Ces recommandations ne sont pas des sorts prepares tant que le joueur ne les valide pas.

Point important : `communication avec les animaux` est un sort toujours prepare via Druidique. Il ne remplace pas les 4 sorts prepares recommandes du druide niveau 1, sauf regle contraire documentee.

## Exemples de chemins

### Pourquoi Medicis a communication avec les animaux ?

```text
communication avec les animaux
<- Sort toujours prepare
<- Druidique
<- Druide niveau 1
<- Classe Druide
<- Medicis choisit Druide
```

### Qu'apporte Guide a Medicis ?

```text
Medicis choisit Guide
-> Historique Guide
-> Discretion
-> Survie
-> Outils de cartographe
-> Initie a la magie (Druide)
-> Equipement Guide A
```

Puis :

```text
Initie a la magie (Druide)
-> choix requis: 2 sorts mineurs de druide
-> choix requis: 1 sort de druide niveau 1
-> choix requis: caracteristique d'incantation
```

### Pourquoi Medicis a un baton de combat ?

```text
Baton de combat
<- Objet de depart
<- Focaliseur druidique (baton de combat)
<- Equipement Druide option A
<- Classe Druide
<- Medicis choisit Druide
```

Puis :

```text
Baton de combat
-> Role: focaliseur druidique
-> Case fiche: incantation
```

Et :

```text
Baton de combat
-> Role: arme courante
-> Attaque: +2, 1d6 contondants ou 1d8 a deux mains
-> Case fiche: armes et attaques
```

## Representation tabulaire dans les MD

Format minimal pour un graphe lisible dans Markdown :

| Id | Type | Libelle | Statut | Source documentaire |
|---|---|---|---|---|
| node:medicis | Personnage | Medicis | Fourni | `personnages/medicis.md` |
| node:druide | Source regle | Classe Druide | Source | `classes/druide.md` |

| De | Relation | Vers | Statut | Pourquoi |
|---|---|---|---|---|
| node:medicis | choisit | node:druide | Fourni | Classe donnee par le joueur |
| node:druide | accorde | node:druidique | Automatique | Druide niveau 1 |

Pour les fiches humaines, les tables "Depuis les cases" et "Depuis les sources" restent plus lisibles. Pour une application, le format noeuds/aretes sera plus robuste.

## Controle qualite

Un graphe de personnage est acceptable si :

- chaque case importante a au moins un chemin de provenance ;
- chaque choix automatique est relie a sa source ;
- chaque choix requis est visible comme noeud `Choix requis` ;
- chaque conflit a les deux chemins concurrents ;
- chaque calcul garde ses entrees ;
- aucun effet n'est seulement "devine" sans statut ;
- les objets composes sont decomposes en objet concret et roles.
