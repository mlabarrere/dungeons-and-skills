#!/usr/bin/env node
/**
 * phase1-en-conversion.mjs — convert all French internal IDs to English.
 * Source of truth: scripts/mapping-fr-to-en.json
 * Run from repo root: node scripts/phase1-en-conversion.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MAPPING_PATH = join(HERE, "mapping-fr-to-en.json");

// ── Load mapping ────────────────────────────────────────────────────────────
const mapping = JSON.parse(readFileSync(MAPPING_PATH, "utf8"));

// Build flat lookup maps (FR id → EN id)
const classMap    = Object.fromEntries(Object.entries(mapping.classes).map(([fr, v]) => [fr, v.id]));
const subMap      = Object.fromEntries(Object.entries(mapping.subclasses).map(([fr, v]) => [fr, v.id]));
const speciesMap  = Object.fromEntries(Object.entries(mapping.species).map(([fr, v]) => [fr, v.id]));
const bgMap       = Object.fromEntries(Object.entries(mapping.backgrounds).map(([fr, v]) => [fr, v.id]));
const spellMap    = Object.fromEntries(Object.entries(mapping.spells).map(([fr, v]) => [fr, v.id]));
const abilityMap  = Object.fromEntries(Object.entries(mapping.abilities).map(([fr, v]) => [fr, v.id]));
const statusMap   = Object.fromEntries(Object.entries(mapping.statuses).map(([fr, v]) => [fr, v.id]));
const answersMap  = mapping.answers_fields; // nom→name, classe→class, etc.

// Skill ID map: lowercase French → lowercase English
const skillIdMap  = Object.fromEntries(
  Object.entries(mapping.skills).map(([frCap, v]) => [frCap.toLowerCase(), v.id])
);
// Also handle already-lowercase variants (some data uses lowercase)
Object.entries(mapping.skills).forEach(([frCap, v]) => {
  skillIdMap[frCap] = v.id; // keep capitalized too
});

// Entity map: any entity type
const entityMap = { ...classMap, ...subMap, ...speciesMap, ...bgMap, ...spellMap };

// Compound ID prefix map: translate first segment of dash-separated ID
// e.g. "guerrier-competences" → "fighter-competences"
// e.g. "druide-cantrips" → "druid-cantrips"
function translateCompoundId(id) {
  const dash = id.indexOf("-");
  if (dash < 0) {
    // Single segment — check all entity maps
    return entityMap[id] || id;
  }
  const prefix = id.slice(0, dash);
  const suffix = id.slice(dash); // includes the dash
  const translated = classMap[prefix] || bgMap[prefix] || speciesMap[prefix] || subMap[prefix];
  if (translated) return translated + suffix;
  return id;
}

// Translate an ability value (for→str, sag→wis, others pass through)
function translateAbility(v) { return abilityMap[v] || v; }

// Translate a skill ID (acrobaties→acrobatics, etc.)
function translateSkill(v) { return skillIdMap[v] || v; }

// Translate a class name used as spell list (druide→druid, etc.)
function translateList(v) { return classMap[v] || v; }

// Track changes for reporting
const changes = { classes: 0, subclasses: 0, species: 0, backgrounds: 0,
  spells: 0, skillIds: 0, abilityKeys: 0, statusValues: 0, answerFields: 0, misc: 0 };
const gaps = [];

function gap(ctx, val) {
  gaps.push(`${ctx}: "${val}"`);
}

// ── Helper: rd/wr ────────────────────────────────────────────────────────────
function rd(relPath) {
  const p = join(ROOT, relPath);
  return JSON.parse(readFileSync(p, "utf8"));
}
function wr(relPath, data) {
  const p = join(ROOT, relPath);
  writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`  ✓ wrote ${relPath}`);
}
function rdTxt(relPath) { return readFileSync(join(ROOT, relPath), "utf8"); }
function wrTxt(relPath, text) {
  writeFileSync(join(ROOT, relPath), text, "utf8");
  console.log(`  ✓ wrote ${relPath}`);
}

// ── Transform: classes.json ──────────────────────────────────────────────────
function transformClasses(arr) {
  return arr.map((cls) => {
    const result = { ...cls };

    // entity id
    if (classMap[cls.id]) { result.id = classMap[cls.id]; changes.classes++; }
    else gap("classes.id", cls.id);

    // primaryAbility
    if (Array.isArray(cls.primaryAbility)) {
      result.primaryAbility = cls.primaryAbility.map(translateAbility);
    } else if (typeof cls.primaryAbility === "string") {
      result.primaryAbility = translateAbility(cls.primaryAbility);
    }

    // savingThrows
    if (Array.isArray(cls.savingThrows)) {
      result.savingThrows = cls.savingThrows.map(translateAbility);
    }

    // spellcasting
    if (cls.spellcasting) {
      result.spellcasting = {
        ...cls.spellcasting,
        ability: translateAbility(cls.spellcasting.ability || ""),
        list: translateList(cls.spellcasting.list || ""),
      };
      if (!cls.spellcasting.ability) delete result.spellcasting.ability;
    }

    // subclass.ids
    if (cls.subclass && Array.isArray(cls.subclass.ids)) {
      result.subclass = {
        ...cls.subclass,
        ids: cls.subclass.ids.map((sid) => {
          if (subMap[sid]) { changes.subclasses++; return subMap[sid]; }
          gap("classes.subclass.ids", sid); return sid;
        }),
      };
    }

    // effects
    result.effects = (cls.effects || []).map(transformEffect.bind(null, cls.id));

    // choices
    result.choices = (cls.choices || []).map((ch) => transformChoice(ch, cls.id));

    // recommends
    result.recommends = (cls.recommends || []).map((rec) => {
      const r = { ...rec, list: translateList(rec.list || "") };
      if (Array.isArray(rec.ids)) {
        r.ids = rec.ids.map((id) => { const t = spellMap[id] || id; if (!spellMap[id]) gap(`${cls.id} recommends`, id); return t; });
      }
      return r;
    });

    return result;
  });
}

// ── Transform: subclasses.json ───────────────────────────────────────────────
function transformSubclasses(arr) {
  return arr.map((sc) => {
    const result = { ...sc };

    if (subMap[sc.id]) { result.id = subMap[sc.id]; changes.subclasses++; }
    else gap("subclasses.id", sc.id);

    if (sc.parentClass) {
      result.parentClass = classMap[sc.parentClass] || sc.parentClass;
      if (!classMap[sc.parentClass]) gap("subclasses.parentClass", sc.parentClass);
    }

    result.effects = (sc.effects || []).map(transformEffect.bind(null, sc.id));
    result.choices = (sc.choices || []).map((ch) => transformChoice(ch, sc.id));
    result.recommends = (sc.recommends || []).map((rec) => {
      const r = { ...rec, list: translateList(rec.list || "") };
      if (Array.isArray(rec.ids)) {
        r.ids = rec.ids.map((id) => spellMap[id] || id);
      }
      return r;
    });

    return result;
  });
}

// ── Transform: species.json ──────────────────────────────────────────────────
function transformSpecies(arr) {
  return arr.map((sp) => {
    const result = { ...sp };

    if (speciesMap[sp.id]) { result.id = speciesMap[sp.id]; changes.species++; }
    else { /* already English or unmapped — keep */ }

    result.effects = (sp.effects || []).map(transformEffect.bind(null, sp.id));
    result.choices = (sp.choices || []).map((ch) => transformChoice(ch, sp.id));

    if (Array.isArray(sp.lineages)) {
      result.lineages = sp.lineages.map((lin) => ({
        ...lin,
        effects: (lin.effects || []).map(transformEffect.bind(null, `${sp.id}.${lin.id}`)),
        choices: (lin.choices || []).map((ch) => transformChoice(ch, `${sp.id}.${lin.id}`)),
      }));
    }

    return result;
  });
}

