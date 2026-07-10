"use client";
// Formulaire de création data-driven : parcourt docs/data/build-graph.json et n'offre
// que des options valides (moteur docs/_engine/resolver.mjs). Composant contrôlé.
import { useMemo } from "react";
import {
  fixedNodeOptions, nodeApplies, pendingChoices, resolveCount, byId, KIND_BUCKET,
} from "@engine/resolver.mjs";
import type {
  Catalog, Answers, GraphNode, GraphStep, Option, PendingChoice, AbilityKey,
} from "@engine/resolver.d.mts";
import type { Messages } from "@/i18n/getDictionary";

const ABIL: AbilityKey[] = ["for", "dex", "con", "int", "sag", "cha"];
const ABIL_LABEL: Record<AbilityKey, string> = {
  for: "Force", dex: "Dextérité", con: "Constitution", int: "Intelligence", sag: "Sagesse", cha: "Charisme",
};

function fmt(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

interface Props {
  catalog: Catalog;
  t: Messages;
  answers: Answers;
  onChange: (next: Answers) => void;
}

export function RulesBuilder({ catalog, t, answers, onChange }: Props) {
  const graph = catalog.graph;

  const { buckets, autres } = useMemo(() => {
    const pend = pendingChoices(catalog, answers);
    const b: Record<string, PendingChoice[]> = {};
    const consumed = new Set<string>();
    for (const p of pend) {
      const bucket = KIND_BUCKET[p.kind];
      if (bucket) { (b[bucket] ||= []).push(p); consumed.add(p.id); }
    }
    return { buckets: b, autres: pend.filter((p) => !consumed.has(p.id)) };
  }, [catalog, answers]);

  const set = (key: string, value: unknown) => {
    const next = { ...answers };
    if (value === "" || value == null) delete next[key];
    else next[key] = value;
    onChange(next);
  };

  const arrOf = (id: string): string[] => {
    const v = answers[id];
    return Array.isArray(v) ? (v as string[]) : v != null ? [v as string] : [];
  };

  const toggleMulti = (id: string, optId: string, need: number) => {
    const cur = arrOf(id);
    const has = cur.includes(optId);
    let nextArr: string[];
    if (has) nextArr = cur.filter((x) => x !== optId);
    else if (cur.length >= need) return; // compteur bloquant
    else nextArr = [...cur, optId];
    set(id, nextArr.length ? nextArr : "");
  };

  function renderSingle(node: GraphNode) {
    const opts = fixedNodeOptions(catalog, answers, node);
    const cur = (answers[node.id] as string) || "";
    return (
      <Field key={node.id} label={node.label}>
        <select className="ctl" value={cur} onChange={(e) => set(node.id, e.target.value)}>
          <option value="">{t.builder.choose}</option>
          {opts.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        {opts.length === 0 && <p className="hint">{t.builder.noOptions}</p>}
      </Field>
    );
  }

  function renderAbilityScores(node: GraphNode) {
    const method = answers.methode as string | undefined;
    const m = graph.abilityMethods.find((x) => x.id === method);
    const cur = (answers.abilityScores || {}) as Partial<Record<AbilityKey, number>>;
    const setScore = (ab: AbilityKey, val: number | "") => {
      const nextScores = { ...cur } as Record<string, number>;
      if (val === "") delete nextScores[ab]; else nextScores[ab] = val;
      set("abilityScores", nextScores);
    };
    let body: React.ReactNode;
    if (!m) body = <p className="hint">{t.builder.chooseMethodFirst}</p>;
    else if (m.id === "standard") {
      const pool = m.values ?? [];
      body = (
        <div className="grid">
          {ABIL.map((ab) => {
            const used = ABIL.filter((x) => x !== ab).map((x) => cur[x]);
            return (
              <label key={ab} className="cell">
                <span className="cell-l">{ABIL_LABEL[ab]}</span>
                <select className="ctl" value={cur[ab] ?? ""} onChange={(e) => setScore(ab, e.target.value ? Number(e.target.value) : "")}>
                  <option value="">—</option>
                  {pool.map((v) => (
                    <option key={v} value={v} disabled={used.includes(v) && cur[ab] !== v}>{v}</option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>
      );
    } else if (m.id === "achat-points") {
      const cost = (v: number) => (m.costs?.[String(v)] ?? 99);
      const spent = ABIL.reduce((s, ab) => s + cost(cur[ab] ?? 8), 0);
      const over = spent > (m.budget ?? 27);
      body = (
        <>
          <div className="grid">
            {ABIL.map((ab) => (
              <label key={ab} className="cell">
                <span className="cell-l">{ABIL_LABEL[ab]}</span>
                <input className="ctl" type="number" min={m.min} max={m.max} value={cur[ab] ?? 8}
                  onChange={(e) => setScore(ab, Number(e.target.value))} />
              </label>
            ))}
          </div>
          <p className={over ? "hint over" : "hint"}>{fmt(t.builder.pointBuyCost, { spent, budget: m.budget ?? 27 })} {over ? t.builder.pointBuyOver : ""}</p>
        </>
      );
    } else {
      body = (
        <>
          <div className="grid">
            {ABIL.map((ab) => (
              <label key={ab} className="cell">
                <span className="cell-l">{ABIL_LABEL[ab]}</span>
                <input className="ctl" type="number" min={3} max={20} value={cur[ab] ?? ""}
                  onChange={(e) => setScore(ab, e.target.value ? Number(e.target.value) : "")} />
              </label>
            ))}
          </div>
          <p className="hint">{t.builder.diceHelp}</p>
        </>
      );
    }
    return <Field key={node.id} label={node.label}>{body}</Field>;
  }

  function renderAbilityBonus(node: GraphNode) {
    const bg = byId(catalog.backgrounds, answers.historique as string);
    const abScores = bg?.abilityScores as { abilities?: string[]; rule?: string } | undefined;
    if (!bg || !abScores) return <Field key={node.id} label={node.label}><p className="hint">{t.builder.chooseBackgroundFirst}</p></Field>;
    const cur = (answers["bonus-historique"] || {}) as Record<string, number>;
    const setBonus = (ab: string, v: number) => {
      const next = { ...cur }; if (v) next[ab] = v; else delete next[ab];
      set("bonus-historique", Object.keys(next).length ? next : "");
    };
    return (
      <Field key={node.id} label={node.label}>
        <div className="grid">
          {(abScores.abilities ?? []).map((ab) => (
            <label key={ab} className="cell">
              <span className="cell-l">{ABIL_LABEL[ab as AbilityKey] ?? ab}</span>
              <select className="ctl" value={cur[ab] ?? 0} onChange={(e) => setBonus(ab, Number(e.target.value))}>
                <option value={0}>+0</option><option value={1}>+1</option><option value={2}>+2</option>
              </select>
            </label>
          ))}
        </div>
        <p className="hint">{fmt(t.builder.bonusRule, { rule: abScores.rule ?? "+2/+1 ou +1/+1/+1" })}</p>
      </Field>
    );
  }

  function renderChoice(p: PendingChoice) {
    const need = p.need || resolveCount(p) || 1;
    const chosen = arrOf(p.id);
    const reco = new Set(p.recommendations || []);
    const status = chosen.length >= need ? "fourni" : "manquant";
    const kindLabel = KIND_LABELS[p.kind] || p.kind;
    return (
      <div key={p.id} className="choice">
        <div className="choice-h">
          <span>{p.sourceLabel} — {kindLabel}</span>
          <Badge status={status} label={`${chosen.length}/${need}`} />
        </div>
        {need === 1 ? (
          <select className="ctl" value={chosen[0] ?? ""} onChange={(e) => set(p.id, e.target.value)}>
            <option value="">{t.builder.choose}</option>
            {p.options.map((o: Option) => (
              <option key={o.id} value={o.id}>{o.name}{reco.has(o.id) ? " ★" : ""}</option>
            ))}
          </select>
        ) : (
          <div className="opts">
            {p.options.map((o: Option) => {
              const on = chosen.includes(o.id);
              const dis = !on && chosen.length >= need;
              return (
                <label key={o.id} className={reco.has(o.id) ? "opt reco" : "opt"}>
                  <input type="checkbox" checked={on} disabled={dis} onChange={() => toggleMulti(p.id, o.id, need)} />
                  {o.name}{reco.has(o.id) ? " ★" : ""}
                </label>
              );
            })}
          </div>
        )}
        {p.note && <p className="hint">{p.note}</p>}
        {reco.size > 0 && <p className="hint">{t.builder.recoLegend}</p>}
      </div>
    );
  }

  function renderAggregate(node: GraphNode) {
    const items = buckets[node.id] || [];
    return (
      <Field key={node.id} label={node.label}>
        {items.length ? items.map(renderChoice) : <p className="hint">{t.builder.noChoiceNeeded}</p>}
      </Field>
    );
  }

  function renderText(node: GraphNode) {
    return (
      <Field key={node.id} label={node.label}>
        <div className="grid">
          <label className="cell"><span className="cell-l">{t.builder.name}</span>
            <input className="ctl" type="text" value={(answers.nom as string) || ""} onChange={(e) => set("nom", e.target.value)} /></label>
          <label className="cell"><span className="cell-l">{t.builder.alignment}</span>
            <input className="ctl" type="text" value={(answers.alignement as string) || ""} onChange={(e) => set("alignement", e.target.value)} /></label>
        </div>
      </Field>
    );
  }

  function renderNode(node: GraphNode): React.ReactNode {
    if (!nodeApplies(catalog, answers, node)) return null;
    switch (node.type) {
      case "single": return renderSingle(node);
      case "ability-scores": return renderAbilityScores(node);
      case "ability-bonus": return renderAbilityBonus(node);
      case "aggregate-choices": return renderAggregate(node);
      case "text": return renderText(node);
      case "compute": return <p key={node.id} className="hint">{t.builder.computedLive}</p>;
      default: return null;
    }
  }

  return (
    <div className="builder-form">
      {graph.steps.map((step: GraphStep) => {
        if (!nodeApplies(catalog, answers, step)) return null;
        const nodes = step.nodes.map(renderNode).filter(Boolean);
        return (
          <section key={step.id} className="step">
            <h2>{step.label}</h2>
            {nodes}
            {step.id === "competences-langues" && autres.length > 0 && (
              <div className="choice autres">
                <div className="choice-h"><strong>{t.builder.otherChoices}</strong></div>
                {autres.map(renderChoice)}
              </div>
            )}
          </section>
        );
      })}
      <style>{BUILDER_CSS}</style>
    </div>
  );
}

// Libellés de kind (chrome) — le reste des noms vient du catalogue (contenu FR).
const KIND_LABELS: Record<string, string> = {
  "competence-classe": "compétence (classe)", competence: "compétence", cantrip: "sort mineur",
  prepared: "sort préparé", langue: "langue", equipement: "équipement", "ordre-primitif": "ordre primitif",
  "ordre-divin": "ordre divin", expertise: "expertise", grimoire: "grimoire", "spellcasting-ability": "carac. d'incantation",
  "liste-sorts": "liste de sorts (don)", "caracteristique-incantation": "carac. d'incantation (don)",
  "style-de-combat": "style de combat", outil: "outil", toolProficiency: "outil",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="node"><span className="node-l">{label}</span>{children}</div>;
}

function Badge({ status, label }: { status: string; label: string }) {
  return <span className="badge" data-status={status}>{label}</span>;
}

const BUILDER_CSS = `
.builder-form .step { border:1px solid var(--line,#d9cfc0); border-radius:10px; padding:12px 14px; margin-bottom:14px; background:var(--card,#fff); }
.builder-form .step > h2 { font-size:14px; margin:0 0 10px; text-transform:uppercase; letter-spacing:.03em; color:var(--accent,#3f6b3f); }
.builder-form .node { margin-bottom:12px; }
.builder-form .node-l, .builder-form .cell-l { display:block; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.02em; color:var(--muted,#7a6f5f); margin-bottom:3px; }
.builder-form .ctl { font:inherit; padding:5px 7px; border:1px solid var(--line,#d9cfc0); border-radius:6px; background:#fff; width:100%; }
.builder-form .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.builder-form .hint { font-size:12px; color:var(--muted,#7a6f5f); margin:4px 0 0; }
.builder-form .hint.over { color:#991b1b; font-weight:700; }
.builder-form .choice { border:1px dashed var(--line,#d9cfc0); border-radius:8px; padding:8px 10px; margin-bottom:8px; }
.builder-form .choice.autres { border-style:solid; border-color:#b8860b; background:#fbf6e9; }
.builder-form .choice-h { display:flex; justify-content:space-between; align-items:center; font-size:13px; margin-bottom:5px; gap:8px; }
.builder-form .opts { display:flex; flex-wrap:wrap; gap:5px 14px; }
.builder-form .opt { font-size:13px; display:inline-flex; align-items:center; gap:4px; }
.builder-form .opt.reco { font-weight:700; }
.builder-form .badge { border:1px solid; border-radius:999px; padding:1px 8px; font-size:11px; font-weight:700; white-space:nowrap; }
.builder-form .badge[data-status="fourni"] { color:#166534; border-color:#86c096; background:#eafbf0; }
.builder-form .badge[data-status="manquant"] { color:#991b1b; border-color:#e0a0a0; background:#fdecec; }
`;
