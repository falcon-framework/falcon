import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html"]],
  use: {
    browserName: "chromium",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    headless: true,
  },
  globalSetup: "./e2e/global-setup.ts",
  webServer: [
    {
      command: "bun --cwd packages/infra --watch --env-file ./.env ./alchemy.run.ts --dev",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command: "bun run --cwd apps/demo-01 dev",
      url: "http://localhost:3010/sign-in",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "bun run --cwd apps/demo-02 dev",
      url: "http://localhost:3011/sign-in",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
