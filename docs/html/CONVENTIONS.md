# Conventions du Dungeons & Skills HTML

Ce dossier `docs/html/` est la **source de verite** du Dungeons & Skills D&D. Chaque
entite de jeu (classe, espece, historique, don, objet, sort, personnage) est
**une page HTML**. Les anciens Markdown sont archives dans `docs/_source-md/`
comme provenance d'extraction ; les images `docs/img/` restent la verite ultime.

## Regle d'or

- **Zero CSS inline de style.** Toute page charge `assets/ds.css`. Les
  couleurs, tables, badges, callouts viennent de la feuille partagee. Voir le
  rendu de chaque composant dans [styleguide.html](styleguide.html).
- **Une entite = une page.** Nom de fichier = identifiant en kebab-case, sans
  accents (`initie-a-la-magie.html`, `elfe.html`, `baton-de-combat.html`).
- **Ne jamais inventer.** Ce qui n'est pas dans les images/sources = page *stub*
  avec `data-status="manquant"` et un bloc `.stub` « manquant documentaire ».

## Squelette de page canonique

Copier ce squelette pour toute nouvelle page. `data-root` = chemin relatif vers
`docs/html/` (`..` depuis `classes/`, `.` depuis la racine). `data-breadcrumb`
= paires `Libelle|/chemin-absolu-depuis-root` separees par `;`, dernier segment
sans href pour la page courante.

```html
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Druide — Classe</title>
  <link rel="stylesheet" href="../assets/ds.css">
</head>
<body data-root=".." data-breadcrumb="Accueil|/index.html; Classes|/classes/index.html; Druide">
  <main>
    <article class="sheet"
             data-entity="classe" data-id="druide" data-status="source" data-source="img:79">
      <h1>Druide</h1>
      <!-- sections ... -->
    </article>
  </main>
  <script src="../assets/ds.js" defer></script>
</body>
</html>
```

Le fil d'Ariane et le footer sont **injectes par `ds.js`** : ne pas les
ecrire a la main.

## Attributs machine (data-*)

Le HTML doit rester requetable par le futur generateur. Attributs normalises :

| Attribut | Sur | Valeur |
|---|---|---|
| `data-entity` | `.sheet` / bloc racine | `classe`, `espece`, `lignage`, `historique`, `don`, `objet`, `sort`, `personnage`, `regle` |
| `data-id` | idem | identifiant kebab-case (= nom de fichier sans `.html`) |
| `data-source` | idem / section | provenance image, ex. `img:79` |
| `data-status` | `.badge`, ligne de table, section | voir statuts ci-dessous |
| `data-prov` | element de fiche | chaine de provenance courte, ex. `druidique<-druide-1` |
| `data-ref` | `<a>` inter-entites | `data-id` de la cible (aide au graphe) |

## Statuts (vocabulaire conserve du protocole)

Valeurs autorisees de `data-status`, rendues par `.badge[data-status=...]` :

`fourni` · `source` · `calcule` · `deduit` · `recommande` · `arbitrer` ·
`manquant` · `incoherent` · `conflit`

Exemple : `<span class="badge" data-status="conflit">Conflit</span>`.
Les fiches historiques utilisent encore `.status.source/.warn/.bad` (compat) ;
les nouvelles pages utilisent `.badge[data-status]`.

## Composants disponibles (classes CSS)

Tous demontres dans [styleguide.html](styleguide.html) :

- `.sheet` conteneur page · `.section` bloc · `.grid-2` / `.grid-3` colonnes
- `.header` / `.identity` / `.meta-grid` / `.field` en-tete de fiche
- `.score-grid` / `.score` caracteristiques
- `.pill-row` / `.pill` listes compactes (maitrises, langues, equipement)
- `.callout` (+ `.ok` `.error` `.info`) encarts
- `.summary` + `.card` (`.ok` `.warn` `.bad`) cartes de synthese
- `.badge[data-status]` statuts · `.provenance` texte de provenance
- `.tabs` + `.tabpanel` onglets (progression par niveau, etc.)
- `.stub` encart manquant documentaire
- `.entity-table` tableau d'index (fichiers `index.html` de section)

## Liens de provenance (remplacent l'ASCII)

- Une fiche de personnage **lie** ses sources : `<a href="../classes/druide.html" data-ref="druide">`.
- Une page de source **liste** ses consequences (section « Ce que ca apporte »).
- La vue d'ensemble du graphe vit dans
  [regles/modele-graphe-provenance.html](regles/modele-graphe-provenance.html)
  en **SVG** (jamais en art ASCII).

## Verification avant de considerer une page « terminee »

