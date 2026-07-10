// Primitives remplissables réutilisables — construites une fois, utilisées partout.
// Formulaire vierge : champs non contrôlés (pas d'état), avec aria-label pour l'accessibilité.

import s from "./sheet.module.css";

/** Rivets décoratifs aux 4 coins de la feuille. */
export function Corners() {
  return (
    <>
      <span className={`${s.rivet} ${s.rivetTL}`} aria-hidden="true" />
      <span className={`${s.rivet} ${s.rivetTR}`} aria-hidden="true" />
      <span className={`${s.rivet} ${s.rivetBL}`} aria-hidden="true" />
      <span className={`${s.rivet} ${s.rivetBR}`} aria-hidden="true" />
    </>
  );
}

/** Pastille de maîtrise (cercle cochable). */
export function Dot({ label }: { label?: string }) {
  return <input type="checkbox" className={s.dot} aria-label={label ?? "maîtrise"} />;
}

/** Case losange cochable (JS de mort, emplacements de sort, formations…). */
export function Diamond({ label }: { label?: string }) {
  return <input type="checkbox" className={s.diamond} aria-label={label ?? "case"} />;
}

/** Rangée de N losanges. */
export function Diamonds({ count, label }: { count: number; label?: string }) {
  return (
    <span className={s.diamonds}>
      {Array.from({ length: count }, (_, i) => (
        <Diamond key={i} label={label ? `${label} ${i + 1}` : undefined} />
      ))}
    </span>
  );
}

/** Ligne de compétence : pastille + petit champ (modificateur) + nom. */
export function SkillRow({ name, saving = false }: { name: string; saving?: boolean }) {
  return (
    <div className={`${s.skillRow} ${saving ? s.saving : ""}`}>
      <Dot label={name} />
      <input className={s.mini} aria-label={`${name} — valeur`} />
      <span className={s.skillName}>{name}</span>
    </div>
  );
}

/** Champ « ligne » avec libellé. `labelPos` place le libellé sous la ligne
 * (défaut, comme sur la fiche officielle) ou au-dessus. */
export function LabeledLine({
  label,
  labelPos = "below",
}: {
  label: string;
  labelPos?: "below" | "above";
}) {
  const lbl = <span className={s.label}>{label}</span>;
  const input = <input className={s.line} aria-label={label} />;
  return (
    <label className={s.stackField}>
      {labelPos === "above" ? (
        <>
          {lbl}
          {input}
        </>
      ) : (
        <>
          {input}
          {lbl}
        </>
      )}
    </label>
  );
}

/** N lignes vides de table (armes, sorts) — ligne réutilisable via children render. */
export function TableRows({
  count,
  render,
}: {
  count: number;
  render: (i: number) => React.ReactNode;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <tr key={i}>{render(i)}</tr>
      ))}
    </>
  );
}