// ── Transform: backgrounds.json ─────────────────────────────────────────────
function transformBackgrounds(arr) {
  return arr.map((bg) => {
    const result = { ...bg };

    if (bgMap[bg.id]) { result.id = bgMap[bg.id]; changes.backgrounds++; }
    else { /* already English or unmapped */ }

    // abilityScores.abilities: ability keys
    if (bg.abilityScores && Array.isArray(bg.abilityScores.abilities)) {
      result.abilityScores = {
        ...bg.abilityScores,
        abilities: bg.abilityScores.abilities.map(translateAbility),
      };
    }

    // skills array (skill proficiency IDs)
    if (Array.isArray(bg.skills)) {
      result.skills = bg.skills.map((sk) => { const t = translateSkill(sk); if (t !== sk) changes.skillIds++; return t; });
    }

    // featClass
    if (bg.featClass) {
      result.featClass = classMap[bg.featClass] || bg.featClass;
    }

    result.effects = (bg.effects || []).map(transformEffect.bind(null, bg.id));
    result.choices = (bg.choices || []).map((ch) => transformChoice(ch, bg.id));

    return result;
  });
}

// ── Transform: feats.json ────────────────────────────────────────────────────
function transformFeats(arr) {
  return arr.map((feat) => {
    const result = { ...feat };
    result.effects = (feat.effects || []).map(transformEffect.bind(null, feat.id));
    result.choices = (feat.choices || []).map((ch) => transformChoice(ch, feat.id));
    return result;
  });
}

