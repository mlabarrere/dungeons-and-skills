/* ==========================================================================
   build-adapters.mjs — generate thin per-platform adapters from ONE source.

   The canonical rule text is the `dnd-builder` section of AGENTS.md. This script
   copies that body verbatim into each host's native rule format (adding only the
   per-host frontmatter a given tool requires), and writes the Claude plugin
   manifests. Keep adapters thin: they never diverge from AGENTS.md. Drift is
   caught by scripts/check-rule-copies.mjs.

   Regenerate: node scripts/build-adapters.mjs
   ========================================================================== */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export function canonicalRule() {
  const agents = readFileSync(join(ROOT, "AGENTS.md"), "utf8").replace(/\r\n/g, "\n");
  const m = agents.match(/<!-- BEGIN:dnd-builder -->\n([\s\S]*?)\n<!-- END:dnd-builder -->/);
  if (!m) throw new Error("AGENTS.md: dnd-builder markers not found");
  return m[1].trim();
}

function write(rel, content) {
  const abs = join(ROOT, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content.endsWith("\n") ? content : content + "\n", "utf8");
  return rel;
}

const GENERATED = "<!-- GENERATED from AGENTS.md by scripts/build-adapters.mjs — do not edit. -->\n";

function main() {
  const body = canonicalRule();
  const written = [];

  // Cursor: always-apply project rule (.mdc with frontmatter).
  written.push(write(".cursor/rules/dnd-builder.mdc",
    `---\ndescription: D&D 2024 character builder — grounded in the bundled catalog\nglobs:\nalwaysApply: true\n---\n${GENERATED}${body}\n`));

  // Kiro: steering rule (frontmatter inclusion: always).
  written.push(write(".kiro/steering/dnd-builder.md",
    `---\ninclusion: always\n---\n${GENERATED}${body}\n`));

  // Windsurf / Cline: plain project rule.
  written.push(write(".windsurf/rules/dnd-builder.md", `${GENERATED}${body}\n`));
  written.push(write(".clinerules/dnd-builder.md", `${GENERATED}${body}\n`));

  // GitHub Copilot: repository instruction file.
  written.push(write(".github/copilot-instructions.md", `${GENERATED}${body}\n`));

  // Claude Code plugin manifests (point at skills/ + commands/).
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  const homepage = pkg.homepage || "https://github.com/mlabarrere/dungeons-and-skills";
  const keywords = ["claude-skills", "agent-skills", "dnd", "dnd-2024", "5e", "character-builder", "grounding", "anti-hallucination"];
  written.push(write(".claude-plugin/plugin.json", JSON.stringify({
    name: "dungeons-and-skills",
    version: pkg.version || "0.1.0",
    description: "Build and check rules-accurate D&D 2024 (5.5) characters, grounded in a bundled catalog — never the model's memory.",
    author: { name: pkg.author?.name || "" },
    homepage,
    license: pkg.license || "MIT",
    keywords,
    icon: "./assets/logo.svg",
    skills: "./skills",
    commands: "./commands",
  }, null, 2) + "\n"));
  written.push(write(".claude-plugin/marketplace.json", JSON.stringify({
    name: "dungeons-and-skills",
    owner: { name: pkg.author?.name || "" },
    plugins: [{
      name: "dungeons-and-skills",
      source: "./",
      description: "Dungeons & Skills — grounded D&D 2024 character-builder skills (build, check, lookup, help).",
      homepage,
      license: pkg.license || "MIT",
      keywords,
      icon: "./assets/logo.svg",
    }],
  }, null, 2) + "\n"));

  console.log(`build-adapters: wrote ${written.length} adapter files:\n  ${written.join("\n  ")}`);
}

// Run only when invoked directly, so check-rule-copies.mjs can import canonicalRule().
if (fileURLToPath(import.meta.url) === process.argv[1]) main();
