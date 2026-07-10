# Medicis

Statut : fiche de test generee depuis les fichiers Markdown uniquement.

Objectif de cette fiche : montrer non seulement les valeurs finales, mais aussi l'audit trail de chaque valeur importante. Une ligne doit pouvoir repondre a la question : "Pourquoi Medicis a ca ?"

## Regle d'audit trail

| Statut | Sens |
|---|---|
| Fourni | Donne par le joueur |
| Source | Donne directement par un fichier Markdown de reference |
| Calcule | Produit par une formule documentee |
| Deduit | Hypothese raisonnable, a confirmer si necessaire |
| Manquant | Choix ou source absente |
| Conflit | Deux sources se recouvrent ou se contredisent |

## Sources utilisees

| Source | Role |
|---|---|
| `classes/druide.md` | Classe, PV, JS, maitrises, sorts de druide, Druidique |
| `origines.md` | Historique Guide, espece Elfe, lignage Elfe sylvestre |
| `dons.md` | Don `Initie a la magie` |
| `equipement.md` | Armes, armures, bouclier, proprietes, degats |
| `creation-personnage.md` | Calculs generaux |
| `sorts-selectionnes.md` | Sorts disponibles ou choisis quand ils sont documentes |

## Graphe de provenance

Cette section permet les deux lectures utiles :

- depuis la fiche : "J'ai X, pourquoi ?";
- depuis une source : "Je suis Guide/Druide/Elfe, qu'est-ce que ca m'apporte ?"

### Depuis les cases de la fiche

| Element sur la fiche | Chemin de provenance | Relation | Statut |
|---|---|---|---|
| `communication avec les animaux` | Sort toujours prepare <- Druidique <- Druide niveau 1 <- Classe Druide | Many-to-one possible, source retenue unique pour l'instant | Source |
| `druidisme` | Sort mineur <- Lignage Elfe sylvestre <- Espece Elfe | Source automatique | Source |
| `druidisme` | Sort mineur choisi <- Sorts de druide niveau 1 <- Classe Druide | Deuxieme chemin vers le meme sort | Conflit |
| `flammes` | Sort mineur choisi <- Sorts de druide niveau 1 <- Classe Druide | Choix joueur | Fourni + Source |
| Baton de combat | Arme et focaliseur <- Focaliseur druidique (baton de combat) <- Equipement Druide option A <- Classe Druide | One-to-many : un objet remplit deux roles | Source |
| Arc court | Arme <- Equipement Guide option A <- Historique Guide | Source directe | Source |
| Initie a la magie (Druide) | Don <- Historique Guide | Source directe | Source |
| Discretion | Competence <- Historique Guide | Source directe | Source |
| Survie | Competence <- Historique Guide | Source directe | Source |
| Perception | Competence choisie <- Sens aiguises <- Espece Elfe | Choix dans une liste | Fourni + Source |

### Depuis les sources

