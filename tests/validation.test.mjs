/* Input validation: the engine must never compute a sheet from a value that is
   not in the catalog, and must never call an unfinished sheet clean.

   These are regression tests for four defects found by adversarial review, each
   of which produced a green "✅ 0 erreur" on output that was wrong:
     - a hallucinated class id was treated as answered and rendered `undefined`
     - `build` ignored `ready`, defaulting scores to 10 and merging every
       equipment package while reporting "no remaining choices"
     - `--lang=en` rendered French and `--lang klingon` rendered English
     - an option the resolver OFFERED produced `DC NaN / atk NaN` */
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { writeFileSync, mkdtempSync, readFileSync, cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(ROOT, "engine", "cli.mjs");
const LANGS_ALL = ["en", "fr", "de", "es", "it", "ja", "ru", "zh", "ar"];
const TMP = mkdtempSync(join(tmpdir(), "dnd-validation-"));
after(() => rmSync(TMP, { recursive: true, force: true }));

/** Run the CLI, returning {status, stdout, stderr} without throwing. */
function cli(...args) {
  try {
    const stdout = execFileSync("node", [CLI, ...args], { encoding: "utf8", stdio: "pipe" });
    return { status: 0, stdout, stderr: "" };
  } catch (e) {
    return { status: e.status, stdout: e.stdout || "", stderr: e.stderr || "" };
  }
}

const write = (name, obj) => {
  const p = join(TMP, name);
  writeFileSync(p, JSON.stringify(obj));
  return p;
};

const COMPLETE = join(ROOT, "examples", "dwarf-fighter.answers.json");
const SCORES = { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 };

test("build refuses an id that is not in the catalog", () => {
  const f = write("hallucinated.json", {
    class: "warlord", species: "dwarf", background: "soldier", method: "standard", abilityScores: SCORES,
  });
  const r = cli("build", f);
  assert.notEqual(r.status, 0, "a hallucinated class must not build");
  assert.match(r.stderr, /"warlord" is not a legal value for "class"/);
  assert.doesNotMatch(r.stdout, /sheet-lint : 0 erreur/, "an illegal build must never report a clean lint");
});

test("build refuses an incomplete answers file even though its lint is clean", () => {
  const f = write("incomplete.json", {
    class: "fighter", species: "dwarf", background: "soldier", method: "standard", abilityScores: SCORES,
  });
  assert.equal(JSON.parse(cli("options", f).stdout).ready, false, "fixture must actually be incomplete");
  const r = cli("build", f);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /incomplete/);
  assert.match(r.stderr, /fighter-competences/, "the pending ids must be named so the agent can act");
});

/* Regression: validation must never reject an id `options` itself offered.
   `pendingChoices` de-duplicates, so a skill you picked vanishes from its own
   list and a downstream choice (rogue expertise draws from rogue skills) removes
   more. Validating against the post-answer list made every rogue and every bard
   unbuildable — the tool offered X, you picked X, the tool refused X. */
test("an id the resolver offered is never refused as illegal", () => {
  const base = {
    _id: "r", name: "R", class: "rogue", species: "human", background: "soldier",
    method: "standard", abilityScores: { str: 10, dex: 15, con: 13, int: 12, wis: 8, cha: 14 },
  };
  const offered = JSON.parse(cli("options", write("rogue-probe.json", base)).stdout);
  const skills = offered.dynamicPending.find((c) => c.id === "rogue-competences");
  assert.ok(skills, "fixture must reach the rogue skill choice");

  // Expertise draws FROM the skills just chosen, so answering both is what makes
  // the de-duplicated list disagree with what was offered. That coupling is the bug.
  const picks = skills.options.slice(0, skills.need).map((o) => o.id);
  const answered = write("rogue-answered.json", {
    ...base, "rogue-competences": picks, "rogue-expertise": picks.slice(0, 2),
  });
  const r = cli("build", answered);
  assert.doesNotMatch(r.stderr, /is not available for "rogue-competences"/,
    `validation refused ids it had just offered (${picks.join(", ")})`);
  assert.doesNotMatch(r.stderr, /is not a legal value for "rogue-competences"/);
});

test("a misspelled answer key is reported, not silently dropped", () => {
  const f = write("typo.json", { clas: "fighter", species: "dwarf" });
  const r = cli("options", f);
  assert.match(r.stderr, /Unknown answer key "clas"/);
  assert.ok(JSON.parse(r.stdout).invalidAnswers.length > 0, "invalidAnswers must surface in the JSON too");
});

