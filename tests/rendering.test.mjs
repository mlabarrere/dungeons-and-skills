/* Renderer security, localization and diagnostic semantics.
   The computed fixture is deliberately rules-neutral: these tests exercise only
   projection behavior, while correctness.test.mjs owns game arithmetic. */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  escapeAttribute,
  escapeText,
  renderHTML,
} from "../engine/render-character.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const UI = JSON.parse(readFileSync(join(ROOT, "data", "ui-labels.json"), "utf8"));
const LANGUAGES = ["en", "fr", "de", "es", "it", "ja", "ru", "zh", "ar"];
const LABELS = Object.fromEntries(LANGUAGES.map((lang) => [
  lang,
  JSON.parse(readFileSync(join(ROOT, "data", `labels.${lang}.json`), "utf8")),
]));

test("all nine UI overlays cover the complete renderer chrome", () => {
  const shape = (value, prefix = "") => Object.entries(value)
    .flatMap(([key, child]) => child && typeof child === "object" && !Array.isArray(child)
      ? shape(child, `${prefix}${key}.`)
      : [`${prefix}${key}`])
    .sort();
  const expected = shape(UI.en);
  for (const lang of LANGUAGES) {
    assert.deepEqual(shape(UI[lang]), expected, `${lang} UI overlay is incomplete`);
  }
});

function computedFixture(name = "Safe Name") {
  return {
    model: {
      id: "render-test",
      classId: "fighter",
      speciesId: "dwarf",
      identity: {
        name,
        className: "Guerrier",
        species: "Nain",
      },
      sources: [],
      equipment: [],
    },
    lvl: 1,
    PB: 2,
    scores: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 },
    mods: { str: 2, dex: 1, con: 2, int: -1, wis: 1, cha: 0 },
    effects: [],
    counters: [],
    missing: [],
    conflicts: [],
    derived: [],
    castingRows: [],
    saves: [],
    skills: [],
    features: [],
    cantrips: [],
    prepared: [],
    problems: [],
  };
}

function render(computed, lang = "en", extra = {}) {
  return renderHTML(computed, {
    lang,
    labels: LABELS[lang],
    fallbackLabels: LABELS.en,
    ui: UI,
    mode: "standalone",
    source: "fixtures/render-test.character.json",
    assets: { css: ".sheet { display: block; }", js: "void 0;" },
    ...extra,
  });
}

test("escapeText and escapeAttribute encode their respective HTML contexts", () => {
  assert.equal(escapeText(`&<>"'`), "&amp;&lt;&gt;&quot;&#39;");
  assert.equal(escapeAttribute(`&<>"'`), "&amp;&lt;&gt;&quot;&#39;");
  assert.equal(escapeText(null), "");
  assert.equal(escapeAttribute(undefined), "");
});

for (const name of [
  `" onmouseover="alert(1)`,
  "<script>alert(1)</script>",
  "月光",
  "نور القمر",
  "O'Brien",
  "Name;with;semicolons",
  "Name|with|pipes",
]) {
  test(`adversarial character name is inert HTML: ${JSON.stringify(name)}`, () => {
    const html = render(computedFixture(name));
    assert.match(html, new RegExp(`<h1>${escapeRegExp(escapeText(name))}</h1>`));
    assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
    assert.doesNotMatch(html, /<[A-Za-z][^>]*\sonmouseover=/i,
      "the adversarial text must not become an HTML event-handler attribute");
    assert.doesNotMatch(html, /data-breadcrumb=/i,
      "standalone sheets must not serialize user input into a breadcrumb attribute");
  });
}

test("standalone English and French HTML embeds assets and localizes chrome and entities", () => {
  const en = render(computedFixture(), "en");
  const fr = render(computedFixture(), "fr");

  for (const html of [en, fr]) {
    assert.match(html, /<style>\.sheet \{ display: block; \}<\/style>/);
    assert.match(html, /<script>void 0;<\/script>/);
    assert.doesNotMatch(html, /(?:href|src)="\.\.\/assets\//,
      "standalone output must not depend on site-relative assets");
  }

  assert.match(en, /<span class="label">Character Name<\/span>/);
  assert.match(en, /Dwarf[^<]*, Fighter level 1/);
  assert.match(fr, /<span class="label">Nom du personnage<\/span>/);
  assert.match(fr, /Dwarf[^<]*, Fighter niveau 1/);
});

for (const lang of LANGUAGES) {
  test(`HTML honors language overlays and direction: ${lang}`, () => {
    const html = render(computedFixture(), lang);
    assert.match(html, new RegExp(`<html lang="${lang}"${lang === "ar" ? ' dir="rtl"' : ""}>`));
    if (lang !== "ar") assert.doesNotMatch(html, /<html[^>]*\sdir="rtl"/);
    assert.match(html, new RegExp(`<h2>${escapeRegExp(escapeText(UI[lang].skills))}</h2>`));
    assert.match(html, new RegExp(escapeRegExp(escapeText(LABELS[lang].classes.fighter || LABELS.en.classes.fighter))));
    assert.match(html, new RegExp(escapeRegExp(escapeText(LABELS[lang].species.dwarf || LABELS.en.species.dwarf))));
  });
}

test("warnings are visible, require manual verification, and are never conflicts", () => {
  const computed = computedFixture();
  computed.counters.push({
    key: "cantrips",
    kind: "Cantrips",
    list: "class",
    used: 2,
    allowed: null,
    quotaDeclared: false,
    state: "unverified",
  });
  computed.problems.push({
    level: "warn",
    code: "counter-unverified",
    params: { items: ["2 cantrips on class"] },
    msg: "quota absent",
  });

  const html = render(computed);
  assert.match(html, /sheet-lint:\s*0 error\(s\), 1 warning\(s\)/i);
  assert.match(html, /Manual verification required\./);
  assert.match(html, /data-status="warning"/);
  assert.match(html, /No declared quota:/);
  assert.doesNotMatch(html, /data-status="conflict"/);
  assert.doesNotMatch(html, /duplicates verified/i);
});

test("CLI standalone smoke uses the same localized renderer and a temporary output", () => {
  const dir = mkdtempSync(join(tmpdir(), "dnd-rendering-"));
  try {
    const input = join(dir, "fighter.answers.json");
    cpSync(join(ROOT, "examples", "dwarf-fighter.answers.json"), input);
    const stdout = execFileSync("node", [
      join(ROOT, "engine", "cli.mjs"),
      "build",
      input,
      "--format",
      "html",
      "--lang",
      "fr",
    ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    const output = stdout.trim().replace(/^sheet:\s*/, "");
    assert.equal(output, join(dir, "fighter.sheet.fr.html"));
    const html = readFileSync(output, "utf8");
    assert.match(html, /<html lang="fr">/);
    assert.match(html, /Nom du personnage/);
    assert.match(html, /<style>[\s\S]+<\/style>/);
    assert.match(html, /<script>[\s\S]+<\/script>/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