| Source | Apporte | Impact fiche | Statut |
|---|---|---|---|
| Classe Druide | d8 de vie | PV, des de vie | Source + Calcule |
| Classe Druide | JS Intelligence et Sagesse | Jets de sauvegarde | Source |
| Classe Druide | Armes courantes, armures legeres, boucliers, materiel d'herboriste | Maitrises, CA, attaques, outils | Source |
| Classe Druide -> Equipement A | Armure de cuir, bouclier, serpe, focaliseur druidique (baton de combat), paquetage, materiel d'herboriste, 9 po | Equipement, CA, attaques, incantation | Source |
| Classe Druide -> Druidique | Druidique + `communication avec les animaux` toujours prepare | Langues, sorts prepares | Source |
| Classe Druide -> Sorts | 2 sorts mineurs, 4 sorts prepares, 2 emplacements niveau 1 | Sorts mineurs, sorts prepares, ressources | Partiel |
| Classe Druide -> Recommandations de sorts mineurs | `druidisme`, `flammes` | Pre-remplissage possible des 2 choix de sorts mineurs | Recommande |
| Classe Druide -> Recommandations de sorts niveau 1 | `amitie avec les animaux`, `lueurs feeriques`, `soins`, `vague tonnante` | Pre-remplissage possible des 4 sorts prepares | Recommande |
| Classe Druide -> Ordre primitif | Gardien ou Mage | Maitrises ou sorts selon choix | Manquant |
| Historique Guide | Discretion, Survie | Competences | Source |
| Historique Guide | Outils de cartographe | Maitrises d'outils, equipement | Source |
| Historique Guide | Initie a la magie (Druide) | Don, sorts mineurs, sort niveau 1, incantation | Partiel |
| Historique Guide -> Equipement A | Arc court, fleches, carquois, outils de cartographe, sac de couchage, tente, tenue de voyage, 3 po | Equipement, attaque arc court, argent | Source |
| Espece Elfe | Ascendance feerique, Transe, Vision dans le noir, Sens aiguises | Traits, sens, competence choisie | Source |
| Lignage Elfe sylvestre | Vitesse 10,50 m + `druidisme` | Mouvement, sorts mineurs | Source |

## Identite

| Case | Valeur | Statut | Pourquoi / preuve |
|---|---|---|---|
| Nom | Medicis | Fourni | Donne par le joueur |
| Niveau | 1 | Fourni | Donne par le joueur |
| Classe | Druide | Fourni | Donne par le joueur |
| Historique | Guide | Fourni | Donne par le joueur |
| Espece | Elfe | Fourni | Donne par le joueur |
| Lignage | Elfe sylvestre | Fourni | Donne par le joueur |
| Alignement | Neutre bon | Fourni | Donne par le joueur |
| Age | Jeune | Fourni | Donne par le joueur |
| Taille | 1,60 m | Fourni | Donne par le joueur |
| Apparence | Hors scope | Fourni | Le joueur a indique que l'apparence n'est pas a traiter maintenant |

## Caracteristiques

| Caracteristique | Valeur | Modificateur | Statut | Pourquoi / preuve |
|---|---:|---:|---|---|
| Force | 10 | +0 | Fourni + Calcule | Valeur fournie ; modificateur calcule depuis la valeur |
| Dexterite | 11 | +0 | Fourni + Calcule | Valeur fournie ; modificateur calcule depuis la valeur |
| Constitution | 14 | +2 | Fourni + Calcule | Valeur fournie ; modificateur calcule depuis la valeur |
| Intelligence | 14 | +2 | Fourni + Calcule | Valeur fournie ; modificateur calcule depuis la valeur |
| Sagesse | 17 | +3 | Fourni + Calcule | Valeur fournie ; modificateur calcule depuis la valeur |
| Charisme | 14 | +2 | Fourni + Calcule | Valeur fournie ; modificateur calcule depuis la valeur |

Point d'audit : les valeurs semblent deja inclure les bonus d'origine. On ne les reapplique pas.

## Valeurs derivees principales

| Case | Valeur | Statut | Pourquoi / preuve |
|---|---:|---|---|
| Bonus de maitrise | +2 | Calcule | Niveau 1 |
| PV maximum | 10 | Calcule | Druide niveau 1 : d8 au maximum, donc 8 + Con +2 |
| De de vie | 1d8 | Source + Calcule | Druide : d8 par niveau ; niveau 1 donc 1 de de vie |
| Initiative | +0 | Calcule | Modificateur de Dexterite |
| CA sans armure | 10 | Calcule | 10 + Dex +0 |
| CA equipee | 13 | Calcule | Armure de cuir 11 + Dex +0 + bouclier +2 |
| Vitesse | 10,50 m | Source | Elfe sylvestre : vitesse portee a 10,50 m |
| Vision dans le noir | 18 m | Source | Trait d'espece Elfe |
| Perception passive | 15 | Calcule | 10 + Perception +5 |

Note : les 12 PV initiaux etaient une erreur de saisie signalee par le joueur. La valeur retenue est donc 10.

