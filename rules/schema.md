# Character schema, effect vocabulary and formulas

This is the contract the deterministic engine enforces. Read it before assembling or
checking a character. It exists so the no-code fallback (a host that cannot run
`engine/cli.mjs`) applies the **same** rules and the **same** math as the engine. Catalog
over memory, always ([grounding](grounding.md)).

## The `.character.json` model

```
{
  id,
  identity { name, level, alignment?, species?, lineage?, className?, background? },
  abilityScores { for, dex, con, int, sag, cha, note? },
  sources[ { id, kind, label, ref?, source?, effects[] } ],
  choices[ { id, satisfies, value, label, status, effects? } ],
  equipment[ { object, from?, roles[], armor?{base,dexMax?}, shield?,
               weapon?{damage,type,ability,versatile?} } ],
  spells { cantrips[ {id,label,list,origin,status,sourceId} ],
           prepared[ {id,label,list,origin,status,sourceId} ] }
}
```

- `kind` (a source): `class-level | subclass | species | lineage | background | feat | order | item`.
- `status` (a choice or entry): `fourni | source | calcule | deduit | recommande | arbitrer | manquant | conflit`.
  - `fourni` = provided by the player; `source` = granted automatically by a rules entry;
    `calcule`/`deduit` = derived by the engine; `recommande` = book suggestion, **never**
    counted as a fact; `arbitrer`/`manquant`/`conflit` = needs a ruling / missing / clash.
- `origin` (a spell): `granted` (auto) | `chosen` (player pick) | `alwaysPrepared`.

## Effect vocabulary

`grants` (a `what` + payload):
`hitDie{die}` · `savingThrowProficiency{value}` · `skillProficiency{value,expertise?}` ·
`toolProficiency{value}` · `armorTraining{value}` · `shieldTraining` ·
`weaponProficiency{value}` · `language{value}` · `speed{value}` · `sense{value,range}` ·
`resistance{value}` · `spellcasting{ability,list}` · `cantripSlots{count,list}`
(count may be a delta) · `preparedSlots{count,list,minLevel}` · `spellSlots{level,count}` ·
`cantrip{spell,list}` · `alwaysPreparedSpell{spell,list}` · `futureSpell{level,spell}` ·
`feat{id}` · `oncePerLongRestCasting{spell}` ·
`feature{name,level?}` (narrative trait: **displayed, never computed**) ·
`bonusHitPointsPerLevel{value}`.

`effect`: `bonusToChecks{domain}` (armor and weapons flow through `equipment`).

`requiresChoice{kind,count,from?}`: a gap filled by a `choices[]` entry whose
`satisfies == kind`. `requires{precondition}`: the engine checks a matching `grants` exists
(e.g. `shieldTraining`), else it flags a problem.

## Formulas (the only math)

- `mod = floor((score - 10) / 2)`. Proficiency bonus (PB): lvl 1–4 `+2`, 5–8 `+3`, 9–12 `+4`, 13–16 `+5`, 17–20 `+6`.
- **HP** (lvl 1) = `max(hitDie) + mod(con) + bonusHitPointsPerLevel * level`.
- **AC**: no armor `10 + mod(dex)`; armor `base + min(mod(dex), dexMax?)`; `+2` if a shield is equipped (requires `shieldTraining`).
- **Initiative** = `mod(dex)`. **Passive Perception** = `10 + Perception total`.
- **Saving throw** = `mod + (PB if proficient)`. **Skill** = `mod + (PB if proficient) + (PB if expertise)`.
- **Spellcasting**: save DC `8 + PB + mod(ability)`; spell attack `PB + mod(ability)`.
- **Counters per list**: allowed cantrips = `Σ cantripSlots.count`; used = number of cantrips on that list. Same for `preparedSlots`. Spells on the `espece` (species) list are **outside** the class quota.

## What sheet-lint rejects (each is a hard error)

Counter exceeded · a granted `cantrip`/`alwaysPreparedSpell` missing from the sheet · a
duplicate (same id granted **and** chosen) not marked `conflit` · a provided `choices[]`
whose `effects` are not aggregated · a composite item without `roles` · a computed value
with no provenance · a status outside the enum · a recommendation counted as a fact · an
unmet `requires`.

## Answers → model (the guided-build input)

`engine/cli.mjs` also accepts an **answers** object (the guided-build format) and turns it
into the model above via `resolver.toCharacterModel`. Keys are the graph/choice ids:
`classe`, `sous-classe`, `espece`, `lignage`, `historique`, `methode`, `abilityScores`,
`nom`, `alignement`, `_id`, plus one key per choice id the resolver reports as pending
(e.g. `guerrier-competences`, `guerrier-style-de-combat`, `guerrier-equipement`,
`<background>-caracteristiques`, `origine-langues-choix`). Discover the exact pending ids
and their legal values with `node engine/cli.mjs options <answers.json>` — never guess them.