// ── Transform: spells.json ───────────────────────────────────────────────────
function transformSpells(arr) {
  return arr.map((sp) => {
    const result = { ...sp };

    if (spellMap[sp.id]) { result.id = spellMap[sp.id]; changes.spells++; }
    else gap("spells.id", sp.id);

    // classes array
    if (Array.isArray(sp.classes)) {
      result.classes = sp.classes.map((c) => classMap[c] || c);
    }

    // save ability
    if (sp.save) { result.save = translateAbility(sp.save); }

    return result;
  });
}

// ── Transform: spells-by-class.json ─────────────────────────────────────────
function transformSpellsByClass(obj) {
  const result = {};
  for (const [clsFr, entries] of Object.entries(obj)) {
    const clsEn = classMap[clsFr];
    if (!clsEn) { gap("spells-by-class key", clsFr); result[clsFr] = entries; continue; }
    result[clsEn] = entries.map((e) => {
      const t = spellMap[e.id];
      if (!t) gap(`spells-by-class[${clsFr}]`, e.id);
      return { ...e, id: t || e.id };
    });
  }
  return result;
}

// ── Transform: build-graph.json ──────────────────────────────────────────────
// Only translate the answers_fields node IDs that appear there.
// Node ids "classe" → "class", "espece" → "species", "historique" → "background", "methode" → "method"
const graphNodeMap = {
  "classe": "class",
  "espece": "species",
  "historique": "background",
  "methode": "method",
  "sous-classe": "subclass",
  "lignage": "lineage",
};
function translateGraphNodeId(id) { return graphNodeMap[id] || id; }

function transformBuildGraph(graph) {
  const result = JSON.parse(JSON.stringify(graph)); // deep clone
  result.steps = result.steps.map((step) => {
    return {
      ...step,
      nodes: (step.nodes || []).map((node) => {
        const n = { ...node, id: translateGraphNodeId(node.id) };
        if (n.optionsFrom) {
          const of2 = { ...n.optionsFrom };
          if (of2.subclassesOf) of2.subclassesOf = translateGraphNodeId(of2.subclassesOf);
          if (of2.lineagesOf) of2.lineagesOf = translateGraphNodeId(of2.lineagesOf);
          n.optionsFrom = of2;
        }
        if (n.when) {
          const w = { ...n.when };
          if (w.hasLineages) w.hasLineages = translateGraphNodeId(w.hasLineages);
          n.when = w;
        }
        if (n.fromChoicesOf) n.fromChoicesOf = translateGraphNodeId(n.fromChoicesOf);
        if (Array.isArray(n.dependsOn)) n.dependsOn = n.dependsOn.map(translateGraphNodeId);
        return n;
      }),
    };
  });
  return result;
}

// ── Shared effect transformer ─────────────────────────────────────────────────
function transformEffect(ctx, ef) {
  const r = { ...ef };

  if (ef.type === "grants") {
    // ability keys in savingThrowProficiency values
    if (ef.what === "savingThrowProficiency" && ef.value) {
      r.value = translateAbility(ef.value);
    }
    // skill proficiency values
    if (ef.what === "skillProficiency" && ef.value && ef.value !== "toutes") {
      const t = translateSkill(ef.value);
      if (t !== ef.value) changes.skillIds++;
      r.value = t;
    }
    // spell ability
    if (ef.ability) r.ability = translateAbility(ef.ability);
    // spell list
    if (ef.list) r.list = translateList(ef.list);
    // spell reference
    if (ef.spell) {
      const t = spellMap[ef.spell];
      if (!t && ef.spell && !ef.spell.startsWith("choix:")) gap(`${ctx} effect spell`, ef.spell);
      r.spell = t || ef.spell;
    }
  }

  return r;
}