## Jets de sauvegarde

| Jet de sauvegarde | Mod | Maitrise | Total | Statut | Pourquoi / preuve |
|---|---:|---|---:|---|---|
| Force | +0 | Non | +0 | Calcule | Pas dans les JS maitrises du druide |
| Dexterite | +0 | Non | +0 | Calcule | Pas dans les JS maitrises du druide |
| Constitution | +2 | Non | +2 | Calcule | Pas dans les JS maitrises du druide |
| Intelligence | +2 | Oui | +4 | Source + Calcule | Druide maitrise Intelligence ; +2 mod Int + +2 maitrise |
| Sagesse | +3 | Oui | +5 | Source + Calcule | Druide maitrise Sagesse ; +3 mod Sag + +2 maitrise |
| Charisme | +2 | Non | +2 | Calcule | Pas dans les JS maitrises du druide |

## Competences

| Competence | Carac. | Maitrise | Total | Statut | Pourquoi / preuve |
|---|---|---|---:|---|---|
| Acrobaties | Dex | Non | +0 | Calcule | Aucune source ne donne Acrobaties |
| Arcanes | Int | Non | +2 | Calcule | Non choisi parmi les competences de druide |
| Athletisme | For | Non | +0 | Calcule | Aucune source ne donne Athletisme |
| Discretion | Dex | Oui | +2 | Source + Calcule | Historique Guide donne Discretion |
| Dressage | Sag | Oui | +5 | Fourni + Source + Calcule | Choisi comme competence de druide ; +3 Sag + +2 maitrise |
| Escamotage | Dex | Non | +0 | Calcule | Aucune source ne donne Escamotage |
| Histoire | Int | Non | +2 | Calcule | Aucune source ne donne Histoire |
| Intimidation | Cha | Non | +2 | Calcule | Aucune source ne donne Intimidation |
| Intuition | Sag | Non | +3 | Calcule | Non choisi via Sens aiguises |
| Investigation | Int | Non | +2 | Calcule | Aucune source ne donne Investigation |
| Medecine | Sag | Non | +3 | Calcule | Non choisi parmi les competences de druide |
| Nature | Int | Oui | +4 | Fourni + Source + Calcule | Choisi comme competence de druide ; +2 Int + +2 maitrise |
| Perception | Sag | Oui | +5 | Fourni + Source + Calcule | Choisi via Sens aiguises d'Elfe ; +3 Sag + +2 maitrise |
| Persuasion | Cha | Non | +2 | Calcule | Aucune source ne donne Persuasion |
| Representation | Cha | Non | +2 | Calcule | Aucune source ne donne Representation |
| Religion | Int | Non | +2 | Calcule | Non choisi parmi les competences de druide |
| Tromperie | Cha | Non | +2 | Calcule | Aucune source ne donne Tromperie |
| Survie | Sag | Oui | +5 | Source + Calcule | Historique Guide donne Survie |

Audit des choix de competences :

| Source | Regle | Choix retenu | Pourquoi |
|---|---|---|---|
| Historique Guide | Donne Discretion et Survie | Discretion, Survie | Automatique depuis l'historique |
| Classe Druide | Choisir 2 parmi Arcanes, Dressage, Intuition, Medecine, Nature, Perception, Religion, Survie | Dressage, Nature | Fourni par le joueur |
| Elfe - Sens aiguises | Choisir Intuition, Perception ou Survie | Perception | Fourni par le joueur ; evite de doubler Survie |

## Capacites de classe

| Capacite | Valeur sur la fiche | Statut | Pourquoi / preuve |
|---|---|---|---|
| Incantation | Druide lance des sorts avec la Sagesse | Source | Classe Druide niveau 1 |
| Druidique | Langue druidique connue | Source | Capacite de classe `Druidique` |
| Druidique | `communication avec les animaux` toujours prepare | Source | `classes/druide.md` indique que Druidique rend ce sort toujours prepare |
| Ordre primitif | Manquant | Manquant | Le druide doit choisir Gardien ou Mage au niveau 1 |