test("--lang is a closed set, and --lang=xx is honoured", () => {
  const source = join(TMP, "lang-fighter.answers.json");
  cpSync(COMPLETE, source);
  assert.equal(cli("build", source, "--lang", "klingon").status, 3, "unknown language must be rejected, not guessed");
  const eq = cli("build", source, "--lang=en");
  const spaced = cli("build", source, "--lang", "en");
  assert.equal(eq.status, 0, eq.stderr);
  assert.equal(spaced.status, 0, spaced.stderr);
  assert.equal(eq.stdout, spaced.stdout, "--lang=en must mean the same as --lang en");
  const htmlPath = eq.stdout.trim().replace(/^sheet:\s*/, "");
  assert.match(readFileSync(htmlPath, "utf8"), /<html lang="en"/);
});

test("build and check honour the explicit html, markdown and json formats", () => {
  const answers = join(TMP, "formats-fighter.answers.json");
  cpSync(COMPLETE, answers);
  const model = join(TMP, "formats-elf-druid.character.json");
  cpSync(join(ROOT, "examples", "elf-druid.character.json"), model);

  const buildHtml = cli("build", answers, "--format", "html", "--lang", "fr");
  assert.equal(buildHtml.status, 0, buildHtml.stderr);
  assert.ok(readFileSync(buildHtml.stdout.trim().replace(/^sheet:\s*/, ""), "utf8").includes('<html lang="fr"'));

  const buildMd = cli("build", answers, "--format", "markdown", "--lang", "en");
  assert.equal(buildMd.status, 0, buildMd.stderr);
  assert.match(buildMd.stdout, /^# Thera/m);

  const buildJson = cli("build", answers, "--format", "json");
  assert.equal(buildJson.status, 0, buildJson.stderr);
  assert.equal(JSON.parse(buildJson.stdout).identity.name, "Thera");
  assert.deepEqual(JSON.parse(cli("build", answers, "--json").stdout), JSON.parse(buildJson.stdout));

  const checkHtml = cli("check", model, "--format", "html", "--lang", "en");
  assert.equal(checkHtml.status, 0, checkHtml.stderr);
  assert.ok(existsSync(checkHtml.stdout.trim().replace(/^audit:\s*/, "")));
  assert.match(cli("check", model, "--format", "markdown", "--lang", "en").stdout, /^# Sylwen/m);
  assert.equal(JSON.parse(cli("check", model, "--format", "json").stdout).identity.name, "Sylwen");

  assert.equal(cli("build", answers, "--json", "--format", "html").status, 3,
    "contradictory format flags must be rejected");
  assert.equal(cli("build", answers, "--format", "json", "--output", join(TMP, "bad.json")).status, 3,
    "--output with JSON must be rejected");
});

test("output paths are deterministic, source-derived, and extension-safe", () => {
  const answersData = JSON.parse(readFileSync(COMPLETE, "utf8"));
  answersData.name = `" onmouseover="alert(1);月光|نور`;
  const answers = write("elf-druid.answers.json", answersData);
  const built = cli("build", answers);
  assert.equal(built.status, 0, built.stderr);
  assert.equal(built.stdout.trim(), `sheet: ${join(TMP, "elf-druid.sheet.en.html")}`);
  assert.ok(existsSync(join(TMP, "elf-druid.sheet.en.html")));
  assert.ok(!built.stdout.includes("onmouseover"), "the character name must never determine the output path");

  const model = join(TMP, "elf-druid.character.json");
  cpSync(join(ROOT, "examples", "elf-druid.character.json"), model);
  const audited = cli("check", model, "--format", "html");
  assert.equal(audited.status, 0, audited.stderr);
  assert.equal(audited.stdout.trim(), `audit: ${join(TMP, "elf-druid.audit.en.html")}`);

  const markdown = join(TMP, "nested", "custom.md");
  const md = cli("build", answers, "--format", "markdown", "--output", markdown);
  assert.equal(md.status, 0, md.stderr);
  assert.ok(existsSync(markdown), "--output must create requested parent directories");
  assert.match(md.stdout, /^# /m, "Markdown remains the complete stdout payload");

  assert.equal(cli("build", answers, "--format", "html", "--output", join(TMP, "wrong.md")).status, 3);
  assert.equal(cli("build", answers, "--format", "markdown", "--output", answers).status, 3);
});

test("every offered spellcasting-ability option actually computes", () => {
  // The catalog once offered French ids (`sag`) while the engine computed on
  // English ones, so choosing an offered option yielded `DC NaN / atk NaN`.
  const answers = JSON.parse(cli("options", join(ROOT, "examples", "elf-druid.answers.json")).stdout);
  assert.equal(answers.ready, true);
  const built = cli("build", join(ROOT, "examples", "elf-druid.answers.json"), "--format", "json");
  assert.equal(built.status, 0);
  assert.doesNotMatch(built.stdout, /NaN/, "no derived value may render as NaN");
  assert.doesNotMatch(built.stdout, /undefined/, "no derived value may render as undefined");
});

test("check rejects an answers file instead of crashing", () => {
  const r = cli("check", COMPLETE);
  assert.equal(r.status, 3);
  assert.match(r.stderr, /not a character model/);
  assert.doesNotMatch(r.stderr, /at readJSON|TypeError/, "no stack trace should reach the agent");
});

/* `doctor` exists so dnd-help can report the installation instead of asserting
   it from prose. Prose counts drifted before — the skill's own family table
   omitted a sibling for a whole commit — so these pin the numbers to the data. */
test("doctor reports a healthy tree and exits 0", () => {
  const r = cli("doctor");
  assert.equal(r.status, 0);
  assert.match(r.stdout, /the rules bundle is installed and readable/);
});

test("doctor's counts equal the catalog's real lengths", () => {
  const r = JSON.parse(cli("doctor", "--json").stdout);
  const real = (f) => {
    const j = JSON.parse(readFileSync(join(ROOT, "data", f), "utf8"));
    return Array.isArray(j) ? j.length : Object.keys(j).length;
  };
  for (const [name, file] of [["classes", "classes.json"], ["species", "species.json"],
    ["backgrounds", "backgrounds.json"], ["feats", "feats.json"], ["spells", "spells.json"]]) {
    assert.equal(r.counts[name], real(file), `doctor's ${name} count drifted from data/${file}`);
  }
});

/* The check above recomputes with `Object.keys(j).length` — the same expression
   doctor used — so it could not notice that for a *grouped* file that counts the
   groups: doctor reported "3 languages" for 19 and "6 equipment" for 131, and
   dnd-help is instructed to quote those numbers to the user. A tautological test
   is worse than none, so these two count the entries independently. */
test("doctor counts entries, not top-level groups, in grouped catalog files", () => {
  const r = JSON.parse(cli("doctor", "--json").stdout);
  const read = (f) => JSON.parse(readFileSync(join(ROOT, "data", f), "utf8"));

  const lang = read("languages.json");
  assert.equal(r.counts.languages, lang.courantes.length + lang.rares.length);
  assert.ok(r.counts.languages > 15, `expected every language, got ${r.counts.languages}`);

  const eq = read("equipment.json");
  const items = ["weapons", "armors", "tools", "packs", "gear"]
    .reduce((n, k) => n + eq[k].length, 0);
  assert.equal(r.counts.equipment, items);
  assert.ok(r.counts.equipment > 100, `expected every item, got ${r.counts.equipment}`);
});

test("doctor does not warn about English label groups that have a hardcoded fallback", () => {
  // `abil()` in engine/cli.mjs carries ABILITY_EN, so labels.en.json needing no
  // `abilities` group is not a defect. Reporting it printed the nonsense "those
  // names fall back to English" against the English labels themselves, and kept
  // `en` out of "display languages complete".
  const r = cli("doctor");
  assert.doesNotMatch(r.stdout, /labels\.en\.json has no abilities group/);
  assert.match(r.stdout, /display languages complete:.*\ben\b/);
});

/* Exit 2 is what every skill body gates its no-engine fallback on. It used to
   also mean "unknown command" and "unhandled exception", so `option` for
   `options` — one missing character — told the agent the rules bundle was gone
   and it was free to answer from memory. */
test("a mistyped command exits 3 (usage), never 2 (bundle missing)", () => {
  const r = cli("option", "whatever.json");
  assert.equal(r.status, 3, "a typo must not be indistinguishable from a missing bundle");
  assert.match(r.stderr, /unknown command "option"/);
  assert.match(r.stderr, /Legal commands:.*options.*doctor/);
});

/* The gate each skill runs before trusting code execution must actually touch
   the catalog. `--help` prints a constant and exits 0 with nothing installed —
   as a gate it certifies a broken install as working. */
test("--help exits 0 without an engine, so it cannot be the install gate", () => {
  const bare = mkdtempSync(join(tmpdir(), "dnd-bare-"));
  cpSync(join(ROOT, "skills", "dnd-build"), join(bare, "dnd-build"), { recursive: true });
  const shim = join(bare, "dnd-build", "scripts", "dnd.mjs");
  const run = (...a) => spawnSync(process.execPath, [shim, ...a], { encoding: "utf8" });

  assert.equal(run("--help").status, 0, "--help must stay a free-standing usage print");
  assert.equal(run("doctor").status, 2, "doctor is the gate: it must fail when the bundle is gone");

  for (const name of ["dnd-build", "dnd-check", "dnd-optimize"]) {
    const body = readFileSync(join(ROOT, "skills", name, "SKILL.md"), "utf8");
    assert.match(body, /^node scripts\/dnd\.mjs doctor$/m, `${name} must gate on doctor`);
    assert.doesNotMatch(body, /^node scripts\/dnd\.mjs --help$/m,
      `${name} still gates on --help, which passes with no bundle installed`);
  }
});

test("dnd-help tells the agent to run something, not just read", () => {
  // The point of keeping this skill: it must supply what the agent cannot get
  // from the four sibling descriptions it already holds in context.
  const body = readFileSync(join(ROOT, "skills", "dnd-help", "SKILL.md"), "utf8");
  assert.match(body, /node scripts\/dnd\.mjs doctor/, "dnd-help must invoke the diagnostic");
  assert.doesNotMatch(body, /\/dnd-build|\/dnd-check|\/dnd-lookup|\/dnd-optimize/,
    "slash commands are Claude-Code-only; route by intent instead");

  // The count comparison above guards doctor's arithmetic, not the prose: both
  // sides read the same file. What actually caused the drift was catalog sizes
  // written into the skill body, so keep them out.
  assert.doesNotMatch(body, /\d+\s+(classes|subclasses|species|backgrounds|feats|spells)\b/,
    "catalog counts belong in doctor's output, not in prose that silently rots");
});

test("unreadable input yields one actionable line, not a stack trace", () => {
  const r = cli("options", join(TMP, "does-not-exist.json"));
  assert.equal(r.status, 3);
  assert.match(r.stderr, /cannot read/);
  assert.ok(r.stderr.split("\n").filter(Boolean).length <= 2, `expected a short message, got: ${r.stderr}`);
});

/* A description that promises more than the catalog holds is the failure this
   pack exists to prevent, one level up: the agent triggers, finds nothing, and
   fills the gap from memory. Two such promises shipped —
     - "look up what a spell actually does" (no spell carries effect text)
     - "names resolve in all 9 languages" (feats and conditions have no labels
       in any language, so an English feat name cannot be resolved at all)
   and doctor could not see the second, because it measured each language
   against the union of what some language had. These lock claim to data. */
test("doctor names every entity type that has no labels in any language", () => {
  const r = JSON.parse(cli("doctor", "--json").stdout);
  const labelled = (g) => LANGS_ALL.some((l) => {
    const j = JSON.parse(readFileSync(join(ROOT, "data", `labels.${l}.json`), "utf8"));
    return Object.keys(j).includes(g);
  });
  for (const g of ["feats", "conditions", "spells", "classes", "species", "backgrounds"]) {
    assert.equal(r.unlabelled.includes(g), !labelled(g),
      `doctor disagrees with the label files about "${g}"`);
  }
  // feats and conditions are now labeled in EN and FR (B2 fix); unlabelled is empty.
  // If a new entity type loses all labels, this assertion will catch it.
  assert.deepEqual(r.unlabelled.sort(), []);
});

test("dnd-lookup does not promise spell effect text the catalog lacks", () => {
  const spells = JSON.parse(readFileSync(join(ROOT, "data", "spells.json"), "utf8"));
  const list = Array.isArray(spells) ? spells : Object.values(spells);
  const hasText = list.some((s) =>
    ["description", "desc", "text", "effect", "effects", "summary"].some((k) => s[k]));
  assert.equal(hasText, false, "spells gained text — relax dnd-lookup's Manquant documentaire rule");

  const body = readFileSync(join(ROOT, "skills", "dnd-lookup", "SKILL.md"), "utf8");
  assert.match(body, /no effect text exists/,
    "the body must tell the agent a spell's effect is not in the catalog");
  // Match across the wrap without pinning the line ending: Windows checkouts are
  // CRLF, so a literal \n here passes on Linux and fails in CI.
  assert.match(body, /no group for equipment or\s+languages/,
    "the body must say which entity names cannot be resolved across languages");
});

/* The first turn with a beginner used to have no cheap grounded source: the
   options payload carried {id, name} only, and the skill body sent the agent to
   data/classes.json (46161 characters, not shipped inside the skill folder) for
   a one-line description. In practice that turn came from memory. Each identity
   option now carries facts copied from its catalog entry. */
test("class, species and background options carry facts copied from the catalog", () => {
  const f = write("empty-for-facts.json", {});
  const res = JSON.parse(cli("options", f).stdout);
  const step = (id) => res.fixedPending.find((c) => c.id === id);

  for (const [nodeId, file] of [["class", "classes.json"], ["species", "species.json"],
    ["background", "backgrounds.json"]]) {
    const s = step(nodeId);
    assert.ok(s && s.options.length, `${nodeId} step missing`);
    const raw = JSON.parse(readFileSync(join(ROOT, "data", file), "utf8"));
    const entries = Array.isArray(raw) ? raw : Object.values(raw);
    for (const o of s.options) {
      const entry = entries.find((e) => e.id === o.id);
      assert.ok(o.facts, `${nodeId} option ${o.id} has no facts`);
      // Read the expected values straight off the entry, field by field —
      // recomputing them the way the code does is what made the doctor count
      // test unable to fail.
      assert.equal(o.facts.ref, entry.ref);
      assert.equal(o.facts.source, entry.source);
    }
  }

  const cls = step("class");
  const fighter = cls.options.find((o) => o.id === "fighter").facts;
  assert.equal(fighter.hitDie, 10);
  assert.deepEqual(fighter.savingThrows, ["str", "con"]);
  assert.ok(fighter.armorTraining.includes("lourde"), "fighter trains in heavy armour");
  assert.equal(fighter.shieldTraining, true);
  assert.equal(fighter.spellcastingAbility, null, "a fighter casts nothing at level 1");
  assert.equal(fighter.subclassLevel, 3);

  const wizard = cls.options.find((o) => o.id === "wizard").facts;
  assert.equal(wizard.spellcastingAbility, "int");

  // Cheaper than the file it replaces, by an order of magnitude, or it is not
  // worth carrying on every call.
  const stepChars = JSON.stringify(cls).length;
  const fileChars = readFileSync(join(ROOT, "data", "classes.json"), "utf8").length;
  assert.ok(stepChars < fileChars / 5,
    `class step is ${stepChars} chars against ${fileChars} for data/classes.json`);
});

test("--brief still carries no facts, and non-catalog steps never gain them", () => {
  const f = write("empty-for-brief.json", {});
  const brief = JSON.parse(cli("options", f, "--brief").stdout);
  assert.doesNotMatch(JSON.stringify(brief), /"facts"/, "--brief must stay a bare map");

  const res = JSON.parse(cli("options", f).stdout);
  // `method` draws from a literal list, not a catalog, so there is nothing to cite.
  const method = res.fixedPending.find((c) => c.id === "method");
  assert.ok(method.options.every((o) => !o.facts), "method options must stay bare");
});

/* Round-3 adversarial review. Each of these reproduces a defect that shipped in
   the previous two commits — the remediation's own regressions. */

test("the shim refuses a stranger's engine/cli.mjs", () => {
  // `engine/` + `data/` is a generic pairing. Probing for it alone meant a skill
  // folder dropped into any project with both would spawn that project's script
  // with the skill's arguments and forward its exit code as a rules answer — and
  // exit 0 satisfies the install gate every skill body defines.
  const root = mkdtempSync(join(tmpdir(), "dnd-hijack-"));
  mkdirSync(join(root, "engine"), { recursive: true });
  mkdirSync(join(root, "data"), { recursive: true });
  writeFileSync(join(root, "engine", "cli.mjs"), 'console.log("NOT THE ENGINE");process.exit(0);');
  writeFileSync(join(root, "data", "whatever.json"), "{}");
  cpSync(join(ROOT, "skills", "dnd-build"), join(root, "skills", "dnd-build"), { recursive: true });

  const r = spawnSync(process.execPath,
    [join(root, "skills", "dnd-build", "scripts", "dnd.mjs"), "doctor"], { encoding: "utf8" });
  assert.equal(r.status, 2, "a foreign engine/ + data/ pair must not be accepted as the bundle");
  assert.doesNotMatch(r.stdout, /NOT THE ENGINE/, "the stranger's script must never be spawned");

  // …and the real layouts must still resolve.
  const real = spawnSync(process.execPath,
    [join(ROOT, "skills", "dnd-build", "scripts", "dnd.mjs"), "doctor"], { encoding: "utf8" });
  assert.equal(real.status, 0, "the checkout's own layout must still resolve");
});

test("a mistyped flag is refused, not silently dropped", () => {
  // `build --jsonn` used to print a markdown sheet and exit 0, so an agent that
  // asked for JSON got prose with nothing to tell it why.
  const r = cli("build", COMPLETE, "--jsonn");
  assert.equal(r.status, 3);
  assert.match(r.stderr, /unknown flag "--jsonn"/);
  assert.match(r.stderr, /Legal flags:.*--json/);
  assert.equal(cli("build", COMPLETE, "--json").status, 0, "the real flag must still work");
});

test("check does not report a legal SRD sheet as a documentary gap", () => {
  // Source ids are derived from the FRENCH name (`clerc-1`) while catalog ids are
  // English slugs (`cleric`), so matching on the id alone flagged every correctly
  // built character — including both shipped under docs/characters/.
  for (const f of ["dwarf-fighter", "elf-druid"]) {
    const r = cli("check", join(ROOT, "examples", `${f}.character.json`));
    assert.doesNotMatch(r.stderr, /Manquant documentaire/,
      `${f} is a legal shipped character and must not be reported as a catalog gap`);
    assert.equal(r.status, 0, `${f} must audit clean`);
  }
});

test("check surfaces a catalog gap in --json and in its exit code", () => {
  // The gap was written to stderr only, so an agent capturing stdout — which is
  // what --json is for — saw `problems: []` on a sheet carrying a foreign feat.
  const model = JSON.parse(readFileSync(join(ROOT, "examples", "dwarf-fighter.character.json"), "utf8"));
  model.sources.push({ id: "lucky-pathfinder-only", kind: "feat", label: "Lucky", effects: [] });
  const f = write("foreign-feat.character.json", model);
  const r = cli("check", f, "--json");
  assert.equal(r.status, 1, "a sheet naming an entity the catalog lacks must not exit 0");
  const out = JSON.parse(r.stdout);
  assert.ok(out.catalogGaps.some((g) => g.includes("lucky-pathfinder-only")),
    `the gap must appear in the JSON payload, got ${JSON.stringify(out.catalogGaps)}`);
});

test("a partial catalog is not reported as a missing bundle", () => {
  // Exit 2 is what the bodies gate their no-engine path on, and they justify it by
  // "data/ was only just proven absent". With 22 of 23 files readable that is false.
  const root = mkdtempSync(join(tmpdir(), "dnd-partial-"));
  cpSync(join(ROOT, "engine"), join(root, "engine"), { recursive: true });
  cpSync(join(ROOT, "data"), join(root, "data"), { recursive: true });
  rmSync(join(root, "data", "feats.json"));
  const r = spawnSync(process.execPath, [join(root, "engine", "cli.mjs"), "doctor"], { encoding: "utf8" });
  assert.equal(r.status, 1, "one missing catalog file is a degraded install, not an absent one");
  assert.match(r.stdout, /feats\.json/);
});

test("species facts carry the choices that distinguish them", () => {
  // Five of ten species have an empty effects[] because what defines them is a
  // CHOICE. Reporting effects[] only handed the agent "darkvision, and nothing
  // else" for the species a beginner names first.
  const res = JSON.parse(cli("options", write("empty-species.json", {})).stdout);
  const species = res.fixedPending.find((c) => c.id === "species");
  const raw = JSON.parse(readFileSync(join(ROOT, "data", "species.json"), "utf8"));
  const entries = Array.isArray(raw) ? raw : Object.values(raw);

  for (const o of species.options) {
    const entry = entries.find((e) => e.id === o.id);
    assert.equal(o.facts.choices.length, (entry.choices || []).length,
      `${o.id} drops ${(entry.choices || []).length} catalog choice(s) from its facts`);
    const substance = o.facts.features.length + o.facts.choices.length +
      o.facts.senses.length + o.facts.lineages.length;
    assert.ok(substance > 0, `${o.id} facts are empty — nothing to describe it from but memory`);
  }
  const dragonborn = species.options.find((o) => o.id === "dragonborn").facts;
  assert.ok(dragonborn.choices[0].options.length >= 10,
    "a Dragonborn's draconic ancestry must be visible, not just its darkvision");
});

/* The pack defines "legal" as "0 sheet-lint errors" — dnd-build ("Require 0
   sheet-lint errors"), dnd-optimize ("B is rules-legal — it builds with 0
   sheet-lint errors"). That definition was false: the linter checked derived
   arithmetic and the FLOOR of each quota, and never checked that a spell was on
   the list it was filed under. A level-1 Cleric with four Wizard-only cantrips
   under `list: "cleric"` linted clean and exited 0. */
const shipped = (name) =>
  JSON.parse(readFileSync(join(ROOT, "examples", `${name}.character.json`), "utf8"));

test("a spell filed under a class list it is not on is a hard error", () => {
  const m = shipped("elf-druid");
  const wizardOnly = ["fire-bolt", "ray-of-frost", "shocking-grasp", "acid-splash"];
  let i = 0;
  for (const c of m.spells.cantrips) {
    if (c.origin === "chosen" && c.list === "druid" && i < wizardOnly.length) c.id = wizardOnly[i++];
  }
  assert.ok(i > 0, "fixture must actually swap chosen druid cantrips");

  const r = cli("check", write("offlist.character.json", m));
  assert.equal(r.status, 1, "wizard cantrips on the cleric list must not lint clean");
  assert.match(r.stdout, /absent from the druid spell list/);
  assert.match(r.stdout, /spells-by-class\.json/, "the finding must cite where it was checked");
});

test("the shipped SRD artefacts still lint clean", () => {
  // The check above is the kind that has three times rejected legitimate data.
  // These four are the guard against over-strictness, not decoration.
  for (const n of ["dragonborn-partial", "dwarf-fighter", "elf-druid"]) {
    assert.equal(cli("check", join(ROOT, "examples", `${n}.character.json`)).status, 0,
      `${n} is a legal shipped character`);
  }
  for (const n of ["dwarf-fighter", "elf-druid"]) {
    assert.equal(cli("build", join(ROOT, "examples", `${n}.answers.json`), "--format", "json").status, 0,
      `${n} is a legal shipped build`);
  }
});

test("a list with no quota is reported, and a granted spell is not blamed for it", () => {
  // Counting only quota'd lists made a chosen pick on an unquota'd list invisible.
  // But an unquota'd list is not automatically illegal — Magic Initiate authorises
  // its picks through a choice's `count`, not a `*Slots` grant — so this is a named
  // warning, never a false error.
  const m = shipped("elf-druid");
  m.spells.cantrips.push({ id: "guidance", label: "Guidance", list: "no-such-list", origin: "chosen" });
  const r = cli("check", write("unquota.character.json", m));
  assert.match(r.stdout, /No declared quota:/, "an unaccounted pick must be surfaced");
  assert.match(r.stdout, /no-such-list/, "and the list must be named");

  // A species-granted cantrip carries no quota by design and must stay silent.
  const clean = cli("check", join(ROOT, "examples", "elf-druid.character.json"));
  assert.equal(clean.status, 0);
  assert.doesNotMatch(clean.stdout, /aucun quota declare pour[^\n]*espece/,
    "granted species cantrips are justified by their grant, not by a quota");
});

test("over-filling a required choice is an error, not just under-filling", () => {
  // The floor was enforced (exit 1, "choices still pending"); the ceiling never
  // was, so extra picks put illegal proficiencies on the sheet under a clean lint.
  const m = shipped("dwarf-fighter");
  const one = m.choices.find((c) => c.satisfies);
  const kind = one.satisfies;
  const before = m.choices.filter((c) => c.satisfies === kind).length;
  m.choices.push({ ...one, id: `${one.id}-extra-1` }, { ...one, id: `${one.id}-extra-2` });

  const r = cli("check", write("overfilled.character.json", m));
  assert.equal(r.status, 1, `over-filling "${kind}" (${before} -> ${before + 2}) must fail`);
  assert.match(r.stdout, /overfilled/);
});
