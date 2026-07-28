/* ==========================================================================
   check-skills-spec.mjs — every skill obeys the Agent Skills specification.

   The pack is distributed to any skills-compatible agent, so every
   `skills/<name>/SKILL.md` must satisfy the open spec
   (https://agentskills.io/specification), not just whatever the current host
   tolerates. This guard enforces:

     1. `name` matches the parent directory, <=64 chars, lowercase alnum +
        single internal hyphens.
     2. `description` is non-empty and <=1024 characters — a hard spec limit;
        agents truncate or reject past it, which silently breaks triggering.
     3. `compatibility` <=500 characters when present.
     4. Frontmatter carries ONLY spec keys. Anything else belongs in `metadata`.
     5. `metadata` is a flat map of string -> string.
     6. The body never escapes the skill directory (`../`). A skill folder is
        the unit of distribution: reach outside it and a client that copies just
        that folder ships a broken skill.

   Exit non-zero on any violation.
   Run: node scripts/check-skills-spec.mjs
   ========================================================================== */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = join(ROOT, "skills");

/* Spec-defined frontmatter keys. `name` and `description` are required. */
const SPEC_KEYS = new Set(["name", "description", "license", "compatibility", "metadata", "allowed-tools"]);
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/* ---- minimal YAML frontmatter reader -------------------------------------
   Deliberately narrow: scalars, folded (`>`) blocks, inline flow sequences and
   one level of nested mapping. Anything richer is rejected rather than guessed
   at, so a silently mis-parsed field can never pass as valid. */
function parseFrontmatter(text, errors) {
  const m = text.match(/^---\n([\s\S]*?)\n---(\n|$)/);
  if (!m) { errors.push("no YAML frontmatter delimited by ---"); return null; }

  const lines = m[1].split("\n");
  const out = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trimStart().startsWith("#")) { i++; continue; }
    if (/^\s/.test(line)) { errors.push(`unexpected indented line in frontmatter: ${line.trim()}`); return null; }

    const kv = line.match(/^([^:]+):\s?(.*)$/);
    if (!kv) { errors.push(`cannot parse frontmatter line: ${line}`); return null; }
    const key = kv[1].trim();
    const rest = kv[2];
    i++;

    if (rest === ">" || rest === ">-" || rest === "|" || rest === "|-") {
      // Folded / literal block: consume the indented continuation.
      const block = [];
      while (i < lines.length && (/^\s+\S/.test(lines[i]) || !lines[i].trim())) { block.push(lines[i]); i++; }
      // YAML chomping: `>` and `|` (clip) keep exactly one trailing newline in
      // the resolved scalar; `>-` and `|-` (strip) keep none. That newline
      // counts against the 1024-character limit, so a description measured
      // without it reads one char short of what a real YAML parser sees.
      const joiner = rest.startsWith(">") ? " " : "\n";
      const folded = block.map((l) => l.trim()).join(joiner).trim();
      out[key] = rest.endsWith("-") ? folded : folded + "\n";
    } else if (rest === "") {
      // Nested mapping.
      const map = {};
      while (i < lines.length && /^\s+\S/.test(lines[i])) {
        const sub = lines[i].match(/^\s+([^:]+):\s?(.*)$/);
        if (!sub) { errors.push(`cannot parse nested line: ${lines[i]}`); return null; }
        map[sub[1].trim()] = unquote(sub[2].trim());
        i++;
      }
      out[key] = map;
    } else if (rest.startsWith("[")) {
      out[key] = rest.slice(1, rest.lastIndexOf("]")).split(",").map((s) => unquote(s.trim())).filter(Boolean);
    } else {
      out[key] = unquote(rest.trim());
    }
  }
  return out;
}

const unquote = (s) => (/^"(.*)"$/.test(s) || /^'(.*)'$/.test(s) ? s.slice(1, -1) : s);