Point critique : `communication avec les animaux` ne vient pas de l'historique Guide dans les Markdown actuels. Il vient de la capacite de classe `Druidique`. Le don `Initie a la magie (Druide)` pourrait aussi choisir un sort de niveau 1, mais ce choix n'a pas encore ete fourni.

## Traits d'espece

| Trait | Valeur sur la fiche | Statut | Pourquoi / preuve |
|---|---|---|---|
| Type | Humanoide | Source | Espece Elfe |
| Taille | M | Source | Espece Elfe |
| Vitesse | 10,50 m | Source | Lignage Elfe sylvestre |
| Ascendance feerique | Avantage aux JS pour eviter ou mettre fin a l'etat Charme | Source | Espece Elfe |
| Sens aiguises | Maitrise de Perception | Fourni + Source | Elfe donne Intuition, Perception ou Survie ; Perception retenue |
| Transe | Repos long possible en 4 h de transe | Source | Espece Elfe |
| Vision dans le noir | 18 m | Source | Espece Elfe |
| Lignage elfique niveau 1 | `druidisme` | Source | Elfe sylvestre donne ce sort mineur |
| Lignage elfique niveau 3 | `grande foulee` | Source future | A appliquer au niveau 3 |
| Lignage elfique niveau 5 | `passage sans trace` | Source future | A appliquer au niveau 5 |

## Dons

| Don | Valeur sur la fiche | Statut | Pourquoi / preuve |
|---|---|---|---|
| Initie a la magie (Druide) | Don d'origine | Source | Historique Guide donne ce don |
| Initie a la magie (Druide) | 2 sorts mineurs de druide | Manquant | Le don est acquis, mais les deux sorts mineurs du don ne sont pas choisis |
| Initie a la magie (Druide) | 1 sort de druide de niveau 1 toujours prepare | Manquant | Le don est acquis, mais ce sort n'est pas choisi |
| Initie a la magie (Druide) | Caracteristique d'incantation : Int, Sag ou Cha | Manquant | Le don demande un choix de caracteristique |

Audit : le don n'a pas encore ete applique completement. Il est present parce que Medicis est Guide, mais il ne justifie pas encore `communication avec les animaux` tant que le choix du sort de niveau 1 du don n'a pas ete fourni.

## Entrainement et maitrises

| Categorie | Valeur | Statut | Pourquoi / preuve |
|---|---|---|---|
| JS | Intelligence, Sagesse | Source | Classe Druide |
| Armes | Armes courantes | Source | Classe Druide |
| Armures | Armures legeres | Source | Classe Druide |
| Boucliers | Boucliers | Source | Classe Druide |
| Outils | Materiel d'herboriste | Source | Classe Druide |
| Outils | Outils de cartographe | Source | Historique Guide |
| Competences | Discretion, Survie | Source | Historique Guide |
| Competences | Dressage, Nature | Fourni + Source | Choix de competences de druide |
| Competences | Perception | Fourni + Source | Choix de Sens aiguises d'Elfe |

## Langues

| Langue | Statut | Pourquoi / preuve |
|---|---|---|
| Commun | Source | Langue de base du personnage dans les Markdown |
| Druidique | Source | Classe Druide, capacite `Druidique` |
| Langue supplementaire 1 | Manquant | Origine : deux langues courantes a choisir ou tirer |
| Langue supplementaire 2 | Manquant | Origine : deux langues courantes a choisir ou tirer |

Options documentees pour tirage des langues courantes :

| 1d12 | Langue |
|---:|---|
| 1 | Draconique |
| 2-3 | Elfique |
| 4 | Geant |
| 5 | Gnome |
| 6 | Gobelin |
| 7-8 | Halfelin |
| 9 | Langue multiverselle des signes |
| 10-11 | Nain |
| 12 | Orc |

## Equipement