1. Charge sans erreur console, fil d'Ariane + footer injectes.
2. Aucun style inline hormis micro-ajustements ponctuels.
3. Pour tout tableau critique : compare a l'image source citee dans `data-source`.
4. Statuts corrects : rien de « Source » qui soit en realite deduit/recommande.
5. Met a jour `docs/_analysis/couverture.md`.

## Schema des sorts (`sorts/<id>.html`)

Modele de reference a copier : [`sorts/_TEMPLATE.html`](sorts/_TEMPLATE.html) (exemple
complet et correct). Une entite = un sort = une page. `<id>` = nom en kebab-case sans
accents (`chatiment-de-tonnerre.html`).

### data-* obligatoires (sur `<article class="sheet">`)

| Attribut | Valeurs autorisees |
|---|---|
| `data-entity` | `sort` |
| `data-id` | kebab-case, = nom de fichier sans `.html` |
| `data-status` | `source` (ou `manquant` si champ illisible) |
| `data-source` | `img:79` (numero d'image unique du manifeste) |
| `data-spell-level` | `0`..`9` (0 = sort mineur / cantrip) |
| `data-school` | `abjuration` `invocation` `divination` `enchantement` `evocation` `illusion` `necromancie` `transmutation` |
| `data-casting-time` | `action` `action-bonus` `reaction` `1min` `10min` `1h` `8h` `24h` |
| `data-ritual` | `true` `false` |
| `data-concentration` | `true` `false` |
| `data-range` | `perso` `contact` ou distance en metres (`9m`, `18m`, `36m`…) ou `illimitee` |
| `data-components` | sous-ensemble de `V,S,M` (ex. `V,S` ; `V,S,M`) |
| `data-material` | texte du composant materiel (si M), sinon absent |
| `data-duration` | `instantanee` `1round` `1min` `10min` `1h` `conc-1min` `conc-10min` `conc-1h` `conc-8h` … |
| `data-classes` | liste separee par virgules : `paladin,magicien,…` |
| `data-save` | `for` `dex` `con` `int` `sag` `cha` `-` (optionnel) |
| `data-damage-type` | `feu` `froid` `foudre` `tonnerre` `acide` `poison` `psychique` `radiant` `necrotique` `force` `contondant` `perforant` `tranchant` `-` (optionnel) |

`conc-*` dans `data-duration` implique `data-concentration="true"`. `rituel` n'est PAS un
temps d'incantation : c'est `data-ritual="true"` (+ mention dans le texte).

### Structure visuelle imposee

1. `<h1>` nom + `<p class="provenance">` ligne « Ecole du Xe niveau (Classes) ».
2. `.spell-tags` : badges Niveau + Ecole, + `Concentration`/`Rituel` si applicable, + `.pill` par classe.
3. `.section` « Incantation » : `.meta-grid` de 4 `.field` (Temps d'incantation, Portee, Composantes, Duree).
4. `.section` « Description » : texte fidele.
5. Si montee en puissance : `.section` « Aux niveaux superieurs » + `<table>`.
6. Si effet a jet de sauvegarde : `<table class="save-outcome">` a 2 lignes (Echec / Reussite).
7. Tables aleatoires (dX) et variantes : `<table>` / `<ul>`.

Regle d'or maintenue : **ne rien inventer**. Un champ non lisible sur l'image devient
`manquant` (badge + note), jamais une valeur devinee.

### Index

Ne PAS editer `sorts/index.html` a la main : il est regenere depuis les pages par
`docs/_analysis/build-sorts-index.mjs`. Les filtres interactifs (`assets/sorts.js`) lisent
les `data-*` des lignes, qui refletent ceux des pages.

## Fiches personnage = GENEREES (modele domaine)

Les fiches `personnages/*.html` ne sont **plus ecrites a la main** : ce sont des
**projections calculees** d'un modele domaine.

- Source de verite d'un perso : `docs/characters/<id>.character.json` (objets source +
  effets typas + choix + equipement + sorts). Contrat des effets : `docs/_engine/effects.md`.
- Generer : `node docs/_engine/build-character.mjs <id>` -> ecrit `personnages/<id>.html`
  (banniere « fiche generee — editer le JSON, pas ce fichier »).
- Verifier : `node docs/_engine/sheet-lint.mjs` -> 0 erreur (compteurs, provenance, doublons,
  objets decomposes, statuts, `requires`). Code de sortie non nul si erreur.

Regle : pour corriger une fiche, on edite le JSON puis on **regenere** ; on ne touche jamais
le HTML genere. Le moteur agrege les effets, calcule PV/CA/JS/competences/DD, tient les
compteurs (cantrips / prepares par liste), detecte conflits et choix manquants, et conserve
la provenance de chaque valeur. Un choix `recommande` reste `recommande` tant qu'il n'est pas
passe `fourni`.