/* ---- checks ------------------------------------------------------------- */
function checkSkill(dir) {
  const errors = [];
  const file = join(SKILLS_DIR, dir, "SKILL.md");
  if (!existsSync(file)) return [`${dir}/SKILL.md is missing`];

  const text = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const fm = parseFrontmatter(text, errors);
  if (!fm) return errors.map((e) => `${dir}: ${e}`);

  // 1. name
  if (!fm.name) errors.push("frontmatter is missing the required `name`");
  else {
    if (fm.name !== dir) errors.push(`name "${fm.name}" does not match its directory "${dir}"`);
    if (fm.name.length > 64) errors.push(`name is ${fm.name.length} chars (spec max 64)`);
    if (!NAME_RE.test(fm.name)) errors.push(`name "${fm.name}" must be lowercase alphanumerics separated by single hyphens`);
  }

  // 2. description
  if (!fm.description) errors.push("frontmatter is missing the required `description`");
  else if (fm.description.length > 1024) errors.push(`description is ${fm.description.length} chars (spec max 1024)`);

  // 3. compatibility
  if (fm.compatibility && fm.compatibility.length > 500) {
    errors.push(`compatibility is ${fm.compatibility.length} chars (spec max 500)`);
  }

  // 4. no keys outside the spec
  for (const key of Object.keys(fm)) {
    if (!SPEC_KEYS.has(key)) errors.push(`frontmatter key "${key}" is not in the spec — move it under \`metadata\``);
  }

  // 4b. allowed-tools is a SPACE-SEPARATED string, so no token may contain a
  //     space of its own: `Bash(node *)` parses as `Bash(node` plus `*)`.
  //     The spec's own example is `Bash(git:*) Bash(jq:*) Read`.
  if (fm["allowed-tools"]) {
    for (const token of String(fm["allowed-tools"]).split(/\s+/).filter(Boolean)) {
      const open = (token.match(/\(/g) || []).length;
      const close = (token.match(/\)/g) || []).length;
      if (open !== close) {
        errors.push(`allowed-tools token "${token}" has unbalanced parentheses — an inner space splits it into two tokens`);
      }
    }
  }

  // 5. metadata shape
  if (fm.metadata !== undefined) {
    if (typeof fm.metadata !== "object" || Array.isArray(fm.metadata)) errors.push("metadata must be a mapping");
    else for (const [k, v] of Object.entries(fm.metadata)) {
      if (typeof v !== "string") errors.push(`metadata.${k} must be a string value`);
    }
  }

  // 6. the body stays inside the skill directory. Catch `../` anywhere in a
  //    path-like token, not just at its start: `$CLAUDE_SKILL_DIR/../../engine`
  //    escapes just as surely as `../../engine`.
  const body = text.slice(text.indexOf("\n---", 3) + 4);
  const escapes = new Set();
  for (const ref of body.matchAll(/[^\s)\]"'`]*\.\.\/[^\s)\]"'`]*/g)) escapes.add(ref[0].replace(/^[([]+/, ""));
  for (const ref of escapes) {
    errors.push(`body escapes the skill directory: ${ref} — a skill folder must be self-contained`);
  }

  // 7. Every relative link resolves. A dead `references/…` link silently breaks
  //    progressive disclosure: the skill tells the agent to read a missing file.
  for (const link of body.matchAll(/\]\((?!https?:|#|\/)([^)\s#]+)/g)) {
    const target = link[1];
    if (target.startsWith("..")) continue; // already reported as an escape
    if (!existsSync(join(SKILLS_DIR, dir, target))) {
      errors.push(`dead link: ${target} does not exist in the skill folder`);
    }
  }

  // 8. The same two scans over references/. They are loaded at exactly the
  //    moment progressive disclosure intends, so a dead path there sends the
  //    agent after a file the skill does not ship — and the SKILL.md-only scan
  //    could not see it.
  const refDir = join(SKILLS_DIR, dir, "references");
  if (existsSync(refDir)) {
    for (const rf of readdirSync(refDir).filter((f) => f.endsWith(".md"))) {
      const text = readFileSync(join(refDir, rf), "utf8").replace(/\r\n/g, "\n");
      const body = text.replace(/^<!-- GENERATED[\s\S]*?-->\n/, ""); // the banner may name its source
      for (const m of body.matchAll(/[^\s)\]"'`]*\.\.\/[^\s)\]"'`]*/g)) {
        errors.push(`references/${rf} escapes the skill directory: ${m[0].replace(/^[([]+/, "")}`);
      }
      for (const m of body.matchAll(/\]\((?!https?:|#|\/)([^)\s#]+)/g)) {
        if (!existsSync(join(SKILLS_DIR, dir, "references", m[1])) && !existsSync(join(SKILLS_DIR, dir, m[1]))) {
          errors.push(`references/${rf} has a dead link: ${m[1]}`);
        }
      }
      // A reference must not send the agent to a repo path it cannot reach.
      for (const bad of ["engine/cli.mjs", "rules/schema.md", "rules/grounding.md"]) {
        if (body.includes(bad)) errors.push(`references/${rf} names "${bad}", which does not exist inside a skill folder`);
      }
    }
  }

  return errors.map((e) => `${dir}: ${e}`);
}

/* ---- main --------------------------------------------------------------- */
const dirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

if (dirs.length === 0) {
  console.error("check-skills-spec: no skills found under skills/");
  process.exit(1);
}

/* Rosters written by hand always drift: the README badge said four skills for a
   whole release while five shipped, install.mjs named four, the slash command
   named three, and `npm test`'s comment listed a `scorer` suite that has never
   existed. Anything that enumerates the pack is checked against the disk. */
function checkRosters() {
  const errs = [];
  const read = (f) => { try { return readFileSync(join(ROOT, f), "utf8"); } catch { return null; } };
  const short = dirs.map((d) => d.replace(/^dnd-/, ""));

  for (const [file, label] of [["README.md", "skills"], ["README.fr.md", "skills"]]) {
    const src = read(file);
    if (src == null) continue;
    const m = src.match(/!\[skills\s*:?\s*(\d+)\]\(([^)]*)\)/);
    if (!m) { errs.push(`${file}: no skills badge found`); continue; }
    if (Number(m[1]) !== dirs.length) errs.push(`${file}: badge says ${m[1]} skills, skills/ has ${dirs.length}`);
    for (const name of short) {
      if (!m[2].includes(name)) errs.push(`${file}: badge omits "${name}"`);
    }
  }

  const tests = readdirSync(join(ROOT, "tests")).filter((f) => f.endsWith(".test.mjs"))
    .map((f) => f.replace(/\.test\.mjs$/, "")).sort();
  for (const file of ["README.md", "README.fr.md"]) {
    const src = read(file);
    if (src == null) continue;
    const line = src.split("\n").find((l) => l.startsWith("npm test"));
    if (!line) continue;
    for (const t of tests) {
      if (!line.includes(t)) errs.push(`${file}: "npm test" comment omits tests/${t}.test.mjs`);
    }
    // Public exports intentionally omit private-source-only tests, so the
    // committed roster may be a documented superset of the exported suite.
  }

  const cmd = read("commands/dnd-help.md");
  if (cmd) for (const d of dirs) {
    if (!cmd.includes(d)) errs.push(`commands/dnd-help.md: omits ${d}`);
  }

  // Prose "N skills" text in README files. Hand-written counts drift when a skill
  // is added or removed; the guard derives the correct number from the disk.
  const EN_NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };
  const FR_NUM = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, sept: 7, huit: 8, neuf: 9 };
  // [1-9]\d? matches 1–99; `\d+` would also match years like "2024 skill-spec".
  const ALL_WORDS = new RegExp(
    `\\b(${[...Object.keys(EN_NUM), ...Object.keys(FR_NUM), "[1-9]\\d?"].join("|")})\\s+skills?\\b`, "gi"
  );
  for (const file of ["README.md", "README.fr.md"]) {
    const src = read(file);
    if (src == null) continue;
    for (const m of src.matchAll(ALL_WORDS)) {
      const word = m[1].toLowerCase();
      const n = EN_NUM[word] ?? FR_NUM[word] ?? Number(word);
      if (!isNaN(n) && n !== dirs.length) {
        errs.push(`${file}: "${m[0].trim()}" names ${n} skill(s), but skills/ has ${dirs.length}`);
      }
    }
  }

  // plugin.json (generated) must name every skill. The descriptions are the only
  // human-readable roster an agent browsing the marketplace sees — a missing skill
  // is invisible to anyone who did not clone the repo.
  const pluginSrc = read(".claude-plugin/plugin.json");
  if (pluginSrc) {
    try {
      const plugin = JSON.parse(pluginSrc);
      const desc = (plugin.description || "").toLowerCase();
      for (const name of dirs) {
        const readable = name.replaceAll("-", " ");
        if (plugin.name !== name && !desc.includes(name) && !desc.includes(readable)) {
          errs.push(`.claude-plugin/plugin.json: name/description omits "${name}"`);
        }
      }
    } catch { errs.push(".claude-plugin/plugin.json: invalid JSON"); }
  }

  // PLATFORMS.md must not claim support for a host whose adapter file is missing.
  // Extract every backtick-quoted token from table rows and verify each concrete
  // file path (no wildcards, not a directory) exists on disk.
  const platforms = read("PLATFORMS.md");
  if (platforms) {
    for (const line of platforms.split("\n")) {
      if (!line.startsWith("|") || line.startsWith("| Host") || line.startsWith("|---")) continue;
      for (const m of line.matchAll(/`([^`*]+)`/g)) {
        const p = m[1].trim();
        if (!p.endsWith("/") && !p.includes("*") && p.includes("/")) {
          if (!existsSync(join(ROOT, p))) errs.push(`PLATFORMS.md: claims "${p}" but the file does not exist`);
        }
      }
    }
  }

  return errs;
}

const failures = [...dirs.flatMap(checkSkill), ...checkRosters()];
for (const f of failures) console.error(`SPEC: ${f}`);

if (failures.length) {
  console.error(`\ncheck-skills-spec: ${failures.length} violation(s). See https://agentskills.io/specification`);
  process.exit(1);
}
console.log(`check-skills-spec: ${dirs.length} skills conform to the Agent Skills spec (${dirs.join(", ")}).`);
process.exit(0);