// ── Shared choice transformer ─────────────────────────────────────────────────
function transformChoice(ch, parentId) {
  const r = { ...ch };

  // choice id: translate compound prefix
  r.id = translateCompoundId(ch.id);

  const from = ch.from ? { ...ch.from } : null;
  if (from) {
    // fromSkillSet
    if (Array.isArray(from.fromSkillSet)) {
      from.fromSkillSet = from.fromSkillSet.map((sk) => {
        if (sk === "toutes") return sk;
        const t = translateSkill(sk);
        if (t !== sk) changes.skillIds++;
        return t;
      });
    }
    // fromSpellList
    if (from.fromSpellList) {
      from.fromSpellList = translateList(from.fromSpellList);
    }
    // fromList with class names (for "initie-a-la-magie")
    if (Array.isArray(from.fromList)) {
      from.fromList = from.fromList.map((v) => classMap[v] || v);
    }
    // fromChoice: translate compound ID
    if (from.fromChoice) {
      from.fromChoice = translateCompoundId(from.fromChoice);
    }
    // fromAbilities: translate ability keys in arrays
    if (Array.isArray(from.fromAbilities)) {
      from.fromAbilities = from.fromAbilities.map(translateAbility);
    }
    r.from = from;
  }

  // from as array (choices where from is direct array of ability keys)
  if (Array.isArray(ch.from)) {
    r.from = ch.from.map(translateAbility);
  }

  // appliesEffects: translate keys (ability values) and effects
  if (ch.appliesEffects && typeof ch.appliesEffects === "object" && !Array.isArray(ch.appliesEffects)) {
    r.appliesEffects = {};
    for (const [key, effects] of Object.entries(ch.appliesEffects)) {
      r.appliesEffects[key] = effects.map(transformEffect.bind(null, `${parentId}/${ch.id}/${key}`));
    }
  }

  return r;
}

// ── Transform: answers.json ───────────────────────────────────────────────────
function transformAnswers(obj) {
  const r = {};
  for (const [key, val] of Object.entries(obj)) {
    // Translate top-level field names
    const newKey = answersMap[key] || translateCompoundId(key);

    let newVal = val;
    // Translate values based on what the key represents
    if (key === "classe" || key === "class") {
      newVal = classMap[val] || val;
    } else if (key === "espece" || key === "species") {
      newVal = speciesMap[val] || val;
    } else if (key === "historique" || key === "background") {
      newVal = bgMap[val] || val;
    } else if (key.endsWith("-cantrips") || key.endsWith("-prepares")) {
      // Array of spell IDs
      if (Array.isArray(val)) {
        newVal = val.map((id) => spellMap[id] || id);
      } else if (typeof val === "string") {
        newVal = spellMap[val] || val;
      }
    } else if (key.endsWith("-sort-1") || key.endsWith("-sort-2")) {
      newVal = spellMap[val] || val;
    } else if (key === "abilityScores" && typeof val === "object") {
      // Rename "for" → "str", "sag" → "wis"
      newVal = {};
      for (const [ab, score] of Object.entries(val)) {
        const newAb = translateAbility(ab);
        newVal[newAb] = score;
        if (newAb !== ab) changes.abilityKeys++;
      }
    } else if (key.endsWith("-grimoire")) {
      if (Array.isArray(val)) newVal = val.map((id) => spellMap[id] || id);
    } else if ((key === "initie-a-la-magie-liste" || key === "initie-a-la-magie-liste") && typeof val === "string") {
      newVal = classMap[val] || val;
    } else if (Array.isArray(val) && val.length && typeof val[0] === "string") {
      // Arrays of skill IDs or language IDs — try skill translation
      newVal = val.map((v) => translateSkill(v));
    }

    r[newKey] = newVal;
  }
  return r;
}

