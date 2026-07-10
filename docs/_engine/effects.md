# Moteur de fiche — contrat des effets typas

Le moteur (`build-character.mjs`) transforme un modele domaine
(`docs/characters/<id>.character.json`) en fiche HTML (`docs/html/personnages/<id>.html`),
en agregeant des **effets typas**. `sheet-lint.mjs` verifie le resultat.

Rien n'est invente : chaque effet est transcrit d'une page de regles HTML (classe, espece,
lignage, historique, don, ordre, equipement) et porte sa provenance (`ref`, `source`).

## Modele (JSON)

```
{
  id, identity{ name, level, alignment?, species?, lineage?, className?, background? },
  abilityScores{ for,dex,con,int,sag,cha, note? },
  sources[ { id, kind, label, ref?, source?, effects[] } ],
  choices[ { id, satisfies, label, value, status, effects? } ],
  equipment[ { object, from?, roles[], armor?{base,dexMax?}, shield?, weapon?{damage,type,ability,versatile?} } ],
  spells{ cantrips[ {id,label,list,origin,status,sourceId} ],
          prepared[ {id,label,list,origin,status,sourceId} ] }
}
```

- `kind` : `species|lineage|class-level|background|feat|order|item`.
- `status` (choix / entree) : `fourni|source|recommande|calcule|deduit|manquant|conflit`.
- `origin` (sort) : `granted` (accorde automatiquement) | `chosen` (choix joueur) |
  `alwaysPrepared`.

## Effets

`grants` (what + payload) :
`hitDie{die}` · `savingThrowProficiency{value}` · `skillProficiency{value,expertise?}` ·
`toolProficiency{value}` · `armorTraining{value}` · `shieldTraining` · `weaponProficiency{value}` ·
`language{value}` · `speed{value}` · `sense{value,range}` · `resistance{value}` ·
`spellcasting{ability,list}` · `cantripSlots{count,list}` (count peut etre un delta) ·
`preparedSlots{count,list,minLevel}` · `spellSlots{level,count}` ·
`cantrip{spell,list}` · `alwaysPreparedSpell{spell,list}` · `futureSpell{level,spell}` ·
`feat{id}` · `oncePerLongRestCasting{spell}` ·
`feature{name,level?}` (aptitude narrative : AFFICHEE, jamais calculee — n'entre dans aucune valeur derivee) ·
`bonusHitPointsPerLevel{value}` (PV bonus par niveau, ex. nain « +1 PV/niveau » : `PV += value * niveau`).

`effect` : `bonusToChecks{domain}` (l'armure et les armes passent par `equipment`).

`requiresChoice{kind,count,from?}` : trou a combler par un `choices[]` dont `satisfies==kind`.
`requires{precondition}` : le moteur verifie qu'un `grants` correspondant existe (ex.
`shieldTraining`) sinon `probleme`.

## Calculs

- `mod = floor((score-10)/2)` ; bonus de maitrise : niv 1-4 `+2`, 5-8 `+3`, 9-12 `+4`, 13-16 `+5`, 17-20 `+6`.
- PV niv 1 = `max(hitDie) + mod(con) + bonusHitPointsPerLevel * niveau`. CA : sans armure `10+mod(dex)` ; armure `base + min(mod(dex), dexMax?)` ; `+shield`.
- Initiative = `mod(dex)`. Perception passive = `10 + total(Perception)`.
- JS : `mod + (PB si maitrise)`. Competence : `mod + (PB si maitrise) + (PB si expertise)`.
- Incantation : DD `8 + PB + mod(ability)` ; attaque `PB + mod(ability)`.
- Compteurs par liste : `cantrips autorises = Σ cantripSlots.count` ; `utilises = #cantrips de la liste`.
  Idem `preparedSlots`. Les sorts de liste `espece` sont **hors quota de classe**.

## Controles (sheet-lint) — echouent si :

compteur depasse · cantrip/alwaysPrepared accorde absent de la fiche · doublon (meme id
accorde + choisi) non marque `conflit` · choix fourni dont les `effects` ne sont pas agreges ·
objet compose sans `roles` · valeur calculee sans provenance · statut hors enumeration ·
recommandation comptee comme fait · `requires` non satisfait.
