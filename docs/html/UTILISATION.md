# Utiliser la base documentaire du Grimoire D&D

Prompt de reference a donner en tete de session a Claude Code (ou tout agent) pour
qu'il utilise correctement cette base. Copie tout le bloc ci-dessous.

---

Tu travailles avec une base documentaire D&D 2024 (5.5) en **HTML**, situee dans
`docs/html/`. Lis ces regles avant toute action, puis applique-les strictement.

## 1. Source de verite
- **Le HTML de `docs/html/` fait foi.** C'est la source de verite du projet.
- Les Markdown de `docs/_source-md/` sont une **archive d'extraction** (historique),
  pas la reference.
- Les **images du livre** (`docs/img/`, cartographiees par
  `docs/_analysis/couverture.md` et `image_manifest.csv`) sont la verite ultime :
  en cas de doute, elles tranchent.

## 2. Regle d'or : NE JAMAIS INVENTER
- N'ecris une valeur de regle que si elle est **dans les sources** (HTML, ou image
  citee). Sinon, marque-la `data-status="manquant"` et mets un bloc `.stub`
  « manquant documentaire ». Jamais de regle sortie de tes connaissances externes.
- Une **recommandation** n'est pas un fait tant que le joueur ne l'a pas validee.
- Un **conflit/doublon** ne se corrige jamais en silence : il se signale.

## 3. Ou trouver quoi (arborescence)
- `index.html` — hub de navigation. `styleguide.html` — tous les composants visuels.
- `CONVENTIONS.md` — **a lire avant d'ecrire une page** (squelette, `data-*`, statuts).
- `regles/` — `creation-personnage.html` (etapes, formules, progression),
  `protocole.html` (methode d'audit + questionnaire), `modele-graphe-provenance.html`
  (graphe SVG), `generateur-online.html` (cadrage produit).
- `classes/`, `especes/`, `historiques/`, `dons/`, `equipement/`, `sorts/` — une entite
  = une page ; chaque dossier a un `index.html`. Les entites non extraites sont des stubs.
- `personnages/` — fiches de la table.
- `assets/grimoire.css` + `grimoire.js` — design system partage (ne jamais dupliquer
  de CSS ; toute page les reference).

## 4. Statuts (toujours qualifier une donnee)
`fourni` · `source` · `calcule` · `deduit` · `recommande` · `arbitrer` ·
`manquant` · `incoherent` · `conflit`.
Rendu : `<span class="badge" data-status="...">Libelle</span>`.

## 5. Provenance (audit bidirectionnel)
Toute valeur d'une fiche doit etre justifiable :
- **depuis la fiche** : « pourquoi cette case ? » -> chaine source->effet->case ;
- **depuis une source** : « qu'apporte Druide / Elfe / tel don ? » -> ses consequences.
Relie les entites par des liens : `<a href="../classes/druide.html" data-ref="druide">`.

## 6. Creer ou auditer un personnage
1. Ne demande QUE les choix non deductibles des sources (identite, niveau, classe,
   historique, espece/lignage, caracteristiques, choix deja tranches).
2. Applique le protocole (`regles/protocole.html`) : reporte les faits, charge les
   sources, calcule les valeurs derivees (PV, CA, JS, competences, DD/attaque de sort…),
   liste choix automatiques, choix restants, conflits, incoherences, manques.
3. Produis une **fiche HTML** dans `personnages/` en suivant le squelette de
   `CONVENTIONS.md` : `<link>` vers `../assets/grimoire.css`, `<script>` `grimoire.js`,
   `data-root`/`data-breadcrumb`/`data-entity="personnage"`. Reutilise les composants
   (`.summary`, `.section`, tables de provenance, `.badge[data-status]`). Zero CSS inline.
4. Separe toujours **faits** (source/calcule) des **recommandations**, et rends chaque
   trou visible (`manquant`) plutot que de le combler.

## 7. Ecrire/etendre une page de la base
- Copie le squelette canonique de `CONVENTIONS.md`, encode les faits machine dans les
  `data-*` (`data-entity`, `data-id`, `data-source="img:X-Y"`, `data-status`).
- Compare chaque tableau critique a l'image source citee avant de le considerer termine.
- Style maison : **sans accents** dans le contenu de la base (ex. « Caracteristiques »).
- Mets a jour `docs/_analysis/couverture.md` quand tu extrais une nouvelle section.
- Verifie dans le navigateur : 0 erreur console, fil d'Ariane + footer injectes, liens
  non morts (voir le script d'audit de liens du projet).

---

## 8. Assistant de creation (builder.html) — couche machine deterministe

`builder.html` est un site statique **sans IA** : il charge le catalogue (`docs/data/`) et
importe le moteur (`docs/_engine/resolver.mjs` + `build-character.mjs`) pour presenter un
formulaire a champs contraints (options filtrees par les regles) et calculer la fiche en direct.

**Lancer** — le builder doit atteindre `docs/_engine/` ET `docs/data/` (au-dessus de
`docs/html/`) : servir la racine sur **`docs/`**, pas `docs/html/`.
```
node docs/_engine/serve.mjs 8000        # micro-serveur statique zero-dependance (MIME .mjs/.json)
```
Ouvrir : **http://localhost:8000/html/builder.html**  (alternative : `npx serve docs`).

**Verifier (tout doit donner 0)**
```
node docs/_engine/catalog-lint.mjs      # integrite catalogue : refs HTML, ids, DAG, couverture des kinds
node docs/_engine/golden-test.mjs       # Medicis + Malbec reconstruits par le graphe = meme fiche calculee
node docs/_engine/sheet-lint.mjs        # fiches de reference valides
node docs/_analysis/spellcheck.mjs      # pages de sorts (inchange)
```

**Regenerer une fiche HTML depuis son JSON**
```
node docs/_engine/build-character.mjs medicis malbec
```