// ── Transform: character.json (golden files) ──────────────────────────────────
function transformCharacter(obj) {
  const r = JSON.parse(JSON.stringify(obj)); // deep clone

  // abilityScores
  if (r.abilityScores && typeof r.abilityScores === "object") {
    const newScores = {};
    for (const [ab, v] of Object.entries(r.abilityScores)) {
      newScores[translateAbility(ab)] = v;
    }
    r.abilityScores = newScores;
  }

  // sources: translate ids, effects
  if (Array.isArray(r.sources)) {
    r.sources = r.sources.map((src) => {
      const s = { ...src };
      // translate entity ids where they match
      if (spellMap[s.id]) s.id = spellMap[s.id];
      else if (classMap[s.id]) s.id = classMap[s.id];
      else if (speciesMap[s.id]) s.id = speciesMap[s.id];
      else if (bgMap[s.id]) s.id = bgMap[s.id];
      else if (subMap[s.id]) s.id = subMap[s.id];
      // effects
      s.effects = (src.effects || []).map(transformCharEffect);
      return s;
    });
  }

  // choices
  if (Array.isArray(r.choices)) {
    r.choices = r.choices.map((ch) => {
      const c = { ...ch };
      if (typeof c.value === "string") {
        // skill values
        c.value = translateSkill(c.value);
      }
      c.effects = (ch.effects || []).map(transformCharEffect);
      return c;
    });
  }

  // spells
  if (r.spells) {
    if (Array.isArray(r.spells.cantrips)) {
      r.spells = { ...r.spells, cantrips: r.spells.cantrips.map(transformSpellEntry) };
    }
    if (Array.isArray(r.spells.prepared)) {
      r.spells = { ...r.spells, prepared: r.spells.prepared.map(transformSpellEntry) };
    }
  }

  return r;
}

function transformCharEffect(ef) {
  const r = { ...ef };
  if (ef.value) r.value = translateAbility(ef.value);
  if (ef.ability) r.ability = translateAbility(ef.ability);
  if (ef.list) r.list = translateList(ef.list);
  if (ef.spell) r.spell = spellMap[ef.spell] || ef.spell;
  // skill proficiency values
  if (ef.what === "skillProficiency" && ef.value) {
    const t = translateSkill(ef.value);
    r.value = t;
  }
  return r;
}

function transformSpellEntry(s) {
  const r = { ...s };
  if (spellMap[s.id]) r.id = spellMap[s.id];
  if (s.list) r.list = translateList(s.list);
  if (s.status) r.status = statusMap[s.status] || s.status;
  if (s.origin === "granted") r.origin = "granted";
  return r;
}

// ── Build labels.en.json (EN id → EN name) and labels.fr.json (EN id → FR name)
function buildLabels(classesData, speciesData, bgData, subclassData, spellsData) {
  const labelsEn = {
    _note: "EN-id -> EN label. GENERATED by phase1-en-conversion.mjs from PHB 2024 verified mapping.",
    classes: {},
    species: {},
    backgrounds: {},
    subclasses: {},
    skills: {},
    statuses: {},
    spells: {},
  };
  const labelsFr = {
    _note: "EN-id -> FR display name. GENERATED by phase1-en-conversion.mjs. Used for French UI output.",
    classes: {},
    species: {},
    backgrounds: {},
    subclasses: {},
    skills: {},
    statuses: {},
  };

  // Classes
  for (const [fr, v] of Object.entries(mapping.classes)) {
    labelsEn.classes[v.id] = v.name;
    // FR display name = original data name
    const cls = classesData.find((c) => c.id === v.id);
    labelsFr.classes[v.id] = cls ? cls.name : fr;
  }
  // Species
  for (const [fr, v] of Object.entries(mapping.species)) {
    labelsEn.species[v.id] = v.name;
    const sp = speciesData.find((s) => s.id === v.id);
    labelsFr.species[v.id] = sp ? sp.name : fr;
  }
  // Backgrounds
  for (const [fr, v] of Object.entries(mapping.backgrounds)) {
    labelsEn.backgrounds[v.id] = v.name;
    const bg = bgData.find((b) => b.id === v.id);
    labelsFr.backgrounds[v.id] = bg ? bg.name : fr;
  }
  // Subclasses
  for (const [fr, v] of Object.entries(mapping.subclasses)) {
    labelsEn.subclasses[v.id] = v.name;
    const sc = subclassData.find((s) => s.id === v.id);
    labelsFr.subclasses[v.id] = sc ? sc.name : fr;
  }
  // Skills
  for (const [frCap, v] of Object.entries(mapping.skills)) {
    labelsEn.skills[v.id] = v.name;
    labelsFr.skills[v.id] = frCap;
  }
  // Statuses
  for (const [fr, v] of Object.entries(mapping.statuses)) {
    labelsEn.statuses[v.id] = v.name;
    labelsFr.statuses[v.id] = fr;
  }
  // Spells (EN id → EN name)
  for (const [fr, v] of Object.entries(mapping.spells)) {
    labelsEn.spells[v.id] = v.name;
  }

  return { labelsEn, labelsFr };
}

// ── Engine source transformations ─────────────────────────────────────────────

