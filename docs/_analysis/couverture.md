# Couverture des sources D&D

Etat au 2026-07-09.

**Base convertie en HTML.** La source de verite est desormais `docs/html/` (voir
`docs/html/index.html`). Les Markdown d'extraction sont archives en lecture seule dans
`docs/_source-md/`. Les images `docs/img/` (Batch 1/2/3) restent la verite ultime **en local**
— elles ne sont **PAS versionnees** (contenu du livre, gardees privees ; voir `.gitignore`).
Le catalogue ne cite que des references `img:<page>`, jamais les fichiers.

## Batch 3 — re-scan complet du livre (2026-07-09)

224 images (46 doublons ecartes), couvrant tout le livre. Extrait en HTML :

- **Classes** : les 12 classes completes + **48 sous-classes** (`docs/html/classes/`, index regenere).
- **Especes** : les 10 especes completees (plus de stub) + lignages/heritages.
- **Sorts** : alphabet complet, **388 sorts** (`docs/html/sorts/`, index filtrable) + `regles/incantation.html`.
- **Annexe A** : `regles/multivers.html`. **Annexe B** : bestiaire, 51 profils (`docs/html/creatures/`).
  **Annexe C** : `regles/glossaire.html` (+ 15 ancres d'etats).

Reste : maillage type Wikipedia (liens inter-fiches) prevu en toute fin, une fois l'exhaustivite atteinte.
Manifeste Batch 3 : `docs/_analysis/batch3_manifest.csv`.

## Sources trouvees

- Dossier principal : racine du dépôt
- Images du livre : `docs/img`
- Nombre d'images : 59 JPEG
- Dimensions : toutes les images font 1536 x 2048 px
- Planches contact generees :
  - `docs/_analysis/contact_01.jpg`
  - `docs/_analysis/contact_02.jpg`
  - `docs/_analysis/contact_03.jpg`
  - `docs/_analysis/contact_04.jpg`
- Manifeste technique : `docs/_analysis/image_manifest.csv`

## Doublons exacts

Deux paires d'images sont des doublons exacts d'apres leur hash MD5 :

| Index | Fichier | Doublon de |
|---:|---|---:|
| 13 | `WhatsApp Image 2026-07-07 at 12.02.59 (2).jpeg` | 12 |
| 29 | `WhatsApp Image 2026-07-07 at 12.03.01 (2).jpeg` | 28 |

## Couverture par zone

| Index images | Zone visible | Statut | Remarques |
|---|---|---|---|
| 1-7 | Chapitre 2 - creation de personnage | Converti en HTML | `docs/html/regles/creation-personnage.html` : etapes, methodes de caracteristiques, formules, table de progression. |
| 8 | Chapitre 3 - classes, introduction | Exploite | Apercu des sous-classes utilise pour enrichir les stubs de classes. |
| 9-11 | Clerc | Converti en HTML | `docs/html/classes/clerc.html`. Progression + aptitudes + sorts extraits. Domaines non photographies : stub. |
| 12-14 | Druide | Converti en HTML | `docs/html/classes/druide.html`. L'image 13 double l'image 12. Aptitudes niveau 5+ et cercles non photographies : stub. |
| 15-17 | Rodeur | Converti en HTML | `docs/html/classes/rodeur.html`. Sous-classes non photographiees : stub. |
| 18-31 | Chapitre 4 - origines | Converti en HTML | `docs/html/especes/` + `docs/html/historiques/` : 16 historiques (img 19-26), Elfe + 3 lignages (img 27-28), Tieffelin + 3 heritages (img 30-31). Autres especes 2024 (Aasimar, Drakeide, Gnome, Goliath, Halfelin, Humain, Nain, Orc) non photographiees (p. 186-187, 190-195) : stubs. Image 29 double l'image 28. |
| 32-44 | Chapitre 5 - dons | Converti en HTML | `docs/html/dons/` : 75 dons detailles (Origines, General, Style de combat, Faveur epique). Aucun stub. |
| 45-59 | Chapitre 6 - equipement | Converti en HTML | `docs/html/equipement/` : armes, armures, outils, paquetages, equipement d'aventurier (monnaie, focaliseurs, munitions, montures/vehicules). |
| Chapitre 7 - sorts (lot img Batch 2) | Converti en HTML | `docs/html/sorts/` : **151 sorts** extraits (A a E environ), index filtrable + `regles/incantation.html` pour les regles d'incantation. 46 images uniques (3 doublons). 6 stubs : sorts cites hors lot (flammes, lueurs-feeriques, soins, vague-tonnante) et 2 frontieres (communication-avec-les-plantes, eclair) dont le texte continue hors images. Valide par `spellcheck.mjs`. |
| Sorts F a Z | Non photographie | A venir | Le reste de l'alphabet des sorts n'est pas encore photographie ; a ajouter par lots suivants. |
| Autres classes | Non photographie | Stubs | 9 classes 2024 (Barbare, Barde, Ensorceleur, Guerrier, Magicien, Moine, Occultiste, Paladin, Roublard) en stubs `data-status="manquant"`. |

## Structure HTML (source de verite)

```text
docs/html/
  index.html            styleguide.html   CONVENTIONS.md   UTILISATION.md
  assets/               ds.css / ds.print.css / ds.js
  regles/               creation-personnage, protocole, modele-graphe-provenance (SVG), generateur-online
  classes/              index + clerc/druide/rodeur + 9 stubs
  especes/              index + elfe/tieffelin (+ lignages) + 8 stubs
  historiques/          index + 16 historiques
  dons/                 index + 75 dons
  equipement/           index + armes/armures/outils/paquetages/aventurier
  sorts/                index + 7 stubs de sorts cites
  personnages/          fiches de la table
docs/_source-md/        archive des Markdown d'extraction (lecture seule)
docs/img/               images du livre (verite ultime)
```

## Methode d'extraction (rappel)

1. Extraire toute l'information mecanique visible : options, prerequis, tableaux, progressions.
2. Simplifier la prose sans supprimer de donnee de jeu.
3. Comparer chaque tableau critique a l'image source avant de le marquer termine.
4. Ne rien inventer : ce qui manque devient un stub `data-status="manquant"`.

## Consolidation 2026-07-09 (fin de parsing)

- **Images reunies** : `docs/img/img Batch 1` (59, chap. 2/3/4/5/6), `img Batch 2` (49, sorts A-E),
  `img Batch 3` (224, livre complet). Le dossier parasite `1260608232710-img` a ete supprime.
- **Nommage sous-classes harmonise** : `occultiste-protecteur-*` -> `protecteur-*` (comme les autres).
- Etat : 0 `data-status="manquant"`, 0 stub reel, 0 lien mort, spellcheck 0 erreur, 0 accent.
- Maillage type Wikipedia pose (`docs/_engine/autolink.mjs`, ~3740 liens).

## Batch 4 (2026-07-09) — Introduction + Chapitre 1 + Chapitre 2

39 images uniques (1 doublon). Comble le dernier gros manque :
- **Chapitre 1 « Comment jouer »** -> `regles/comment-jouer.html`, `tests-et-defis.html`,
  `combat.html`, `exploration.html`, `interaction-sociale.html`.
- **Chapitre 2 « Creation »** -> `regles/creation-personnage.html` (recree complet : etapes,
  progression 1-20, montee en niveau, echelons), `multiclassage.html`, `langues.html`, `babioles.html`.
- Sourcing PHB **complet** : chapitres 1-7 + annexes A/B/C.

## Manques connus (contenu PHB 5.5)

- **Chapitre 2, Etape 1 « Choisir une classe » (p.32-35)** : pages non photographiees dans
  Batch 4 -> renvoi vers `classes/index.html` + note dans `creation-personnage.html`. Seul trou reel.
- **Objets magiques** : hors PHB (DMG) — non attendu ici.

## Manques mineurs / a fiabiliser

- **`data-source` imprecis** sur pages a cheval sur 2 images : sorts « detection » ;
  `creatures/{squelette,zombi,tigre,tetard-slaad}` pointent par erreur vers une image de glossaire ;
  `especes/{elfe,tieffelin}` gardent l'ancienne numerotation (img:27-31) au lieu de batch3.
  Contenu correct, seul le pointeur d'image est flou (re-verifiable maintenant que Batch 1 est present).
- **`amelioration-de-caracteristique`** : meme `data-id` en don ET en sort (ambigu pour le maillage).
- **`sorts/insecte-geant`** : `data-save="con"` derive du profil de la creature invoquee (a passer `-` ?).
- Index de section non uniformement generes (historiques/dons/equipement/personnages ecrits main).
- `personnages/lohita.html` : fiche perso tierce, contient des `manquant` (hors moteur de fiche).
