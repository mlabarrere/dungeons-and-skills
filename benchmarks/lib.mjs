/* Shared benchmark helpers: load the catalog and resolve free-form model names
   (French or English, any casing) to catalog ids. Unresolvable names are the
   signal of an invented / wrong-edition entity. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadCatalogNode, normId, SKILLS } from "../engine/resolver.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export async function loadAll() {
  const catalog = await loadCatalogNode();
  let labels = {};
  try { labels = JSON.parse(readFileSync(join(ROOT, "data", "labels.en.json"), "utf8")); } catch { /* optional */ }
  const index = buildIndex(catalog, labels);
  // Bilingual scoring: English spell/style names map to verified catalog ids, so the
  // scorer counts rules errors, not FR/EN naming differences.
  try {
    const aliases = JSON.parse(readFileSync(join(ROOT, "benchmarks", "aliases.en.json"), "utf8"));
    for (const [group, map] of Object.entries(aliases)) {
      if (group === "_note" || !index[group]) continue;
      for (const [en, id] of Object.entries(map)) if (index[group][id]) index[group][normId(en)] = id;
    }
  } catch { /* optional */ }
  return { catalog, labels, index };
}

function buildIndex(catalog, labels) {
  const mk = () => Object.create(null);
  const idx = { classes: mk(), species: mk(), backgrounds: mk(), skills: mk(), spells: mk(), feats: mk(), styles: mk() };
  const put = (m, id, ...names) => { m[id] = id; for (const n of names) if (n) m[normId(String(n))] = id; };

  const enOf = (group, id) => (labels[group] && labels[group][id]) || null;
  for (const c of catalog.classes) put(idx.classes, c.id, c.name, enOf("classes", c.id));
  for (const s of catalog.species) put(idx.species, s.id, s.name, enOf("species", s.id));
  for (const b of catalog.backgrounds) put(idx.backgrounds, b.id, b.name, enOf("backgrounds", b.id));
  for (const s of catalog.spells) put(idx.spells, s.id, s.name);
  for (const f of catalog.feats) put(idx.feats, f.id, f.name);

  // Skills: canonical FR-kebab ids + FR TitleCase + EN label.
  for (const id of SKILLS) put(idx.skills, id);
  if (labels.skills) for (const [frTitle, en] of Object.entries(labels.skills)) put(idx.skills, normId(frTitle), frTitle, en);

  // Fighting styles: from the fighter's feat category.
  for (const f of catalog.feats) if (f.category === "style-de-combat") put(idx.styles, f.id, f.name);

  return idx;
}

/** Resolve one free-form name in a category to a catalog id, or null. */
export function resolve(index, group, name) {
  if (name == null) return null;
  const m = index[group];
  return m[normId(String(name))] || m[String(name)] || null;
}

export { normId };