function transformResolverMjs(src) {
  let s = src;

  // SKILLS array: replace each French skill id with English
  // Current: ["acrobaties", "arcanes", "athletisme", ...]
  const frSkills = ["acrobaties", "arcanes", "athletisme", "discretion", "dressage", "escamotage",
    "histoire", "intimidation", "intuition", "investigation", "medecine", "nature", "perception",
    "persuasion", "religion", "representation", "tromperie", "survie"];
  const enSkills = frSkills.map((sk) => skillIdMap[sk] || sk);
  const frSkillsStr = frSkills.map((sk) => `"${sk}"`).join(", ");
  const enSkillsStr = enSkills.map((sk) => `"${sk}"`).join(", ");
  s = s.replace(frSkillsStr, enSkillsStr);

  // answers.classe → answers.class  (careful: only as property access)
  s = s.replace(/answers\.classe\b/g, "answers.class");
  s = s.replace(/answers\["sous-classe"\]/g, 'answers["subclass"]');
  s = s.replace(/answers\.espece\b/g, "answers.species");
  s = s.replace(/answers\.lignage\b/g, "answers.lineage");
  s = s.replace(/answers\.historique\b/g, "answers.background");
  s = s.replace(/answers\.alignement\b/g, "answers.alignment");
  s = s.replace(/answers\.nom\b/g, "answers.name");
  s = s.replace(/answers\["espece"\]/g, 'answers["species"]');
  s = s.replace(/answers\["classe"\]/g, 'answers["class"]');

  // "espece" as spell list identifier in list: "espece"
  s = s.replace(/"espece"/g, '"species"');

  // node ID references in nodeApplies
  s = s.replace(/answers\.classe\b/g, "answers.class");

  // "langue" and "courante" are internal terms that don't need changing

  // STATUS VALUES used in resolver output
  s = s.replace(/status: "fourni"/g, 'status: "provided"');
  s = s.replace(/origin: "granted"/g, 'origin: "granted"');

  return s;
}

function transformBuildCharacterMjs(src) {
  let s = src;

  // ABILITIES array
  s = s.replace(
    /export const ABILITIES = \["for", "dex", "con", "int", "sag", "cha"\]/,
    'export const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"]'
  );

  // ABILITY_LABEL
  s = s.replace(
    /const ABILITY_LABEL = \{ for: "Force", dex: "Dexterite", con: "Constitution", int: "Intelligence", sag: "Sagesse", cha: "Charisme" \}/,
    'const ABILITY_LABEL = { str: "Strength", dex: "Dexterity", con: "Constitution", int: "Intelligence", wis: "Wisdom", cha: "Charisma" }'
  );

  // SKILLS object: replace French names with English
  const frSkillsObj = [
    '"Acrobaties": "dex"', '"Arcanes": "int"', '"Athletisme": "for"', '"Discretion": "dex"',
    '"Dressage": "sag"', '"Escamotage": "dex"', '"Histoire": "int"', '"Intimidation": "cha"',
    '"Intuition": "sag"', '"Investigation": "int"', '"Medecine": "sag"', '"Nature": "int"',
    '"Perception": "sag"', '"Persuasion": "cha"', '"Representation": "cha"', '"Religion": "int"',
    '"Tromperie": "cha"', '"Survie": "sag"',
  ];
  const enSkillsObj = [
    '"Acrobatics": "dex"', '"Arcana": "int"', '"Athletics": "str"', '"Stealth": "dex"',
    '"Animal Handling": "wis"', '"Sleight of Hand": "dex"', '"History": "int"', '"Intimidation": "cha"',
    '"Insight": "wis"', '"Investigation": "int"', '"Medicine": "wis"', '"Nature": "int"',
    '"Perception": "wis"', '"Persuasion": "cha"', '"Performance": "cha"', '"Religion": "int"',
    '"Deception": "cha"', '"Survival": "wis"',
  ];
  for (let i = 0; i < frSkillsObj.length; i++) {
    s = s.replace(frSkillsObj[i], enSkillsObj[i]);
  }

  // STATUSES array
  s = s.replace(
    /const STATUSES = \["fourni", "source", "calcule", "deduit", "recommande", "arbitrer", "manquant", "incoherent", "conflit"\]/,
    'const STATUSES = ["provided", "granted", "computed", "derived", "recommended", "ruling-needed", "missing", "incoherent", "conflict"]'
  );

  // default abilityScores
  s = s.replace(
    /\{ for: 10, dex: 10, con: 10, int: 10, sag: 10, cha: 10 \}/,
    "{ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }"
  );

  // ability references in computed text
  s = s.replace(/mods\.sag\b/g, "mods.wis");
  s = s.replace(/mods\.for\b/g, "mods.str");
  s = s.replace(/scores\.sag\b/g, "scores.wis");
  s = s.replace(/scores\.for\b/g, "scores.str");
  s = s.replace(/saveProf\.sag\b/g, "saveProf.wis");
  s = s.replace(/saveProf\.for\b/g, "saveProf.str");
  s = s.replace(/mods\["sag"\]/g, 'mods["wis"]');
  s = s.replace(/mods\["for"\]/g, 'mods["str"]');

  // normId("Perception") lookups — these match skill names, not affected
  // conMod references are fine (con stays con)

  return s;
}

