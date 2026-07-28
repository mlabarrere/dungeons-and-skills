/* Golden summaries pin every computed value. HTML is exercised from a temporary
   copy so tests never write generated sheets into docs/ or examples/. */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(ROOT, "engine", "cli.mjs");
const EXAMPLES = join(ROOT, "examples");

const cases = readdirSync(EXAMPLES)
  .filter((f) => f.endsWith(".answers.json"))
  .map((f) => f.replace(".answers.json", ""));
const normalizeHtml = (html) => html
  .replace(/\r\n/g, "\n")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/i, "<style data-golden-assets-removed></style>")
  .replace(/<script\b[^>]*>[\s\S]*<\/script>/i, "<script data-golden-assets-removed></script>")
  .replace(/<code>[^<]*<\/code>/, "<code>[source]</code>")
  .trimEnd();

test("there is at least one golden example", () => {
  assert.ok(cases.length > 0, "expected examples/*.answers.json");
});

for (const name of cases) {
  test(`${name}: machine summary matches the committed golden exactly`, () => {
    const produced = execFileSync("node", [
      CLI, "build", join(EXAMPLES, `${name}.answers.json`), "--format", "json",
    ], {
      encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
    });
    const committed = readFileSync(join(EXAMPLES, `${name}.summary.json`), "utf8");
    assert.equal(
      produced.replace(/\r\n/g, "\n").trimEnd(),
      committed.replace(/\r\n/g, "\n").trimEnd(),
      `examples/${name}.summary.json is stale — inspect every value before regenerating`,
    );
  });

  test(`${name}: standalone html is portable and reports the complete lint state`, () => {
    const dir = mkdtempSync(join(tmpdir(), `dnd-golden-${name}-`));
    try {
      const source = join(dir, `${name}.answers.json`);
      cpSync(join(EXAMPLES, `${name}.answers.json`), source);
      const stdout = execFileSync("node", [CLI, "build", source, "--lang", "en"], {
        encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
      });
      const htmlPath = stdout.trim().replace(/^sheet:\s*/, "");
      assert.equal(htmlPath, join(dir, `${name}.sheet.en.html`));
      const html = readFileSync(htmlPath, "utf8");

      assert.match(html, /<html lang="en"/, "wrong document language");
      assert.match(html, /<article class="sheet"/, "missing sheet article");
      assert.match(html, /class="score-grid"/, "missing score grid");
      assert.match(html, /<style\b[^>]*>[\s\S]+<\/style>/, "CSS is not embedded");
      assert.match(html, /<script\b[^>]*>[\s\S]+<\/script>/, "JS is not embedded");
      assert.doesNotMatch(html, /NaN|undefined/, "a derived value rendered as NaN or undefined");
      assert.match(html, /sheet-lint:\s*0 error(?:s|\(s\))/i, "rules errors present in sheet");
      if (name === "elf-druid") {
        assert.match(html, /manual verification required/i, "warnings must not be hidden");
        assert.match(html, /data-status="warning"/, "unverified counters need a warning badge");
        assert.doesNotMatch(html, /data-status="conflict"[^>]*>exceeded/i,
          "a list without a declared quota is not an exceeded quota");
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}

for (const name of ["dwarf-fighter", "elf-druid"]) {
  for (const lang of ["en", "fr"]) {
    test(`${name}: normalized ${lang} HTML matches the committed content golden`, () => {
      const dir = mkdtempSync(join(tmpdir(), `dnd-html-content-${name}-`));
      try {
        const source = join(dir, `${name}.answers.json`);
        cpSync(join(EXAMPLES, `${name}.answers.json`), source);
        const stdout = execFileSync("node", [
          CLI, "build", source, "--format", "html", "--lang", lang,
        ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
        const html = normalizeHtml(readFileSync(stdout.trim().replace(/^sheet:\s*/, ""), "utf8"));
        const golden = readFileSync(
          join(EXAMPLES, `${name}.sheet.${lang}.normalized.html`), "utf8",
        ).replace(/\r\n/g, "\n").trimEnd();
        assert.equal(html, golden);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  }
}
