import { test, expect } from "@playwright/test";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CLI = join(ROOT, "engine", "cli.mjs");

function buildStandalone(example, lang) {
  const directory = mkdtempSync(join(tmpdir(), "dnd-browser-"));
  const input = join(directory, `${example}.answers.json`);
  cpSync(join(ROOT, "examples", `${example}.answers.json`), input);
  const built = spawnSync(process.execPath, [
    CLI, "build", input, "--format", "html", "--lang", lang,
  ], { encoding: "utf8" });
  if (built.status !== 0) {
    rmSync(directory, { recursive: true, force: true });
    throw new Error(`build failed (${built.status}):\n${built.stderr}`);
  }
  return {
    directory,
    output: built.stdout.trim().replace(/^sheet:\s*/, ""),
  };
}

for (const [lang, direction] of [["en", "ltr"], ["ar", "rtl"]]) {
  test(`standalone ${lang} sheet loads without external assets`, async ({ page }) => {
    const artifact = buildStandalone("dwarf-fighter", lang);
    try {
      const externalRequests = [];
      page.on("request", (request) => {
        if (/^https?:/i.test(request.url())) externalRequests.push(request.url());
      });
      await page.goto(pathToFileURL(artifact.output).href);

      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      if (direction === "rtl") await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      else await expect(page.locator("html")).not.toHaveAttribute("dir", "rtl");
      await expect(page.locator("article.sheet")).toBeVisible();
      await expect(page.locator("h1")).toContainText("Thera");
      await expect(page.locator("style")).toHaveCount(1);
      await expect(page.locator("script:not([src])")).toHaveCount(1);
      expect(externalRequests).toEqual([]);

      await page.evaluate(() => {
        window.print = () => { document.documentElement.dataset.printCalled = "yes"; };
      });
      await page.locator("[data-print]").click();
      await expect(page.locator("html")).toHaveAttribute("data-print-called", "yes");
    } finally {
      rmSync(artifact.directory, { recursive: true, force: true });
    }
  });
}

test("warning-only sheet remains visibly unverified in a browser", async ({ page }) => {
  const artifact = buildStandalone("elf-druid", "en");
  try {
    const html = readFileSync(artifact.output, "utf8");
    expect(html).toMatch(/manual verification required/i);
    await page.goto(pathToFileURL(artifact.output).href);
    await expect(page.locator(".callout.warning")).toBeVisible();
    await expect(page.locator('[data-status="warning"]')).not.toHaveCount(0);
    await expect(page.locator(".callout.warning")).toContainText(/0 error/i);
    await expect(page.locator(".callout.warning")).toContainText(/[1-9]\d* warning/i);
  } finally {
    rmSync(artifact.directory, { recursive: true, force: true });
  }
});