function transformGoldenTestMjs(src) {
  let s = src;

  // ANSWERS.medicis
  s = s.replace(/classe: "druide"/, 'class: "druid"');
  s = s.replace(/espece: "elfe"/, 'species: "elf"');
  s = s.replace(/historique: "guide"/, 'background: "guide"');
  s = s.replace(/"druide-competences": \["dressage", "nature"\]/, '"druid-competences": ["animal-handling", "nature"]');
  s = s.replace(/"druide-ordre-primitif": "mage"/, '"druid-ordre-primitif": "mage"');
  s = s.replace(/"druide-cantrips": \["flammes"\]/, '"druid-cantrips": ["produce-flame"]');
  s = s.replace(/"druide-prepares": \["amitie-avec-les-animaux", "lueurs-feeriques", "soins", "vague-tonnante"\]/,
    '"druid-prepares": ["animal-friendship", "faerie-fire", "cure-wounds", "thunderwave"]');
  s = s.replace(/"initie-a-la-magie-liste": "druide"/, '"initie-a-la-magie-liste": "druid"');
  s = s.replace(/"initie-a-la-magie-carac": "sag"/, '"initie-a-la-magie-carac": "wis"');
  s = s.replace(/"druide-equipement": "A"/, '"druid-equipement": "A"');
  s = s.replace(/"guide-equipement": "A"/, '"guide-equipement": "A"');
  // abilityScores medicis: { for: 10 → str:10, sag:17 → wis:17
  s = s.replace(/\{ for: 10, dex: 11, con: 14, int: 14, sag: 17, cha: 14 \}/,
    "{ str: 10, dex: 11, con: 14, int: 14, wis: 17, cha: 14 }");
  // elfe-sens-aiguises stays as-is (it's a lineage choice)

  // ANSWERS.malbec
  s = s.replace(/classe: "clerc"/, 'class: "cleric"');
  s = s.replace(/espece: "tieffelin"/, 'species: "tiefling"');
  s = s.replace(/historique: "acolyte"/, 'background: "acolyte"');
  s = s.replace(/"clerc-competences": \["medecine", "histoire"\]/, '"cleric-competences": ["medicine", "history"]');
  s = s.replace(/"clerc-ordre-divin": "thaumaturge"/, '"cleric-ordre-divin": "thaumaturge"');
  s = s.replace(/"clerc-cantrips": \["flamme-sacree", "mot-de-radiance", "glas"\]/,
    '"cleric-cantrips": ["sacred-flame", "word-of-radiance", "toll-the-dead"]');
  s = s.replace(/"clerc-prepares": \["benediction", "soins", "rayon-tractant", "bouclier-de-la-foi"\]/,
    '"cleric-prepares": ["bless", "cure-wounds", "rayon-tractant", "shield-of-faith"]');
  s = s.replace(/"initie-a-la-magie-liste": "clerc"/, '"initie-a-la-magie-liste": "cleric"');
  s = s.replace(/"initie-a-la-magie-carac": "sag"/, '"initie-a-la-magie-carac": "wis"');
  s = s.replace(/"clerc-equipement": "A"/, '"cleric-equipement": "A"');
  // abilityScores malbec: { for: 13 → str:13, sag:18 → wis:18
  s = s.replace(/\{ for: 13, dex: 12, con: 12, int: 13, sag: 18, cha: 11 \}/,
    "{ str: 13, dex: 12, con: 12, int: 13, wis: 18, cha: 11 }");

  // castingFor / classList reference
  s = s.replace(/const classList = ANSWERS\[id\]\.classe;/, "const classList = ANSWERS[id].class;");

  return s;
}