| Objet | Source | Statut | Pourquoi / preuve |
|---|---|---|---|
| Armure de cuir | Druide option A | Source | Equipement de depart choisi : Druide A |
| Bouclier | Druide option A | Source | Equipement de depart choisi : Druide A |
| Serpe | Druide option A | Source | Equipement de depart choisi : Druide A |
| Focaliseur druidique | Druide option A | Source | Equipement de depart choisi : Druide A ; forme concrete : baton de combat |
| Baton de combat | Druide option A | Source | `classes/druide.md` indique `focaliseur druidique (baton de combat)` ; l'objet est a la fois focaliseur et arme |
| Paquetage d'explorateur | Druide option A | Source | Equipement de depart choisi : Druide A |
| Materiel d'herboriste | Druide option A | Source | Equipement de depart choisi : Druide A |
| 9 po | Druide option A | Source | Equipement de depart choisi : Druide A |
| Arc court | Guide option A | Source | Equipement de depart choisi : Guide A |
| 20 fleches | Guide option A | Source | Equipement de depart choisi : Guide A |
| Carquois | Guide option A | Source | Equipement de depart choisi : Guide A |
| Outils de cartographe | Guide option A | Source | Equipement de depart choisi : Guide A |
| Sac de couchage | Guide option A | Source | Equipement de depart choisi : Guide A |
| Tente | Guide option A | Source | Equipement de depart choisi : Guide A |
| Tenue de voyage | Guide option A | Source | Equipement de depart choisi : Guide A |
| 3 po | Guide option A | Source | Equipement de depart choisi : Guide A |

Total monnaie documente : 12 po.

Audit important : le baton de combat ne doit pas etre perdu parce qu'il est entre parentheses. Il faut traiter `focaliseur druidique (baton de combat)` comme deux informations liees : un role d'incantation et un objet utilisable comme arme.

## Liens avec objets magiques

| Objet magique | Lien | Statut | Pourquoi / preuve |
|---|---|---|---|
| Aucun documente | Aucun | Manquant / non applicable | Aucun objet magique n'a ete fourni pour Medicis |

## Armes et attaques

Medicis maitrise les armes courantes via la classe Druide. La serpe, l'arc court et le baton de combat sont des armes courantes dans `equipement.md`.

| Arme | Bonus d'attaque | Type d'attaque | Degats | Notes | Statut | Pourquoi / preuve |
|---|---:|---|---|---|---|---|
| Serpe | +2 | Corps a corps | 1d4 tranchants | Legere ; botte d'arme `Coup double` non active sauf maitrise de botte accordee | Source + Calcule | Druide A donne serpe ; Force +0 + maitrise +2 |
| Arc court | +2 | Distance | 1d6 perforants | Deux mains ; munitions ; portee 24/96 ; botte `Ouverture` non active sauf maitrise de botte accordee | Source + Calcule | Guide A donne arc court ; Dex +0 + maitrise +2 |
| Baton de combat | +2 | Corps a corps | 1d6 contondants, ou 1d8 a deux mains | Polyvalente ; botte `Renversement` non active sauf maitrise de botte accordee | Source + Calcule | Druide A donne focaliseur druidique (baton de combat) ; Force +0 + maitrise +2 |

## Incantation

| Source de sorts | Caracteristique | Modificateur d'incantation | DD de sauvegarde | Attaque de sort | Statut | Pourquoi / preuve |
|---|---|---:|---:|---:|---|---|
| Druide | Sagesse | +3 | 13 | +5 | Source + Calcule | Classe Druide utilise Sagesse ; DD = 8 +3 +2 ; attaque = +3 +2 |
| Lignage Elfe sylvestre | A choisir : Int, Sag ou Cha | Manquant | Manquant | Manquant | Manquant | `origines.md` dit que le lignage demande une caracteristique d'incantation |
| Initie a la magie (Druide) | A choisir : Int, Sag ou Cha | Manquant | Manquant | Manquant | Manquant | `dons.md` demande une caracteristique d'incantation pour le don |

