import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  outputDir: "./output/playwright/results",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [["line"], ["html", { outputFolder: "./output/playwright/report", open: "never" }]]
    : "line",
  use: {
    browserName: "chromium",
    headless: true,
    viewport: { width: 1280, height: 900 },
  },
});