// ── Main ─────────────────────────────────────────────────────────────────────
console.log("\n=== Phase 1 — EN-native conversion ===\n");

// 1. Load sources
const classesRaw   = rd("docs/data/classes.json");
const subclassRaw  = rd("docs/data/subclasses.json");
const speciesRaw   = rd("docs/data/species.json");
const bgRaw        = rd("docs/data/backgrounds.json");
const featsRaw     = rd("docs/data/feats.json");
const spellsRaw    = rd("docs/data/spells.json");
const sbcRaw       = rd("docs/data/spells-by-class.json");
const graphRaw     = rd("docs/data/build-graph.json");
const malbecRaw    = rd("docs/characters/malbec.character.json");
const medicisRaw   = rd("docs/characters/medicis.character.json");
const answDwarfRaw = rd("examples/dwarf-fighter.answers.json");
const answElfRaw   = rd("examples/elf-druid.answers.json");

// 2. Transform data files
console.log("Transforming data files…");
const classesNew   = transformClasses(classesRaw);
const subclassNew  = transformSubclasses(subclassRaw);
const speciesNew   = transformSpecies(speciesRaw);
const bgNew        = transformBackgrounds(bgRaw);
const featsNew     = transformFeats(featsRaw);
const spellsNew    = transformSpells(spellsRaw);
const sbcNew       = transformSpellsByClass(sbcRaw);
const graphNew     = transformBuildGraph(graphRaw);

// 3. Build labels
console.log("Building label files…");
const { labelsEn, labelsFr } = buildLabels(classesNew, speciesNew, bgNew, subclassNew, spellsNew);

// 4. Transform golden character files
console.log("Transforming character files…");
const malbecNew   = transformCharacter(malbecRaw);
const medicisNew  = transformCharacter(medicisRaw);

// 5. Transform answers
console.log("Transforming example answers…");
const answDwarfNew = transformAnswers(answDwarfRaw);
const answElfNew   = transformAnswers(answElfRaw);

// 6. Transform engine sources
console.log("Transforming engine sources…");
const resolverSrc      = rdTxt("docs/_engine/resolver.mjs");
const buildCharSrc     = rdTxt("docs/_engine/build-character.mjs");
const goldenTestSrc    = rdTxt("docs/_engine/golden-test.mjs");

const resolverNew      = transformResolverMjs(resolverSrc);
const buildCharNew     = transformBuildCharacterMjs(buildCharSrc);
const goldenTestNew    = transformGoldenTestMjs(goldenTestSrc);

// 7. Write everything
console.log("\nWriting files…");
wr("docs/data/classes.json",         classesNew);
wr("docs/data/subclasses.json",      subclassNew);
wr("docs/data/species.json",         speciesNew);
wr("docs/data/backgrounds.json",     bgNew);
wr("docs/data/feats.json",           featsNew);
wr("docs/data/spells.json",          spellsNew);
wr("docs/data/spells-by-class.json", sbcNew);
wr("docs/data/build-graph.json",     graphNew);
wr("data/labels.en.json",            labelsEn);
wr("data/labels.fr.json",            labelsFr);
wr("docs/characters/malbec.character.json",   malbecNew);
wr("docs/characters/medicis.character.json",  medicisNew);
wr("examples/dwarf-fighter.answers.json",     answDwarfNew);
wr("examples/elf-druid.answers.json",         answElfNew);
wrTxt("docs/_engine/resolver.mjs",      resolverNew);
wrTxt("docs/_engine/build-character.mjs", buildCharNew);
wrTxt("docs/_engine/golden-test.mjs",   goldenTestNew);

// 8. Report
console.log("\n=== Summary ===");
console.log(`Classes:      ${changes.classes}`);
console.log(`Subclasses:   ${changes.subclasses}`);
console.log(`Species:      ${changes.species}`);
console.log(`Backgrounds:  ${changes.backgrounds}`);
console.log(`Spells:       ${changes.spells}`);
console.log(`Skill IDs:    ${changes.skillIds}`);
console.log(`Ability keys: ${changes.abilityKeys}`);
console.log(`Statuses:     ${changes.statusValues}`);
console.log(`Answers keys: ${changes.answerFields}`);

if (gaps.length) {
  console.log(`\nGAPS (${gaps.length}):`);
  gaps.forEach((g) => console.log("  GAP:", g));
} else {
  console.log("\n✓ No gaps — all slugs resolved.");
}

console.log("\nDone. Next: node scripts/build-bundles.mjs && npm test");