Recommandation non appliquee automatiquement : choisir Sagesse pour le lignage et le don afin d'utiliser les memes valeurs que les sorts de druide.

## Sorts mineurs

| Sort mineur | Source | Statut | Pourquoi / preuve | Audit |
|---|---|---|---|---|
| `druidisme` (lignage) | Elfe sylvestre | Source | Lignage Elfe sylvestre donne `druidisme` au niveau 1 | Automatique |
| `flammes` | Druide niveau 1 | Source | `classes/druide.md` le liste comme sort mineur recommande | Choix valide |
| `assistance` | Druide niveau 1 (remplace le doublon druidisme) | Source | Documente comme sort mineur de druide via `rodeur.md` (Combattant druidique) | Remplace druidisme |
| `poussiere d'etoile` | Ordre primitif Mage (+1) | Source | Documente comme sort mineur de druide via `rodeur.md` | Cantrip bonus de Mage |
| Sort mineur de don 1 | Initie a la magie (Druide) | Manquant | Aucun autre cantrip de druide documente ; liste complete non photographiee | A extraire |
| Sort mineur de don 2 | Initie a la magie (Druide) | Manquant | Idem | A extraire |

## Sorts prepares et sorts toujours prepares

| Sort | Niveau | Source | Compte dans les 4 sorts prepares de druide ? | Statut | Pourquoi / preuve |
|---|---:|---|---|---|---|
| `communication avec les animaux` | 1 | Druidique | Non documente comme comptant dans la limite | Source | `classes/druide.md` indique que Druidique le rend toujours prepare |
| `amitie avec les animaux` | 1 | Recommandation Druide niveau 1 | Oui si valide par le joueur | Recommande | `classes/druide.md` le liste comme sort niveau 1 recommande |
| `lueurs feeriques` | 1 | Recommandation Druide niveau 1 | Oui si valide par le joueur | Recommande | `classes/druide.md` le liste comme sort niveau 1 recommande |
| `soins` | 1 | Recommandation Druide niveau 1 | Oui si valide par le joueur | Recommande | `classes/druide.md` le liste comme sort niveau 1 recommande |
| `vague tonnante` | 1 | Recommandation Druide niveau 1 | Oui si valide par le joueur | Recommande | `classes/druide.md` le liste comme sort niveau 1 recommande |
| `baies nourricieres` | 1 | Initie a la magie (Druide) | Non, source distincte (toujours prepare) | Source (a confirmer) | Figure dans la liste primitive de `rodeur.md` ; druide = lanceur primitif, donc accessible, a confirmer avec le MJ |

Audit : Medicis a donc 1 sort toujours prepare certain (`communication avec les animaux`) et 4 recommandations pour remplir les 4 sorts prepares de druide. Les recommandations ne sont pas encore des choix definitifs tant que le joueur ne les valide pas.

Audit `communication avec les animaux` :

| Hypothese | Verdict | Pourquoi |
|---|---|---|
| Vient de l'elfe sylvestre | Non | Elfe sylvestre donne `druidisme`, puis `grande foulee`, puis `passage sans trace` |
| Vient de Guide directement | Non | Guide donne le don `Initie a la magie (Druide)`, pas directement ce sort |
| Vient d'Initie a la magie | Possible mais non prouve | Le don peut donner un sort de druide niveau 1, mais aucun choix n'a ete fourni |
| Vient du druide | Oui | La capacite `Druidique` indique `communication avec les animaux` toujours prepare |

Conclusion : si `communication avec les animaux` est marque sur la fiche actuelle de Medicis, la justification documentaire la plus solide est `Classe Druide > Druidique`, pas Guide.

## Emplacements et ressources magiques

| Ressource | Valeur | Statut | Pourquoi / preuve |
|---|---:|---|---|
| Emplacements niveau 1 | 2 | Source | Table de progression Druide niveau 1 |
| Sorts prepares de druide | 4 | Source | Table de progression Druide niveau 1 |
| Sorts mineurs de druide | 2 | Source | Table de progression Druide niveau 1 |
| Sort de don gratuit | 1 / repos long | Source | `Initie a la magie` donne un lancement gratuit de `baies nourricieres` (sort niveau 1 du don) |

