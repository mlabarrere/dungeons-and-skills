// Page 1 de la fiche officielle D&D 2024 — réplique fidèle, formulaire vierge.
// Aucune chaîne en dur : tout vient de `t` (labels de la locale courante).

import s from "./sheet.module.css";
import type { AbilityBlock, SheetLabels } from "./labels";
import { Dot, Diamonds, SkillRow, LabeledLine, Corners } from "./fields";
import { ShieldOutline, Sparkle } from "./icons";

function AbilityCard({ block, t }: { block: AbilityBlock; t: SheetLabels }) {
  return (
    <section className={`${s.card} ${s.ability}`}>
      <div className={s.cardInner}>
        <div className={s.cardTitle}>{block.name}</div>
        <div className={s.abilityTop}>
          <div className={s.circle}>
            <input aria-label={`${block.name} — ${t.modifier}`} />
          </div>
        </div>
        <div className={s.abilityLabels}>
          <span className={s.label}>{t.modifier}</span>
          <span className={s.label}>{t.score}</span>
        </div>
        <SkillRow name={t.savingThrow} saving />
        {block.skills.map((sk) => (
          <SkillRow key={sk} name={sk} />
        ))}
      </div>
      {/* case Valeur en encoche sur le bord droit (comme la fiche officielle) */}
      <div className={s.scoreBox}>
        <input aria-label={`${block.name} — ${t.score}`} />
      </div>
    </section>
  );
}

