"use client";
// Fiche calculée en direct : moteur docs/_engine (computeCharacter). Rendu React,
// chrome via `messages`, valeurs = contenu FR. Provenance au clic (chaîne `prov`).
import { useMemo, useState } from "react";
import { toCharacterModel } from "@engine/resolver.mjs";
import { computeCharacter } from "@engine/build-character.mjs";
import type { Catalog, Answers, AbilityKey } from "@engine/resolver.d.mts";
import { toEngineAnswers } from "@/lib/engineAnswers";
import type { Messages } from "@/i18n/getDictionary";

const ABIL: AbilityKey[] = ["for", "dex", "con", "int", "sag", "cha"];
const ABIL_ABBR: Record<AbilityKey, string> = { for: "FOR", dex: "DEX", con: "CON", int: "INT", sag: "SAG", cha: "CHA" };
const sign = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

export function LiveSheet({ catalog, answers, t }: { catalog: Catalog; answers: Answers; t: Messages }) {
  const [why, setWhy] = useState<{ label: string; prov: string } | null>(null);

  const C = useMemo(
    () => computeCharacter(toCharacterModel(catalog, toEngineAnswers(answers))),
    [catalog, answers],
  );

  const nbErr = C.problems.filter((p) => p.level === "error").length;
  const overCounter = C.counters.some((c) => c.used > c.allowed);
  const fmt = (tpl: string, v: Record<string, string | number>) => tpl.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

  const derived = (name: string) => C.derived.find((d) => d.name === name);
  const showWhy = (label: string, prov?: string) => prov && setWhy({ label, prov });

  return (
    <div className="live-sheet">
      {/* Validation */}
      <div className={`panel ${nbErr ? "bad" : "ok"}`}>
        <strong>{t.validation.title} : {nbErr ? fmt(t.validation.errors, { n: nbErr }) : t.validation.ok}</strong>
        {nbErr > 0 && <ul>{C.problems.filter((p) => p.level === "error").map((p, i) => <li key={i}>{p.msg}</li>)}</ul>}
      </div>

      <header className="idt">
        <h3>{(answers.nom as string) || t.nav.untitled}</h3>
        <p className="muted">
          {C.model.identity.species}{C.model.identity.lineage ? ` (${C.model.identity.lineage})` : ""}
          {C.model.identity.className ? `, ${C.model.identity.className}` : ""} · {t.sheet.proficiencyBonus} {sign(C.PB)}
        </p>
      </header>

      {/* Caractéristiques */}
      <section className="sec"><h4>{t.sheet.abilities}</h4>
        <div className="scores">
          {ABIL.map((a) => (
            <div key={a} className="score"><span className="s-n">{ABIL_ABBR[a]}</span>
              <span className="s-m">{sign(C.mods[a])}</span><span className="s-r">{C.scores[a] ?? "?"}</span></div>
          ))}
        </div>
      </section>

      {/* Dérivées */}
      <section className="sec"><h4>{t.sheet.derived}</h4>
        <div className="derived">
          {C.derived.map((d) => (
            <button key={d.name} className="dcell" onClick={() => showWhy(d.name, d.prov)} title={t.sheet.whyValue}>
              <span className="d-l">{d.name}</span><span className="d-v">{String(d.value)}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Sauvegardes */}
      <section className="sec"><h4>{t.sheet.savingThrows}</h4>
        <div className="row">
          {C.saves.map((s) => (
            <span key={s.a} className="pill">{ABIL_ABBR[s.a]} {sign(s.total)}{s.prof ? " ●" : ""}</span>
          ))}
        </div>
      </section>

      {/* Compétences */}
      <section className="sec"><h4>{t.sheet.skills}</h4>
        <ul className="skills">
          {C.skills.filter((s) => s.prof).map((s) => (
            <li key={s.name}>{s.name} <b>{sign(s.total)}</b>{s.exp ? " ◆" : ""}</li>
          ))}
        </ul>
      </section>

      {/* Incantation */}
      {C.castingRows.length > 0 && (
        <section className="sec"><h4>{t.sheet.casting}</h4>
          <div className="row">
            {C.castingRows.map((r) => (
              <span key={r.list} className="pill">{r.list} · {t.sheet.spellDc} {r.dc} / {t.sheet.spellAtk} {sign(r.atk)}</span>
            ))}
          </div>
          <div className="counters">
            {C.counters.map((c, i) => (
              <span key={i} className={c.used > c.allowed ? "cnt over" : "cnt"}>{c.kind} ({c.list}) {c.used}/{c.allowed}</span>
            ))}
          </div>
        </section>
      )}

      {/* Sorts */}
      {C.cantrips.length > 0 && (
        <section className="sec"><h4>{t.sheet.cantrips}</h4>
          <ul className="spells">{C.cantrips.map((s, i) => <li key={i}>{s.label || s.id} <em>{s.list}</em></li>)}</ul></section>
      )}
      {C.prepared.length > 0 && (
        <section className="sec"><h4>{t.sheet.prepared}</h4>
          <ul className="spells">{C.prepared.map((s, i) => (
            <li key={i}>{s.label || s.id} <em>{s.origin === "alwaysPrepared" ? t.sheet.alwaysPrepared : s.list}</em></li>
          ))}</ul></section>
      )}

      {/* Aptitudes */}
      {C.features.length > 0 && (
        <section className="sec"><h4>{t.sheet.features}</h4>
          <ul className="spells">{C.features.map((f, i) => <li key={i}>{f.name}{f.level != null ? ` (niv. ${f.level})` : ""}</li>)}</ul></section>
      )}

      {/* Équipement + langues */}
      <section className="sec"><h4>{t.sheet.equipment}</h4>
        <ul className="spells">{(C.model.equipment as Array<{ object: string }>).map((it, i) => <li key={i}>{it.object}</li>)}</ul></section>
      <section className="sec"><h4>{t.sheet.languages}</h4>
        <div className="row">{C.languages.map((l, i) => <span key={i} className="pill">{l.v}</span>)}</div></section>

      {/* Choix restants / conflits */}
      {(C.missing.length > 0 || C.conflicts.length > 0 || overCounter) && (
        <div className="panel warn">
          <strong>{t.validation.remaining}</strong>
          <ul>
            {C.missing.map((m, i) => <li key={`m${i}`}>{m.kind} ×{m.count}</li>)}
            {C.conflicts.map((c, i) => <li key={`c${i}`}>{c.what} — {c.fix}</li>)}
          </ul>
        </div>
      )}

      {/* Provenance au clic */}
      {why && (
        <aside className="why" role="dialog">
          <div className="why-h"><strong>{t.sheet.whyValue}</strong>
            <button onClick={() => setWhy(null)} aria-label="×">×</button></div>
          <p className="why-l">{why.label}</p>
          <p className="why-p">{why.prov}</p>
        </aside>
      )}

      <style>{SHEET_CSS}</style>
    </div>
  );
}

const SHEET_CSS = `
.live-sheet { font-size:13px; }
.live-sheet .panel { border-left:4px solid; border-radius:8px; padding:8px 12px; margin-bottom:10px; }
.live-sheet .panel.ok { border-color:#3f7d4f; background:#eafbf0; }
.live-sheet .panel.bad { border-color:#b91c1c; background:#fdecec; }
.live-sheet .panel.warn { border-color:#b8860b; background:#fbf6e9; }
.live-sheet .panel ul { margin:4px 0 0; padding-left:18px; }
.live-sheet .idt h3 { margin:0; font-size:18px; }
.live-sheet .muted { color:var(--muted,#7a6f5f); font-size:12px; margin:2px 0 12px; }
.live-sheet .sec { margin-bottom:12px; }
.live-sheet .sec > h4 { font-size:11px; text-transform:uppercase; letter-spacing:.03em; color:var(--accent,#3f6b3f); margin:0 0 6px; border-bottom:1px solid var(--line,#e5ddcf); padding-bottom:3px; }
.live-sheet .scores { display:grid; grid-template-columns:repeat(6,1fr); gap:6px; }
.live-sheet .score { border:1px solid var(--line,#d9cfc0); border-radius:8px; text-align:center; padding:6px 0; background:#fff; }
.live-sheet .s-n { display:block; font-size:10px; color:var(--muted,#7a6f5f); }
.live-sheet .s-m { display:block; font-size:18px; font-weight:700; }
.live-sheet .s-r { display:block; font-size:11px; color:var(--muted,#7a6f5f); }
.live-sheet .derived { display:grid; grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); gap:6px; }
.live-sheet .dcell { text-align:left; border:1px solid var(--line,#d9cfc0); border-radius:8px; padding:5px 8px; background:#fff; cursor:pointer; }
.live-sheet .dcell:hover { border-color:var(--accent,#3f6b3f); }
.live-sheet .d-l { display:block; font-size:10px; text-transform:uppercase; color:var(--muted,#7a6f5f); }
.live-sheet .d-v { display:block; font-size:16px; font-weight:700; }
.live-sheet .row { display:flex; flex-wrap:wrap; gap:5px; }
.live-sheet .pill { border:1px solid var(--line,#d9cfc0); border-radius:999px; padding:2px 9px; background:#fff; }
.live-sheet .skills { list-style:none; padding:0; margin:0; columns:2; }
.live-sheet .skills li, .live-sheet .spells li { margin:2px 0; }
.live-sheet .spells { padding-left:16px; margin:0; }
.live-sheet .spells em { color:var(--muted,#7a6f5f); font-size:11px; }
.live-sheet .counters { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; }
.live-sheet .cnt { font-size:11px; color:var(--muted,#7a6f5f); }
.live-sheet .cnt.over { color:#b91c1c; font-weight:700; }
.live-sheet .why { position:sticky; bottom:0; margin-top:10px; border:1px solid var(--accent,#3f6b3f); border-radius:8px; padding:8px 12px; background:#fffef8; }
.live-sheet .why-h { display:flex; justify-content:space-between; }
.live-sheet .why-h button { border:0; background:none; font-size:16px; cursor:pointer; }
.live-sheet .why-l { font-weight:700; margin:4px 0 2px; }
.live-sheet .why-p { font-size:12px; color:var(--muted,#5c5344); margin:0; }
`;