## Conflits et alertes

| Element | Source 1 | Source 2 | Type | Impact | Remediation proposee |
|---|---|---|---|---|---|
| `druidisme` | Elfe sylvestre | Choix de sort mineur druide | Doublon | Consomme probablement un choix de sort mineur de druide pour rien | Demander au MD si Medicis peut remplacer le choix druide `druidisme` par un autre sort mineur |
| `communication avec les animaux` | Druidique | Eventuel choix via Initie a la magie | Recouvrement potentiel | Si le don choisit aussi ce sort, il peut ajouter un lancement gratuit mais le sort serait deja prepare | Ne marquer conflit que si le joueur confirme que le don choisit ce sort |
| Baton de combat | Focaliseur druidique compose | Arme courante | Risque de perte d'information resolu | Si on garde seulement "focaliseur", on perd une attaque possible | Normalisation appliquee : objet + role |
| Ordre primitif | Druide niveau 1 | Aucun choix fourni | Manquant | Peut donner des maitrises ou un sort mineur supplementaire selon option | Choisir Gardien ou Mage |

## Questions restantes

| Priorite | Question | Options connues | Pourquoi c'est necessaire |
|---|---|---|---|
| Haute | Quel Ordre primitif ? | Gardien ou Mage | Aptitude de druide niveau 1, peut modifier maitrises ou sorts |
| Haute | Valide-t-on les 4 sorts prepares recommandes de druide ? | `amitie avec les animaux`, `lueurs feeriques`, `soins`, `vague tonnante` | Remplir la section sorts avec des choix confirmes |
| Haute | Quels choix pour `Initie a la magie (Druide)` ? | 2 sorts mineurs + 1 sort niveau 1 + caracteristique Int/Sag/Cha | Le don vient automatiquement de Guide mais n'est pas applique |
| Moyenne | Quelles 2 langues supplementaires ? | Table 1d12 documentee | Remplir les langues |

## Recommandations separees des faits

| Sujet | Recommandation | Raison | A valider par |
|---|---|---|---|
| `druidisme` | Remplacer le choix de sort mineur druide `druidisme` | Elfe sylvestre l'accorde deja automatiquement | Joueur / MD |
| `communication avec les animaux` | Le garder comme sort toujours prepare de druide | La source actuelle est Druidique | Joueur / MD |
| Initie a la magie | Choisir Sagesse comme caracteristique du don | Meme stat que les sorts de druide | Joueur |
| Ordre primitif | Choisir Mage si Medicis veut renforcer l'incantation | Peut etre coherent avec une druide orientee sorts | Joueur |
| Baton de combat | Le garder dans l'inventaire et les attaques | C'est le support concret du focaliseur druidique de depart | Documentation / MD |

## Etat de completude

| Zone | Statut | Raison |
|---|---|---|
| Identite | Complet | Donnees fournies |
| Caracteristiques | Complet | Donnees fournies et modificateurs calcules |
| PV / CA / initiative | Complet | Calculable depuis classe, caracteristiques et equipement |
| JS | Complet | Classe Druide documentee |
| Competences | Complet | Choix fournis et sources documentees |
| Traits d'espece | Complet niveau 1 | Elfe sylvestre documente |
| Capacites de classe | Partiel | Ordre primitif manquant |
| Dons | Partiel | `Initie a la magie` acquis mais choix non faits |
| Langues | Partiel | Deux langues supplementaires manquantes |
| Equipement | Complet pour le scope actuel | Option Druide A et Guide A tracees, dont focaliseur druidique (baton de combat) |
| Armes / attaques | Complet pour l'equipement connu | Serpe, arc court et baton de combat traces avec leur provenance |
| Sorts | Partiel | `communication avec les animaux` justifie ; 4 prepares et don manquants |