export default function SheetPage1({ t }: { t: SheetLabels }) {
  return (
    <div className={s.page}>
      <Corners />
      {/* ---------- En-tête ---------- */}
      <div className={s.headerRow}>
        <section className={`${s.card} ${s.identity}`}>
          <div className={s.cardInner}>
            <div className={s.idLine}>
              <LabeledLine label={t.characterName} />
            </div>
            <div className={s.idGrid}>
              <LabeledLine label={t.background} />
              <LabeledLine label={t.class} />
              <LabeledLine label={t.species} />
              <LabeledLine label={t.subclass} />
            </div>
          </div>
        </section>

        <section className={`${s.card} ${s.oval}`}>
          <div className={s.ovalCell}>
            <input aria-label={t.level} />
            <span className={s.label}>{t.level}</span>
          </div>
          <div className={s.ovalCell}>
            <input aria-label={t.xp} />
            <span className={s.label}>{t.xp}</span>
          </div>
        </section>

        <section className={`${s.card} ${s.shield}`}>
          <ShieldOutline />
          <div className={s.cardTitle}>{t.armorClass}</div>
          <input className={s.acValue} aria-label={t.armorClass} />
          <div className={s.shieldBox}>
            <Dot label={t.shield} />
            <span className={s.label}>{t.shield}</span>
          </div>
        </section>

        <section className={`${s.card} ${s.statTriple}`}>
          {/* Points de vie */}
          <div>
            <div className={s.cardTitle}>{t.hitPoints}</div>
            <div className={s.hpGrid}>
              <div className={`${s.stackField} ${s.hpBig}`}>
                <input className={s.bigNum} aria-label={t.current} />
                <span className={s.label}>{t.current}</span>
              </div>
              <label className={s.stackField}>
                <input className={s.line} aria-label={t.temp} />
                <span className={s.label}>{t.temp}</span>
              </label>
              <label className={s.stackField}>
                <input className={s.line} aria-label={t.max} />
                <span className={s.label}>{t.max}</span>
              </label>
            </div>
          </div>
          {/* Dés de vie */}
          <div>
            <div className={s.cardTitle}>{t.hitDice}</div>
            <label className={s.stackField} style={{ marginTop: 8 }}>
              <input className={s.line} aria-label={t.spent} />
              <span className={s.label}>{t.spent}</span>
            </label>
            <label className={s.stackField} style={{ marginTop: 6 }}>
              <input className={s.line} aria-label={t.max} />
              <span className={s.label}>{t.max}</span>
            </label>
          </div>
          {/* JS de mort */}
          <div>
            <div className={s.cardTitle}>{t.deathSaves}</div>
            <div className={s.deathRow} style={{ marginTop: 6 }}>
              <Diamonds count={3} label={t.successes} />
              <span className={s.label}>{t.successes}</span>
            </div>
            <div className={s.deathRow} style={{ marginTop: 8 }}>
              <Diamonds count={3} label={t.failures} />
              <span className={s.label}>{t.failures}</span>
            </div>
          </div>
        </section>
      </div>

      {/* ---------- Marque ---------- */}
      <div className={s.wordmark}>
        <hr />
        <span className={s.wordmarkText}>
          DUNGEONS <span className={s.amp}>&amp;</span> DRAGONS
        </span>
        <hr />
      </div>

      {/* ---------- Corps ---------- */}
      <div className={s.body}>
        <div className={s.leftBlock}>
          <div className={s.abilityCols}>
            <div className={s.col}>
              <section className={`${s.card} ${s.miniStat}`}>
                <div className={s.cardTitle}>{t.proficiencyBonus}</div>
                <input aria-label={t.proficiencyBonus} />
              </section>
              {t.abilitiesLeft.map((b) => (
                <AbilityCard key={b.key} block={b} t={t} />
              ))}
              <section className={`${s.card} ${s.heroic}`}>
                <div className={s.cardInner}>
                  <div className={s.cardTitle}>{t.heroicInspiration}</div>
                  <div className={s.heroicStar}>
                    <Sparkle size={30} />
                  </div>
                </div>
              </section>
            </div>
            <div className={s.col}>
              {t.abilitiesRight.map((b) => (
                <AbilityCard key={b.key} block={b} t={t} />
              ))}
            </div>
          </div>

          {/* Formations & maîtrises */}
          <section className={`${s.card} ${s.equip}`}>
            <div className={s.cardInner}>
              <div className={s.sectionTitle}>{t.equipmentTraining}</div>
              <div className={s.armorTrain}>
                <span className={s.label}>{t.armorTraining}</span>
                {[t.armorLight, t.armorMedium, t.armorHeavy, t.armorShields].map((a) => (
                  <span key={a} className={s.armorOpt}>
                    <input type="checkbox" className={s.diamond} aria-label={a} />
                    {a}
                  </span>
                ))}
              </div>
              <div className={s.equipField}>
                <div className={s.label}>{t.weapons}</div>
                <div className={`${s.equipBox} ${s.grid}`} />
              </div>
              <label className={s.equipLine}>
                <span className={s.label}>{t.tools}</span>
                <input aria-label={t.tools} />
              </label>
            </div>
          </section>
        </div>

        {/* Colonne droite */}
        <div className={s.rightBlock}>
          <div className={s.infoBar}>
            {[t.initiative, t.speed, t.size, t.passivePerception].map((n) => (
              <section key={n} className={`${s.card} ${s.infoBox}`}>
                <div className={s.cardInner}>
                  <div className={s.cardTitle}>{n}</div>
                  <input aria-label={n} />
                </div>
              </section>
            ))}
          </div>

          {/* Armes */}
          <section className={`${s.card} ${s.weapons}`}>
            <div className={s.cardInner}>
              <div className={s.sectionTitle}>{t.weaponsTitle}</div>
              <table className={s.wTable}>
                <colgroup>
                  <col className={s.cName} />
                  <col className={s.cAtk} />
                  <col className={s.cDmg} />
                  <col className={s.cNotes} />
                </colgroup>
                <thead>
                  <tr>
                    <th>{t.weaponName}</th>
                    <th>{t.atkBonusDc}</th>
                    <th>{t.damageType}</th>
                    <th>{t.notes}</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }, (_, i) => (
                    <tr key={i}>
                      <td><input aria-label={`${t.weaponName} ${i + 1}`} /></td>
                      <td><input aria-label={`${t.atkBonusDc} ${i + 1}`} /></td>
                      <td><input aria-label={`${t.damageType} ${i + 1}`} /></td>
                      <td><input aria-label={`${t.notes} ${i + 1}`} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Aptitudes de classe (deux colonnes) */}
          <section className={`${s.card} ${s.textArea}`} style={{ minHeight: 300 }}>
            <div className={s.cardInner}>
              <div className={s.sectionTitle}>{t.classFeatures}</div>
              <div className={`${s.textAreaBody} ${s.twoColFeatures} ${s.grid}`}>
                <span className={s.divider} />
                <textarea className={s.write} aria-label={`${t.classFeatures} 1`} />
                <textarea className={s.write} aria-label={`${t.classFeatures} 2`} />
              </div>
            </div>
          </section>

          {/* Traits d'espèce + Dons */}
          <div className={s.featRow} style={{ minHeight: 220 }}>
            <section className={`${s.card} ${s.textArea}`}>
              <div className={s.cardInner}>
                <div className={s.sectionTitle}>{t.speciesTraits}</div>
                <div className={`${s.textAreaBody} ${s.grid}`}>
                  <textarea className={s.write} aria-label={t.speciesTraits} />
                </div>
              </div>
            </section>
            <section className={`${s.card} ${s.textArea}`}>
              <div className={s.cardInner}>
                <div className={s.sectionTitle}>{t.feats}</div>
                <div className={`${s.textAreaBody} ${s.grid}`}>
                  <textarea className={s.write} aria-label={t.feats} />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
