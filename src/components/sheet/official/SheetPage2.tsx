// Page 2 de la fiche officielle D&D 2024 — sorts & personnage. Formulaire vierge.

import s from "./sheet.module.css";
import type { SheetLabels } from "./labels";
import { Diamond, Corners } from "./fields";
import { Sparkle } from "./icons";

/** Nombre d'emplacements max par niveau de sort (réplique de la fiche). */
const SLOT_DIAMONDS = [4, 3, 3, 3, 3, 2, 2, 1, 1];
const SLOT_GROUPS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
];

export default function SheetPage2({ t }: { t: SheetLabels }) {
  return (
    <div className={s.page}>
      <Corners />
      <div style={{ display: "flex", gap: 8, flex: 1, alignItems: "flex-start" }}>
        {/* ===== Colonne gauche : incantation + sorts ===== */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          <div className={s.p2Top}>
            {/* Bloc caractéristique d'incantation */}
            <section className={`${s.card} ${s.castStats}`}>
              <div className={s.castHead}>
                <div className={s.label}>{t.spellcastingAbility}</div>
                <input className={s.line} aria-label={t.spellcastingAbility} />
              </div>
              {[t.spellcastingModifier, t.spellSaveDc, t.spellAttackBonus].map((lab) => (
                <div key={lab} className={s.castRow}>
                  <input aria-label={lab} />
                  <span className={s.label}>{lab}</span>
                </div>
              ))}
            </section>

            {/* Bandeau décoratif */}
            <div className={s.p2Banner}>
              <hr />
              <span className={s.dd}>D&amp;D</span>
              <hr />
            </div>
          </div>

          {/* Emplacements de sort — pleine largeur */}
          <section className={`${s.card} ${s.slots}`}>
            <div className={s.cardInner}>
              <div className={s.sectionTitle}>{t.spellSlots}</div>
              <div className={s.slotsGrid}>
                {SLOT_GROUPS.map((group, gi) => (
                  <div key={gi} className={s.slotCol}>
                    <div className={s.slotHead}>
                      <span className={s.hTotal}>{t.total}</span>
                      <span className={s.hExp}>{t.expended}</span>
                    </div>
                    {group.map((idx) => (
                      <div key={idx} className={s.slotRow}>
                        <span className={s.slotLabel}>{t.spellSlotLevels[idx]}</span>
                        <input
                          className={s.slotTotal}
                          aria-label={`${t.spellSlotLevels[idx]} — ${t.total}`}
                        />
                        <span className={s.slotDiamonds}>
                          {Array.from({ length: SLOT_DIAMONDS[idx] }, (_, d) => (
                            <Diamond
                              key={d}
                              label={`${t.spellSlotLevels[idx]} — ${t.expended} ${d + 1}`}
                            />
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Sorts mineurs & préparés */}
          <section className={`${s.card} ${s.spellsTable}`} style={{ flex: 1 }}>
            <div className={s.cardInner}>
              <div className={s.sectionTitle}>{t.preparedSpellsTitle}</div>
              <table className={s.spTable}>
                <colgroup>
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "29%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "18%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>{t.spellLevel}</th>
                    <th>{t.weaponName}</th>
                    <th>{t.castingTime}</th>
                    <th>{t.range}</th>
                    <th>{t.concentrationRitualMaterial}</th>
                    <th>{t.notes}</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 30 }, (_, i) => (
                    <tr key={i}>
                      <td><input aria-label={`${t.spellLevel} ${i + 1}`} /></td>
                      <td><input aria-label={`${t.weaponName} ${i + 1}`} /></td>
                      <td><input aria-label={`${t.castingTime} ${i + 1}`} /></td>
                      <td><input aria-label={`${t.range} ${i + 1}`} /></td>
                      <td>
                        <div className={s.crmCell}>
                          {([t.crm.c, t.crm.r, t.crm.m] as const).map((m, k) => (
                            <span key={k} className={s.crmMark}>
                              <Diamond label={`${m} ${i + 1}`} />
                              {m}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td><input aria-label={`${t.notes} ${i + 1}`} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* ===== Colonne droite : personnage ===== */}
        <div className={s.p2Right} style={{ width: 288, flex: "none" }}>
          <section className={`${s.card} ${s.growCard}`} style={{ minHeight: 150 }}>
            <div className={s.sectionTitle}>{t.appearance}</div>
            <div className={`${s.growBody} ${s.grid}`}>
              <textarea className={s.write} aria-label={t.appearance} />
            </div>
          </section>

          <section className={`${s.card} ${s.growCard}`} style={{ minHeight: 220 }}>
            <div className={s.sectionTitle}>{t.backstory}</div>
            <div className={`${s.growBody} ${s.grid}`}>
              <textarea className={s.write} aria-label={t.backstory} />
            </div>
            <label className={s.subLabelLine}>
              <span className={s.label}>{t.alignment}</span>
              <input aria-label={t.alignment} />
            </label>
          </section>

          <section className={`${s.card} ${s.growCard}`} style={{ minHeight: 90 }}>
            <div className={s.sectionTitle}>{t.languages}</div>
            <div className={`${s.growBody} ${s.grid}`}>
              <textarea className={s.write} aria-label={t.languages} />
            </div>
          </section>

          <section className={`${s.card} ${s.growCard}`} style={{ minHeight: 230 }}>
            <div className={s.sectionTitle}>{t.equipment}</div>
            <div className={`${s.growBody} ${s.grid}`}>
              <textarea className={s.write} aria-label={t.equipment} />
            </div>
            <div className={s.label} style={{ marginTop: 6 }}>{t.attunement}</div>
            {[0, 1, 2].map((i) => (
              <label key={i} className={s.attuneRow}>
                <Sparkle size={16} />
                <input aria-label={`${t.attunement} ${i + 1}`} />
              </label>
            ))}
          </section>

          <section className={`${s.card} ${s.coins}`}>
            <div className={s.cardInner}>
              <div className={s.sectionTitle}>{t.coins}</div>
              <div className={s.coinsGrid}>
                {t.coinLabels.map((c) => (
                  <div key={c} className={s.coin}>
                    <span className={s.label}>{c}</span>
                    <span className={s.coinBox}>
                      <input aria-label={c} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className={s.p2Footer}>{t.copyright}</div>
    </div>
  );
}
