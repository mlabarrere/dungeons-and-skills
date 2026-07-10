"use client";
// Coquille client : liste de persos (localStorage) + formulaire + fiche live.
import { useEffect, useState } from "react";
import type { Catalog, Answers } from "@engine/resolver.d.mts";
import type { Messages } from "@/i18n/getDictionary";
import { RulesBuilder } from "@/components/builder/RulesBuilder";
import { LiveSheet } from "@/components/sheet/LiveSheet";
import { loadAll, upsert, remove, blankCharacter, type StoredCharacter } from "@/lib/store";

export function BuilderApp({ catalog, t }: { catalog: Catalog; t: Messages; locale: string }) {
  const [chars, setChars] = useState<StoredCharacter[]>([]);
  const [currentId, setCurrentId] = useState<string>("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const all = loadAll();
    setChars(all);
    setCurrentId(all[0]?._id ?? "");
    setReady(true);
  }, []);

  const current = chars.find((c) => c._id === currentId);

  const updateAnswers = (answers: Answers) => {
    if (!current) return;
    const nom = (answers.nom as string) || current.nom;
    const next: StoredCharacter = { ...current, nom, answers };
    setChars((cs) => upsert(cs, next));
  };

  const createNew = () => {
    const c = blankCharacter();
    setChars((cs) => upsert(cs, c));
    setCurrentId(c._id);
  };

  const del = (id: string, name: string) => {
    if (!window.confirm(t.nav.confirmDelete.replace("{name}", name))) return;
    setChars((cs) => {
      const next = remove(cs, id);
      if (id === currentId) setCurrentId(next[0]?._id ?? "");
      return next;
    });
  };

  if (!ready) return <p className="loading">{t.app.loading}</p>;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand"><strong>{t.nav.brand}</strong><span>{t.nav.tagline}</span></div>
        <div className="chars">
          <label>{t.nav.myCharacters}:{" "}
            <select value={currentId} onChange={(e) => setCurrentId(e.target.value)}>
              {chars.map((c) => <option key={c._id} value={c._id}>{c.nom}</option>)}
            </select>
          </label>
          <button onClick={createNew}>{t.nav.newCharacter}</button>
          {current && <button onClick={() => del(current._id, current.nom)}>{t.nav.delete}</button>}
        </div>
      </header>

      {current ? (
        <div className="cols">
          <section className="col-form">
            <RulesBuilder catalog={catalog} t={t} answers={current.answers} onChange={updateAnswers} />
          </section>
          <section className="col-sheet">
            <LiveSheet catalog={catalog} answers={current.answers} t={t} />
          </section>
        </div>
      ) : (
        <p className="loading">{t.nav.noCharacters} <button onClick={createNew}>{t.nav.createCharacter}</button></p>
      )}

      <style>{APP_CSS}</style>
    </div>
  );
}

const APP_CSS = `
.app { max-width:1400px; margin:0 auto; padding:16px; }
.app .loading { padding:40px; text-align:center; color:var(--muted,#7a6f5f); }
.app .topbar { display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid var(--line,#e5ddcf); }
.app .brand strong { font-size:18px; } .app .brand span { display:block; font-size:12px; color:var(--muted,#7a6f5f); }
.app .chars { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.app .chars select, .app .chars button { font:inherit; padding:5px 10px; border:1px solid var(--line,#d9cfc0); border-radius:6px; background:#fff; cursor:pointer; }
.app .cols { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:20px; align-items:start; }
@media (max-width:1100px){ .app .cols { grid-template-columns:1fr; } }
.app .col-sheet { position:sticky; top:12px; border:1px solid var(--line,#e5ddcf); border-radius:12px; padding:14px; background:var(--card,#fffdf7); }
`;
